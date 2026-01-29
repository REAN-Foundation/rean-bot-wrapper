/* eslint-disable indent */
import { Table, Column, Model, DataType, PrimaryKey, IsUUID } from 'sequelize-typescript';
import { IFeatureFlag } from '../../refactor/interface/llm/llm.interfaces';
import { v4 } from 'uuid';

@Table(
    {
        timestamps: true,
        modelName: 'FeatureFlag',
        tableName: 'feature_flags'
    }
)

export class FeatureFlag extends Model implements IFeatureFlag {

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
        type: DataType.STRING(128),
        allowNull: false,
        unique: true
    })
        flagName: string;

    @Column({
        type: DataType.TEXT
    })
        description: string;

    @Column({
        type: DataType.BOOLEAN,
        defaultValue: false,
        allowNull: false
    })
        enabled: boolean;

    @Column({
        type: DataType.INTEGER,
        defaultValue: 0,
        allowNull: false
    })
        rolloutPercentage: number;

    // Targeting
    @Column({
        type: DataType.JSON
    })
        targetIntents: string[];

    @Column({
        type: DataType.JSON
    })
        targetUsers: string[];

    @Column({
        type: DataType.JSON
    })
        targetPlatforms: string[];

    @Column({
        type: DataType.JSON
    })
        environments: string[];

    @Column({
        type: DataType.DATE
    })
        expiresAt: Date;
}
