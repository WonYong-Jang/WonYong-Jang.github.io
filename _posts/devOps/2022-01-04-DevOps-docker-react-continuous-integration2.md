---
layout: post
title: "[Docker] 도커를 이용한 리액트 앱 CI환경에 배포하기 2"
subtitle: "Travis CI, AWS를 이용한 자동 빌드, 테스트 및 배포 / Elastic BeanStalk / IAM"    
comments: true
categories : DevOps
date: 2022-01-04
background: '/img/posts/mac.png'
---

[이전글](https://wonyong-jang.github.io/devops/2022/01/03/DevOps-docker-react-continuous-integration.html)에서 
도커로 생성한 리액트 앱을 Github에 push하는 것까지 진행했다.   
이제 Travis CI를 이용하여 타겟 브랜치에 소스가 변경되면 
자동으로 소스를 가져가도록 연동해보자.   

> Travis CI란 Github에서 진행되는 오픈소스 프로젝트를 위한 지속적인 통합(Continuous Integration) 서비스이다.   
> Travis CI를 이용하면 Github repository에 있는 프로젝트를 특정 이벤트에 따라 자동으로 테스트, 빌드하거나 배포할 수 있다.   

- - - 

## 1. Travis CI를 사용하여 테스트하기    

[travis-ci.com](https://travis-ci.com/)에 접속하여 Github id로 회원 가입을 
진행하고, 연동할 repository를 추가한다.   

이제부터는 Github에서 Travis CI로 소스를 어떻게 전달 시킬거며 전달 받은 것을 
어떻게 Test하며 그 테스트가 성공했을 때 어떻게 AWS에 전달해서 배포를 
할 것인지를 설정해주어야 한다.   

`이러한 설정을 위해서 Docker에서는 docker-compose.yml에 무엇을 할지를 
작성해줬다면 Travis CI에서는 .travis.yml 파일에서 해준다.`         

`이제까지 도커환경에서 리액트앱을 실행했기 때문에 Travis CI에서도 
도커 환경으로 구성해야 한다.`         

##### .travis.yml

<img width="1068" alt="스크린샷 2022-01-12 오후 9 52 19" src="https://user-images.githubusercontent.com/26623547/149143881-9cc1afe6-2196-4dcf-a1a0-04bbbff3ebe0.png">    

`위의 그림에서 before_install은 스크립트를 실행할 수 있는 환경을 구성한다.`   
`즉, script 부분에서 테스트를 진행하는데, 그전에 도커 파일을 이용해서 
이미지를 만들어놔야한다. 그래야 이미지를 가지고 컨테이너를 실행 후 테스트를 
실행할 수 있다.`     

script 부분에서는 -e CI=true는 Travis CI에서 사용하기 위해 추가해야 하는 옵션이다.   

스크립트 소스는 아래와 같다.    

```
sudo: required 

language: generic  

services: 
  - docker 

before_install:
  - echo "start creating an image with dockerfile"
  - docker build -t kaven/docker-react-app -f Dockerfile.dev .

script: 
  - docker run -e CI=true kaven/docker-react-app npm run test -- --coverage

after_success:
  - echo "Test success"
```

위 스크립트를 작성하고 git push를 하게 되면 자동으로 Travis CI에서 
코드를 가져와서 빌드 및 테스트를 하는 것을 확인할 수 있다.    

<img width="1000" alt="스크린샷 2022-01-12 오후 10 06 14" src="https://user-images.githubusercontent.com/26623547/149145905-2ef545a5-52bf-4f6b-832b-e20703b89292.png">    

- - - 

## 2. AWS Elastic Beanstalk 환경 구성하기   

`AWS Elastic Beanstalk은 AWS에 어플리케이션을 배포하는 가장 빠르면서 
간편한 방법이며 AWS 상에 코드를 업로드하기만 하면 
용량 프로비저닝, 로드밸런싱, Auto Scaling, 어플리케이션 상태 모니터링에 
대한 정보를 자동으로 처리해 주는 서비스이다.`     

<img width="649" alt="스크린샷 2022-01-13 오후 8 02 34" src="https://user-images.githubusercontent.com/26623547/149318521-b217fc7f-cc89-4662-b7a7-b2b2917a234d.png">   

`아래 그림과 같이 Elastic Beanstalk은 EC2 인스턴스나 데이터베이스 같이 
많은 것들을 포함한 환경을 구성하며 만들고 있는 소프트웨어를 
업데이트 할때마다 자동으로 이 환경을 관리해준다`    

<img width="632" alt="스크린샷 2022-01-13 오후 7 41 22" src="https://user-images.githubusercontent.com/26623547/149317320-d8d83476-e562-4ff4-8ad9-a4bb0ac6bf8b.png">      

AWS 접속 후 새 환경 생성 - 웹 서버 환경 - 어플리케이션 이름을 
작성 및 플랫폼을 선택(Docker)하여 EB를 생성한다.     

<img width="1000" alt="스크린샷 2022-01-13 오후 8 18 21" src="https://user-images.githubusercontent.com/26623547/149320857-d06e72c4-d132-49e8-a97f-01da937b97ce.png">   

현재까지 도커 이미지를 생성 후 어플리케이션을 실행하여 테스트 
하는 부분까지 travis 설정을 했다.   
이제는 테스트에 성공한 소스를 AWS Elastic Beanstalk에 자동으로 
배포하는 부분을 travis 파일에 넣어줄 차례이다.   

##### .travis.yml

```
//...

deploy:
  provider: elasticbeanstalk
  region: "ap-northeast-2"
  app: "docker-react-app"
  evn: "Dockerreactapp-env"
  bucket_name: "elasticbeanstalk-ap-northeast-2-168997139982"
  bucket_path: "docker-react-app"
  on:
    branch: master
```

위에서 새롭게 추가된 부분만 설명해보면 아래와 같다.   

- provider: 외부 서비스 표시(s3, EB 등등), traivs ci에서 어떤 곳으로 제공을 할 것인지 작성   

- region: 현재 사용하고 있는 AWS의 서비스가 위치하고 있는 물리적 장소   

- app: 생성된 어플리케이션 이름   

- env: 위 그림에서 생성된 env 이름, 생성시 직접 작성도 가능하다.   

- bucket_name: 해당 elastic beanstalk을 위한 s3 버킷 이름, travis에서 가지고 있는 파일을 압축해서 S3에 보낸다.   

> Elastic Beanstalk을 생성할 때 s3 버킷도 자동 생성된다.   
> S3로 가서 생성된 버킷을 확인한다.   

- bucket_path: 어플리케이션 이름과 동일   

- on branch: 어떤 브랜치에 Push할때 AWS에 배포할 것인지 지정한다.   

- - - 

## 3. Travis CI의 AWS 접근을 위한 API 생성   

현재까지 Travis CI에서 AWS에 어떤 파일을 전해줄거며, AWS에서 어떤 
서비스를 이용할건지에 대한 부수적인 설정들을 적어주었다.   
하지만 Travis CI와 AWS가 실질적으로 소통을 할수 있게 인증하는 부분을 
설정해주진 않았다.   
그래서 그 인증 하는 부분을 살펴보자.   

<img width="586" alt="스크린샷 2022-01-13 오후 8 34 53" src="https://user-images.githubusercontent.com/26623547/149323206-743c5e51-8090-4f34-9fea-54faec3bbf28.png">    

`인증을 위해서는 API Key가 필요하다.`  
그래서 API key를 어떻게 받는지 살펴보자.   

Secret, Access API Key 받는 순서는 아래와 같다.   

<img width="746" alt="스크린샷 2022-01-13 오후 8 36 40" src="https://user-images.githubusercontent.com/26623547/149323390-3743f38b-a917-4b67-84f3-44913b4096f6.png">    

`즉 우리는 Elastic Beanstalk을 사용할수 있는 권한을 가진 IAM 사용자를 
생성하면된다.`      

IAM - 사용자 이름을 입력 - 엑세스 유형은 프로그래밍 방식 엑세스 선택 - 기존 정책 직접 연결 - 
AdministratorAccess-AWSElasticBeanstalk 권한 선택 후 생성하면 된다.    

이렇게 얻은 access, scret key를 .travis.yml에 넣어주면 된다.   
하지만, 직접 API키를 Travis yml 파일에 적어주면 노출이 되기 때문에 
다른곳에 적고 그것을 가져와줘야 한다.   

아래 그림과 같이 travis settings의 Environment Variables를 이용해서 
key를 작성해놓고 yml파일에서 이를 읽어서 가져오는 방식을 이용한다.   

<img width="1095" alt="스크린샷 2022-01-13 오후 8 55 28" src="https://user-images.githubusercontent.com/26623547/149325880-2466f317-d18f-4468-83d2-50912fe86a12.png">    

이후 최종적으로 .travis.yml 파일을 추가해보자.   

##### .travis.yml   

```
sudo: required

language: generic

services:
  - docker

before_install:
  - echo "start creating an image with dockerfile"
  - docker build -t kaven/docker-react-app -f Dockerfile.dev .

script:
  - docker run -e CI=true kaven/docker-react-app npm run test -- --coverage

deploy:
  provider: elasticbeanstalk
  region: "ap-northeast-2"
  app: "docker-react-app"
  evn: "Dockerreactapp-env"
  bucket_name: "elasticbeanstalk-ap-northeast-2-168997139982"
  bucket_path: "docker-react-app"
  on:
    branch: master

  access_key_id: $AWS_ACCESS_KEY
  secret_access_key: $AWS_SECRET_ACCESS_KEY
```


이후 git push 를 하게 되면 자동으로 travis ci에서 빌드 및 테스트를 진행하고, 
    Elastic Beanstalk으로 전달하여 AWS에 호스팅하게 된다.   

- - - 

**Reference**    

<https://www.inflearn.com/course/%EB%94%B0%EB%9D%BC%ED%95%98%EB%A9%B0-%EB%B0%B0%EC%9A%B0%EB%8A%94-%EB%8F%84%EC%BB%A4-ci/lecture/52082?tab=curriculum&volume=1.00>    

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

