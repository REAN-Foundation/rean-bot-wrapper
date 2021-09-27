import { ResponseHandler } from '../../utils/response.handler';
import { ErrorHandler } from '../../utils/Error.Handler';
import { WhatsappMessageService } from '../../services/whatsapp-message.service';
import { DialogflowResponseService } from '../../services/dialogflow-response.service';
import { injectable } from 'tsyringe';

@injectable()
export class WhatsappWebhookController{

    constructor(private whatsappMessageUtility?: WhatsappMessageService,
                private responseHandler?: ResponseHandler,
                private errorHandler?: ErrorHandler,
                private dialogflowMessageUtility?: DialogflowResponseService) {
    }

    sendMessage = async (req, res) => {
        try {
            const responce = this.whatsappMessageUtility.SendWhatsappMessage(req.body.contact, req.body.message);
            if (responce) this.responseHandler.sendSuccessResponse(res, 200, 'Message sent successfully!', responce);
            else
                this.responseHandler.sendFailureResponse(res, 200, 'An error occurred while sending messages!', req);
        }
        catch (error) {
            this.errorHandler.handle_controller_error(error, res, req);
        }
    };

    emojiUnicode(emoji) {
        var comp;
        if (emoji.length === 1) {
            comp = emoji.charCodeAt(0);
        }
        comp = (
            (emoji.charCodeAt(0) - 0xD800) * 0x400
            + (emoji.charCodeAt(1) - 0xDC00) + 0x10000
        );
        if (comp < 0) {
            comp = emoji.charCodeAt(0);
        }
        return comp.toString("16");
    }

    receiveMessage = async (req, res) => {
        try {

            //to prevent whatsapp from sending duplicate calls, respond emidiately
            this.responseHandler.sendSuccessResponse(res, 200, 'Message received successfully!', "");
            if (req.body.statuses) {

                // status = sent, received & read
            }
            else {
                let response_message = [];
                const whatsapp_id = req.body.contacts[0].wa_id;
                if (req.body.messages[0].type == "text") {
                    let message = req.body.messages[0].text.body;

                    const regexExp = /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/gi;

                    if (regexExp.test(message)) {
                        message = this.emojiUnicode(message) == "1f44e" ? "NegativeFeedback" : "PositiveFeedback";
                    }
                    response_message = await this.dialogflowMessageUtility.getDialogflowMessage(message, whatsapp_id);
                }
                else if (req.body.messages[0].type == "location") {
                    const message = `latlong:${req.body.messages[0].location.latitude}-${req.body.messages[0].location.longitude}`;
                    response_message = await this.dialogflowMessageUtility.getDialogflowMessage(message, whatsapp_id);
                }
                else {
                    response_message[0] = "Please enter text/location only!!";
                }

                if (response_message) {
                    var responce;
                    if (response_message.length > 1) {
                        responce = this.whatsappMessageUtility.SendWhatsappMessage(whatsapp_id, response_message[0]);
                        responce = this.whatsappMessageUtility.SendWhatsappMessage(whatsapp_id, response_message[1]);
                    }
                    else {
                        responce = this.whatsappMessageUtility.SendWhatsappMessage(whatsapp_id, response_message[0]);
                    }
                    if (!responce) {
                        this.responseHandler.sendFailureResponse(res, 200, 'An error occurred while sending messages!', req);
                    }
                }
                else {
                    this.responseHandler.sendFailureResponse(res, 200, 'An error occurred while processing messages!', req);
                }
            }
        }
        catch (error) {
            console.log("in error", error);
            this.errorHandler.handle_controller_error(error, res, req);
        }
    };

}
