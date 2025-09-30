/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable max-len */
import { scoped, Lifecycle, inject } from 'tsyringe';
import { Logger } from '../../../common/logger';
import needle from "needle";
import { NeedleService } from '../../needle.service';
import { sendApiButtonService, sendApiInteractiveListService, templateButtonService, watiTemplateButtonService } from '../../whatsappmeta.button.service';
import { translateService } from '../../translate.service';
import { ClientEnvironmentProviderService } from '../../set.client/client.environment.provider.service';
import { Iresponse } from '../../../refactor/interface/message.interface';
import { AssessmentSessionLogs } from '../../../models/assessment.session.model';
import { EntityManagerProvider } from '../../entity.manager.provider.service';
import { commonResponseMessageFormat } from '../../common.response.format.object';
import { platformServiceInterface } from '../../../refactor/interface/platform.interface';
import { ChatMessage } from '../../../models/chat.message.model';
import { CacheMemory } from '../../../services/cache.memory.service';
import { CustomModelResponseFormat } from '../../../services/response.format/custom.model.response.format';
import { sendTelegramButtonService } from '../../../services/telegram.button.service';
import { Helper } from '../../../common/helper';
import { SystemGeneratedMessagesService } from '../../../services/system.generated.message.service';
import { AssessmentIdentifiers } from '../../../models/assessment/assessment.identifiers.model';
import { CountryCodeService } from '../../../utils/phone.number.formatting';
import { UserInfoService } from '../../../services/user.info/user.info.service';

@scoped(Lifecycle.ContainerScoped)
export class ServeAssessmentService {

    private _platformMessageService :  platformServiceInterface = null;

    constructor(
        @inject(NeedleService) private needleService?: NeedleService,
        @inject(translateService) private translate?: translateService,
        @inject(ClientEnvironmentProviderService) private clientEnvironmentProviderService?: ClientEnvironmentProviderService,
        @inject(EntityManagerProvider) private entityManagerProvider?: EntityManagerProvider,
        @inject(SystemGeneratedMessagesService) private systemGeneratedMessageService?: SystemGeneratedMessagesService,
        @inject(CountryCodeService ) private countryCodeService ?:CountryCodeService,
        @inject(UserInfoService) private userInfoService ?: UserInfoService
    ){}

