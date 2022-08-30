import { UserFeedback } from "../models/user.feedback.model";
import { autoInjectable, container, delay, inject } from "tsyringe";
import { HumanHandoff } from "./human.handoff.service";
import { SlackMessageService } from "./slack.message.service";

const humanHandoff: HumanHandoff = container.resolve(HumanHandoff);

@autoInjectable()
export class LiveAgent{

    constructor(@inject(delay(() => SlackMessageService)) public slackMessageService){}

    async requestLiveAgent(body) {
        console.log("eventobj for live agent",body);
        const payload = body.originalDetectIntentRequest.payload;
        console.log("payload", payload);
        const message = body.queryResult.queryText;
        console.log("message", message);
        return new Promise(async(resolve) =>{
            if (await humanHandoff.checkTime() === "false") {
                const reply = "Our experts will be available during *****";
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
            }
            else {
                const feedBackInfo = new UserFeedback({ userId: payload.userId, message: message, channel: payload.source, humanHandoff: "true", feedbackType: "null", ts: ""});
                await feedBackInfo.save();
                const reply = "Our experts will connect with you shortly";
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
                await this.slackMessageService.delayedInitialisation();
                const client = this.slackMessageService.client;
                const slackchannelID = this.slackMessageService.channelID;
                const response = await client.chat.postMessage({ channel: slackchannelID, text: `${payload.userName} wants to connect with an expert`,});
                await UserFeedback.update({ ts: response.ts }, { where: { id: feedBackInfo.id } })
                    .then(() => { console.log("updated"); })
                    .catch(error => console.log("error on update", error));
            }
        });

    }
}