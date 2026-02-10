import { scoped, Lifecycle } from 'tsyringe';
import { BaseLLMListener } from '../base.llm.listener';
import { LLMEventObject, LLMListenerResponse } from '../../../refactor/interface/llm/llm.event.interfaces';
import { userHistoryDeletionService } from '../../../services/user.history.deletion.service';
import { SystemGeneratedMessagesService } from '../../../services/system.generated.message.service';

/**
 * LLM-native Delete User Listener
 *
 * Handles user data deletion confirmation via button click.
 * When user clicks the confirmation button, this listener processes the deletion.
 *
 * Flow:
 * 1. User requests to delete data
 * 2. Bot sends confirmation message with Yes/No buttons
 * 3. User clicks Yes button → triggers `user.history.delete.yes` intent
 * 4. User clicks No button → triggers `user.history.delete.no` intent
 *
 * This listener handles the YES confirmation (actual deletion).
 */
@scoped(Lifecycle.ContainerScoped)
export class DeleteUserYesListener extends BaseLLMListener {

    readonly intentCode = 'user.history.delete.yes';

    async handle(event: LLMEventObject): Promise<LLMListenerResponse> {
        this.log(`Processing delete user confirmation (YES) for: ${event.userId}`);

        try {
            // Get services from container
            const userDeletionService = this.resolve(event, userHistoryDeletionService);
            const systemGeneratedMessages = this.resolve(event, SystemGeneratedMessagesService);

            // User confirmed deletion via button click
            this.log(`User ${event.userId} confirmed deletion, proceeding...`);

            await userDeletionService.deleteUserFromAllServices(event.userId);

            // Get success message from system messages or use default
            let successMessage = await systemGeneratedMessages.getMessage('DELETE_YES_MESSAGE');
            if (!successMessage) {
                successMessage = 'Your data has been successfully deleted. Thank you for using our service.';
            }

            this.log(`User data deleted successfully for: ${event.userId}`);

            return this.success(successMessage, {
                action: 'deleted',
                userId: event.userId
            });

        } catch (error) {
            this.logError('Error processing delete user request', error);
            return this.error(
                'An error occurred while processing your request. Please try again later.'
            );
        }
    }
}

/**
 * LLM-native Delete User Cancellation Listener
 *
 * Handles user data deletion cancellation via button click.
 * When user clicks the No button, this listener confirms cancellation.
 */
@scoped(Lifecycle.ContainerScoped)
export class DeleteUserNoListener extends BaseLLMListener {

    readonly intentCode = 'user.history.delete.no';

    async handle(event: LLMEventObject): Promise<LLMListenerResponse> {
        this.log(`Processing delete user cancellation (NO) for: ${event.userId}`);

        try {
            const systemGeneratedMessages = this.resolve(event, SystemGeneratedMessagesService);

            // User cancelled deletion via button click
            this.log(`User ${event.userId} cancelled deletion`);

            let cancelMessage = await systemGeneratedMessages.getMessage('DELETE_NO_MESSAGE');
            if (!cancelMessage) {
                cancelMessage = 'Your data deletion has been cancelled. Your information remains safe with us.';
            }

            return this.success(cancelMessage, {
                action: 'cancelled',
                userId: event.userId
            });

        } catch (error) {
            this.logError('Error processing delete user cancellation', error);
            return this.error(
                'An error occurred while processing your request. Please try again later.'
            );
        }
    }
}
