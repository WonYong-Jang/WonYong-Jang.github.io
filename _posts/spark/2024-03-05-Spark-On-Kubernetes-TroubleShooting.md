---
layout: post
title: "[Spark] On Kubernetes 로 전환 과정에서 TroubleShooting"   
subtitle: "Airflow의 KubernetesPodOperator 를 이용한 Spark Submit / spark.kubernetes.submission.waitAppCompletion 사용시 Worker Pod 미 종료 이슈"       
comments: true   
categories : Spark   
date: 2024-03-05   
background: '/img/posts/mac.png'   
---

이번글에서는 Spark on Yarn 에서 Spark on K8s로 전환 과정에서 발생한 이슈를 정리해 보려고 한다.    

- - -   
   
## 1. 현재 구조   

현재 Spark 를 Kubernetes 에서 실행시키기 위한 구조는 Airflow 를 통해 트리거가 되며, Spark Submit 하기 위해 KubernetesPodOperator를 이용하여 실행하고 있다.  

- Deploy Mode: Cluster
- Spark Version: 3.4.4 (Pyspark)   
- Airflow Version: 3.1.8

전반적인 실행 흐름은 아래와 같다.   

```
[Airflow Scheduler]
    └─ KubernetesPodOperator 트리거
           │
           ▼
    [Worker Pod]  ← KubernetesPodOperator가 생성하는 Pod
    └─ spark-submit 실행
           │
           ▼
    [Spark Driver Pod] → [Spark Executor Pods]
           │
    Job 완료 → Driver: Completed
           │
           ▼
    Worker Pod 종료 → Airflow Task: Success
```

KPO Pod 내의 Python에서 외부 프로그램(spark submit, kubectl 등)을 실행하기 위한 모듈인 subprocess.Popen()을 사용하여
spark submit 을 진행하고 있다.   

```python
subprocess.Popen([
        "/opt/spark/bin/spark-submit",
        "--master", "k8s://kubernetes",
        "--conf", "spark.kubernetes.submission.waitAppCompletion=true",
        "script.py"
], stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=true) as process:
```

즉, spark submit을 별도의 python subprocess로 실행하며, 그 하위 subprocess 로 java 를 실행하여 관리하게 된다.   

```
$ ps -ef 
UID PID PPID   CMD
root 1  0     /usr/bin/tini -- 
root 7   1    python3 spark_submit_job py
root 37  7    java ... org.apache.spark.deploy.SparkSubmit ...
```

> Pyspark 를 사용하기 때문에 위와 같이 Python과 Java 프로세스가 나뉘어서 실행되며, Java 프로세스가 Driver Pod 생성 요청 및 모니터링 등의 역할을 담당한다.   

`또한, Kubernetes 환경에서 Airflow를 돌리고 있다면 KubernetesExecutor와 KubernetesPodOperator 두가지 방법 중 선택할 것이며, 현재 환경은 KubernetesPodOperator를 사용하여 실행하고 있다.`      

KubernetesExecutor와 KubernetesPodOperator(KPO)의 차이는 결국 Executor와 Operator의 차이이다.   
Operator는 Task가 무엇을 할지 정한다. 예시로는 PythonOperator, BashOperator, MysqlOperator 등이 있다.   

> 각각 Operator는 이름 그대로 Python 스트립트를 실행, Bash 스크립트를 실행, Mysql 에서 sql query를 실행해준다.   


- - - 

## 2. Driver Pod는 종료되었지만 KPO Pod는 종료되지 않는 이슈   

### 2-1) Root Cause   

Airflow 의 KubernetesPodOperator(KPO)를 이용하여 spark submit 을 하기 때문에 `spark submit 이후 spark 어플리케이션이 정상적으로 실행 및 종료된 다음 Airflow Task를 종료` 시켜야 한다.    

따라서, `spark.kubernetes.submission.waitAppCompletion=true 옵션을 이용하여 Spark 어플리케이션의 상태를 모니터링 하도록 하였다.`   
`이 옵션을 활성화하게 되면 driver pod에 watch api를 호출해서 driver pod가 완료되기까지 KPO pod의 spark submit 프로세스가 이를 대기한다.` 

