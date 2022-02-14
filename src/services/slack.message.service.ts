import { WebClient } from '@slack/web-api';
import { createEventAdapter } from '@slack/events-api';
import { platformServiceInterface } from '../refactor/interface/platform.interface';
import { message } from '../refactor/interface/message.interface';
import { autoInjectable, delay, inject } from 'tsyringe';
import { ResponseHandler } from '../utils/response.handler';
import { MongoDBService } from './mongodb.service';
import { TelegramMessageService } from './telegram.message.service';
import { platformMessageService } from './whatsapp.message.service';

const client = new WebClient(process.env.SlackToken);
const channelID = process.env.channelID;
const slackSecret = process.env.slackSecret;
const slackEvent = createEventAdapter(slackSecret);

@autoInjectable()
export class SlackMessageService implements platformServiceInterface {

    constructor(@inject(delay(() => platformMessageService)) public whatsappMessageService,
        private responseHandler?: ResponseHandler,
        private telegramMessageservice?: TelegramMessageService,
        private mongoDBService?: MongoDBService) { }

    public res;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async handleMessage(message, client) {
        console.log("slack handle message", message);
        this.getMessage(message);
        return this.SendMessage(message);

    }

    async getMessage(message) {

        if (!message.challenge) {

            // check if message on slack is parent
            if (!message.event.thread_ts) {
                console.log("Parent message");
            }

            // find the parent message(user) and inform the user about reply
            else {
                console.log("child message");
                const data = await this.mongoDBService.mongooseGetData({ "ts": message.event.thread_ts });
                const contact = data[0].userID;
                const textToUser = `Our Experts have reponded to your querry. \nYour Query: ${data[0].message} \nExpert: ${message.event.text}`;
                const channel = data[0].channel;
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

        slackEvent.on("message", (event) => {
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
        let objID = response[response.length - 1]._id;
        objID = objID.toString();
        const topic = response[response.length - 1].message;
        const message = await client.chat.postMessage({ channel: channelID, text: topic });
        const updatedObject = { $set: { "ts": message.ts } };
        this.mongoDBService.mongooseUpdateDocument(objID, updatedObject);
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
    // eslint-disable-next-line max-len
    SendMediaMessage(SmessagetoDialogflow_sessionId: string, response_format_messageBody: string, response_format_messageText: string) {
        throw new Error('Method not implemented.');
    }

}
