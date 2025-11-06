import needle from "needle";
import { ApiError } from "../../common/api.error.js";
import type { TenantsDomainModel } from "../../domain.types/tenant/tenant.types.js";

///////////////////////////////////////////////////////////////////////////////

export class TenantService {

    static async getAllTenants(apiKey: string, baseUrl: string): Promise<TenantsDomainModel[]> {
        try {
            const url = `${baseUrl}/tenants/active`;
            const response = await needle("get", url, {
                headers : {
                    'x-api-key' : apiKey
                }
            });
            if (response.statusCode !== 200) {
                console.log(`ResponseCode: ${response.statusCode}, Body: ${JSON.stringify(response.body.error)}`);
                throw new ApiError(500, 'Error while fetching active tenants' + ' ' + response.body.error.message);
            }
            const tenants = response.body?.Data?.Tenants;
            const tenantsList: TenantsDomainModel[] = [];
            for (const tenant of tenants) {
                const tenantObj: TenantsDomainModel = {
                    id          : tenant?.id,
                    Name        : tenant?.Name,
                    Description : tenant?.Description,
                    Code        : tenant?.Code,
                    Phone       : tenant?.Phone,
                    Email       : tenant?.Email,
                };
                tenantsList.push(tenantObj);
            }
            return tenantsList;
        } catch (error) {
            console.error('Error in TenantService.getAllTenants:', error);
            return null;
        }

    }

}