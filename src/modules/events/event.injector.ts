import 'reflect-metadata';
import type { DependencyContainer } from 'tsyringe';
import { RabbitMqEventConsumer } from './providers/rabbitmq/rabbitmq.event.consumer.js';
import { AwsSqsEventConsumer } from './providers/aws.sqs/sqs.event.consumer.js';
import { ConfigurationManager } from '../../configs/configuration.manager.js';
import { MessagingProvider } from '../../domain.types/events/provider.types.js';

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

