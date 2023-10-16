import { GenerateCertificateService } from "../../../services/bloodWrrior/generate.certificate.flow.service";


export const GenerateCertificateListener = async (intent, eventObj) => {
    // eslint-disable-next-line max-len
    const generateCertificateService: GenerateCertificateService = eventObj.container.resolve(GenerateCertificateService);
    try {
        let result = null;
        result = await generateCertificateService.sendUserMessage(eventObj);
        console.log(result);
        return result.message;

    } catch (error) {
        console.log(error);
    }
};