> watch api란 kubernetes 리소스의 상태 변화를 실시간으로 모니터링하기 위한 메커니즘이며, 서버가 클라이언트로 상태를 전달해주는 단방향 구조이다.   
> 즉, http 요청과는 다르게 연결을 계속 유지하며, 상태가 변경될 때마다 이벤트를 전송한다.   

만약, watch api 연결 이후 세션 만료 등 다양한 이유로 connection이 종료되면 마지막 resourceVersion 기준으로 다시 연결을 시도하게 된다.   

하지만 간헐적으로 아래와 같이 driver pod는 실행이 완료되어 정상적으로 completed 상태가 되었지만 KPO Pod는 종료되지 않는 이슈가 확인되었다.   

```
LoggingPodStatusWatcherImpl: Waiting for application..to finish
Application status..phase: Running   

WARN: Watch ConnectionManager: Exec Failure: HTTP 401 Unauthorized.
```

`현재 Airflow 가 실행되는 K8s Cluster와 Spark 가 실행되는 K8s Cluster는 다른 클러스터를 사용하고 있으며, Fabric8 Kubernetes Clustr 를 함께 사용하면서 문제가 발생함을 확인했다.`        

> Fabric8 버전은 6.4.1 을 사용하고 있다.   
> Fabric8 Kubernetes Client 란 Java로 작성된 Kubernetes API 클라이언트 라이브러리이며, Spark는 Kubernetes Cluster에 작업을 제출할 때 Fabric8을 사용한다.    

Airflow 에서 KPO Pod가 실행되고, Spark 전용 클러스터에 실행하기 위한 인증 토큰을 아래와 같이 옵션으로 전달해주게 된다.   

```
# remote k8s master endpoint 통신을 위한 인증서 
--conf spark.kubernetes.authenticates.submission.caCertFile=/opt/airflow/remote-k8s/ca.crt
# service account token   
--conf spark.kubernetes.authenticates.submission.oauthTokenFile=/opt/airflow/remote-k8s/token
```

watch api를 이용한 연결 이후 네트워크 순단 등의 이유로 connection이 종료되었을 때, reconnect 를 시도하는 과정에서 문제가 발생한다.   
spark submit 할때 명시적으로 전달한 토큰 값이 아닌, [현재 클러스터의 토큰값](https://blog.marcnuri.com/fabric8-kubernetes-client-6-1)을 찾아서 덮어씌워버린다.   

[https://github.com/fabric8io/kubernetes-client/issues/2271](https://github.com/fabric8io/kubernetes-client/issues/2271) 를 참고해보면 
6.1.0 부터 /var/run/secrets/kubernetes.io/serviceaccount/token 파일을 재로드시 자동으로 로드하도록 변경 된 것을 확인하였다.

[Fabric8 Kubernetes Client 에서 Config.java](https://github.com/fabric8io/kubernetes-client/blob/v6.4.1/kubernetes-client-api/src/main/java/io/fabric8/kubernetes/client/Config.java#L585) 코드에서 확인할 수 있으며, spark submit 할 때 명시적으로 전달한 토큰 값을 사용하는게 아니라, 클러스터 내에 내장된 토큰 값을 기본 값으로 사용하게 된다.  

> 즉, 재시도를 할 때도 동일하게 Spark 가 실행되는 클러스터의 인증 토큰값을 이용해야 하는데,  Airflow 의 KPO Pod가 실행되는 클러스터 토큰 값을 이용하여 Spark가 실행되는 클러스터를 인증 시도를 하기 때문에 문제가 발생했다.   


### 2-2) Solution   

위의 이슈에 대해서 airflow, spark 각각 실행을 하나의 클러스터에서 진행하게 되면 문제는 해결할 수는 있다.
하지만, waitAppCompletion=false로 설정을 사용하되, k8s client 를 이용하여 상태를 polling 하는 방식으로 문제를 해결하였다.   

waitAppCompletion=true로 진행했을 때는 위의 이슈 외에도 


- - - 

**Reference**   

<https://spark.apache.org/docs/latest/running-on-kubernetes.html>  
<https://medium.com/@titieiti.com/airflow-kubernetesexecutor%EC%99%80-kubernetespodoperator-19d470e40a1e>  
<https://github.com/fabric8io/kubernetes-client/blob/v6.4.1/kubernetes-client-api/src/main/java/io/fabric8/kubernetes/client/Config.java>   

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

