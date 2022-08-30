/* eslint-disable init-declarations */
import { autoInjectable } from 'tsyringe';
import util from 'util';

@autoInjectable()
export class AnemiaModel{

    async getAnemiaImagePath(req){
        return new Promise(async(resolve, reject)=> {
            try {
                console.log("Start anemia service-------");
                const params = req.body.queryResult.parameters ? req.body.queryResult.parameters : '';
                if (params) {
                    const imagePath = params.url;
                    console.log("if params condition");
                    const data = {
                        "fulfillmentMessages" : [
                            {
                                "text" : {
                                    "text" : [
                                        imagePath
                                    ]
                                }
                            }
                        ]
                    };
                    console.log("sending image url", util.inspect(data, {showHidden: false, depth: null, colors: true}));
                    resolve(data);
                }
            }
            catch (error) {
                console.log(error, 500, "Anemia Service Error!");
                reject(error.message);
            }
        });
    }

}
