import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement } from 'sequelize-typescript';
import type { IuserConsent } from '../refactor/interface/message.interface.js';

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
        declare id?: number;

    @Column({
        type : DataType.STRING
    })
        userPlatformID: string;

    @Column({
        type : DataType.TEXT
    })
        consentGiven: string;

}
