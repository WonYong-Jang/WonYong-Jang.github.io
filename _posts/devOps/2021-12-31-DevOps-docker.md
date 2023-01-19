---
layout: post
title: "[Docker] 도커에 대한 이해"
subtitle: "도커에 대한 개념과 기존 가상화 기술과의 차이 / 명령어 / dockerfile 작성가이드"    
comments: true
categories : DevOps
date: 2021-12-31
background: '/img/posts/mac.png'
---

## 1. 도커란?    

`컨테이너를 사용하여 응용프로그램을 더 쉽게 만들고 배포하고 실행할 수 있도록 
설계된 도구이며 컨테이너 기반의 오픈소스 가상화 플랫폼이며 생태계이다.`   

> 컨테이너라 하면 네모난 화물 수송용 박스를 생각할 수 있는데, 각각의 
컨테이너 안에는 옷, 신발, 과일 등등 다양한 화물을 넣을 수 있고 
다양한 운송수단으로 쉽게 옮길 수 있다.     

서버에서 이야기하는 컨테이너도 이와 비슷한데 다양한 프로그램, 실행환경을 
컨테이너로 추상화하고 동일한 인터페이스를 제공하여 프로그램 배포 및 
관리를 단순하게 해준다.  

> 더 간단하게 말해, 컨테이너란 우리가 구동하려는 애플리케이션을 실행할 수 있는 환경까지 감싸서, 
    어디서든 쉽게 실행할 수 있도록 해주는 기술이다.      

`일반 컨테이너 개념에서 물건을 손쉽게 운송해주는 것처럼 어플리케이션 환경에 
구애 받지 않고 손쉽게 배포 관리를 할수 있게 해준다.`          

그럼 왜 굳이 도커(컨테이너)를 써야 할까?   

똑같은 일을 하는 두 서버가 있다고 해도, A서버는 한달 전에 구성했고 B 서버는 
이제 막 구성했다면, 운영체제부터 컴파일러, 설치된 패키지까지 완벽하게 같기는 
쉽지 않다.   

그리고 이러한 차이점들이 장애를 일으킬 것이다.    
A서버는 잘 되는데 B 서버는 왜 안되지?   

위 상황에서 도커 없이 해결하기 위해서는 각 서버마다 작업을 실행할 때마다 
사내 문서 도구에 기록해 둔다거나, Ansible 등의 도구를 이용 했었다.   

하지만, 위에서 언급한 것처럼 서버 A와 서버 B의 설치된 시점이 길어지면 
길어질 수록 두 서버의 환경을 완전히 동일하게 맞추기는 쉽지 않다.   

`따라서, 여기서 도커가 이를 해결해주며 뒤에서 설명할 도커 파일은 앞서 
이야기한 서버 운영기록을 코드화 한 것이다.`      
이 도커 파일로 도커 이미지를 만들 수 있으며, 이를 통해 도커 컨테이너를 
생성한다.   


`즉, 서버마다 동일한 환경을 구성해주기 때문에 수평적 확장에 유리하다.`      

또한, AWS, Azure, Google cloud등 어디에서든 실행 가능하게 해준다.   

- - - 

## 2. 도커 이미지와 도커 컨테이너   

`컨테이너 이미지`는 코드, 런타임, 시스템 도구, 시스템 라이브러리 및 설정과 
같은 응용 프로그램을 실행하는 데 필요한 모든 것을 포함하는 패키지를 말한다.    

즉, 이미지는 컨테이너를 실행하기 위한 모든 정보를 가지고 있기 때문에 
더 이상 새로운 서버가 추가되면 의존성 파일을 컴파일하고 이것저것 
설치할 필요가 없다.      

> 예를 들면, Ubuntu이미지는 Ubuntu를 실행하기 위한 모든 파일을 가지고 있으며, 
    Oracle 이미지는 Oracle을 실행하는데 필요한 파일과 실행명령어, port 정보 등을 
    모두 가지고 있다.   

