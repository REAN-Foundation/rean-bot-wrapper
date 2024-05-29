/* eslint-disable max-len */
import { ResponseHandler } from '../../utils/response.handler';
import { inject, Lifecycle, scoped } from 'tsyringe';
import { ClientEnvironmentProviderService } from '../../services/set.client/client.environment.provider.service';
import { AwsS3manager } from '../../services/aws.file.upload.service';
import { ConsentInfo } from '../../models/consent.info.model';
import { EntityManagerProvider } from '../../services/entity.manager.provider.service';
import { ErrorHandler } from '../../utils/error.handler';
import {CountryCodeService } from '../../utils/phone.number.formatting';

// Get an instance of PhoneNumberUtil.


// Get an instance of PhoneNumberUtil. 


// @autoInjectable()
@scoped(Lifecycle.ContainerScoped)
export class consentController {

    constructor(
        @inject(CountryCodeService ) private countryCodeService ?:CountryCodeService ,
        @inject(ResponseHandler) private responseHandler?: ResponseHandler,
        @inject(ClientEnvironmentProviderService) private clientEnvironment?: ClientEnvironmentProviderService,
        @inject(AwsS3manager) private awss3manager?: AwsS3manager,
        @inject(ErrorHandler) private errorHandler?: ErrorHandler,
        @inject(EntityManagerProvider) private entityManagerProvider?: EntityManagerProvider
    ) {

    }

    recordConsentinfo = async(req, res)=>{
        try {
            const clientEnvironmentProviderService = req.container.resolve(ClientEnvironmentProviderService);
            const clientName = clientEnvironmentProviderService.getClientEnvironmentVariable("NAME");
            console.log(clientName);
            const entityManagerProvider = req.container.resolve(EntityManagerProvider);
            const consentRepository = (await entityManagerProvider.getEntityManager(clientEnvironmentProviderService,clientName)).getRepository(ConsentInfo);
            const consentFindResult =
                await consentRepository.findOne({ where: { LanguageCode: req.body.languageCode } });
            if (consentFindResult){
                this.responseHandler.sendSuccessResponse(res, 200, 'Info already exists', "");
            }
            else {
                const consentObj = {
                    LanguageCode   : req.body.languageCode,
                    Language       : req.body.language,
                    MessageContent : req.body.message,
                    WebsiteURL     : req.body.link,
        
                };
                await consentRepository.create(consentObj);
                this.responseHandler.sendSuccessResponse(res, 200, 'Info is successfully stored', "");

            }

        }
        catch (error) {
            console.log("in error", error);
            this.errorHandler.handle_controller_error(error, res, req);
        }
    };

    readConsentinfo = async(req, res)=>{
        try {
            const clientEnvironmentProviderService = await req.container.resolve(ClientEnvironmentProviderService);
            const clientName =await  clientEnvironmentProviderService.getClientEnvironmentVariable("NAME");
            console.log(clientName);
            const entityManagerProvider = req.container.resolve(EntityManagerProvider);
            // eslint-disable-next-line max-len
            const consentRepository = (await entityManagerProvider.getEntityManager(clientEnvironmentProviderService,clientName)).getRepository(ConsentInfo);
            const consentFindResult =
                await consentRepository.findAll();
            if (consentFindResult.length > 0){
                this.responseHandler.sendSuccessResponse(res, 200,'All the data is in Data', consentFindResult);
            }
            else {
                this.responseHandler.sendSuccessResponse(res, 200, 'No information is stored yet', "");

            }

        }
        catch (error) {
            console.log("in error", error);
            this.errorHandler.handle_controller_error(error, res, req);
        }
    };

    updateConsentinfo = async(req, res)=>{
        try {
            if (!req.body.languageCode){
                console.log("hi");
                this.responseHandler.sendSuccessResponse(res, 200, 'Insufficient Information', "");
            }
            else {
                const clientEnvironmentProviderService = req.container.resolve(ClientEnvironmentProviderService);
                const clientName = clientEnvironmentProviderService.getClientEnvironmentVariable("NAME");
                console.log(clientName);
                const entityManagerProvider = req.container.resolve(EntityManagerProvider);
                const consentRepository = (await entityManagerProvider.getEntityManager(clientEnvironmentProviderService,clientName)).getRepository(ConsentInfo);
                const consentFindResult =
                await consentRepository.findOne({ where: { LanguageCode: req.body.languageCode } });
                if (consentFindResult !== null){
                    if (req.body.link){
                        console.log("link");
                        const link = req.body.link;
                        await consentFindResult.update({ WebsiteURL: link });
                    }
                    if (req.body.message) {
                        console.log("message content");
                        const message = req.body.message;
                        await consentFindResult.update({ MessageContent: message });
                    }
                    if (req.body.language) {
                        console.log("message content");
                        const language = req.body.language;
                        await consentFindResult.update({ Language: language, });
                    }
                    this.responseHandler.sendSuccessResponse(res, 200, 'information is updated',"");
                }
                else {
                    this.responseHandler.sendSuccessResponse(res, 200, 'Language not exist ', "");
                }
            }
        }
        catch (error) {
            console.log("in error", error);
            this.errorHandler.handle_controller_error(error, res, req);
        }
    };

    deleteConsentinfo = async(req, res)=>{
        try {
            const clientEnvironmentProviderService = req.container.resolve(ClientEnvironmentProviderService);
            const clientName = clientEnvironmentProviderService.getClientEnvironmentVariable("NAME");
            console.log(clientName);
            const entityManagerProvider = req.container.resolve(EntityManagerProvider);
            const consentRepository = (await entityManagerProvider.getEntityManager(clientEnvironmentProviderService,clientName)).getRepository(ConsentInfo);
            const consentFindResult =
                await consentRepository.destroy({ where: { LanguageCode: req.body.languageCode } });
            if (consentFindResult){
                this.responseHandler.sendSuccessResponse(res, 200, 'entry is deleted', "");
            }
            else {
                this.responseHandler.sendSuccessResponse(res, 200, 'entry not exist', "");

            }
        }
        catch (error) {
            console.log("in error", error);
            this.errorHandler.handle_controller_error(error, res, req);
        }
    };

}
