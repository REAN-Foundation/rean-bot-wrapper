import {countryMapping} from '../assets/static.data/phone.number.codes';
import { PhoneNumberUtil } from 'google-libphonenumber';
import { injectable } from 'tsyringe';

@injectable()
export class CountryCodeService {
    private mapping: Record<string, any>;
    private phoneUtil: PhoneNumberUtil;

    constructor() {
        this.mapping = countryMapping;
        this.phoneUtil = PhoneNumberUtil.getInstance();
    }

    async getCountryCode(phone: string) {
        const digits = [...phone].map(Number).filter(digit => !isNaN(digit));
        return this.traverseTree(digits, this.mapping);
    }

    private async traverseTree(keys: number[], tree: any): Promise<string> {
        const nextKey = keys.shift();
        if (nextKey === undefined) {
            throw new Error(`Invalid phone number.`);
        }

        const nextElement = tree[nextKey];
        if (typeof nextElement === 'object') {
            return this.traverseTree(keys, nextElement);
        }
        return nextElement;
    }

    public async formatPhoneNumber(phone: string): Promise<string> {
        const countryName = await this.getCountryCode(phone);
        const number = await this.phoneUtil.parseAndKeepRawInput(phone, countryName);
        const countryCode = await number.getCountryCode();
        const phoneNumber = phone.slice(countryCode.toString().length);
        const formattedPhoneNummber = `+${countryCode}-${phoneNumber }`;
        return  formattedPhoneNummber;
    }


}