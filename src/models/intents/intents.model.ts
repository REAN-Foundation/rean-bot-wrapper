/* eslint-disable indent */
import { Table, Column, Model, DataType, PrimaryKey, IsUUID } from 'sequelize-typescript';
import { IIntents, LLMProvider, EntitySchema, ConversationConfig } from '../../refactor/interface/intents/intents.interface';
import { IntentType } from '../../refactor/messageTypes/intents/intents.message.types';
import { v4 } from 'uuid';
@Table(
    {
        timestamps : true,
        modelName : 'Intents',
        tableName : 'intents'
    }
)

export class Intents extends Model implements IIntents {

    @IsUUID(4)
    @PrimaryKey
    @Column({
        type : DataType.INTEGER,
        defaultValue : () => {
            return v4();
        },
        allowNull : false
    })
        id: string;

    @Column({
        type : DataType.STRING(64),
        allowNull : false
    })
        name: string;

    @Column({
        type : DataType.STRING(128),
        allowNull : false
    })
        code: string;

    @Column({
        type : DataType.STRING(128)
    })
        type: IntentType;

    @Column({
        type : DataType.TEXT()
    })
        Metadata: string;

    // LLM Configuration
    @Column({
        type : DataType.BOOLEAN,
        defaultValue : false,
        allowNull : false
    })
        llmEnabled: boolean;

    @Column({
        type : DataType.ENUM('dialogflow', 'openai', 'claude'),
        defaultValue : 'dialogflow',
        allowNull : false
    })
        llmProvider: LLMProvider;

    @Column({
        type : DataType.TEXT
    })
        intentDescription: string;

    @Column({
        type : DataType.JSON
    })
        intentExamples: string[];

    // Entity Configuration
    @Column({
        type : DataType.JSON
    })
        entitySchema: EntitySchema;

    // Conversation Configuration
    @Column({
        type : DataType.JSON
    })
        conversationConfig: ConversationConfig;

    // Classification Settings
    @Column({
        type : DataType.FLOAT,
        defaultValue : 0.75,
        allowNull : false
    })
        confidenceThreshold: number;

    @Column({
        type : DataType.BOOLEAN,
        defaultValue : true,
        allowNull : false
    })
        fallbackToDialogflow: boolean;

    @Column({
        type : DataType.INTEGER,
        defaultValue : 0,
        allowNull : false
    })
        priority: number;

    @Column({
        type : DataType.BOOLEAN,
        defaultValue : true,
        allowNull : false
    })
        active: boolean;

}
