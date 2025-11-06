import { NeedleService } from '../needle.service.js';
import { ClientEnvironmentProviderService } from '../set.client/client.environment.provider.service.js';
import { inject, Lifecycle, scoped,  } from 'tsyringe';

@scoped(Lifecycle.ContainerScoped)
export class careplanEnrollment{

    constructor(
            // eslint-disable-next-line max-len
            @inject(ClientEnvironmentProviderService) private EnvironmentProviderService: ClientEnvironmentProviderService,
            @inject(NeedleService) private needleService?: NeedleService,
    ) {}

    async carePlanEnrollment(patientUserId, authenticationKey, dayOffset,
        careplanCodeName, tenantName, channelName)
    {
        const enrollmentUrl = `care-plans/patients/${patientUserId}/enroll`;
        const todayDate = new Date().toISOString().split("T")[0];
        const dataObj = {
            Provider   : "REAN",
            PlanCode   : careplanCodeName,
            DayOffset  : dayOffset,
            StartDate  : todayDate,
            TenantName : tenantName,
            Channel    : channelName
        };

        try {
            const response = await this.needleService.needleRequestForREAN("post", enrollmentUrl, null, dataObj, authenticationKey);
            return response;
        } catch (error) {
            console.error("Error enrolling in care plan:", error.message);
            throw error;
        }
    }

    async careplanUnEnrollement(patientUserId, authenticationKey) {
        try {
            const careplanEnrollments = await this.getCareplanEnrollmentID(patientUserId, authenticationKey);
            for (const careplanEnrollment of careplanEnrollments) {
                const careplanUnenrollmentUrl = `care-plans/${careplanEnrollment.id}/stop`;
                const response = await this.needleService.needleRequestForREAN("post", careplanUnenrollmentUrl, null, null, authenticationKey);
                console.log(response.status);
            }

        } catch (error) {
            console.error("Error unenrolling from care plan:", error.message);
            throw error;
        }
    }

    async getCareplanEnrollmentID(patientUserId,authenticationKey){
        try {
            const getEnrollmentsURL = `care-plans/patients/${patientUserId}/active-enrollments`;
            const response = await this.needleService.needleRequestForREAN("get", getEnrollmentsURL,null,null,authenticationKey);
            console.log("User is registered");
            return response.Data.PatientEnrollments;
        } catch (error) {
            console.error("Error enrolling in care plan:", error.message);
            throw error;
        }

    }

}
