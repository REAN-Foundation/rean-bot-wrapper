/* eslint-disable indent */
import { Table, Column, Model, DataType, PrimaryKey, IsUUID, Unique } from 'sequelize-typescript';
import { ISystemGeneratedMessageMetadata } from '../refactor/interface/system.generated.messages';
import { v4 } from 'uuid';

@Table(
    {
        timestamps : true,
        modelName : 'SystemGeneratedMessageMetadata',
        tableName : 'system_generated_message_metadata'
    }
)

export class SystemGeneratedMessageMetadata extends Model implements ISystemGeneratedMessageMetadata {

    @IsUUID(4)
    @PrimaryKey
    @Column({
        type : DataType.UUID,
        defaultValue : () => {
            return v4();
        },
        allowNull : false
    })
        id: string;

    // References system_generated_messages.id. One metadata row per message.
    @Unique
    @Column({
        type : DataType.UUID,
        allowNull : false
    })
        messageId: string;

    // A Dialogflow-shaped custom payload describing the extra message(s) to send after
    // the message itself. Either the full { messagetype: 'custom_payload', payload: [...] }
    // object or just the array of payload entries.
    @Column({
        type : DataType.JSON,
        allowNull : true
    })
        customPayload?: any;

}
