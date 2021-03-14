const mysql = require('mysql');

// MYSQL 테이블에서 데이터를 5개 조회하는 예제
module.exports = {
  getCommentByDB: () => new Promise((resolve, reject) => {
    // Mysql
    const mysql_connection = mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWD,
      database: process.env.DB_NAME
    });

    mysql_connection.connect();
    mysql_connection.query('select * from users order by id limit 5', function(err, result, field) {
        if(result)
          resolve(result);
        
        if(err)
          console.log("db-error:",err);
    });
    mysql_connection.end();
  })
}