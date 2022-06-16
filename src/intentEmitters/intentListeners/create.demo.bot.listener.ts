import { demoBotService } from '../../services/demoBot.service';

export const createDemoBot = async (intent, eventObj) => {
    const DemoBotService = new demoBotService();
    return new Promise(async (resolve,reject) => {
        try {
            console.log("This is creating a demo bot");
            const payload = eventObj.body.originalDetectIntentRequest.payload;
            const data = {
                "fulfillmentMessages" : [
                    {
                        "text" : {
                            "text" : [
                                "We have received the file and creating a bot. You can start using the bot once we notify you."
                            ]
                        }
                    }
                ]
            };
            resolve(data);

            const excel_data = await DemoBotService.readExcel(eventObj.body.queryResult.queryText);
            console.log("This is the excel data we are getting");
            console.log(excel_data);
            const create_bot = await DemoBotService.createIntent(excel_data, payload.userId);

            if (create_bot){
                await DemoBotService.postResponseDemo(payload.userId,payload.source, "Bot is ready to use");
            }
        } catch (error) {
            console.log(error);
        }
    });
};