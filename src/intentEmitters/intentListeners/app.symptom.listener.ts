import { howDoFeelBetterInfoService,howDoFeelWorseInfoService,
    howDoFeelSameInfoService } from "../../services/symptom/how.do.you.feel";
import { howDoFeelWorse2InfoService } from "../../services/symptom/how.do.you.feel.worse";

export class AppSymptomListener {

    public static handleIntent = async (intent, eventObj) => {
        var response = null;
        try {
            switch (intent) {
            case 'HowYouFeel - Better': {
                response = await howDoFeelBetterInfoService(eventObj);
                break;
            }
            case 'HowYouFeel - same': {
                response = await howDoFeelSameInfoService(eventObj);
                break;
            }
            case 'HowYouFeel - worse': {
                response = await howDoFeelWorseInfoService(eventObj);
                break;
            }
            case 'HowYouFeel - worse - custom - worse': {
                response = await howDoFeelWorse2InfoService(eventObj);
                break;
            }
            }
            if (!response) {
                throw new Error('Symptom Info Listener Error!');
            }
            return response.message;
        } catch (error) {
            throw new Error(`Handle symptom intent ${error}`);
        }

    };

}
