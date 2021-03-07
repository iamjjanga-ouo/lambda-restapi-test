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