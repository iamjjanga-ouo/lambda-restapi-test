const redis = require('redis');

// REDIS에 데이터를 set한 후 get하는 예제
module.exports = {
  setGetByRedis: () => new Promise((resolve, reject) => {
    // Redis
    const redis_client = redis.createClient({
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT
    });
    redis_client.set('lambda', 'Hello Lambda', (err, result) => {
      if (result)
        console.log("redis-set-result:", result);

      if (err)
        console.log("redis-set-error:", err);
    });
    redis_client.get('lambda', (err, result) => {
      if (result)
        resolve(result);

      if (err)
        console.log("redis-get-error:", err);
    });
    redis_client.quit();
  })
}