    async startAssessment (platformUserId:any, channel: any, userTaskData: any, assessmentLanguage: string = null) {
        try {

            const userTask = JSON.parse(userTaskData);
            if (!assessmentLanguage) {
                assessmentLanguage = await this.clientEnvironmentProviderService.getClientEnvironmentVariable("DEFAULT_LANGUAGE_CODE");
            }

            // const assessmentId = userTask.Action.Assessment.id;
            const assessmentId = userTask.Action ? userTask.Action.Assessment.id : userTask.id;
            const apiURL = `clinical/assessments/${assessmentId}/start`;
            const responseBody = await this.needleService.needleRequestForREAN("post", apiURL, null, {});
            let assessmentSessionLogs = null;
            const updatedPayload = {
                "buttonIds" : []
            };
            if (responseBody.Data.Next) {
                const questionNode = responseBody.Data.Next;
                let questionData = null;
                if (typeof responseBody.Data.Next.RawData === 'string') {
                    questionData = JSON.parse(responseBody.Data.Next.RawData);
                }
                else {
                    questionData = responseBody.Data.Next.RawData;
                }
                updatedPayload["messageText"] = responseBody.Data.Next.Description;
                updatedPayload["channel"] = channel;
                updatedPayload["templateName"] = questionData.TemplateName;
                let languageForSession = await this.translate.detectUsersLanguage( platformUserId );
                if (questionData.TemplateVariables[`${assessmentLanguage}`]) {
                    updatedPayload["variables"] = questionData.TemplateVariables[`${assessmentLanguage}`];
                    updatedPayload["languageForSession"] = assessmentLanguage;
                } else {
                    languageForSession = assessmentLanguage;
                    updatedPayload["variables"] = questionData.TemplateVariables[assessmentLanguage];
                    updatedPayload["languageForSession"] = assessmentLanguage;
                }

                // Update template name for whatsapp wati other than english
                if (userTask.Channel === "WhatsappWati" && assessmentLanguage !== "en") {
                    updatedPayload["templateName"] = `${questionData.TemplateName}_${assessmentLanguage}`;
                }

                // Extract buttons
                if (questionData.ButtonsIds) {
                    if (userTask.Channel === "WhatsappWati"){
                        updatedPayload["buttonIds"] = await watiTemplateButtonService(questionData.ButtonsIds);
                    }
                    else if (userTask.Channel === "telegram" || userTask.Channel === "Telegram"){
                        const buttonArray = [];
                        const buttonIds = questionData.ButtonsIds;
                        const optionsNameArray = responseBody.Data.Next.Options;
                        let i = 0;
                        for (const buttonId of buttonIds){
                            buttonArray.push( optionsNameArray[i].Text, buttonId);
                            i = i + 1;
                        }
                        updatedPayload["buttonIds"] = buttonArray;
                    }
                    else {
                        updatedPayload["buttonIds"] = await templateButtonService(questionData.ButtonsIds);
                    }
                }

                // Fetch image URL in template message
                if (questionData.Url) {
                    updatedPayload["headers"] = {
                        "type"  : "image",
                        "image" : {
                            "link" : questionData.Url
                        } };
                }

                //save entry into DB
                assessmentSessionLogs = {
                    patientUserId        : userTask.UserId ? userTask.UserId : userTask.PatientUserId,
                    userPlatformId       : platformUserId,
                    assessmentTemplateId : userTask.Action ? userTask.Action.Assessment.AssessmentTemplateId : userTask.AssessmentTemplateId,
                    assesmentId          : userTask.Action ? userTask.Action.Assessment.id : userTask.id,
                    assesmentNodeId      : questionNode.id,
                    userResponseType     : questionNode.ExpectedResponseType,
                    userResponse         : null,
                    userResponseTime     : null,
                    userMessageId        : null,
                    identifiers          : questionNode.FieldIdentifier,
                    identifiersUnit      : questionNode.FieldIdentifierUnit,
                };

                const key = `${platformUserId}:NextQuestionFlag:${assessmentId}`;
                CacheMemory.set(key, true);
            }
            else {
                updatedPayload["buttonIds"] = [];
            }
            return { updatedPayload, assessmentSessionLogs };
        } catch (error) {
            Logger.instance()
                .log_error(error.message,500,'Start assessment service error.');
        }
    }

