import { ContactListDto } from "../../../domain.types/contact.list/contact.list.domain.model";
import { ContactList } from "../../../models/contact.list";

///////////////////////////////////////////////////////////////////////////////

export class ContactListMapper {
    static toDto = (contactList: ContactList): ContactListDto => {
        if (!contactList) {
            return null;
        }
        return {
            id: contactList.id,
            mobileNumber: contactList.mobileNumber,
            patientUserId: contactList.patientUserId,
            ehrSystemCode: contactList.ehrSystemCode,
            repetitionFlag: contactList.repetitionFlag,
            username: contactList.username,
            cmrChatTaskID: contactList.cmrChatTaskID,
            cmrCaseTaskID: contactList.cmrCaseTaskID,
            preferredLanguage: contactList.preferredLanguage,
            emailID: contactList.emailID,
            platform: contactList.platform,
            optOut: contactList.optOut
        };
    }
}
