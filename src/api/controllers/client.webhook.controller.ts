/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable max-len */
import { ResponseHandler } from '../../utils/response.handler';
import { ErrorHandler } from '../../utils/error.handler';
import { platformServiceInterface } from '../../refactor/interface/platform.interface';
import { scoped, Lifecycle, inject } from 'tsyringe';
import { clientAuthenticator } from '../../services/clientAuthenticator/client.authenticator.interface';
import { ChatMessage } from '../../models/chat.message.model';
import { EntityManagerProvider } from '../../services/entity.manager.provider.service';
import { ClientEnvironmentProviderService } from '../../services/set.client/client.environment.provider.service';
import { ContactList } from '../../models/contact.list';
import { ConsentInfo } from '../../models/consent.info.model';
import { translateService } from '../../services/translate.service';
import { UserConsent } from '../../models/user.consent.model';
import { ConsentService } from '../../services/consent.service';
import { Registration } from '../../services/registration/patient.registration.service';

@scoped(Lifecycle.ContainerScoped)
export class ClientWebhookController {

    private _clientAuthenticatorService?: clientAuthenticator;

    private _platformMessageService?: platformServiceInterface;

    constructor(
        @inject(ResponseHandler) private responseHandler?: ResponseHandler,
        @inject(ErrorHandler) private errorHandler?: ErrorHandler,
        @inject(EntityManagerProvider) private entityManagerProvider?: EntityManagerProvider,
        @inject(translateService) private translate?: translateService,
        @inject(ConsentService) private consentService?: ConsentService,
        @inject(Registration) private registrationService?: Registration,
        @inject(ClientEnvironmentProviderService) private clientEnvironmentProviderService?: ClientEnvironmentProviderService
    ) {

    }

    sendMessage = async (req, res) => {
        try {
            // eslint-disable-next-line max-len
            this._platformMessageService = req.container.resolve(req.params.channel);
            const response = await this._platformMessageService.sendManualMesage(req.body);
            if (response.statusCode === 200 || response.message_id !== undefined || response.status === 200) {
                this.responseHandler.sendSuccessResponse(res, 200, 'Message sent successfully!', response.body);
            }
            else {
                this.responseHandler.sendFailureResponse(res, 400, 'An error occurred while sending messages!', req);
            }
        }
        catch (error) {
            this.errorHandler.handle_controller_error(error, res, req);
        }
    };

    private async checkFirstTimeUser (req, userId)
    
    {
        const clientEnvironmentProviderService = req.container.resolve(ClientEnvironmentProviderService);
        const clientName = clientEnvironmentProviderService.getClientEnvironmentVariable("NAME");
        let firstTimeUser  = false;
        let patientUserId = null;
        const entityManagerProvider = req.container.resolve(EntityManagerProvider);
        const chatMessageRepository = (await entityManagerProvider.getEntityManager(clientEnvironmentProviderService,clientName)).getRepository(ContactList);
        const prevSessions = await chatMessageRepository.findOne({ where : { mobileNumber: userId, }
        });
        if (prevSessions){
            patientUserId  = prevSessions.dataValues.patientUserId;
            firstTimeUser = false;
            
        } else {
            firstTimeUser  = true;
        }
        return [firstTimeUser , patientUserId ]  ;
    }

    private async checkConsentRequired(req,userId){
        const clientEnvironmentProviderService = req.container.resolve(ClientEnvironmentProviderService);
        let consentRequired = true;
        const userConsentRepository =
        (await this.entityManagerProvider.getEntityManager(clientEnvironmentProviderService)).getRepository(UserConsent);
        const consentStatus = await userConsentRepository.findOne({ where: { userPlatformID: userId } });
        if ( consentStatus){
            if (consentStatus.dataValues.consentGiven === 'true'){
                consentRequired = false;
            }
            else {
                consentRequired = true;
            }
        }
        return consentRequired;
    }

