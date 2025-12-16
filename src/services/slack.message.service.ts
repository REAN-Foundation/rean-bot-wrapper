import { WebClient } from '@slack/web-api';
import { createEventAdapter } from '@slack/events-api';
import { platformServiceInterface } from '../refactor/interface/platform.interface';
import { Imessage, Iresponse } from '../refactor/interface/message.interface';
import { inject, Lifecycle, scoped } from 'tsyringe';
import { ResponseHandler } from '../utils/response.handler';
import { ClientEnvironmentProviderService } from './set.client/client.environment.provider.service';
import { SlackClickupCommonFunctions } from './slackAndCkickupSendCustomMessage';
import { EntityManagerProvider } from './entity.manager.provider.service';
import { ChatMessage } from '../models/chat.message.model';

@scoped(Lifecycle.ContainerScoped)
export class SlackMessageService implements platformServiceInterface {

    public res;

    private slackEvent;

    public client;

    public channelID: string;

    private isInitialised = false;

    constructor(
        @inject(ResponseHandler) private responseHandler?: ResponseHandler,

        // eslint-disable-next-line max-len
        @inject(ClientEnvironmentProviderService) private clientEnvironmentProviderService?: ClientEnvironmentProviderService,
        @inject(SlackClickupCommonFunctions) private slackClickupCommonFunctions?: SlackClickupCommonFunctions,
        @inject(EntityManagerProvider) private entityManagerProvider?: EntityManagerProvider) {}

    getMessageIdFromResponse(responseBody: any) {
        console.log(responseBody);
        throw new Error('Method not implemented.');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async handleMessage(message, client) {
        console.log("slack handle message", message);
        this.getMessage(message);
        return this.SendMessage(message);

    }

    async getMessage(message) {

        this.delayedInitialisation();
        if (!message.challenge) {

            // check if message on slack is parent
            if (!message.event.thread_ts) {
                console.log("Parent message");
            }

            // find the parent message(user) and inform the user about reply
            else {
                console.log("child message");
                // eslint-disable-next-line max-len
                const chatMessageRepository = (await this.entityManagerProvider.getEntityManager(this.clientEnvironmentProviderService)).getRepository(ChatMessage);
                // eslint-disable-next-line max-len
                const data = await chatMessageRepository.findOne({ where: { supportChannelTaskID: message.event.thread_ts } });
                const contact = data.userPlatformID;
                const humanHandoff = data.humanHandoff;
                const channel = data.platform;
                if (humanHandoff === "true"){
                    console.log("child message HH On");

                    //if message.event.bot_id then we don't want to trigger a slack event
                    if (message.event.client_msg_id){

                        //This text from support will update the humanHandOff attribute to false at the end of the chat
                        if (message.event.text === "Exit" || message.event.text === "exit"){
                            await chatMessageRepository.update({ humanHandoff: "false" }, { where: { id: data.id } } )
                                .then(() => { console.log("updated"); })
                                .catch(error => console.log("error on update", error));

                            const message = "Thank you for connecting.";
                            await this.slackClickupCommonFunctions.sendCustomMessage(channel, contact, message);
                        }
                        else {

                            // eslint-disable-next-line max-len
                            await this.slackClickupCommonFunctions.sendCustomMessage(channel, contact, message.event.text);
                        }

                    }
                    else {
                        console.log("User posted message: ", message.event.text);
                    }
                }
                else {
                    console.log("child message HH off");
                    const textToUser = `Our Experts have responded to your query. \nYour Query: ${data.messageContent} \nExpert: ${message.event.text}`;
                    await this.slackClickupCommonFunctions.sendCustomMessage(channel, contact, textToUser);
                }

            }
        }
        else {
            console.log("testing endpoint");
        }

    }

    SendMessage(message) {
        this.responseHandler.sendSuccessResponseForSlack(this.res, 201, message.challenge);
        return message;
    }

    async postMessage(response, topic = null) {
        let messageContent = response[response.length - 1].dataValues.messageContent;
        messageContent = (topic !== null) ? topic : messageContent;
        // eslint-disable-next-line max-len
        const objID = (topic !== null) ? response[response.length - 2].dataValues.id : response[response.length - 1].dataValues.id;

        this.delayedInitialisation();
        const message = await this.client.chat.postMessage({ channel: this.channelID, text: messageContent });
        // eslint-disable-next-line max-len
        const chatMessageRepository = (await this.entityManagerProvider.getEntityManager(this.clientEnvironmentProviderService)).getRepository(ChatMessage);
        await chatMessageRepository.update({ supportChannelTaskID: message.ts }, { where: { id: objID } })
            .then(() => { console.log("updated"); })
            .catch(error => console.log("error on update", error));
    }

    async delayedInitialisation(){
        if (!this.isInitialised){
            console.log("SMS delayedInitialisation");
            const slackSecrets = await this.clientEnvironmentProviderService.getClientEnvironmentVariable("slack");
            const slackToken = slackSecrets.TokenFeedback;
            this.client = new WebClient(slackToken);
            this.channelID = slackSecrets.FeedbackChannelId;
            const slackSecret = slackSecrets.SecretFeedback;
            this.slackEvent = createEventAdapter(slackSecret);
            this.isInitialised = true;

        }

    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    sendManualMesage(msg: any) {
        throw new Error('Method not implemented.');
    }

    init() {
        throw new Error('Method not implemented.');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    setWebhook(client: any) {
        throw new Error('Method not implemented.');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    postResponse(messagetoDialogflow: Imessage, process_raw_dialogflow: any) {
        throw new Error('Method not implemented.');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    createFinalMessageFromHumanhandOver(requestBody: any) {
        throw new Error('Method not implemented.');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    SendMediaMessage(response_format:Iresponse, payload:any) {
        throw new Error('Method not implemented.');
    }

}
