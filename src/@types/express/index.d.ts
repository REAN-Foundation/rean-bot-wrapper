// import { CurrentUser } from "../../domain.types/miscellaneous/current.user";
// import { CurrentClient } from "../../domain.types/miscellaneous/current.client";
export {};

declare global{
    namespace Express {
        interface Request {
            context: string,
            resourceOwnerUserId: string
        }
    }
}
