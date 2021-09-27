
export interface ApiClientDto {
    id: string;
    ClientName: string;
    ClientCode: string;
    Phone: string;
    Email: string;
    IsActive: boolean;
}

export interface ClientApiKeyDto {
    id: string;
    ClientName: string;
    ClientCode: string;
    ApiKey: string;
    ValidFrom: Date;
    ValidTill: Date;
}
