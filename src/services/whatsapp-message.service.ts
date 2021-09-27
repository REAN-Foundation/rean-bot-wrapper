import http from 'https';
import { injectable } from 'tsyringe';

@injectable()
export class WhatsappMessageService {

    SendWhatsappMessage = async (contact, message) => {
        message = message.replace(/<b> /g, "*").replace(/<b>/g, "*")
            .replace(/ <\/b>/g,"* ")
            .replace(/ <\/ b>/g,"* ")
            .replace(/<\/b>/g,"* ");
        if (message.length > 4096) {

            var strshortened = message.slice(0, 3800);
            strshortened = strshortened.substring(0, strshortened.lastIndexOf("\n\n") + 1);
            message = strshortened + '\n\n Too many appointments to display here, please visit the CoWin website - https://www.cowin.gov.in/home -  to view more appointments. \n or \n Enter additional details to filter the results.';
        }
        return new Promise((resolve, reject) => {
            const postData = JSON.stringify({
                'recipient_type' : 'individual',
                'to'             : contact,
                'type'           : 'text',
                'text'           : {
                    'body' : message
                }
            });

            const options = {
                hostname : process.env.WHATSAPP_LIVE_HOST,
                path     : '/v1/messages',
                method   : 'POST',
                headers  : {
                    'Content-Type' : 'application/json',
                    'D360-Api-Key' : process.env.WHATSAPP_LIVE_API_KEY
                }
            };
            const request = http.request(options, (response) => {
                response.setEncoding('utf8');
                response.on('data', (chunk) => {
                    resolve(true);
                });
                response.on('end', () => {
                    resolve(true);
                });
            });

            request.on('error', (e) => {
                console.error(`problem with request: ${e.message}`);
                reject();
            });

            // Write data to request body
            request.write(postData);
            request.end();
        });
    };

    SetWebHook = async () => {

        return new Promise((resolve, reject) => {
            const postData = JSON.stringify({
                'url' : `${process.env.BASE_URL}/v1/whatsapp/receive`,
            });

            const options = {
                hostname : process.env.WHATSAPP_LIVE_HOST,
                path     : '/v1/configs/webhook',
                method   : 'POST',
                headers  : {
                    'Content-Type' : 'application/json',
                    'D360-Api-Key' : process.env.WHATSAPP_LIVE_API_KEY
                }
            };
            const request = http.request(options, (response) => {
                response.setEncoding('utf8');
                response.on('data', (chunk) => {
                    resolve(true);
                });
                response.on('end', () => {
                    console.log("Whbhook URL set for Whatsapp");
                    resolve(true);
                });
            });

            request.on('error', (e) => {
                console.error(`problem with request: ${e.message}`);
                reject();
            });

            // Write data to request body
            request.write(postData);
            request.end();
        });
    };

}
