/* eslint-disable @typescript-eslint/no-unused-vars */
import { Lifecycle, scoped, inject } from 'tsyringe';
import { CommonAssessmentService } from './common.assessment.service';
import { AssessmentRequest } from '../../refactor/interface/assessment/assessment.interface';
import { ServeAssessmentService } from '../maternalCareplan/serveAssessment/serveAssessment.service';
import { sendTelegramButtonService } from '../telegram.button.service';
import { platformServiceInterface } from '../../refactor/interface/platform.interface';
import { Iresponse } from '../../refactor/interface/message.interface';
import { commonResponseMessageFormat } from '../common.response.format.object';
import { CacheMemory } from '../cache.memory.service';
import { EntityManagerProvider } from '../entity.manager.provider.service';
import { AssessmentSessionLogs } from '../../models/assessment.session.model';
import { ClientEnvironmentProviderService } from '../set.client/client.environment.provider.service';
import { ChatMessage } from '../../models/chat.message.model';
import { sendApiButtonService } from '../whatsappmeta.button.service';
import { AssessmentIdentifiers } from '../../models/assessment/assessment.identifiers.model';
import { NeedleService } from '../needle.service';
import { IAssessmentIdentifiers } from '../../refactor/interface/assessment/assessment.interface';
import { PromptTemplate } from "langchain/prompts";
import { ChatOpenAI } from "langchain/chat_models/openai";

@scoped(Lifecycle.ContainerScoped)
export class AssessmentService {

    constructor(
        @inject(CommonAssessmentService) private commonAssessmentService?: CommonAssessmentService,
        @inject(ServeAssessmentService) private serveAssessmentService?: ServeAssessmentService,
        @inject(EntityManagerProvider) private entityManagerProvider?: EntityManagerProvider,
        @inject(ClientEnvironmentProviderService)
            private clientEnvironmentProviderService?: ClientEnvironmentProviderService,
        @inject(NeedleService) private needleService?: NeedleService
    ){}

    async createAssessment(input: AssessmentRequest, platformMessageService: platformServiceInterface) {
        await this.startAssessmentAndUpdate(input, platformMessageService);

        // return { responseFormat, payload };
    }

