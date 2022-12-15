import { VerifyBridgeService } from "../../../services/bloodWrrior/verify.bridge.service";

export const VerifyBloodBridge = async (intent, eventObj) => {
    return new Promise(async (resolve,reject) => {
        try {
            let result = null;
            result = await VerifyBridgeService(eventObj);
            console.log(result);
            resolve(result);

        } catch (error) {
            console.log(error);
        }
    });
};
