import { Logger } from "../../common/logger";
import { GetCalorieReport } from "../../services/calorie.report.service";
import { dialoflowMessageFormatting } from "../../services/Dialogflow.service";
import { NeedleService } from "../../services/needle.service";
import { AwsS3manager } from "../../services/aws.file.upload.service";
import  TelegramBot  from 'node-telegram-bot-api';
import fs from 'fs';

export const calorieReport = async ( intent, eventObj ) => {
    try {
        // eslint-disable-next-line max-len
        const dialoflowMessageFormattingObj: dialoflowMessageFormatting = eventObj.container.resolve(dialoflowMessageFormatting);
        const response = "We are processing your request. Please wait for a while.";
        const to_send = dialoflowMessageFormattingObj.making_response(response);
        calorieReportNextSteps(intent,eventObj);
        return to_send;
    } catch (error) {
        Logger.instance()
            .log_error(error.message,500,'Calorie report creation listener error');
        throw new Error("Calorie report listener error");
    }

    async function calorieReportNextSteps(intent,eventObj){
        let res;
        const needleService: NeedleService = eventObj.container.resolve(NeedleService);
        const getCalorieReport:GetCalorieReport = eventObj.container.resolve(GetCalorieReport);
        const awss3Manager:AwsS3manager = eventObj.container.resolve(AwsS3manager);
        const payload = eventObj.body.originalDetectIntentRequest.payload;

        const user_data = await getCalorieReport.getCalorieReport(eventObj,res);
        const bucket_name = process.env.TEMP_BUCKET_NAME;
        const cloud_front_path = process.env.TEMP_CLOUD_FRONT_PATH;
        
        const file_upload = await awss3Manager.createFileFromHTML(user_data);
        console.log("Calorie report has been uploaded to " + file_upload);
        const file_url = await awss3Manager.uploadFileToS3(file_upload, bucket_name, cloud_front_path);
        const channel = payload.source.toLowerCase();

        payload.completeMessage.imageUrl = file_url;
        payload.completeMessage.messageType = 'image';
        payload.completeMessage.messageBody = null;
        payload.completeMessage.intent = 'calorie.report.send';
        console.log("Printing the payload here", payload);

        if (channel === 'whatsappmeta' || channel === 'whatsapp'){
            const postDataMeta = {
                "messaging_product" : "whatsapp",
                "recipient_type"    : "individual",
                "to"                : payload.userId,
                "type"              : "image",
                "image"             : {
                    "link" : file_url
                }
            };
            const endPoint = 'messages';
            await needleService.needleRequestForWhatsappMeta("post", endPoint, postDataMeta, payload);
        } else {
            const postData = {
                chat_id : eventObj.body.originalDetectIntentRequest.payload.userId,
                photo   : encodeURI(file_url),
            };
            await needleService.needleRequestForTelegram("post", "sendPhoto", postData, payload);
        }
    }
};
