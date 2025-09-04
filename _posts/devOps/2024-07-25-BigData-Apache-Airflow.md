---
layout: post
title: "[Airflow] 아파치 Airflow - Workflow "
subtitle: "DAG(Directed Acyclic Graph) / 데이터 워크 플로우 관리 도구/ execution_date 의미 / backfill and catchup"    
comments: true
categories : DevOps
date: 2024-07-25
background: '/img/posts/mac.png'
---

## 1. Apache Airflow   

`Apache Airflow는 복잡한 계산을 요하는 작업 흐름과 데이터 처리 파이프라인을 
조율하기 위해서 만든 오픈소스 도구이다. 실행할 Task(Operator)를 정의하고 
순서에 등록, 실행, 모니터링 할 수 있다.`    

`즉, Apache Airflow는 데이터 파이프라인을 코드로 정의하고, 스케줄에 따라 
자동으로 실행할 수 있게 도와주는 워크플로우 오케스트레이션 도구이다.`      

Airflow 상의 `작업흐름은 방향성 비순환 그래프(DAG)`로 설계된다.   
즉, 작업 흐름을 짤 때 그것이 어떻게 독립적으로 실행 가능한 태스크들로 나뉠 수 있을까 
생각해봐야 한다. 그래야 각 태스크를 그래프로 결합하여 전체적인 
논리 흐름에 맞게 합칠 수 있다.   

<img width="609" alt="스크린샷 2021-03-08 오후 9 52 55" src="https://user-images.githubusercontent.com/26623547/110324055-d0978380-8058-11eb-852c-21e15b64d01a.png">   

> 위 그림에서 전체 Workflow를 DAG라고 하며 각각의 작업 단위를 Task라고 한다.   

그래프 모양이 작업흐름의 전반적인 논리 구조를 결정한다. 
`Airflow DAG는 여러 분기를 포함할 수 있고 작업흐름 실행 시 건너뛸 지점과 중단할 
지점을 결정할 수 있다.`       

`여기서 DAG와 DAG Run이 구분되는데, DAG Run은 Dag 정의에 따라 실제 실행된 인스턴스이다.`   

```python
# DAG   
example_dag

# DAG Run  
example_dag:scheduled__2025-08-02T02:00:00+00:00
```


### 1-1) Apache Airflow 기본 동작 원리   

먼저 Airflow를 구성하는 각 컴포넌트의 역할을 간략하게 살펴보자.   

<img width="795" alt="스크린샷 2021-03-08 오후 10 06 59" src="https://user-images.githubusercontent.com/26623547/110325401-a6df5c00-805a-11eb-8816-b1ac13127b0a.png">   

##### Scheduler    

- 가장 중추적인 역할을 수행하며 모든 DAG(Directed Acyclic Graph)와 태스크를 모니터링하고 관리한다. 
- 개발자가 작성한 python 워크플로우 script를 확인하여 주기적으로 실행해야 할 태스크를 찾고 
해당 태스크를 실행 가능한 상태로 변경   
- MetaDB 에 어떤 시점에 dag를 실행해야 하고, 어떤 형태로 워크플로우가 구성되어 있는지 등을 저장   

##### Webserver 

- workflow(DAG)의 실행, 재시작, 로그, 코드 등 모두 WebServer UI로 관리 가능    

##### Kerberos    

- 인증처리를 위한 티켓 갱신(ticket renewer) 프로세스(선택사항)   

##### DAG Script    

- 개발자가 작성한 Python 워크 플로우 스크립트   

##### MetaDB     
- Airflow 메타데이터 저장소이다. 어떤 DAG가 존재하고 어떤 태스크로 구성되었는지, 어떤 태스크가 실행 중이고 
또 실행 가능한 상태인지 등의 많은 정보가 기입된다.   

##### Executor   
- 태스크 인스턴스를 실행하는 주체이며 종류가 다양하다. 
- 실행해야 하는 task를 찾아서 상태를 변경하고 내부 Queue에 Task를 추가한다.    

