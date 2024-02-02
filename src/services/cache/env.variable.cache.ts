export class EnvVariableCache {

    private static _cache: Record<string, Record<string, string>> = {};

    public static set(tenantKey: string, envKey: string, value: string): void {
        if (!this._cache[tenantKey]) {
            this._cache[tenantKey] = {};
        }
        this._cache[tenantKey][envKey] = value;
    }

    public static get(tenantKey: string, envKey: string): string | undefined {
        return this._cache[tenantKey]?.[envKey];
    }

    public static getAllForTenant(tenantKey: string): any {
        return this._cache[tenantKey];
    }

    public static delete(tenantKey: string, envKey: string): void {
        delete this._cache[tenantKey]?.[envKey];
    }

    public static clear(): void {
        this._cache = {};
    }

    public static getTenantKeys(): string[] {
        return Object.keys(this._cache);
    }
}