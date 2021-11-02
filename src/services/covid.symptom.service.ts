const MSG5 = "Call your medical provider, clinician advice line, or telemedicine provider as soon as possible You also have medical conditions that may put you at risk of becoming more seriously ill.";
const MSG6 = "Call your medical provider, clinician advice line, or telemedicine provider as soon as possible";
const MSG7 = "Tell a caregiver in your facility that you are sick and need to see a medical provider as soon as possible. Stay in your room as much as possible except to get medical care.";
const MSG8 = "Stay home except to get medical care and take care of yourself. Call your medical provider if you start feeling worse";
const MSG9 = "Stay home except to get medical care and take care of yourself. Call your medical provider, clinician advice line, or telemedicine provider.";
const MSG30 = "Stay home and away from others until: it has been 10 days* from when your symptoms first appeared and you have had no fever for 24 hours without the use of medications and your other symptoms of COVID-19 are improving* (*Loss of taste and smell may persist for weeks or months after recovery and need not delay the end of isolation) *If you have a weakened immune system (immunocompromised) due to a health condition or medication, you might need to stay home and isolate longer than 10 days and possibly 20 days after symptoms begin. In some circumstances, further testing may be needed. Talk to your healthcare provider for more information.";
const MSG31 = "CDC recommends that all close contacts of people with confirmed COVID-19 should quarantine for 14 days from the day of their last exposure. Check your local health department’s website for information about options in your area to possibly shorten this quarantine period. You may also receive a call from a contact tracing professional.";
const MSG202 = "Ask a caregiver in your facility about when you can resume being around other people based on the results of your testing.";
const MSG213 = "Watch for COVID-19 symptoms such as fever, cough, or difficulty breathing. If you develop any symptoms, contact your healthcare provider, and stay home and away from others until: it has been 10 days from when your symptoms first appeared and you have had no fever for 24 hours without the use of medications and your other symptoms of COVID-19 are improving* (*Loss of taste and smell may persist for weeks or months after recovery and need not delay the end of isolation)";
const MSG214 = "As soon as possible, tell your occupational health provider (or supervisor) that you may have been in close contact with another person who has tested positive for COVID-19 in the last 14 days.";
const MSG216 = "Tell a caregiver in your facility that you may have been in close contact with another person who has tested positive for COVID-19 in the last 14 days.";
const T4 = "Regardless of vaccination status or prior infection, CDC recommends that anyone with symptoms of COVID-19 should get tested and follow the advice of your healthcare provider. Contact your local or state health department to find a testing location near you.";
const T50 = "Regardless of vaccination status or prior infection, CDC recommends that anyone with symptoms of COVID-19 should get tested and follow the advice of your healthcare provider. Contact your local or state health department to find a testing location near you.";
const T105 = "Talk with your healthcare provider about your test result and the type of test you took to understand what your results mean.";
const T108 = "T108. get tested and quarantine for 14 days from the day of your last exposure. Check your local health department’s website for information about options in your area to possibly shorten this quarantine period. You may also receive a call from a contact tracing professional.";
const T109 = "Based on the answers given, you do not need to get tested unless recommended or required by your healthcare provider, employer, or public health official.";

