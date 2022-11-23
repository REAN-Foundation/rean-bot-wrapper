export const eyeSymptoms = async (req,intent) => {
    return new Promise(async (resolve, reject) => {
        try {
            console.log("HELOOOOOO");
            const params = req.body.queryResult.parameters;
            var flag = 0;
            for (const symptoms of Object.entries(req.body.queryResult.parameters)){
                if (symptoms[1]['name'] === "Yes"){
                    if (symptoms[0] === intent){
                        if (params.Frequency){
                            symptoms[1]['Frequency'] = params.Frequency;
                            delete params.Frequency;
                        } else if (symptoms[1]['Frequency']){
                            params.Frequency = symptoms[1]['Frequency'];
                        }
                        if (params.Duration){
                            symptoms[1]['Duration'] = params.Duration;
                            delete params.Duration;
                        } else if (symptoms[1]['Duration']){
                            params.Duration = symptoms[1]['Duration'];
                        }
                        if (params.Position){
                            symptoms[1]['Position'] = params.Position;
                            delete params.Position;
                        } else if (symptoms[1]['Position']){
                            params.Position = symptoms[1]['Position'];
                        }
                    }
                    if (!symptoms[1]['Frequency'] || !symptoms[1]['Duration']){
                        if (intent === "whiteSpot"){
                            if (symptoms[1]['Duration'] || symptoms[1]['Position']){
                                const data = {
                                    "fulfillmentMessages" : [
                                        {
                                            "text" : {
                                                "text" : [
                                                    "Thank you for your response"
                                                ]
                                            }
                                        }
                                    ],
                                };
                                resolve(data);
                                break;
                            }
                        } else {
                            const data = {
                                "followupEventInput" : {
                                    "name"         : symptoms[0],
                                    "languageCode" : "en-US",
                                    "parameters"   : params
                                }
                            };
                            flag = 1;
                            resolve(data);
                            break;
                        }
                    } else {
                        continue;
                    }
                }
                console.log(typeof symptoms[1]);
            }
            if (flag !== 1){
                const data = {
                    "fulfillmentMessages" : [
                        {
                            "text" : {
                                "text" : [
                                    "Thank you for your response"
                                ]
                            }
                        }
                    ],
                };
                resolve(data);
            }
        }
        catch (error) {
            console.log(error.message, 500, "Covid Info Service Error!");
            reject(error.message);
        }
    });

};
