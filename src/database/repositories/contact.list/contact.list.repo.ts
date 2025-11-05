import { ContactList } from "../../../models/contact.list";
import { ContactListDto } from "../../../domain.types/contact.list/contact.list.domain.model";
import { ContactListMapper } from "../../mapper/contact.list/contact.list.mapper";
import { RepositoryHelper } from "../repo.helper";

///////////////////////////////////////////////////////////////////////////////

export class ContactListRepo {

    static findContactByMobileNumber = async (
        container,
        mobileNumber: string
    ): Promise<ContactListDto | null> => {
        try {
            const entityManager = await RepositoryHelper.resolveEntityManager(container);
            const contactListRepository = entityManager.getRepository(ContactList);

            const result: ContactList | null = await contactListRepository.findOne({
                where: { mobileNumber },
            });

            if (!result) {
                return null;
            }

            const contactListDto: ContactListDto = ContactListMapper.toDto(result);
            return contactListDto;

        } catch (error) {
            console.error("Error finding contact list by mobile number:", error);
            return null;
        }
    };

    static createContact = async (
        container,
        contactData: ContactListDto
    ): Promise<ContactListDto | null> => {
        try {
            const entityManager = await RepositoryHelper.resolveEntityManager(container);
            const contactListRepository = entityManager.getRepository(ContactList);

            const newContact = await contactListRepository.create(contactData);
            const savedContact = await newContact.save();

            const contactListDto: ContactListDto = ContactListMapper.toDto(savedContact);
            return contactListDto;

        } catch (error) {
            console.error("Error creating new contact list record:", error);
            return null;
        }
    };

    static updateContactByMobileNumber = async (
        container,
        mobileNumber: string,
        updates: Partial<ContactListDto>
    ): Promise<ContactListDto | null> => {
        try {
            const entityManager = await RepositoryHelper.resolveEntityManager(container);
            const contactListRepository = entityManager.getRepository(ContactList);

            const contact = await contactListRepository.findOne({ where: { mobileNumber } });
            if (!contact) {
                console.warn(`Contact not found for mobile number: ${mobileNumber}`);
                return null;
            }

            await contact.update(updates);
            const updatedContact = await contact.reload();

            const contactListDto: ContactListDto = ContactListMapper.toDto(updatedContact);
            return contactListDto;

        } catch (error) {
            console.error("Error updating contact list record:", error);
            return null;
        }
    };
}