    answerQuestion = async (eventObj, userId: string, userResponse: string, userContextMessageId: string, channel: string, doSend: boolean, intent = null, metaData = null) => {
        // eslint-disable-next-line max-len
        try {

            const AssessmentSessionRepo = (await this.entityManagerProvider.getEntityManager(this.clientEnvironmentProviderService)).getRepository(AssessmentSessionLogs);
            const chatMessageRepository = (await this.entityManagerProvider.getEntityManager(this.clientEnvironmentProviderService)).getRepository(ChatMessage);
            const assessmentSession = await AssessmentSessionRepo.findOne({ where: { "userMessageId": userContextMessageId } });
            const AssessmentIdentifiersRepo = (
                await this.entityManagerProvider.getEntityManager(this.clientEnvironmentProviderService)
            ).getRepository(AssessmentIdentifiers);
            const apiURL = `clinical/assessments/${assessmentSession.assesmentId}/questions/${assessmentSession.assesmentNodeId}/answer`;
            const userAnswer = await this.getAnswer(userResponse, assessmentSession.assesmentId, assessmentSession.assesmentNodeId, metaData);

            // const userAnswer = await this.getAnswerFromIntent(userResponse);
            assessmentSession.userResponse = userAnswer;
            assessmentSession.userResponseTime = new Date();
            await assessmentSession.save();

            const obj = {
                ResponseType : assessmentSession.userResponseType,
                Answer       : userAnswer
            };

            // refactor separate it out from here give URL and obj according to that.
            let message: any = "";
            let messageFlag = "";
            const requestBody = await this.needleService.needleRequestForREAN("post", apiURL, null, obj);
            console.log("second request failing",requestBody);
            let payload = null;
            let messageType = 'text';
            const questionData = requestBody.Data.AnswerResponse.Next;
            const nodeType = requestBody.Data.AnswerResponse?.Next?.NodeType ?? null;

            // Creating the cache keys
            const key = `${assessmentSession.userPlatformId}:NextQuestionFlag:${assessmentSession.assesmentId}`;
            const assessmentKey = `${assessmentSession.userPlatformId}:Assessment:${assessmentSession.assesmentId}`;

            //Next question send or complete the assessment
            if (requestBody.Data.AnswerResponse.Next !== null && nodeType !== "Message") {
                let questionRawData = null;
                if (requestBody.Data.AnswerResponse.Next?.RawData) {
                    if (typeof requestBody.Data.AnswerResponse.Next.RawData === 'string') {
                        questionRawData = JSON.parse(requestBody.Data.AnswerResponse.Next.RawData);
                    } else {
                        questionRawData = requestBody.Data.AnswerResponse.Next.RawData;
                    }
                }
                message = questionData.Description;
                console.log("    inside next////// question block");

                const buttonArray = [];
                if (questionData.ExpectedResponseType === "Single Choice Selection") {
                    const buttonIds = questionRawData.ButtonsIds;
                    const optionsNameArray = requestBody.Data.AnswerResponse.Next.Options;
                    let i = 0;
                    for (const buttonId of buttonIds){
                        buttonArray.push( optionsNameArray[i].Text, buttonId);
                        i = i + 1;
                    }
                    if (channel === 'whatsappMeta' || channel === 'whatsappWati') {
                        if (buttonIds.length <= 3) {
                            payload = await sendApiButtonService(buttonArray);
                            messageType = 'interactivebuttons';
                        } else {
                            payload = await sendApiInteractiveListService(buttonArray);
                            messageType = 'interactivelist';
                        }

                    } else {
                        payload = await sendTelegramButtonService(buttonArray);
                        messageType = 'inline_keyboard';
                    }
                }

                //save entry into DB
                const assessmentSessionLogs = {
                    patientUserId        : questionData.PatientUserId,
                    userPlatformId       : assessmentSession.userPlatformId,
                    assessmentTemplateId : questionData.AssessmentTemplateId,
                    assesmentId          : questionData.AssessmentId,
                    assesmentNodeId      : questionData.id,
                    userResponseType     : questionData.ExpectedResponseType,
                    userResponse         : null,
                    userResponseTime     : null,
                    userMessageId        : null,
                };
                messageFlag = "assessment";
                const assessmentSessionData = await AssessmentSessionRepo.create(assessmentSessionLogs);
                const assessmentIdentifierObj = {
                    assessmentSessionId : assessmentSessionData.autoIncrementalID,
                    identifier          : questionData.FieldIdentifier,
                    userResponseType    : assessmentSessionData.userResponseType
                };
                await AssessmentIdentifiersRepo.create(assessmentIdentifierObj);
                const key = `${assessmentSession.userPlatformId}:NextQuestionFlag:${assessmentSession.assesmentId}`;
                CacheMemory.set(key, true);
            } else if (requestBody.Data.AnswerResponse.Next !== null && nodeType === "Message") {
                messageFlag = "endassessment";
                message = requestBody.Data.AnswerResponse.Next.Description;
                CacheMemory.set(key, false);
                CacheMemory.delete(assessmentKey);
            } else {
                messageFlag = "endassessment";
                CacheMemory.set(key, false);
                CacheMemory.delete(assessmentKey);
                const customMessage = await this.systemGeneratedMessageService.getMessage("END_ASSESSMENT_MESSAGE");
                const phoneNumber = await this.countryCodeService.formatPhoneNumber(assessmentSession.userPlatformId);
                let apiURL = `patients/byPhone?phone=${encodeURIComponent(phoneNumber)}`;
                if (channel === 'telegram' || channel === 'Telegram') {
                    apiURL = `patients/search?username=${encodeURIComponent(assessmentSession.userPlatformId)}`;
                }
                const result = await this.needleService.needleRequestForREAN("get", apiURL,null,null);
                const patientData = result.Data.Patients.Items[0];
                const assessmentScore = requestBody.Data.AnswerResponse.AssessmentScore;
                if (assessmentScore) {
                    message =  `✅ Assessment Completed\nYou answered ${assessmentScore.CorrectAnswerCount} out of ${assessmentScore.PosedQuestionCount} questions correctly.\nTotal Score: ${assessmentScore.TotalScore} points.\nWell done.`;                }
                else if (customMessage) {
                    message = await this.fillMessageWithVariables(customMessage, patientData);
                }
                else {
                    message = "The assessment has been completed.";
                }
                if (result.Data.Patients.Items) {
                    const userInfoPayload = {
                        "Name"   : result.Data.Patients.Items[0].DisplayName,
                        "Age"    : result.Data.Patients.Items[0].Age,
                        "Gender" : result.Data.Patients.Items[0].Gender
                    };
                    await this.userInfoService.updateUserInfo(assessmentSession.userPlatformId, userInfoPayload);
                }

                console.log("    inside complete////// question block");
            }

            let messageId = null;
            if (doSend === true) {
                console.log("sending message from handle request");
                const response = { body: { answer: message }, payload: payload };
                const customModelResponseFormat = new CustomModelResponseFormat(response);
                const userPhoneNumber = assessmentSession.userPlatformId;
                this.checkDocumentProcessor(userPhoneNumber, userResponse, userAnswer, assessmentSession, questionData, intent);
                return customModelResponseFormat;

                // response = await eventObj.SendMediaMessage(response_format, payload);
            } else {
                if (channel === "telegram" || channel === "Telegram") {
                    channel = "telegram";
                }
                console.log("sending message from fulllfillment request");
                this._platformMessageService = eventObj.container.resolve(channel);
                const response_format: Iresponse = commonResponseMessageFormat();
                response_format.sessionId = assessmentSession.userPlatformId;
                response_format.messageText = message;
                response_format.message_type = messageType;
                const response = await this._platformMessageService.SendMediaMessage(response_format, payload);
                messageId = await this._platformMessageService.getMessageIdFromResponse(response);
                const chatMessageObj = {
                    chatSessionID  : null,
                    platform       : channel,
                    direction      : "Out",
                    messageType    : response_format.message_type,
                    messageContent : response_format.messageText,
                    userPlatformID : response_format.sessionId,
                    intent         : "assessmentQuestion",
                    messageId      : messageId,
                };
                await chatMessageRepository.create(chatMessageObj);
                console.log("    saved the question into DB");

                if (requestBody.Data.AnswerResponse.Next) {
                    await this.updateDBChatSessionWithMessageId(userId, messageId, chatMessageRepository, AssessmentSessionRepo);
                }

                // if (userResponse === "Work_Commitments" ||
                //     userResponse === "Feeling_Unwell_A" ||
                //     userResponse === "Transit_Issues") {
                //     const docProcessBaseURL = await this.clientEnvironmentProviderService.getClientEnvironmentVariable("DOCUMENT_PROCESSOR_BASE_URL");
                //     let todayDate = new Date().toISOString()
                //         .split('T')[0];
                //     const personPhoneNumber : string = eventObj.body.originalDetectIntentRequest.payload.userId;
                //     const phoneNumber = Helper.formatPhoneForDocProcessor(personPhoneNumber);
                //     const formattedPhoneNumber = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
                //     todayDate = Helper.removeLeadingZerosFromDay(todayDate);
                //     const client = await this.clientEnvironmentProviderService.getClientEnvironmentVariable("NAME");

                //     // const getUrl = `${docProcessBaseURL}appointment-schedules/${client}/appointment-status/${phoneNumber}/days/${todayDate}`;
                //     const getUrl = `${docProcessBaseURL}appointment-schedules/${client}/assessment-response`;
                //     const res = await needle("put",
                //         getUrl,
                //         {
                //             assessment_id   : assessmentSession.assesmentId,
                //             patient_user_id : questionData.PatientUserId,
                //             phone_number    : formattedPhoneNumber,
                //             appointment_date: todayDate,
                //             chosen_option   : {
                //                 sequence : userAnswer,
                //                 text     : userResponse
                //             }
                //         },
                //         {
                //             headers : {
                //                 'Content-Type' : 'application/json',
                //                 Accept         : 'application/json',
                //             },
                //         },
                //     );
                //     console.log(`Object in reply service ${JSON.stringify(res.body,null, 4)}`);
                // }
            }

        } catch (error) {
            Logger.instance()
                .log_error(error.message,500,'Answer assessment and get another question service error.');
        }
    };

