import { container } from 'tsyringe';
import { Logger } from '../../common/logger';
import { LiveAgent } from '../../services/request.live.agent.service';

const liveAgent: LiveAgent = container.resolve(LiveAgent);

export const RequestLiveAgent = async (intent, eventObj) => {
    try {
        Logger.instance()
            .log('Request Live Agent Intent!!!!!');

        let response = null;
        response = await liveAgent.requestLiveAgent(eventObj.body);
        console.log('Inside listener: ', response);

        if (!response) {
            console.log('I am failed');
            throw new Error('Request Live Agent Service Error!');
        }

        return response;

    } catch (error) {
        Logger.instance()
            .log_error(error.message, 500, 'Request Live Agent Intent Error!');
        throw new Error("Request live agent listener error");
    }
};
