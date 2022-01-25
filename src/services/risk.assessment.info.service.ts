import { ClientEnvironmentProviderService } from './set.client/client.environment.provider.service';
import { container,  } from 'tsyringe';
import { isEmpty } from 'lodash';
export const getRiskAssessmentInfo = async (req) => {
    const clientEnvironmentProviderService:
    ClientEnvironmentProviderService = container.resolve(ClientEnvironmentProviderService);
    const baseURL = clientEnvironmentProviderService.getClientEnvironmentVariable("BASE_URL");
    return new Promise(async (resolve, reject) => {
        try {
            let params: any = {};
            var imagePath = '';
            const image = {
                'low' : baseURL + '/uploads/L.png',
                'high' : baseURL + '/uploads/H.png',
                'moderate' : baseURL + '/uploads/M.png'
            };
            if (req['body']['queryResult']['intent']['displayName'] !== "Risk.assessment.info-no") {
                params = req.body.queryResult.parameters ? req.body.queryResult.parameters : {};
            } else {
                params = req.body.queryResult.outputContexts[0].parameters ?
                    req.body.queryResult.outputContexts[0].parameters : {};
            }
            let response = '';
            const output = calculateRisk(params);
            if (req['body']['queryResult']['intent']['displayName'] !== "Risk.assessment.info-no") {
                params.previousscore = params.score;
                if (params.complication.length === 0) {
                    response = output.risk_level.toUpperCase() + " RISK!!! Of developing complication if you get infected with COVID-19" +
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
                    if (isEmpty(params.previouscomplication)){
                        var json_data = {};
                        json_data[params.complication[0]] = params.score;
                        params.previouscomplication = json_data;
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
                    } else {
                        json_data = params.previouscomplication[0];
                        for (let i = 0; i < params.complication.length; i++){
                            if (params.complication[i] in json_data){
                                if (params.previousscore.length > 1){
                                    var previous_score = 0;
                                    for (let pre_score; pre_score < params.previousscore.length ; pre_score++){
                                        previous_score = previous_score + params.previousscore[pre_score];
                                    }
                                }
                                const genderText = params.Gender === "1" ? 'Male' : 'Female';
                                output.risk_level = '';
                                const riskData = getFinalScore(params);
                                output.risk_level = riskData.risk_level;
                                const BMIValue = !isNaN(output.bmi) ? "- " + output.bmi : '';
                                response = 'The medical conditions entered have already been considered for calculating your risk.' + output.risk_level.toUpperCase() + " RISK!!! Of developing complication if you get infected with COVID-19.\n\n" +
                                    " Based on Age -" + params.Age.amount + ", Gender - " + genderText + ", BMI " + BMIValue + " and given complications Final risk score is " + riskData.finalScore + "  \n\n(Reference - https://www.reanfoundation.org/risk-assessment-tool/) \n\n" +
                                    " We can also  help you  with covid related questions, symptom assessment or vaccination availability.";
                                imagePath = image[output.risk_level.toLocaleLowerCase()];
                                const data = getEndofConvData(imagePath,response);
                                resolve(data);
                            } else {
                                json_data[params.complication[i]] = 0;
                                let first_val = params.complication[i];
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
                }
            }
            else {
                const genderText = params.Gender === "1" ? 'Male' : 'Female';
                output.risk_level = '';
                const riskData = getFinalScore(params);
                const BMIValue = !isNaN(output.bmi) ? "- " + output.bmi : '';
                response = output.risk_level.toUpperCase() + " RISK!!! Of developing complication if you get infected with COVID-19.\n\n" +
                    " Based on Age -" + params.Age.amount + ", Gender - " + genderText + ", BMI " + BMIValue + " and given complications Final risk score is " + riskData.finalScore + "  \n\n(Reference - https://www.reanfoundation.org/risk-assessment-tool/) \n\n" +
                    " We can also  help you  with covid related questions, symptom assessment or vaccination availability.";

                imagePath = image[output.risk_level.toLocaleLowerCase()];
                const data = getEndofConvData(imagePath,response);
                resolve(data);
            }
        }
        catch (error) {
            console.log(error.message, 500, "Covid Info Service Error!");
            reject(error.message);
        }
    });
};
function calculateRisk(params){

    //To calculate the risk of patient
    //Input - params
    //output - risk_level, bmi, tot_score
    const gen = params.Gender;
    const age = params.Age;
    let weight = params.weight;
    let height = params.height;

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

    height = params.height;
    height = height.amount;
    const bmi = Math.round(weight / ((height / 100) ** 2));
    if (bmi > 35) tot_score += 1;
    params.score = [tot_score];
    let risk_level = '';
    if (tot_score <= 3) {
        risk_level = 'low';
    } else if (tot_score < 5) {
        risk_level = 'moderate';
    } else { risk_level = 'high'; }
    const returnArray = { 'risk_level': risk_level, 'bmi': bmi, 'tot_score': tot_score };

    console.log("We are here in the function we pushed");

    return returnArray;
}

function getEndofConvData(imagePath,response){
    const data = {
        "fulfillmentMessages" : [
            {
                "text" : {
                    "text" : [
                        response
                    ]
                }
            },
            {
                "image" : {
                    "imageUri"          : imagePath,
                    "accessibilityText" : response
                },
            },
        ],
    };

    return data;
}

function getFinalScore(params) {
    let finalScore = 0;
    let risk_level = '';
    if (params.previousscore.length > 0) {
        for (let i = 0; i < params.previousscore.length; i++) {
            if (!isNaN(params.previousscore[i]) && params.previousscore[i]){
                finalScore = finalScore + parseInt(params.previousscore[i]);
            } else {
                continue;
            }
        }
    } else {
        finalScore = params.previousscore[0];
    }

    if (finalScore <= 3) {
        risk_level = 'low';
    } else if (finalScore < 5) {
        risk_level = 'moderate';
    } else { risk_level = 'high'; }

    const returnArray = { 'risk_level': risk_level, 'finalScore': finalScore };
    return returnArray;
}
