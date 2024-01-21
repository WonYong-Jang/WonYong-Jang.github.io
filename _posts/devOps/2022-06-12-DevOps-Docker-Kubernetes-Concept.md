---
layout: post
title: "[Docker] Kubernetes 구성과 기본 개념"
subtitle: "Pod, ReplicaSet, Deployment(rollback, rollingUpdate) / livenessProbe, readinessProbe "    
comments: true
categories : DevOps
date: 2022-06-12
background: '/img/posts/mac.png'
---

[이전글](https://wonyong-jang.github.io/devops/2022/06/10/DevOps-Docker-Kubernetes.html)에서 쿠버네티스 실습 환경을 
구성해보고 기본 명령어를 살펴봤다.  

이번 글에서는 쿠버네티스를 구성하고 있는 Pod, ReplicaSet, Deployment 등을 
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

## 2. ReplicaSet

`Pod를 단독으로 만들면 Pod에 어떤 문제(서버가 죽어서 Pod가 사라졌다던가)가 
생겼을 때 자동으로 복구되지 않는다.`   
`이러한 Pod를 정해진 수 만큼 복제하고 관리하는 것이 ReplicaSet이다.`   

아래 코드를 실행해서 이해해 보자.   

```yml
apiVersion: apps/v1
kind: ReplicaSet  # ReplicaSet   
metadata:
  name: echo-rs
spec:
  replicas: 1      # Pod 개수 
  selector:
    matchLabels:   # 해당 조건의 pod가 있는지 확인하고  
      app: echo
      tier: app
  template:        # 없다면, 아래 형태로 pod를 생성한다.
    metadata:
      labels:
        app: echo
        tier: app
    spec:
      containers:
        - name: echo
          image: ghcr.io/subicura/echo:v1
```   

실행 후 생성된 Pod의 label을 확인해보자.   

```shell
$ kubectl get po,rs --show-labels

NAME                READY   STATUS    RESTARTS   AGE     LABELS
pod/echo-rs-qwrnv   1/1     Running   0          3m34s   app=echo,tier=app

NAME                      DESIRED   CURRENT   READY   AGE     LABELS
replicaset.apps/echo-rs   1         1         1       3m34s   <none>
```

그럼 app=echo,tier=app label을 제거하면 어떻게 될까?   

```shell
# app- 를 지정하면 app label을 제거한다.   
kubectl label pod/echo-rs-qwrnv app-

# pod 라벨 확인   
kubectl get pod --show-labels   
```

결과를 확인해보면, app=echo,tier=app 라벨의 pod를 새로 생성한다.   

```shell
# 반대로 pod를 해당 라벨로 지정하게 되면 replica 1 개수를 맞추기 위해
# 한개의 pod를 제거하여 1개로 맞춘다.
kubectl label pod/echo-rs-qwrnv app=echo   
```

`즉, ReplicaSet은 label을 체크해서 원하는 수의 Pod가 없으면 
새로운 Pod를 생성한다.`   

> 아래 그림처럼 ReplicaSet이 Pod를 관리하는 모습을 볼 수 있다.   

<img width="264" alt="스크린샷 2024-01-21 오후 4 03 19" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/1a756ec7-6c06-428b-a551-886627742c09">   

`정리해보면, ReplicaSet은 원하는 개수의 Pod를 유지하는 역할을 담당한다.`   
`label을 이용하여 Pod를 체크하기 때문에 label이 겹치지 않게 신경써서 정의해야한다.`   

> 실무에서 ReplicaSet을 단독으로 쓰는 경우는 거의 없다. 다음에서 살펴볼 Deployment가 
ReplicaSet을 이용하고 주로 Deployment를 사용한다.   

- - - 

## 3. Deployment   

`Deployment는 쿠버네티스에서 가장 널리 사용되는 오브젝트이며, ReplicaSet을 
이용하여 Pod를 업데이트하고 이력을 관리하여 Rollback하거나 특정 버전으로 
돌아갈 수 있다.`    

예제로 이해해보자.   

```yml
apiVersion: apps/v1
kind: Deployment       # Deployment   
metadata:
  name: echo-deploy
spec:
  replicas: 4
  selector:
    matchLabels:
      app: echo
      tier: app
  template:
    metadata:
      labels:
        app: echo
        tier: app
    spec:
      containers:
        - name: echo
          image: ghcr.io/subicura/echo:v1
```

위 yaml 파일을 배포 후 아래와 같이 이미지 버전이 변경 되었을 때 
Deployment 오브젝트가 어떠한 방식으로 배포를 하는지 확인해보자.   

```yml
image: ghcr.io/subicura/echo:v2
```

`이를 그림으로 이해해보면, Deployment는 새로운 이미지로 
업데이트하기 위해 ReplicaSet을 이용한다.`   
`버전을 업데이트하면 새로운 ReplicaSet을 생성하고 해당 ReplicaSet이 
새로운 버전의 Pod를 생성한다.`   

<img width="625" alt="스크린샷 2024-01-21 오후 5 34 39" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/f9919d38-c323-41b3-9de2-2806a7047b31">

`새로운 ReplicaSet을 0 -> 1개로 조정하고 정상적으로 Pod가 동작하면 
기존 ReplicaSet을 4 -> 3개로 조정한다.`   

<img width="616" alt="스크린샷 2024-01-21 오후 5 40 35" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/47cac1fb-d313-4eed-a708-1079b58d6aad">    

새로운 ReplicaSet을 1 -> 2개로 조정하고 정상적으로 Pod가 동작하면 
기존 ReplicaSet을 3 -> 2개로 조정한다.  

이 과정을 반복하면 최종적으로 아래 그림과 같이 배포가 완료 된다.   

<img width="622" alt="스크린샷 2024-01-21 오후 5 38 06" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/ac63341e-1789-49a7-9229-23e9eca08e58">   

생성한 Deployment의 상세 상태를 보면 더 자세히 배포 과정을 확인할 수 있다.     

```shell
kubectl describe deploy/echo-deploy
```

### 3-1) 버전관리   

`Deployment는 변경된 상태를 기록하기 때문에, 배포 히스토리를 확인할 수 있고 
현재 버전에 문제가 있을 때 이전 버전 또는 특정 버전으로 롤백을 할 수 있다.`   

```shell
# 히스토리 확인
kubectl rollout history deploy/echo-deploy

# revision 2 히스토리 상세 확인 
kubectl rollout history deploy/echo-deploy --revision=1

# 바로 전으로 롤백
kubectl rollout undo deploy/echo-deploy

# 특정 버전으로 롤백 
kubectl rollout undo deploy/echo-deploy --to-revision=2
```

### 3-2) 배포 전략 설정   

Deployment 는 다양한 방식의 배포 전략이 있다. 여기선 `RollingUpdate 방식`을 
사용할 때 동시에 업데이트하는 Pod 개수를 변경해보자.   

아래 예시에서 strategy 부분을 집중해서 살펴보자.   

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: echo-deploy-st
spec:
  replicas: 4
  selector:
    matchLabels:
      app: echo
      tier: app
  minReadySeconds: 5
  strategy:
    type: RollingUpdate    # 전략 선택  
    rollingUpdate:        
      maxSurge: 3          # 기본값은 25%, 한번에 업데이트할 개수 
      maxUnavailable: 3    # 기본값은 25%, 한번에 비활성화할 개수
  template:
    metadata:
      labels:
        app: echo
        tier: app
    spec:
      containers:
        - name: echo
          image: ghcr.io/subicura/echo:v1
          livenessProbe:
            httpGet:
              path: /
              port: 3000
```

위 코드로 실행하게 되면 Pod를 3개씩 RollingUpdate를 진행하게 된다.   

> default로 25% 로 설정되어 있고, 4개의 Pod를 사용한다면 1개씩 update가 이루어진다.   
> Deployment는 가장 흔하게 사용하는 배포 방식이다. 이외에 StatefulSet, DaemonSet, CronJob, Job 등이 
있지만 사용법은 크게 다르지 않다.   

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

