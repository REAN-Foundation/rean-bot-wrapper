/* eslint-disable max-len */
import { inject, Lifecycle, scoped } from 'tsyringe';
import { UserConsent } from '../models/user.consent.model';
import { Logger } from '../common/logger';
import { ErrorHandler } from '../utils/error.handler';
import { translateService } from '../services/translate.service';
import { EntityManagerProvider } from './entity.manager.provider.service';
import { ClientEnvironmentProviderService } from './set.client/client.environment.provider.service';
import { sendTelegramButtonService } from '../services/telegram.button.service';
import { commonResponseMessageFormat } from '../services/common.response.format.object';
import { Iresponse } from '../refactor/interface/message.interface';
import { platformServiceInterface } from '../refactor/interface/platform.interface';
import { sendApiButtonService } from './whatsappmeta.button.service';

@scoped(Lifecycle.ContainerScoped)
export class ConsentService {
    
    private _platformMessageService?: platformServiceInterface;

    constructor(
        @inject(ClientEnvironmentProviderService) private clientEnvironment?: ClientEnvironmentProviderService,
        @inject(ErrorHandler) private errorHandler?: ErrorHandler,
        @inject(EntityManagerProvider) private entityManagerProvider?: EntityManagerProvider,
        @inject(translateService) private translate?: translateService,
    ){}

    async handleConsentYesreply(userId,eventObj): Promise<any> {
        try {
            const userID = userId;
            const clientEnvironmentProviderService = eventObj.container.resolve(ClientEnvironmentProviderService);
            const userConsentRepository =
            (await this.entityManagerProvider.getEntityManager(clientEnvironmentProviderService)).getRepository(UserConsent);
            const consentStatus =
            await userConsentRepository.findOne({ where: { userPlatformID: userId } });
            if (consentStatus){
                await consentStatus.update({ consentGiven: "true" });
            }
            else {
                const consentObj = {
                    userPlatformID : userID,
                    consentGiven   : "true"
                };
                await userConsentRepository.create(consentObj);

            } } catch (error) {
            Logger.instance()
                .log_error(error.message,500,'Consent Yes error');
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
                .log_error(error.message,500,'Consent Yes error');
        }
    }

    async customConsent(req, _platformMessageService , message, messageType, sessionId, payload){
        const response_format: Iresponse = commonResponseMessageFormat();
        response_format.sessionId = sessionId;
        response_format.messageText = message;
        response_format.message_type = messageType;

        const response = _platformMessageService.SendMediaMessage(response_format, payload );

    }

    async handleConsentRequest(req,userId,consentReply,languageCode,consentRepository,res,buttonmessageType){
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
            this.customConsent(req, this._platformMessageService, message, messageType, userId , payload);
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
            this.customConsent(req,this._platformMessageService,message, messageType, userId , payload);
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
            this.customConsent(req,this._platformMessageService,message, messageType, userId , payload);
        }
    }

}
