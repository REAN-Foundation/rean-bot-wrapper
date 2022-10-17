import { ChatSession } from "../models/chat.session";

export class ChangeLanguage{

    async askForLanguage(eventObj) {
        return new Promise(async(resolve, reject) =>{
            try {
                console.log("eventobj.body", eventObj.body);
                const newLanguage = eventObj.body.queryResult.queryText.toLowerCase();
                const userId = eventObj.body.originalDetectIntentRequest.payload.userId;
                const listOfLanguages = {
                    "hindi"   : "hi",
                    "english" : "en",
                    "tamil"   : "ta",
                    "telugu"  : "te",
                    "punjabi" : "pa"
                };
                const newLanguageCode = await this.languageCode(newLanguage,listOfLanguages);
                //stop the old session
                await ChatSession.update({ sessionOpen: "false" }, {
                    where : {
                        userPlatformID : userId
                    }
                });
                // const chatsessionUpdateObj = await ChatSession.update({ sessionOpen: "false" }, { where: { userPlatformID: sessionId } });
                //create a new session
                const newSession = new ChatSession({ userPlatformID: userId, preferredLanguage: newLanguageCode, sessionOpen: "true" });
                await newSession.save();
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
                console.log("property", property);
                if (property === newLanguage){
                    const newLanguage = listOfLanguages[property];
                    console.log("newlanguage", newLanguage);
                    resolve(newLanguage);
                }
                 
            }

        });
    }

}
