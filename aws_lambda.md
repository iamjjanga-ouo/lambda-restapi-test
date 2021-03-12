# Index
- [Index](#index)
- [Local 개발 환경 설정](#local-개발-환경-설정)
  - [Node.js 설치](#nodejs-설치)
  - [awscli 설치](#awscli-설치)
  - [aws IAM 인증 설정](#aws-iam-인증-설정)
  - [Serverless Framework 설치](#serverless-framework-설치)
  - [awslogs 설치](#awslogs-설치)
    - [설치](#설치)
    - [로그확인](#로그확인)
- [Hello lambda로 테스트](#hello-lambda로-테스트)
  - [serverless 프레임워크로 lambda 만들기](#serverless-프레임워크로-lambda-만들기)
    - [helloworld 프로젝트 생성](#helloworld-프로젝트-생성)
    - [handle.js](#handlejs)
    - [serverless.yml](#serverlessyml)
  - [로컬에서 코드 실행](#로컬에서-코드-실행)
  - [aws에 프로젝트 배포](#aws에-프로젝트-배포)
  - [lambda에 API Gateway 트리거 추가](#lambda에-api-gateway-트리거-추가)
  - [트리거를 추가를 serverless에서 설정](#트리거를-추가를-serverless에서-설정)
- [node package 설치](#node-package-설치)
  - [node 초기화](#node-초기화)
  - [package 설치](#package-설치)
  - [Local db 구성](#local-db-구성)
    - [docker-compose를 통해 redis, mariadb container 구성](#docker-compose를-통해-redis-mariadb-container-구성)
  - [redis, mysql, http 테스트 handler 구성](#redis-mysql-http-테스트-handler-구성)
  - [function 모듈화](#function-모듈화)
    - [redis_module.js](#redis_modulejs)
    - [db_module.js](#db_modulejs)
    - [http_module.js](#http_modulejs)
    - [handler.js](#handlerjs)
  - [여러개의 비동기 함수를 동시에 수행하도록 처리](#여러개의-비동기-함수를-동시에-수행하도록-처리)
    - [수정된 handler.js](#수정된-handlerjs)
- [Refs.](#refs)

# Local 개발 환경 설정
## Node.js 설치
작성일 기준 AWS Lambda 개발시 node.js 12.x를 권장. homebrew를 통해 설치하고 node path를 등록한 후 버전을 확인한다.
```shell
$ brew search node
$ brew install node@12
$ echo 'export PATH="/usr/local/opt/node@12/bin:$PATH"' >> ~/.zshrc # oh-my-zsh를 사용중
$ node -v
v12.14.1
```
또는 `nvm` 을 이용한다면 간단하게 해당 버전을 설치하고 이용할 수 있다.
```shell
$ nvm install 12
$ nvm use 12
# $ nvm ls # nvm으로 설치된 node 버전 확인
```

## awscli 설치
```shell
$ brew install awscli
$ aws --version
aws-cli/2.1.28 Python/3.9.2 Darwin/19.6.0 source/x86_64 prompt/off
```

## aws IAM 인증 설정
Local 개발 PC에서 aws의 리소스로 접근하기 위해서는 액세스 key를 발급받고 세팅해야한다. 발급 유저가 **AdministratorAccess** 권한이 부여되어 있으면 따로 권한 작업이 필요없으나, 권한 제한된 계정의 경우 추가적인 권한 부여가 필요하다.

- AWSLambdaFunllAccess : Lambda 함수 생성시 사용
- IAMFullAccess : 생성할 Lambda 함수의 IAM역할(role) 생성시 사용

유저에 권한 설정이 마무리 되면, 상단 메뉴 ID 클릭 -> AWS IAM 자격증명 -> 액세스 키 만들기로 새 액세스 키를 생성
![](https://i.imgur.com/qsOjiKV.png)
![](https://i.imgur.com/cVvuN4q.png)

```shell
$ aws configure
AWS Access Key ID [None]: <your-access-key>
AWS Secret Access Key [None]: <your-secret-key>
Default region name [ap-northeast-2]:
Default output format [None]: json
```

aws 프로필은 ~/.aws 하위에 생성됩니다.
```shell
$ ls ~/.aws
config    credentials
```

성공적으로 자격증명이 되었는지 확인을 위해(작성자는 AdministratorAccess입니다) 생성했던 ec2를 조화하겠습니다.
```shell
$ aws ec2 describe-instances # 서울리전에 있는 모든 ec2 instance의 자세한 정보가 json 타입으로 출력된다.
```

## Serverless Framework 설치
serverless는 lambda를 개발하고 aws로 배포까지 손쉽게할 수 있도록 도와주는 프레임워크입니다. [serverless-공식문서](https://www.serverless.com/framework/docs/)

```shell
# curl로 설치
$ curl -o- -L https://slss.io/install | bash
# npm으로 설치
$ npm i -g serverless
```

## awslogs 설치
Lambda 함수가 aws에 배포된 상태에서 실행 로그를 확인하려면 cloudwatch를 이용해야한다. 매번 웹 콘솔에서 열고 확인하는 것이 불편해서 `awslogs`를 이용해 터미널 환경에서 원격에서 실행되는 lambda의 실행로그를 확인할 수 있다.

### 설치
```shell
$ brew install python
$ sudo pip install awslogs
# 또는
$ pip3 install awslogs
```

### 로그확인
- `awslogs gst /aws/lambda/[loggin할 lambda함수명] -S -G -watch

```shell
$ awslogs get /aws/lambda/hello-lambda -S -G -watch
```

# Hello lambda로 테스트
aws console을 이용해서, serverless를 이용해서 둘다 생성이 가능하다. (aws console을 이용해서 Lambda를 만드는 것은 구글링으로 쉽게 찾을 수 있으니 패스)

## serverless 프레임워크로 lambda 만들기
- `serverless create` 명령으로 프로젝트 생성할 수 있으며, `--template` 옵션을 적용하면 해당 언어의 기본 코드를 갖춘 프로젝트로 생성할 수 있다.

```shell
$ serverless create --template aws-nodejs --path helloworld --name helloworld
# 또는 줄여서
$ sls create -t aws-nodejs -p helloworld -n helloworld
```

### helloworld 프로젝트 생성
```shell
$ sls create -t aws-nodejs -p helloworld -n helloworld
Serverless: Generating boilerplate...
Serverless: Generating boilerplate in "/Users/leesihyung/Workspace/serverless/helloworld"
 _______                             __
|   _   .-----.----.--.--.-----.----|  .-----.-----.-----.
|   |___|  -__|   _|  |  |  -__|   _|  |  -__|__ --|__ --|
|____   |_____|__|  \___/|_____|__| |__|_____|_____|_____|
|   |   |             The Serverless Application Framework
|       |                           serverless.com, v2.31.0
 -------'

Serverless: Successfully generated boilerplate for template: "aws-nodejs"
```

생성이 완료되면 다음과 같은 프로젝트 구조를 가진다.
```shell
$ tree -L 2 helloworld
helloworld
├── handler.js
└── serverless.yml
```

### handle.js
- `module.exports.hello = async event => {};` 내부에 자동으로 기본코드가 작성. 해당부분을 수정하여 로직을 구성하면된다.

```js
'use strict';

module.exports.hello = async (event) => {
  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        message: 'Go Serverless v1.0! Your function executed successfully!',
        input: event,
      },
      null,
      2
    ),
  };

  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  // return { message: 'Go Serverless v1.0! Your function executed successfully!', event };
};
```

### serverless.yml
자동 생성 내용중 주석을 제거하면 다음과 같다. function 이름은 기본으로 hello로 설정되므로 변경이 필요하다.  
필요하면 아래의 `functions`에서 hello를 다른이름으로 변경하고 handle.js에서 `module.exports.hello`의 hello를 다른이름으로 변경하면 된다.

```yaml
service: helloworld

frameworkVersion: '2'

provider:
  name: aws
  runtime: nodejs12.x
  lambdaHashingVersion: 20201221

functions:
  hello:
    handler: handler.hello
```

## 로컬에서 코드 실행
위의 코드를 로컬에서 테스트하기 위해서는 아래와 같은 명령어로 실행

- `serverless invoke [환경명] -f [function 명]`

```shell
$ sls invoke local -f hello
{
    "statusCode": 200,
    "body": "{\n  \"message\": \"Go Serverless v1.0! Your function executed successfully!\",\n  \"input\": \"\"\n}"
}
```

## aws에 프로젝트 배포
`serverless deploy` 명령으로 aws Lambda 서비스에 배포할 수 있다. `-stage`에는 배포할 환경, `-region`에는 배포할 리전을 지정한다. region의 경우 serverless.yml에 설정해주면 생략이 가능하다.

```shell
$ serverless deploy --stage test --region ap-northeast-2
```

다음과 같이 축약도 가능하다.
```shell
$ sls deploy -s test -r ap-northeast-2
Serverless: Packaging service...
Serverless: Excluding development dependencies...
Serverless: Creating Stack...
Serverless: Checking Stack create progress...
........
Serverless: Stack create finished...
Serverless: Uploading CloudFormation file to S3...
Serverless: Uploading artifacts...
Serverless: Uploading service helloworld.zip file to S3 (569 B)...
Serverless: Validating template...
Serverless: Updating Stack...
Serverless: Checking Stack update progress...
...............
Serverless: Stack update finished...
Service Information
service: helloworld
stage: test
region: ap-northeast-2
stack: helloworld-test
resources: 6
api keys:
  None
endpoints:
  None
functions:
  hello: helloworld-test-hello
layers:
  None
```

배포된 Lambda는 aws console에서 확인이 가능하다.
![](https://i.imgur.com/QAV8QSs.png)
![](https://i.imgur.com/I4JYeOy.png)
local에서 구성한 handle.js와 똑같은 소스 코드로 구성된다.
![](https://i.imgur.com/ZPae0KE.png)  

## lambda에 API Gateway 트리거 추가
trigger = '발동', lambda 함수 자체는 혼자서 실행될 수 없기 때문에 트리거가 필요하다. AWS API Gateway를 통해 웹 요청이 들어왔을때, lambda가 실행되도록 처리  
![](https://i.imgur.com/6i9Z1pC.png)  

생성된 default 스테이지에서 볼수 있는 URL + endpoint를 추가하여 insomnia에서 GET 테스트  
![](https://i.imgur.com/xAqOK9d.png)  

## 트리거를 추가를 serverless에서 설정
Gateway 트리거 추가는 serverless.yml에서도 설정을 추가해서 배포하면 추가적인 리소스생성이 가능하다. [serverless docs: AWS - events 참조](https://www.serverless.com/framework/docs/providers/aws/guide/events/)

기존의 serverless.yml의 `functions`부분을 다음과 같이 구성한다. hello/get의 path로 게이트웨이가 생성되고 GET요청이 가능하다.
```yml
functions:
  hello:
    handler: handler.hello
    events:
    - http:
        path: hello/get
        method: get
```

기존의 helloworld 프로젝트를 재배포한다. 재배포시 로그에 endpoints 내용이 남고, 해당 URL을 호출가능하다.
```shell
$ sls deploy -s test -r ap-northeast-2
Serverless: Packaging service...
Serverless: Excluding development dependencies...
Serverless: Uploading CloudFormation file to S3...
Serverless: Uploading artifacts...
Serverless: Uploading service helloworld.zip file to S3 (569 B)...
Serverless: Validating template...
Serverless: Updating Stack...
Serverless: Checking Stack update progress...
.......................
Serverless: Stack update finished...
Service Information
service: helloworld
stage: test
region: ap-northeast-2
stack: helloworld-test
resources: 12
api keys:
  None
endpoints:
  GET - https://s3tkqlsq2g.execute-api.ap-northeast-2.amazonaws.com/test/hello/get
functions:
  hello: helloworld-test-hello
layers:
  None
```

생성된 URL로 insomnia를 통해 GET 요청
![](https://i.imgur.com/qj8Knqd.png)

# node package 설치

## node 초기화

node 모듈을 설치하고 사용하려면 초기화가 필요하다. 프로젝터 디렉터리에서 `npm init` 명령을 실행.
```shell
$  npm init -y
Wrote to /Users/leesihyung/Workspace/serverless/helloworld/package.json:

{
  "name": "helloworld",
  "version": "1.0.0",
  "description": "",
  "main": "handler.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": [],
  "author": "",
  "license": "ISC"
}
```

명령 수행 후 프로젝터 디렉터리 하위에 pacakge관련 파일이 생성된다.
```
helloworld
├── handler.js
├── package.json
└── serverless.yml
```

## package 설치
사용하고자하는 모듈은 `npm install` 명령으로 설치가 가능. 테스트는 redis, mysql, http 관련 모듈로 진행 (!!! helloworld 디렉터리 하위에서 진행한다.)
```shell
$ npm i redis
$ npm i mysql
$ npm i http
```

## Local db 구성
redis와 mysql은 로컬 docker container환경에서 테스트를 진행한다. `docker-compose`를 통해 각각의 container를 생성한다.  

### docker-compose를 통해 redis, mariadb container 구성
db_instances.yml
```yaml
version: '3.7'
services:
    redis:
      # redis stanalone
      image: redis:6.0.5
      command: redis-server --port 6379 --appendonly yes
      container_name: redis6379
      hostname: redis6379
      labels:
        - "name=redis"
        - "mode=standalone"
      ports:
        - 6379:6379
      volumes:
        - ./db_data/redis/data:/data

    # mariadb stanalone
    mariadb:
      image: mariadb:10.2.10
      container_name: maria3306
      hostname: maria3306
      restart: always
      labels:
        - "name=mariadb"
        - "mode=standalone"
      environment:
        - MYSQL_ROOT_PASSWORD=mypassword
      ports:
        - 3306:3306
      volumes:
        - ./db_data/mariadb/data:/var/lib/mysql
```
- `ports` : 호스트OS에 포트매핑을 통해 호스트의 localhost로 접근이 가능하다.
- `volumes` : container가 예기치 못한 상황으로 중단되거나 종료되더라도 db 데이터 백업을 하는 Volume을 연결해둔다. (여기서는 container 생성시마다 테스트 데이터의 백업용으로 사용하였다.)

다음 명령어로 container를 시작한다. (위치는 db_instance.yml이 위치한 디렉터리에서 실행한다.)
```shell
$ docker-compose -f ./docker_code/db_instances.yml up -d
```

정상적으로 올라왔는지 확인
```shell
$ docker ps
CONTAINER ID   IMAGE             COMMAND                  CREATED          STATUS          PORTS                    NAMES
a106377ad963   redis:6.0.5       "docker-entrypoint.s…"   13 minutes ago   Up 13 minutes   0.0.0.0:6379->6379/tcp   redis6379
b6b13f9c6ac1   mariadb:10.2.10   "docker-entrypoint.s…"   13 minutes ago   Up 13 minutes   0.0.0.0:3306->3306/tcp   maria3306
```

## redis, mysql, http 테스트 handler 구성
redis, mysql, http function을 하나씩 생성하고 동작을 확인하는 간단한 프로그램입니다. node.js는 이벤트 기반, Non-blocking I/O 모델이므로 예제에는 `promise`와 `await`를 사용하여 비동기 방식으로 로직을 처리하도록 하였습니다.

```js
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
```

local에서 handler를 실행하면 아래와 같은 데이터가 출력됩니다. http의 API test data는 fake API인 [jsonplace](http://jsonplaceholder.typicode.com/)를 가져오는 방식입니다. jsonplace에 /users endpoint를 조회하면 10명의 user정보에 대해 확인할 수 있습니다.  
```shell
$  sls invoke local -f hello
redis-set-result: OK
1. REDIS RESULT
Hello Lambda
2. DB RESULT
id = 1, firstname = Fred, lastname = Smith, email = fred@gmail.com
id = 2, firstname = Sara, lastname = Watson, email = sara@gmail.com
id = 3, firstname = Will, lastname = Jackson, email = will@yahoo.com
id = 4, firstname = Paula, lastname = Johnson, email = paula@yahoo.com
id = 5, firstname = Tom, lastname = Spears, email = tom@yahoo.com
3. HTTP RESULT
id = 1, name = Leanne Graham, email = Sincere@april.biz
id = 2, name = Ervin Howell, email = Shanna@melissa.tv
id = 3, name = Clementine Bauch, email = Nathan@yesenia.net
id = 4, name = Patricia Lebsack, email = Julianne.OConner@kory.org
id = 5, name = Chelsey Dietrich, email = Lucio_Hettinger@annie.ca
id = 6, name = Mrs. Dennis Schulist, email = Karley_Dach@jasper.info
id = 7, name = Kurtis Weissnat, email = Telly.Hoeger@billy.biz
id = 8, name = Nicholas Runolfsdottir V, email = Sherwood@rosamond.me
id = 9, name = Glenna Reichert, email = Chaim_McDermott@dana.io
id = 10, name = Clementina DuBuque, email = Rey.Padberg@karina.biz
```

## function 모듈화
handler.js가 너무 비대해지는 문제점이 있어, 따로 function은 모듈로 빼서 export하고 handler에서 호출하는 형태로 수정. project의 root 디렉터리에 module 디렉터리 생성.

```shell
$ mkdir module && cd module
$ touch db_module.js redis_module.js http_module.js
```

각 module로 분리합니다. `module.exports = {}` 내부에 function을 담는 코드로의 변화가 필요합니다.

### redis_module.js
```js
const redis = require('redis');

// REDIS에 데이터를 set한 후 get하는 예제
module.exports = {
  setGetByRedis: () => new Promise((resolve, reject) => {
    // Redis
    const redis_client = redis.createClient({
      host: "localhost",
      port: 6379
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
```

### db_module.js
```js
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
```

### http_module.js
```js
const http = require('http');

// REST API를 호출하고 결과 JSON을 읽어서 화면에 출력하는 예제
module.exports = {
  getUsersByHttp: () => new Promise((resolve, reject) => {
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
  })
}
```

모듈화한 후 handler.js에서 각 모듈을 호출하는 code를 추가하고, 각 function에 대해서도 호출하는 `변수명.함수이름`의 형식으로 code를 수정해줍니다.

### handler.js
```js
'use strict';

// 사용할 모듈 선언
const dbModule = require('./module/db_module');
const redisModule = require('./module/redis_module');
const httpModule = require('./module/http_module');

module.exports.hello = async event => {
  const redisResult = await redisModule.setGetByRedis();
  console.log("1. REDIS RESULT");
  console.log(redisResult);

  const dbResult = await dbModule.getCommentByDB();
  console.log("2. DB RESULT");
  if(dbResult) {
    dbResult.forEach(user => {
      console.log("id = %d, firstname = %s, lastname = %s, email = %s", user.id, user.first_name, user.last_name, user.email);
    });
  }
  
  const httpResult = await httpModule.getUsersByHttp();
  console.log("3. HTTP RESULT");
  if(httpResult) {
    httpResult.forEach(user => {
      console.log("id = %d, name = %s, email = %s", user.id, user.name, user.email);
    });
  }
};
```

다시 local에서 lambda함수를 실행하는 명령어로 정상동작 테스트를합니다.
```shell
$ sls invoke local -f hello
redis-set-result: OK
1. REDIS RESULT
Hello Lambda
2. DB RESULT
id = 1, firstname = Fred, lastname = Smith, email = fred@gmail.com
id = 2, firstname = Sara, lastname = Watson, email = sara@gmail.com
id = 3, firstname = Will, lastname = Jackson, email = will@yahoo.com
id = 4, firstname = Paula, lastname = Johnson, email = paula@yahoo.com
id = 5, firstname = Tom, lastname = Spears, email = tom@yahoo.com
3. HTTP RESULT
id = 1, name = Leanne Graham, email = Sincere@april.biz
id = 2, name = Ervin Howell, email = Shanna@melissa.tv
id = 3, name = Clementine Bauch, email = Nathan@yesenia.net
id = 4, name = Patricia Lebsack, email = Julianne.OConner@kory.org
id = 5, name = Chelsey Dietrich, email = Lucio_Hettinger@annie.ca
id = 6, name = Mrs. Dennis Schulist, email = Karley_Dach@jasper.info
id = 7, name = Kurtis Weissnat, email = Telly.Hoeger@billy.biz
id = 8, name = Nicholas Runolfsdottir V, email = Sherwood@rosamond.me
id = 9, name = Glenna Reichert, email = Chaim_McDermott@dana.io
id = 10, name = Clementina DuBuque, email = Rey.Padberg@karina.biz
```

## 여러개의 비동기 함수를 동시에 수행하도록 처리
기존의 각 모듈은 비동기로 작성되어있고, handler.js에서 호출해서 사용하고 있다. 그런데 호출시 `await`를 사용하면 해당 부분이 처리될때까지 blockin되므로 비효율적이다. 3개의 요청을 한번에 수행하고 결과를 처리할 수 있도록 `Promise.all`을 사용하여 handler.js를 수정.

### 수정된 handler.js
```js
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
```
동시처리를 하면 이전보다 응답속도를 개선가능하다.

# Refs.
- [redis container 관련](https://gblee1987.tistory.com/158)
- [mysql test data & cheat sheet](https://gist.github.com/bradtraversy/c831baaad44343cc945e76c2e30927b3)