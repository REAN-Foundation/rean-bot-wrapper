/* eslint-disable max-len */
import { scoped, Lifecycle, inject } from 'tsyringe';
import { Logger } from '../../../common/logger';
import { NeedleService } from '../../needle.service';
import { sendApiButtonService, templateButtonService } from '../../whatsappmeta.button.service';
import { translateService } from '../../translate.service';
import { ClientEnvironmentProviderService } from '../../set.client/client.environment.provider.service';
import { Iresponse } from '../../../refactor/interface/message.interface';
import { AssessmentSessionLogs } from '../../../models/assessment.session.model';
import { EntityManagerProvider } from '../../entity.manager.provider.service';
import { commonResponseMessageFormat } from '../../common.response.format.object';
import { platformServiceInterface } from '../../../refactor/interface/platform.interface';
import { ChatMessage } from '../../../models/chat.message.model';
import { CacheMemory } from '../../../services/cache.memory.service';
import { ChatSession } from '../../../models/chat.session';
import { CustomModelResponseFormat } from '../../../services/response.format/custom.model.response.format';

@scoped(Lifecycle.ContainerScoped)
export class ServeAssessmentService {

    private _platformMessageService :  platformServiceInterface = null;

    constructor(
        @inject(NeedleService) private needleService?: NeedleService,
        @inject(translateService) private translate?: translateService,
        @inject(ClientEnvironmentProviderService) private clientEnvironmentProviderService?: ClientEnvironmentProviderService,
        @inject(EntityManagerProvider) private entityManagerProvider?: EntityManagerProvider,
    ){}
    
    async startAssessment (message: any, userTaskData: any) {
        try {
            const metaPayload = {};
            const userTask = JSON.parse(userTaskData);

            // const assessmentId = userTask.Action.Assessment.id;
            const assessmentId = userTask.Action ? userTask.Action.Assessment.id : userTask.id;
            const apiURL = `clinical/assessments/${assessmentId}/start`;
            const requestBody = await this.needleService.needleRequestForREAN("post", apiURL, null, {});
            let assessmentSessionLogs = null;
            if (requestBody.Data.Next) {
                const questionNode = requestBody.Data.Next;
                const questionData = JSON.parse(requestBody.Data.Next.RawData);
                metaPayload["messageText"] = requestBody.Data.Next.Description;

                // Extract variables
                metaPayload["templateName"] = questionData.TemplateName;
                const languageForSession = await this.translate.detectUsersLanguage( message.userId );
                if (questionData.TemplateVariables[`${languageForSession}`]) {
                    metaPayload["variables"] = questionData.TemplateVariables[`${languageForSession}`];
                    metaPayload["languageForSession"] = languageForSession;
                } else {
                    metaPayload["variables"] = questionData.TemplateVariables[this.clientEnvironmentProviderService.getClientEnvironmentVariable("DEFAULT_LANGUAGE_CODE")];
                    metaPayload["languageForSession"] = this.clientEnvironmentProviderService.getClientEnvironmentVariable("DEFAULT_LANGUAGE_CODE");
                }

                // Extract buttons
                if (questionData.ButtonsIds) {
                    metaPayload["buttonIds"] = await templateButtonService(questionData.ButtonsIds);
                }

                //save entry into DB
                assessmentSessionLogs = {
                    patientUserId        : userTask.UserId ? userTask.UserId : userTask.PatientUserId,
                    userPlatformId       : message.userId,
                    assessmentTemplateId : userTask.Action ? userTask.Action.Assessment.AssessmentTemplateId : userTask.AssessmentTemplateId,
                    assesmentId          : userTask.Action ? userTask.Action.Assessment.id : userTask.id,
                    assesmentNodeId      : questionNode.id,
                    userResponseType     : questionNode.ExpectedResponseType,
                    userResponse         : null,
                    userResponseTime     : null,
                    userMessageId        : null,
                };

                const key = `${message.userId}:NextQuestionFlag`;
                CacheMemory.set(key, true);
            }
            return { metaPayload, assessmentSessionLogs };
        } catch (error) {
            Logger.instance()
                .log_error(error.message,500,'Start assessment service error.');
        }
    }

