export class CacheMemory {

    static CacheData : { [key: string]: any } = {};

    constructor() {
        CacheMemory.CacheData = {};
    }

    static async get(key: string) : Promise<any> {
        if (key in this.CacheData) {
            
            // console.log(`Cache hit for key: ${key}: ${this.CacheData[key]}`);
            return this.CacheData[key];
        } else {
            console.log(`Cache not available for the key: ${key}`);

            //then call the rean care Api. UserTaks to get the assessment history.

            console.log(`Cache miss for key: ${key}`);
            return null;
        }
    }
    
    static set(key , value: any): void {
        this.CacheData[key] = value;

        // console.log(`Set cache for key: ${key} with value: ${JSON.stringify(value)}`);
    }

    static async update(key: string, value: any): Promise<void> {
        if (key in this.CacheData) {
            const existingValue = await this.get(key);
            const updatedValue = { ...existingValue, ...value };
            this.CacheData[key] = updatedValue;

            // console.log(`Updated cache for key: ${key} with new value: ${JSON.stringify(updatedValue)}`);
        } else {
            console.log(`Cache update failed: key '${key}' not found.`);
        }
    }

    static clear(): void {
        this.CacheData = {};
        console.log("Cache cleared");
    }

}
