
export class CacheMap<V> {

    private cache: Map<string, V>;

    constructor() {
        this.cache = new Map<string, V>();
    }

    set(key: string, value: V): void {
        this.cache.set(key, value);
    }

    get(key: string): V | undefined {
        return this.cache.get(key);
    }

    has(key: string): boolean {
        return this.cache.has(key);
    }

    delete(key: string): boolean {
        return this.cache.delete(key);
    }

    clear(): void {
        this.cache.clear();
    }

    get size(): number {
        return this.cache.size;
    }

    keys(): IterableIterator<string> {
        return this.cache.keys();
    }

    entries(): IterableIterator<[string, V]> {
        return this.cache.entries();
    }

    findAndClear(searchPattern: string): string[] {
        let keys: string[] = [];
        for (let key of this.cache.keys()) {
            if (key.includes(searchPattern)) {
                keys.push(key);
            }
        }
        for (let key of keys) {
            this.cache.delete(key);
        }
        return keys;
    }
        
}

////////////////////////////////////////////////////////////////////////////////////////
