/* eslint-disable lines-around-comment */

/* eslint-disable @typescript-eslint/no-var-requires */
const cfsign = require('aws-cloudfront-sign');
import { inject, Lifecycle, scoped } from "tsyringe";
import { ClientEnvironmentProviderService } from "./set.client/client.environment.provider.service";

@scoped(Lifecycle.ContainerScoped)
export class SignedUrls{

    constructor(
        // eslint-disable-next-line max-len
        @inject(ClientEnvironmentProviderService) private clientEnvironmentProviderservice?: ClientEnvironmentProviderService
    ){}

    async getSignedUrl(url){
        return new Promise<string> ((resolve) => {
            const millisecond = parseFloat(this.clientEnvironmentProviderservice.getClientEnvironmentVariable("EXPIRE_LINK_TIME"));
            var signingParams = {
                keypairId        : process.env.CF_KEY_PAIR_ID,
                // Optional - this can be used as an alternative to privateKeyString
                privateKeyString : process.env.CF_PRIVATE_KEY,
                expireTime       : (new Date().getTime() + millisecond)
            };

            // Generating a signed URL
            var signedUrl = cfsign.getSignedUrl(
                url, 
                signingParams
            );
            
            resolve(signedUrl);
            console.log("signedUrl", signedUrl);
        });
    }
    
}

