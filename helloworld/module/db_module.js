const mysql = require('mysql');

// MYSQL 테이블에서 데이터를 5개 조회하는 예제
module.exports = {
  getCommentByDB: () => new Promise((resolve, reject) => {
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
  })
}