    async sendSuccessMessage(chatMessageRepository,res,statuses){
        try {
            const date = new Date(parseInt(statuses[0].timestamp) * 1000);
            if (statuses[0].status === "sent") {
                await chatMessageRepository.update({ whatsappResponseStatusSentTimestamp: date },{ where: { responseMessageID: statuses[0].id } })
                    .then(() => { console.log("Sent timestamp entered in database"); });
                this.responseHandler.sendSuccessResponse(res, 200, 'Message sent successfully!', "");
            }
            else if (statuses[0].status === "delivered") {
                await chatMessageRepository.update({ whatsappResponseStatusDeliveredTimestamp: date },{ where: { responseMessageID: statuses[0].id } })
                    .then(() => { console.log("Delivered timestamp of entered in database"); });
                this.responseHandler.sendSuccessResponse(res, 200, 'Message delivered successfully!', "");
            }
            else if (statuses[0].status === "read") {
                await chatMessageRepository.update({ whatsappResponseStatusReadTimestamp: date },{ where: { responseMessageID: statuses[0].id } })
                    .then(() => { console.log("Read timestamp of entered in database"); });
                this.responseHandler.sendSuccessResponse(res, 200, 'Message read successfully!', "");
            }
            else {
                const temp = this.responseHandler.sendSuccessResponse(res, 200, 'Notification received successfully!', "");
            }
        } catch (error) {
            console.log("While sending success Response", error);
        }
        
    }

    receiveMessage = async (req, res) => {
        console.log("receiveMessage webhook");
        try {
            const clientEnvironmentProviderService = req.container.resolve(ClientEnvironmentProviderService);
            const clientName = clientEnvironmentProviderService.getClientEnvironmentVariable("NAME");
            const entityManagerProvider = req.container.resolve(EntityManagerProvider);
            const chatMessageRepository = (await entityManagerProvider.getEntityManager(clientEnvironmentProviderService,clientName)).getRepository(ChatMessage);
            this._clientAuthenticatorService = req.container.resolve(req.params.channel + '.authenticator');
            this._clientAuthenticatorService.authenticate(req,res);
            let userPlatformId = null;
            let platformUserName = null;
            this._platformMessageService = req.container.resolve(req.params.channel);
            this._platformMessageService.res = res;
            if (req.params.channel === "telegram"){
                [userPlatformId ,platformUserName] = await this.getTelegramUserID(req.body);
            }
            if (req.body.statuses) {
                this.sendSuccessMessage(chatMessageRepository,res,req.body.statuses);
            }
            else {
                const consentRequirement =  clientEnvironmentProviderService.getClientEnvironmentVariable("CONSENT_ACTIVATION");
                console.log("Consent feature is ", consentRequirement);
                const validChannels = ["REAN_SUPPORT", "slack", "SNEHA_SUPPORT", "mockChannel"];
                if (!validChannels.includes(req.params.channel)) {
                    this.responseHandler.sendSuccessResponse(res, 200, 'Message received successfully!', "");
                }
                const [firstTimeUser,patientUSerId ]  = await this.checkFirstTimeUser(req, userPlatformId);
                if (consentRequirement && req.params.channel === "telegram"){
                    console.log("Processing the consent message for telegram");
                    await this.handleConsentMessage(req, res,req.body,"inline_keyboard",req.params.channel,firstTimeUser );
                }
                else if (req.params.channel === "mockChannel"){
                    const response = await this._platformMessageService.handleMessage(req.body, req.params.channel);
                    return res.status(200).send(response);
                }
                else {
                    this.handelRequestWithoutConsent(firstTimeUser,patientUSerId,req,entityManagerProvider,userPlatformId, platformUserName, req.body );
                }
                
            }
        }
        catch (error) {
            console.log("in error", error);
            this.errorHandler.handle_controller_error(error, res, req);

        }
    };

    async  handelRequestWithoutConsent(firstTimeUser,patientUSerId,req,entityManagerProvider,userPlatformId, platformUserName,reqVariable ) {
        try {
            if (firstTimeUser || !patientUSerId  ){
                const patientUserId = await this.registrationService.getPatientUserId(req.params.channel, userPlatformId, platformUserName);
                await this.registrationService.wrapperRegistration(entityManagerProvider,userPlatformId, platformUserName,req.params.channel,patientUserId);
            }
            this._platformMessageService.handleMessage(reqVariable, req.params.channel);
        } catch (error) {
            console.log(error);
        }
    }

