import { GenerateCertificateYesService } from "../../../services/bloodWrrior/generate.certificate.yes.service.js";


export const GenerateCertificateYesListener = async (intent, eventObj) => {
    // eslint-disable-next-line max-len
    const generateCertificateYesService: GenerateCertificateYesService = eventObj.container.resolve(GenerateCertificateYesService);
    try {
        let result = null;
        result = await generateCertificateYesService.sendUserMessage(eventObj);
        console.log(result);
        return result.message;

    } catch (error) {
        console.log(error);
    }
};
