export const getRiskAssessmentInfo = async (req, res) => {
    return new Promise(async (resolve, reject) => {
        try {
            console.log('START--------');
            let params: any = [];
            if (req['body']['queryResult']['intent']['displayName'] != "Risk.assessment.info-no") {
                params = req.body.queryResult.parameters ? req.body.queryResult.parameters : '';
            }
            else {
                params = req.body.queryResult.outputContexts[0].parameters ? req.body.queryResult.outputContexts[0].parameters : '';

            }
            console.log(params);

            //PB code

            const gen = params.Gender;
            const age = params.Age;
            let weight = params.weight;
            let height = params.height;

            params.previouscomplication = params.complication;
            const agenum = age.amount;
            let tot_score = 0;
            if (agenum < 50) {
                tot_score += 1;
            } else if (agenum < 60) {
                tot_score += 2;
            } else if (agenum < 70) {
                tot_score += 4;
            } else { tot_score += 6; }

            tot_score += parseInt(gen);
            weight = weight.amount;

            //        height = params['unit-length']
            height = params.height;
            height = height.amount;
            const bmi = weight / ((height / 100) ** 2);
            // eslint-disable-next-line max-statements-per-line
            if (bmi > 35) { tot_score += 1; }
            params.score = [tot_score];
            let risk_level = '';
            if (tot_score <= 3) {
                risk_level = 'low';
            } else if (tot_score < 5) {
                risk_level = 'moderate';
            } else { risk_level = 'high'; }
            let response = '';

            if (req['body']['queryResult']['intent']['displayName'] != "Risk.assessment.info-no") {
                params.previousscore = params.score;
                if (params.complication.length === 0) {
                    response = risk_level.toUpperCase() + " RISK!!! Of developing complication if you get infected with COVID-19" +
                        " Do you have any health complications?";
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

                } else {
                    if (params.complication.length > 0) {
                        let first_val = params.complication[0];
                        first_val = "trigger_" + first_val;
                        const data = {
                            "followupEventInput" : {
                                "name"         : first_val,
                                "languageCode" : "en-US",
                                "parameters"   : params
                            }
                        };
                        resolve(data);
                    }
                }
            }
            else {
                const genderText = gen == "1" ? 'Male' : 'Female';
                risk_level = '';
                if (params.previousscore <= 3) {
                    risk_level = 'low';
                } else if (params.previousscore < 5) {
                    risk_level = 'moderate';
                } else { risk_level = 'high'; }
                let finalScore = 0;
                if (params.previousscore.length > 0) {

                    for (let i = 0; i < params.previousscore.length; i++) {
                        if (!isNaN(params.previousscore[i]) && params.previousscore[i]) finalScore = finalScore + parseInt(params.previousscore[i]);
                    }
                }
                const BMIValue = !isNaN(parseInt(String(bmi))) ? "- " + parseInt(String(bmi)) : '';
                response = risk_level.toUpperCase() + " RISK!!! Of developing complication if you get infected with COVID-19.\n\n" +
                    " Based on Age -" + agenum + ", Gender - " + genderText + ", BMI " + BMIValue + " and given complications Final risk score is " + finalScore + "  \n\n(Reference - https://www.reanfoundation.org/risk-assessment-tool/) \n\n" +
                    " We can also  help you  with covid related questions, symptom assessment or vaccination availability.";
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
