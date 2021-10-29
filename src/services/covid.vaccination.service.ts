import { Logger } from '../common/logger';
import { getRequestOptions } from '../utils/helper';
import { districtMapping } from '../utils/district.mapping';
import needle from 'needle';
import axios from 'axios';
import dfff from 'dialogflow-fulfillment';
import date from 'date-and-time';
const GEO_API = process.env.GEO_API_KEY;
const VaccinationServiceBaseUrl = 'https://cdn-api.co-vin.in/api/v2';

export const getAppointmentsByPin = async (pincode, date) => {
    return new Promise(async (resolve, reject) => {
        try {
            Logger.instance().log(`Get vaccination appointments by Pincode: ${pincode}`);

            const query_param = `pincode=${pincode}&date=${date}`;

            const url = `${VaccinationServiceBaseUrl}/appointment/sessions/public/findByPin?${query_param}`;
            const options = getRequestOptions('vaccine');

            const api_response = await needle('get', url, options);

            resolve({ appointment_sessions: api_response.body });

        } catch (error) {
            Logger.instance().log_error(error.message, 500, "Covid Vaccination Service Error!");
            reject(error.message);
        }
    });
};

export const getAppointmentsByDistrict = async (districtId, date) => {
    return new Promise(async (resolve, reject) => {
        try {
            Logger.instance().log(`Get vaccination appointments by District Id: ${districtId}`);

            const query_param = `district_id=${districtId}&date=${date}`;

            const url = `${VaccinationServiceBaseUrl}/appointment/sessions/public/findByDistrict?${query_param}`;
            const options = getRequestOptions('vaccine');

            const api_response = await needle('get', url, options);

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
            const obj = districtMapping;
            const di_code = obj[district];
            console.log("HI" + di_code);
            const coWin = "https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/calendarByDistrict?district_id=" +
            di_code + "&date=" + today;
            const answer = await axios.get(coWin, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.76 Safari/537.36' } });
            return answer.data;
        } catch (error) {
            console.log("Request timed out");
            return -1;
        }
    }

    async function findNearestPin(lat, long) {
        try {
            let pin = undefined;
            const locationURL = 'https://maps.googleapis.com/maps/api/geocode/json?latlng=' + lat + ',' + long + '&key=' + GEO_API;
            console.log(locationURL);
            let response: any = await axios.get(locationURL);
            response = response.data;
            if (response.status === 'OK') {
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
        const params = req.body.queryResult.outputContexts[0].parameters;
        let age = params.age;
        let age_no = params["age-no.original"];
        if (age[0] !== undefined) {
            if (parseInt(age[0].slice(0, 2)) > 18 && parseInt(age[0].slice(0, 2)) < 45)
                age[0] = "18+";
            if (parseInt(age[0].slice(0, 2)) > 45)
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
        let pinCode = params.loc['zip-code'];

        let districtCode = null;
        let available = null;
        let latlong = null;
        let lat, long = 0;
        if (pinCode === undefined) {
            latlong = params.loc['latlong'];
            if (latlong != undefined) {
                latlong = latlong.slice(8);
                const index = latlong.indexOf('-');
                lat = latlong.slice(0, index);
                long = latlong.slice(index + 1);
                pinCode = await findNearestPin(lat, long);
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
        if (pinCode === undefined && districtCode === undefined) {
            agent.add("Can you send me your location or tell me your pin code/district.")
        }
        else if (available === 0 && pinCode != undefined) {
            agent.add("Please enter a valid pin code");
        }
        else if (available === -1) {
            console.log('time out');
            agent.add("Could not Reach CoWin Right now, please try again after some time")
        }
        else if (available.centers.length === 0) {
            let output = "";

            output += "\n";
            output += "No available vaccines in your location for the next 7 days. \n"
            output += "Location/PinCode: ";
            if (pinCode === undefined)
                output += districtCode;
            else
                output += pinCode;
            let payload;
            payload = {
                "telegram": {
                    "text": output,
                    "parse_mode": "HTML"
                }
            };
            agent.add(new dfff.Payload(agent.TELEGRAM, payload, { sendAsMessage: true, rawPayload: true }));
            //agent.add("No available vaccines in your pin code for the next 7 days.");
            agent.context.set('VaccinationAppointmentAvailability-followup', 0, {});
        }
        else {
            let ret = { centers: [] }
            let dateBool = false;
            available.centers.forEach(center => {
                ret.centers.push({ name: center.name, sessions: [] });
            })
            let dates = { days: [] };
            let count = 0;
            let bool = false;
            available.centers.forEach(center => {
                center.sessions.forEach(session => {
                    dates.days.forEach(slot => {
                        if (slot[0] === session.date)
                            bool = true;
                    })
                    if (bool === false)
                        dates.days.push([session.date])
                    bool = false;
                })
            })
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
                            return 1
                    }
                }
            })

            function filterPush(time, details) {
                if (dateBool === true) {
                    dates.days.forEach(thing => {
                        if (thing[0] === time) {
                            thing.push(details)
                        }
                    })
                }
                else {
                    ret.centers.forEach(center => {
                        if (center.name === details.center_id) {
                            center.sessions.push(details)
                        }
                    })
                }
            }


            function vaccineFilter(vaxType, time, details) {
                if (vaccine.length === 1 && vaccine[0] === "Covaxin") {
                    if (vaxType === 'COVAXIN') {
                        filterPush(time, details)
                    }
                }
                else if (vaccine.length === 1 && vaccine[0] === "Covishield") {
                    if (vaxType === 'COVISHIELD') {
                        filterPush(time, details)
                    }
                }
                else if (vaccine.length === 1 && vaccine[0] === "Sputnik V") {
                    if (vaxType === 'SPUTNIK V') {
                        filterPush(time, details)
                    }
                }
                else if (vaccine.length === 2 && !vaccine.includes("Covaxin")) {
                    if (vaxType === 'COVISHIELD' || vaxType === 'SPUTNIK V') {
                        filterPush(time, details)
                    }
                }
                else if (vaccine.length === 2 && !vaccine.includes("Covishield")) {
                    if (vaxType === 'COVAXIN' || vaxType === 'SPUTNIK V') {
                        filterPush(time, details)
                    }
                }
                else if (vaccine.length === 2 && !vaccine.includes("Sputnik V")) {
                    if (vaxType === 'COVISHIELD' || vaxType === 'COVAXIN') {
                        filterPush(time, details)
                    }
                }
                else {
                    filterPush(time, details)
                }
            }


            function feeFilter(feeType, vaxType, time, details) {
                if (fee.length === 1 && fee[0] === "Free") {
                    if (feeType === 'Free') {
                        vaccineFilter(vaxType, time, details)
                    }
                }
                else if (fee.length === 1 && fee[0] === "Paid") {
                    if (feeType === 'Paid') {
                        vaccineFilter(vaxType, time, details)
                    }
                }
                else {
                    vaccineFilter(vaxType, time, details)
                }
            }
            /*Lines 270-335 are for filtering fee, vaccine type, doses, and age*/

            let appointment_info;
            available.centers.forEach(center => {
                center.sessions.forEach((session) => {
                    appointment_info = {
                        center_id: center.name,
                        fee_type: center.fee_type,
                        session_id: session.session_id,
                        minimum_age_limit: session.min_age_limit,
                        date: session.date,
                        vax: session.vaccine,
                        slots: session.slots,
                        available_capacity_dose1: session.available_capacity_dose1,
                        available_capacity_dose2: session.available_capacity_dose2
                    }
                    if (session.available_capacity > 0) {
                        if (age.length === 1 && age[0] === "18+") {
                            if (dose.length === 1 && dose[0] === "1") {
                                if (session.min_age_limit === 18 && session.available_capacity_dose1 > 0) {
                                    feeFilter(center.fee_type, session.vaccine, session.date, appointment_info)
                                }
                            }
                            else if (dose.length === 1 && dose[0] === "2") {
                                if (session.min_age_limit === 18 && session.available_capacity_dose2 > 0) {
                                    feeFilter(center.fee_type, session.vaccine, session.date, appointment_info)
                                }
                            }
                            else {
                                if (session.min_age_limit === 18) {
                                    feeFilter(center.fee_type, session.vaccine, session.date, appointment_info)
                                }
                            }
                        }
                        else if (age.length === 1 && age[0] === "45+") {
                            if (dose.length === 1 && dose[0] === "1") {
                                if (session.min_age_limit === 45 && session.available_capacity_dose1 > 0) {
                                    feeFilter(center.fee_type, session.vaccine, session.date, appointment_info)
                                }
                            }
                            else if (dose.length === 1 && dose[0] === "2") {
                                if (session.min_age_limit === 45 && session.available_capacity_dose2 > 0) {
                                    feeFilter(center.fee_type, session.vaccine, session.date, appointment_info)
                                }
                            }
                            else {
                                if (session.min_age_limit === 45) {
                                    feeFilter(center.fee_type, session.vaccine, session.date, appointment_info)
                                }
                            }
                        }
                        else {
                            if (dose.length === 1 && dose[0] === "1") {
                                if (session.available_capacity_dose1 > 0) {
                                    feeFilter(center.fee_type, session.vaccine, session.date, appointment_info)
                                }
                            }
                            else if (dose.length === 1 && dose[0] === "2") {
                                if (session.available_capacity_dose2 > 0) {
                                    feeFilter(center.fee_type, session.vaccine, session.date, appointment_info)
                                }
                            }
                            else {
                                feeFilter(center.fee_type, session.vaccine, session.date, appointment_info)
                            }
                        }
                    }
                })
            })

            dateBool = true;
            available.centers.forEach(center => {
                center.sessions.forEach(session => {
                    appointment_info = {
                        center_id: center.name,
                        fee_type: center.fee_type,
                        session_id: session.session_id,
                        minimum_age_limit: session.min_age_limit,
                        vax: session.vaccine,
                        slots: session.slots,
                        available_capacity_dose1: session.available_capacity_dose1,
                        available_capacity_dose2: session.available_capacity_dose2
                    }
                    if (session.available_capacity > 0) {
                        if (age.length === 1 && age[0] === "18+") {
                            if (dose.length === 1 && dose[0] === "1") {
                                if (session.min_age_limit === 18 && session.available_capacity_dose1 > 0) {
                                    feeFilter(center.fee_type, session.vaccine, session.date, appointment_info)
                                }
                            }
                            else if (dose.length === 1 && dose[0] === "2") {
                                if (session.min_age_limit === 18 && session.available_capacity_dose2 > 0) {
                                    feeFilter(center.fee_type, session.vaccine, session.date, appointment_info)
                                }
                            }
                            else {
                                if (session.min_age_limit === 18) {
                                    feeFilter(center.fee_type, session.vaccine, session.date, appointment_info)
                                }
                            }
                        }
                        else if (age.length === 1 && age[0] === "45+") {
                            if (dose.length === 1 && dose[0] === "1") {
                                if (session.min_age_limit === 45 && session.available_capacity_dose1 > 0) {
                                    feeFilter(center.fee_type, session.vaccine, session.date, appointment_info)
                                }
                            }
                            else if (dose.length === 1 && dose[0] === "2") {
                                if (session.min_age_limit === 45 && session.available_capacity_dose2 > 0) {
                                    feeFilter(center.fee_type, session.vaccine, session.date, appointment_info)
                                }
                            }
                            else {
                                if (session.min_age_limit === 45) {
                                    feeFilter(center.fee_type, session.vaccine, session.date, appointment_info)
                                }
                            }
                        }
                        else {
                            if (dose.length === 1 && dose[0] === "1") {
                                if (session.available_capacity_dose1 > 0) {
                                    feeFilter(center.fee_type, session.vaccine, session.date, appointment_info)
                                }
                            }
                            else if (dose.length === 1 && dose[0] === "2") {
                                if (session.available_capacity_dose2 > 0) {
                                    feeFilter(center.fee_type, session.vaccine, session.date, appointment_info)
                                }
                            }
                            else {
                                feeFilter(center.fee_type, session.vaccine, session.date, appointment_info)
                            }
                        }
                    }
                })
            })
            /*Filtering ended*/
            let actual_ret = { times: [] };
            dates.days.forEach(date => {
                if (date.length > 1) {
                    actual_ret.times.push(date);
                }
            })
            let center_ret = { centers: [] }
            ret.centers.forEach(center => {
                if (center.sessions.length > 0)
                    center_ret.centers.push(center)
            })
            //console.log(center_ret)
            let dateArray = []
            center_ret.centers.forEach(center => {
                center.sessions.forEach(session => {
                    //console.log(session)
                    if (dateArray.includes(session.date) === false)
                        dateArray.push(session.date)
                })
            })
            dateArray.sort((date1, date2) => {
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
                            return 1
                    }
                }
            })


            /*Below is all formatting for the response sent to Telegram*/
            let htmlformat = ""
            if (actual_ret.times.length === 0) {
                htmlformat += "No available vaccines in your pin code for the next 7 days based on the following parameters: \n";
                console.log('1')
                let payload = {
                    "telegram": {
                        "text": htmlformat
                    }
                };
                agent.add(new dfff.Payload(agent.TELEGRAM, payload, { sendAsMessage: true, rawPayload: true }));
            }
            else {
                const DATELENGTH = dateArray.length;
                const CENTERLENGTH = center_ret.centers.length;
                let table = new Array(CENTERLENGTH + 1);

                for (let i = 0; i < table.length; i++) {
                    table[i] = new Array(DATELENGTH + 1);
                }
                for (let i = 1; i < DATELENGTH + 1; i++) {
                    table[0][i] = dateArray[i - 1]
                }
                for (let i = 1; i < CENTERLENGTH + 1; i++) {
                    table[i][0] = center_ret.centers[i - 1].name;
                }
                for (let i = 1; i < DATELENGTH + 1; i++) {
                    for (let j = 1; j < CENTERLENGTH + 1; j++) {
                        center_ret.centers.forEach(center => {
                            center.sessions.forEach(session => {
                                if (center.name === table[j][0] && session.date === table[0][i]) {
                                    let retObj;
                                    retObj = {
                                        fee_type: session.fee_type,
                                        session_id: session.session_id,
                                        minimum_age_limit: session.minimum_age_limit,
                                        vax: session.vax,
                                        slots: session.slots,
                                        available_capacity_dose1: session.available_capacity_dose1,
                                        available_capacity_dose2: session.available_capacity_dose2
                                    }
                                    table[j][i] = retObj
                                }
                            })
                        })
                        if (table[j][i] == null) {
                            table[j][i] = "No vaccines available"
                        }
                    }
                }
                table[0][0] = "Centers and Dates"

                //code to display inpute filters
                let filterString = 'Search result for Location : ';
                let vaccineName;
                let price;
                let doses;
                let location = vaccineName = price = doses = age = '';
                if (params.loc['zip-code'] != undefined)
                    location = params.loc['zip-code'] + " ,";
                else if (params.loc['latlong'] != undefined)
                    location = params.loc['latlong'] + " ,";
                else if (params.loc['District'] != undefined) {
                    location = params.loc['District'] + " ,";
                    location = location.charAt(0).toUpperCase() + location.substr(1).toLowerCase();
                }                  

                filterString += location; // + vaccineName + price + doses +  age;
                filterString = filterString.substring(0, filterString.length - 1)

                function createTable(tableData) {
                    let string = '<!DOCTYPE html>' + '<html>'
                    string += '<body style="width: 1200px;padding: 20px;">'
                    string += '<div style="display: flex">'
                    string += '<img src="{{imageSourceREAN}}" style="margin-top: 5px; width: 250px; height: 250px; margin-left: 90px; margin-right: 60px;"/>'
                    string += '<img src="{{imageSourceCOWIN}}" style="width: 400px; height: 250px; margin-left: 350px;"/>'
                    string += '</div>'
                    string += '<div style="display: flex;">';
                    string += '<div style="width:65%;"><p style="font-size:20px; padding-bottom:10px;margin-left: 40px;"><span style="font-size:20px; padding-bottom:10px;">' + filterString + '</span></p></div>'
                    string += '<div style="width:35%;"> <p style="font-size:20px; padding-bottom:10px;"><span style="background-color:#b5f0b5;width: 100px;">Vaccine(s) Available</span> <span style="padding-left:20px">NA = Not Applicable</span>  </p> </div>'
                    string += '</div>';
                    string += '<div> </div>'
                    string += '<table border="1" style="border-collapse:collapse; margin: 2px; border:1px solid;">'
                    for (let i = 0; i < tableData.length && i < 10; i++) {
                        string += '<tr>'
                        for (let j = 0; j < tableData[0].length; j++) {
                            if (i == 0 || j == 0) {
                                if (i == 0) {
                                    string += '<td style="background-color:#cbc3e3; padding-left:2px">'
                                    string += '<span style="font-size: 20px"> '
                                    string += '<b>' + tableData[i][j] + '</b>'
                                    string += '</span>' + '</td>'
                                }
                                else {
                                    string += '<td style="padding-left:2px">'
                                    string += '<span style="font-size: 20px"> '
                                    string += tableData[i][j]
                                    string += '</span>' + '</td>'
                                }
                            }
                            else if (tableData[i][j] === "No vaccines available") {
                                string += '<td style="padding-left:2px">'
                                string += '<span style="font-size: 20px"> '
                                string += 'NA'
                                string += '</span>' + '</td>'
                            }
                            else {
                                string += '<td style="background-color:#b5f0b5; padding-left:2px">'
                                string += '<span style="font-size: 15px"> '
                                string += "Vaccine Fee: " + table[i][j].fee_type + '<br>'
                                string += table[i][j].minimum_age_limit + '+' + '<br>'
                                string += table[i][j].vax + '<br>'
                                string += "Dose 1/Dose 2: " + table[i][j].available_capacity_dose1 + '/' + table[i][j].available_capacity_dose2 + '<br>'
                                string += '</span>'
                                string += '</td>'
                            }
                        }
                        string += '</tr>'
                    }
                    string += '</table>'
                    string = string + '</body>' + '</html>';
                    string += '<div style="width:100%;"><p style="font-size:18px; padding-bottom:10px;margin-left: 40px;">Disclaimer: The list of available vaccines is taken from https://www.cowin.gov.in/</p></div>'

                    return string
                }

                let htmlTable = createTable(table)
                console.log('1')
                let payload = {
                    "telegram": {
                        "text": htmlTable,
                        "parse_mode": "HTML"
                    }
                };
                agent.add(new dfff.Payload(agent.TELEGRAM, payload, { sendAsMessage: true, rawPayload: true }));
                if (actual_ret.times.length === 0) {
                    agent.add("To search again, please re-enter your district or pin code and try different filters.")
                }
                else if (CENTERLENGTH > 10) {
                    agent.add("Too many appointments to display here, please visit the CoWin website - https://www.cowin.gov.in/home - to view more appointments. \nOr \nEnter additional details to filter the results.")
                }
                else {
                    agent.add("Would you like to search with additional details?")
                }
            }
        }
    }
    console.log('TESTING');
    const intentMap = new Map();
    console.log('Hello');
    intentMap.set('Vaccination.AppointmentAvailability', demo);
    return await agent.handleRequest(intentMap);
};
