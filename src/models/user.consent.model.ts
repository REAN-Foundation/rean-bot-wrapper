import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement } from 'sequelize-typescript';
import { IuserConsent } from '../refactor/interface/message.interface';

@Table(
    {
    timestamps : true,
    modelName  : 'UserConsent',
    tableName  : 'user_consent'
    }
)
export class UserConsent extends Model implements IuserConsent {

    @AutoIncrement
    @PrimaryKey
    @Column({
        type : DataType.INTEGER
    })
        id?: number;

    @Column({
        type : DataType.STRING
    })
        userPlatformID: string;

    @Column({
        type : DataType.TEXT
    })
        consentGiven: string;

}
