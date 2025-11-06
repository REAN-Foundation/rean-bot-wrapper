import { CurrentClient } from "./current.client.js";
import { CurrentUser } from "./current.user.js";
import { RequestDto } from "./request.dto.js";

export interface ResponseDto {
    Status: string;
    Message: string;
    HttpCode: number;
    Data?: any;
    Trace?: string[];
    Client: CurrentClient;
    User: CurrentUser;
    Context: string;
    Request?: RequestDto;
    ClientIps: string[];
    APIVersion: string;
    ServiceVersion: string;
}
