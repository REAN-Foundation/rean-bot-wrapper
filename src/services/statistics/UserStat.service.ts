// const elasticSearchUtility = require("../../utils/elasticsearch.Utility");
import { getAll, save } from '../../utils/elasticsearch.Utility';

export const createUserStat = async (req) => {

  req.created_at = new Date();
  const userStatModel = "test_chat_message";

  save(req, userStatModel)
  // .then(res_data => {
  //   console.log("created record")
  //   return true;
  // })
  // .catch(err => {
  //   console.log(err)
  //   return false;
  // });
  // baseManager.save(data, userStatModel, req)
  //   .then(res_data => {
  //     console.log("created record")
  //     return true;
  //   })
  //   .catch(err => {
  //     console.log(err)
  //     return false;
  //   });
}

export const getUserStat = async (req) => {

  const userStatModel = "user_stat";
  const res = await getAll(userStatModel);
  console.log("get", res)
  return res;
}