    private async handleConsentMessage(req: any, res: any, handleReqVariable,buttonKeyName,channel,firstTimeUser ) {
        try {
            const clientEnvironmentProviderService = await req.container.resolve(ClientEnvironmentProviderService);
            const clientName = await  clientEnvironmentProviderService.getClientEnvironmentVariable("NAME");
            console.log(clientName);
            console.log("Here in handle consent Message");
            const entityManagerProvider = req.container.resolve(EntityManagerProvider);
            const consentRepository = (await entityManagerProvider.getEntityManager(clientEnvironmentProviderService,clientName)).getRepository(ConsentInfo);
            const [userId, consentReply, languageCode] = await this.getUserIdAndLanguagecode(handleReqVariable, channel,req);
            let consentRequired = true;
            console.log("Handling the consent message flow ", userId, consentReply, languageCode, firstTimeUser);
            if (firstTimeUser || consentReply === "consent_no") {
                consentRequired = true;
            }
            else {
                consentRequired = await this.checkConsentRequired(req, userId);
            }
            if (firstTimeUser && consentReply !== "consent_yes") {
                this.consentService.handleConsentRequest(req, userId, consentReply, languageCode, consentRepository, res,buttonKeyName);
            }
            else {
                if (consentRequired && consentReply !== "consent_yes") {
                    this.consentService.handleConsentRequest(req, userId, consentReply, languageCode, consentRepository, res, buttonKeyName);
                }
                else {

                    this._platformMessageService.handleMessage(handleReqVariable, req.params.channel);
                }
            }
        }
        catch (error) {
            console.log("While Sending Consent Response", error);

        }
        
    }

    async getUserIdAndLanguagecode(reqBody,channel,req)
    {
        try {
            const clientEnvironmentProviderService = req.container.resolve(ClientEnvironmentProviderService);
            let userId = null;
            let consentReply  = null;
            let languageCode = await clientEnvironmentProviderService.getClientEnvironmentVariable("DEFAULT_LANGUAGE_CODE");
            if (channel === "whatsappMeta"){
                if (reqBody.messages[0].type === 'interactive'){
                    consentReply = reqBody.messages[0].interactive.button_reply.id;
                    languageCode = consentReply.split("-")[1];
                    if (!languageCode){
                        languageCode = await clientEnvironmentProviderService.getClientEnvironmentVariable("DEFAULT_LANGUAGE_CODE");
                    }
                    userId = reqBody.messages[0].from;
                }
                else {
                    userId = reqBody.messages[0].from;
        
                }
            }
            else if (channel === "telegram") {
                if (reqBody.callback_query){
                    consentReply = reqBody.callback_query.data;
                    languageCode = consentReply.split("-")[1];
                    if (!languageCode){
                        languageCode = await this.clientEnvironmentProviderService.getClientEnvironmentVariable("DEFAULT_LANGUAGE_CODE");
                    }
                    userId = reqBody.callback_query.message.chat.id;
                }
                else {
                    userId = reqBody.message.chat.id;
        
                }
            }
    
            return [userId, consentReply, languageCode];
        }
        catch (error) {
            console.log("While getting user ID ,Language code", error);

        }
    }

    async getTelegramUserID(reqBody)
    {
        try {
            let userId = null;
            let userName = null;
            if (reqBody.callback_query){
                userId = reqBody.callback_query.message.chat.id;
                userName = reqBody.callback_query.message.chat.first_name;
            }
            else {
                userId = reqBody.message.chat.id;
                userName = reqBody.message.chat.first_name;
    
            }
            return [userId ,userName];
        }
        catch (error) {
            console.log("While getting telegram ID", error);

        }

    }

    authenticateMetaWhatsappWebhook = async (req, res) => {
        console.log("meta whatsapp webhook verification");
        try {
            this.responseHandler.sendSuccessResponseForWhatsappAPI(res,200,req);
        }
        catch (error) {
            console.log("in error", error);
            this.errorHandler.handle_controller_error(error, res, req);
        }

    };

