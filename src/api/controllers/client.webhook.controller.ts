/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable max-len */
import { ResponseHandler } from '../../utils/response.handler';
import { ErrorHandler } from '../../utils/error.handler';
import { platformServiceInterface } from '../../refactor/interface/platform.interface';
import { scoped, Lifecycle, inject } from 'tsyringe';
import { clientAuthenticator } from '../../services/clientAuthenticator/client.authenticator.interface';
import { ChatMessage } from '../../models/chat.message.model';
import { MessageStatus } from '../../models/message.status';
import { EntityManagerProvider } from '../../services/entity.manager.provider.service';
import { ClientEnvironmentProviderService } from '../../services/set.client/client.environment.provider.service';
import { ContactList } from '../../models/contact.list';
import { ConsentInfo } from '../../models/consent.info.model';
import { UserConsent } from '../../models/user.consent.model';
import { ConsentService } from '../../services/consent.service';
import { Registration } from '../../services/registration/patient.registration.service';
import { Logger } from '../../common/logger';
import { AlertHandler } from '../../services/emergency/alert.handler';

@scoped(Lifecycle.ContainerScoped)
export class ClientWebhookController {

    private _clientAuthenticatorService?: clientAuthenticator;

    private _platformMessageService?: platformServiceInterface;

    private alertHandle = new AlertHandler();

    constructor(
        @inject(ResponseHandler) private responseHandler?: ResponseHandler,
        @inject(ErrorHandler) private errorHandler?: ErrorHandler,
        @inject(EntityManagerProvider) private entityManagerProvider?: EntityManagerProvider,
        @inject(ConsentService) private consentService?: ConsentService,
        @inject(Registration) private registrationService?: Registration,
        @inject(ClientEnvironmentProviderService) private clientEnvironmentProviderService?: ClientEnvironmentProviderService
    ) {

    }

