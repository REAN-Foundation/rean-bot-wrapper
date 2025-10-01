import 'reflect-metadata';
import { DependencyContainer } from 'tsyringe';
import { SecretsManagerInjector } from './secrets/secrets.manager.injector';

////////////////////////////////////////////////////////////////////////////////

export class ModuleInjector {

    static registerInjections(container: DependencyContainer) {

        SecretsManagerInjector.registerInjections(container);

    }

}
