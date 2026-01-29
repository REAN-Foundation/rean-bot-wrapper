/* eslint-disable indent */
import { Table, Column, Model, DataType, PrimaryKey, IsUUID, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { IIntentClassificationLog, ClassificationMethod } from '../../refactor/interface/llm/llm.interfaces';
import { Intents } from '../intents/intents.model';
import { v4 } from 'uuid';

@Table(
    {
        timestamps: true,
        modelName: 'IntentClassificationLog',
        tableName: 'intent_classification_logs'
    }
)

export class IntentClassificationLog extends Model implements IIntentClassificationLog {

    @IsUUID(4)
    @PrimaryKey
    @Column({
        type: DataType.UUID,
        defaultValue: () => {
            return v4();
        },
        allowNull: false
    })
        id: string;

    @ForeignKey(() => Intents)
    @Column({
        type: DataType.INTEGER,
        allowNull: true
    })
        intentId: string;

    @BelongsTo(() => Intents)
        Intent: Intents;

    @Column({
        type: DataType.STRING(255),
        allowNull: false
    })
        userPlatformId: string;

    @Column({
        type: DataType.TEXT,
        allowNull: false
    })
        userMessage: string;

    @Column({
        type: DataType.STRING(10)
    })
        detectedLanguage: string;

    // LLM Result
    @Column({
        type: DataType.STRING(50)
    })
        llmProvider: string;

    @Column({
        type: DataType.STRING(100)
    })
        llmModel: string;

    @Column({
        type: DataType.STRING(128)
    })
        classifiedIntent: string;

    @Column({
        type: DataType.FLOAT
    })
        confidenceScore: number;

    // Decision Path
    @Column({
        type: DataType.ENUM('llm', 'dialogflow', 'button'),
        allowNull: false
    })
        classificationMethod: ClassificationMethod;

    @Column({
        type: DataType.BOOLEAN,
        defaultValue: false,
        allowNull: false
    })
        fallbackTriggered: boolean;

    @Column({
        type: DataType.JSON
    })
        dialogflowResult: any;

    // Performance Metrics
    @Column({
        type: DataType.INTEGER
    })
        processingTimeMs: number;

    @Column({
        type: DataType.JSON
    })
        tokenUsage: any;
}
