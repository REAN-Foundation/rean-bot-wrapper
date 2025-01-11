
export class WorkflowCache {

    static _cache = {};

    static get(key: string) {
        return this._cache[key];
    }

    static set(key: string, value: any) {
        this._cache[key] = value;
    }

    static delete(key: string) {
        delete this._cache[key];
    }

}