    answerQuestion = async (eventObj, userId: string, userResponse: string, userContextMessageId: string, channel: string, doSend: boolean ) => {
        // eslint-disable-next-line max-len
        try {

            const AssessmentSessionRepo = (await this.entityManagerProvider.getEntityManager(this.clientEnvironmentProviderService)).getRepository(AssessmentSessionLogs);
            const chatMessageRepository = (await this.entityManagerProvider.getEntityManager(this.clientEnvironmentProviderService)).getRepository(ChatMessage);
            const assessmentSession = await AssessmentSessionRepo.findOne({ where: { "userMessageId": userContextMessageId } });
            const apiURL = `clinical/assessments/${assessmentSession.assesmentId}/questions/${assessmentSession.assesmentNodeId}/answer`;
            const userAnswer = await this.getAnswerFromIntent(userResponse);
            assessmentSession.userResponse = userAnswer;
            assessmentSession.userResponseTime = new Date();
            await assessmentSession.save();

            const obj = {
                ResponseType : assessmentSession.userResponseType,
                Answer       : userAnswer
            };

            // refactor separate it out from here give URL and obj according to that.
            let message: any = "";
            const requestBody = await this.needleService.needleRequestForREAN("post", apiURL, null, obj);
            let payload = null;
            let messageType = 'text';
            const questionData = requestBody.Data.AnswerResponse.Next;

            //Next question send or complete the assessment
            if (requestBody.Data.AnswerResponse.Next) {
                const questionRawData = JSON.parse(requestBody.Data.AnswerResponse.Next.RawData);
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
                    payload = await sendApiButtonService(buttonArray);
                    messageType = 'interactivebuttons';
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
                await AssessmentSessionRepo.create(assessmentSessionLogs);
                const key = `${assessmentSession.userPlatformId}:NextQuestionFlag`;
                CacheMemory.set(key, true);
            }
            else {
                message = "The assessment has been completed.";
                console.log("    inside complete////// question block");

            }
            const response_format: Iresponse = commonResponseMessageFormat();
            response_format.sessionId = assessmentSession.userPlatformId;
            response_format.messageText = message;
            response_format.message_type = messageType;
            let response = null;
            if (doSend) {
                console.log("    sending message from handle request");
                const response = { body: { answer: message } };
                const customModelResponseFormat = new CustomModelResponseFormat(response);
                message = customModelResponseFormat;
                return message;

                // response = await eventObj.SendMediaMessage(response_format, payload);
            } else {
                if (channel === "telegram" || channel === "Telegram") {
                    channel = "telegram";
                }
                console.log("    sending message from fulllfillment request");
                this._platformMessageService = eventObj.container.resolve(channel);
                response = await this._platformMessageService.SendMediaMessage(response_format, payload);
                const messageId = await this._platformMessageService.getMessageIdFromResponse(response);
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
            }

        } catch (error) {
            Logger.instance()
                .log_error(error.message,500,'Answer assessment and get another question service error.');
        }
    }

    public async updateDBChatSessionWithMessageId( userId: string, messageId: any, chatMessageRepository, AssessmentSessionRepo) {
        const assessmentSession = await AssessmentSessionRepo.findOne({ where: { "userPlatformId": userId }, order: [['createdAt', 'DESC']] });
        assessmentSession.userMessageId = messageId;
        await assessmentSession.save();

        const key = `${assessmentSession.userPlatformId}:Assessment`;
        await CacheMemory.set(key, messageId);
        if (assessmentSession.userResponseType === "Text") {
            await this.updateMessageFlag(userId, messageId, chatMessageRepository);
            console.log("    updated the message flag to assessment");
        }
    }

    public getAnswerFromIntent( intentName ) {
        const message = {
            "Dmc_Yes" : 1,
            "Dmc_No"  : 2
        };
        return message[intentName] ?? intentName;
    }

    public async updateMessageFlag( userId, messageId, chatMessageRepository ) {
        const response = await chatMessageRepository.findOne( { where: { userPlatformId: userId, responseMessageID: messageId }, order: [['createdAt', 'DESC']] });
        if (response) {
            await chatMessageRepository.update({ messageFlag: "assessment" }, { where: { id: response.id } });
        }
    }

}