    public async checkDocumentProcessor(userPhoneNumber, userResponse, userAnswer, assessmentSession, questionData, intent) {
        if (intent === "Work_Commitments" ||
            intent === "Feeling_Unwell_A" ||
            intent === "Transit_Issues") {
            const docProcessBaseURL = await this.clientEnvironmentProviderService.getClientEnvironmentVariable("DOCUMENT_PROCESSOR_BASE_URL");
            let todayDate = new Date().toISOString()
                .split('T')[0];

            //const personPhoneNumber : string = eventObj.body.originalDetectIntentRequest.payload.userId;
            const phoneNumber = Helper.formatPhoneForDocProcessor(userPhoneNumber);
            const formattedPhoneNumber = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
            todayDate = Helper.removeLeadingZerosFromDay(todayDate);
            const client = await this.clientEnvironmentProviderService.getClientEnvironmentVariable("NAME");

            // const getUrl = `${docProcessBaseURL}appointment-schedules/${client}/appointment-status/${phoneNumber}/days/${todayDate}`;
            const getUrl = `${docProcessBaseURL}appointment-schedules/${client}/assessment-response`;
            const res = await needle("put",
                getUrl,
                {
                    assessment_id    : assessmentSession.assesmentId,
                    patient_user_id  : questionData.PatientUserId,
                    phone_number     : formattedPhoneNumber,
                    appointment_date : todayDate,
                    chosen_option    : {
                        sequence : userAnswer,
                        text     : userResponse
                    }
                },
                {
                    headers : {
                        'Content-Type' : 'application/json',
                        Accept         : 'application/json',
                    },
                },
            );
            console.log(`Object in reply service ${JSON.stringify(res.body,null, 4)}`);
        }
    }

