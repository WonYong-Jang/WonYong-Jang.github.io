---
layout: post
title: "[Docker] 도커에 대한 이해"
subtitle: "도커에 대한 개념과 기존 가상화 기술과의 차이 / 명령어 / dockerfile"    
comments: true
categories : DevOps
date: 2021-12-31
background: '/img/posts/mac.png'
---

## 도커란?    

`컨테이너를 사용하여 응용프로그램을 더 쉽게 만들고 배포하고 실행할 수 있도록 
설계된 도구이며 컨테이너 기반의 오픈소스 가상화 플랫폼이며 생태계이다.`    

컨테이너 안에 다양한 프로그램, 실행환경을 컨테이너로 추상화하고 동일한 
인터페이스를 제공하여 프로그램의 배포 및 관리를 단순하게 해준다.   
일반 컨테이너 개념에서 물건을 손쉽게 운송해주는 것처럼 프로그램을 
손쉽게 이동 배포 관리를 할수 있게 해준다.   
AWS, Azure, Google cloud등 어디에서든 실행 가능하게 해준다.   

- - - 

## 도커 이미지와 도커 컨테이너   

`컨테이너`는 코드와 모든 종속성을 패키지화하여 응용 프로그램이 
한 컴퓨팅 환경에서 다른 컴퓨팅 환경으로 빠르고 안정적으로 실행되도록 
하는 소프트웨어 표준 단위이다.     

> 조금 더 쉽게 풀어서 설명하면, 간단하고 편리하게 프로그램을 실행시켜 주는 것이다.     

`컨테이너 이미지`는 코드, 런타임, 시스템 도구, 시스템 라이브러리 및 설정과 
같은 응용 프로그램을 실행하는 데 필요한 모든 것을 포함하는 가볍고 
독립적이며 실행 가능한 소프트웨어 패키지이다.       

컨테이너 이미지는 런타임에 컨테이너가 되고 도커 컨테이너의 경우 
도커 엔진에서 실행될 때 이미지가 컨테이너가 된다.   

<img width="600" alt="스크린샷 2021-12-31 오후 11 00 31" src="https://user-images.githubusercontent.com/26623547/147827111-0dc2534f-11fe-45e5-aa99-54a91298dcb3.png">      

`정리해보면, 도커 이미지는 프로그램을 실행하는데 필요한 설정이나 
종속성을 갖고 있으며 도커 이미지를 이용해서 컨테이너를 생성하며 
도커 컨테이너를 이용하여 프로그램을 실행한다.`       

---

## 도커와 기존 가상화 기술과의 차이    

가상화 기술이 나오기 전에는 한대의 서버를 하나의 용도로만 사용했기 
때문에 남는 서버 공간은 그대로 방치가 되었다. 즉, 하나의 서버에 
하나의 운영체제, 하나의 프로그램만 운영을 했다.   

안정적이지만 비효율적이기 때문에 `하이퍼 바이저 기반의 가상화`가 등장했다.   

> 하이퍼 바이저는 호스트 시스템(윈도우, 리눅스 등)에서 다수의 게스트 OS를 구동할 수 
있게 하는 소프트웨어이다.     

즉, 논리적으로 공간을 분할하여 VM이라는 독립적인 가상 환경의 서버를 
이용할 수 있다.   

<img width="800" alt="스크린샷 2022-01-01 오후 6 38 50" src="https://user-images.githubusercontent.com/26623547/147847929-83720a28-0a84-4f9c-9603-8a6f3c23712f.png">   

위 그림처럼 하드웨어의 각 Core마다 독립된 가상환경의 자원을 할당 받기 때문에 
하나의 VM에서 오류가 발생해도 다른 가상환경으로 퍼지지 않는다.   

도커는 하이퍼 바이저의 구조를 토대로 등장했다.   

<img width="900" alt="스크린샷 2022-01-01 오후 6 43 13" src="https://user-images.githubusercontent.com/26623547/147847982-d174aff8-95d3-436d-91dd-29a6fc1e17cf.png">   

