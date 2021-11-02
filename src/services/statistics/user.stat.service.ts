import { elasticsearchUtilities } from '../../utils/elasticsearch.utility';
import { autoInjectable } from 'tsyringe';

@autoInjectable()
export class elasticsearchUserstat{

    constructor(private _elasticsearchUtilities?: elasticsearchUtilities){}

  createUserStat = async (req) => {
      req.created_at = new Date();
      const userStatModel = "test_chat_message";
      this._elasticsearchUtilities.save(req, userStatModel);
  }

  getUserStat = async () => {
      console.log("wnter ES service 'getUserStat'");

      const userStatModel = "user_stat";
      const res = await this._elasticsearchUtilities.getAll(userStatModel);
      console.log("get", res);
      return res;
  }

}
