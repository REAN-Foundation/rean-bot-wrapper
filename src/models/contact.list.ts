import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement } from 'sequelize-typescript';
import { contactList } from '../refactor/interface/message.interface';

@Table({
    timestamps : true,
    modelName  : 'ContactList',
    tableName  : 'contact_list'
})
export class ContactList extends Model implements contactList {
    
    @AutoIncrement
    @PrimaryKey
    @Column({
        type : DataType.INTEGER
    })
        autoIncrementalID: number;

    @Column({
        type : DataType.STRING
    })
        mobileNumber: string;

    @Column({
        type : DataType.STRING
    })
        username: string;

    @Column({
        type : DataType.STRING
    })
        preferredLanguage: string;

    @Column({
        type : DataType.STRING
    })
        emailID: string;
    
    @Column({
        type : DataType.STRING
    })
        platform: string;

}
