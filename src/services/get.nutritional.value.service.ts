import { CalorieInfo } from '../models/calorie.info.model';
import { OpenAIResponseService } from '../services/openai.response.service';
import { EntityManagerProvider } from '../services/entity.manager.provider.service';
import { ClientEnvironmentProviderService } from '../services/set.client/client.environment.provider.service';
import { NeedleService } from '../services/needle.service';

export class NutritionalValue{

    async getNutritionalValue(eventObj){
        try {
            const openAiService = eventObj.container.resolve(OpenAIResponseService);
            const entityManagerProvider = eventObj.container.resolve(EntityManagerProvider);
            const clientEnvironmentProviderService = eventObj.container.resolve(ClientEnvironmentProviderService);
            const payload = eventObj.body.originalDetectIntentRequest.payload;
            const message = payload.completeMessage.messageBody;
            const formattedResponse = await openAiService.getOpenaiMessage(message);
            const openAiTextReply = await formattedResponse.getText();
            const openAiTextReplyToJson = JSON.parse(openAiTextReply[0].replace( /[\r\n]+/gm, "" ));
            const summaryOfNutritionalValue = openAiTextReplyToJson.summary;
            await this.sendMessageToTelegram(summaryOfNutritionalValue,eventObj);
            openAiTextReplyToJson.list_of_food.forEach(async element => {
                const calorieInfoObj = {
                    user_id           : payload.completeMessage.platformId,
                    user_message      : message,
                    fs_message        : summaryOfNutritionalValue,
                    units             : element.quantity,
                    calories          : element.calorie,
                    user_calories     : null,
                    meal_type         : element.meal_type,
                    negative_feedback : null,
                    calories_updated  : null,
                    meta_data         : JSON.stringify(openAiTextReplyToJson),
                    record_date       : new Date().toISOString()
                        .slice(0,19)
                        .replace('T',' ')
                };
                // eslint-disable-next-line max-len
                const calorieInfoRepository = (await entityManagerProvider.getEntityManager(clientEnvironmentProviderService)).getRepository(CalorieInfo);
                await calorieInfoRepository.create(calorieInfoObj);

            });
        }
        catch (error){
            console.log("get nutritional value service error", error);
        }
    }

    sendMessageToTelegram = async(messageToPlatform,eventObj) => {
        const needleService: NeedleService = eventObj.container.resolve(NeedleService);
        const postData = {
            chat_id : eventObj.body.originalDetectIntentRequest.payload.userId,
            text    : messageToPlatform
        };
        console.log("postData Telegam", postData);
        const endPoint = `sendMessage`;
    
        const payload = eventObj.body.originalDetectIntentRequest.payload;
        payload.completeMessage.messageType = 'text';
        payload.completeMessage.messageBody = messageToPlatform;
        payload.completeMessage.intent = 'nutritional.value.send';
        return await needleService.needleRequestForTelegram("post",endPoint,postData, payload);
    };

}
