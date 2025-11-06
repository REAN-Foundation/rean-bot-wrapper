import { SQSClient, ReceiveMessageCommand, DeleteMessageCommand, GetQueueAttributesCommand } from '@aws-sdk/client-sqs';
import type { ReceiveMessageCommandInput, Message } from '@aws-sdk/client-sqs';
import type { IEventConsumer } from '../../interfaces/event.consumer.interface.js';
import { Logger } from '../../../../common/logger.js';
import { EventType } from '../../../../domain.types/event.types.js';
import type { ConsumerOptions, EventMessage} from '../../../../domain.types/event.types.js';
import { EventHandler } from '../../../../common/event.handler.js';
import { injectable } from 'tsyringe';

///////////////////////////////////////////////////////////////////////////////

@injectable()
export class AwsSqsEventConsumer implements IEventConsumer {

    private sqsClient: SQSClient | null = null;

    private isListening = false;

    private pollingInterval: NodeJS.Timeout | null = null;

    private pendingMessages: Map<string, Message> = new Map();

    private queueUrl = process.env.EVENT_QUEUE_URL;

    private readonly pollingIntervalMs = parseInt(process.env.SQS_POLLING_INTERVAL_MS || '1000');

    private readonly maxMessages = parseInt(process.env.SQS_MAX_MESSAGES || '10');

    private readonly waitTimeSeconds = parseInt(process.env.SQS_WAIT_TIME_SECONDS || '20');

    private async createSqsInstance(): Promise<void> {
        if (this.sqsClient) {
            return;
        }

        try {
            this.sqsClient = new SQSClient({
                region      : process.env.AWS_REGION,
                credentials : {
                    accessKeyId     : process.env.AWS_ACCESS_KEY_ID,
                    secretAccessKey : process.env.AWS_SECRET_ACCESS_KEY
                }
            });

            Logger.instance().log(`SQS client instance created for region: ${process.env.AWS_REGION}`);

        } catch (error) {
            Logger.instance().log(`Failed to create SQS client instance: ${error.message}`);
            throw error;
        }
    }

    private async validateQueue(): Promise<void> {
        if (!this.queueUrl) {
            throw new Error('EVENT_QUEUE_URL environment variable is not set');
        }

        if (!this.sqsClient) {
            throw new Error('SQS client not initialized');
        }

        try {
            const command = new GetQueueAttributesCommand({
                QueueUrl       : this.queueUrl,
                AttributeNames : ['QueueArn', 'ApproximateNumberOfMessages', 'VisibilityTimeout']
            });

            const result = await this.sqsClient.send(command);

            if (result.Attributes) {
                Logger.instance().log(`Queue validation successful for: ${this.queueUrl}`);
                Logger.instance().log(`Queue ARN: ${result.Attributes.QueueArn || 'N/A'}`);
                Logger.instance().log(`Approximate messages: ${result.Attributes.ApproximateNumberOfMessages || '0'}`);
                Logger.instance().log(`Visibility timeout: ${result.Attributes.VisibilityTimeout || 'N/A'} seconds`);
            } else {
                Logger.instance().log(`Queue exists but no attributes returned: ${this.queueUrl}`);
            }

        } catch (error) {
            Logger.instance().log(`Queue validation failed for ${this.queueUrl}: ${error.message}`);
            throw new Error(`Invalid queue URL or insufficient permissions: ${error.message}`);
        }
    }

    private async initializeConnection(): Promise<void> {
        await this.createSqsInstance();
        await this.validateQueue();

        Logger.instance().log(`Consumer initialized and validated queue: ${this.queueUrl}`);
    }

    async startListening(): Promise<void> {
        if (this.isListening) {
            Logger.instance().log(`Consumer for ${this.queueUrl} already listening`);
            return;
        }

        try {
            await this.initializeConnection();

            this.isListening = true;
            this.startPolling();

            Logger.instance().log(`Started consuming events from SQS queue: ${this.queueUrl}`);

        } catch (error) {
            Logger.instance().log(`Error starting consumer for ${this.queueUrl}: ${error.message}`);
            throw error;
        }
    }

    async stopListening(): Promise<void> {
        if (!this.isListening) {
            return;
        }

        try {
            this.isListening = false;

            if (this.pollingInterval) {
                clearTimeout(this.pollingInterval);
                this.pollingInterval = null;
            }

            Logger.instance().log(`Stopped consuming events from queue: ${this.queueUrl}`);

        } catch (error) {
            Logger.instance().log(`Error stopping consumer for ${this.queueUrl}: ${error.message}`);
        }
    }

    async close(): Promise<void> {
        try {
            await this.stopListening();

            if (this.sqsClient) {
                this.sqsClient.destroy();
                this.sqsClient = null;
            }

            Logger.instance().log(`Consumer SQS client closed for queue: ${this.queueUrl}`);

        } catch (error) {
            Logger.instance().log(`Error closing consumer SQS client: ${error.message}`);
        }
    }

