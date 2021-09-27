import { Logger } from '../common/logger';
import { getRequestOptions } from '../utils/Helper';
import { districtMapping } from '../utils/DistrictMapping';
import needle from 'needle';
import axios from 'axios';
import dfff from 'dialogflow-fulfillment';
import date from 'date-and-time';
const GEO_API = process.env.GEO_API_KEY;
const VaccinationServiceBaseUrl = 'https://cdn-api.co-vin.in/api/v2';

// Get Covid Vaccination Slots by Pincode
export const getAppointmentsByPin = async (pincode, date) => {
    return new Promise(async (resolve, reject) => {
        try {
            Logger.instance().log(`Get vaccination appointments by Pincode: ${pincode}`);

            const query_param = `pincode=${pincode}&date=${date}`;

            const url = `${VaccinationServiceBaseUrl}/appointment/sessions/public/findByPin?${query_param}`;
            const options = getRequestOptions('vaccine');

            const api_response = await needle('get', url, options);

            // Do any sanitisation here...

            resolve({ appointment_sessions: api_response.body });

        } catch (error) {
            Logger.instance().log_error(error.message, 500, "Covid Vaccination Service Error!");
            reject(error.message);
        }
    });
};

// Get Vaccination Slots by District
export const getAppointmentsByDistrict = async (districtId, date) => {
    return new Promise(async (resolve, reject) => {
        try {
            Logger.instance().log(`Get vaccination appointments by District Id: ${districtId}`);

            const query_param = `district_id=${districtId}&date=${date}`;

            const url = `${VaccinationServiceBaseUrl}/appointment/sessions/public/findByDistrict?${query_param}`;
            const options = getRequestOptions('vaccine');

            const api_response = await needle('get', url, options);

            // Do any sanitisation here...

            resolve({ appointment_sessions: api_response.body });

        } catch (error) {
            Logger.instance().log_error(error.message, 500, "Covid Vaccination Service Error!");
            reject(error.message);
        }
    });
};

