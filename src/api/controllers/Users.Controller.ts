// import Config from  ('../config/config')
import { Logger } from '../../common/logger';
import { ResponseHandler } from '../../utils/response.handler';
import { getUserStat } from '../../services/statistics/UserStat.service';

let instance = new ResponseHandler(new Logger)

export const getList = async (request, response) => {
    let req;
    const result = await getUserStat(req);
    const data = [{ value: result }];
    console.log(data)
    return instance.sendSuccessResponse(response, 200, 'list', data, true)
}