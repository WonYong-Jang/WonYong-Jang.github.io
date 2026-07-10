---
layout: post
title: "[Airflow] Architecture 이해하기"  
subtitle: "airflow 2 와 airflow 3 아키텍처 비교 / DAG Serialization / DAG processor / DAG Versioning"   
comments: true
categories : Airflow 
date: 2025-09-02   
background: '/img/posts/mac.png'
---

## 1. Airflow Architecture   

<img src="/img/posts/airflow/스크린샷 2026-03-19 오후 10.45.21.png" width="500" height="500">  

> 위 그림은 airflow 3.x의 아키텍처이다.   

### 1-1) Scheduler & Executor   

`Scheduler는 Metadata DB에 저장된 직렬화된 DAG를 주기적으로 읽고, 실행해야 할 DAG Run 과 Task Instance를 판단해 Metadata DB에 기록한다.`   

> 3.x 부터 Scheduler 는 Dag 파일을 직접 파싱하지 않고, serialized_dag 테이블만 읽는다.    

`지정된 스케줄에 따라 수행할 DAG 확인 후 Executor에 수행을 지시하게 된다.`     

> Executor는 Scheduler 안에 내장된 컴포넌트이며, Scheduler가 "이 Task 지금 실행해야 해" 라고 결정하면 Executor가 "그러면 여기서 실행할께" 를 담당한다.   

`Executor는 Scheduler로 부터 전달 받은 Task Instance를 전달 받고, Worker에게 전달하게 된다.`    
`즉, Executor는 Scheduler가 생성한 Task Instance 를 어디에서 실행할지 Dispatcher(전달/분배)하는 역할을 한다.`     

`Executor는 worker들을 Local 수행(LocalExecutor) 또는 분산 서버에서 수행(CeleryExecutor등) 할 수 있게 하며, 분산 서버 수행 시에는 Queue를 통해 dag_id, task_id, run_id 등의 정보를 분산된 Worker들에 message로 전달하며, LocalExecutor의 경우 별도 Worker 가 존재하지 않으며, Scheduler가 Task를 직접 subprocess로 띄워서 실행하게 된다.`        

> LocalExecutor 의 경우 queue 사용 없이 Scheduler 컨테이너 안에 Executor 와 Worker가 모두 포함된 구조이다.   

`Worker는 dag_id, run_id, task_id 등의 정보를 전달받고, 실행에 필요한 보다 상세한 스케줄 정보, 환경 변수 및 Serialized DAG를 API 서버에 호출하여 가져오고 DAG 소스코드도 참조하여 이를 기반으로 실제 작업을 수행한다.`      

Dag 파일 처리 주기 관련 설정은 아래와 같다.   

```shell
- scheduler_heartbeat_sec (Default: 5초)    
    # Scheduler는 내부적으로 무한 루프를 돌면서 아래 작업들을 반복한다.
    # 이러한 루프를 몇 초마다 한번씩 돌릴지를 결정하는 옵션이다.   
    - DAG 실행 스케줄링
    - Task 상태 확인
    - Executor에 작업 전달
    - DB 상태 sync   
```

즉, 스케줄러는 지속적으로 실행되는 서비스로, 프로덕션 환경에서는 항상 작동 중이어야 한다.   

`Airflow 2.x 부터는 여러 Scheduler 프로세스를 동시에 실행 가능한 Multiple Scheduler를 지원한다.`   
따라서 이전에는 하나의 scheduler에 부하가 걸리거나 장애가 발생하면 DAG 스케줄링이 지연되거나 멈출수 있기 때문에 여러 Scheduler 프로세스를 실행하여 성능 향상을 할 수 있다.  

그럼 어떻게 Multiple Scheduler는 Metadata DB 에 동시에 접근을 제어할까?   
`Airflow는 행 단위 락(Row-level lock)을 사용하여 critical section을 제어한다.`   

> 즉, 같은 Task Instance를 동시에 잡지 않도록 DB 락을 활용한다.   

단, 주의해야할 점은 Scheduler 수가 많아질수록 메타데이터 DB 쿼리도 늘어나므로, DB 성능이 중요하며 너무 많은 Scheduler 갯수 설정은 오히려 성능 저하가 발생할 수 있다.   

> 공식 문서 기준 Airflow 3.x 가 지원하는 메타데이터 DB 버전은 PostgreSQL 13/14/15/16/17, MySQL 8.0+ 이다.    

