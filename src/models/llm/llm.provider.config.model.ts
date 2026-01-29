/* eslint-disable indent */
import { Table, Column, Model, DataType, PrimaryKey, IsUUID } from 'sequelize-typescript';
import { ILLMProviderConfig } from '../../refactor/interface/llm/llm.interfaces';
import { v4 } from 'uuid';

@Table(
    {
        timestamps: true,
        modelName: 'LLMProviderConfig',
        tableName: 'llm_provider_config'
    }
)

export class LLMProviderConfig extends Model implements ILLMProviderConfig {

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

    @Column({
        type: DataType.STRING(100),
        allowNull: false
    })
        providerName: string;

    @Column({
        type: DataType.STRING(100),
        allowNull: false
    })
        modelName: string;

    @Column({
        type: DataType.JSON,
        allowNull: false
    })
        apiConfig: {
            apiKeyEnvVar?: string;
            baseUrl?: string;
            temperature?: number;
            [key: string]: any;
        };

    // Capabilities
    @Column({
        type: DataType.BOOLEAN,
        defaultValue: true,
        allowNull: false
    })
        supportsIntentClassification: boolean;

    @Column({
        type: DataType.BOOLEAN,
        defaultValue: true,
        allowNull: false
    })
        supportsEntityExtraction: boolean;

    @Column({
        type: DataType.BOOLEAN,
        defaultValue: true,
        allowNull: false
    })
        supportsMultilingual: boolean;

    // Performance
    @Column({
        type: DataType.INTEGER,
        allowNull: false
    })
        maxTokens: number;

    @Column({
        type: DataType.FLOAT,
        allowNull: false
    })
        temperature: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false
    })
        timeoutMs: number;

    @Column({
        type: DataType.FLOAT,
        allowNull: false
    })
        costPer1kTokens: number;

    @Column({
        type: DataType.BOOLEAN,
        defaultValue: true,
        allowNull: false
    })
        enabled: boolean;

    @Column({
        type: DataType.INTEGER,
        defaultValue: 0,
        allowNull: false
    })
        priority: number;
}
