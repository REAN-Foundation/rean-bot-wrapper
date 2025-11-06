import type { IApiRequestContactsEntities } from './api.request.interface.js';
export class Contacts implements IApiRequestContactsEntities{

    constructor(list) { this.list = list; }

    private list;

    getUserName() {
        const username:string = this.list.profile.name;
        return username;
    }

    getPlatformId() {
        const platformId:string = this.list.id;
        return platformId;
    }

}