아래는 scheduler 갯수를 2로 설정한 예이다.   

```yaml
scheduler:
    replicas: 2
```

또한, Airflow 3.x 에서는 Scheduler의 역할이 축소 되었다.   
`Airflow 2.x 의 Scheduler는 Dag 파싱까지 담당했지만, Airflow 3.x 의 Scheduler는 오직 스케줄링만 하고 파싱은 독립된 DAG Processor가 전담한다.`    

### 1-2) Executor 의 종류별 동작 방식   

Executor는 Scheduler가 생성한 Task Instance를 어디서, 어떻게 실행할지 결정하는 컴포넌트이다.   
대표적인 세 가지 동작 방식은 아래와 같다.   

##### 1-2-1) LocalExecutor
- 별도 Worker 프로세스나 메시지 큐가 없다.   
- Scheduler가 Task를 자기 호스트에서 직접 subprocess로 fork 해 실행한다.
- 동시 실행 개수는 parallelism 설정으로 제한된다.
- 단일 노드 구성에 적합하며, 스케줄러 장비 자원이 곧 실행 자원이 된다.   

##### 1-2-2) CeleryExecutor
- Worker가 Scheduler와 물리적으로 분리된 별도 프로세스(airflow celery worker)로 존재한다.  
- Scheduler의 Executor는 실행할 Task 정보(dag_id, task_id, run_id 등)를 메시지 브로커(Redis / RabbitMQ) 큐에 넣는다.   
- 여러 Worker가 큐에서 Task를 pull 하여 실행하고, 실행 상태는 3.x 기준으로 API Server 를 경유해 Metadata DB에 기록한다.
- Worker를 수평 확장할 수 있어 대규모 분산 실행에 적합하다.  

##### 1-2-3) KubernetesExecutor
- 상시 대기하는 Worker가 없다. Task 마다 전용 Pod를 동적으로 생성해 실행하고, 끝나면 Pod를 제거한다.  
- Task 별로 리소스(CPU, Memory)와 이미지를 독립적으로 지정할 수 있어 격리성과 자원 효율이 높다.
- 트래픽이 없을 때는 Pod가 뜨지 않아 후 유휴 자원 낭비가 적다.   

##### 1-2-4) CeleryKubernetesExecutor   

- CeleryExecutor 와 KubernetesExecutor를 함께 쓰는 하이브리드 방식이다.   
- 가벼운 Task는 상시 Celery Worker에서 낮은 지연으로 처리하고, 무겁거나 격리, 전용 리소스가 필요한 Task만 독립 Pod로 분리하여 사용할 수 있다.   
- `Airflow 3.x 에서는 이 방식이 사라지고 여러 Executor를 동시에 사용하는 기능(Multiple Executor Configuration)이 도입되었다.`

	```
	[core]
	executor = CeleryExecutor,KubernetesExecutor
	```

### 1-3) DAG Processor  

`DAG 파일을 파싱해 DAG 객체로 변환하고, 직렬화하여 Metadata DB에 저장하는 컴포넌트이다.`    

![](/img/posts/common/Pasted%20image%2020260709155719.png)

`Airflow 2.x 에서는 DAG Processor(DagFileProcessorManager)가 기본적으로 Scheduler에 의해 함께 기동, 관리되며, 실제 파싱은 스케줄러가 fork한 별도 subprocess(DagFileProcessorProcess)에서 수행되었다.`      

`Airflow 3.x 부터는 DAG Processor가 독립된 필수 컴포넌트로 분리되어, Scheduler와 별도 프로세스로 동작하며 Scheduler는 파싱을 전혀 하지 않는다.`       

##### DagFileProcessorManager 

`DagFileProcessorManager 는 무한 루프를 돌며, 어떤 파일을 파싱할지 결정한다.`      
`각 파일 마다 별도의 프로세스(DagFileProcessorProcess)를 실행시켜 파싱을 수행한다.`    

. 주요 단계는 아래와 같다.   

- 새 파일 확인: Dag 가 마지막으로 갱신된 이후 경과 시간이 refresh_interval(dag_dir_list_interval) 보다 크면, Dag 파일 경로 목록을 갱신한다.
- 최근 처리된 파일 제외: 최근에 min_file_process_interval 이내에 처리되었고, 수정되지 않은 파일은 파싱대상에서 제외한다.
- 파일 경로 큐잉: 새로 발견된 파일 경로들을 파싱 대기 큐에 추가한다. 
- 파일 파싱 실행: 각 파일마다 새로운 DagFileProcessorProcess를 실행하며, 최대 parsing_processes 개수까지 병렬로 처리한다.
- 결과 수집: 파싱이 완료되면 프로세스의 결과를 수집한다.
- 통계 기록: 통계를 출력하고, dag_processing.total_parse_time 메트릭을 전송한다.

