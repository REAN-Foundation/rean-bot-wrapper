/* eslint-disable max-len */
import { Logger } from '../../common/logger';
import { container } from 'tsyringe';
import { CallAnemiaModel } from '../../services/call.anemia.model';
import { needleRequestForWhatsapp, needleRequestForTelegram } from '../../services/needle.service';
import { RekognitionService } from '../../services/anemia-aws-rekognition-model';
import { ClientEnvironmentProviderService } from '../../services/set.client/client.environment.provider.service';

const callAnemiaModel: CallAnemiaModel = container.resolve(CallAnemiaModel);
const rekognitionService: RekognitionService = container.resolve(RekognitionService);

export const AnemiaBotListener = async (intent, eventObj) => {
    return new Promise(async (resolve, reject) => {
        // let res;
        try {
            Logger.instance()
                .log('Calling Anemia Bot Service !!!!!!');
            const clientEnvironmentProviderService = new ClientEnvironmentProviderService();
            const useAwsRekognitionAnemiaModel = clientEnvironmentProviderService.getClientEnvironmentVariable('USE_AWS_REKOGNITION_ANEMIA_MODEL');
            let messageToPlatform = '';
            if (useAwsRekognitionAnemiaModel === 'false') {
                messageToPlatform = await callAnemiaModel.callAnemiaModel(eventObj.body.queryResult.queryText);
            }
            else {
                messageToPlatform = await rekognitionService.detectAnemia(eventObj.body.queryResult.queryText);
            }
            
            if (eventObj.body.originalDetectIntentRequest.payload.completeMessage.platform !== "Telegram") {
                sendMessageToWhatsapp(messageToPlatform,eventObj);
            }
            else {
                sendMessageToTelegram(messageToPlatform,eventObj);
            }

        } catch (error) {
            Logger.instance()
                .log_error(error.message, 500, 'Anemia Bot Listener Error!');
            if (eventObj.body.originalDetectIntentRequest.payload.completeMessage.platform !== "Telegram") {
                sendMessageToWhatsapp(error.message,eventObj);
            }
            else {
                sendMessageToTelegram(error.message,eventObj);
            }
            reject(error.message);
        }
    });

};

const sendMessageToTelegram = async(messageToPlatform,eventObj) => {
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
};

const sendMessageToWhatsapp = async(messageToPlatform,eventObj) => {
    const postData = {
        chat_id : eventObj.body.originalDetectIntentRequest.payload.userId,
        text    : messageToPlatform
    };
    const endPoint = `sendMessage`;
    await needleRequestForTelegram("post",endPoint,postData);
};
