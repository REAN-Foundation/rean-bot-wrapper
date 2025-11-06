import { GenerateCertificateConfirmYesService } from "../../../services/bloodWrrior/generate.certificate.confirm.yes.service.js";

export const GenerateCertificateConfirmYesListener = async (intent, eventObj) => {
    // eslint-disable-next-line max-len
    const generateCertificateConfirmYesService: GenerateCertificateConfirmYesService = eventObj.container.resolve(GenerateCertificateConfirmYesService);
    try {
        let result = null;
        result = await generateCertificateConfirmYesService.sendUserMessage(eventObj);
        console.log(result);
        return result.message;

    } catch (error) {
        console.log(error);
    }
};
