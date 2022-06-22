
/* eslint-disable @typescript-eslint/no-var-requires */
const cfsign = require('aws-cloudfront-sign');
import { autoInjectable } from "tsyringe";
import { ClientEnvironmentProviderService } from "./set.client/client.environment.provider.service";

@autoInjectable()
export class SignedUrls{

    constructor(private clientEnvironmentProviderservice?: ClientEnvironmentProviderService){}

    async getSignedUrl(){

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
            'https://d3uqieugp2i3ic.cloudfront.net/dev/1642511978193.png', 
            signingParams
        );
        
        console.log("signedUrl", signedUrl);
    }
}
