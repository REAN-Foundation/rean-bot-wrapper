export  class dialoflowMessageFormatting {

    triggerIntentWithMessage(intent,message,eventObj){
         
        const data = {
            "fulfillmentMessages" : [
                {
                    "text" : {
                        "text" : [
                            message
                        ]
                    }
                }
            ],
            "followupEventInput" : {
                "name"         : intent,
                "languageCode" : "en-US",
                "parameters"   : eventObj.body.queryResult.parameters
            }
        };
        return data;
    }

    async triggerIntent(triggering_event:string, eventObj){
        return {
            "followupEventInput" : {
                "name"         : triggering_event,
                "languageCode" : "en-US",
                "parameters"   : eventObj.body.queryResult.parameters
            }
        };
    }

    async makingResponseWithButtons(dffMessage,buttons  ){
        return { "fulfillmentMessages": [{ "text": { "text": [dffMessage] } }, buttons] };
    }

    async making_response(response){
        const data = {
            "fulfillmentMessages" : [{ "text": { "text": [response] } }],
        };
        return data;
    }

}
