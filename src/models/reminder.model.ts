/* eslint-disable indent */
import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement } from 'sequelize-typescript';
import { IReminder } from '../refactor/interface/message.interface';

@Table({
    timestamps: true,
    modelName: 'reminderMessage',
    tableName: 'reminder_message',
})
export class ReminderMessage extends Model implements IReminder {

    @AutoIncrement
    @PrimaryKey
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    declare id?: number;

    @Column({
        type: DataType.STRING(256), // or INTEGER if userId is numeric
        allowNull: false,
    })
    userId: string;

    @Column({
        type: DataType.STRING(1024),
    })
    MessageId: string;

    @Column({
        type: DataType.STRING(256),
        allowNull: true,
    })
    ReminderId: string;

    @Column({
        type: DataType.STRING(256),
        allowNull: true,
    })
    ReminderDate: string;

    @Column({
        type: DataType.STRING(256),
        allowNull: true,
        defaultValue: '00:00',
    })
    ReminderTime: string;

    @Column({
        type: DataType.STRING(256),
        allowNull: true,
    })
    ParentActionId: string;

}
