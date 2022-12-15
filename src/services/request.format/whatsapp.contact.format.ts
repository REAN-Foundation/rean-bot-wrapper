import { IWhatsappRequestContactsEntities } from './whatsapp.request.interface';
export class Contacts implements IWhatsappRequestContactsEntities{

    constructor(list) { this.list = list; }

    private list;

    getUserName() {
        const username:string = this.list.profile.name;
        return username;
    }

    getPlatformId() {
        const platformId:string = this.list.wa_id;
        return platformId;
    }


}