import { container } from 'tsyringe';
import { Logger } from '../../common/logger';
import { LiveAgent } from '../../services/request.live.agent.service';

const liveAgent: LiveAgent = container.resolve(LiveAgent);

export const RequestLiveAgent = async (intent, eventObj) => {
    return new Promise(async (resolve, reject) => {

        // let res;
        try {
            Logger.instance()
                .log('Request Live Agent Intent!!!!!');

            // Service Call
            let response = null;

            // res = 5;
            response = await liveAgent.requestLiveAgent(eventObj.body);

            console.log('Inside listener: ', response);

            if (!response) {
                console.log('I am failed');
                reject(response);
            }

            resolve(response);

        } catch (error) {
            Logger.instance()
                .log_error(error.message, 500, 'Request Live Agent Intent Error!');
            reject(error.message);
        }
    });
};
