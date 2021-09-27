// Load required services here
import { Logger } from '../../common/logger';
import moment from 'moment';
import { getAppointments } from '../../services/CovidVaccination.Service';

export const getVaccinationAppointments = async (intent, eventObj) => {
    return new Promise(async (resolve, reject) => {
        let res;
        try {
            Logger.instance()
                .log('Calling Vaccination Service to get available vaccine slots');

            // param validations
            const requestParams: any = {};
            requestParams.vaccine_type = eventObj.body.queryResult.parameters.vac || null;

            //requestParams.districtId = eventObj.queryResult.parameters.loc.DistrictId || null
            requestParams.districtId = eventObj.body.queryResult.parameters.loc.District || null;
            requestParams.pincode = eventObj.body.queryResult.parameters.pincode || null;
            requestParams.appointmentDate = eventObj.body.queryResult.parameters.appointmentDate || moment()
                .format('DD-MM-YYYY');

            // Service Call
            let response = null;
            res = 5;
            response = await getAppointments(eventObj, res);

            /*if (requestParams.pincode) {
                res = 5;
                //response = await VaccinationService.getAppointmentsByDistrict(requestParams.districtId, requestParams.appointmentDate)
                console.log('LOG');
                response = await VaccinationService.getAppointments(eventObj, res);
            } else if (requestParams.districtId) {
                res = 5;
                //response = await VaccinationService.getAppointmentsByDistrict(requestParams.districtId, requestParams.appointmentDate)
                console.log('LOG');
                response = await VaccinationService.getAppointments(eventObj, res);
                //console.log(response);
                }
            else {
                return reject("Missing required parameters.")
            }*/

            console.log('Inside listener: ', response);

            if (!response) {
                console.log('I am failed');
                reject(response);
            }

            resolve(response);

        } catch (error) {
            Logger.instance()
                .log_error(error.message, 500, 'Vaccination Listener Error!');
            reject(error.message);
        }
    });
};

export const secondListener = async (intent, eventObj) => {
    return new Promise(async (resolve, reject) => {
        Logger.instance().log(`event in second listener`);
        reject('This was intended to be rejected.');
    });
};
