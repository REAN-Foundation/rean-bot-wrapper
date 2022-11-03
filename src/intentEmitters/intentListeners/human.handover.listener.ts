import { container } from 'tsyringe';
import { Logger } from '../../common/logger';
import { HumanHandoff } from '../../services/human.handoff.service';

const humanHandoff: HumanHandoff = container.resolve(HumanHandoff);

export const HumanHandoverListener = async (intent, eventObj) => {
    return new Promise(async (resolve, reject) => {

        // let res;
        try {
            Logger.instance()
                .log('Human Handover Intent!!!!!');

            // Service Call
            let response = null;

            // res = 5;
            response = await humanHandoff.humanHandover(eventObj);

            console.log('Inside listener: ', response);

            if (!response) {
                console.log('I am failed');
                reject(response);
            }

            resolve(response);

        } catch (error) {
            Logger.instance()
                .log_error(error.message, 500, 'Human Handover Intent Error!');
            reject(error.message);
        }
    });
};
