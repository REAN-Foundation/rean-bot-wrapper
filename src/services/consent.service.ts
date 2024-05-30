/* eslint-disable max-len */
import { inject, Lifecycle, scoped } from 'tsyringe';
import { UserConsent } from '../models/user.consent.model';
import { Logger } from '../common/logger';
import { ErrorHandler } from '../utils/error.handler';
import { translateService } from '../services/translate.service';
import { dialoflowMessageFormatting } from "./Dialogflow.service";
import { EntityManagerProvider } from './entity.manager.provider.service';
import { ClientEnvironmentProviderService } from './set.client/client.environment.provider.service';
import { sendTelegramButtonService } from '../services/telegram.button.service';
import { commonResponseMessageFormat } from '../services/common.response.format.object';
import { Iresponse } from '../refactor/interface/message.interface';
import { platformServiceInterface } from '../refactor/interface/platform.interface';
import { sendApiButtonService } from './whatsappmeta.button.service';
import { Registration } from './registration/patient.registration.service';

@scoped(Lifecycle.ContainerScoped)
export class ConsentService {
    
    private _platformMessageService?: platformServiceInterface;

    constructor(
        @inject(ClientEnvironmentProviderService) private clientEnvironment?: ClientEnvironmentProviderService,
        @inject(ErrorHandler) private errorHandler?: ErrorHandler,
        @inject(EntityManagerProvider) private entityManagerProvider?: EntityManagerProvider,
        @inject(translateService) private translate?: translateService,
        @inject(Registration) private registrationService?: Registration,
        @inject(dialoflowMessageFormatting) private DialogflowServices?: dialoflowMessageFormatting,
    ){}

    async handleConsentYesreply(userPlatformId, platformUserName,eventObj): Promise<any> {
        try {
            console.log("consent yes listener is called");
            const sourceChannel = eventObj.body.originalDetectIntentRequest.payload.source;

            this._platformMessageService = eventObj.container.resolve(sourceChannel.toLowerCase());
            const EnvironmentProviderService = eventObj.container.resolve(ClientEnvironmentProviderService);
            const patientUserId = await this.registrationService.getPatientUserId(sourceChannel, userPlatformId, platformUserName);
            await this.registrationService.wrapperRegistration(this.entityManagerProvider,userPlatformId, platformUserName,sourceChannel,patientUserId);
            this.updateConsentStatus(userPlatformId,EnvironmentProviderService);
            const additionalInfoRequired =  EnvironmentProviderService.getClientEnvironmentVariable("ADDITIONAL_INFO_REQUIRED");
            if (additionalInfoRequired){
                this.triggerAdditionalInfoIntent(sourceChannel,eventObj,userPlatformId,EnvironmentProviderService);
            }
        } catch (error) {
            Logger.instance()
                .log_error(error.message,500,'Consent Yes error');
        }
    }

    async triggerAdditionalInfoIntent(sourceChannel,eventObj,userPlatformId,EnvironmentProviderService){
        try {
            console.log("additional info intent is called");
            const languageCode = eventObj.body.queryResult.languageCode;
            let payload = null;
            let messageType = null;
            const RequiredAdditionalInfo =  EnvironmentProviderService.getClientEnvironmentVariable("REQUIRED_ADDITIONAL_INFO");
            const RequiredAdditionalobj = JSON.parse(RequiredAdditionalInfo );
            const values: any[] = Object.values(RequiredAdditionalobj);
            const RequiredAdditionalValuesString: string = values.join(',');
            const button_yes = await this.translate.translatestring("Yes",languageCode);
            const button_no = await this.translate.translatestring("No",languageCode);
            const buttonArray = [button_yes, "additionalInfo" ,button_no,"Welcome"];
            if (sourceChannel === "whatsappMeta"){
                payload = await sendApiButtonService(buttonArray);
                messageType = "interactivebuttons";
            }
            else {
                payload = await sendTelegramButtonService(buttonArray);
                messageType = "inline_keyboard";
            }
            const message = `Do you have ${RequiredAdditionalValuesString}?`;
            this.sendCustomMessage(this._platformMessageService,message, messageType, userPlatformId ,payload);
        }
        catch (error) {
            console.log("While triggering additional info intent", error);
        }
    }

