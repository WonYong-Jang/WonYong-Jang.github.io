---
layout: post
title: "[Docker] 도커를 이용한 리액트 앱 CI환경에 배포하기 1"
subtitle: "도커를 이용한 리액트 앱 / 운영서버를 위한 Nginx / 개발서버 운영서버 구분하기"    
comments: true
categories : DevOps
date: 2022-01-03
background: '/img/posts/mac.png'
---

[지난글](https://wonyong-jang.github.io/devops/2022/01/02/DevOps-docker-node.html)에서 
도커를 이용하여 Node.js 어플을 만들어 봤다.   
이번글에서는 react 앱을 도커로 올려서 실무와 비슷하게 개발환경과 운영 환경을 
구성해보고 보려고 한다.   
아래 그림과 같이 git을 이용하여 소스를 올리고, Travis CI를 이용하여 
푸쉬된 코드를 테스트 성공여부를 확인하고 그 이후 AWS에 호스팅 하는 것을 목표로 한다.        

<img width="850" alt="스크린샷 2022-01-09 오후 3 22 02" src="https://user-images.githubusercontent.com/26623547/148671635-da0524d6-3d19-4e7e-816d-47cc8f502c1f.png">   

<img width="850" alt="스크린샷 2022-01-09 오후 3 23 10" src="https://user-images.githubusercontent.com/26623547/148671654-0128088d-7d4c-4c33-9b09-9043953f772e.png">   

- - - 

## 1. 도커를 이용한 리액트 앱 실행하기   

도커를 이용하여 리액트 앱을 실행하기 위해서는 [지난글](https://wonyong-jang.github.io/devops/2022/01/02/DevOps-docker-node.html)에서 
노드를 올렸던것과 동일하게 dockerfile을 작성하면된다.   

`하지만, 아래 그림과 같이 이번글에서는 개발환경과 운영환경을 나누기 위해 
각각의 Dockerfile을 작성한다.`    

<img width="661" alt="스크린샷 2022-01-09 오후 3 38 55" src="https://user-images.githubusercontent.com/26623547/148671978-44bdb69c-e848-4c49-99d7-f1fe6d7eea51.png">   

create-react-app을 이용하여 리액트 앱을 만들고 개발환경을 위한 
도커파일인 Dockerfile.dev을 작성한다.    

##### Dockerfile.dev   

```
FROM node:alpine

WORKDIR /usr/src/app

COPY package.json ./

RUN npm install

COPY ./ ./

CMD ["npm", "run", "start"]
```

작성완료 후 도커 이미지를 생성할 때는 f 옵션을 추가하여 이미지 생성을 한다.   
`f옵션을 주지 않으면, Dockerfile.dev를 찾지 못하기 때문에 파일명을 
알려주는 옵션을 추가해야 한다.`    

```
// -f : 이미지를 빌드할때 쓰일 도커파일을 임의로 지정해준다.   
// -t : 이름 설정    
$ docker build -f Dockerfile.dev -t kaven/docker-react-app .   
```

도커 이미지 빌드 완료 후 docker-compose를 이용하여 리액트 앱을 실행시켜보자.   

##### docker-compose.yml   

```
version: "3"
services:
  react:
    build:
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    volumes:
      - /usr/src/app/node_modules
      - ./:/usr/src/app
    stdin_open: true

```

위 설명은 아래 그림과 같다.    
version과 컨테이너를 감싸는 services를 작성하고 각각의 
컨테이너를 명시한다.   
`react 컨테이너 이름을 명시했고, context는 도커 이미지를 구성하기 위한 
파일과 폴더들이 있는 위치이다.`   

> 예제에서는 docker-compose.yml과 Dockerfile이 같은 위치에 있기 때문에 . 로 명시했다.   

> stdin_open 옵션은 리액트 버전이 올라감에 따라 해당 설정을 넣어줘야 한다.   

<img width="800" alt="스크린샷 2022-01-09 오후 4 56 48" src="https://user-images.githubusercontent.com/26623547/148674089-020efa79-6aac-4b60-84a2-83d9b7dabef5.png">   


docker-compose up 명령어를 입력 후 localhost:3000를 브라우저에 입력하면 
리액트 초기화면을 확인 할 수 있다.   


- - - 

## 2. 리액트 앱 테스트 하기   

리액트 앱에서 테스트를 진행하려면 npm run test를 이용하면 된다.   
이를 도커를 이용하여 앱에서 테스트를 진행하려면 아래와 같다.   

```
// -it : 더 좋은 포맷으로 결과를 보기 위한 옵션   
$ docker run -it [이미지 이름] npm run test    
```

이제, 우리가 작성했던 docker-compose.yml에 위 명령어를 추가해서 
테스트도 가능하게 해보자.   

```
version: "3"
services:
  react:
    build:
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    volumes:
      - /usr/src/app/node_modules
      - ./:/usr/src/app
    stdin_open: true
  tests:
    build:
      context: .
      dockerfile: Dockerfile.dev
    volumes:
      - /usr/src/app/node_modules
      - ./:/usr/src/app
    command: ["npm", "run", "test"]
```

`이렇게 되면, 앱을 시작할 때 두 개의 컨테이너를 다 시작하게 되니, 
    먼저 리액트 앱을 실행하고 그 앱을 테스트도 하게 된다.`   

- - - 

## 3. 운영환경을 위한 Nginx와 Dockerfile 작성하기   

개발환경에서 앱을 실행할때는 브라우저가 http주소를 통해 
리액트에 요청을 하게 되면, 개발 서버를 통해 응답을 준다.   
단, 운영환경에 가게 되면 이러한 개발 서버가 사라지게 된다.   

> 여기서 운영환경이란 배포를 하고 호스팅을 하게 되는데 이때를 말하는 것이다.   

<img width="650" alt="스크린샷 2022-01-09 오후 5 35 36" src="https://user-images.githubusercontent.com/26623547/148675189-4ba2cf79-bc0d-4e61-84d0-3c45f24ff089.png">   

브라우저가 리액트 컨테이너에 어떠한 요청을 하게 되면, 그에 맞게 
정적인 파일들을 제공해줘야 하는데, 이 역할을 nginx가 하게 된다.   

<img width="850" alt="스크린샷 2022-01-09 오후 5 35 47" src="https://user-images.githubusercontent.com/26623547/148675191-9bd46178-714b-40e3-809a-4b4d981d81dc.png">   

`그럼, 왜 개발환경 서버와 운영 서버가 달라야 할까?`   

개발에서 사용하는 서버는 소스를 변경하면 자동으로 전체 앱을 
다시 빌드해서 변경 소스를 반영해주는 것 같이 개발 환경에 
특화된 기능들이 있기에 
그러한 기능이 없는 Nginx 서버보다 더욱 적합하다.   
반면, 운영환경에서는 소스를 변경할 때 다시 반영해줄 필요가 
없으며, 개발에 필요한 기능들이 필요하지 않기에 더 깔끔하고 빠른 
Nginx를 웹 서버로 사용한다.   

그럼 이제 Nginx를 포함하는 리액트 운영환경 이미지를 작성해보자.   
개발환경과 운영환경의 도커파일 차이점은 개발환경에서 build를 할 필요 없이 
실행이 가능하지만 운영환경에서는 build를 해줘야 하므로 `npm run build로 
빌드 파일들을 생성해주고 그 이후에 Nginx를 시작해줘야 한다.`      

즉, 운영환경을 위한 Dockerfile을 요약해보면 2단계로 이루어져있다.   

- 첫번째 단계는 빌드 파일들을 생성한다   

- 두번째 단계는 Nginx를 가동하고 첫번째 단계에서 생성된 빌드폴더의 파일들을 
웹 브라우저의 요청에 따라 제공하여 준다.   

##### Dockerfile   

```
FROM node:alpine as builder
WORKDIR /usr/src/app
COPY package.json ./
RUN npm install
COPY ./ ./
RUN npm run build


FROM nginx 
COPY --from=builder /usr/src/app/build /usr/share/nginx/html
```

`위에서 builder로 명시한 부분은 빌드 파일들을 생성하고 생성된 파일과 폴더들은 
/usr/src/app/build로 들어간다.`   

그 이후 nginx를 위한 베이스 이미지를 도커 허브에서 받아오고, builder 단계에 있는 
파일을 복사한다.   

`즉, builder 단계에서 생성된 파일들은 /usr/src/app/build에 들어가게 되며 그곳에 
저장된 파일들을 /usr/share/nginx/html로 복사시켜줘서 nginx가 웹 브라우저의 http 요청이 
올때마다 알맞은 파일을 전해줄수 있게 만든다.`    

`/usr/share/nginx/html 이 장소로 build 파일들을 복사 시켜주는 이유는 이 장소로 
파일을 넣어두면 Nginx가 알아서 Client에서 요청이 들어올때 알맞은 정적 파일들을 
제공해준다.`   

> 위 장소는 설정을 통해 변경 가능하다.  

다음 글에서 지금까지 작성한 소스를 모두 github에 push를 하여 이를 
travis CI에서 소스를 가져가고 소스가 잘 돌아가는지 Test를 한 후에 
성공하면 AWS에 보내서 배포까지 해보자.     

지금까지의 소스코드는 [링크](https://github.com/WonYong-Jang/docker-react-app)를 참조하자.  

- - - 

**Reference**    

<https://www.inflearn.com/course/%EB%94%B0%EB%9D%BC%ED%95%98%EB%A9%B0-%EB%B0%B0%EC%9A%B0%EB%8A%94-%EB%8F%84%EC%BB%A4-ci/lecture/52082?tab=curriculum&volume=1.00>    

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