    receiveMessageMetaWhatsapp = async (req, res) => {
        try {
            const clientEnvironmentProviderService = req.container.resolve(ClientEnvironmentProviderService);
            const entityManagerProvider = req.container.resolve(EntityManagerProvider);
            const clientName = clientEnvironmentProviderService.getClientEnvironmentVariable("NAME");
            console.log("clientName in webhook", clientName);
            const chatMessageRepository = (await entityManagerProvider.getEntityManager(clientEnvironmentProviderService,clientName)).getRepository(ChatMessage);
            this._clientAuthenticatorService = req.container.resolve(req.params.channel + '.authenticator');
            this._clientAuthenticatorService.authenticate(req,res);
            const statuses = req.body.entry[0].changes[0].value.statuses;
            this._platformMessageService = req.container.resolve(req.params.channel);
            const consentActivation =  clientEnvironmentProviderService.getClientEnvironmentVariable("CONSENT_ACTIVATION");
            let userPlatformId = null;
            let platformUserName = null;
            if (statuses) {
                this.sendSuccessMessage(chatMessageRepository,res,statuses);
            }
            else {
                console.log("receiveMessage webhook receiveMessageWhatsappNew");
                if (req.params.channel !== "REAN_SUPPORT" &&
                req.params.channel !== "slack" &&
                req.params.channel !== "SNEHA_SUPPORT") {
                    this.responseHandler.sendSuccessResponse(res, 200, 'Message received successfully!', "");
                }
                if (req.params.channel === "whatsappMeta"){
                    userPlatformId = req.body.entry[0].changes[0].value.messages[0].from;
                    platformUserName = req.body.entry[0].changes[0].value.contacts[0].profile.name;
                }
                const [firstTimeUser ,ehrSystemCode ]  = await this.checkFirstTimeUser(req, userPlatformId);
                if (consentActivation &&  req.params.channel === "whatsappMeta"){
                    console.log("Processing the consent message for whatsapp");
                    await this.handleConsentMessage(req, res,req.body.entry[0].changes[0].value, "interactivebuttons", req.params.channel,firstTimeUser);
                }
                else {
                    this.handelRequestWithoutConsent(firstTimeUser,ehrSystemCode,req,entityManagerProvider,userPlatformId, platformUserName, req.body.entry[0].changes[0].value);
                }
                
            }
            
        }
        catch (error) {
            console.log("in error", error);

            this.errorHandler.handle_controller_error(error, res, req);
        }
    };

    receiveMessageWatiWhatsapp = async (req, res) =>{
        try {
            const entityManagerProvider = req.container.resolve(EntityManagerProvider);
            const clientName = this.clientEnvironmentProviderService.getClientEnvironmentVariable("Name");
            console.log("Wati Client Name:", clientName);
            if (req.body.statusString === "SENT" && req.body.type === "template"){
                this.responseHandler.sendSuccessResponse(res, 200, "Sent status read", "");
                await this.sleep(5000);
                const chatMessageRepository = (await entityManagerProvider.getEntityManager(this.clientEnvironmentProviderService, clientName)).getRepository(ChatMessage);
                const whatsappMessageId = req.body.whatsappMessageId;
                await chatMessageRepository.update({ responseMessageID: whatsappMessageId }, { where: { responseMessageID: req.body.localMessageId } })
                    .then(() => { console.log("DB Updated with Whatsapp Response ID"); })
                    .catch(error => console.log("error on update", error));

            } else if (req.body.statusString === "SENT") {
                this.responseHandler.sendSuccessResponse(res, 200, 'Message received successfully!', "");
                this._clientAuthenticatorService = req.container.resolve(req.params.channel + '.authenticator');
                this._clientAuthenticatorService.authenticate(req, res);
                this._platformMessageService = req.container.resolve(req.params.channel);
                this._platformMessageService.handleMessage(req.body, req.params.channel);
            } else {

                // Future addition
            }

            // const chatMessageRepository = (await entityManagerProvider.getEntityManager(this.clientEnvironmentProviderService, clientName)).getRepository(ChatMessage);
            // this.sendSuccessMessage(chatMessageRepository, res, req.body.statusString);
        } catch (error) {
            console.log("error in Wati message handler", error);
            this.errorHandler.handle_controller_error(error, res, req);
        }
    };

    receiveMessageOldNumber = async (req, res) => {
        console.log("receiveMessageold webhook");
        try {
            this.responseHandler.sendSuccessResponse(res, 200, 'Message received successfully!', "");
            if (req.body.statuses) {

                // status = sent, received & read
            }
            else {

                // eslint-disable-next-line max-len
                // const response_message = "We have migrated REAN Health Guru to a new number. Click this link to chat with REAN Health Guru. Link: https://api.whatsapp.com/send/?phone=15712152682&text=Hey&app_absent=0";
                this._platformMessageService = req.container.resolve('whatsapp');

                this._platformMessageService.handleMessage(req.body, req.params.client);
            }
        }
        catch (error) {
            console.log("in error", error);
            this.errorHandler.handle_controller_error(error, res, req);
        }
    };

    sleep = async (ms) => {
        return new Promise((resolve) => {
            setTimeout(resolve, ms);
        });
    };

}
