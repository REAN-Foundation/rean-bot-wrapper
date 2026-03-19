/* eslint-disable indent */
import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement } from 'sequelize-typescript';

@Table(
    {
        timestamps : true,
        modelName  : 'BlockList',
        tableName  : 'block_list'
    }
)
export class BlockList extends Model {

    @AutoIncrement
    @PrimaryKey
    @Column({
        type      : DataType.INTEGER,
        allowNull : false
    })
        id?: number;

    @Column({
        type      : DataType.STRING(256),
        allowNull : false
    })
        userPlatformID: string;

}