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

현재 Spark 를 Kubernetes 에서 실행시키기 위한 구조는 Airflow 를 통해 트리거가 되며, Spark Submit 하기 위해 
KubernetesPodOperator를 이용하여 실행하고 있다.  

- Deploy Mode: cluster
- Spark Version: 3.4.4
- Airflow Version: 3.1.8

```
[Airflow Scheduler]
    └─ KubernetesPodOperator 트리거
           │
           ▼
    [Worker Pod]  ← KubernetesPodOperator가 생성하는 Pod
    └─ spark-submit 실행
           │
           ▼
    [Driver Pod] → [Executor Pods]
           │
    Job 완료 → Driver: Completed
           │
           ▼
    Worker Pod 종료 → Airflow Task: Success
```

`Kubernetes 환경에서 Airflow를 돌리고 있다면 KubernetesExecutor와 KubernetesPodOperator 두가지 방법 중 
선택할 것이며, 현재 환경은 KubernetesPodOperator를 사용하여 실행하고 있다.`      

KubernetesExecutor와 KubernetesPodOperator의 차이는 결국 Executor와 Operator의 차이이다.   
Operator는 Task가 무엇을 할지 정한다. 예시로는 PythonOperator, BashOperator, MysqlOperator 등이 있다.   

> 각각 Operator는 이름 그대로 Python 스트립트를 실행, Bash 스크립트를 실행, Mysql 에서 sql query를 실행해준다.   




- - -  


```
LoggingPodStatusWatcherImpl: Waiting for application..to finish
Application status..phase: Running   

WARN: Watch ConnectionManager: Exec Failure: HTTP 401 Unauthorized.
```

```
# ServiceAccount Token 만료 시간 확인   
kubectl get pod <Ariflow Worker Pod> -o jsonpath='{.spec.serviceAccountName}'
```

- - - 

**Reference**   

<https://spark.apache.org/docs/latest/running-on-kubernetes.html>  
<https://medium.com/@titieiti.com/airflow-kubernetesexecutor%EC%99%80-kubernetespodoperator-19d470e40a1e>   

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

