
export const getRiskAssessment = async (req, res) => {
    return new Promise(async (resolve, reject) => {
        try {
            console.log('START--------');
            const params = req.body.queryResult.parameters ? req.body.queryResult.parameters : '';

            // console.log(params);
            // PB code
            const gen = params.Gender;
            const age = params.Age;
            const weight = params.weight;
            const height = params.height;

            // If 'Risk.Assessment' intent is triggered
            let response = 'Please enter the subject\'s ';
            let flag = false;
            if (gen === '') {
                response += 'gender ';
            }
            if (age === '') {
                flag = true;
                response += "age ";
            }
            if (weight === '') {
                flag = true;
                response += 'weight ';
            }
            if (height === '') {
                flag = true;
                response += 'height ';
            }
            response = response.trim();
            const k = response.lastIndexOf(" ");
            response = response.slice(0, k) + ' and' + response.slice(k) + " (example - 22years 65kg 165cm).";
            if (flag === false) {
                const data = {
                    "followupEventInput" : {
                        "name"         : "collect_info",
                        "languageCode" : "en-US",
                        "parameters"   : params
                    }
                };

                resolve(data);

            } else {

                const data = {
                    "fulfillmentMessages" : [
                        {
                            "text" : {
                                "text" : [
                                    response
                                ]
                            }
                        }
                    ],
                    "outputContexts" : [
                        {
                            "name"          : "projects/dialogueflow-interface/agent/sessions/123456789/contexts/Riskassessmentinfo-followup",
                            "lifespanCount" : 3,
                            "parameters"    : params
                        }
                    ]
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
