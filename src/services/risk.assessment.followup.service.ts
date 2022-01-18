import { isEmpty } from "lodash";

export const getRiskAssessmentFollowup = async (req) => {
    return new Promise(async (resolve, reject) => {
        try {
            console.log('START--------');
            const params = req.body.queryResult.parameters ? req.body.queryResult.parameters : '';

            const c = req.body.queryResult.outputContexts;
            // console.log(c[0]['parameters']);
            
            let ctx = c[0]['parameters'];
            for (let i = 0; i < c.length; i++) {
                                
                try {
                    if (c[i]['parameters']['complication'].length === 1) {
                        ctx = c[i]['parameters'];
                        break;
                    }
                } catch (error) {
                    console.log(error.message, 500, "Covid Info Service Error!");
                    reject(error.message);
                }
            }
            const int_name = req['body']['queryResult']['intent']['displayName'];


            ctx.previouscomplication[0][int_name] = params.severity;

            var json_data = params.previouscomplication[0];
            for (let j = 0; j < params.complication.length ; j++){
                if(params.complication[j] in json_data){
                    continue;
                }else{
                    json_data[params.complication[j]] = 0
                }
            }

            ctx.previouscomplication[0] = json_data;


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
                if (bmi > 35) tot_score += 1;

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
                

                let response = '';
                if(Object.keys(ctx['previouscomplication'][0]).length > 1){
 
                    
                    response = risk_level.toUpperCase() + " Risk!!! of developing complication if you get infected with COVID-19 with pre-medical conditions of "+ Object.keys(ctx['previouscomplication'][0]).toString() +
                    '. Do you have other health complications?'
                }else{                    
                    response = risk_level.toUpperCase() + " RISK!!! Of developing complication if you get infected with COVID-19 with pre-medical condition of " + int_name + ". Do you have other health complications?";
                }
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
