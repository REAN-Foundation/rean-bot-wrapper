import { WebClient } from '@slack/web-api';
import { createEventAdapter } from '@slack/events-api';
import { platformServiceInterface } from '../refactor/interface/platform.interface';
import { message } from '../refactor/interface/message.interface';
import { autoInjectable, delay, inject } from 'tsyringe';
import { ResponseHandler } from '../utils/response.handler';
import { TelegramMessageService } from './telegram.message.service';
import { platformMessageService } from './whatsapp.message.service';
import { UserFeedback } from '../models/user.feedback.model';
import { ClientEnvironmentProviderService } from './set.client/client.environment.provider.service';

@autoInjectable()
export class SlackMessageService implements platformServiceInterface {

    public res;

    private slackEvent;

    private client;

    private channelID;

    private isInitialised = false;

    constructor(@inject(delay(() => platformMessageService)) public whatsappMessageService,
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
                const contact = data.userId;
                const textToUser = `Our Experts have reponded to your querry. \nYour Query: ${data.message} \nExpert: ${message.event.text}`;
                const channel = data.channel;
                if (channel === "telegram"){
                    await this.telegramMessageservice.SendMediaMessage(contact, null, textToUser);
                }
                else if (channel === "whatsapp"){
                    await this.whatsappMessageService.SendMediaMessage(contact.toString(), null, textToUser);
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
        const topic = response[response.length - 1].dataValues.message;
        this.delayedInitialisation();
        const message = await this.client.chat.postMessage({ channel: this.channelID, text: topic });
        await UserFeedback.update({ ts: message.ts }, { where: { id: objID } })
            .then(() => { console.log("updated"); })
            .catch(error => console.log("error on update", error));
    }

    delayedInitialisation(){
        if (!this.isInitialised){
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

    init() {
        throw new Error('Method not implemented.');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    setWebhook(client: any) {
        throw new Error('Method not implemented.');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    postResponse(messagetoDialogflow: message, process_raw_dialogflow: any) {
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
