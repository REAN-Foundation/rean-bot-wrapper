import { ChatMessage } from "../models/chat.message.model";
import { container, delay, inject, Lifecycle, scoped } from "tsyringe";
import { HumanHandoff } from "./human.handoff.service";
import { SlackMessageService } from "./slack.message.service";
import { ClientEnvironmentProviderService } from "./set.client/client.environment.provider.service";
import { EntityManagerProvider } from "./entity.manager.provider.service";

const humanHandoff: HumanHandoff = container.resolve(HumanHandoff);

@scoped(Lifecycle.ContainerScoped)
export class LiveAgent{

    constructor(@inject(delay(() => SlackMessageService)) public slackMessageService,
    // eslint-disable-next-line max-len
    @inject(ClientEnvironmentProviderService) private clientEnvironmentProviderService?: ClientEnvironmentProviderService,
    @inject(EntityManagerProvider) private entityManagerProvider?: EntityManagerProvider){}

    async requestLiveAgent(body) {
        const payload = body.originalDetectIntentRequest.payload;
        return new Promise(async(resolve) =>{
            if (await humanHandoff.checkTime() === "false") {
                const startHHhour = parseFloat(await this.clientEnvironmentProviderService.getClientEnvironmentVariable("HH_START_HOUR_LOCAL"));
                const endHHhour = parseFloat(await this.clientEnvironmentProviderService.getClientEnvironmentVariable("HH_END_HOUR_LOCAL"));
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

                // eslint-disable-next-line max-len
                const chatMessageRepository = (await this.entityManagerProvider.getEntityManager(this.clientEnvironmentProviderService)).getRepository(ChatMessage);
                const chatMessageObject = await chatMessageRepository.findOne({ order: [['createdAt', 'DESC']], limit: 1 });
                const feedBackInfo = await chatMessageRepository.update({ humanHandoff: "true" }, { where: { "id": chatMessageObject.id } });
                console.log("feedBackInfo",feedBackInfo);
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

                await chatMessageRepository.update({ ts: response.ts }, { where: { id: chatMessageObject.id } })
                    .then(() => { console.log("updated"); })
                    .catch(error => console.log("error on update", error));
            }
        });

    }

}
