import { NeedleService } from '../../services/needle.service';
import { Logger } from '../../common/logger';
import { OpenAIResponseService } from '../../services/openai.response.service';
import { CalorieInfo } from '../../models/calorie.info.model';
import { EntityManagerProvider } from '../../services/entity.manager.provider.service';
import { ClientEnvironmentProviderService } from '../../services/set.client/client.environment.provider.service';

const sendMessageToTelegram = async(messageToPlatform,eventObj) => {
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

export const GetNutritionalValue = async (intent, eventObj) => {
    try {
        Logger.instance()
            .log('GetNutritionalValue Listener !!!!!');
        const openAiService = eventObj.container.resolve(OpenAIResponseService);
        const entityManagerProvider = eventObj.container.resolve(EntityManagerProvider);
        const clientEnvironmentProviderService = eventObj.container.resolve(ClientEnvironmentProviderService);
        const payload = eventObj.body.originalDetectIntentRequest.payload;
        const message = payload.completeMessage.messageBody;
        const formattedResponse = await openAiService.getOpenaiMessage(message);
        const openAiTextReply = await formattedResponse.getText();
        const openAiTextReplyToJson = JSON.parse(openAiTextReply[0].replace( /[\r\n]+/gm, "" ));
        
        const summaryOfNutritionalValue = openAiTextReplyToJson.summary;
        await sendMessageToTelegram(summaryOfNutritionalValue,eventObj);
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
        
    } catch (error) {
        Logger.instance()
            .log_error(error.message, 500, 'GetNutritionalValue Listener Error!');
        throw new Error("GetNutritionalValue listener error");
    }

};
