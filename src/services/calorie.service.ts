import { autoInjectable,container} from "tsyringe";
import { platformServiceInterface } from "../refactor/interface/platform.interface";
import { MessageFlow } from "./get.put.message.flow.service";
import { GetCalories } from "./get.calorie.service";

@autoInjectable()
export class CalorieService {

    public res;

    private _platformMessageService?: platformServiceInterface;

    constructor(private messageFlow?: MessageFlow,
        private getCalorieService?: GetCalories
    ) {
    
    }

    async handleMessageCalorie(sessionId: any, client: any, req: any) {
        console.log('Here in the handle message of food');
        const responseFromDF = await this.sendCalorieToDF(req);

        return responseFromDF;
    }

    async postResponseCalorie(userId: any, client: any, data: any) {
        console.log("Sending calorie data to client");
        this._platformMessageService = container.resolve(client);
        await this._platformMessageService.SendMediaMessage(userId,null,data,'text');
    }

    async sendCalorieToDF(req){
        return new Promise(async (resolve,reject)=> {
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