    async acknowledgeMessage(messageId: string): Promise<void> {
        const msg = this.pendingMessages.get(messageId);
        if (msg && this.sqsClient && msg.ReceiptHandle) {
            try {
                await this.sqsClient.send(new DeleteMessageCommand({
                    QueueUrl      : this.queueUrl,
                    ReceiptHandle : msg.ReceiptHandle
                }));
                this.pendingMessages.delete(messageId);
                Logger.instance().log(`Message acknowledged and deleted: ${messageId}`);
            } catch (error) {
                Logger.instance().log(`Error acknowledging message ${messageId}: ${error.message}`);
            }
        }
    }

    async rejectMessage(messageId: string, requeue = false): Promise<void> {
        const msg = this.pendingMessages.get(messageId);
        if (msg && this.sqsClient) {
            this.pendingMessages.delete(messageId);

            if (!requeue && msg.ReceiptHandle) {
                try {
                    await this.sqsClient.send(new DeleteMessageCommand({
                        QueueUrl      : this.queueUrl,
                        ReceiptHandle : msg.ReceiptHandle
                    }));
                    Logger.instance().log(`Message rejected and deleted: ${messageId}`);
                } catch (error) {
                    Logger.instance().log(`Error deleting rejected message ${messageId}: ${error.message}`);
                }
            } else {
                Logger.instance().log(`Message rejected and will be requeued: ${messageId}`);
            }
        }
    }

    private startPolling(): void {
        const poll = async () => {
            if (!this.isListening) {
                return;
            }

            try {
                await this.pollMessages();
            } catch (error) {
                Logger.instance().log(`Error during polling: ${error.message}`);
            }

            if (this.isListening) {
                this.pollingInterval = setTimeout(poll, this.pollingIntervalMs);
            }
        };

        poll();
    }

    private async pollMessages(): Promise<void> {
        if (!this.sqsClient || !this.isListening) {
            return;
        }

        try {
            const params: ReceiveMessageCommandInput = {
                QueueUrl              : this.queueUrl,
                MaxNumberOfMessages   : this.maxMessages,
                WaitTimeSeconds       : this.waitTimeSeconds,
                MessageAttributeNames : ['All'],
                AttributeNames        : ['All']
            };

            const command = new ReceiveMessageCommand(params);
            const result = await this.sqsClient.send(command);

            if (result.Messages && result.Messages.length > 0) {
                Logger.instance().log(`Received ${result.Messages.length} message(s) from queue`);

                for (const message of result.Messages) {
                    await this.handleMessage(message);
                }
            }

        } catch (error) {
            Logger.instance().log(`Error polling messages from ${this.queueUrl}: ${error.message}`);
        }
    }

    private async handleMessage(msg: Message | null, options?: ConsumerOptions): Promise<void> {
        if (!msg || !msg.Body) {
            return;
        }

        try {
            const eventMessage: EventMessage = JSON.parse(msg.Body);
            const eventType = eventMessage.EventType;

            if (!options?.AutoAck) {
                this.pendingMessages.set(eventMessage.EventId, msg);
            }

            Logger.instance().log(`Received ${eventType} event ${eventMessage.EventId} on queue ${this.queueUrl}`);

            try {
                await this.routeEventToHandler(eventMessage);
                Logger.instance().log(`Processed ${eventType} event ${eventMessage.EventId} successfully`);
            } catch (handlerError) {
                Logger.instance().log(`Handler error for ${eventType} event ${eventMessage.EventId}: ${handlerError.message}`);
                throw handlerError;
            }

            if (!options?.AutoAck) {
                await this.acknowledgeMessage(eventMessage.EventId);
            }

        } catch (error) {
            Logger.instance().log(`Error processing message on ${this.queueUrl}: ${error.message}`);

            if (!options?.AutoAck) {
                try {
                    const eventMessage = JSON.parse(msg.Body);
                    const shouldRequeue = options?.RequeueOnFailure !== false;
                    await this.rejectMessage(eventMessage.EventId, shouldRequeue);
                } catch (parseError) {
                    Logger.instance().log(`Error parsing message for rejection: ${parseError.message}`);
                    const messageId = msg.MessageId || 'unknown';
                    const shouldRequeue = options?.RequeueOnFailure !== false;
                    await this.rejectMessage(messageId, shouldRequeue);
                }
            }
        }
    }

    private async routeEventToHandler(eventMessage: EventMessage): Promise<void> {
        const eventType = eventMessage.EventType;

        switch (eventType) {
        case EventType.USER_DELETE:
            await EventHandler.handleUserDeletion(eventMessage);
            break;

        default:
            Logger.instance().log(`No handler found for event type: ${eventType}, skipping event ${eventMessage.EventId}`);
            break;
        }
    }

}
