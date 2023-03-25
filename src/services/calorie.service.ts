import { autoInjectable,container, Lifecycle, scoped } from "tsyringe";
import { platformServiceInterface } from "../refactor/interface/platform.interface";
import { Iresponse } from "../refactor/interface/message.interface";
import { commonResponseMessageFormat } from "./common.response.format.object";

// @autoInjectable()
@scoped(Lifecycle.ContainerScoped)
export class CalorieService {

    public res;

    constructor(
        private _platformMessageService?: platformServiceInterface
    ) {
    
    }

    async handleMessageCalorie(sessionId: any, client: any, req: any) {
        console.log('Here in the handle message of food');
        const responseFromDF = await this.sendCalorieToDF(req);

        return responseFromDF;
    }

    async postResponseCalorie(userId: any, client: any, data: any) {
        console.log("Sending calorie data to client");
        const response_format: Iresponse = commonResponseMessageFormat();
        response_format.platform = client;
        response_format.sessionId = userId;
        response_format.messageBody = data;
        response_format.message_type = "text";
        response_format.messageText = data;
        
        // this._platformMessageService = container.resolve(client);
        await this._platformMessageService.SendMediaMessage(response_format,null);
    }

    async sendCalorieToDF(req){
        return new Promise(async (resolve)=> {
            console.log("Start food calorie service...");
            const params = req.body.queryResult.parameters;
            console.log(params);

            const data = {
                "fulfillmentMessages" : [
                    {
                        "text" : {
                            "text" : [
                                "We are fetching your result."
                            ]
                        }
                    }
                ]
            };
            console.log("Message to DF created");
            resolve(data);
        });
    }

}