    async startAssessmentAndUpdate(input: AssessmentRequest, platformMessageService: platformServiceInterface) {
        const currentDate = new Date().toISOString()
            .split('T')[0];
        let channel = input.Body.Channel;
        const AssessmentDetails = {
            "PatientUserId"        : input.Body.PatientUserId,
            "Title"                : input.Body.AssessmentTemplateTitle,
            "AssessmentTemplateId" : input.Body.AssessmentTemplateId,
            "ScheduledDate"        : currentDate
        };
        const assessmentData = await this.commonAssessmentService.createAssessment(AssessmentDetails);
        const assessmentUserTasks =
            await this.commonAssessmentService.getAssessmentUserTasks(AssessmentDetails, assessmentData);

        let telegramPayload = null;
        let whatsappPayload = null;
        if (assessmentData.Data.Assessment) {
            const chatMessageRepository =
            (await this.entityManagerProvider.getEntityManager(this.clientEnvironmentProviderService))
                .getRepository(ChatMessage);
            const lastMessage = await chatMessageRepository.findOne({
                where : {
                    userPlatformID : input.Body.PersonPhoneNumber,
                },
                order : [['createdAt', 'DESC']]
            });
            const assessment = JSON.stringify(assessmentData.Data.Assessment);
            const { metaPayload, assessmentSessionLogs } =
                await this.serveAssessmentService.startAssessment(
                    input.Body.PersonPhoneNumber,
                    channel,
                    assessment
                );
            let messageType = lastMessage ? "text" : "template";
            
            // Handling the chanel specific for telegram
            if (channel.toLocaleLowerCase() === "telegram") {
                if (assessmentSessionLogs.userResponseType === 'Single Choice Selection') {
                    messageType = "inline_keyboard";

                    const buttonArray = metaPayload.buttonIds.flatMap(button => {
                        const option = button.parameters[0].payload;
                        return [option.split('_')[1], option];
                    });
                    
                    telegramPayload = await sendTelegramButtonService(buttonArray);
                } else {
                    messageType = "text";
                }
                channel = "telegram";
            } else if (channel === "whatsappMeta") {
                if (assessmentSessionLogs.userResponseType === 'Single Choice Selection') {
                    if (lastMessage) {
                        messageType = 'template';
                    } else {
                        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                        const wasSentRecently = lastMessage.createdAt > twentyFourHoursAgo;
                        messageType = wasSentRecently? 'interactivebuttons' : 'template';
                    }
                    whatsappPayload = await sendApiButtonService(metaPayload.buttonIds);
                }
            }

            const responseFormat: Iresponse = commonResponseMessageFormat();
            responseFormat.platform = channel;
            responseFormat.sessionId = input.Body.PersonPhoneNumber;
            responseFormat.messageText = metaPayload["messageText"];
            responseFormat.message_type = messageType;
            let messageToPlatform = null;
            // let payload = null;
            
            if ((channel === 'telegram' || channel === 'Telegram') &&  messageType === "inline_keyboard" ){

                // payload = telegramPayload;
                messageToPlatform = await platformMessageService.SendMediaMessage(responseFormat, telegramPayload);
            }
            else {

                // payload = whatsappPayload;
                messageToPlatform = await platformMessageService.SendMediaMessage(responseFormat, whatsappPayload);
            }
            assessmentSessionLogs.userMessageId =
                await platformMessageService.getMessageIdFromResponse(messageToPlatform);
            const key = `${input.Body.PersonPhoneNumber}:Assessment`;
            await CacheMemory.set(key, assessmentSessionLogs.userMessageId);

            const AssessmentSession =
                (await this.entityManagerProvider.getEntityManager(this.clientEnvironmentProviderService))
                    .getRepository(AssessmentSessionLogs);
            const assessmentSessionData = await AssessmentSession.create(assessmentSessionLogs);

            const assessmentIdentifierObj = {
                assessmentSessionId : assessmentSessionData.autoIncrementalID,
                identifier          : assessmentSessionLogs.identifiers,
                userResponseType    : assessmentSessionData.userResponseType
            };
            const AssessmentIdentifiersRepo = (
                await this.entityManagerProvider.getEntityManager(this.clientEnvironmentProviderService)
            ).getRepository(AssessmentIdentifiers);
            await AssessmentIdentifiersRepo.create(assessmentIdentifierObj);

            if (assessmentSessionLogs.userResponseType === "Text" ) {
                await this.serveAssessmentService.updateMessageFlag(
                    input.Body.PersonPhoneNumber,
                    assessmentSessionLogs.userMessageId,
                    chatMessageRepository
                );
            }

            // return { responseFormat, payload };
        }

    }

    async validateAssessmentResponse(responseType: string, identifier: string, messageBody, assessmentDetails) {
        try {
            let flag = true;
            switch (responseType) {

            case 'Text': {
                flag = typeof messageBody.messageBody === 'string';
                if (flag) {
                    const promptTemplate = PromptTemplate.fromTemplate(
                        `You would be provided with a user message and a field identifier.
                        You need to check if the user message is relevant to the field identifier and provide true or false with a short explanation.

                        The format of the output should be a JSON with the keys and values as text only. Below is format of the JSON
                        ONLY PROVIDE THE JSON AND NOTHING ELSE IN THE OUTPUT
                        {{
                            "flag" : "true or false",
                            "reason" : "add the explanation here"
                        }}

                        The user message is {user_message}
                        The field identifier is {field_identifier}
                        `
                    );
                    const model = new ChatOpenAI({ temperature: 0, modelName: "gpt-4o-mini" });
                    const chain = promptTemplate.pipe(model);

                    const result = await chain.invoke({ 
                        user_message     : messageBody.messageBody,
                        field_identifier : identifier
                    });

                    const parsed = JSON.parse(result.lc_kwargs.content);
                    parsed.flag = parsed.flag.toLowerCase() === 'true';

                    if (!parsed.flag) {
                        flag = false;
                    }

                }
                break;
            }
            case 'Integer' : {
                flag = /^\d+$/.test(messageBody.messageBody.trim());
                break;
            }
            case 'Single Choice Selection' : {
                const apiURL = `clinical/assessments/${assessmentDetails.assesmentId}/questions/${assessmentDetails.assesmentNodeId}`;
                const response = await this.needleService.needleRequestForREAN("get", apiURL, null, null);
                const options = response.Data.Question.Options;

                flag = options?.length
                    ? options.some(
                        (option) =>
                            option.ProviderGivenCode.toLowerCase() === messageBody.messageBody.toLowerCase()
                    )
                    : false;
                break;
            }
            default:
                break;
            }
            return flag;
        } catch (error) {
            console.log('ERROR WHILE VALIDATING THE ASSESSMENT RESPONSE', error);
        }
    }

}
