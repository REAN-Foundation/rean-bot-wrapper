import 'reflect-metadata';
import { container, DependencyContainer } from 'tsyringe';
import { Authenticator } from '../auth/authenticator';
import { Injector } from './injector';
import { Logger } from '../common/logger';
import { Scheduler } from './scheduler';
import { IEventConsumer } from '../modules/events/interfaces/event.consumer.interface';
import { EventInjector } from '../modules/events/event.injector';

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
