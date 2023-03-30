import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, HasMany } from 'sequelize-typescript';
import { chatSession } from '../refactor/interface/message.interface';
import { ChatMessage } from './chat.message.model';

@Table({
    timestamps : true,
    modelName  : 'ChatSession',
    tableName  : 'chat_session'
})
export class ChatSession extends Model implements chatSession {
    
    @AutoIncrement
    @PrimaryKey
    @Column({
        type      : DataType.INTEGER,
        allowNull : false
    })
        autoIncrementalID: number;

    @Column({
        type : DataType.STRING
    })
        contactID: string;

    @Column({
        type : DataType.STRING
    })
        userPlatformID: string;

    @Column({
        type : DataType.STRING
    })
        preferredLanguage: string;

    @Column({
        type : DataType.STRING
    })
        platform: string;
    
    @Column({
        type : DataType.DATE
    })
        lastMessageDate: any;

    @Column({
        type : DataType.STRING,
    })
        sessionOpen: string;

    @Column({
        type : DataType.STRING,
    })
        askForFeedback: string;

    @HasMany(() => ChatMessage)
        ChatMessage: ChatMessage[];

}
