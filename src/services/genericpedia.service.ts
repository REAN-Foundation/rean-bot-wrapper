import dfff from '../libs/dialogflow-fulfillment';
import axios from 'axios';
const genericPediaUrl = 'https://genericpedia.lamne.com/api/brands?page=1&perPage=10&agg%5B%5D=prepType&query=';
const genericPediaChemistUrl = 'https://genericpedia.lamne.com/api/pharmacies?perPage=10&';

export const getGenericpediaservice = async (req, res) => {
    async function getGenericMedicinByName(medicine) {         //function to get vaccines based on their pin code
        try {
            const url = `${genericPediaUrl}${medicine}`;
            const response = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.76 Safari/537.36' } });
            let resonse_message = "";
            if (response.data && response.data['hydra:member'] && response.data['hydra:member'].length > 0) {
                for (let i = 0; i < response.data['hydra:member'].length; i++) {
                    const memberObj = response.data['hydra:member'][i];
                    resonse_message = resonse_message + " \n\n <b>" + memberObj.name + "</b> " + memberObj.packageSize + " for ₹" + memberObj.packagePrice + " manufactured by " + memberObj.manufacturer.name + " \n Contains ";
                    for (let j = 0; j < memberObj.genericdoses.length; j++) {
                        resonse_message = j === memberObj.genericdoses.length - 1 ? resonse_message + memberObj.genericdoses[j].name : resonse_message + memberObj.genericdoses[j].name + ", ";
                    }
                }
            }
            resonse_message = resonse_message === "" ? "No result found" : resonse_message;
            return resonse_message;
        } catch (error) {
            console.log('Genericpedia error: ', error);
            return -1;
        }
    }
    const agent = new dfff.WebhookClient({
        request  : req,
        response : res
    });
    async function getGenericpediaList(agent) {                //function called by DialogFlow; requires agent to be passed
        /*Extracting parameters from Dialogflow*/
        console.log('START--------');
        const params = req.body.queryResult.outputContexts[0].parameters;
        const medicines = await getGenericMedicinByName(params.medicine);
        agent.add(medicines);

    }
    const intentMap = new Map();
    intentMap.set('genericpedia', getGenericpediaList);
    return await agent.handleRequest(intentMap);
};

export const getGenericpediaChemistservice = async (req, res) => {
    async function getGenericChemistByLocation(location) {         //function to get vaccines based on their pin code
        try {

            const latLong = location.slice(8);
            const index = latLong.indexOf('-');
            const lat = latLong.slice(0, index);
            const long = latLong.slice(index + 1);
            const latLongLocation = "order%5Blocation%5D=" + lat + "," + long + ",asc";
            const url = `${genericPediaChemistUrl}${latLongLocation}`;
            const response = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.76 Safari/537.36' } });
            let resonse_message = "";
            if (response.data && response.data['hydra:member'] && response.data['hydra:member'].length > 0) {
                for (let i = 0; i < response.data['hydra:member'].length; i++) {
                    const memberObj = response.data['hydra:member'][i];
                    resonse_message = resonse_message + " \n\n" + "<b> " + memberObj.name + "</b> : " + memberObj.address;
                }
            }
            resonse_message = resonse_message === "" ? "No result found" : resonse_message;
            return resonse_message;
        } catch (error) {
            console.log('Genericpedia error: ', error);
            return -1;
        }
    }
    const agent = new dfff.WebhookClient({
        request  : req,
        response : res
    });
    async function getGenericpediaChemistList(agent) {                //function called by DialogFlow; requires agent to be passed
        /*Extracting parameters from Dialogflow*/
        console.log('START--------');
        const params = req.body.queryResult.outputContexts[0].parameters;
        const chemistList = await getGenericChemistByLocation(params.location);
        agent.add(chemistList);

    }
    const intentMap = new Map();
    intentMap.set('genericpedia location', getGenericpediaChemistList);
    return await agent.handleRequest(intentMap);
};
