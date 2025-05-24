/* eslint-disable indent */
import { Table, Column, Model, DataType, PrimaryKey, IsUUID } from 'sequelize-typescript';
import { ISystemGeneratedMessages } from '../refactor/interface/system.generated.messages';
import { v4 } from 'uuid';

@Table(
    {
        timestamps : true,
        modelName : 'SystemGeneratedMessages',
        tableName : 'system_generated_messages'
    }
)

export class SystemGeneratedMessages extends Model implements ISystemGeneratedMessages {

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

    @Column({
        type : DataType.STRING(256),
        allowNull : false
    })
        messageName: string;
    
    @Column({
        type: DataType.TEXT,
        allowNull : false
    })
        messageContent: string;

    @Column({
        type: DataType.STRING(48)
    })
        languageCode?: string;

}
