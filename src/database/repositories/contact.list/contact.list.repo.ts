import { Op } from "sequelize";
import { DependencyContainer } from "tsyringe";
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
            const mobileNumberValue = mobileNumber != null ? String(mobileNumber) : mobileNumber;
            const result: ContactList | null = await contactListRepository.findOne({ where: { mobileNumber: mobileNumberValue } });

            const contactListDto: ContactListDto = ContactListMapper.toDto(result);
            return contactListDto;
        } catch (error) {
            console.error('Error finding contact list by mobile number:', error);
            return null;
        }
    };

    static countInRange = async (
        container: DependencyContainer,
        startDate: Date,
        endDate: Date
    ): Promise<number> => {
        try {
            const entityManager = await RepositoryHelper.resolveEntityManager(container);
            const contactListRepository = entityManager.getRepository(ContactList);
            return await contactListRepository.count({
                where : { createdAt: { [Op.gte]: startDate, [Op.lt]: endDate } }
            });
        } catch (error) {
            console.error('Error in ContactListRepo.countInRange:', error);
            throw error;
        }
    };

    static countAll = async (container: DependencyContainer): Promise<number> => {
        try {
            const entityManager = await RepositoryHelper.resolveEntityManager(container);
            const contactListRepository = entityManager.getRepository(ContactList);
            return await contactListRepository.count();
        } catch (error) {
            console.error('Error in ContactListRepo.countAll:', error);
            throw error;
        }
    };

}