    sendMessage = async (req, res) => {
        try {
            // eslint-disable-next-line max-len
            this._platformMessageService = req.container.resolve(req.params.channel);
            req.body["channel"] = req.params.channel;
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

    // async sendSuccessMessage(chatMessageRepository, messageStatusRepostiory, res, statuses){
    //     try {
    //         const date = new Date(parseInt(statuses[0].timestamp) * 1000);
    //         let message = await chatMessageRepository.findOne({ where: { responseMessageID: statuses[0].id } });

    //         if (message == null){
    //             await this.sleep(2000);
    //             message = await chatMessageRepository.findOne({ where: { responseMessageID: statuses[0].id } });
    //         }

    //         const messageStatusObj: Partial<MessageStatus> = {
    //             chatMessageId : message.id,
    //             messageStatus : statuses[0].status,
    //             channel       : message.platform,
    //         };
    //         if (statuses[0].status === "sent") {
    //             messageStatusObj.messageSentTimestamp = date;
    //             const messageStatus = await messageStatusRepostiory.findOne({ where: { chatMessageId: message.id } });
    //             if (messageStatus) {
    //                 await messageStatusRepostiory.update({ messageSentTimestamp: date, messageStatus: statuses[0].status }, { where: { chatMessageId: message.id } });
    //             } else {
    //                 await messageStatusRepostiory.create(messageStatusObj)
    //                     .then(() => { Logger.instance().log("Send timestamp entered in the database"); });
    //             }
    //             this.responseHandler.sendSuccessResponse(res, 200, 'Message sent successfully!', "");
    //         }
    //         else if (statuses[0].status === "delivered") {
    //             const messageStatus = await messageStatusRepostiory.findOne({ where: { chatMessageId: message.id } });
    //             if (!messageStatus) {
    //                 await this.sleep(1000);
    //             }
    //             await messageStatusRepostiory.update({ messageDeliveredTimestamp: date, messageStatus: statuses[0].status }, { where: { chatMessageId: message.id } })
    //                 .then(() => { Logger.instance().log("Delivered timestamp entered in the database"); });
    //             this.responseHandler.sendSuccessResponse(res, 200, 'Message delivered successfully!', "");
    //         }
    //         else if (statuses[0].status === "read") {
    //             await messageStatusRepostiory.update({ messageReadTimestamp: date, messageStatus: statuses[0].status }, { where: { chatMessageId: message.id } })
    //                 .then(() => { Logger.instance().log("Read timestamp entered in the database"); });
    //             this.responseHandler.sendSuccessResponse(res, 200, 'Message read successfully!', "");
    //         }
    //         else if (statuses[0].status === "replied") {
    //             await messageStatusRepostiory.update({ messageRepliedTimestamp: date, messageStatus: statuses[0].status }, { where: { chatMessageId: message.id } })
    //                 .then(() => { Logger.instance().log("Replied timestamp entered in the database"); });
    //             this.responseHandler.sendSuccessResponse(res, 200, 'Message replied successfully!', "");
    //         }
    //         else if (statuses[0].status === "failed") {
    //             await messageStatusRepostiory.update({ messageSentTimestamp: date, messageStatus: statuses[0].status }, { where: { chatMessageId: message.id } })
    //                 .then(() => { Logger.instance().log("Failed timestamp entered in the database"); });
    //             this.responseHandler.sendSuccessResponse(res, 200, 'Message failed successfully!', "");
    //         }
    //         else {
    //             const temp = this.responseHandler.sendSuccessResponse(res, 200, 'Notification received successfully!', "");
    //         }
    //     } catch (error) {
    //         console.log("While sending success Response", error);
    //     }
        
    // }
    async sendSuccessMessage(chatMessageRepository, messageStatusRepository, res, statuses) {
        try {
            const { id, status, timestamp } = statuses[0];
            const date = new Date(parseInt(timestamp) * 1000);
            console.log(id);
    
            // Retrieve message info
            let messageInfo = await chatMessageRepository.findOne({ where: { responseMessageID: id } });
            if (!messageInfo) {
                await this.sleep(2000); // Retry after delay
                messageInfo = await chatMessageRepository.findOne({ where: { responseMessageID: id } });
            }
    
            if (!messageInfo) {
                console.log("Message info not found");
                return this.responseHandler.sendFailureResponse(res, 404, "Message info not found.");
            }
    
            console.log(messageInfo.id);
    
            const messageStatusObj: Partial<MessageStatus> = {
                chatMessageId : messageInfo.id,
                messageStatus : status,
                channel       : messageInfo.platform,
            };
    
            const existingMessageStatus = await messageStatusRepository.findOne({ where: { chatMessageId: messageInfo.id } });
            if (["sent", "read", "delivered", "replied", "failed"].includes(status)) {
                messageStatusObj.messageSentTimestamp = date;
                await this.handleStatusUpdate(existingMessageStatus, messageStatusObj, messageStatusRepository, res, `Message ${status} successfully!`, `${status} timestamp entered in the database`);
    
            }
            else {
                this.responseHandler.sendSuccessResponse(res, 200, "Notification received successfully!", "");
            }
                
        } catch (error) {
            console.error("Error trace:", error.trace || error);
            console.error("While sending success response:", error);
        }
    }
    
    // Helper method to update or create message status
    private async handleStatusUpdate(
        existingMessageStatus,
        messageStatusObj,
        messageStatusRepository,
        res,
        successMessage,
        logMessage
    ) {
        if (existingMessageStatus) {
            await messageStatusRepository.update(messageStatusObj, { where: { chatMessageId: messageStatusObj.chatMessageId } });
        } else {
            await messageStatusRepository.create(messageStatusObj);
        }
        Logger.instance().log(logMessage);
        this.responseHandler.sendSuccessResponse(res, 200, successMessage, "");
    }

    receiveMessage = async (req, res) => {
        console.log("receiveMessage webhook");
        try {
          
            const clientEnvironmentProviderService = req.container.resolve(ClientEnvironmentProviderService);
            const clientName = clientEnvironmentProviderService.getClientEnvironmentVariable("NAME");

            //to get db repository
            const entityManagerProvider = req.container.resolve(EntityManagerProvider);
            const chatMessageRepository = (await entityManagerProvider.getEntityManager(clientEnvironmentProviderService,clientName)).getRepository(ChatMessage);
            const messageStatusRepostiory = (await entityManagerProvider.getEntityManager(clientEnvironmentProviderService, clientName)).getRepository(MessageStatus);
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
                this.sendSuccessMessage(chatMessageRepository, messageStatusRepostiory, res,req.body.statuses);
                console.log("request.body", req.body);
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
                    const interactiveType = reqBody.messages[0].interactive.type;
                    consentReply = reqBody.messages[0].interactive[interactiveType].id;
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
            const clientEnvironmentProviderService = req. container.resolve(ClientEnvironmentProviderService);
            const entityManagerProvider = req.container.resolve(EntityManagerProvider);
            const clientName = clientEnvironmentProviderService.getClientEnvironmentVariable("NAME");
            console.log("clientName in webhook", clientName);
            const chatMessageRepository = (await entityManagerProvider.getEntityManager(clientEnvironmentProviderService,clientName)).getRepository(ChatMessage);
            const messageStatusRepository = (await entityManagerProvider.getEntityManager(clientEnvironmentProviderService, clientName)).getRepository(MessageStatus);
            this._clientAuthenticatorService = req.container.resolve(req.params.channel + '.authenticator');
            this._clientAuthenticatorService.authenticate(req,res);
            const statuses = req.body.entry[0].changes[0].value.statuses;
            this._platformMessageService = req.container.resolve(req.params.channel);
            const consentActivation =  clientEnvironmentProviderService.getClientEnvironmentVariable("CONSENT_ACTIVATION");
            let userPlatformId = null;
            let platformUserName = null;
            if (statuses) {
                
                // Logs have been added to track the status will be removed in next release
                console.log(statuses[0].status);
                console.log("request.body", req.body);
                this.sendSuccessMessage(chatMessageRepository, messageStatusRepository, res,statuses);
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
            const clientEnvironmentProviderService = req.container.resolve(ClientEnvironmentProviderService);
            const entityManagerProvider = req.container.resolve(EntityManagerProvider);
            const clientName = clientEnvironmentProviderService.getClientEnvironmentVariable("NAME");
            const chatMessageRepository = (await entityManagerProvider.getEntityManager(clientEnvironmentProviderService, clientName)).getRepository(ChatMessage);
            const messageStatusRepository = (await entityManagerProvider.getEntityManager(clientEnvironmentProviderService, clientName)).getRepository(MessageStatus);
            console.log("Wati Client Name:", clientName);
            if (req.body.statusString === "SENT" && req.body.type === "template"){
                this.responseHandler.sendSuccessResponse(res, 200, "Sent status read", "");
                await this.sleep(5000);
                const whatsappMessageId = req.body.whatsappMessageId;
                await chatMessageRepository.update({ responseMessageID: whatsappMessageId }, { where: { responseMessageID: req.body.localMessageId } })
                    .then(() => { console.log("DB Updated with Whatsapp Response ID"); })
                    .catch(error => console.log("error on update", error));

            } else if (req.body.statusString === "SENT" && req.body.owner === false) {
                this.responseHandler.sendSuccessResponse(res, 200, 'Message received successfully!', "");
                this._clientAuthenticatorService = req.container.resolve(req.params.channel + '.authenticator');
                this._clientAuthenticatorService.authenticate(req, res);
                this._platformMessageService = req.container.resolve(req.params.channel);
                this._platformMessageService.handleMessage(req.body, req.params.channel);
            } else {

                // Logs have been added to track the status will be removed in next release
                console.log(req.body.statusString);

                // Will handle the status strings here to update in the DB
                const statuses = [{
                    "id"        : req.body.whatsappMessageId,
                    "status"    : req.body.statusString.toLowerCase(),
                    "timestamp" : req.body.timestamp,
                }];
                await this.sendSuccessMessage(chatMessageRepository, messageStatusRepository, res, statuses);
            }
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
