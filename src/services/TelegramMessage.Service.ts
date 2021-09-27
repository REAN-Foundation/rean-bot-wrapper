import { DialogflowResponseService } from './dialogflow-response.service';

export const ReplyTelegramMessage = async (botObject, message) => {
    try {
        const dialog = new DialogflowResponseService();
        let response_message = [];
        if (message.text) {
            response_message = await dialog.getDialogflowMessage(message.text, String(message.from.id));
        } else {
            response_message[0] = 'Please enter text only!!';
        }

        if (response_message[0].length > 4096) {
            var strshortened = response_message[0].slice(0, 3800);
            strshortened = strshortened.substring(0, strshortened.lastIndexOf('\n\n') + 1);
            strshortened = strshortened.replace(/(<\/ b>|<\/b>)/gim, '</b>');
            response_message[0] =
                strshortened +
                '\n\n Too many appointments to display here, please visit the CoWin website - https://www.cowin.gov.in/home -  to view more appointments. \n or \n Enter additional details to filter the results.';
        }
        if (response_message.length > 1) {
            botObject.sendMessage(message.chat.id, response_message[0], { parse_mode: 'HTML' });
            botObject.sendMessage(message.chat.id, response_message[1], { parse_mode: 'HTML' });
        } else {
            botObject.sendMessage(message.chat.id, response_message[0], { parse_mode: 'HTML' });
        }
    } catch (e) {
        console.log('Error:', e);
    }
};
