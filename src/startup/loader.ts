import 'reflect-metadata';
import { container, DependencyContainer } from 'tsyringe';
import { Authenticator } from '../auth/authenticator';
import { Injector } from './injector';
import { Logger } from '../common/logger';
import { Scheduler } from './scheduler';


export class Loader {

    private static _authenticator: Authenticator = null;

    private static _container: DependencyContainer = container;

    private static _scheduler: Scheduler = Scheduler.instance();

    public static get authenticator() {
        return Loader._authenticator;
    }

    public static get scheduler() {
        return Loader._scheduler;
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
