import { NeedleService } from '../../services/needle.service.js';
import { Logger } from '../../common/logger.js';
import { OpenAIResponseService } from '../../services/openai.response.service.js';

const sendMessageToTelegram = async(messageToPlatform,eventObj) => {
    const needleService: NeedleService = eventObj.container.resolve(NeedleService);
    const postData = {
        chat_id : eventObj.body.originalDetectIntentRequest.payload.userId,
        text    : messageToPlatform
    };
    console.log("postData Telegam", postData);
    const endPoint = `sendMessage`;
    const payload = eventObj.body.originalDetectIntentRequest.payload;
    await needleService.needleRequestForTelegram("post", endPoint, postData, payload);
};

export const OpenAiListener = async (intent, eventObj) => {
    try {
        Logger.instance()
            .log('OpenAi Listener !!!!!');

        let response = null;
        const openAiService = eventObj.container.resolve(OpenAIResponseService);
        const payload = eventObj.body.originalDetectIntentRequest.payload;
        const message = payload.completeMessage.messageBody;
        const formattedResponse = await openAiService.getOpenaiMessage(message);
        const openAiTextReply = await formattedResponse.getText();
        const data = {
            "fulfillmentMessages" : [
                {
                    "text" : {
                        "text" : [
                            openAiTextReply[0]
                        ]
                    }
                }
            ]
        };
        if (data.fulfillmentMessages[0].text.text[0] === "please give me a moment"){
            console.log("inside if");
            response = await sendMessageToTelegram(openAiTextReply[0],eventObj);
        }
        else {
            console.log("inside else");
            return data;
        }

        if (!response) {
            console.log('I am failed');
            throw new Error("Negative feedback service failed");
        }

    } catch (error) {
        Logger.instance()
            .log_error(error.message, 500, 'Negative Feedback Listener Error!');
        throw new Error("Negative feedback listener error");
    }

};
