/* eslint-disable max-len */
import { UserFeedback } from "../models/user.feedback.model";
import { delay, inject } from "tsyringe";
import { autoInjectable } from 'tsyringe';
import { SlackMessageService } from "./slack.message.service";
import { ClientEnvironmentProviderService } from "./set.client/client.environment.provider.service";

@autoInjectable()
export class HumanHandoff {

    constructor(@inject(delay(() => SlackMessageService)) public slackMessageService,
        private clientEnvironmentProviderService?: ClientEnvironmentProviderService){}

    async checkTime(){
        const time_obj = new Date();

        const hourUtc = time_obj.getUTCHours();
        const minutesUtc = time_obj.getUTCMinutes();
        console.log("hourUtc", hourUtc);
        console.log("minutesutc", minutesUtc);
        // const secondsUtc = time_obj.getUTCSeconds();
        const startHHhour = parseFloat(this.clientEnvironmentProviderService.getClientEnvironmentVariable("HH_START_HOUR"));
        const endHHhour = parseFloat(this.clientEnvironmentProviderService.getClientEnvironmentVariable("HH_END_HOUR"));

        if ((hourUtc >= startHHhour) && ( hourUtc <= endHHhour)){
            console.log("returned true");
            return "true";
        }
        else {
            console.log("returned false");
            return "false";
        }
    }

    async humanHandover(eventObj){
        return new Promise(async(resolve) =>{
            const userId = eventObj.body.originalDetectIntentRequest.payload.userId;
            const resp = await UserFeedback.findAll({where:{userId: userId}});
            console.log("resp human handover find one", resp);
            const objID = resp[resp.length - 1].id;
            await UserFeedback.update({ humanHandoff: "true" }, { where: { id: objID } } )
                .then(() => { console.log("updated"); })
                .catch(error => console.log("error on update", error));
            const reply = "Our expert will connect to you soon";
            const data = {
                "fulfillmentMessages" : [
                    {
                        "text" : {
                            "text" : [
                                reply
                            ]
                        }
                    }
                ]
            };
            resolve(data);
            const ts = resp[resp.length - 1].ts;
            // console.log("ts", ts);
            await this.slackMessageService.delayedInitialisation();
            const client = this.slackMessageService.client;
            const channelID = this.slackMessageService.channelID;
            await client.chat.postMessage({ channel: channelID, text: "This user wants to connect to an expert", thread_ts: ts});
        });

    }

}

