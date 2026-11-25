/* eslint-disable indent */
import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement } from "sequelize-typescript";
import { IAssessmentResponses } from "../../refactor/interface/assessment/assessment.responses.interface";
import { AssessmentResponseType } from "../../refactor/messageTypes/assessment/assessment.responses.types";


@Table(
    {
        timestamps: true,
        modelName: 'AssessmentResponses',
        tableName: 'assessment_responses'
    }
)

export class AssessmentResponses extends Model implements IAssessmentResponses {

    @AutoIncrement
    @PrimaryKey
    @Column({
        type : DataType.INTEGER,
        allowNull : false
    })
        id: number;

    @Column({
        type : DataType.STRING(128)
    })
        name: string;

    @Column({
        type : DataType.STRING(64)
    })
        code: string;

    @Column({
        type : DataType.STRING(64)
    })
        type: AssessmentResponseType;

    @Column({
        type : DataType.TEXT()
    })
        metaData: JSON;
}
