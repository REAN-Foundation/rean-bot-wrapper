export class CacheMemory {

    static CacheData : { [key: string]: any } = {};

    constructor() {
        CacheMemory.CacheData = {};
    }

    static async get(key: string) : Promise<any> {
        if (key in this.CacheData) {
            console.log(`Cache hit for key: ${key}`);
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
        console.log(`Set cache for key: ${key} with value: ${JSON.stringify(value)}`);
    }

    static clear(): void {
        this.CacheData = {};
        console.log("Cache cleared");
    }
    
    // Example usage:
    //this.Cache.set("user1", { name: "Alice", age: 30 })

}
