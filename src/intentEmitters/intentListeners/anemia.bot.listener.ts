/* eslint-disable max-len */
import { Logger } from '../../common/logger';
import { CallAnemiaModel } from '../../services/call.anemia.model';
import { NeedleService } from '../../services/needle.service';
import { RekognitionService } from '../../services/anemia-aws-rekognition-model';
import { ClientEnvironmentProviderService } from '../../services/set.client/client.environment.provider.service';

// import { container } from 'tsyringe';

export const AnemiaBotListener = async (intent, eventObj) => {
    const callAnemiaModel: CallAnemiaModel = eventObj.container.resolve(CallAnemiaModel);
    const rekognitionService: RekognitionService = eventObj.container.resolve(RekognitionService);
    const clientEnvironmentProviderService: ClientEnvironmentProviderService = eventObj.container.resolve(
        ClientEnvironmentProviderService);
    try {
        Logger.instance()
            .log('Calling Anemia Bot Service !!!!!!');
        const useAwsRekognitionAnemiaModel = clientEnvironmentProviderService.getClientEnvironmentVariable('USE_AWS_REKOGNITION_ANEMIA_MODEL');
        let messageToPlatform = '';
        if (useAwsRekognitionAnemiaModel === 'true') {
            messageToPlatform = await rekognitionService.detectAnemia(eventObj.body.queryResult.queryText);
            const dfFulfillmentCustomResponse = {
                "fulfillmentMessages" : [
                    {
                        "text" : {
                            "text" : [
                                messageToPlatform
                            ]
                        }
                    }
                ]
            };
            return dfFulfillmentCustomResponse;
        }
        else {
            messageToPlatform = await callAnemiaModel.callAnemiaModel(eventObj.body.queryResult.queryText);
            if ((eventObj.body.originalDetectIntentRequest.payload.source).toLowerCase() === "telegram") {
                sendMessageToTelegram(messageToPlatform,eventObj);
            }
            else if ((eventObj.body.originalDetectIntentRequest.payload.source).toLowerCase() === "whatsapp") {
                sendMessageToWhatsapp(messageToPlatform,eventObj);
            }
            else if ((eventObj.body.originalDetectIntentRequest.payload.source).toLowerCase() === "whatsappmeta") {
                sendMessageToWhatsappMeta(messageToPlatform,eventObj);
            }
            else {
                console.log(`Channel ${eventObj.body.originalDetectIntentRequest.payload.source} service doesnot exist`);
            }
        }

    } catch (error) {
        Logger.instance()
            .log_error(error.message, 500, 'Anemia Bot Listener Error!');
    }

};

const sendMessageToWhatsappMeta = async(messageToPlatform,eventObj) => {
    const needleService: NeedleService = eventObj.container.resolve(NeedleService);
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
    const payload = eventObj.body.originalDetectIntentRequest.payload;
    payload.completeMessage.messageType = 'text';
    payload.completeMessage.messageBody = messageToPlatform;
    payload.completeMessage.intent = 'nearest.location.send';
    await needleService.needleRequestForWhatsappMeta("post", endPoint, JSON.stringify(postData), payload);
};

const sendMessageToTelegram = async(messageToPlatform,eventObj) => {
    const needleService: NeedleService = eventObj.container.resolve(NeedleService);
    const postData = {
        chat_id : eventObj.body.originalDetectIntentRequest.payload.userId,
        text    : messageToPlatform
    };
    const endPoint = `sendMessage`;
    await needleService.needleRequestForTelegram("post",endPoint,postData);
};

const sendMessageToWhatsapp = async(messageToPlatform,eventObj) => {
    const needleService: NeedleService = eventObj.container.resolve(NeedleService);
    const endPoint = '/v1/messages';
    const postdata = {
        "messaging_product" : "whatsapp",
        "recipient_type"    : "individual",
        "to"                : eventObj.body.originalDetectIntentRequest.payload.userId,
        "type"              : "text",
        "text"              : {
            "body" : messageToPlatform
        }
    };
    await needleService.needleRequestForWhatsapp("post", endPoint, JSON.stringify(postdata));
};