    async updateConsentStatus(userPlatformId,EnvironmentProviderService){
        try {
            const userConsentRepository =
            (await this.entityManagerProvider.getEntityManager(EnvironmentProviderService)).getRepository(UserConsent);
            const consentStatus =
            await userConsentRepository.findOne({ where: { userPlatformID: userPlatformId } });
            if (consentStatus){
                await consentStatus.update({ consentGiven: "true" });
            }
            else {
                const consentObj = {
                    userPlatformID : userPlatformId,
                    consentGiven   : "true"
                };
                await userConsentRepository.create(consentObj);

            }
        }
        catch (error) {
            console.log("While updating Consent Status", error);

        }
        
    }

    async handleConsentNoreply(userId,req): Promise<any> {
        try {
            const clientEnvironmentProviderService = await req.container.resolve(ClientEnvironmentProviderService);
            const clientName = await  clientEnvironmentProviderService.getClientEnvironmentVariable("NAME");
            console.log(clientName);
            const entityManagerProvider = req.container.resolve(EntityManagerProvider);
            const userConsentRepository =
            (await entityManagerProvider.getEntityManager(clientEnvironmentProviderService,clientName)).getRepository(UserConsent);
            const consentStatus =
            await userConsentRepository.findOne({ where: { userPlatformID: userId } });
            if (consentStatus){
                await consentStatus.update({ consentGiven: "false" });
            }
        } catch (error) {
            Logger.instance()
                .log_error(error.message,500,'Consent No error');
        }
    }

    async sendCustomMessage( _platformMessageService , message, messageType, sessionId, payload){
        const response_format: Iresponse = commonResponseMessageFormat();
        response_format.sessionId = sessionId;
        response_format.messageText = message;
        response_format.message_type = messageType;
        _platformMessageService.SendMediaMessage(response_format, payload );

    }

    async handleConsentRequest(req,userId,consentReply,languageCode,consentRepository,res,buttonmessageType){
        try {
            const clientEnvironmentProviderService = await req.container.resolve(ClientEnvironmentProviderService);
            const clientName = await  clientEnvironmentProviderService.getClientEnvironmentVariable("NAME");
            console.log(clientName);
            const entityManagerProvider = req.container.resolve(EntityManagerProvider);
            
            this._platformMessageService = req.container.resolve(req.params.channel);
            this._platformMessageService.res = res;
            let payload = null;
            if (consentReply === "consent_no"){
                console.log("No Consent is Given");
                const userConsentRepository =
                (await entityManagerProvider.getEntityManager(clientEnvironmentProviderService,clientName)).getRepository(UserConsent);
                const consentStatus =
                await userConsentRepository.findOne({ where: { userPlatformID: userId } });
                if (consentStatus){
                    await consentStatus.update({ consentGiven: "false" });
                }
                const message =  clientEnvironmentProviderService.getClientEnvironmentVariable("CONSENT_NO_MESSAGE");
                const messageType = "text";
                this.sendCustomMessage( this._platformMessageService, message, messageType, userId , payload);
            }
            else if (consentReply === "consent_changeLanguge"){
                const consentData = await consentRepository.findAll();
                const buttonArray = [];
                consentData.forEach(async consent=>
                {
                    console.log(consent);
                    buttonArray.push(consent.dataValues.Language);
                    buttonArray.push(`consent_changeLanguge-${consent.dataValues.LanguageCode}`);
                });
                console.log(buttonArray);
                const message = await this.translate.translatestring("Please, select your preferred language", languageCode);
                const messageType = buttonmessageType;
                if (req.params.channel === "whatsappMeta"){
                    payload = await sendApiButtonService(buttonArray);
                }
                else {
                    payload = await sendTelegramButtonService(buttonArray);
                }
                this.sendCustomMessage(this._platformMessageService,message, messageType, userId , payload);
            }
            else {
                const consentFindResult = await consentRepository.findOne({ where: { LanguageCode: languageCode } });
                const message = `${consentFindResult.MessageContent} \n\n ${consentFindResult.WebsiteURL}`;
                const messageType = buttonmessageType;
                const button_yes = await this.translate.translatestring("Yes",languageCode);
                const button_no = await this.translate.translatestring("No",languageCode);
                const button_changeLanguage = await this.translate.translatestring("Change Language",languageCode);
                const buttonArray = [button_yes, "consent_yes" ,button_no,"consent_no", button_changeLanguage,"consent_changeLanguge"];
                if (req.params.channel === "whatsappMeta"){
                    payload = await sendApiButtonService(buttonArray);
                }
                else {
                    payload = await sendTelegramButtonService(buttonArray);
                }
                this.sendCustomMessage(this._platformMessageService,message, messageType, userId , payload);
            }
        }
        catch (error) {
            console.log("WhileStoring the additional info", error);

        }
    }

}