export const getAppointments = async(req, res) => {
    async function getPinVax(pinCode) {         //function to get vaccines based on their pin code
        try {
            const today = date.format(new Date(), 'DD-MM-YYYY');
            console.log(today);
            const url = "https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/calendarByPin?pincode=" +
            pinCode + "&date=" + today;//12-06-2021";
            const answer = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.76 Safari/537.36' } });
            console.log(answer.data);
            return answer.data;
        } catch (error) {
            console.log('CoWIN pincode error: ', error);
            return -1;
        }
    }
    async function getDistrictVax(district) {       //function to get vaccines based on their district
        try {
            const dict = null;
            const today = date.format(new Date(), 'DD-MM-YYYY');
            console.log(today);

            //const data = fs.readFileSync('./CoWinDistricts.txt', {encoding: 'utf-8', flag: 'r'})
            const obj = districtMapping;
            const di_code = obj[district];
            console.log("HI" + di_code);
            const coWin = "https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/calendarByDistrict?district_id=" +
            di_code + "&date=" + today;//12-06-2021";
            const answer = await axios.get(coWin, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.76 Safari/537.36' } });
            return answer.data;
        } catch (error) {
            console.log("Request timed out");
            return -1;
        }
    }

    async function findNearestPin(lat, long) { //get pinCode from latitude and longitude
        try {
            let pin = undefined;
            const locationURL = 'https://maps.googleapis.com/maps/api/geocode/json?latlng=' + lat + ',' + long + '&key=' + GEO_API;
            console.log(locationURL);
            let response: any = await axios.get(locationURL);
            response = response.data;
            if (response.status === 'OK') { //check if this API is working
                response.results[0].address_components.forEach(address => {
                    if (address.types[0] === 'postal_code') {
                        pin = address.long_name;
                    }
                });
                console.log(pin);
                return pin;
            }
            else {
                return 0;
            }
        } catch (error) {
            console.log(error);
            return 0;
        }
    }
    const agent = new dfff.WebhookClient({
        request  : req,
        response : res
    });
    async function demo(agent) {                //function called by DialogFlow; requires agent to be passed
        /*Extracting parameters from Dialogflow*/
        console.log('START--------');
        console.log(req.body);
        const params = req.body.queryResult.outputContexts[0].parameters;
        const age = params.age;
        let age_no = params["age-no.original"];
        if (age[0] !== undefined) {
            if (parseInt(age[0].slice(0, 2)) > 18 && parseInt(age[0].slice(0, 2)) < 45) //between the ages of 18-45
                age[0] = "18+";
            if (parseInt(age[0].slice(0, 2)) > 45) //from 45-99
                age[0] = "45+";
        }
        if (age_no !== undefined) {
            age_no = parseInt(age_no);
            if (age_no >= 18 && age_no < 45)
                age[0] = "18+";
            if (age_no >= 45)
                age[0] = "45+";
        }
        const dose = params.dose;
        const vaccine = params.vac;
        const fee = params.fee;

        //figuring out which location to extract
        let pinCode = params.loc['zip-code'];

        let districtCode = null;
        let available = null;
        let latlong = null;
        let lat, long = 0;
        if (pinCode === undefined) {
            latlong = params.loc['latlong'];  //parse lat long input to feed to findNearestPin()
            if (latlong != undefined) {
                latlong = latlong.slice(8);
                const index = latlong.indexOf('-');
                lat = latlong.slice(0, index);
                long = latlong.slice(index + 1);
                pinCode = await findNearestPin(lat, long); //pinCode will equal the output of this function
            }
        }
        if (pinCode === undefined && latlong === undefined) {
            districtCode = params.loc['District'];
            available = await getDistrictVax(districtCode);
        }
        else {
            if (pinCode.length != 6)
                available = 0;
            else if (pinCode[0] === '0')
                available = 0;
            if (available !== 0)
                available = await getPinVax(pinCode);
        }
        if (available === 0 && pinCode === undefined && districtCode === undefined) {
            agent.add("Please send me your location or enter your pin code or district name.");
        }
        else {
            let payload;
        }
        let payload;
        if (available === 0 && pinCode != undefined) {
            agent.add('Please enter a valid pin code');
        } else if (available === -1) {
            console.log('time out');
            agent.add('Could not Reach CoWin Right now, please try again after some time');
        } else if (available.centers.length === 0) {
            let output = '';

            output += '\n';
            output += 'No available vaccines in your location for the next 7 days. \n';
            output += 'Location/PinCode: ';
            if (pinCode === undefined)
                output += districtCode;
            else
                output += pinCode;
            payload = {
                'telegram': {
                    'text': output,
                    'parse_mode': 'HTML',
                },
            };
            agent.add(new dfff.Payload(agent.TELEGRAM, payload, { sendAsMessage: true, rawPayload: true }));

            //agent.add("No available vaccines in your pin code for the next 7 days.");
            agent.context.set('VaccinationAppointmentAvailability-followup', 0, {});
        } else {
            const dates = { days: [] };
            const count = 0;
            let bool = false;
            available.centers.forEach(center => {
                center.sessions.forEach(session => {
                    dates.days.forEach(slot => {
                        if (slot[0] === session.date)
                            bool = true;
                    });
                    if (bool === false)
                        dates.days.push([session.date]);
                    bool = false;
                });
            });
            dates.days.sort((date1, date2) => {
                if (date1[0].slice(6, 10) < date2[0].slice(6, 10))
                    return -1;
                else if (date1[0].slice(6, 10) > date2[0].slice(6, 10))
                    return 1;
                else {
                    if (date1[0].slice(3, 5) < date2[0].slice(3, 5))
                        return -1;
                    else if (date1[0].slice(3, 5) > date2[0].slice(3, 5))
                        return 1;
                    else {
                        if (date1[0].slice(0, 2) < date2[0].slice(0, 2))
                            return -1;
                        else
                            return 1;
                    }
                }
            });
            console.log(dates);

            function filterPush(time, details) {
                dates.days.forEach(thing => {
                    if (thing[0] === time) {
                        thing.push(details);
                    }
                });
            }

            function vaccineFilter(vaxType, time, details) {
                if (vaccine.length === 1 && vaccine[0] === 'Covaxin') {
                    if (vaxType === 'COVAXIN') {
                        filterPush(time, details);
                    }
                } else if (vaccine.length === 1 && vaccine[0] === 'Covishield') {
                    if (vaxType === 'COVISHIELD') {
                        filterPush(time, details);
                    }
                } else {
                    filterPush(time, details);
                }
            }

            function feeFilter(feeType, vaxType, time, details) {
                if (fee.length === 1 && fee[0] === 'Free') {
                    if (feeType === 'Free') {
                        vaccineFilter(vaxType, time, details);
                    }
                } else if (fee.length === 1 && fee[0] === 'Paid') {
                    if (feeType === 'Paid') {
                        vaccineFilter(vaxType, time, details);
                    }
                } else {
                    vaccineFilter(vaxType, time, details);
                }
            }

            /*Lines 270-335 are for filtering fee, vaccine type, doses, and age*/

            available.centers.forEach(center => {
                center.sessions.forEach(session => {
                    let appointment_info = {
                        center_id: center.name,
                        fee_type: center.fee_type,
                        session_id: session.session_id,
                        minimum_age_limit: session.min_age_limit,
                        vax: session.vaccine,
                        slots: session.slots,
                        available_capacity_dose1: session.available_capacity_dose1,
                        available_capacity_dose2: session.available_capacity_dose2,
                    };
                    if (session.available_capacity > 0) {
                        if (age.length === 1 && age[0] === '18+') {
                            if (dose.length === 1 && dose[0] === '1') {
                                if (session.min_age_limit === 18 && session.available_capacity_dose1 > 0) {
                                    feeFilter(center.fee_type, session.vaccine, session.date, appointment_info);
                                }
                            } else if (dose.length === 1 && dose[0] === '2') {
                                if (session.min_age_limit === 18 && session.available_capacity_dose2 > 0) {
                                    feeFilter(center.fee_type, session.vaccine, session.date, appointment_info);
                                }
                            } else {
                                if (session.min_age_limit === 18) {
                                    feeFilter(center.fee_type, session.vaccine, session.date, appointment_info);
                                }
                            }
                        } else if (age.length === 1 && age[0] === '45+') {
                            if (dose.length === 1 && dose[0] === '1') {
                                if (session.min_age_limit === 45 && session.available_capacity_dose1 > 0) {
                                    feeFilter(center.fee_type, session.vaccine, session.date, appointment_info);
                                }
                            } else if (dose.length === 1 && dose[0] === '2') {
                                if (session.min_age_limit === 45 && session.available_capacity_dose2 > 0) {
                                    feeFilter(center.fee_type, session.vaccine, session.date, appointment_info);
                                }
                            } else {
                                if (session.min_age_limit === 45) {
                                    feeFilter(center.fee_type, session.vaccine, session.date, appointment_info);
                                }
                            }
                        } else {
                            if (dose.length === 1 && dose[0] === '1') {
                                if (session.available_capacity_dose1 > 0) {
                                    feeFilter(center.fee_type, session.vaccine, session.date, appointment_info);
                                }
                            } else if (dose.length === 1 && dose[0] === '2') {
                                if (session.available_capacity_dose2 > 0) {
                                    feeFilter(center.fee_type, session.vaccine, session.date, appointment_info);
                                }
                            } else {
                                feeFilter(center.fee_type, session.vaccine, session.date, appointment_info);
                            }
                        }
                    }
                });
            });

            /*Filtering ended*/

            const actual_ret = { times: [] };
            dates.days.forEach(date => {
                if (date.length > 1) {
                    actual_ret.times.push(date);
                }
            });

            /*Below is all formatting for the response sent to Telegram*/
            let htmlformat = '';
            if (actual_ret.times.length === 0) {
                htmlformat += 'No available vaccines in your pin code for the next 7 days based on the following parameters: \n';
            } else {
                htmlformat += 'These are the available appointments in the next 7 days: \n';
                htmlformat += '<b>Dates:</b> \n';
                actual_ret.times.forEach(place => {
                    htmlformat += place[0] + '\n';
                    place.slice(1)
                        .forEach(time => {
                            htmlformat += '     ' + time.center_id + ' (' +
                                time.fee_type + ')' + '\n';
                            htmlformat += '     <b>Minimum Age: </b>' + time.minimum_age_limit + '\n';
                            htmlformat += '     <b>Vaccine Type: </b>' + time.vax + '\n';
                            htmlformat += '     <b>Number of Shots for Dose 1 Available: </b>' + time.available_capacity_dose1 + '\n';
                            htmlformat += '     <b>Number of Shots for Dose 2 Available: </b>' + time.available_capacity_dose2 + '\n';
                            htmlformat += '     <b>Time Slots: </b>' + time.slots + '\n';
                            htmlformat += '\n';
                        });
                    htmlformat += '\n';

                });
                htmlformat += 'Visit https://www.cowin.gov.in/home to register and book a vaccination appointment \n';
                htmlformat += '\n';
            }
            htmlformat += 'I searched with the following details: \n';
            htmlformat += 'Location: ';

            if (pinCode === undefined)
                htmlformat += districtCode + '\n';
            else
                htmlformat += pinCode + '\n';
            if (vaccine.length !== 0)
                htmlformat += 'Vaccine: ' + vaccine + '\n';
            if (age.length !== 0)
                htmlformat += 'Minimum Age: ' + age[0] + '\n';
            if (dose.length !== 0)
                htmlformat += 'Dose: ' + dose + '\n';
            if (fee.length !== 0)
                htmlformat += 'Fee: ' + fee + '\n';

            //agent.add("No available vaccines in your pin code for the next 7 days.");
            const payload = {
                'telegram': {
                    'text': htmlformat,
                    'parse_mode': 'HTML',
                },
            };
            agent.add(new dfff.Payload(agent.TELEGRAM, payload, { sendAsMessage: true, rawPayload: true }));
            if (actual_ret.times.length === 0) {
                agent.add('To search again, please re-enter your district or pin code and try different filters.');
            } else {
                agent.add('Would you like to search with additional details?');
            }

            //agent.context.set('VaccinationAppointmentAvailability-followup', 0, {loc: {'District': 'Hyderabad'}});

            console.log(actual_ret);
        }
    }
    console.log('TESTING');
    const intentMap = new Map();
    console.log('Hello');
    intentMap.set('Vaccination.AppointmentAvailability', demo);
    return await agent.handleRequest(intentMap);
};
