---
layout: post
title: "[Docker] Kubernetes 구성과 기본 개념 2"
subtitle: "Service(ClusterIP, NodePort, LoadBalancer), Ingress, Volume, ConfigMap, Secret"      
comments: true
categories : DevOps
date: 2022-06-13
background: '/img/posts/mac.png'
---

[이전글](https://wonyong-jang.github.io/devops/2022/06/12/DevOps-Docker-Kubernetes-Concept.html)에서 살펴봤던 
Pod, ReplicaSet, Deployment에 이어서 Service, Ingress, Volume, ConfigMap, Secret 등을 살펴보자.   

- - -

## 1. Service   

`Pod는 자체 IP를 가지고 다른 Pod와 통신할 수 있지만, 쉽게 사라지고 생성되는 
특징 때문에 직접 통신하는 방법은 권장하지 않는다.`   
`쿠버네티스는 Pod와 직접 통신하는 방법 대신, 별도의 고정된 IP를 가진 
서비스를 만들고 그 서비스를 통해 Pod에 접근하는 방식을 사용한다.`   

<img width="374" alt="스크린샷 2024-01-21 오후 6 32 25" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/ef111938-069d-4768-8b27-e15fe8105148">    

도커를 사용할 때는 -p 옵션을 통해 port를 오픈할 수 있었지만, 쿠버네티스는 
    노출 범위에 따라 ClusterIP, NodePort, LoadBalancer 타입으로 
나누어져 있다.  

> 서비스 종류 중에 ExternalName도 있지만 여기서는 다루지 않는다.      

### 1-1) Service(ClusterIP)    

ClusterIP는 클러스터 내부에 새로운 IP를 할당하고 여러 개의 Pod를 바라보는 
로드밸랜서 기능을 제공한다.     
그리고 서비스 이름을 내부 도메인 서버에 등록하여 Pod 간에 서비스 이름으로 통신할 수 
있다.     

> 외부와 통신할 필요 없이 클러스터 내부에서 파드끼리 통신할 때 사용한다.   

이전 실습에서 생성했던, counter 앱 중에 redis를 서비스로 노출해보자.   

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: redis
spec:
  selector:
    matchLabels:
      app: counter
      tier: db
  template:
    metadata:
      labels:
        app: counter
        tier: db
    spec:
      containers:
        - name: redis
          image: redis              # redis image
          ports:
            - containerPort: 6379
              protocol: TCP

---
apiVersion: v1
kind: Service        # Service 
metadata:
  name: redis        #
spec:
  # type을 별도로 지정을 안하면 ClusterIP로 지정 
  ports:
    - port: 6379     # 서비스가 생성할 port 오픈 
      protocol: TCP
#    - targetPort    # 서비스가 접근할 Pod의 port (생성 port와 동일한 경우 생략 가능)   
                     # 즉, Service 객체로 전달된 요청을 Pod로 전달할 때 사용하는 포트 
  selector:           # 서비스가 접근할 Pod의 label 조건  
    app: counter
    tier: db
```

위 예시를 그림으로 보면 아래와 같다.   

<img width="263" alt="스크린샷 2024-01-22 오전 7 00 56" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/f704254f-7914-4dbe-97c1-b5fd900e2c36">   

`같은 클러스터에서 생성된 Pod라면 redis라는 도메인 이름으로 redis Pod에 
접근할 수 있다.`        

> 내부 DNS 서버에 도메인 이름이 등록되기 때문에 접근 가능해진다.   
> redis.default.svc.cluster.local 로도 접근이 가능하며, 서로 다른 
namespace와 cluster를 구분할 수 있다. 

이제 redis에 접근할 counter 앱을 Deployment로 만들어보자.   

```yml
apiVersion: apps/v1
kind: Deployment      
metadata:
  name: counter
spec:
  selector:
    matchLabels:
      app: counter
      tier: app
  template:
    metadata:
      labels:
        app: counter
        tier: app
    spec:
      containers:
        - name: counter
          image: ghcr.io/subicura/counter:latest
          env:
            - name: REDIS_HOST
              value: "redis"      # redis 라는 이름의 service(ClusterIP) 를 위에서 생성하였고 접근을 위해 이를 명시   
            - name: REDIS_PORT
              value: "6379"       # 
```

위 코드는 counter 앱을 deployment로 생성하였고, redis 파드 접근을 위해 
clusterIP 서비스를 생성해두었기 때문에, 해당 도메인 이름을 작성하여 
접근할 수 있도록 했다.   

### 1-2) Service(NodePort)   

`ClusterIP는 클러스터 내부에서만 접근할 수 있다.`    
`클러스터 외부(노드)에서 접근할 수 있도록 NodePort 서비스를 만들어보자.`    

아래 코드에서 NodePort, Port, TargetPort 등이 보이는데, 이에 대한 구분은 아래 그림과 같다.   

<img width="514" alt="스크린샷 2024-01-23 오후 11 43 27" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/a0ad9a32-edc7-424f-bb05-8ad4e5562a02">   



```yml
apiVersion: v1
kind: Service             # Service
metadata:
  name: counter-np
spec:
  type: NodePort          # type이 없으면 기본적으로 ClusterIP이며, 이를 Node Port로 명시   
  ports:
    - port: 3000          # Cluster 내부에서 사용할 Service 객체의 포트 
    # targetPort : Service 객체로 전달된 요청을 Pod로 전달할 때 사용하는 포트( port 와 동일한 경우 생략 가능)   
      protocol: TCP
      nodePort: 31000     # 실제 노드에 오픈되는 port는 31000(미 지정시 30000~32768 중에 자동 할당)
  selector:
    app: counter
    tier: app
```   


```shell
kubectl apply -f counter-nodeport.yml

# 서비스 상태 확인
kubectl get svc
```

Output

```
NAME         TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)          AGE
counter-np   NodePort    10.101.168.165   <none>        3000:31000/TCP   13s
kubernetes   ClusterIP   10.96.0.1        <none>        443/TCP          3d19h
redis        ClusterIP   10.103.50.102    <none>        6379/TCP         30m
```

이제 minikube ip로 클러스터의 노드 ip를 구하고 31000 port로 브라우저 접근해보면 
정상적으로 접근 가능함을 확인할 수 있다.     

이를 그림으로 이해해보자.   

<img width="350" alt="스크린샷 2024-01-22 오전 8 01 26" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/d0c53231-784d-481e-8532-8677e6f0e359">   

`NodePort는 클러스터의 모든 노드에 포트를 오픈한다. 지금은 테스트라서 하나의 노드밖에
없지만 여러 개의 노드가 있다면 아래 그림과 같이 
아무 노드로 접근해도 지정한 Pod로 접근할 수 있다.`

<img width="585" alt="스크린샷 2024-01-22 오전 8 01 32" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/0afaa749-7ddb-4bc8-8a14-bb1d075f3917">   


### 1-3) Service(LoadBalancer)   

`NodePort의 단점은 노드가 사라졌을 때 자동으로 다른 노드를 통해 접근이 불가능하다는 점이다.`   
예를 들어, 3개의 노드가 있다면 3개 중에 아무 노드로 접근해도 NodePort로 연결 할 수 있지만 
어떤 노드가 살아 있는지는 알 수가 없다.   

<img width="485" alt="스크린샷 2024-01-22 오전 8 16 36" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/13467faf-1c22-403f-a79c-1b926d73d56b">   

`자동으로 살아 있는 노드에 접근하기 위해 모든 노드를 바라보는 Load Balancer가 필요하다.`   
`브라우저는 NodePort에 직접 요청을 보내는 것이 아니라 Load Balancer에 요청하고 
Load Balancer가 알아서 살아 있는 노드에 접근하면 NodePort의 단점을 없앨 수 있다.`   

그럼 Load Balancer를 생성해보자.   

```yml
apiVersion: v1
kind: Service
metadata:
  name: counter-lb
