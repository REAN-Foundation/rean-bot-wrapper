export class RHGAppRequestBody {

    constructor(reqBody){ this.reqBody = reqBody; }

    private reqBody

    getPhoneNumber() {
        const phoneNumber:string = (this.reqBody.phoneNumber).toString();
        return phoneNumber;
    }

    isText() {
        if (this.getType() === "text"){
            return true;
        }
        else {
            return false;
        }
    }

    getType() {
        return this.reqBody.type;
    }

    getMessage() {
        return this.reqBody.message;
    }
}