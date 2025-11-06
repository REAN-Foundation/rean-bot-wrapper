// import Config from  ('../config/config')
import { Logger } from '../../common/logger.js';
import { ResponseHandler } from '../../utils/response.handler.js';
import { elasticsearchUserstat } from '../../services/statistics/user.stat.service.js';

const instance = new ResponseHandler(new Logger);
const esinstance = new elasticsearchUserstat();

export const getList = async (request, response) => {
    const result = await esinstance.getUserStat();
    const data = [{ value: result }];
    console.log(data);
    return instance.sendSuccessResponse(response, 200, 'list', data, true);
};
