import { UserFeedback } from "../models/user.feedback.model";
import { container, delay, inject, Lifecycle, scoped } from "tsyringe";
import { HumanHandoff } from "./human.handoff.service";
import { SlackMessageService } from "./slack.message.service";
import { ClientEnvironmentProviderService } from "./set.client/client.environment.provider.service";

const humanHandoff: HumanHandoff = container.resolve(HumanHandoff);

@scoped(Lifecycle.ContainerScoped)
export class LiveAgent{

    constructor(@inject(delay(() => SlackMessageService)) public slackMessageService,
    // eslint-disable-next-line max-len
    @inject(ClientEnvironmentProviderService) private clientEnvironmentProviderService?: ClientEnvironmentProviderService){}

    async requestLiveAgent(body) {
        const payload = body.originalDetectIntentRequest.payload;
        const message = body.queryResult.queryText;
        return new Promise(async(resolve) =>{
            if (await humanHandoff.checkTime() === "false") {
                const startHHhour = parseFloat(this.clientEnvironmentProviderService.getClientEnvironmentVariable("HH_START_HOUR_LOCAL"));
                const endHHhour = parseFloat(this.clientEnvironmentProviderService.getClientEnvironmentVariable("HH_END_HOUR_LOCAL"));
                const reply = `Our experts will be available between ${startHHhour} and ${endHHhour}`;
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
                const feedBackInfo = new UserFeedback({ userId: payload.userId, messageContent: message, channel: payload.source, humanHandoff: "true", feedbackType: "null", ts: "" });
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
                const response = await client.chat.postMessage({ channel: slackchannelID, text: `${payload.userName} wants to connect with an expert`, });
                await UserFeedback.update({ ts: response.ts }, { where: { id: feedBackInfo.id } })
                    .then(() => { console.log("updated"); })
                    .catch(error => console.log("error on update", error));
            }
        });

    }

}
