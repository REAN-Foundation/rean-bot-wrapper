import { Logger } from '../../common/logger';
import moment from 'moment';
import { getAppointments } from '../../services/covid.vaccination.service';

export const getVaccinationAppointments = async (intent, eventObj) => {
    let res;
    try {
        Logger.instance()
            .log('Calling Vaccination Service to get available vaccine slots');

        const requestParams: any = {};
        requestParams.vaccine_type = eventObj.body.queryResult.parameters.vac || null;
        requestParams.districtId = eventObj.body.queryResult.parameters.loc.District || null;
        requestParams.pincode = eventObj.body.queryResult.parameters.pincode || null;
        requestParams.appointmentDate = eventObj.body.queryResult.parameters.appointmentDate || moment()
            .format('DD-MM-YYYY');
        let response = null;
        res = 5;
        response = await getAppointments(eventObj, res);

        console.log('Inside listener: ', response);

        if (!response) {
            console.log('I am failed');
            throw new Error("Vaccination service failed");
        }

        return response;

    } catch (error) {
        Logger.instance()
            .log_error(error.message, 500, 'Vaccination Listener Error!');
        throw new Error("Vaccination listener failed");
    }
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const secondListener = async (intent, eventObj) => {
    return new Promise(async (resolve, reject) => {
        Logger.instance().log(`event in second listener`);
        reject('This was intended to be rejected.');
    });
};
