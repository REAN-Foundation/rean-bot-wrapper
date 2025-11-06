import { HowDoYouFeelService } from "../../services/symptom/how.do.you.feel.js";
import { HowDoYouFeelWorseService } from "../../services/symptom/how.do.you.feel.worse.js";

export class AppSymptomListener {

    public static handleIntent = async (intent, eventObj) => {
        var response = null;
        try {
            switch (intent) {
            case 'HowYouFeel - Better': {
                const howDoYouFeelService = eventObj.container.resolve(HowDoYouFeelService);
                response = await howDoYouFeelService.howDoFeelBetterInfoService(eventObj);
                break;
            }
            case 'HowYouFeel - same': {
                const howDoYouFeelService = eventObj.container.resolve(HowDoYouFeelService);
                response = await howDoYouFeelService.howDoYouFeelServicehowDoFeelSameInfoService(eventObj);
                break;
            }
            case 'HowYouFeel - worse': {
                const howDoYouFeelService = eventObj.container.resolve(HowDoYouFeelService);
                response = await howDoYouFeelService.howDoFeelWorseInfoService(eventObj);
                break;
            }
            case 'HowYouFeel - worse - custom - worse': {
                const howDoFeelWorse2InfoService = eventObj.container.resolve(HowDoYouFeelWorseService);
                response = await howDoFeelWorse2InfoService.howDoFeelWorse2InfoService(eventObj);
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
