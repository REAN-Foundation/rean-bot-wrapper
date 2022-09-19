import { container } from "tsyringe";
import { kerotoplasty_service } from "../../services/kerotoplasty.service";

//import { container } from 'tsyringe';
export class kerotoplastyListener {
    
    public static handleIntent = async (intent:string, eventObj) => {

        try {
            const kerotoplastyService = container.resolve(kerotoplasty_service);
            const response = await kerotoplastyService.kerotoplasty_response_service(eventObj);
            if (!response) {
                throw new Error('kerotoplasty_bot Listener Error!');
            }
            else {
                return response;
            }
        }
        catch (error) {
            throw new Error(`Handle kerotoplasty intent ${error}`);
        }
    };
}
