/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/no-var-requires */
import { ChatSession } from "../models/chat.session";
import  TelegramBot  from 'node-telegram-bot-api';
import { ClientEnvironmentProviderService } from "./set.client/client.environment.provider.service";
import { container } from "tsyringe";
import { getRequestOptions } from "../utils/helper";
import needle from 'needle';
import { ChatMessage } from "../models/chat.message.model";
var CronJob = require('cron').CronJob;

//Functionality of the cronjob is ready but not implemented yet
export class BotFeedback{

    async testCron(){
        var job = new CronJob(
            '*/2 * * * *',
            async function() {
                console.log("inside");
                async function testSettimeout(userId){
                    const clientEnvironmentProviderService: ClientEnvironmentProviderService = container.resolve(ClientEnvironmentProviderService);
                    const chatSessionRepository = (await this.entityManagerProvider.getEntityManager(clientEnvironmentProviderService)).getRepository(ChatSession);
                    const chatMessageRepository = (await this.entityManagerProvider.getEntityManager(clientEnvironmentProviderService)).getRepository(ChatMessage);
                    const respOfChatSession = await chatSessionRepository.findAll({ where: { userPlatformID: userId } });
                    const timeOfLastMessage = respOfChatSession[respOfChatSession.length - 1].lastMessageDate;
                    const askForFeedback = respOfChatSession[respOfChatSession.length - 1].askForFeedback;
                    console.log("timeOfLastMessage", timeOfLastMessage);
                    console.log("type of timeOfLastMessage",typeof(timeOfLastMessage));
                    // eslint-disable-next-line init-declarations
                    let date: string | number | Date;
                    date = new Date();
                    date = date.getUTCFullYear() + '-' +
                    ('00' + (date.getUTCMonth() + 1)).slice(-2) + '-' +
                    ('00' + date.getUTCDate()).slice(-2) + 'T' +
                    ('00' + date.getUTCHours()).slice(-2) + ':' +
                    ('00' + date.getUTCMinutes()).slice(-2) + ':' +
                    ('00' + date.getUTCSeconds()).slice(-2) + '.000Z';
                    console.log("date",date);
                    const date1:any = new Date(date);
                    console.log("date1",date1);
                    console.log("type of date1",typeof(date1));
                    var minutes = Math.abs(date1 - timeOfLastMessage) / 6e4;
                    console.log("minutes", minutes);
                    if (minutes > 1){
                        console.log("more than 3 minutes");
                        const platform = respOfChatSession[respOfChatSession.length - 1].platform;
                        const message = "Please rate our bot";
                        if (askForFeedback === "true") {
                            if (platform === "Telegram"){
                                const telegram = new TelegramBot(clientEnvironmentProviderService.getClientEnvironmentVariable("TELEGRAM_BOT_TOKEN"));
                                telegram.sendMessage(userId, message, { parse_mode: 'HTML' })
                                    .then(async(data) => { console.log("message sent", data);
                                        await chatSessionRepository.update({ askForFeedback: "false" }, { where: { userPlatformID: userId } } )
                                            .then(() => { console.log("updated askFeedback"); })
                                            .catch(error => console.log("error on update", error));
                                        await chatMessageRepository.create({
                                            platform       : "Telegram",
                                            direction      : "Out",
                                            messageType    : "text",
                                            messageContent : message,
                                            userPlatformID : userId
                                        });
                                    })
                                    .catch(error => console.log("error", error));
                            }
                            else if (platform === "Whatsapp"){
                                console.log("Whatsapp");
                                const postData = {
                                    'recipient_type' : 'individual',
                                    'to'             : userId.toString(),
                                    'type'           : "text",
                                    'text'           : { 'body': message }
                                };
                                
                                const options = getRequestOptions();
                                options.headers['Content-Type'] = 'application/json';
                                options.headers['D360-Api-Key'] = clientEnvironmentProviderService.getClientEnvironmentVariable("WHATSAPP_LIVE_API_KEY");
                                const hostname = clientEnvironmentProviderService.getClientEnvironmentVariable("WHATSAPP_LIVE_HOST");
                                const path = '/v1/messages';
                                const apiUrl = "https://" + hostname + path;
                                console.log("apiuri",apiUrl);
                                console.log("options",options);
                                await needle.post(apiUrl, JSON.stringify(postData), options, async function(err, resp) {
                                    if (err) {
                                        console.log("err", err);
                                    }
                                    await chatSessionRepository.update({ askForFeedback: "false" }, { where: { userPlatformID: userId } } )
                                        .then(() => { console.log("updated askFeedback"); })
                                        .catch(error => console.log("error on update", error));
                                    await chatMessageRepository.create({
                                        platform       : "Whatsapp",
                                        direction      : "Out",
                                        messageType    : "text",
                                        messageContent : message,
                                        userPlatformID : userId
                                    });
                                    console.log("resp", resp.body);
                                });
                            }
                            else {
                                console.log("error");
                            }

                        }
                        else {
                            console.log("Don't ask for feedback");
                        }

                    }
                    else {
                        console.log("time diff needs to be > 1 minute for aksing feedback");
                    }
                    
                }
                const clientEnvironmentProviderService: ClientEnvironmentProviderService = container.resolve(ClientEnvironmentProviderService);
                const chatSessionRepository = (await this.entityManagerProvider.getEntityManager(clientEnvironmentProviderService)).getRepository(ChatSession);
                const respOfChatSession = await chatSessionRepository.findAll();

                // console.log("respOfChatSession!!!!!!!!!!!", respOfChatSession);
                for (let i = 0; i < respOfChatSession.length; i++) {

                    // console.log("i",i);
                    const userId = respOfChatSession[i].userPlatformID;
                    console.log("userID", userId);
                    await testSettimeout(userId);
                }
            
            },
            null,
            true,
            'America/Los_Angeles'
        );
        job.start();
    }

    async asdf(){
        console.log("jshdj");
    }

}

// const botFeedback = new BotFeedback();
// botFeedback.testSettimeout(false, "2077778107");
