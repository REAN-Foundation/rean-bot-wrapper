
export class HandleMessagetypePayload{

    getPayloadContent(payload) {
        const payloadInternal = payload.fields.payload.listValue.values;
        const payloadContentInOrder = [];
        for (let i = 0; i < payloadInternal.length; i++){
            console.log("enter for asfgsfgSHFfdh");
            const messageTypeInternal = payloadInternal[i].structValue.fields.messagetype.stringValue;
            let messageContent:any;
            // const messageList = [];
            console.log("messageTypeInternal",messageTypeInternal);
            if (messageTypeInternal === "interactive-list" || messageTypeInternal === "interactive-buttons"){
                // messageContent = payloadInternal[i].structValue.fields.buttons.listValue.values;
                messageContent = payloadInternal[i].structValue;
                // console.log("messageContent1",messageContent);
                payloadContentInOrder.push(messageContent);
            }
            else if (messageTypeInternal === "image") {

                //handling messageType text
                messageContent = payloadInternal[i].structValue;
                console.log("messageContent",messageContent);
                // console.log("messageList",messageList);
                payloadContentInOrder.push(messageContent);
            }
            else {

                //handling messageType text
                messageContent = payloadInternal[i].structValue.fields.text.stringValue;
                console.log("messageContent",messageContent);
                // console.log("messageList",messageList);
                payloadContentInOrder.push({ fields: { content: messageContent,messagetype: { stringValue: 'text', kind: 'stringValue' } } });
            }
        } 
        // console.log("payloadContentInOrder",payloadContentInOrder);
        return payloadContentInOrder;
    }
    // getPayloadContent(payload) {
    //     const payloadInternal = payload.fields.payload.listValue.values;
    //     const payloadContentInOrder = [];
    //     for (let i = 0; i < payloadInternal.length; i++){
    //         console.log("enter for asfgsfgSHFfdh");
    //         const messageTypeInternal = payloadInternal[i].structValue.fields.messagetype.stringValue;
    //         let messageContent:any;
    //         const messageList = [];
    //         console.log("messageTypeInternal",messageTypeInternal);
    //         if (messageTypeInternal === "interactive-list"){
    //             // messageContent = payloadInternal[i].structValue.fields.buttons.listValue.values;
    //             messageContent = payloadInternal[i].structValue;
    //             // console.log("messageContent1",messageContent);
    //             payloadContentInOrder.push(messageContent);
    //         }
    //         else {
    //             messageContent = payloadInternal[i].structValue.fields.content.listValue.values;
    //             console.log("messageContent",messageContent);
    //             for (let i = 0; i < messageContent.length; i++){
    //                 messageList.push(messageContent[i].stringValue);
    //             }
    //             // console.log("messageList",messageList);
    //             payloadContentInOrder.push({ fields: { content: messageList,messagetype: { stringValue: 'text', kind: 'stringValue' } } });
    //         }
    //     } 
    //     // console.log("payloadContentInOrder",payloadContentInOrder);
    //     return payloadContentInOrder;
    // }
