---
layout: post
title: "[Docker] 도커 컴포즈 및 환경 변수 "
subtitle: "Docker Compose 가이드 / env 파일 / Docker Compose에서 환경 변수를 다루는 4가지 방법"    
comments: true
categories : DevOps
date: 2022-01-01
background: '/img/posts/mac.png'
---

## 1. 도커 컴포즈란?   

`docker compose란 여러개의 컨테이너로부터 이루어진 서비스를 구축, 실행하는
순서를 자동으로 관리하여 관리를 간단히 하는 기능이다.`    

`멀티 컨테이너 상황에서 쉽게 네트워크를 연결 시켜주기 위해서
docker compose를 이용하면 된다.`

`즉, docker compose에서는 compose 파일을 준비하여 커맨드를 1회 실행하는
것으로, 그 파일로부터 설정을 읽어들여 모든 컨테이너 서비스를
실행시키는 것이 가능하다.`

참고로, Dockerfile을 compose로 변환해주는 사이트가 있으니 참고하면
도움이 될 것이다.    
[https://www.composerize.com/](https://www.composerize.com/) 사이트는
완벽하게 변환해주지는 않지만 처음 docker compose를 구성할 때 도움이 될 것이다.      


- - - 

## 2. 환경 변수 삽입 및 관리 방법    

Docker Compose에서 환경변수를 다루는 방법은 크게 네 가지로 구분된다.      
여기서는 Mysql 도커 이미지를 예시로 살펴보자.   

1. Compose 파일에 직접 입력하기   
2. 쉘 환경변수로 등록하기   
3. 환경변수 파일로 구성하기   
4. Dockerfile에 환경변수를 직접 삽입하기   

### 2-1) Compose 파일에 직접 입력하기   

Docker Compose에서 환경변수를 주입하는 가장 직관적인 방법은 
Compose 파일에 직접 입력하는 것이다.   
Mysql 이미지로 컨테이너를 구동시킬 때 Mysql의 관리자(root) 계정 비밀번호를 
설정할 password 변수값이 반드시 필요한데, 아래와 같이 넣어주면 된다.   

```
version: '3.9'
services:
  mysql:
    image: mysql:8
    environment:
      MYSQL_ROOT_PASSWORD: password
```

### 2-2) 쉘 환경변수로 등록하기   

쉘 환경에서 변수를 선언한 뒤 이를 Compose 파일에 반영되도록 하는 방법도 있다.   

```
$ export MYSQL_ROOT_PASSWORD=password
```

`그 후 compose 파일은 아래와 같이 외부로 부터 환경변수를 주입할 수 있다.`   

```
version: '3.9'
services:
  mysql:
    image: mysql:8
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD} // 또는 $MYSQL_ROOT_PASSWORD 
```

이 상태에서 compose 파일을 convert 시켜보면, 아래와 같이 쉘에서 등록한 변수값이 
변수명에 대응하여 삽인된 것을 볼 수 있다.   

```
$ docker compose convert
# ...
# environment:
#   MYSQL_ROOT_PASSWORD: password
```

### 2-3) 환경변수 파일로 구성하기   

배포용 Compose 파일에 환경변수를 하나하나 다 작성하거나, 매번 쉘에서 
변수로 직접 선언시키는 방법은 다소 비효율적이다.   
`필요한 환경변수 항목들만 골라내어 별도의 파일로 구성해 둔다면 환경변수 관리를 
보다 효율적으로 할 수 있을 것이다.`   

여기서는 실제 활용 시나리오에 따라 아래의 세 가지 방법으로 나누어 소개한다.   

1. 하나의 .env 파일로 구성하기   
2. 여러 개의 파일로 구성하기   
3. 각 서비스마다 다른 환경변수 파일 반영하기   


##### 2-3-1) 하나의 .env 파일로 구성하기  

`Docker Compose에서 환경 변수 정보들을 분리하여 별도의 파일로 구성할 때 가장 
간편한 방법은 Compose 파일이 위치한 동일 경로에 .env 파일을 따로 구성하는 
것이다.`    
.env 파일은 평문 텍스트 포맷으로, 아래의 문법을 따라 작성한다.   

- 각 줄마다 변수명=값 의 형태로 입력한다.   
- 주석처리는 # 문자를 이용한다.   
- 비어있는 줄은 무시된다.   
- 따옴표 처리('', "")는 불필요하다. 입력된 따옴표는 위치에 따라 변수명 이나 값의 일부분으로 간주된다.   

`이렇게 작성된 .env 파일은 별다른 설정 없이도 Compose 파일에 바로 반영된다.`   
아래를 살펴보자.   

```
version: '3.9'
services:
  mysql:
    image: mysql:8
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
```

```
// .env 파일 
MYSQL_ROOT_PASSWORD=password
```

위처럼 작성하고, 아래 커맨드로 정상 주입된 것을 확인 가능하다.  

```
$ docker compose convert 
$ docker-compose config 

# ...
# environment:
#   MYSQL_ROOT_PASSWORD: password
```   

`이처럼 .env 파일을 이용하는 방식은 간편하기는 하지만, 
    오직 Docker 파일 또는 docker compose에서 docker-compose up 명령을 수행할 때에만 
    활용 가능하다는 점에 유의하자.`   


##### 2-3-2) 여러개의 파일로 구성하기   

경우에 따라 여러 개의 환경변수 파일로 나누는 일이 필요할 수 있다.   
이를 테면 개발환경(dev)과 운영환경(prod)에 따라 주입해야 할 값들이 
다른 경우를 가정해 볼 수 있다.   

`이런 경우엔 각각의 환경에 맞는 별도의 env file을 구성한 뒤, 
    배포할 때 --env-file 옵션값으로 불러올 파일을 직접 지정할 수 있다.`   

아래와 같이 커맨드를 주면, .env.dev 파일을 불러와서 환경변수에 
주입되는 것을 확인할 수 있다.   

```
//  ./config/.env.dev 파일 
MYSQL_ROOT_PASSWORD=passwd_dev
```

```
$ docker compose --env-file ./config/.env.dev config
# ...
# environment:
#   MYSQL_ROOT_PASSWORD: passwd_dev
```

##### 2-3-3) 각 서비스마다 다른 환경변수 파일 반영하기  

때로는 각 `서비스(컨테이너)에 대한 환경변수 파일을 별도로 관리해야 할 수도 있다.`   
이런 경우에는 `Compose 파일에 명시된 각 서비스 안에 env file 항목을 
함께 포함시켜줄 수 있다.`

> 명시하지 않았다면, 기본적으로 env_file: .env이 적용된 상태라고 보아도 무방하다.   

```
version: '3.9'
services:
  mysql:
    env_file: # 파일이 여러 개라면 리스트 형태로 삽입한다.
      - a.env
      - b.env
    image: mysql:8
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
```

이때 유의해야 할 사항이 있다. 위와 같이 여러 개의 환경 변수 파일을 
삽입했는데, 만약 두 파일에 똑같은 변수명으로 서로 다른 값들이 
들어있다면 어떻게 될까?   

`이 경우엔 삽입된 순서를 기준으로 나중에 삽입된 파일의 변수 값이 적용된다.`   

위의 YAML 내용을 기준으로 볼 때, 만약 a.env에선 VAR=alpha이고, b.env에선 VAR=beta라면, 
    해당 서비스가 배포될 때엔 나중에 삽입된 b.env의 내용으로 적용된다.   
    이처럼 여러 환경변수 파일을 서비스에 반영할 때엔 환경변수의 중복 여부, 
    파일 삽입 순서 등에 주의하는 것이 좋다.   


### 2-4) Dockerfile에 환경변수를 직접 삽입하기   

만약 환경변수를 YAML이나 별도의 외부 파일로 담아 두는 것이 꺼려진다면, 
`Dockerfile에 ARG 또는 ENV를 이용하여 환경변수를 직접 삽입한 뒤 이미지를 
빌드하여 사용하는 방법도 있다.`    

```
// Dockerfile   
FROM mysql:8
ENV MYSQL_ROOT_PASSWORD password
```   

- - - 

## 3. 환경변수 값이 선택되는 우선순위   

Docker Compose에서 환경 변수가 주어진 방식에 따라 값이 선택되는 
우선순위를 살펴보자.   
우선순위는 아래와 같다.   

1. Compose 파일에 직접 입력한 값   
2. 쉘 환경변수로 등록한 값   
3. 환경변수 파일로 입력된 값(.env 등)   
4. Dockerfile을 통해 삽입된 값    

아래 예시를 통해 환경변수 설정이 중복이 되었을 때 
우선순위를 확인해보자.   

우선 Dockerfile에서 아래와 같이 작성했다.   

```
FROM mysql:8
ENV MYSQL_ROOT_PASSWORD passwd_from_dockerfile
```

그리고 쉘 환경에서 아래와 같이 환경변수를 직접 입력한다.   

```
$ export MYSQL_ROOT_PASSWORD=passwd_from_shell
```

다음으로 .env 파일을 만들어 환경변수를 작성했다.   

```
MYSQL_ROOT_PASSWORD=passwd_from_envfile
```

마지막으로 배포용 YAML은 아래와 같이 작성했다.   

```
version: '3.9'
services:
  mysql:
image: mysql:8
    environment:
      MYSQL_ROOT_PASSWORD: passwd_from_yaml
```

위처럼 각 환경변수를 중복으로 
작성했을 때 위에서 언급한 우선순위가 높을 수록 먼저 적용된다.   


- - -     

## 4. 보안 정보를 다룰 때의 한계점   

지금까지 살펴본 Docker Compose에서의 환경변수 관리 방법에는 공통적인 
단점이 하나 있따.   
`모든 정보가 평문(plain text)으로 저장된다는 것이다.`        
이번 글에서는 환경변수의 예시로 MySQL 이미지의 root 패스워드를 다루었지만, 
사실 이처럼 중요한 보안 정보가 평문 상태로 호스트에 남아 있도록 하는 것은 
보안 측면에서 결코 바람직하지 않다.   

아쉽게도 Docker 자체만으로 환경변수에 쓰인 보안 정보를 보호할 방법이 
마땅치 않아 보인다. 물론 실제 운영환경에서는 이를 
보완하기 위한 다양한 방법들이 마련되어 있을 것이다.   

`이를 테면 외부에 노출되지 않는 프라이빗 레지스트리를 구축한 뒤 
보안 정보가 포함된 전용 이미지를 빌드하면서 운영하는 방법을 고려할 수 있다.`   
다만 이 경우 해당 보안 정보가 이미지의 특정 레이어에 계속 남게 되므로 
이미지와 레지스트리 관리에 신중해야 할 것이다.   

또한, `쿠버네티스(Kubernetes), 도커 스웜(Docker Swarm)등 컨테이너 오케스트레이션 
도구에서는 이러한 보안 정보를 조금 더 안전히 다룰 수 있는 시크릿(Secret)을 
제공한다.`   
AWS, Azure등 주요 클라우드 서비스 제공자들이 지원하는 컨테이너 인스턴스들 
역시 환경변수를 설정할 때 이러한 시크릿(Secret) 기능을 간편히 이용할 수 있도록 
배려하고 있다.   

만약 이보다 더욱 강화된 형태의 보안이 필요하다면 [하시코프 볼트(HashiCorp Vault)](https://www.vaultproject.io/)등의 
솔루션을 고려하는 것도 좋은 방인이 될 것이다.   






- - - 

**Reference**    

<https://docs.docker.com/compose/startup-order/>     
<https://seongjin.me/environment-variables-in-docker-compose/>    

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

