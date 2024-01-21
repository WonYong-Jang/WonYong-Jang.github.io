---
layout: post
title: "[Docker] Kubernetes 구성과 기본 개념"
subtitle: "Pod, ReplicaSet, Deployment, Service, Ingress, Volume, ConfigMap, Secret"    
comments: true
categories : DevOps
date: 2022-06-12
background: '/img/posts/mac.png'
---

[이전글](https://wonyong-jang.github.io/devops/2022/06/10/DevOps-Docker-Kubernetes.html)에서 쿠버네티스 실습 환경을 
구성해보고 기본 명령어를 살펴봤다.  

이번 글에서는 쿠버네티스를 구성하고 있는 Pod, RepliaSet, Deployment, Service, Ingress, Volume, ConfigMap, Secret 등을 
자세히 살펴보자.    

- - -

## 1. Pod

`Pod는 쿠버네티스에서 관리하는 가장 작은 배포 단위이다.`

`쿠버네티스와 도커의 차이점은 도커는 컨테이너를 만들지만, 쿠버네티스는
컨테이너 대신 Pod를 만든다.`
`Pod는 한개 또는 여러 개의 컨테이너를 포함한다.`

이제 정의한 yaml 파일로 pod를 생성해보자.

```yml
apiVersion: v1 # 오브젝트 버전
kind: Pod      # 종류 (Pod, ReplicaSet, Deployment, Service ...)
metadata:      # 리소스의 정보를 나타냄
    name: echo
    labels:
        app: echo
spec:          # 리소스 종류에 따라서 달라진다.
    containers:
    - name: app
      image: ghcr.io/subicura/echo:v1
```

```shell
# pod 배포
kubectl apply -f echo-pod.yml

# pod 확인
kubectl get po
```

### 1-1) 컨테이너 상태 모니터링   

`컨테이너 생성과 실제 서비스 준비는 약간의 차이가 있다. 서버를 실행하면 바로 접속할 수 없고 
짧게는 수초 길게는 몇분의 초기화 시간이 필요한데 실제로 접속이 가능할 때 서비스가 준비되었다고 말할 수 있다.`   

> 컨테이너는 생성이 되었는데 그 안에 자바 프로그램이 아직 실행이 안되었을 때 사용자가 접속을 한다면 에러가 발생할 것이다.    

`쿠버네티스는 컨테이너가 생성되고 서비스가 준비되었다는 것을 체크하는 옵션을 제공하여 초기화하는 동안 
서비스되는 것을 막을 수 있다.`  


##### livenessProbe   

`컨테이너가 정상적으로 동작하는지 체크하고 정상적으로 동작하지 않는다면 컨테이너를 재시작하여 문제를 해결한다.`   

정상이라는 것은 여러 가지 방식으로 체크할 수 있는데 여기서는 http get 요청을 보내 확인하는 방법을 사용한다.   

아래 yaml 파일의 예시를 살펴보자.    

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: echo-lp
  labels:
    app: echo
spec:
  containers:
    - name: app
      image: ghcr.io/subicura/echo:v1
      livenessProbe:               # livenessProbe 옵션 추가 
        httpGet:                   # http get 으로 해당 path와 port로 요청하여 확인   
          path: /not/exist
          port: 8080
        initialDelaySeconds: 5             # 처음 5초 이후 확인 
        timeoutSeconds: 2 # Default 1      # timeout 은 최대 2초  
        periodSeconds: 5 # Defaults 10     # 5초마다 체크 
        failureThreshold: 1 # Defaults 3   # 1이라도 실패하면 컨테이너 재시작   
```

##### readinessProbe   

`컨테이너가 준비되었는지 체크하고 정상적으로 준비되지 않았다면 Pod로 들어오는 요청을 제외한다.`   

`livenessProbe와 차이점은 문제가 있어도 Pod를 재시작하지 않고 요청만 제외한다는 점이다.`   

아래 yaml 파일의 예시를 살펴보자.   


```yaml
apiVersion: v1
kind: Pod
metadata:
  name: echo-rp
  labels:
    app: echo
spec:
  containers:
    - name: app
      image: ghcr.io/subicura/echo:v1
      readinessProbe:              # 옵션 추가 
        httpGet:
          path: /not/exist
          port: 8080
        initialDelaySeconds: 5
        timeoutSeconds: 2 # Default 1
        periodSeconds: 5 # Defaults 10
        failureThreshold: 1 # Defaults 3
```   

##### livenessProbe + readinessProbe  

`보통 livenessProbe와 readinessProbe를 같이 적용하며, 상세한 설정은 어플리케이션 환경에 따라 
적절하게 조정한다.`   

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: echo-health
  labels:
    app: echo
spec:
  containers:
    - name: app
      image: ghcr.io/subicura/echo:v1
      livenessProbe:
        httpGet:
          path: /
          port: 3000
      readinessProbe:
        httpGet:
          path: /
          port: 3000
```

### 1-2) 하나의 pod에 다중 컨테이너   

`하나의 pod에 속한 컨테이너는 서로 네트워크를 localhost로 공유하고 
동일한 디렉토리를 공유할 수 있다.`   

아래 yaml은 다중 컨테이너의 예이다.  

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: counter
  labels:
    app: counter
spec:
  containers:
    - name: app
      image: ghcr.io/subicura/counter:latest
      env:
        - name: REDIS_HOST
          value: "localhost"
    - name: db
      image: redis
```

- - - 

**Reference**    

<https://subicura.com/k8s/guide/pod.html#%E1%84%88%E1%85%A1%E1%84%85%E1%85%B3%E1%84%80%E1%85%A6-pod-%E1%84%86%E1%85%A1%E1%86%AB%E1%84%83%E1%85%B3%E1%86%AF%E1%84%80%E1%85%B5>   
<https://subicura.com/k8s/prepare/kubernetes-setup.html#%E1%84%80%E1%85%A2%E1%84%87%E1%85%A1%E1%86%AF-vs-%E1%84%8B%E1%85%AE%E1%86%AB%E1%84%8B%E1%85%A7%E1%86%BC>   
<https://subicura.com/k8s/guide/#%E1%84%8B%E1%85%AF%E1%84%83%E1%85%B3%E1%84%91%E1%85%B3%E1%84%85%E1%85%A6%E1%84%89%E1%85%B3-%E1%84%87%E1%85%A2%E1%84%91%E1%85%A9>   


{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

