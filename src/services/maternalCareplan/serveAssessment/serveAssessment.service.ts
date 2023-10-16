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
            const assessmentId = userTask.Action.Assessment.id;
            const apiURL = `clinical/assessments/${assessmentId}/start`;
            const requestBody = await this.needleService.needleRequestForREAN("post", apiURL, null, {});
            let assessmentSessionLogs = null;
            if (requestBody.Data.Next) {
                const questionNode = requestBody.Data.Next;
                const questionData = JSON.parse(requestBody.Data.Next.Hint);

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
                metaPayload["buttonIds"] = await templateButtonService(questionData.ButtonsIds);

                //save entry into DB
                assessmentSessionLogs = {
                    patientUserId        : userTask.UserId,
                    userPlatformId       : message.userId,
                    assessmentTemplateId : userTask.Action.Assessment.AssessmentTemplateId,
                    assesmentId          : userTask.Action.Assessment.id,
                    assesmentNodeId      : questionNode.id,
                    userResponseType     : questionNode.ExpectedResponseType,
                    userResponse         : null,
                    userResponseTime     : null,
                    userMessageId        : null,
                };
            }
            return { metaPayload, assessmentSessionLogs };
        } catch (error) {
            Logger.instance()
                .log_error(error.message,500,'Register patient with blood warrior messaging service error');
        }
    }

    async answerQuestion (eventObj: any, userMessageId: string ) {
        // eslint-disable-next-line max-len
        try {

            const AssessmentSessionRepo = (await this.entityManagerProvider.getEntityManager(this.clientEnvironmentProviderService)).getRepository(AssessmentSessionLogs);
            const assessmentSession = await AssessmentSessionRepo.findOne({ where: { "userMessageId": userMessageId } });
            const apiURL = `clinical/assessments/${assessmentSession.assesmentId}/questions/${assessmentSession.assesmentNodeId}/answer`;
            const userAnswer = await this.getAnswerFromIntent(eventObj.body.queryResult.intent.displayName);
            assessmentSession.userResponse = userAnswer;
            assessmentSession.userResponseTime = new Date();
            await assessmentSession.save();

            const obj = {
                ResponseType : assessmentSession.userResponseType,
                Answer       : userAnswer
            };
            let message = "";
            const requestBody = await this.needleService.needleRequestForREAN("post", apiURL, null, obj);
            let payload = null;
            let messageType = 'text';
            const questionData = requestBody.Data.AnswerResponse.Next;

            //Next question send or complete the assessment
            if (requestBody.Data.AnswerResponse.Next) {
                const questionHint = JSON.parse(requestBody.Data.AnswerResponse.Next.Hint);
                message = questionData.Description;

                const buttonArray = [];
                const buttonIds = questionHint.ButtonsIds;
                const optionsNameArray = requestBody.Data.AnswerResponse.Next.Options;
                let i = 0;
                for (const buttonId of buttonIds){
                    buttonArray.push( optionsNameArray[i].Text, buttonId);
                    i = i + 1;
                }
                payload = await sendApiButtonService(buttonArray);
                messageType = 'interactivebuttons';
            }
            else {
                message = `The assessment has been completed.`;
            }
            const response_format: Iresponse = commonResponseMessageFormat();
            response_format.sessionId = assessmentSession.userPlatformId;
            response_format.messageText = message;
            response_format.message_type = messageType;
            const previousIntentPayload = eventObj.body.originalDetectIntentRequest.payload;
            this._platformMessageService = eventObj.container.resolve(previousIntentPayload.source);
            const response = await this._platformMessageService.SendMediaMessage(response_format, payload);

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
                userMessageId        : response.body.messages[0].id,
            };
            await AssessmentSessionRepo.create(assessmentSessionLogs);
        } catch (error) {
            Logger.instance()
                .log_error(error.message,500,'Register patient with blood warrior messaging service error');
        }
    }

    public getAnswerFromIntent( intentName ) {
        const message = {
            "Dmc_Yes" : 1,
            "Dmc_No"  : 2
        };
        return message[intentName] ?? 1;
    }

}