도커 이미지는 Github와 유사한 서비스인 [Docker hub](https://hub.docker.com/)를 통해 버전 관리 및 배포(push&pull)가 가능하다.     

`컨테이너는 도커에서 이미지를 독립된 공간에서 실행할 수 있게 해주는 기술이다.`      

컨테이너 이미지는 런타임에 컨테이너가 되고 도커 컨테이너의 경우 
도커 엔진에서 실행될 때 이미지가 컨테이너가 된다.   
또한, 하나의 이미지는 여러 컨테이너를 생성할 수 있고, 컨테이너가 
삭제되더라도 이미지는 변하지 않고 그대로 남아 있는다.   

<img width="600" alt="스크린샷 2021-12-31 오후 11 00 31" src="https://user-images.githubusercontent.com/26623547/147827111-0dc2534f-11fe-45e5-aa99-54a91298dcb3.png">      

`정리해보면, 도커 이미지는 프로그램을 실행하는데 필요한 설정이나 
종속성을 갖고 있으며 도커 이미지를 이용해서 컨테이너를 생성하며 
도커 컨테이너를 이용하여 프로그램을 실행한다.`       

- - -    

## 3. 도커와 기존 가상화 기술과의 차이    

가상화 기술이 나오기 전에는 한대의 서버를 하나의 용도로만 사용했기 
때문에 남는 서버 공간은 그대로 방치가 되었다. 즉, 하나의 서버에 
하나의 운영체제, 하나의 프로그램만 운영을 했다.   

하나의 서버에 여러 어플리케이션을 운영하게 되면, 하나의 어플리케이션에 
문제가 발생했을 때, 다른 어플리케이션에도 문제가 발생할 수 있는 치명적인 단점이 있다.   

안정적이지만 비효율적이기 때문에 `하이퍼 바이저 기반의 가상화`가 등장했다.   

`하이퍼 바이저는 호스트 시스템(윈도우, 리눅스 등)에서 다수의 게스트 OS(가상 머신)를 구동할 수 
있게 하는 소프트웨어이다.`    

> VMware나 VirtualBox같은 가상머신을 예로 들 수 있다.   

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

`Docker는 근간이 되는 격리 기술을 넘어 컨테이너와 이미지, 네트워크와 서비스, 보안 등 
Software의 배포와 생명주기를 관리할 수 있는 다양한 주변 기능에 초점이 
맞추어져 있다.`   

- - - 

## 4. 도커 Client와 Server(Daemon)   

도커를 설치하게 되면 느껴지진 않지만 가상머신에 설치가 되며, 사용자는 전혀 
가상머신을 사용한다는 느낌이 들지 않는다.    

예를 들면, 포트를 연결하기 위해 도커 컨테이너의 특정 포트를 가상머신에 연결하고 
다시 mac이나 window의 포트와 연결해야 한다.  
디렉토리를 연결한다면 디렉토리를 가상머신과 공유하고 그 디렉토리를 다시 컨테이너와 연결해야 한다.   
이런 한단계 추가적으로 거쳐야하는 부분을 자연스럽게 처리해준다.    

```
$ docker version   

Client:
 Cloud integration: v1.0.22
 Version:           20.10.11
 OS/Arch:           darwin/amd64

Server: Docker Engine - Community
 Engine:
  Version:          20.10.11
  OS/Arch:          linux/amd64
```

위 처럼 docker 설치 후 version을 살펴보면, 버전 정보가 클라이언트와 서버로 나뉘어져 있다.   
`도커는 하나의 실행파일이지만 실제로 클라이언트와 서버역할을 각각 할 수 있다. 도커 커맨드를 
입력하면 도커 클라이언트가 도커 서버로 명령을 전송하고 결과를 받아 터미널에 출력해준다.`    

<img width="643" alt="스크린샷 2022-07-30 오후 3 23 45" src="https://user-images.githubusercontent.com/26623547/181878022-af4268b5-031f-493a-96f5-791ac093fed0.png">    

기본값이 도커 서버의 소켓을 바라보고 있기 때문에 사용자는 의식하지 않고 마치 바로 명령을 
내리는 것 같은 느낌을 받는다.   
이러한 설계가 mac이나 window의 터미널에서 명령어를 입력했을 때 가상 서버에 설치된 도커가 동작하는 이유이다.   

- - - 

## 5. 도커 명령어    

도커를 사용하기 위한 여러가지 명령어를 살펴보자.   

#### 5-1) 컨테이너    

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

#### 5-2) 이미지   

```
// 다운로드 된 이미지 확인
$ docker images   

// 14.04 와 같이 태그가 주어지지 않으면 latest로 지정됨
$ docker pull ubuntu:14.04

// 이미지 삭제   
$ docker rmi [이미지 id]   

// 이미지 히스토리 
// 이미지가 생성되기까지 어떤 레이어들을 거쳤는지
// dockerfile 명령어들을 확인 할 수 있다.
$ docker history [이미지 이름, id]    


// 이미지 빌드
// 태그를 지정하지 않으면 latest로 지정 
// docker build -t [userID]/[이미지 이름:태그] [Dockerfile의 경로]
$ docker build -t [이미지명] .   
$ docker build --tag node_server:0.0.1 [Dockerfile이 위치하는 경로]

// 이미지 빌드할때 쓰일 도커파일을 임의로 지정해 준다.   
// Dockerfile 이름과 다른 이름을 사용할 경우 f 옵션 사용   
$ docker build -f Dockerfile.dev [Dockerfile이 위치하는 경로]
```

#### 5-3) Docker compose  

```
// 이미지가 없을 때 이미지를 빌드하고 컨테이너를 실행한다.   
// -f 기본적으로 제공하는 docker-compose.yml이 아닌 별도의 파일명을 실행할 때 사용   
$ docker-compose up
$ docker-compose -f docker-compose-test.yml up     


// detached 모드로서 앱을 백그라운드에서 실행시킨다.
// 그래서 앱에서 나오는 output을 표출하지 않는다.   
$ docker-compose -d up   

// 이미지가 있든 없든 이미지를 빌드하고 컨테이너를 실행한다.   
// 이미지 수정된 부분이 반영이 필요하면 build 옵션을 추가한다.   
$ docker-compose up --build   

// 실행 중인 서비스를 삭제
// 컨테이너와 네트워크를 삭제하며, 옵션에 따라 볼륨도 같이 삭제 가능  
$ docker-compose down   

// 현재 환경에서 실행 중인 각 서비스 상태 
$ docker-compose ps  

// 로그 확인    
// --follow(혹은 -f)로 실시간으로 나오는 로그 확인 가능    
$ docker-compose logs  

// docker-compose에 최종적으로 적용된 설정을 확인    
$ docker-compose config
```

---

## 6. 도커 이미지 만들어보기   

도커 이미지를 만들어서 사용할 수도 있고, 직접 만든 도커 이미지를 도커 허브에 
올려서 공유할 수도 있다.   

`도커 이미지를 만들기 위해서는 도커 파일(Docker file)을 
만들어야 하며, 도커 파일은 이미지를 만들기 위한 설정 파일이고 어떻게 
행동해야 하는지에 대한 설정들을 정의해 주는 곳이다.`    

dockerfile에서 자주 사용되는 명령문과 예시는 아래에서 확인하자.    

#### 6-1) FROM   

새로운 이미지를 생성할 때 기반으로 사용할 이미지를 지정한다.       
이미 만들어진 다양한 베이스 이미지는 [Docker hub](https://hub.docker.com/)에서 확인할 수 있다.      

```
// <이미지 이름>:<태그>   
FROM ubuntu:16.04    
```

#### 6-2) COPY    

호스트에 있는 파일이나 디렉토리를 Docker 이미지의 파일 시스템으로 복사하기 
위해서 사용된다.    

`copy는 volume과는 다르게 빌드 시간에 이루어지기 때문에`, 호스트의 파일이 
변경되어도 즉시 반영되지 않는다.   

![스크린샷 2022-10-24 오후 4 00 48](https://user-images.githubusercontent.com/26623547/197466505-774262a8-aa90-4b29-b1db-7533955146cb.png)    


#### 6-3) ADD   

ADD 명령문은 좀 더 파워풀한 COPY 명령문이라고 생각하면 된다.   
일반 파일뿐만 아니라 압축파일이나 네트워크 상의 파일도 사용할 수 있다.   
이렇게 특수한 파일을 다루는게 아니라면 COPY를 사용하는 것이 권장된다.    

```
// URL로 부터 컨텐츠를 가져오는 예시   
ADD https://www-us.apache.org/dist//httpd/httpd-2.4.41.tar.gz  /linuxteacher/from_url

// 압축파일의 경우 압축 해제하는 예시   
ADD abc.tar.gz /linuxteacher/from_local   
```

#### 6-4) RUN     

도커 이미지를 생성할 때 실행될 명령어이다.      

```
RUN npm install    
```

RUN 명령을 통해 필요한 패키지를 주로 설치하게 되는데 주의해야 할 부분이 있다.    
`길거나 복잡한 RUN 구문은 백슬래시를 활용하여 여러줄로 분할해야 하며, RUN을 여러번 단독으로 
사용했을 경우 문제가 발생할 수 있다.`    

예를 들면, apt-get update와 apt-get install의 경우다.   

```
FROM ununtu:18:04
RUN apt-get update
RUN apt-get install -y curl
```

위의 경우는 이미지가 빌드된 이후에, 모든 레이어가 도커 캐시안에 들어가게 된다.   
apt-get install 뒤에 nginx을 추가했다고 가정해보자.   

```
FROM ununtu:18:04
RUN apt-get update
RUN apt-get install -y curl nginx   
```

도커는 이전 명령어와 수정된 명령어가 동일할 때에만 이전단계의 캐시를 사용한다.  
`따라서 빌드가 캐시된 버전을 사용하기 때문에 apt-get update가 실행되지 
않는다.`       
`그러므로 이 빌드는 잠재적으로 오래된 버전의 curl과 nginx 패키지를 얻게되는 
결과를 초래할 수 있다.`     

따라서 아래와 같이 하나의 RUN 구문으로 작성해야 한다.   

```
RUN apt-get update && apt-get install -y \
        curl 
```


#### 6-5) CMD     

도커 컨테이너가 실행되었을 때 실행되는 명령어를 정의한다.  
빌드할 때는 실행되지 않으며 여러 개의 CMD가 존재할 경우 가장 마지막 CMD만 실행된다.   
또한, ENTRYPOINT와 유사하지만 Docker run 명령어에 인자값을 전달하여 
실행하면 CMD에 명시된 명령어와 인자값은 무시된다.    

`즉, CMD는 사용자 파라미터 입력에 따라 변하며, ENTRYPOINT는 파라미터와 
상관없이 항상 실행 된다.`    


#### 6-6) ENTRYPOINT   

컨테이너가 실행되었을 때 `항상 실행`되어야 하는 커맨드를 지정할 때 사용한다.   

```
ENTRYPOINT ["java", "-jar", "./app.jar"]    
```

#### 6-7) WORKDIR   

RUN, CMD, ADD, COPY 등이 이루어질 기본 디렉토리를 설정한다.    
각 명령어의 현재 디렉토리는 한 줄마다 초기화되기 때문에 RUN cd /path를 하더라도 다음 
명령어에선 위치가 초기화 된다.   
따라서 같은 디렉토리에서 계속 작업하기 위해서 WORKDIR을 사용하면 된다.   

```
WORKDIR /usr/app
```

#### 6-8) EXPOSE   

EXPOSE 명령문은 "이 도커 이미지는 EXPOSE한 port를 외부에 공개할 예정이다"라고 명시하는 것과 같다.   


> 프로토콜은 TCP와 UDP 중 선택할 수 있는데 지정하지 않으면 TCP가 기본값으로 사용된다.   

`여기서 주의할 점은 EXPOSE 명령문으로 지정된 포트는 해당 컨테이너의 
내부에서만 통신이 가능하며, 호스트(host) 에서 이 포트를 바로 
접근을 할 수 있는 것은 아니다.`   
`호스트로부터 해당 포트로의 접근을 허용하려면 -p(직접 명시) 또는 -P(랜덤 포트) 옵션을 통해 
호스트의 특정 포트를 포워딩(forwarding) 시켜줘야 한다.`        



```
// 80/TCP 포트로 리스닝    
EXPOSE 80

// 9999/UDP 포트로 리스팅 
EXPOSE 9999/udp   
```

#### 6-9) VOLUME  

`Docker Volume은 COPY와는 다르게 파일들을 컨테이너로 복사해 와서 
별개로 사용하는 것이 아니라, 참조 하여 변화를 반영하도록 설정한다.`        
docker는 기본적으로 컨테이너를 삭제하면 데이터가 삭제되므로 데이터를 
보존하고 싶을 때 혹은 
여러 컨테이너간에 데이터를 공유해서 사용하고 싶을 때 사용한다.   

![스크린샷 2022-10-24 오후 4 00 54](https://user-images.githubusercontent.com/26623547/197466518-0a488bd4-d556-485e-8429-4eda5692313a.png)    

호스트의 파일이 변경되면, 즉시 컨테이너에 참조하고 있는 파일이 반영이 
이루어지기 때문에, 개발 환경에서 유용하다.   


#### 6-10) ARG    

`ARG 명령문은 docker build 커맨드로 이미지를 빌드 시 --build-arg 옵션을 통해 
넘길 수 인자를 정의하기 위해 사용한다.`       

예를 들어, Dockerfile에 다음과 같이 ARG 명령문으로 jar file 인자로 선언해주면, 

```
ARG JAR_FILE    
```

다음과 같이 docker build build-arg 옵션에 port값을 넘길 수 있다.   

```
$ docker build --build-arg JAR_FILE=build/libs/*.jar
```

인자의 디폴트값을 지정해주면, --build-arg 옵션으로 해당 인자가 넘어오지 않았을 때 
사용된다.    

```
ARG JAR_FILE=build/libs/*.jar    
```

설정된 인자값은 다음과 같이 사용 가능하다.   

```
COPY ${JAR_FILE} app.jar    
```

`참고로, ENV와 달리 ARG로 설정한 값은 이미지가 빌드되는 
동안에만 유효하니 주의하자.`        

#### 6-11) ENV   

컨테이너에서 사용할 환경변수를 지정한다.   
`도커 컨테이너 시간은 기본적으로 UTC로 되어 있으며, 
Timezone으로 변경하기 위해서는 아래와 같이 환경변수 TZ를 사용하면 된다.`   

```
// 컨테이너를 실행할 때 --env(-e)옵션을 사용하면 기존 값을 오버라이딩 하게 된다.   
// TimeZone 환경변수 지정    
ENV TZ=Asia/Seoul
```

#### .dockerignore 파일    

명령문은 아니지만 .dockerignore 파일도 알아두면 Dockerfile을 작성할 때 유용하다.   
Docker 이미지를 빌드할 때 제외시키고 싶은 파일이 있다면, .dockerignore 파일에 
추가해주면 된다.   

```
.git
*.md
```


#### 도커파일 예시   

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

<https://www.linuxteacher.com/docker-add-vs-copy-vs-volume/>   
<https://yceffort.kr/2022/02/dockerfile-instructions#run>    
<https://subicura.com/2017/01/19/docker-guide-for-beginners-1.html>   
<https://www.44bits.io/ko/post/why-should-i-use-docker-container>   
<https://www.inflearn.com/course/%EB%94%B0%EB%9D%BC%ED%95%98%EB%A9%B0-%EB%B0%B0%EC%9A%B0%EB%8A%94-%EB%8F%84%EC%BB%A4-ci/lecture/52082?tab=curriculum&volume=1.00>    
<https://www.daleseo.com/dockerfile/>     

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

