import 'reflect-metadata';
import { ConfigurationManager } from '../configs/configuration.manager';
import { DependencyContainer } from 'tsyringe';
import { CustomAuthenticator } from './custom/custom.authenticator';

////////////////////////////////////////////////////////////////////////////////

export class AuthInjector {

    static registerInjections(container: DependencyContainer) {

        const authentication = ConfigurationManager.Authentication();

        if (authentication === 'Custom') {
            container.register('IAuthenticator', CustomAuthenticator);
        }

    }

}