`도커와 VM의 공통점으로는 기본 하드웨어에서 격리된 환경 내에 
어플리케이션을 배치하는 방법이다.`    

`차이점은 격리된 한경을 얼마나 격리 시키는지 차이이다.`   

> VM 같은 경우는 Guest OS를 같이 배치해야 하고, 어플리케이션을 
실행할 때도 도커에 비해서 무겁게 실행해야 한다.   

그럼 위에서 컨테이너들을 격리시키는데 어떻게 해서 
도커 컨테이너를 격리를 시킬까?    

`리눅스에서 쓰이는 Cgroup(control groups)와 네임스페이스(namespaces)에 의해 가능하다.`   

- Cgroup : cpu, 메모리, Network Bandwith, HD i/o 등 프로세스 그룹의 시스템 
리소스 사용량을 관리      

- namespaces : 하나의 시스템에서 프로세스를 격리시킬 수 있는 가상화 기술   

- - - 

## 도커 명령어    

도커를 사용하기 위한 여러가지 명령어를 살펴보자.   

#### 컨테이너    

```
$ docker ps // 현재 실행중인 컨테이너 
$ docker ps -a // 지금까지 만든 전체 컨테이너 목록 (all)
$ docker inspect [컨테이터 id 또는 name] // 자세한 정보 확인
$ docker stop [컨테이너 id 또는 name] // Gracefully 중지  <-> kill 명령을 이용하게 될 경우는 하는 작업 강제 종료   
$ docker rm [컨테이너 id 또는 name] // 삭제   
$ docker rm `docker ps -a -q` // 모든 컨테이너 삭제   


// 한번에 컨테이너, 이미지, 네트워크 모드 삭제  
// 도커를 쓰지 않을 때 모두 정리하고 싶을 때 사용하면 좋다. 
// 하지만 실행중인 컨테이너에는 영향을 주지 않음   
$ docker system prune


// 생성된 이미지로 컨테이너 만들기   
$ docker create --name [서버명] -p [외부 포트:컨테이너 내부포트] [이미지명:버전태그]      

// 컨테이너 실행   
$ docker start [컨테이너 id 또는 name]      

// 컨테이너 접속   
$ docker attach [컨테이너id 또는 name]     


// 컨테이너를 생성하는 동시에 실행
// -d, --detach : detach 는 명령을 입력하고 다시 터미널로 복귀한다.    
// -e, --env : 컨테이너에 환경 변수를 설정한다. 보통 설정 값이나 비밀번호를 전달할 때 사용한다.   
// -e MYSQL_PASSWORD=password   
// --rm : 컨테이너를 일회성으로 실행할 때 주로 사용하는데, 컨테이너가 종료될 때 컨테이너와 관련된 리소스(파일 시스템, 볼륨)까지 모두 제거한다.   
$ docker run [컨테이너 id 또는 name]



// 실행중인 컨테이너에 명령어 전달   
$ docker exec [컨테이너 Id 또는 name]   
$ docker exec -it [컨테이너 id 또는 name] redis-cli   

// 컨테이너를 sh, bash 등의 터미널 환경으로 접근하기 
// bash는 컨테이너가 어떤 환경이냐에 따라 달라질 수 있음 (sh, bash, zsh..)   
// exec 대신 run을 통해서도 가능하다.
// 이 터미널 환경에서 나오려면 control + D   
$ docker exec -it [컨테이너 id 또는 name] /bin/bash
```  

위의 docker stop과 kill에 대해서 조금더 자세히 살펴보면 아래 그림과 같다.   
docker stop의 경우는 하는 작업을 안전하게 종료할 수 있도록 Sigterm을 통해 
정리하는 시간을 주고 있고, docker kill의 경우는 강제 종료를 한다.   

<img width="700" alt="스크린샷 2022-01-01 오후 7 40 38" src="https://user-images.githubusercontent.com/26623547/147848816-1e29a19c-6aa6-453c-9115-ca6c8fdb9fe0.png">  

또한, -i, -t 옵션의 설명은 아래와 같다.   

