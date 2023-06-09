import { Logger } from '../../common/logger';
import { HumanHandoff } from '../../services/human.handoff.service';

export const HumanHandoverListener = async (intent, eventObj) => {
    try {
        Logger.instance()
            .log('Human Handover Intent!!!!!');

        // Service Call
        let response = null;

        // res = 5;
        const humanHandoff: HumanHandoff = eventObj.container.resolve(HumanHandoff);
        response = await humanHandoff.humanHandover(eventObj);

        console.log('Inside listener: ', response);

        if (!response) {
            console.log('I am failed');
            throw new Error('Failed');
        }

        return response;

    } catch (error) {
        Logger.instance()
            .log_error(error.message, 500, 'Human Handover Intent Error!');
        throw new Error("Human handover intent error: " + error.message);
    }
};
