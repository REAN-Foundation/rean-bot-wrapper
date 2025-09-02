import { ContactList } from "../../../models/contact.list";
import { ContactListDto } from "../../../domain.types/contact.list/contact.list.domain.model";
import { ContactListMapper } from "../../mapper/contact.list/contact.list.mapper";
import { RepositoryHelper } from "../repo.helper";

///////////////////////////////////////////////////////////////////////////////

export class ContactListRepo {

    static findContactByMobileNumber = async (container, mobileNumber: string): Promise<ContactListDto | null> => {
        try {        
            const entityManager = await RepositoryHelper.resolveEntityManager(container);
            const contactListRepository = entityManager.getRepository(ContactList);
            const result: ContactList | null = await contactListRepository.findOne({ where: { mobileNumber } });

            const contactListDto: ContactListDto = ContactListMapper.toDto(result);
            return contactListDto;
        } catch (error) {
            console.error('Error finding contact list by mobile number:', error);
            return null;
        }
    }
}
