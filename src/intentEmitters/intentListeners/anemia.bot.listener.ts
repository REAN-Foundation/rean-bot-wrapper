import { Logger } from '../../common/logger';
import { AnemiaModel } from '../../services/anemia.service';
import { container } from 'tsyringe';
const anemiaModel: AnemiaModel = container.resolve(AnemiaModel);

export const AnemiaBotListener = async (intent, eventObj) => {
    return new Promise(async (resolve, reject) => {

        // let res;
        try {
            Logger.instance()
                .log('Calling Anemia Bot Service !!!!!!');

            // Service Call
            let response = null;

            // res = 5;
            response = await anemiaModel.getAnemiaImagePath(eventObj);

            console.log('Inside listener: ', response);

            if (!response) {
                console.log('I am failed');
                reject(response);
            }

            resolve(response);

        } catch (error) {
            Logger.instance()
                .log_error(error.message, 500, 'Anemia Bot Listener Error!');
            reject(error.message);
        }
    });
};
