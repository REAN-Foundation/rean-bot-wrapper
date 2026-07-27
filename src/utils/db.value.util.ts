import { DataTypes } from 'sequelize';

export function toDbString(value: unknown): string | null | undefined {
    if (value === null || value === undefined) {
        return value as null | undefined;
    }
    return String(value);
}

function isStringColumn(attribute: any): boolean {
    const type = attribute?.type;
    if (!type) {
        return false;
    }
    return type instanceof DataTypes.STRING
        || type instanceof DataTypes.TEXT
        || type instanceof DataTypes.CHAR;
}

function coerceValue(value: any): any {
    if (typeof value === 'number') {
        return String(value);
    }
    if (Array.isArray(value)) {
        return value.map(coerceValue);
    }
    if (value && typeof value === 'object') {
        for (const sym of Object.getOwnPropertySymbols(value)) {
            value[sym] = coerceValue(value[sym]);
        }
        for (const key of Object.keys(value)) {
            value[key] = coerceValue(value[key]);
        }
        return value;
    }
    return value;
}

export function coerceStringWhereValues(model: any, options: any): void {
    try {
        const where = options?.where;
        if (!where || typeof where !== 'object') {
            return;
        }
        const attributes = model?.rawAttributes ?? {};
        const walk = (node: any): void => {
            if (!node || typeof node !== 'object') {
                return;
            }
            for (const sym of Object.getOwnPropertySymbols(node)) {
                const val = node[sym];
                if (Array.isArray(val)) {
                    val.forEach(walk);
                } else if (val && typeof val === 'object') {
                    walk(val);
                }
            }
            for (const key of Object.keys(node)) {
                if (attributes[key] && isStringColumn(attributes[key])) {
                    node[key] = coerceValue(node[key]);
                } else {
                    const val = node[key];
                    if (Array.isArray(val)) {
                        val.forEach(walk);
                    } else if (val && typeof val === 'object') {
                        walk(val);
                    }
                }
            }
        };
        walk(where);
    } catch (error) {
        console.log('coerceStringWhereValues hook error:', error);
    }
}

export function coerceStringInstanceValues(model: any, instance: any): void {
    try {
        if (!instance) {
            return;
        }
        const attributes = model?.rawAttributes ?? {};
        for (const key of Object.keys(attributes)) {
            if (!isStringColumn(attributes[key])) {
                continue;
            }
            const value = instance.getDataValue ? instance.getDataValue(key) : instance[key];
            if (typeof value === 'number') {
                if (instance.setDataValue) {
                    instance.setDataValue(key, String(value));
                } else {
                    instance[key] = String(value);
                }
            }
        }
    } catch (error) {
        console.log('coerceStringInstanceValues hook error:', error);
    }
}

export function registerStringCoercionHooks(sequelize: any): void {
    const models = Object.values(sequelize?.models ?? {});
    for (const model of models) {
        (model as any).addHook('beforeFind', (options: any) => coerceStringWhereValues(model, options));
        (model as any).addHook('beforeCount', (options: any) => coerceStringWhereValues(model, options));
        (model as any).addHook('beforeBulkUpdate', (options: any) => coerceStringWhereValues(model, options));
        (model as any).addHook('beforeBulkDestroy', (options: any) => coerceStringWhereValues(model, options));
        (model as any).addHook('beforeSave', (instance: any) => coerceStringInstanceValues(model, instance));
        (model as any).addHook('beforeBulkCreate', (instances: any) => {
            if (Array.isArray(instances)) {
                instances.forEach((instance) => coerceStringInstanceValues(model, instance));
            }
        });
    }
}
