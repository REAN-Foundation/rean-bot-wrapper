import { VerifyBridgeService } from "../../../services/bloodWrrior/verify.bridge.service.js";

export const VerifyBloodBridge = async (intent, eventObj) => {
    const verifyBridgeService: VerifyBridgeService = eventObj.container.resolve(VerifyBridgeService);
    try {
        let result = null;
        result = await verifyBridgeService.VerifyBridge(eventObj);
        console.log(result);
        return result;

    } catch (error) {
        console.log(error);
    }
};