function getMessages(list = []) {
    let message = "";
    for (let i = 0; i < list.length; i++) {
        message = message ? message + " \n " + list[i] : list[i];
    }
    return message;
}
const ternaryCondition = (condition, then, otherwise) => (condition ? then : otherwise);
export const getSymptoms = async (req) => {
    return new Promise(async (resolve, reject) => {
        try {
            console.log('START--------');
            const params = req.body.queryResult.parameters ? req.body.queryResult.parameters : '';
            let response_message = "Not found";

            if (params) {
                const age = params.age.amount;
                const exposure = params.expo.toLowerCase();
                let primarySymptoms = 0, secondarySymptoms = 0;
                const symptoms = params.symptom;
                if (symptoms.length > 0) {
                    primarySymptoms = symptoms.reduce((n, x) => n + (x === 'Primary Symptoms'), 0);
                    secondarySymptoms = primarySymptoms ? 0 : symptoms.reduce((n, x) => n + (x === 'Secondary Symptoms'), 0);
                }
                const livingCondition = params.livingcondition.toLowerCase();
                const hcw = params.healthcare.toLowerCase();
                const complication = params.conditions.length ? ternaryCondition(params.conditions[0].toLowerCase() !== "no", params.conditions.length, 0) : 0;
                if (age >= 18 && age < 65) {
                    if (exposure === "no") {
                        if (primarySymptoms >= 2) {
                            if (secondarySymptoms === 0) {
                                if (livingCondition === "yes") {
                                    if (hcw === "no") {
                                        response_message = getMessages([MSG7, T4, MSG30, T50]);
                                    }
                                }
                                else {
                                    // eslint-disable-next-line init-declarations
                                    let complications: number;
                                    if (hcw === "yes") {
                                        response_message = getMessages([MSG9, MSG6, T4, MSG30, T50]);
                                    }
                                    // eslint-disable-next-line max-len
                                    else if (complications !== 0) response_message = getMessages([MSG5, T4, MSG31, MSG30, T50]);
                                    else response_message = getMessages([MSG8, T4, MSG30, T50]);
                                }
                            }
                        }
                        else if (primarySymptoms >= 1) {
                            if (secondarySymptoms === 0) {
                                if (livingCondition === "yes") {
                                    if (hcw === "no") {
                                        response_message = getMessages([MSG7, T4, MSG30, T50]);
                                    }
                                }
                                else {
                                    if (hcw === "yes") {
                                        response_message = getMessages([MSG8, MSG6, T4, MSG30, T50]);
                                    }
                                    else {
                                        if (complication > 0) response_message = getMessages([MSG5, T4, MSG30, T50]);
                                        else response_message = getMessages([MSG8, T4, MSG30, T50]);
                                    }
                                }
                            }
                        }
                        else if (primarySymptoms === 0) {
                            if (secondarySymptoms !== 0) {
                                if (livingCondition === "no") {
                                    if (hcw === "no") {
                                        response_message = getMessages([MSG8, T4, MSG30, T50]);
                                    }
                                    else response_message = getMessages([MSG8, MSG6, T4, MSG30, T50]);
                                }
                                else {
                                    if (hcw === "no") {
                                        response_message = getMessages([MSG7, T4, MSG30, T50]);
                                    }
                                }
                            }
                            else {
                                if (livingCondition === "no") {
                                    if (hcw === "no") {
                                        response_message = getMessages([T109]);
                                    }
                                    else response_message = getMessages([MSG214, T108, MSG213, T105]);
                                }
                                else {
                                    if (hcw === "no") {
                                        response_message = getMessages([MSG202, T105]);
                                    }
                                }
                            }
                        }
                    }
                    else if (exposure === "yes") {
                        if (primarySymptoms >= 2 && secondarySymptoms === 0 && livingCondition === "no" && hcw === "no") {
                            response_message = getMessages([MSG5, T4, MSG31, MSG30, T50]);
                        }
                        else if (primarySymptoms >= 1) {
                            if (secondarySymptoms === 0) {
                                if (livingCondition === "no") {
                                    if (hcw === "no") {
                                        response_message = getMessages([MSG8, T4, MSG31, MSG30, T50]);
                                    }
                                    else response_message = getMessages([MSG8, MSG6, T4, MSG31, MSG30, T50]);
                                }
                                else {
                                    if (hcw === "no") {
                                        response_message = getMessages([MSG7, T4, MSG31, MSG30, T50]);
                                    }
                                }
                            }
                        }
                        else if (primarySymptoms === 0) {
                            if (secondarySymptoms !== 0) {
                                if (livingCondition === "no") {
                                    if (hcw === "no") {
                                        response_message = getMessages([MSG8, T4, MSG31, MSG30, T50]);
                                    }
                                    else response_message = getMessages([MSG8, MSG6, T4, MSG31, MSG30, T50]);
                                }
                                else {
                                    if (hcw === "no") response_message = getMessages([MSG7, T4, MSG31, MSG30, T50]);
                                }
                            }
                            else {
                                if (livingCondition === "no") {
                                    if (hcw === "no") response_message = getMessages([T108, MSG213, T105]);
                                }
                                else {
                                    if (hcw === "no") response_message = getMessages([MSG216, MSG202, T108, T105]);

                                }
                            }
                        }
                    }
                }
                else if (age >= 65) {
                    if (exposure === "no") {
                        if (primarySymptoms >= 2) {
                            if (secondarySymptoms === 0) {
                                if (livingCondition === "no") {
                                    if (hcw === "no") response_message = getMessages([MSG5, T4, MSG30, T50]);
                                } else { response_message = getMessages([MSG7, T4, MSG30, T50]); }
                            }
                        }
                        else if (primarySymptoms >= 1) {
                            if (secondarySymptoms === 0) {
                                if (livingCondition === "no") {
                                    if (hcw === "no") response_message = getMessages([MSG5, T4, MSG30, T50]);
                                } else { response_message = getMessages([MSG7, T4, MSG30, T50]); }
                            }
                        } else {
                            if (secondarySymptoms !== 0) {
                                if (livingCondition === "no") {
                                    if (hcw === "no") response_message = getMessages([MSG5, T4, MSG30, T50]);
                                }
                            }

                        }
                    } else if (exposure === "yes") {
                        if (primarySymptoms >= 1) {
                            if (secondarySymptoms === 0) {
                                if (livingCondition === "no") {
                                    if (hcw === "no") response_message = getMessages([MSG5, T4, MSG31, MSG30, T50]);
                                }
                                else if (hcw === "no") response_message = getMessages([MSG7, T4, MSG31, MSG30, T50]);
                            }
                        } else {
                            if (secondarySymptoms !== 0) {
                                if (livingCondition === "no") {
                                    if (hcw === "no") response_message = getMessages([MSG5, T4, MSG31, MSG30, T50]);
                                }
                            }

                        }
                    }
                }
            }
            if (response_message === "Not found") {
                reject(response_message);
            }
            else {

                const response = {
                    "fulfillmentMessages" : [
                        {
                            "text" : {
                                "text" : [
                                    response_message
                                ]
                            }
                        }
                    ]
                };

                resolve(response);
            }
        }
        catch (error) {
            console.log(error, 500, "Covid Info Service Error!");
            reject(error.message);
        }
    });

};