##### DagFileProcessorProcess

실제로 Python 파일을 로드하고 Dag 객체를 추출하는 프로세스이다.
`제한 시간이 존재하며, dag_file_processor_timeout 내에 완료되어야 한다.`    

주요 단계는 아래와 같다.   
- 파일 처리: 전체 파싱 작업은 dag_file_processor_timeout 설정값 내에 완료되어야 한다.   
- Dag 파일 로드: Dag 파일은 Python 모듈로 로드되며, 이 작업은 dagbag_import_timeout 내에 완료되어야 한다.
- 모듈 처리: 로드된 Python 모듈 내에서 Dag 객체들을 탐색한다.
- DagBag 반환: 발견된 Dag 객체들의 리스트를 DagFileProcessorManager에 DagBag 형태로 반환한다.

##### .airflowignore

dags_folder에 존재하는 모든 파이썬 파일이 기본적으로 dag processor의 대상이 되지만, 모든 파일을 파싱하면 리소스 부담이 발생하게 된다.
`따라서 .airflowignore 조건을 통해 파일 이름을 검사하여 파싱 대상 파일들을 필터링할 수 있다.`    


`아래 옵션과 같이 dags 폴더에 있는 DAG 파일들을 주기적으로 모니터링하여 신규로 만들어지거나 삭제된 DAG 는 Default로 5분 단위로 확인하며, 기존 DAG 재파싱 간격은 30초 단위로 확인한다.`

```shell
# 해당 옵션들은 airflow.cfg 또는 환경변수로 변경 가능   
# 새/삭제된 DAG 파일을 발견하는 주기(기본값: 5분)
# Airflow 2.x 의 [scheduler] dag_dir_list_interval 이 Airflow 3.x 에서 [dag_processor] refresh_interval 로 대체됨    
AIRFLOW__DAG_PROCESSOR__REFRESH_INTERVAL=300

# 같은 DAG 파일을 다시 파싱하기 까지 최소 간격(기본값: 30초)   
AIRFLOW__DAG_PROCESSOR__MIN_FILE_PROCESS_INTERVAL=30
```

파싱된 Dag는 Metadata DB에 직렬화되어 Webserver(api server)나 Scheduler에서 불필요한 재파싱을 방지한다.    

### 1-4) Webserver(API Server)

사용자에게 UI를 제공하는 컴포넌트로, DAG 상태, 태스크 로그, 실행 기록 등을 조회할 수 있다.   
Airflow 3.x 부터 Webserver 는 API Server로 대체되었으며, FastAPI 기반(Uvicorn으로 구동)으로 UI 와 Rest API를 함께 제공한다.   

> Airflow 2.x 의 Webserver는 Flask 기반이며, Gunicorn 으로 다수의 프로세스를 띄우는 구조였다.   
> Airflow 3.x 의 API Server는 UI 제공, Worker 용 Task Execution API, 공개 Rest API를 함께 담당한다. 



### 1-5) Worker  

Task Instance를 실제로 실행하는 프로세스이다.    
Executor에 따라 Celery, Kubernetes, Local 등의 방식으로 분산 실행이 가능하며, 각 태스크의 상태와 로그는 Metadata DB에 기록된다.      

`Worker는 더 이상 Metadata DB에 직접 접근하지 못한다. XCom 조회/저장, 상태 전이, heartbeat 등 모든 런타임 상호작용은 Task Execution API(API Server가 제공)를 통해서만 이뤄진다.`   

### 1-6) Triggerer    

Triggerer 프로세스는 비동기 이벤트 기반 태스크를 처리하는 전용 컴포넌트이다.   

`deferrable 오퍼레이터/센서 (예: DateTimeSensorAsync, deferrable=True 옵션을 준 오퍼레이터)에서 사용되며, 리소스를 효율적으로 사용해 수천 개의 태스크도 오버헤드 없이 관리할 수 있다.`   

> TriggerDagRunOperator는 일반적으로는 Worker에서 실행되지만, deferrable=True 옵션을 주게되면 Triggerer 프로세스에서 이벤트 기반으로 실행될 수 있다.   

