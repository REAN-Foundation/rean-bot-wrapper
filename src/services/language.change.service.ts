import { inject, Lifecycle, scoped } from "tsyringe";
import { ChatSession } from "../models/chat.session";
import { EntityManagerProvider } from "./entity.manager.provider.service";

@scoped(Lifecycle.ContainerScoped)
export class ChangeLanguage{

    constructor(
        @inject(EntityManagerProvider) private entityManagerProvider?: EntityManagerProvider) {
    }

    async askForLanguage(eventObj) {
        return new Promise(async(resolve, reject) =>{
            try {
                console.log("eventobj.body", eventObj.body);
                const newLanguage = eventObj.body.queryResult.queryText.toLowerCase();
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
                // eslint-disable-next-line max-len
                const chatSessionRepository = (await this.entityManagerProvider.getEntityManager()).getRepository(ChatSession);
                await chatSessionRepository.update({ sessionOpen: "false" }, {
                    where : {
                        userPlatformID : userId
                    }
                });

                //create a new session
                await chatSessionRepository.create({ userPlatformID: userId, preferredLanguage: newLanguageCode, sessionOpen: "true" });
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
