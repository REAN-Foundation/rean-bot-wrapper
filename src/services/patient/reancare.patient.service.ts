import axios from "axios";

export class ReancarePatientService {

    public static GetPatientFirstName = async (patientUserId: string): Promise<string | null> => {
        try {
            console.log("Fetching first name for patientUserId:", patientUserId);
            if (!patientUserId) {
                return null;
            }
            const baseURL = process.env["REAN_APP_BACKEND_BASE_URL"];
            const apiURL = `${baseURL}patients/${patientUserId}`;
            const options = ReancarePatientService.getOptions();
            const response = await axios.get(apiURL, options);
            if (response.status !== 200 && response.status !== 201) {
                console.log("Error fetching patient details from REAN", response.data);
                return null;
            }
            const firstName = response.data?.Data?.User?.Person?.FirstName;
            console.log("Fetched first name from REAN for patientUserId", patientUserId, "is", response.data?.Data?.Patient?.User?.Person?.FirstName);
            return firstName && firstName.trim() !== '' ? firstName : null;
        } catch (error: any) {
            console.error('[ReancarePatientService.GetPatientFirstName] Error:', error?.message);
            return null;
        }
    };

    private static getOptions = () => {
        const apiKey = process.env["REANCARE_API_KEY"];
        return {
            headers : {
                "Content-Type" : "application/json",
                "x-api-key"    : apiKey
            }
        };
    };

}