##### Worker    

- 실제 작업을 수행하는 주체이며 워커의 동작 방식은 Executor의 종류에 따라 상이하다.   

### 1-2) Executor의 종류 및 특징과 장단점   

앞에서 Airflow의 기본 동작 원리를 설명하면서 Airflow에 Executor라는 개념이 
있다고 언급했는데, `Executor는 작업의 한 단위인 Task를 실행 하는 주체이다.`       

Executor에는 다양한 종류가 있고 각 종류에 따라 동작 원리가 상이하다. 
현재 Airflow에는 Sequential Executor와 Debug Executor, Local Executor, Dask 
Executor, Celery Executor, Kubernetes Executor를 제공하고 있으며 
Airflow 2.0에는 CeleryKubernetes Executor가 추가되었다.   


- - - 

## 2. 설치 방법    

[공식문서](https://airflow.apache.org/docs/apache-airflow/2.0.2/start/docker.html#accessing-the-environment) 를 참고하여 설치를 진행해보자.   

```
$ mkdir airflow-docker
$ cd airflow-docker

### fetch docker-compose file
$ curl -LfO 'https://airflow.apache.org/docs/apache-airflow/2.0.2/docker-compose.yaml'

$ mkdir ./dags ./logs ./plugins

$ echo -e "AIRFLOW_UID=$(id -u)\nAIRFLOW_GID=0" > .env

$ docker-compose up airflow-init

### start all service
$ docker-compose up
```

위의 명령어를 모두 실행 후 localhost:8080 에서 web ui를 확인할 수 있으며, 
    초기 id/pw 는 airflow 이다.  


테스트가 완료된 이후 컨테이너와 database에 있는 데이터의 volumes 등을 
아래와 같이 정리해준다.   

```
docker-compose down --volumes --rmi all
```

 
- - - -

## 3. Airflow Tutorial 진행    

[Airflow Tutorial](https://airflow.apache.org/docs/apache-airflow/stable/tutorial.html) 페이지를 참고해서 Tutorial을 진행해보자.   

### 3-1) simple_bash.py DAG 파일 생성    

simple_bash 라는 이름의 DAG를 생성할 것이다. Docker Compose를 실행한 경로(다른 
        경로로 이동하지 않았다면 docker-airflow/dags) 에 dags라는 디렉토리가 
있을 것이다. 이 디렉토리에 simple_bash.py 파일을 생성하고, 작성을 시작한다.    

### 3-2) import 구문   

```python
from datetime import datetime, timedelta   
from airflow import DAG              
from airflow.operators.bash_operator import BashOperator
```

### 3-3) Default Arguments 객체 생성   

DAG 및 DAG 내 Task들에 일괄적으로 적용할 속성 객체를 작성한다.    

```python
default_args={
    'owner': 'airflow',
    'depends_on_past': False,
    'start_date': datetime(2020, 5, 16, 14, 0),
    'email': ['kaven@gmail.com'],
    'email_on_failure': False,
    'email_on_retry': False,
    'retries': 1,
    'retry_delay': timedelta(minutes=1),
    'execution_timeout': timedelta(seconds=300), 
    'on_failure_callback': SlackWebhook.airflow_failed_callback
}
```

- owner : 작업 소유자 ID   
- depends_on_past : 특정 작업의 Upstream이 성공한 경우에만 해당 작업을 Trigger 할 것인지에 대한 여부   
- start_date : DAG 최초 실행 시간(과거 혹은 예약 가능)    
- email : 작업 생행 관련 이메일 수신 주소 목록   
- email_on_failure : 작업 실패 시 이메일 수신 여부   
- email_on_retry : 작업 재시도 시 이메일 수신 여부    
- retries : 작업 재시도 횟수   
- retry_delay : 작업 재시도 간격   
- execution_timeout: default로 24시간이며, 정해진 시간동안 dag가 완료되지 않는 경우 타임아웃 에러 발생    

Callback을 사용하여 task가 성공하거나 실패했을 경우 알람을 보내는 등의 동작을 구성할 수있다.   

<img width="754" alt="스크린샷 2023-04-18 오전 9 10 39" src="https://user-images.githubusercontent.com/26623547/232636709-b7282f5e-5dbb-4ffa-b2e5-a699dce93144.png">    


### 3-4) DAG 정의    

DAG 객체를 아래와 같이 정의할 수 있다.

```python
dag = DAG(
    'tutorial_bash',
    default_args=default_args,
    description='My first tutorial bash DAG',
    schedule_interval= '* * * * *'
)
```
`schedule_interval에 아래와 같이 DAG 스케줄링 간격(Cron 표현식 혹은 미리 정의된 속성 사용 가능)을 
지정할 수 있다.`    

<img width="717" alt="스크린샷 2023-04-07 오후 11 20 37" src="https://user-images.githubusercontent.com/26623547/230624830-c1d9fcda-b482-4936-994e-6484fd1e7217.png">     


### 3-5) Task 정의    

hello world를 출력하는 작업(say_hello)와 현재 시간을 출력하는 작업(what_time)을 정의할 것이다.   

```python
t1 = BashOperator(
    task_id='say_hello',
    bash_command='echo "hello world"',
    dag=dag
)

t2 = BashOperator(
    task_id='what_time',
    bash_command='date',
    dag=dag
)

t1 >> t2
```

BashOperator 에는 다음과 같은 속성이 존재한다.   

- task_id : 작업의 ID   
- bash_command : 실행할 Bash Command   
- dag : 작업이 속할 DAG   

`또한 t1 >> t2 는 t1이 실행된 후 t2를 실행한다는 의미이다.(t1이 t2의 Upstream Task)`    


### 3-6) 생성된 DAG 확인하기    


dags 폴더에 위에서 작성한 파이썬 파일을 생성 후 docker compose up 을 
통해 실행하게 되면 아래와 같이 web ui에서 생성한 dag를 확인할 수 있다.   

<img width="830" alt="스크린샷 2021-03-09 오후 11 33 10" src="https://user-images.githubusercontent.com/26623547/110486957-7b2ea580-8130-11eb-8fbe-096c7872cb7a.png">    


### 3-7) DAG를 활성화하여 실행 확인하기    

만들어진 DAG는 활성화된 상태가 아니어서(Paused) 실행되지 않는다. 실행을 
위해서는 CLI나 Web UI상에서 'Off' 버튼을 눌러 'On' 상태로 변경해주어야 한다.   

Web UI에서 확인하면 'Off' 였던 상태가 'On' 으로 변경되고, DAG가 실행되고 
있는 것을 볼 수 있다.   


<img width="830" alt="스크린샷 2021-03-09 오후 11 36 35" src="https://user-images.githubusercontent.com/26623547/110486979-7ff35980-8130-11eb-8eed-6f46a134aec4.png">   


DAG에서 특정 task를 클랙했을 때 아래와 같이 팝업창을 볼수 있다. 각 task에 
대해 로그를 보거나 rendered 된 파라미터를 볼수도 있고, task 실패시 Clear 버튼을 
통해 retry 할수도 있다.  

### 3-8) Retry Tasks   

일부 task가 실패했거나, 데이터에 변경이 발생해서 특정 시점 작업을 다시 수행해야 할 수 있다.   
Dag 실행 화면의 Tree 보기 또는 Graph 보기에서 실패한 Task를 
클릭하면 Task의 세부 동작을 설정할 수 있는 팝업이 출력된다.   

<img width="761" alt="스크린샷 2024-07-28 오후 6 00 52" src="https://github.com/user-attachments/assets/e6586339-fee1-4d17-b669-96623cf36015">   

Clear 버튼을 클릭하여 재처리를 할 수 있고 삭제 대상 Task 범위를 지정해 줄 수 있다.   

> 특정 Task 이후 모든 Task를 재처리 해야 하는 경우 모든 Task를 일일이 클릭하지 않고 범위를 지정하여 한번에 재처리가 가능하다.   

선택 가능한 삭제 대상 Task 범위는 다음과 같다.  

<img width="757" alt="스크린샷 2024-07-28 오후 6 01 03" src="https://github.com/user-attachments/assets/bf626182-076f-44b0-abe0-3632bf5660b0">    

Past, Future, Upstream, Downstream을 그림으로 표현하면 다음과 같다.   

<img width="731" alt="스크린샷 2024-07-28 오후 6 01 09" src="https://github.com/user-attachments/assets/34621690-986b-4da7-aa45-89d8f2087b27">   


- - - 

다음으로는 Apache airflow를 사용함에 있어서 혼동할 수 있는 부분과 주의사항에 
대해 살펴보자.     

## 4. execution_date 주의 사항   

airflow에서 DAG를 동작시키고 task instance를 확인해 보면  
    아래와 같이 Execution Date, Start Date, End Date를 확인 할수 있다.    

excution_date를 살펴보면 의문점이 들 수 있다.  

아래 stackoverflow에 airflow사용자들이 주로 혼란스러워하는 포인트가 잘 표현되어 있다.   

<https://stackoverflow.com/questions/39612488/airflow-trigger-dag-execution-date-is-the-next-day-why>   

`결론 부터 말하면 execution_date는 실행날짜가 아니라 주문번호(run id)이다. 굳이 시간으로 
이해하고 싶다면 예약 시간이 아니라 예약을 잡으려고 시도한 시간이라고 
이해해야 한다.`    

<img width="677" alt="스크린샷 2021-03-08 오후 10 52 44" src="https://user-images.githubusercontent.com/26623547/110330512-2c660a80-8061-11eb-8f93-c624dd0b2b74.png">   

아래와 같이 dag가 설정되어 있다고 가정해보자.   

```python
'start_date': datetime(2019, 6, 6),
......
schedule_interval="@daily",
......
```

이렇게 하면 dag는 실제로 2019년 6월 7일에 최초 실행되며, execution_date에는 
2019-06-06값이 들어가게 된다.   

그리고 다음날인 6월 8일에 실행되고, execution_date에는 2019-06-07값이 들어 가게 되고 
하루마다 반복된다.   

따라서, 위의 stackoverflow 질문자는 두 가지를 모르고 있다.   

`1. execution_date가 실행시간이 아니라 주문번호라는 것`   

주문 번호를 "execution_date":"2016-06-20" 라고 넣고, 어째서 "2016-09-21"에 
실행(fire)되냐고 묻고 있는 것이다.    
주문 번호가 "2016-06-20" 이고 schedule_interval이 1day이면 "2016-09-21"에 
실행 된다.

`2. start_date를 now()로 설정하면 위험하다는 점`   

[airflow에서 dynamic value를 쓰지말라고 권고](https://airflow.apache.org/docs/apache-airflow/stable/faq.html#what-s-the-deal-with-start-date) 하고 있을 뿐더러, 
특히 질문자처럼 execution_date 잘못 이해하고 있으면 
airflow는 분명히 의도와는 다르게 동작할 것이다.   


#### execution_date가 필요한 것일까?   

회사에서도 많이 느꼈지만 pipeline의 실패나 혹은 데이터 재처리를 
할 경우가 종종 발생한다. 이 경우 과거 데이터를 재처리 시켜주는 
명령인 backfill을 진행할 때가 있는데 pipeline이 실행했던 시점의 
데이터와 날짜를 넣어야 하다 보니 excution_date를 날짜 변수값으로 이용해 
꼭 필요한 값이라 생각한다.   

- - -    

## 5. 한국 시간(UTC +9)에 대한 고려     

UTC 환경을 전제로 작업할 경우, 즉 UTC 기준 날짜로 로그가 쌓이고 UTC 기준으로 로그를 
읽을 경우 고려하지 않아도 되지만 한국 시간(UTC +9)기준으로 로그를 사용한다면, 
    UTC 기준 15:00 ~ 24:00 사이에 서로 날짜가 다르기 때문에 문제가 발생할 수 있다.   

바꿔 말하면, 한국 시간으로 오전 9시 이전에 스케줄링해야 하는 경우에 문제가 발생한다.   

우리는 하루에 한번 실행되는 배치를 만든다고 가정하고 실행되는 날짜 기준으로 
전날 데이터를 작업한다고 가정해보자.   

아래와 같은 경우는 정상적으로 실행된 예시이다.     

```python
schedule_interval="@daily",
```

- 실행된 시간 : '2019-06-11T00:00' (= 한국 시간 오전 9시)   
- execution_date : '2019-06-10'   (= 주문 번호)   

`그런데 아래처럼 한국 시간 오전 9시 이전 시간으로 지정하면 문제가 발생한다.`    

```python
schedule_interval="31 15 * * *", #(한국 시간 00:31)
```

- 실행된 시간 : '2019-06-11T15:31' (= 한국 시간 `2019/06/12` 00:31)   
- execution_date : '2019-06-10' (=주문번호)    

2019/06/12 에 2019/06/10 일자 로그 작업을 하게 된 것이다.    

따라서 한국시간 기준으로 2019-06-12일에 실행되고 2019-06-10일 데이터를 작업하게 된다.   

- - -    

## 6. Backfill and Catchup    

과거에 start_date를 설정하면 airflow는 과거의 task를 차례대로 실행하는 Backfill을 실행한다.   
간혹 "과거 언제부터 데이터를 쭈욱 빌드해 주세요" 라는 요청을 받으면 과거 start_date를 
잘 설정하기만 하면 빌드는 자동으로 과거부터 실행되어 편리하게 데이터를 빌드할 수 있다.   
하지만 이런 동작을 원하지 않는 경우도 있다.    
그럴 때는 DAG를 선언할 때 `Catchup 설정을 False`로 해주면 backfill을 실행하지 않는다.  
즉, 과거의 작업은 중요하지 않고, 현재 시점의 이후 dag만 
실행되어야 한다면, 설정을 아래와 같이 변경할 수 있다.   

```
dag = DAG(
    dag_id="test_dag",
    default_args=default_args,
    start_date=datetime(2021, 1, 1, tzinfo=kst),
    schedule_interval="0 8 * * *",
    catchUp=False,
)
```



 


- - - 

**Reference**    

<https://airflow.readthedocs.io/en/1.10.12/dag-run.html>      
<https://blog.naver.com/gyrbsdl18/221561318823>   
<https://zzsza.github.io/data/2018/01/04/airflow-1/>    
<https://medium.com/@aldente0630/%EC%95%84%ED%8C%8C%EC%B9%98-%EC%97%90%EC%96%B4%ED%94%8C%EB%A1%9C%EC%9A%B0%EB%A1%9C-%EC%9E%91%EC%97%85%ED%9D%90%EB%A6%84-%EA%B0%9C%EB%B0%9C%ED%95%B4%EB%B3%B4%EA%B8%B0-8f3653d749b4>   
<https://engineering.linecorp.com/ko/blog/data-engineering-with-airflow-k8s-1/>    
<https://bomwo.cc/posts/execution_date/>  
<https://www.bearpooh.com/154>     
<https://www.bucketplace.com/post/2021-04-13-%EB%B2%84%ED%82%B7%ED%94%8C%EB%A0%88%EC%9D%B4%EC%8A%A4-airflow-%EB%8F%84%EC%9E%85%EA%B8%B0/>     

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

