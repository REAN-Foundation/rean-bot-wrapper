// import Config from  ('../config/config')
import { Logger } from '../../common/logger';
import { ResponseHandler } from '../../utils/response.handler';
import { elasticsearchUserstat } from '../../services/statistics/user.stat.service';

const instance = new ResponseHandler(new Logger);
const esinstance = new elasticsearchUserstat();

export const getList = async (request, response) => {
    const result = await esinstance.getUserStat();
    const data = [{ value: result }];
    console.log(data);
    return instance.sendSuccessResponse(response, 200, 'list', data, true);
};
