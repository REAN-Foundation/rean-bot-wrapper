/* eslint-disable max-len */
import { inject, Lifecycle, scoped } from "tsyringe";
import { BlockList } from "../models/block.list.model";
import { EntityManagerProvider } from "./entity.manager.provider.service";
import { ClientEnvironmentProviderService } from "./set.client/client.environment.provider.service";
import { platformServiceInterface } from "../refactor/interface/platform.interface";
import { commonResponseMessageFormat } from "./common.response.format.object";
import { Iresponse } from "../refactor/interface/message.interface";
import { Logger } from "../common/logger";
import { SystemGeneratedMessagesService } from "./system.generated.message.service";

/////////////////////////////////////////////////////////////////////////////////////

@scoped(Lifecycle.ContainerScoped)
export class BlockUserService {

    private _platformMessageService?: platformServiceInterface;

    constructor(
        @inject(EntityManagerProvider) private entityManagerProvider?: EntityManagerProvider,
        @inject(ClientEnvironmentProviderService) private clientEnvironment?: ClientEnvironmentProviderService
    ) {}

    async isUserBlocked(req, userPlatformId: string): Promise<boolean> {
        try {

            const clientEnvironmentProviderService =
                req.container.resolve(ClientEnvironmentProviderService);

            const entityManagerProvider =
                req.container.resolve(EntityManagerProvider);

            const clientName =
                clientEnvironmentProviderService.getClientEnvironmentVariable("NAME");

            const blockRepository =
                (await entityManagerProvider
                    .getEntityManager(clientEnvironmentProviderService, clientName))
                    .getRepository(BlockList);

            const blockedUser = await blockRepository.findOne({
                where: { userPlatformID: userPlatformId }
            });

            return blockedUser ? true : false;

        } catch (error) {
            Logger.instance().log_error(error.message, 500, "Block user check error");
            return false;
        }
    }

    async handleBlockMessage(req, userPlatformId: string, res) {
        try {

            this._platformMessageService = req.container.resolve(req.params.channel);
            this._platformMessageService.res = res;
            const systemGeneratedMessages = req.container.resolve(SystemGeneratedMessagesService);
            let message = await systemGeneratedMessages.getMessage("BLOCK_MESSAGE");
            if (!message) {
                message = "Sorry, we cannot answer any further questions.";
            }

            const response_format: Iresponse = commonResponseMessageFormat();

            response_format.sessionId = userPlatformId;
            response_format.messageText = message;
            response_format.message_type = "text";

            this._platformMessageService.SendMediaMessage(response_format, null);

        } catch (error) {
            Logger.instance().log_error(error.message, 500, "Block message send error");
        }
    }
}