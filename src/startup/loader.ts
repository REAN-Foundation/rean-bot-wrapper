import 'reflect-metadata';
import { container } from 'tsyringe';
import type { DependencyContainer } from 'tsyringe';
import { Authenticator } from '../auth/authenticator.js';
import { Injector } from './injector.js';
import { Logger } from '../common/logger.js';
import { Scheduler } from './scheduler.js';
import type { IEventConsumer } from '../modules/events/interfaces/event.consumer.interface.js';
import { EventInjector } from '../modules/events/event.injector.js';

export class Loader {

    private static _authenticator: Authenticator = null;

    private static _container: DependencyContainer = container;

    private static _scheduler: Scheduler = Scheduler.instance();

    private static _eventConsumers: IEventConsumer = null;

    public static get authenticator() {
        return Loader._authenticator;
    }

    public static get container() {
        return Loader._container;
    }

    public static get scheduler() {
        return Loader._scheduler;
    }

    public static init = async (): Promise<boolean> => {
        try {

            //Register injections here...
            Injector.registerInjections(container);
            EventInjector.registerInjections(container);
            Loader._authenticator = container.resolve(Authenticator);

            Loader._eventConsumers = container.resolve('IEventConsumer');
            await Loader._eventConsumers.startListening();

            return true;

        } catch (error) {
            Logger.instance().log(error.message);
            return false;
        }
    };

}
