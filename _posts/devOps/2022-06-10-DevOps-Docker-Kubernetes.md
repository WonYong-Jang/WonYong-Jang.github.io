---
layout: post
title: "[Docker] Kubernetes 시작하기"
subtitle: "Container Orchestration System, k3s, minikube"    
comments: true
categories : DevOps
date: 2022-06-10
background: '/img/posts/mac.png'
---

이번 글에서는 쿠버네티스의 기본 개념과 사용방법에 대해 살펴보자.  
도커와 컨테이너 개념은 [링크](https://wonyong-jang.github.io/devops/2021/12/31/DevOps-docker.html)를 참고하자.   

- - -    

## 1. Container Orchestration System      

`컨테이너 오케스트레이션 시스템이란 오케스트레이션이라는 단어에서 추측해 볼 수 있듯이, 수많은 
컨테이너가 있을 때 컨테이너들이 서로 조화롭게 구동될 수 있도록 지휘하는 시스템에 비유할 수 있다.`      

컨테이너 기반의 시스템에서 서비스는 컨테이너의 형태로 사용자들에게 제공된다.   
이때 관리해야 할 컨테이너의 수가 적다면 운영 담당자 한 명이서도 충분히 모든 상황에 대응할 수 있다.   
하지만, 수백 개 이상의 컨테이너가 수십대 이상의 클러스터에서 구동되고 있고 장애를 일으키지 않고 항상 정상 
동작해야 한다면 모든 서비스의 정상 동작 여부를 담당자 한 명이 파악하고 이슈에 대응하는 것은 불가능에 가깝다.   

예를 들면, 모든 서비스가 정상적으로 동작하고 있는지를 계속해서 Monitoring 해야 한다.   
만약, 특정 서비스가 장애를 일으켰다면 여러 컨테이너의 로그를 확인해가며 문제를 파악해야 한다.   
또한, 특정 클러스터나 특정 컨테이너에 작업이 몰리지 않도록 Scheduling 하고 
Load Balancing 하며 Scaling 하는 등의 수많은 작업을 담당해야 한다.   

`이렇게 수 많은 컨테이너의 상태를 지속해서 관리하고 운영하는 과정을 조금이나마 쉽게, 자동으로 
할 수 있는 기능을 제공해주는 소프트웨어가 바로 컨테이너 오케스트레이션 시스템이다.`    

그럼 머신러닝에서는 어떻게 쓰일 수 있을까?   
예를 들어서 GPU가 있어야 하는 딥러닝 학습 코드가 패키징된 컨테이너는 사용 가능한 GPU가 있는 클러스터에서 수행하고, 
    많은 메모리를 필요로 하는 데이터 전처리 코드가 패키징된 컨테이너는 메모리의 여유가 많은 클러스터에서 수행하고, 
    학습 중에 클러스터에 문제가 생기면 자동으로 같은 컨테이너를 다른 클러스터로 이동시키고 다시 학습을 
    진행하는 등의 작업을 사람이 일일이 수행하지 않고, 자동으로 관리하는 시스템을 개발한 뒤 맡길 수 있다.   


- - - 

## 2. 쿠버네티스 설치   

기본적으로 쿠버네티스를 운영환경에 설치하기 위해선 최소 3대의 
마스터 서버와 컨테이너 배포를 위한 n개의 노드 서버가 필요하다.    

<img width="900" alt="스크린샷 2024-01-15 오전 7 10 29" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/4f398640-0bde-4507-bef6-13c630a34429">   

이러한 설치는 과정이 복잡하고 배포 환경(AWS, Google Cloud, Azure 등)에 따라 
방법이 다르기 때문에 처음 실습할때는 적합하지 않다.  

이 글에서는 개발환경을 위해 마스터와 노드를 하나의 서버에 설치하여 손쉽게 
실습해보자.  

대표적인 개발 환경 구축 방법으로 minikube, k3s, docker for desktop, kind가 
있고, 이 글에서는 minikube를 사용해보자.   

### 2-1) minikube   

설치는 아래와 같이 진행한다.   

```shell
# 쿠버네티스 개발용 클러스터 설치   
brew install minikube   

# 쿠버네티스 클러스터에 명령을 전달하기 위한 CLI 도구 설치   
brew install kubectl
```

기본 명령어는 아래와 같다.   

> minikube를 실행하게 되면 cpu, memory 등 리소스를 차지하고 있기 때문에 
실습이 끝나면 반드시 종료해주자.   

minikube는 여러 가상 머신을 지원하며, macOS 같은 경우는 
기본적으로 설치가 되어 있는 hyperkit이라는 가상머신을 사용할 수 있다.     

즉, driver를 설정하고 minikube start를 하게 되면 
해당 가상 머신에 쿠버네티스 이미지를 설치하게 된다.       


```shell
# 버전확인
minikube version

# 가상머신 시작 (x86 추천)
minikube start --driver=hyperkit
# 가상머신 시작 (M1 추천 - 도커 데스크탑 설치 필요)
minikube start --driver=docker
# driver 에러가 발생한다면 virtual box를 사용
minikube start --driver=virtualbox
# 특정 k8s 버전 실행
minikube start --kubernetes-version=v1.23.1

# 정지 
minikube stop

# 상태 확인   
minikube status

# ssh 접속 ( 가상 머신 접속 )
minikube ssh   

# minikube ip 확인 ( 가상 머신 ip, 접속 테스트시 필요 )  
minikube ip

# minikube 제거 
# 가상 머신에 있는 파일들이 모두 삭제 된다.  
minikube delete   
```

> m1 mac 에서 지원하는 driver가 많지 않아 Docker Desktop 설치 후 Docker 드라이버를 사용하는 것을 권장한다.   

[Docker Desktop](https://www.docker.com/products/docker-desktop/)이 설치되어 있으면 
minikube가 기본적으로 docker driver를 사용한다.     
docker 드라이버를 사용할 경우 서비스 노출 방법은 아래와 같다.   

```shell   
# 쿠버네티스 서비스 이름이 wordpress 라면
# 위 명령어로 확인한 URL로 접속이 가능하다.

minikube service wordpress   
```


- - - 

## 3. 쿠버네티스 배포해보기     

이제 위에서 실행한 개발용 쿠버네티스 클러스터에 
WordPress 웹 어플리케이션 배포하는 실습을 해보자.   

<img width="572" alt="스크린샷 2024-01-15 오후 12 09 36" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/7504c44c-d10d-45e6-8985-ecfb7f87b9e4">    

위 그림에서 Pod, ReplicaSet 등의 용어는 이후에 설명할 예정이며, 
    우선 아래 yml 파일을 생성하고 배포를 해보자.   

```yml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: wordpress-mysql
  labels:
    app: wordpress
spec:
  selector:
    matchLabels:
      app: wordpress
      tier: mysql
  template:
    metadata:
      labels:
        app: wordpress
        tier: mysql
    spec:
      containers:
        - image: mariadb:10.7
          name: mysql
          env:
            - name: MYSQL_DATABASE
              value: wordpress
            - name: MYSQL_ROOT_PASSWORD
              value: password
          ports:
            - containerPort: 3306
              name: mysql

---
apiVersion: v1
kind: Service
metadata:
  name: wordpress-mysql
  labels:
    app: wordpress
spec:
  ports:
    - port: 3306
  selector:
    app: wordpress
    tier: mysql

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: wordpress
  labels:
    app: wordpress
spec:
  selector:
    matchLabels:
      app: wordpress
      tier: frontend
  template:
    metadata:
      labels:
        app: wordpress
        tier: frontend
    spec:
      containers:
        - image: wordpress:5.9.1-php8.1-apache
          name: wordpress
          env:
            - name: WORDPRESS_DB_HOST
              value: wordpress-mysql
            - name: WORDPRESS_DB_NAME
              value: wordpress
            - name: WORDPRESS_DB_USER
              value: root
            - name: WORDPRESS_DB_PASSWORD
              value: password
          ports:
            - containerPort: 80
              name: wordpress

---
apiVersion: v1
kind: Service
metadata:
  name: wordpress
  labels:
    app: wordpress
spec:
  type: NodePort
  ports:
    - port: 80
  selector:
    app: wordpress
    tier: frontend
```

`쿠버네티스에 배포하기 위해서는 아래와 같이 kubectl 명령어를 이용한다.`   

```shell
# -f 파일 
# 해당 파일에 적용된 내용을 쿠버네티스에 배포   
kubectl apply -f wordpress-k8s.yml   
```

`아래 명령어로 현재 default 네임스페이스에 배포되어 있는 
리소스를 확인할 수 있다.`   

```shell
kubectl get all
```

이제 minikube ip 를 통해 얻은 가상 머신 ip와 위 명령어를 통해 
확인한 port를 조합하여 접속해보면 정상적으로 배포된 
웹 어플리케이션에 접속이 가능하다.  

- - - 

## 4. 쿠버네티스와 도커 서비스 차이   

위에서 쿠버네티스에 간단한 웹 어플리케이션을 배포해 봤다.  
그럼 동일하게 yml 파일을 이용하여 도커 컴포즈로 실행한 웹 어플리케이션과 
어떠한 차이가 있을까?   

`도커로 서비스를 구성했을 경우 컨테이너 또는 서버 전체가 죽는다면 
직접 다시 실행해주기 전까지는 서비스는 중단된다.`     
`하지만, 쿠버네티스의 경우는 이를 자동으로 새로 실행시켜준다.`   

`또한, 현재는 컨테이너 개수가 1개이기 때문에 중단된 이후 
바로 다시 실행시켜주기는 하지만 다운타임이 존재한다.`     
`따라서 아래와 같이 replicas 개수를 추가해줌으로써 컨테이너 갯수를 늘려 
다운타임을 없앨 수도 있다.`      

```shell
apiVersion: apps/v1
kind: Deployment
metadata:
  name: wordpress
  labels:
    app: wordpress
spec:
  replicas: 2  # 추가 
```

이처럼 설정만 추가해줌으로써 컨테이너끼리 로드밸런싱을 구성해주며 
부하가 증가했을 때 자동으로 scale out을 진행해 주는 등 
간편하게 제공해준다.   

- - - 

**Reference**    

<https://mlops-for-all.github.io/docs/introduction/why_kubernetes>   
<https://subicura.com/k8s/prepare/kubernetes-setup.html#%E1%84%80%E1%85%A2%E1%84%87%E1%85%A1%E1%86%AF-vs-%E1%84%8B%E1%85%AE%E1%86%AB%E1%84%8B%E1%85%A7%E1%86%BC>   
<https://subicura.com/k8s/guide/#%E1%84%8B%E1%85%AF%E1%84%83%E1%85%B3%E1%84%91%E1%85%B3%E1%84%85%E1%85%A6%E1%84%89%E1%85%B3-%E1%84%87%E1%85%A2%E1%84%91%E1%85%A9>   


{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

