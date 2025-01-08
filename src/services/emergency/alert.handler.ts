// import { inject, Lifecycle, scoped } from "tsyringe";
// import { EntityManagerProvider } from "../entity.manager.provider.service";
// import { ClientEnvironmentProviderService } from "../set.client/client.environment.provider.service";
// import { error } from "console";

// @scoped(Lifecycle.ContainerScoped)
// // eslint-disable-next-line @typescript-eslint/no-unused-vars
// export class AlertHandler {

//     constructor (
//         @inject(EntityManagerProvider) private entityManagerProvider?: EntityManagerProvider,
//         // eslint-disable-next-line max-len
//         @inject(ClientEnvironmentProviderService) private clientEnvironmentProviderService?
//          : ClientEnvironmentProviderService
//     ){}

//     /**
//      * Processes an incoming alert request, extracts and logs relevant information.
//      *
//      * @param req - The request object containing the alert message data.
//      *
//      * The function retrieves the client name from the environment variables,
//      * and extracts the message text, reporter's name, and phone number from the request body.
//      * It logs the extracted information for further processing.
//      */

//     async commenceAlertFunc(msg, channel){
//         try {

//             var messageType = msg.type;
//             var textMessage = msg.messageBody;
//             var reporterName = msg.name;
//             var phoneNumber = msg.platformId;
//             var  messageChannel = msg.platform;
//             var latlog = msg.latlog;
//             var intent = msg.intent;
//             var responseMessageID = msg.responseMessageID;
//             var contextId = msg.contextId;
//             const params = {
//                 // "clientEnvironment" : clientName,
//                 "reporterName"      : reporterName,
//                 "messageType"       : messageType,
//                 "phoneNumber"       : phoneNumber,
//                 "text"              : textMessage,
//                 "platformName"      : messageChannel,
//                 "latlog"            : latlog,
//                 "intent"            : intent,
//                 "responseMessageID" : responseMessageID,
//                 "contextId"         : contextId
//             };
//             console.log("params",params);
//             return params;
//         }
//         catch (error){
//             console.log(error);
//             return error;
//         }
//     }
// }