    public async updateDBChatSessionWithMessageId( userId: string, messageId: any, chatMessageRepository, AssessmentSessionRepo, messageFlag = "assessment") {
        const assessmentSession = await AssessmentSessionRepo.findOne({ where: { "userPlatformId": userId }, order: [['createdAt', 'DESC']] });
        assessmentSession.userMessageId = messageId;
        await assessmentSession.save();

        const key = `${assessmentSession.userPlatformId}:Assessment:${assessmentSession.assesmentId}`;

        await CacheMemory.set(key, messageId);

        // if (assessmentSession.userResponseType === "Text") {
        await this.updateMessageFlag(userId, messageId, chatMessageRepository, messageFlag);
        console.log("updated the message flag to assessment");

        // }
    }

    public async getAnswer( userResponse: string, assessmentId: string, assessmentNodeId: string, metaData = null) {
        const apiURL = `clinical/assessments/${assessmentId}/questions/${assessmentNodeId}`;
        const response = await this.needleService.needleRequestForREAN("get", apiURL, null, null);
        const options = response.Data.Question.Options;

        let sequence = options?.length
            ? options.find(
                (option) =>
                    option.ProviderGivenCode.toLowerCase() === userResponse.toLowerCase()
            )?.Sequence ?? null
            : null;
        if (!sequence) {
            sequence = options?.length
                ? options.find(
                    (option) =>
                        option.ProviderGivenCode.toLowerCase() === metaData.intent.toLowerCase()
                )?.Sequence ?? userResponse
                : userResponse;
        }
        return sequence;
    }

    public getAnswerFromIntent( intentName ) {
        const message = {
            "Dmc_Yes"          : 1,
            "Dmc_No"           : 2,
            "option_A"         : 1,
            "option_B"         : 2,
            "option_C"         : 3,
            "option_D"         : 4,
            "Work_Commitments" : 1,
            "Feeling_Unwell_A" : 2,
            "Transit_Issues"   : 3,
            "Assessment_Yes"   : 1,
            "Assessment_No"    : 2,
            "Assessment_No1"   : 1,
            "Assessment_No2"   : 2,
            "Assessment_No3"   : 3,
            "Assessment_No4"   : 4,
            "Assessment_No5"   : 5,
            "Assessment_No6"   : 6,
            "Assessment_No7"   : 7,

        };
        return message[intentName] ?? intentName;
    }

    public async updateMessageFlag(userId, messageId, chatMessageRepository, messageFlag = "assessment") {
        const response = await chatMessageRepository.findOne({
            where : {
                userPlatformId    : userId,
                responseMessageID : messageId
            }, order : [['createdAt', 'DESC']]
        });
        if (response) {
            await chatMessageRepository.update({
                messageFlag : messageFlag
            },
            {
                where : {
                    id : response.id
                }
            });
        }
    }

    public async fillMessageWithVariables(template: string, values) {
        const hasVariable = /{(\w+)}/.test(template);

        if (!hasVariable) {
            return template; // no placeholder — return as-is
        }

        return template.replace(/{(\w+)}/g, (_, key) =>
            key in values && values[key] !== null && values[key] !== undefined
                ? values[key]
                : `{${key}}`
        );
    }

}
