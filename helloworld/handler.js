'use strict';

// 사용할 모듈 선언
const dbModule = require('./module/db_module');
const redisModule = require('./module/redis_module');
const httpModule = require('./module/http_module');

module.exports.hello = async event => {

  const [redisResult, dbResult, httpResult] = await Promise.all([redisModule.setGetByRedis(), dbModule.getCommentByDB(), httpModule.getUsersByHttp()]);
  
  console.log("1. REDIS RESULT");
  console.log(redisResult);

  console.log("2. DB RESULT");
  if(dbResult) {
    dbResult.forEach(user => {
      console.log("id = %d, firstname = %s, lastname = %s, email = %s", user.id, user.first_name, user.last_name, user.email);
    });
  }
  
  console.log("3. HTTP RESULT");
  if(httpResult) {
    httpResult.forEach(user => {
      console.log("id = %d, name = %s, email = %s", user.id, user.name, user.email);
    });
  }
};