import 'reflect-metadata';
import { DependencyContainer } from 'tsyringe';
import { RabbitMqEventConsumer } from './providers/rabbitmq/rabbitmq.event.consumer';
import { AwsSqsEventConsumer } from './providers/aws.sqs/sqs.event.consumer';
import { ConfigurationManager } from '../../configs/configuration.manager';
import { MessagingProvider } from '../../domain.types/events/provider.types';

export class EventInjector {
    
    static registerInjections(container: DependencyContainer) {
        const provider = ConfigurationManager.MessagingProvider();
        if (provider === MessagingProvider.RABBITMQ) {
            container.register('IEventConsumer', RabbitMqEventConsumer);
        }
        if (provider === MessagingProvider.AWS_SNS_SQS) {
            container.register('IEventConsumer', AwsSqsEventConsumer);
        }
    }

}

