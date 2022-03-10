/* eslint-disable init-declarations */
// import { message } from '../refactor/interface/message.interface';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { autoInjectable } from 'tsyringe';
import { ClientEnvironmentProviderService } from './set.client/client.environment.provider.service';

// import { TelegramMessageService } from './telegram.message.service';
// import needle from "needle";
// import { getRequestOptions } from '../utils/helper';
import  TelegramBot  from 'node-telegram-bot-api';
import util from 'util';

@autoInjectable()
export class AnemiaModel{

    public _telegram: TelegramBot = null;

    constructor(
        private clientEnvironmentProviderService?:ClientEnvironmentProviderService,
        // private telegramMessageService?: TelegramMessageService
    ) {
    }

    async getAnemiaImagePath(req){
        return new Promise(async(resolve, reject)=> {
            try {
                console.log("Start anemia service-------");
                const params = req.body.queryResult.parameters ? req.body.queryResult.parameters : '';
                console.log("Params for anemia", params);

                if (params){
                    console.log("params", params);
                    const imagePath = params.imagePath;
                    // const anemiaResult = await this.callAnemiaModel(imagePath);
                    console.log("if params condition");
                    const data = {
                        "fulfillmentMessages" : [
                            {
                                "text" : {
                                    "text" : [
                                        imagePath
                                    ]
                                }
                            }
                        ]
                    };
                    console.log("sending image url", util.inspect(data, {showHidden: false, depth: null, colors: true}));
                    resolve(data);
                }
            }
            catch (error) {
                console.log(error, 500, "Anemia Service Error!");
                reject(error.message);
            }
        });
    }

    // async callAnemiaModel(imagePathFromDF) {

    //     // eslint-disable-next-line max-len
    //     const imagePath = 'https://api.telegram.org/file/bot' + this.clientEnvironmentProviderService.getClientEnvironmentVariable("TELEGRAM_BOT_TOKEN") + '/' + 'photos/file_23.jpg';
        
    //     // const anemiaModelUrl = this.clientEnvironmentProviderService.getClientEnvironmentVariable("ANEMIA_MODEL_URL");
    //     const anemiaModelUrl = "http://0.0.0.0:5000";
    //     const REQUEST_AUTHENTICATION = this.clientEnvironmentProviderService.getClientEnvironmentVariable("REQUEST_AUTHENTICATION");
    //     const options = getRequestOptions();
    //     options.headers["Authorization"] = `Bearer ${REQUEST_AUTHENTICATION}`;
    //     options.headers["Content-Type"] = `application/json`;
    //     const obj = {
    //         "path" : "https://d3uqieugp2i3ic.cloudfront.net/dev/file_23.jpg"
    //     };
    //     console.log("obj", obj)
    //     const response = await needle("post",anemiaModelUrl, obj, options);

    //     console.log("response", response.body)


    //     if (response.statusCode !== 200) {
    //         console.log("Failed to get response from API.",response.statusCode);
    //     }
    //     let anemiaResult: string;
    //     // if (messagetoAnemiaModel.type !== "image"){
    //     //     // eslint-disable-next-line max-len
    //     //     this.telegramMessageService.SendMediaMessage(messagetoAnemiaModel.sessionId, null, "Hey, I'm  REAN Anemia Detection Bot. Please share an image of your eye conjunctiva similar to the one shown below");
    //     //     // eslint-disable-next-line max-len
    //     //     this.telegramMessageService.SendMediaMessage(messagetoAnemiaModel.sessionId, "https://t4.ftcdn.net/jpg/02/52/68/73/240_F_252687355_x6qCu70kdEjb1RRygVreCZXslqq7EDi1.jpg","Instructions: \n 1. Gently pull your lower eyelid  with your index finger. \n 2. Try focusing the camera on the conjunctiva region and take a picture under good lighting.");
    //     //     return;
    //     // }
    //     // else {
    //     if (response.body.isAnemic === false){
    //         anemiaResult = "The Case is not Anemic";
    //     }
    //     else if (response.body.isAnemic === true){
    //         anemiaResult = "The Case is Anemic";
    //     }
    //     else {
    //         anemiaResult = "Result not found";
    //     }
    //     // }
    //     // return this.telegramMessageService.SendMediaMessage(messagetoAnemiaModel.sessionId, null, anemiaResult);
    //     return anemiaResult

    // }

}
