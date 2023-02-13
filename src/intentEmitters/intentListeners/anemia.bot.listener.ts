/* eslint-disable max-len */
import { Logger } from '../../common/logger';
import { container } from 'tsyringe';
import { CallAnemiaModel } from '../../services/call.anemia.model';
import { needleRequestForWhatsapp, needleRequestForTelegram } from '../../services/needle.service';

const callAnemiaModel: CallAnemiaModel = container.resolve(CallAnemiaModel);

export const AnemiaBotListener = async (intent, eventObj) => {
    return new Promise(async (resolve, reject) => {

        // let res;
        try {
            Logger.instance()
                .log('Calling Anemia Bot Service !!!!!!');

            const messageToPlatform = await callAnemiaModel.callAnemiaModel(eventObj.body.queryResult.queryText);

            if (eventObj.body.originalDetectIntentRequest.payload.completeMessage.platform !== "Telegram") {
                const endPoint = 'messages';
                const postData = {
                    "messaging_product" : "whatsapp",
                    "recipient_type"    : "individual",
                    "to"                : eventObj.body.originalDetectIntentRequest.payload.userId,
                    "type"              : "text",
                    "text"              : {
                        "body" : messageToPlatform
                    }
                };

                await needleRequestForWhatsapp("post", endPoint, JSON.stringify(postData));
            }
            else {
                const postData = {
                    chat_id : eventObj.body.originalDetectIntentRequest.payload.userId,
                    text    : messageToPlatform
                };
                const endPoint = `sendMessage`;
                await needleRequestForTelegram("post",endPoint,postData);
            }

        } catch (error) {
            Logger.instance()
                .log_error(error.message, 500, 'Anemia Bot Listener Error!');
            reject(error.message);
        }
    });
};
