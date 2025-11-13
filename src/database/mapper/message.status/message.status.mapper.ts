import { MessageStatusDto } from "../../../domain.types/message.status/message.status.domain.model";
import { MessageStatus } from "../../../models/message.status";

///////////////////////////////////////////////////////////////////////////////

export class MessageStatusMapper {

    static toDto = (messageStatus: MessageStatus): MessageStatusDto => {
        if (!messageStatus) {
            return null;
        }
        const dto: MessageStatusDto = {
            autoIncrementalID       : messageStatus.autoIncrementalID,
            chatMessageId           : messageStatus.chatMessageId,
            channel                 : messageStatus.channel,
            messageStatus           : messageStatus.messageStatus,
            messageSentTimestamp    : messageStatus.messageSentTimestamp,
            messageDeliveredTimestamp: messageStatus.messageDeliveredTimestamp,
            messageReadTimestamp    : messageStatus.messageReadTimestamp,
            messageRepliedTimestamp : messageStatus.messageRepliedTimestamp,
        };

        return dto;
    };

}
