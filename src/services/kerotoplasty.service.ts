export class kerotoplasty_service {

    trigger_intent(triggering_event:string, eventObj){
        return { 
            "followupEventInput" : {
                "name"         : triggering_event,
                "languageCode" : "en-US",
                "parameters"   : eventObj.body.queryResult.parameters
            }
        };
    }

    kerotoplasty_response_service = async (eventObj) => {
        if (eventObj) {
            const dropInVision = eventObj.body.queryResult.parameters.complexDropInVision.name;
            const complexSeverePain = eventObj.body.queryResult.parameters.complexSeverePain.name;

            //const params = eventObj.body.queryResult.parameters;
            if (dropInVision === 'Yes' && complexSeverePain === 'Yes')
            {
                return this.trigger_intent('triggerHyperCritical',eventObj);
            } 
            else if (dropInVision === 'Yes' || complexSeverePain === 'Yes') {
                return this.trigger_intent('triggerCritical',eventObj);
            }
            else {
                return this.trigger_intent('triggerNormal',eventObj);
            }
        } else {
            throw new Error(`500, kerotoplasy response Service Error!`);
        }
    };
}
