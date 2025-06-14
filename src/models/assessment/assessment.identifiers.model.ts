/* eslint-disable indent */
import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { IAssessmentIdentifiers } from '../../refactor/interface/assessment/assessment.interface';
import { AssessmentSessionLogs } from '../assessment.session.model';

@Table(
    {
        timestamps : true,
        modelName : 'AssessmentIdentifiers',
        tableName : 'assessment_identifiers'
    }
)

export class AssessmentIdentifiers extends Model implements IAssessmentIdentifiers {

    @AutoIncrement
    @PrimaryKey
    @Column({
        type : DataType.INTEGER,
        allowNull : false
    })
        autoIncrementalID?: number;
    
    @ForeignKey(() => AssessmentSessionLogs)
    @Column({
        type : DataType.INTEGER,
        allowNull : false
    })
        assessmentSessionId: number;

    @BelongsTo(() => AssessmentSessionLogs)
        AssessmentSessionLogs: AssessmentSessionLogs;

    @Column({
        type : DataType.STRING(64),
        allowNull : true
    })
        identifier: string;

    @Column({
        type : DataType.STRING(64),
        allowNull : true
    })
        userResponseType: string;

    @Column({
        type : DataType.STRING(64),
        allowNull : true
    })
        identifierUnit: string;

}
