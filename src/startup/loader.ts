import 'reflect-metadata';
import { container, DependencyContainer } from 'tsyringe';
import { Authenticator } from '../auth/authenticator';
import { Injector } from './injector';
import { Logger } from '../common/logger';

export class Loader {

    private static _authenticator: Authenticator = null;

    private static _container: DependencyContainer = container;

    public static get authenticator() {
        return Loader._authenticator;
    }

    public static get container() {
        return Loader._container;
    }

    public static init = async (): Promise<boolean> => {
        try {

            //Register injections here...
            Injector.registerInjections(container);
            Loader._authenticator = container.resolve(Authenticator);

            return true;

        } catch (error) {
            Logger.instance().log(error.message);
            return false;
        }
    };

}
