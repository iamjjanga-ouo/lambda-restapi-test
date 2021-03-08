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