spec:
  type: LoadBalancer       #
  ports:
    - port: 30000          # 30000 port로 오픈   
      targetPort: 3000
      protocol: TCP
  selector:
    app: counter
    tier: app
```

위의 코드를 실행해 보면, 아래와 같이 EXTERNAL-IP가 pending 인 것을 확인할 수 있다.  
사실 Load Balancer는 AWS, Google Cloud, Azure 같은 클라우드 환경이 아니면 사용이 제한적이다.   

```
NAME         TYPE           CLUSTER-IP       EXTERNAL-IP   PORT(S)           AGE
counter-lb   LoadBalancer   10.109.133.129   <pending>     30000:31535/TCP   9s
```

이를 테스트 하기 위해 minikube에서 가상 LoadBalancer를 만들 수 있게 제공해준다.   

##### minikube에 가상 LoadBalancer 만들기   

Load Balancer를 사용할 수 없는 환경에서 가상 환경을 만들어 주는 것이 MetalLB 라는 것이 있다.   
minikube에서는 현재 떠 있는 노드를 Load Balancer로 설정한다.  

```shell  
minikube addons enable metallb
```

그리고 minikube ip 명령어로 확인한 ip를 ConfigMap으로 지정해야 한다.   

```
minikube addons configure metallb

-- Enter Load Balancer Start IP: # minikube ip 결과값 입력
-- Enter Load Balancer End IP: # minikube ip 결과값 입력
    ▪ Using image metallb/speaker:v0.9.6
    ▪ Using image metallb/controller:v0.9.6
```

Output

```
NAME         TYPE           CLUSTER-IP       EXTERNAL-IP   PORT(S)           AGE
counter-lb   LoadBalancer   10.109.133.129   192.168.64.4  30000:31535/TCP   1m
```

이제 192.168.64.4:30000 으로 접근해보면 정상적으로 접속이 되는 것을 
확인할 수 있다.   

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

