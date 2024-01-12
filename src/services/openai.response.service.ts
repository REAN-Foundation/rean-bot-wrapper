/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/no-var-requires */
import { inject, Lifecycle, scoped } from 'tsyringe';
import { ClientEnvironmentProviderService } from './set.client/client.environment.provider.service';

const { Configuration, OpenAIApi } = require("openai");

import OpenAI from 'openai';

// import { Configuration, OpenAIApi } from "openai";
import { OpenAIResponseFormat } from './response.format/openai.response.format';
import { EntityManagerProvider } from './entity.manager.provider.service';
import { ChatMessage } from '../models/chat.message.model';

@scoped(Lifecycle.ContainerScoped)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export class OpenAIResponseService {

    constructor(@inject(ClientEnvironmentProviderService) private clientEnvironment?: ClientEnvironmentProviderService,
    @inject(EntityManagerProvider) private entityManagerProvider?: EntityManagerProvider) { }

    getOpenaiMessage = async (key: string, message: string) => {
        try {

            // const configuration = new Configuration({
            //     apiKey : this.clientEnvironment.getClientEnvironmentVariable("OPENAI_API_KEY"),
            // });
            // const openai = new OpenAIApi(configuration);

            const openai = new OpenAI({
                apiKey : process.env.OPENAI_API_KEY // This is also the default, can be omitted
            });

            // const chatMessageRepository = (await this.entityManagerProvider.getEntityManager(this.clientEnvironment)).getRepository(ChatMessage);
            // const chatMessageResponse = (await chatMessageRepository.findAll({
            //     order  : [ [ 'createdAt', 'DESC' ] ],
            //     offset : 1,
            //     limit  : 2
            // }));

            // const completion = await openai.createChatCompletion({
            //     model    : "gpt-3.5-turbo",
            //     messages : [{ role: "system", content: "Calorie calculating Bot" },
            //         { role: "user", content: chatMessageResponse[1].messageContent },
            //         { role: "assistant", "content": chatMessageResponse[0].messageContent },
            //         { role: "user", "content": message }]
            // });
            
            //currently this implementation is for nutrition bot. To make it general, move the nutrtion bot specific prompt to its service
            const prompt = this.getPrompt(key, message);
            if (prompt == null) {
                return null;
            }

            //const createCompletion = await openai.chat.completions.create(prompt);
            const createCompletion = await openai.chat.completions.create(prompt);

            //     messages : [{ role: 'user', content: prompt }],
            //     model    : 'gpt-3.5-turbo',
            // });

            //console.log(createCompletion.choices[0].text);
            console.log(createCompletion.choices[0]?.message?.content);
            const response = new OpenAIResponseFormat(createCompletion);
            return response;
            
        }
        catch (e) {
            console.log(e);
        }

    };

    getPrompt = (key: string, message: string) => {
        var prompt = null;
        if (key === "CALORIE_BOT") {
            prompt = {
                messages : [{ role    : 'user', content : `${message} Provide the calorie and nutritional report in json. The json format should be:{
                    "list_of_food": [{
                        "food":
                        "quantity":
                        "calorie":
                        "fat":
                        "protein":
                        "fibre":
                        "calcium":
                        "carbohydrate":
                        "cholesterol":
                        "iron":
                        "saturated_fat":
                        "meal_type":
                    }],
                    "total_calorie_intake":
                    "total_fat_intake":
                    "total_protein_intaket":
                    "total_fibre_intake":
                    "summary":
                }. In the json, attach a summary of the nutritional report.`, }],
                model             : "gpt-3.5-turbo",
                temperature       : 0,
                max_tokens        : 1000,
                top_p             : 1.0,
                frequency_penalty : 0.0,
                presence_penalty  : 0.0,
            };
        } else if (key === "REMINDERS") { // change the name to where you wanted to create reminders in bot
            prompt = {
                model    : "gpt-3.5-turbo",
                messages : [{ role    : 'user', content : `${message} Provide the reminders details in json. Do not give older year date. The json format should be:
                { "TaskName": 
                  "TaskType": "medication" or "exercise" or "other" 
                  "Frequency": "Daily" or "Monthly" or "Weekly" or "Once" or "Hourly" or "Quarterly" or "Yearly"
                  "DayName": "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
                  "StartDateTime": Take current year by default
                  "MedicineName": NA, if not available
                } If you are unable to find any information, fill the JSON value with 'NA'. Please do not assume other information.`, }],
                temperature       : 0,
                max_tokens        : 1000,
                top_p             : 1.0,
                frequency_penalty : 0.0,
                presence_penalty  : 0.0,
            };

            //If date time is not found in phrase then, give "StartDateTime" as todays date.
            //Do not give past dates and convert it into date time javascript format.
        }
        return prompt;

    };

}
