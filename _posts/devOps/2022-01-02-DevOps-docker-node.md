---
layout: post
title: "[Docker] 도커를 이용한 간단한 Node.js 어플 만들기"
subtitle: " dockerfile / docker volume / Working Directory / docker compose"    
comments: true
categories : DevOps
date: 2022-01-02
background: '/img/posts/mac.png'
---

[지난글](https://wonyong-jang.github.io/devops/2021/12/31/DevOps-docker.html)에서는 도커에 대한 개념과 명령어, 
그리고 dockerfile을 생성하는 방법을 살펴봤다.     
이번글에서는 Node.js 앱을 도커 환경에서 실행해보려고 한다.   
그렇게 하기 위해서는 먼저 이미지를 생성하고 그 이미지를 이용해서 
컨테이너를 실행한 후 그 컨테이너 안에서 Node.js 앱을 실행해야 한다.     
아래와 같이 순차적으로 실습해보자.   

- - - 

## 1. Node.js 앱 만들기   

새로운 폴더를 생성하고, npm init 명령어를 이용하여 package.json을 생성해보자.  
그 후 express 모듈을 추가해준다.   

```
{
  "name": "docker-node",
  "version": "1.0.0",
  "description": "",
  "main": "server.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "dependencies": {
      "express": "4.16.1"
  },
  "author": "",
  "license": "ISC"
}

```

아래와 같이 express 모듈을 이용하여 Hello World를 출력하는 기본적인 로직을 
작성한다.   

```
const express = require('express');

const PORT = 8080;

//APP
const app = express();
app.get('/', (req, res) => {
    res.send("Hello World!");
});

app.listen(PORT);
console.log("Server is running");   
```
- - - 

## 2. dockerfile 만들기 

노드 파일을 작성한 디렉토리에 Dockerfile 이름으로 파일을 생성 후 
아래와 같이 작성한다.     

```
FROM node:12

# npm install 명령어는 package.json을 보고 명시된 종속성들을 다운받아서 설치해주는데, 
# 도커 컨테이너에는 package.json이 없기 때문에 이를 copy해서 컨테이너 안으로 이동시켜 줘야 한다.   
# 로컬에서 만든 server.js 파일도 마찬가지로 모두 컨테이너를 이동시키기 위해 아래와 같이 작성   
# 도커 컨테이너 안에 ./ 경로에 현재 디렉토리에 있는 모든 파일들을 복사 
# copy를 안해주면 이미지를 생성할때 파일을 찾지 못한다는 에러를 발생시킨다.  
COPY ./ ./  

RUN npm install   

CMD ["node", "server.js"]
```

이제 dockerfile을 빌드해보고 이미지를 이용하여 컨테이너를 생성해보자.   
이때, node.js 앱에서 port를 8080을 주었는데 위에서 package.json과 server.js 등 종속성에 
필요한 파일을 copy를 통해 컨테이너 내부로 복사했던 것처럼 네트워크도 맵핑이 필요하다.   

`네트워크도 로컬 네트워크에 있던 것을 컨테이너 내부에 있는 네트워크에 연결을 시켜줘야 한다.`   
`아래와 같이 port 옵션을 통해 로컬 호스트 네트워크와 컨터이너 내부 포트를 매핑 시킨다.`   

<img width="725" alt="스크린샷 2022-01-02 오후 5 50 51" src="https://user-images.githubusercontent.com/26623547/147870933-838d628b-557c-4fc7-8943-73b5a638d0e6.png">  

로컬 호스트 포트 5000를 입력했을 경우 컨테이너 내부 포트 8080과
맵핑시킨다.

```
$ docker build -t kaven/nodejs ./
$ docker run -p 5000:8080 kaven/nodejs
```   

그 이후 localhost:5000을 확인해보면, Hello World가 출력된 것을 
확인 할 수 있다.  

- - - 

## 3. Working Directory   

위에서 dockerfile을 생성해봤고, 도커 파일에 WORKDIR이라는 부분을 추가해 주어야한다.   
이미지안에서 어플리케이션 소스 코드를 갖고 있을 디렉토리를 생성하는 것이다.   
그리고 이 디렉토리가 어플리케이션에 working 디렉토리가 된다.   

그런데 왜 따로 working 디렉토리가 있어야 할까?   

위에서 실습을 할 때 copy를 이용하여 소스코드들을 모두 root 디렉토리에 가져와서 
사용했었다.     
이렇게 사용했을 때 문제점은 아래와 같다.   

- `소스코드들 중에서 원래 이미지에 있던 파일과 이름이 같다면, 원래 있던 폴더가 덮어씌워져 버린다.`      

- `모든 파일이 한 디렉토리에서 관리를 해야하기 때문에 유지보수가 어렵다.`    

`즉, 모든 어플리케이션을 위한 소스들은 WORK 디렉토리를 따로 만들어서 보관해야 한다.`   

아래와 같이 WORKDIR을 이용하여 경로를 추가한다.

```
FROM node:12

WORKDIR /usr/src/app

COPY ./ ./ 

RUN npm install

CMD ["node", "server.js"]
```

- - - 

## 4. 어플리케이션 소스 변경으로 다시 빌드에 대한 문제점   

어플리케이션을 만들다 보면 소스 코드를 계속 변경시켜줘야 하며, 
    그에 따라서 변경된 부분을 확인하면서 개발을 해나가야 한다.   

`위에서 생성한 dockerfile에서 이미지를 빌드할 때 문제점은 
package.json 파일이 변경되지 않았음에도 불구하고 
빌드할 때마다 새롭게 npm install 해주고 있다.`       

`즉, 모듈을 다시 받는 것은 모듈에 변화가 생겨야만 다시 받아야 하는데 
소스 코드에 조금의 변화만 생겨도 모듈 전체를 다시 받는 문제점이 있다.`      

<img width="700" alt="스크린샷 2022-01-04 오전 12 16 13" src="https://user-images.githubusercontent.com/26623547/147947830-6098167d-6ac6-481c-8965-3a08fb3a31d2.png">   

아래와 같이 dockerfile을 수정해줌으로써 npm install 할때 
불필요한 다운로드를 피할 수 있다.   

package.json을 먼저 COPY를 해주고, npm install을 하도록 변경하였다.   
기존에 전체파일을 COPY를 먼저 했을 때는 소스코드가 조금만 변경되어도 
전체 모듈를 다시 받게 되었지만 이를 분리시켜서 dockerfile을 생성하면 된다.   

```
FROM node:12

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY ./ ./ 

CMD ["node", "server.js"]
```

이제 모듈은 모듈에 변화가 생길때만 다시 다운 받아주며, 소스 코드에 
변화가 생길때 모듈을 다시 받는 현상을 없애주었다.    


- - - 

## 5. Docker Volume    

위에서 npm install 전에 package.json만 따로 변경을 해줘서 
쓸때없이 모듈을 다시 받지 않아도 되게 진행했다.   

하지만, 아직도 소스를 변경할때마다 변경된 소스 부분은 
COPY 한 후 이미지를 다시 빌드를 해주고 컨테이너를 다시 
실행해줘야 변경된 소스가 화면에 반영이 된다.  
이러한 작업은 너무나 시간 소요가 크며, 이미지도 너무나 많이 
빌드하게 된다.  
이러한 문제를 해결하기 위해서 Volume을 사용하게 된다.   

`Docker Volume은 COPY와는 다르게 파일들을 컨테이너로 복사하지 않고 
참조하도록 설정한다.`   
`docker는 기본적으로 컨테이너를 삭제하면 데이터가 삭제되므로 
데이터를 보존하고 싶을 때 혹은 여러 컨테이너간에 데이터를 
공유해서 사용하고 싶을 때 사용한다.`   

<img width="650" alt="스크린샷 2022-01-04 오후 10 17 50" src="https://user-images.githubusercontent.com/26623547/148064913-44b45273-8fb0-4b2b-aeb0-4070a923d628.png">   

명령어는 아래와 같고 `-v 옵션으로 호스트와 컨테이너를 맵핑 시켜줄 수 있다.`   

`아래 node_modules는 호스트 디렉토리에 
node_modules은 없기에 컨테이너에 맵핑을 하지 말라고 하는 것이다.`    

즉, -v usr/app/node_modules 현재 컨테이너환경에 node_modules을 찾으라는 말이다.

> node_modules은 npm install로 종속성들을 다운받으면 생기게 되는데, 
    현재 실습을 한 소스 파일들중에는 node_modules 폴더가 없다. 이는 컨테이너 안에서 
    npm install을 해주기 때문에 컨테이너 안에 폴더가 생긴다.   


```
// docker run <option> -v <host-route>:<container-route> <image-name>
$ docker run -p 5000:8080 -v /usr/src/app/node_modules -v $(pwd):/usr/src/app <이미지 아이디>   
```

- - - 

## 6. Docker Compose  

이제 조금 더 응용하여 Node.js 환경에서 Redis를 사용해보는 실습을 
하려고 한다.   

이때 redis 서버 컨테이너와 노드 앱 컨테이너가 각각 필요하고 
이를 쉽게 구성하기 위해 docker compose를 사용할 수 있다.  

`docker compose란 여러개의 컨테이너로부터 이루어진 서비스를 구축, 실행하는 
순서를 자동으로 관리하여 관리를 간단히 하는 기능이다.`    

`즉, docker compose에서는 compose 파일을 준비하여 커맨드를 1회 실행하는 
것으로, 그 파일로부터 설정을 읽어들여 모든 컨테이너 서비스를 
실행시키는 것이 가능하다.`    



- - - 

**Reference**    

<https://www.inflearn.com/course/%EB%94%B0%EB%9D%BC%ED%95%98%EB%A9%B0-%EB%B0%B0%EC%9A%B0%EB%8A%94-%EB%8F%84%EC%BB%A4-ci/lecture/52082?tab=curriculum&volume=1.00>    

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

