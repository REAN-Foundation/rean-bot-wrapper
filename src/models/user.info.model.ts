/* eslint-disable indent */
import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { ContactList } from './contact.list.js';
import { Gender } from '../refactor/messageTypes/user.info.types.js';
import type { IuserInfo } from '../refactor/interface/user.info.interface.js';

@Table(
    {
        timestamps : true,
        modelName  : 'UserInfo',
        tableName  : 'user_info'
    }
)

export class UserInfo extends Model implements IuserInfo {

    @AutoIncrement
    @PrimaryKey
    @Column({
        type        : DataType.INTEGER,
        allowNull   : false
    })
        autoIncrementalID: number;

    @ForeignKey(() => ContactList)
    @Column({
        type        : DataType.INTEGER,
        allowNull   : false
    })
        userID: number;

    @BelongsTo(() => ContactList)
        ContactList: ContactList;

    @Column({
        type    : DataType.STRING(256)
    })
        userPlatformID: string;

    @Column({
        type    : DataType.STRING(256)
    })
        userName?: string;

    @Column({
        type    : DataType.INTEGER
    })
        userAge?: number;

    @Column({
        type    : DataType.STRING(256)
    })
        userGender?: Gender;

    @Column({
        type    : DataType.STRING()
    })
        userInfo?: string;

    @Column({
        type        : DataType.BOOLEAN,
        defaultValue: false
    })
        infoProvided?: boolean;
}
