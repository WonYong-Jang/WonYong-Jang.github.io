---
layout: post
title: "[Flink] Apache Flink 이해하기"
subtitle: "Spark Streaming 과 비교 / Flink 아키텍처 " 
comments: true
categories : BigData
date: 2025-03-17
background: '/img/posts/mac.png'
---

이번 글에서는 Spark Streaming 과 Flink 의 차이점에 대해 
살펴보고 Flink 아키텍처 등에 대해 자세히 살펴보자.     

- - -    

## 1. Flink 와 Spark Streaming 차이   

우선 스트리밍에 대해서 간단히 집고 가면 일반적으로 사용되는 
스트리밍은 크게 두 가지로 나눌 수 있다.   

> micro-batch streaming vs native streaming   

마이크로 배치 방식은 사실은 배치 프로세스이다. 하지만 배치 간격을 
아주 짧게 잡아 실시간처럼 처리하는 것이다.  

네이티브 스트리밍이 우리가 직관적으로 알고 있는 이벤트 기반 실시간 
처리 방법이다.     


##### 성능   

`Spark Streaming 은 마이크로 배치 방식을 사용하고 있고 Flink 는 
네이티브 스트리밍 방식을 사용하고 있다. 즉, 두 기술의 큰 차이점들은 
각 스트리밍 방식의 차이점에 기인한다.`   

Spark는 마이크로 배치 방식을 사용하기 때문에 배치 윈도우로 
인한 지연이 발생할 수 밖에 없다.   
때문에, Flink에 비해 지연 시간 대비 낮은 처리량을 갖게 된다.   

##### 장애 대응   

Spark는 특정 Executor에 문제가 발생하면, Recomputations 를 통해 리소스 
재할당을 한다. 즉 다른 노드로 배치 작업을 다시 할당한다.   

반면에 Flink는 Checkpoint Barrier, Backpressure를 통하여 문제가 인지되면 
스트리밍 속도를 조절함으로써 문제를 해결한다.   
즉, 파이프라인 뒤편에서 데이터를 받지 못하면 앞의 파이프라인에서 
Consume하는 속도를 이에 맞추어 줄이게 된다.  

요약해보면, Spark Streaming은 배치 및 스트리밍 처리가 통합된 환경에서 
일관된 API를 제공하므로, 배치와 스트리밍을 함께 다루거나 느슨한 
실시간 처리가 필요한 경우 적합하다.  
Flink는 매우 낮은 대기 시간과 완전한 실시간 스트리밍을 필요로 하는 
경우 적합하며, 실시간 데이터 스트림 처리에서 높은 성능을 요구하는 프로젝트에 
추천된다.   

##### Rescalability   

Spark 는 SparkSession을 만들 때 리소스를 미리 지정하고 할당 받게 된다.   
반면 Flink는 실행 도중 리소스 추가하거나 제거하거나 하여 유연하게 조절할 수 있다.   




- - - 

## 2. Apache Flink 아키첵처 및 주요 구성 요소    

Flink의 실행 흐름은 아래와 같다.   

- 어플리케이션 제출: 사용자가 작성한 Flink 어플리케이션은 Client를 통해 JobManager에게 제출된다.   
- 작업 계획 생성: JobManager는 어플리케이션을 실행 계획(Execution Plan)으로 변환하고, 이를 실행 그래프(Execution Graph)로 변환한다.   
- 태스트 할당: JobManager는 Execution Graph를 여러 Task로 나누어 TaskManager에게 할당한다.  
- 태스트 실행: TaskManager는 할당받은 Task를 실행하며, Task 간 데이터를 주고 받는다.   
- 상태 관리: 상태 저장이 필요한 Task는 State Backend를 통해 상태를 관리한다.   
- 체크 포인트: 주기적으로 체크포인트를 생성하여 장애 복구를 대비한다.   
- 장애 복구: 장애 발생 시, 체크포인트를 이용해 작업을 복구하고 실행을 재개한다.  
- 결과 출력: 처리된 데이터는 최종적으로 Sink에 저장되거나 다른 시스템으로 전달 된다.   

