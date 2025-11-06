/* eslint-disable init-declarations */
import { inject, Lifecycle, scoped } from "tsyringe";
import { ChatSession } from "../models/chat.session.js";
import { EntityManagerProvider } from "./entity.manager.provider.service.js";
import { ClientEnvironmentProviderService } from "./set.client/client.environment.provider.service.js";
import { v2 } from '@google-cloud/translate';

@scoped(Lifecycle.ContainerScoped)
export class ChangeLanguage{

    constructor(
        @inject(EntityManagerProvider) private entityManagerProvider?: EntityManagerProvider,
        // eslint-disable-next-line max-len
        @inject(ClientEnvironmentProviderService) private clientEnvironmentProviderService?: ClientEnvironmentProviderService) {
    }

    private GCPCredentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS);

    private obj = {
        credentials : this.GCPCredentials,
        projectId   : this.GCPCredentials.project_id
    };

    async askForLanguage(eventObj) {
        return new Promise(async(resolve, reject) =>{
            try {
                let reply: string;
                let newLanguage = eventObj.body.queryResult.parameters.Language.toLowerCase();
                if (!eventObj.body.queryResult.parameters.Language) {
                    newLanguage = eventObj.body.queryResult.queryText.toLowerCase();
                }

                const userId = eventObj.body.originalDetectIntentRequest.payload.userId;

                // Connecting to the google translate service to fetch the list of languages
                const translate = new v2.Translate(this.obj);
                const languages = await translate.getLanguages();

                const targetLanguageCode = await this.getCodeByName(newLanguage, languages[0]);
                if (targetLanguageCode === null){
                    reply = "We apologize for the inconvenience. We currently do not support this language.";
                }

                // eslint-disable-next-line max-len
                const chatSessionRepository = (await this.entityManagerProvider.getEntityManager(this.clientEnvironmentProviderService)).getRepository(ChatSession);
                await chatSessionRepository.update({ preferredLanguage: targetLanguageCode }, {
                    where : {
                        userPlatformID : userId
                    }
                });

                //create a new session
                reply = `Language changed to: ${newLanguage}`;
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

    async getCodeByName(inputlanguage: string, data) {
        const result = data.find(item => item.name.toLowerCase() === inputlanguage);
        return result ? result.code : null;
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
