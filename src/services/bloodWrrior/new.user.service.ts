import { Logger } from '../../common/logger';

export class NewUserService {

    async newUserService () {
        try {
            const dffMessage = `Welcome Dear Blood Warrior, \nYou can chat here to know more about Thalassemia and Blood Donation 
                        or \nYou could also sign up to support Thalassemia patients as a Blood Donor. \nThis is your home menu, Click on any of them 
                        or \nwherever you are just type "MENU" to access the Home Menu.`;
            console.log(dffMessage);

            const data = {
                "fulfillmentMessages" : [
                    {
                        "text" : { "text": [dffMessage] }
                    },
                    {
                        "payload" : {
                            "buttons" : [
                                {
                                    "type"  : "reply",
                                    "reply" : {
                                        "id"    : "Register_Patient",
                                        "title" : "Register as Patient"
                                    }
                                },
                                {
                                    "reply" : {
                                        "title" : "Ask Questions",
                                        "id"    : "Ask_Questions"
                                    },
                                    "type" : "reply"
                                },
                                {
                                    "reply" : {
                                        "title" : "Register as Donor",
                                        "id"    : "Register_Donor"
                                    },
                                    "type" : "reply"
                                }
                            ],
                            "messagetype" : "interactive-buttons"
                        }
                    }
                ]
            };
            return await { sendDff: true, message: data };

        } catch (error) {
            Logger.instance()
                .log_error(error.message,500,'Register new user with blood warrior service error');
        }
    }

}