### 1-7) DAG Files    

Python 스크립트 형태로 DAG 정의가 작성된 파일들이다. 

### 1-8) Metadata DB     

Airflow의 모든 상태 정보(TaskInstance, DagRun, Log 등)를 저장하는 핵심 데이터베이스이다.   
Scheduler, Webserver(API Server), Worker가 이 DB를 중심으로 상태를 주고 받으며 동기화한다.  

Metadata DB의 테이블은 크게 DAG Processor가 파싱하며 채우는 테이블과 Scheduler/Executor/Worker가 실행하며 채우는 테이블로 나눠 볼 수 있다.   

#### 1-8-1) 파싱 단계에서 쌓이는 데이터

Dag Processor가 example_etl.py 를 파싱하면 아래 테이블이 갱신된다.   

| 테이블                 | 내용                | 예시 컬럼                                                   |
| ------------------- | ----------------- | ------------------------------------------------------- |
| `dag`               | DAG 단위 메타데이터      | dag_id, is_paused, is_active, fileloc, last_parsed_time |
| `serialized_dag`    | 직렬화된 DAG 구조(JSON) | dag_id, dag_hash, last_updated, data                    |
| `dag_code`          | DAG 원본 소스코드       | fileloc_hash, fileloc, source_code                      |
| `dag_version (3.x)` | DAG 버전 이력         | dag_id, version_number, created_at                      |
| `import_error`      | 파싱 실패한 파일의 에러     | filename, stacktrace                                    |

#### 1-8-2) 스케줄링, 실행 단계에서 쌓이는 데이터   

파싱과 무관하게, Scheduler가 스케줄을 판단해 실행을 시작하면 아래 테이블이 채워진다.  

| 테이블                     | 내용                                  | 예시 컬럼                                                |
| ----------------------- | ----------------------------------- | ---------------------------------------------------- |
| `dag_run`               | DAG 1회 실행 인스턴스                      | dag_id, run_id, state, execution_date, start_date    |
| `task_instance`         | Task 실행 인스턴스                        | dag_id, task_id, run_id, state, try_number, hostname |
| `task_instance_history` | Task 재시도 이력                         | dag_id, task_id, try_number, state                   |
| `xcom`                  | Task 간 데이터 전달                       | dag_id, task_id, key, value                          |
| `job`                   | Scheduler/Triggerer 등 데몬의 heartbeat | job_type, state, latest_heartbeat                    |
| `trigger`               | deferrable Task의 trigger 상태         | classpath, kwargs, triggerer_id                      |
| `log`                   | 이벤트/감사 로그                           | dttm, dag_id, task_id, event                         |

`정리해보면 dag/serialized_dag/dag_code는 파싱의 산출물이고, dag_run/task_instance/xcom 은 실행의 산출물이다.`  

### 1-9) Plugins folder    

사용자 정의 Operator, Hook, Sensor, Macros 등을 등록할 수 있는 확장 경로이다.   
Airflow는 이 디렉토리의 파일들을 로드하여 사용자 정의 기능을 플러그인처럼 활용할 수 있다.  

- - - 

## 2. Airflow2 vs Airflow3 비교     

`Airflow2 에서는 모든 component 는 Metadata DB 와 직접적으로 통신하였다.`   
특히 Worker가 직접 Metadata DB 와 통신하면서 많은 connection 갯수가 필요하며, scaling 에 대한 고려가 필요할 수 있다.   
또한, Worker가 직접 Metadata DB를 바라보고 있으니, 사용자 코드가 데이터베이스에 악의적인 작업을 수행할 수도 있게 된다.   

<img src="/img/posts/data-engineering/09-05/스크린샷 2025-09-05 오전 8.36.25.png">   

Airflow3 로 업그레이드 되면서 security, scalability, maintainability 를 향상시키기 위한 많은 변화가 있다.   

<img src="/img/posts/data-engineering/09-05/스크린샷 2025-09-05 오전 8.36.36.png">   

`Airflow2 에서 Web Server가 Airflow3 에선 API Server로 명칭이 변경되었다.`     
`Airflow2 Worker에서 직접 Metadata DB를 접근하였으나, Airflow 3에선 API Server를 경유하여 DB를 접근하게 변경되었다.`       

> Airflow2에선 DAG Author에 의해 작성된 코드가 DB에 직접적으로 영향을 줄 수 있기 때문에 이를 방지하려는 목적이다.   

