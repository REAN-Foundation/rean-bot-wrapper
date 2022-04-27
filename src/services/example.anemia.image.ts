
export class ExampleAnemiaImage {

    async greetings() {
        return new Promise(async(resolve, reject) =>{
            try {
                const imagePath = "https://t4.ftcdn.net/jpg/02/52/68/73/240_F_252687355_x6qCu70kdEjb1RRygVreCZXslqq7EDi1.jpg";
                const reply = "Hey, I'm  REAN Anemia Detection Bot. \nPlease share an image of your eye conjunctiva similar to the one shown above \n \nInstructions: \n   1. Gently pull your lower eyelid  with your index finger. \n   2. Try focusing the camera on the conjunctiva region and take a picture under good lighting. ";
                const data = {
                    "fulfillmentMessages" : [
                        {
                            "text" : {
                                "text" : [
                                    reply
                                ]
                            }
                        },
                        {
                            "image" : {
                                "imageUri"          : imagePath,
                                "accessibilityText" : reply
                            },
                        },
                    ],
                };
                resolve(data);
            }
            catch (error) {
                console.log(error, 500, "Example Anemia Image Service Error!");
                reject(error.message);
            }
        });
    }

}
