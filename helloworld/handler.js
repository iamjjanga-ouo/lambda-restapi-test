'use strict';

// 사용할 모듈 선언
const redis = require('redis');
const mysql = require('mysql');
const http = require('http');

// REDIS에 데이터를 set한 후 get하는 예제
function setGetByRedis() {
  return new Promise((resolve, reject) => {
    // Redis
    const redis_client = redis.createClient({
      host: "localhost", 
      port: 6379
    });
    redis_client.set('lambda','Hello Lambda', (err, result) => {
      if(result)
        console.log("redis-set-result:",result);
        
      if(err)
        console.log("redis-set-error:",err);
    });
    redis_client.get('lambda', (err, result) => { 
      if(result)
        resolve(result);
      
      if(err)
        console.log("redis-get-error:",err);
    });
    redis_client.quit();
  });
}

// MYSQL 테이블에서 데이터를 5개 조회하는 예제
function getCommentByDB() {
  return new Promise((resolve, reject) => {
    // Mysql
    const mysql_connection = mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: 'mypassword',
      database: 'test_db'
    });

    mysql_connection.connect();
    mysql_connection.query('select * from users order by id limit 5', function(err, result, field) {
        if(result)
          resolve(result);
        
        if(err)
          console.log("db-error:",err);
    });
    mysql_connection.end();
  });
}

// REST API를 호출하고 결과 JSON을 읽어서 화면에 출력하는 예제
function getUsersByHttp() {
  return new Promise((resolve, reject) => {
    const options = {
      host: 'jsonplaceholder.typicode.com',
      port: 80,
      path: '/users',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    }
    const request = http.request(options, function(response) {
      let body = '';
      response.on('data', function(data) {
        body += data;
      })
      response.on('end', function() {
        resolve(JSON.parse(body));
      });
      response.on('error', function(err) {
        console.log("http-error:",err);
      }); 
    });
    request.end();
  });
}

module.exports.hello = async event => {
  const redisResult = await setGetByRedis();
  console.log("1. REDIS RESULT");
  console.log(redisResult);

  const dbResult = await getCommentByDB();
  console.log("2. DB RESULT");
  if(dbResult) {
    dbResult.forEach(user => {
      console.log("id = %d, firstname = %s, lastname = %s, email = %s", user.id, user.first_name, user.last_name, user.email);
    });
  }
  
  const httpResult = await getUsersByHttp();
  console.log("3. HTTP RESULT");
  if(httpResult) {
    httpResult.forEach(user => {
      console.log("id = %d, name = %s, email = %s", user.id, user.name, user.email);
    });
  }
};