<img width="650" alt="스크린샷 2022-01-01 오후 8 03 03" src="https://user-images.githubusercontent.com/26623547/147849144-92c458b3-7721-4f1c-8439-1d5ba9a08db5.png">   

#### 이미지   

```
// 다운로드 된 이미지 확인
$ docker images   

// 14.04 와 같이 태그가 주어지지 않으면 latest로 지정됨
$ docker pull ubuntu:14.04

// 이미지 삭제   
$ docker rmi [이미지 id]    

// 이미지 빌드
$ docker build -t [이미지명] .   
$ docker build --tag node_server:0.0.1 [Dockerfile이 위치하는 경로]

// 이미지 빌드할때 쓰일 도커파일을 임의로 지정해 준다.   
// Dockerfile 이름과 다른 이름을 사용할 경우 f 옵션 사용   
$ docker build -f Dockerfile.dev [Dockerfile이 위치하는 경로]
```

#### Docker compose  

```
// 이미지가 없을 때 이미지를 빌드하고 컨테이너를 실행한다.   
$ docker-compose up


// detached 모드로서 앱을 백그라운드에서 실행시킨다.
// 그래서 앱에서 나오는 output을 표출하지 않는다.   
$ docker-compose -d up   

// 이미지가 있든 없든 이미지를 빌드하고 컨테이너를 실행한다.   
// 이미지 수정된 부분이 반영이 필요하면 build 옵션을 추가한다.   
$ docker-compose up -- build   

// 중지 
$ docker-compose down 
```

---

## 도커 이미지 만들어보기   

도커 이미지를 만들어서 사용할 수도 있고, 직접 만든 도커 이미지를 도커 허브에 
올려서 공유할 수도 있다.   

`도커 이미지를 만들기 위해서는 도커 파일(Docker file)을 
만들어야 하며, 도커 파일은 이미지를 만들기 위한 설정 파일이고 어떻게 
행동해야 하는지에 대한 설정들을 정의해 주는 곳이다.`    

dockerfile의 전체적인 구조는 아래와 같다.   

```  
# 베이스 이미지를 명시해준다.   
# 이미지 생성시 기반이 되는 이미지 레이어이다.   
FROM baseImage     

# Dockerfile또는 컨테이너 안에서 환경 변수로 사용 가능하며, docker run -e 옵션으로도 사용 가능하다.
ENV [key] [value]

# build 시점에만 사용되는 변수이며, docker build --build-arg 옵션으로 사용도 가능하다.   
# ARG는 Dockerfile에서만 사용가능하다.   
# ARG [key]=[value]
ARG JAR_FILE=build/libs/*.jar

# 추가적으로 필요한 파일들을 다운로드 받는다.   
# 도커 이미지가 생성되기 전에 수행할 쉘 명령어   
RUN command   

# 컨테이너 시작시 실행 될 명령어를 명시해준다.   
# 해당 명령어는 dockerfile 내 1회만 쓸 수 있다.   
CMD [ "executable" ]    
```

완성된 도커 파일로 어떻게 이미지를 생성할까?    

<img width="600" alt="스크린샷 2022-01-02 오후 4 07 55" src="https://user-images.githubusercontent.com/26623547/147868821-751f7013-7a99-4f41-acc7-59013c856f5f.png">   

도커 파일에 입력된 것들이 도커 클라이언트에 전달되어서 
도커 서버가 인식하게 하여야 한다.   
`그렇게 하기 위해서는 docker build 명령어를 이용한다.`          

```
$ docker build --tag node_server:0.0.1 [Dockerfile이 위치하는 경로]
```   

[다음글](https://wonyong-jang.github.io/devops/2022/01/02/DevOps-docker-node.html)에서는 실제로 dockerfile을 만들고,
    도커를 이용하여 간단한 Node.js 어플을 만들어보자.     

- - - 

**Reference**    

<https://www.inflearn.com/course/%EB%94%B0%EB%9D%BC%ED%95%98%EB%A9%B0-%EB%B0%B0%EC%9A%B0%EB%8A%94-%EB%8F%84%EC%BB%A4-ci/lecture/52082?tab=curriculum&volume=1.00>    

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

