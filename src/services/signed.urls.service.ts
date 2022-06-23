/* eslint-disable lines-around-comment */

/* eslint-disable @typescript-eslint/no-var-requires */
const cfsign = require('aws-cloudfront-sign');
import { autoInjectable } from "tsyringe";
import { ClientEnvironmentProviderService } from "./set.client/client.environment.provider.service";

@autoInjectable()
export class SignedUrls{

    constructor(private clientEnvironmentProviderservice?: ClientEnvironmentProviderService){}

    async getSignedUrl(url){

        const millisecond = parseFloat(this.clientEnvironmentProviderservice.getClientEnvironmentVariable("EXPIRE_LINK_TIME"));
        var signingParams = {
            keypairId        : process.env.CF_KEY_PAIR_ID,
            // Optional - this can be used as an alternative to privateKeyString
            privateKeyString : process.env.CF_PRIVATE_KEY,
            expireTime       : (new Date().getTime() + millisecond)
        };

        console.log("expireTIme", signingParams.expireTime);
        
        // Generating a signed URL
        var signedUrl = cfsign.getSignedUrl(
            url, 
            signingParams
        );
        
        console.log("signedUrl", signedUrl);
    }
    
}

