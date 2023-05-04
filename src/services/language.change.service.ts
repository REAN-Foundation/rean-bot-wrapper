import { inject, Lifecycle, scoped } from "tsyringe";
import { ChatSession } from "../models/chat.session";
import { EntityManagerProvider } from "./entity.manager.provider.service";
import { ClientEnvironmentProviderService } from "./set.client/client.environment.provider.service";

@scoped(Lifecycle.ContainerScoped)
export class ChangeLanguage{

    constructor(
        @inject(EntityManagerProvider) private entityManagerProvider?: EntityManagerProvider,
        // eslint-disable-next-line max-len
        @inject(ClientEnvironmentProviderService) private clientEnvironmentProviderService?: ClientEnvironmentProviderService) {
    }

    async askForLanguage(eventObj) {
        return new Promise(async(resolve, reject) =>{
            try {
                console.log("eventobj.body", eventObj.body);
                let newLanguage = eventObj.body.queryResult.parameters.Language.toLowerCase();
                if (!eventObj.body.queryResult.parameters.Language) {
                    newLanguage = eventObj.body.queryResult.queryText.toLowerCase();
                }

                const userId = eventObj.body.originalDetectIntentRequest.payload.userId;
                const listOfLanguages = {
                    "hindi"     : "hi",
                    "english"   : "en",
                    "tamil"     : "ta",
                    "telugu"    : "te",
                    "punjabi"   : "pa",
                    "marathi"   : "mr",
                    "malayalam" : "ml",
                    "kannada"   : "kn",
                    "gujarati"  : "gu",
                    "bengali"   : "bn",
                    "assamese"  : "as",
                    "odia"      : "or",
                    "french"    : "fr",
                    "spanish"   : "es"
                };
                const newLanguageCode = await this.languageCode(newLanguage,listOfLanguages);
                
                //stop the old session
                const clientName = this.clientEnvironmentProviderService.getClientEnvironmentVariable("NAME");
                // eslint-disable-next-line max-len
                const chatSessionRepository = (await this.entityManagerProvider.getEntityManager(this.clientEnvironmentProviderService,clientName)).getRepository(ChatSession);
                await chatSessionRepository.update({ preferredLanguage: newLanguageCode }, {
                    where : {
                        userPlatformID : userId
                    }
                });

                //create a new session
                const reply = `Language changed to: ${newLanguage}`;
                const data = {
                    "fulfillmentMessages" : [
                        {
                            "text" : {
                                "text" : [
                                    reply
                                ]
                            }
                        }
                    ]
                };
                resolve(data);
            }
            catch (error) {
                console.log(error, 500, "Language Change Service Error!");
                reject(error.message);
            }
        });
    
    }

    async languageCode(newLanguage, listOfLanguages) {
        return new Promise<string>(async(resolve) => {
            for (const property in listOfLanguages){
                if (property === newLanguage){
                    const newLanguage = listOfLanguages[property];
                    console.log("newlanguage", newLanguage);
                    resolve(newLanguage);
                }
                 
            }

        });
    }

}