이러한 변경은 Worker가 실행하는 사용자 코드가 DB에 직접 손댈 수 없어 보안이 강화되고, DB 커넥션 수도 크게 줄어들 수 있다.   

기존에 대규모 환경(수백 개 Dag, Worker 100 대 이상)에서 2.x는 Worker 마다 DB 커넥션을 물고 있어서 커넥션 풀 고갈이 자주 발생했었다.

`3.x에서는 Worker -> API Server -> DB 구조로 바뀌면서 N개의 Worker -> 1개 API Server -> 최적화된 DB 커넥션 풀 형태가 되어, API Server 계층에서 커넥션 관리/캐싱이 가능해지고 병목 지점을 API Server 스케일아웃으로 해소할 수 있다는 점이 실질적인 운영 이점이다.`   

- - - 

## 3. DAG Serialization     

### 3-1) Serialization(직렬화) 이란?

Serialization 은 Python으로 작성된 DAG 객체를 JSON 형태로 변환해 Metadata DB의 serialized_dag 테이블에 저장하는 과정이다.   
`DAG 파일(.py)은 실행 가능한 코드라 매번 파싱하려면 Python 인터프리터로 실행해야 하지만, JSON으로 한 번 직렬화해두면 다른 컴포넌트(API Server, Scheduler)는 코드를 실행하지 않고 DB에서 구조만 읽어 사용할 수 있다.`   

직렬화가 도입되기 전에는 Webserver 와 Scheduler가 둘 다 DAG 파일을 직접 파싱했고, 아래 문제가 발생했다.   
- 두 컴포넌트 모두 DAG 파일이 있는 공유 스토리지에 접근해야 한다.
- Webserver 재시작, 스케일 아웃 시 파싱 비용과 의존성이 커진다.   
- 서로 다른 환경에서 파싱해 UI와 실제 스케줄링 불일치가 발생할 수 있었다.   

<img src="/img/posts/data-engineering/09-05/스크린샷 2025-09-07 오후 2.57.54.png">   

### 3-2) Airflow 1.10.x / 2.x / 3.x 비교  

`직렬화는 세 단계로 발전해왔으며, 핵심은 "직렬화 DAG를 누가 만들고, 누가 읽는가" 가 점점 명확히 분리되어 온 것이다.`    

`Airflow 1.10.x (1.10.7 ~)`
- DAG 직렬화가 처음 도입되었으나 기본값은 False 이기 때문에 Dag 파일을 직접 파싱했었다. 
- 단, store_serialized_dag 를 True로 활성화 시킨 경우는 Webserver를 stateless 하게 만드는 것으로, Webserver는 DB 의 직렬화 DAG만 읽어 UI를 그린다.
- 단, Scheduler 는 여전히 DAG 파일을 직접 파싱해 스케줄링을 결정했다. 

`Airflow 2.x`
- 직렬화가 필수(비활성화 불가)가 되었다.   
- Scheduler가 DagFileProcessor를 소유해 파싱 + 직렬화를 하고 Scheduler 자신도 이 직렬화 DAG를 읽어 스케줄링을 결정한다. 
- 즉 Webserver와 Scheduler 둘 다 직렬화 DAG의 소비자가 된다.
- 단, 파싱과 직렬화 주체는 여전히 Scheduler가 진행한다.

`Airflow 3.x` 
- 파싱/직렬화를 독립된 Dag Processor가 전담하며, Scheduler는 파싱을 전혀 하지 않는다.
- Scheduler와 API Server(Webserver)는 오직 serialized_dag 를 읽기만 하는 순수 소비자가 된다.
- Dag Versioning이 추가되어 직렬화 Dag가 dag_version과 연결되고, 파일이 바뀌면 새 버전이 함께 보존된다.   

- - - 

## 4. DAG Versioning   

`DAG Processor 가 주기적으로 dags 폴더 하위 파일들을 스캔하고, 새롭게 생성된 파일이 있으면 그 파일을 serialize 하게 되며 문제가 없는 파일이라면 v1 이라고 versioning을 해주게 된다.`    

그 이후 dag 파일이 변경된 이후 DAG Processor가 이를 확인 후 버전을 올려서 관리하게 된다.   

> Airflow 3.0 에서 새롭게 도입된 기능이다.   


- - -

Reference

<https://medium.com/29cm/29cm-apache-airflow-%EC%9A%B4%EC%98%81%EA%B8%B0-da6b5535f7a6>   

{% highlight ruby linenos %}
{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}







