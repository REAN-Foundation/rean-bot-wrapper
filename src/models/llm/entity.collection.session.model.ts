/* eslint-disable indent */
import { Table, Column, Model, DataType, PrimaryKey, IsUUID, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { IEntityCollectionSession, SessionStatus } from '../../refactor/interface/llm/llm.interfaces';
import { Intents } from '../intents/intents.model';
import { v4 } from 'uuid';

@Table(
    {
        timestamps: true,
        modelName: 'EntityCollectionSession',
        tableName: 'entity_collection_sessions'
    }
)

export class EntityCollectionSession extends Model implements IEntityCollectionSession {

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
        allowNull: false
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
        type: DataType.STRING(255),
        allowNull: false
    })
        sessionId: string;

    @Column({
        type: DataType.STRING(255),
        allowNull: false
    })
        intentCode: string;

    // Session State
    @Column({
        type: DataType.ENUM('active', 'completed', 'abandoned', 'timeout'),
        allowNull: false
    })
        status: SessionStatus;

    @Column({
        type: DataType.INTEGER,
        defaultValue: 1,
        allowNull: false
    })
        currentTurn: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false
    })
        maxTurns: number;

    // Entity Collection Progress
    @Column({
        type: DataType.JSON,
        allowNull: false
    })
        requiredEntities: any;

    @Column({
        type: DataType.JSON,
        allowNull: false
    })
        collectedEntities: any;

    // Conversation History
    @Column({
        type: DataType.JSON,
        allowNull: false
    })
        conversationHistory: Array<{
            turn: number;
            userMessage: string;
            botResponse: string;
            entitiesExtracted: any;
        }>;

    // Timing
    @Column({
        type: DataType.DATE,
        allowNull: false
    })
        startedAt: Date;

    @Column({
        type: DataType.DATE,
        allowNull: false
    })
        lastActivityAt: Date;

    @Column({
        type: DataType.DATE,
        allowNull: false
    })
        timeoutAt: Date;
}
