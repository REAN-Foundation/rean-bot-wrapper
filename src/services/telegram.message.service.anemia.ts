
// // import { DialogflowResponseService } from './dialogflow-response.service';
// import { message } from '../refactor/interface/message.interface';
// import { autoInjectable, singleton, inject, delay } from 'tsyringe';
// import  TelegramBot  from 'node-telegram-bot-api';
// import { MessageFlow } from './get.put.message.flow.service';
// import { platformServiceInterface } from '../refactor/interface/platform.interface';
// import { TelegramMessageServiceFunctionalities } from '../services/telegram.message.service.functionalities';
// // eslint-disable-next-line @typescript-eslint/no-unused-vars
// import { clientAuthenticator } from './clientAuthenticator/client.authenticator.interface';
// import { ClientEnvironmentProviderService } from './set.client/client.environment.provider.service';
// import { AnemiaModel } from './anemia.service';

// @autoInjectable()
// @singleton()
// export class TelegramAnemiaMessageService implements platformServiceInterface{

//     public _telegram: TelegramBot = null;

//     public res;

//     // public req;
//     constructor(@inject(delay(() => MessageFlow)) public messageFlow,
//         private telegramMessageServiceFunctionalities?: TelegramMessageServiceFunctionalities,
//         private clientEnvironmentProviderService?: ClientEnvironmentProviderService,
//         private anemiaModel?: AnemiaModel,
//         @inject("telegram.authenticator") private clientAuthenticator?: clientAuthenticator) {
//         this._telegram = new TelegramBot(this.clientEnvironmentProviderService.getClientEnvironmentVariable("TELEGRAM_BOT_TOKEN"));
//         this.init();
//     }

//     // eslint-disable-next-line @typescript-eslint/no-unused-vars
//     handleMessage(msg, _channel: string){
//         this._telegram.processUpdate(msg);
//         console.log("message sent to events");
//         return null;
//     }

//     // eslint-disable-next-line @typescript-eslint/no-unused-vars
//     sendManualMesage(msg){
//         return this.messageFlow.send_manual_msg(msg, this);
//     }

//     init(){
//         this._telegram.on('message', msg => {

//             // this.messageFlow.get_put_msg_Dialogflow(msg, "telegram", this);
//             this.anemiaModel.get_put_AnemiaResult(msg, "telegram");
//         });
//     }

//     setWebhook(clientName){
//         this._telegram = new TelegramBot(this.clientEnvironmentProviderService.getClientEnvironmentVariable("TELEGRAM_BOT_TOKEN"));
//         const webhookUrl = this.clientEnvironmentProviderService.getClientEnvironmentVariable("BASE_URL") + '/v1/' + clientName + '/anemiaTelegram/' + this.clientAuthenticator.urlToken + '/receive';
//         this._telegram.setWebHook(webhookUrl);

//         // console.log("url tele",webhookUrl)
//         console.log("Telegram webhook for anemia set," );
//     }

//     // eslint-disable-next-line @typescript-eslint/no-unused-vars
//     getMessage(msg: any) {
//         throw new Error('Method not implemented.');
//     }

//     // eslint-disable-next-line @typescript-eslint/no-unused-vars
//     postResponse(messagetoDialogflow: message, process_raw_dialogflow: any) {
//         throw new Error('Method not implemented.');
//     }

//     // eslint-disable-next-line @typescript-eslint/no-unused-vars
//     SendMediaMessage(sessionId: string, messageBody: string, messageText: string) {
//         throw new Error('Method not implemented.');
//     }

//     // eslint-disable-next-line @typescript-eslint/no-unused-vars
//     createFinalMessageFromHumanhandOver(requestBody: any) {
//         throw new Error('Method not implemented.');
//     }

// }
