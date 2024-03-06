/* eslint-disable max-len */
import { ResponseHandler } from '../../utils/response.handler';
import { ErrorHandler } from '../../utils/error.handler';
import { platformServiceInterface } from '../../refactor/interface/platform.interface';
import { scoped, Lifecycle, inject } from 'tsyringe';
import { clientAuthenticator } from '../../services/clientAuthenticator/client.authenticator.interface';
import util from 'util';
import { ChatMessage } from '../../models/chat.message.model';
import { EntityManagerProvider } from '../../services/entity.manager.provider.service';
import { ClientEnvironmentProviderService } from '../../services/set.client/client.environment.provider.service';
import { ContactList } from '../../models/contact.list';
import { ConsentInfo } from '../../models/consent.info.model';
import { translateService } from '../../services/translate.service';
import { UserConsent } from '../../models/user.consent.model';
import {ConsentService} from '../../services/consent.service';

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
        @inject(ClientEnvironmentProviderService) private clientEnvironmentProviderService?: ClientEnvironmentProviderService,
    ) {

    }

    sendMessage = async (req, res) => {
        console.log("sendMessage webhook");
        try {
            // eslint-disable-next-line max-len
            this._platformMessageService = req.container.resolve(req.params.channel);
            const response = await this._platformMessageService.sendManualMesage(req.body);
            if (response.statusCode === 200 || response.message_id !== undefined) {
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
        const entityManagerProvider = req.container.resolve(EntityManagerProvider);
        const chatMessageRepository = (await entityManagerProvider.getEntityManager(clientEnvironmentProviderService,clientName)).getRepository(ContactList);
        const prevSessions = await chatMessageRepository. findAll({
            where : {
                mobileNumber : userId,
            }
        });
        if (prevSessions.length >= 1){
            firstTimeUser = false;
            
        } else {
            firstTimeUser  = true;
        }
        return firstTimeUser ;
    }

    private async checkConsentRequired(req,userId){
        const clientEnvironmentProviderService = req.container.resolve(ClientEnvironmentProviderService);
        let consentRequired = true;
        const userConsentRepository =
        (await this.entityManagerProvider.getEntityManager(clientEnvironmentProviderService)).getRepository(UserConsent);
        const consentStatus = await userConsentRepository.findOne({ where: { userPlatformID: userId } });
        if (consentStatus.dataValues.consentGiven === 'true'){
            consentRequired = false;
        }
        else {
            consentRequired = true;
        }
        return consentRequired;
    }

    async sendSuccessMessage(chatMessageRepository,res,statuses){

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
            this.responseHandler.sendSuccessResponse(res, 200, 'Notification received successfully!', "");
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
            const statuses = req.body.statuses;
            if (statuses) {
                this.sendSuccessMessage(chatMessageRepository,res,statuses);
            }
            else {
                const validChannels = ["REAN_SUPPORT", "slack", "SNEHA_SUPPORT"];
                if (!validChannels.includes(req.params.channel)) {
                    this.responseHandler.sendSuccessResponse(res, 200, 'Message received successfully!', "");
                }
                this._platformMessageService = req.container.resolve(req.params.channel);
                this._platformMessageService.res = res;
                const consentActivation =  this.clientEnvironmentProviderService.getClientEnvironmentVariable("CONSENT_ACTIVATION");
                if (consentActivation){
                    const consentRepository =
                    (await this.entityManagerProvider.getEntityManager(this.clientEnvironmentProviderService)).getRepository(ConsentInfo);

                    const [userId, consentReply, languageCode] = await this.getUserIdAndLanguagecode(req,"telegram");
    
                    const firstTimeUser = await this.checkFirstTimeUser(req,userId);
                    let consentRequired = true;
                    if (firstTimeUser || consentReply === "consent_no"){
                        consentRequired = true;
                    }
                    else {
                        consentRequired = await this.checkConsentRequired(req,userId);
                    }
                    if (firstTimeUser && consentReply !== "consent_yes"){
                        this.consentService.handleConsentRequest(req,userId,consentReply,languageCode,consentRepository,res,"inline_keyboard");
                    }
                    else {
                        if (consentRequired && consentReply !== "consent_yes"){
                            this.consentService.handleConsentRequest(req,userId,consentReply,languageCode,consentRepository,res,"inline_keyboard");
                        }
                        else {
                            this._platformMessageService.handleMessage(req.body, req.params.channel);
                        }
                    }
                }
                else {
                    this._platformMessageService.handleMessage(req.body, req.params.channel);
                }
                
            }
        }
        catch (error) {
            console.log("in error", error);
            this.errorHandler.handle_controller_error(error, res, req);

        }
    };

    async getUserIdAndLanguagecode(req,channel)
    {
        let userId = null;
        let consentReply  = null;
        let languageCode = await this.clientEnvironmentProviderService.getClientEnvironmentVariable("DEFAULT_LANGUAGE_CODE");
        if (channel === "whatsappMeta"){
            if (req.messages[0].type === 'interactive'){
                consentReply = req.messages[0].interactive.button_reply.id;
                languageCode = consentReply.split("-")[1];
                if (!languageCode){
                    languageCode = await this.clientEnvironmentProviderService.getClientEnvironmentVariable("DEFAULT_LANGUAGE_CODE");
                }
                userId = req.messages[0].from;
            }
            else {
                userId = req.messages[0].from;
    
            }
        }
        else {
            if (req.body.callback_query){
                consentReply = req.body.callback_query.data;
                languageCode = consentReply.split("-")[1];
                if (!languageCode){
                    languageCode = await this.clientEnvironmentProviderService.getClientEnvironmentVariable("DEFAULT_LANGUAGE_CODE");
                }
                userId = req.body.callback_query.message.chat.id;
            }
            else {
                userId = req.body.message.chat.id;
    
            }
        }

        return [userId, consentReply, languageCode];
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
                this._platformMessageService = req.container.resolve(req.params.channel);
                const consentActivation =  this.clientEnvironmentProviderService.getClientEnvironmentVariable("CONSENT_ACTIVATION");
                if (consentActivation){
                    const consentRepository =
                    (await this.entityManagerProvider.getEntityManager(this.clientEnvironmentProviderService)).getRepository(ConsentInfo);
                    const [userId, consentReply, languageCode] = await this.getUserIdAndLanguagecode(req.body.entry[0].changes[0].value,"whatsappMeta");
                    const firstTimeUser = await this.checkFirstTimeUser(req,userId);
                    let consentRequired = true;
                    if (firstTimeUser || consentReply === "consent_no"){
                        consentRequired = true;
                    }
                    else {
                        consentRequired = await this.checkConsentRequired(req,userId);
                    }
                    if (firstTimeUser && consentReply !== "consent_yes"){
                        this.consentService.handleConsentRequest(req,userId,consentReply,languageCode,consentRepository,res,"interactivebuttons");
                    }
                    else {
                        if (consentRequired && consentReply !== "consent_yes"){
                            this.consentService.handleConsentRequest(req,userId,consentReply,languageCode,consentRepository,res,"interactivebuttons");
                        }
                        else {
                            this._platformMessageService.handleMessage(req.body.entry[0].changes[0].value, req.params.channel);
                        }
                    }
                }
                else {
                    this._platformMessageService.handleMessage(req.body.entry[0].changes[0].value, req.params.channel);
                }
                
            }
            
        }
        catch (error) {
            console.log("in error", error);

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

}