<img width="825" alt="Image" src="https://github.com/user-attachments/assets/8f8a3860-0784-408d-8fc3-263167608b2c" />   


##### Client   

`Client는 사용자 어플리케이션을 제출하는 역할을 한다.`     
일반적으로 사용자가 작성한 Flink 어플리케이션을 
Flink 클러스터에 제출하고 실행을 시작하는데 사용된다.   

- 작업 제출: 사용자가 작성한 Flink 어플리케이션(Job)을 JobManager에게 제출한다.   
- 모니터링 및 관리: 작업의 상태를 모니터링하고, 필요 시 작업을 취소하거나 수정한다.   


##### Job Manager

JobManager 는 Flink 클러스터의 중앙 제어 장치로, 다음과 같은 주요 역할을 수행한다.     

- 작업 계획 및 스케줄링: 사용자 어플리케이션(Job)을 실행 계획으로 변환하고, 이 계획을 여러 Task로 분할하여 TaskManager에게 할당한다.  
- 리소스 관리: 클러스터의 리소스를 관리하고, TaskManager의 상태를 모니터링하며, 필요시 리소스를 할당한다.   
- 장애 복구: 작업 중 장애가 발생하면 체크포인트를 기반으로 작업을 복구한다.     

- 3가지 컴포넌트로 구성되어 있다.   
    - Resource Manager - task slot 관리   
    - Dispatcher - Flink app을 등록하는 Rest API & Web UI   
    - JobMaster - 1개의 JobGraph 관리   

##### Task Manager  

TaskManager는 실제 데이터 처리를 수행하는 작업자이며, 여러 개의 작업 Slot을 
가진다.  
`각 Slot은 하나의 Task를 실행한다.`     

TaskManager는 Task 의 실행을 담당하는 컴포넌트로써 1개의 JVM Process로 동작한다.  
하나의 TaskManager에 속한 Task Slot 들은 JVM 메모리 등 자원을 공유 한다.  

##### Execution Graph   

Execution Graph는 Flink 어플리케이션이 실행되는 동안 생성되는 
실행 계획이다.  
작업은 여러 개의 Task로 나누어져 병렬로 실행된다.   

##### Checkpointing   

Checkpointing은 Flink에서 상태 저장(Stateful) 작업의 일관성을 
보장하는 메커니즘이다. 주기적으로 어플리케이션의 상태를 저장하며, 
    장애 발생 시 이 상태로 복구 할 수 있다.   

##### State Backend   

State Backend는 상태 저장 작업에서 상태를 저장하는 방식과 위치를 정의한다.   
주로 메모리 또는 디스크에 상태를 저장한다.   

- HashMapStateBackend   
    - Java Heap에 저장   
    - 메모리 사용으로 빠른 처리  

- EmbeddedRocksDBStateBackend  
    - RocksDB에 저장  
    - Disk 와 Serialize 사용으로 성능은 떨어질 수 있지만 처리량은 높힐 수 있다.   



- - - 

## 3. Checkpoint 와 Savepoint   

checkpoint와 savepoint는 기본적으로 flink에서 연산을 하기 위해 사용하는 state에 대한 
백업 용도로 쓰이고 있으며, 2가지 모두 같은 포맷으로 생성된다.      

##### Checkpoint   

`주 목적은 장애발생시 복구를 위한 용도이다.`   

##### Savepoint   

`사용자가 지정한 체크포인이며, 주로 job 을 업데이트하거나 
재시작 할 때 사용된다.`  

- - -


<https://flink.apache.org/>   
<https://tech.kakao.com/posts/656>   
<https://sungjk.github.io/2024/09/18/apache-flink.html>   
<https://www.samsungsds.com/kr/insights/flink.html>   


{% highlight ruby linenos %}
{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}







