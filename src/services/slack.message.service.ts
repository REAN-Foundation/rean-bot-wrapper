import { WebClient } from '@slack/web-api';
import { createEventAdapter } from '@slack/events-api';
import { platformServiceInterface } from '../refactor/interface/platform.interface';
import { Imessage } from '../refactor/interface/message.interface';
import { autoInjectable, delay, inject } from 'tsyringe';
import { ResponseHandler } from '../utils/response.handler';
import { TelegramMessageService } from './telegram.message.service';
import { WhatsappMessageService } from './whatsapp.message.service';
import { WhatsappMetaMessageService } from './whatsapp.meta.message.service';
import { UserFeedback } from '../models/user.feedback.model';
import { ClientEnvironmentProviderService } from './set.client/client.environment.provider.service';

@autoInjectable()
export class SlackMessageService implements platformServiceInterface {

    public res;

    private slackEvent;

    public client;

    public channelID: string;

    private isInitialised = false;

    constructor(@inject(delay(() => WhatsappMessageService)) public whatsappMessageService,
        @inject(delay(() => WhatsappMetaMessageService)) public whatsappNewMessageService,
        private responseHandler?: ResponseHandler,
        private clientEnvironmentProviderService?: ClientEnvironmentProviderService,
        private telegramMessageservice?: TelegramMessageService) {}

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
                const data = await UserFeedback.findOne({ where: { ts: message.event.thread_ts } });
                console.log("data", data);
                const contact = data.userId;
                const humanHandoff = data.humanHandoff;
                const channel = data.channel;
                if (humanHandoff === "true"){
                    console.log("child message HH On");
                    
                    //if message.event.bot_id then we don't want to trigger a slack event
                    if (message.event.client_msg_id){

                        //This text from support will update the humanHandOff attribute to false at the end of the chat
                        if (message.event.text === "Exit" || message.event.text === "exit"){
                            await UserFeedback.update({ humanHandoff: "false" }, { where: { id: data.id } } )
                                .then(() => { console.log("updated"); })
                                .catch(error => console.log("error on update", error));

                            const message = "Thank you for connecting.";
                            await this.sendCustomMessage(channel, contact, message);
                        }
                        else {
                            await this.sendCustomMessage(channel, contact, message.event.text);
                        }
                        
                    }
                    else {
                        console.log("User posted message: ", message.event.text);
                    }
                }
                else {
                    console.log("child message HH off");
                    const textToUser = `Our Experts have responded to your query. \nYour Query: ${data.messageContent} \nExpert: ${message.event.text}`;
                    await this.sendCustomMessage(channel, contact, textToUser);
                }
                
            }
        }
        else {
            console.log("testing endpoint");
        }

        this.slackEvent.on("message", (event) => {
            console.log(`Received a message event123: user ${event.user} in channel ${event.channel} says ${event.text}`);
            (async () => {
                try {
                    console.log("Testing", event.user);
                }
                catch (error) {
                    console.log("error", error.data);
                }
            })();
        });

    }

    SendMessage(message) {
        this.responseHandler.sendSuccessResponseForSlack(this.res, 201, message.challenge);
        return message;
    }

    async postMessage(response) {
        const objID = response[response.length - 1].dataValues.id;
        const topic = response[response.length - 1].dataValues.messageContent;
        this.delayedInitialisation();
        const message = await this.client.chat.postMessage({ channel: this.channelID, text: topic });
        await UserFeedback.update({ ts: message.ts }, { where: { id: objID } })
            .then(() => { console.log("updated"); })
            .catch(error => console.log("error on update", error));
    }

    delayedInitialisation(){
        if (!this.isInitialised){
            console.log("SMS delayedInitialisation");
            this.client = new WebClient(this.clientEnvironmentProviderService.getClientEnvironmentVariable("SLACK_TOKEN_FEEDBACK"));
            this.channelID = this.clientEnvironmentProviderService.getClientEnvironmentVariable("SLACK_FEEDBACK_CHANNEL_ID");
            const slackSecret = this.clientEnvironmentProviderService.getClientEnvironmentVariable("SLACK_SECRET_FEEDBACK");
            this.slackEvent = createEventAdapter(slackSecret);
            this.isInitialised = true;

        }
        
    }
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    sendManualMesage(msg: any) {
        throw new Error('Method not implemented.');
    }

    async sendCustomMessage(channel, contact, message) {
        if (channel === "telegram"){
            await this.telegramMessageservice.SendMediaMessage(contact, null, message, "text");
        }
        else if (channel === "whatsapp"){
            await this.whatsappMessageService.SendMediaMessage(contact.toString(), null, message, "text");
        }
        else if (channel === "whatsappMeta"){
            await this.whatsappNewMessageService.SendMediaMessage(contact.toString(), null, message, "text");
        }
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
    SendMediaMessage(sessionId: string, messageBody: string, messageText: string) {
        throw new Error('Method not implemented.');
    }

}
