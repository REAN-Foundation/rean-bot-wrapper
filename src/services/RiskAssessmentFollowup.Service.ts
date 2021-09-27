
export const getRiskAssessmentFollowup = async (req, res) => {
    return new Promise(async (resolve, reject) => {
        try {
            console.log('START--------');
            const params = req.body.queryResult.parameters ? req.body.queryResult.parameters : '';

            // console.log(params);

            //PB code

            const c = req.body.queryResult.outputContexts;
            let ctx = c[0]['parameters'];
            for (let i = 0; i < c.length; i++) {
                try {
                    if (c[i]['parameters']['complication'].length === 1) {
                        ctx = c[i]['parameters'];
                        break;
                    }
                } catch {

                }
            }
            const int_name = req['body']['queryResult']['intent']['displayName'];

            const gen = ctx['Gender'];
            const age = ctx['Age'];
            let weight = ctx['weight'];
            let height = ctx['height'];
            const new_arr = [];
            for (let i = 0; i < ctx['complication'].length; i++) {
                if (ctx['complication'][i] !== int_name) {
                    new_arr.push(ctx['complication'][i]);
                }
            }
            if (new_arr.length === 0) {
                const agenum = age['amount'];
                let tot_score = 0;

                for (let i = 0; i < ctx['score'].length; i++) {
                    if (!isNaN(ctx['score'][i]) && ctx['score'][i]) tot_score += parseInt(ctx['score'][i]);
                }
                if (agenum < 50) {
                    tot_score += 1;
                } else if (agenum < 60) {
                    tot_score += 2;
                } else if (agenum < 70) {
                    tot_score += 4;
                } else { tot_score += 6; }

                tot_score += parseInt(gen);
                weight = weight['amount'];
                height = ctx['height'];
                height = height['amount'];
                const bmi = weight / ((height / 100) ** 2);
                if (bmi > 35) { tot_score += 1; }

                const val = parseInt(ctx[int_name]);
                if (!isNaN(val)) {
                    tot_score += val;
                }
                else {
                    tot_score += 1;
                }
                let risk_level = '';
                if (tot_score <= 3) {
                    risk_level = 'low';
                } else if (tot_score < 5) {
                    risk_level = 'moderate';
                } else { risk_level = 'high'; }

                const sc1 = ctx['score'];
                sc1.push(tot_score);
                ctx['score'] = sc1;

                ctx['previousscore'] = ctx['score'];
                ctx['complication'] = new_arr;

                const response = risk_level.toUpperCase() + " RISK!!! Of developing complication if you get infected with COVID-19. Your score:" + tot_score +
                    ". Do you have other health complications?";
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
                            "parameters"    : ctx
                        }
                    ]
                };
                resolve(data);

            } else {
                if (new_arr.length > 0) {
                    let first_val = new_arr[0];
                    first_val = "trigger_" + first_val;
                    const sc = ctx['score'];
                    sc.push(parseInt(params[first_val]));
                    ctx['score'] = sc;
                    ctx['complication'] = new_arr;
                    const data = {
                        "followupEventInput" : {
                            "name"         : first_val,
                            "languageCode" : "en-US",
                            "parameters"   : ctx
                        }
                    };
                    resolve(data);

                }
            }

        }
        catch (error) {
            console.log(error.message, 500, "Covid Info Service Error!");
            reject(error.message);
        }
    });

};
