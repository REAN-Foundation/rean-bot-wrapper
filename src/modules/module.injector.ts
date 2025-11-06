import 'reflect-metadata';
import type { DependencyContainer } from 'tsyringe';
import { SecretsManagerInjector } from './secrets/secrets.manager.injector.js';

////////////////////////////////////////////////////////////////////////////////

export class ModuleInjector {

    static registerInjections(container: DependencyContainer) {

        SecretsManagerInjector.registerInjections(container);

    }

}
