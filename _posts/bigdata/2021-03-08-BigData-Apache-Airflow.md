---
layout: post
title: "[Airflow] 아파치 Airflow - Workflow "
subtitle: "DAG(Directed Acyclic Graph) / 데이터 워크 플로우 관리 도구/ execution_date 의미  "    
comments: true
categories : BigData
date: 2021-03-08
background: '/img/posts/mac.png'
---

## 1. Apache Airflow   

빅데이터 분석이나, 머신러닝 코드를 만들다 보면 필요한 것 중에 하나가 
여러개의 태스크를 연결해서 수행해야 할 경우가 있다. 데이터 베이스 ETL(Extract, 
        Transform, Load) 작업과 
비슷한 흐름이라고 보면 된다.    

단순하게 cron과 쉘로 순차적으로 수행하는 것으로 가능하지만, 에러가 났을 때 
재처리를 하거나, 수행 결과에 따라 분기를 하는 등 조금 더 구조화된 도구가 필요하다.   

`Apache Airflow는 복잡한 계산을 요하는 작업 흐름과 데이터 처리 파이프라인을 
조율하기 위해서 만든 오픈소스 도구이다. 실행할 Task(Operator)를 정의하고 
순서에 등록, 실행, 모니터링 할 수 있다.`     

`길이가 긴 스크립트 실행을 cron으로 돌리거나 빅데이터 처리 배치 작업을 
정기적으로 수행하려고 할때 Airflow가 도움이 될 수 있다.`   

Airflow 상의 작업흐름은 방향성 비순환 그래프(DAG)로 설계된다.   
즉, 작업 흐름을 짤 때 그것이 어떻게 독립적으로 실행 가능한 태스크들로 나뉠 수 있을까 
생각해봐야 한다. 그래야 각 태스크를 그래프로 결합하여 전체적인 
논리 흐름에 맞게 합칠 수 있다.   

<img width="609" alt="스크린샷 2021-03-08 오후 9 52 55" src="https://user-images.githubusercontent.com/26623547/110324055-d0978380-8058-11eb-852c-21e15b64d01a.png">   

그래프 모양이 작업흐름의 전반적인 논리 구조를 결정한다. Airflow DAG는 
여러 분기를 포함할 수 있고 작업흐름 실행 시 건너뛸 지점과 중단할 
지점을 결정할 수 있다.   

`Airflow의 장점 중 하나는 각 태스크에서 오류가 발생할 때 재처리 작업을 편리 하게 
수행할 수 있다.`        

### 1-1) Apache Airflow 기본 동작 원리   

먼저 Airflow를 구성하는 각 컴포넌트의 역할을 간략하게 살펴보자.   

<img width="795" alt="스크린샷 2021-03-08 오후 10 06 59" src="https://user-images.githubusercontent.com/26623547/110325401-a6df5c00-805a-11eb-8816-b1ac13127b0a.png">   

- Scheduler : 가장 중추적인 역할을 수행하며 모든 DAG(Directed Acyclic Graph)와 태스크를 모니터링하고 관리한다. 그리고 주기적으로 
실행해야 할 태스크를 찾고 해당 태스크를 실행 가능한 상태로 변경   

- Webserver : workflow(DAG)의 실행, 재시작, 로그, 코드 등 모두 WebServer UI로 관리 가능    

- Kerberos : 인증처리를 위한 티켓 갱신(ticket renewer) 프로세스(선택사항)   

- DAG Script : 개발자가 작성한 Python 워크 플로우 스크립트   

- MetaDB : Airflow 메타데이터 저장소이다. 어떤 DAG가 존재하고 어떤 태스크로 구성되었는지, 어떤 태스크가 실행 중이고 
또 실행 가능한 상태인지 등의 많은 정보가 기입된다.   

- Executor : 태스크 인스턴스를 실행하는 주체이며 종류가 다양하다.   

- Worker : 실제 작업을 수행하는 주체이며 워커의 동작 방식은 Executor의 종류에 따라 상이하다.   

### 1-2) Executor의 종류 및 특징과 장단점   

앞에서 Airflow의 기본 동작 원리를 설명하면서 Airflow에 Executor라는 개념이 
있다고 언급했는데, `Executor는 작업의 한 단위인 Task를 실행 하는 주체이다.`       

Executor에는 다양한 종류가 있고 각 종류에 따라 동작 원리가 상이하다. 
현재 Airflow에는 Sequential Executor와 Debug Executor, Local Executor, Dask 
Executor, Celery Executor, Kubernetes Executor를 제공하고 있으며 
Airflow 2.0에는 CeleryKubernetes Executor가 추가되었다.   

- - - 

## 2. 설치 방법    

apache/airflow를 docker images로 로컬에서 간단하게 설치하고 테스트 할 수 있다.   


```
$ git clone https://github.com/puckel/docker-airflow
$ cd docker-airflow
$ docker pull puckel/docker-airflow 
$ docker-compose -f docker-compose-LocalExecutor.yml up -d 
또는 
$ docker-compose -f docker-compose-CeleryExecutor.yml up -d

$ docker ps // 현재 실행중인 컨테이너 확인    


```
     
자세한 사용방법은 아래 링크를 참고하자.   

<https://github.com/puckel/docker-airflow>    

그 후 local:8080을 통해 airflow web ui에 접속 가능하다.   

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


### 3-6) Airflow CLI와 Webserver를 통해 생성된 DAG 확인하기    

Airflow CLI로 방금 만든 DAG가 잘 반영되었는지 확인해보자. 원래는 airflow list_dags 명령어로 Airflow에 
등록된 DAG 목록을 출력할 수 있는데, 여기서는 Docker Compose로 띄워 놓았기 때문에 
airflow list_dags 명령어 앞에 docker-compose -f docker-compose-CeleryExecutor.yml run --rm webserver를 붙여주어야 한다.    

단, docker-airflow 위치에서 아래 명령어를 실행 한다.    

```
$ docker-compose -f docker-compose-CeleryExecutor.yml run --rm webserver airflow list_dags

-------------------------------------------------------------------
DAGS
-------------------------------------------------------------------
tutorial
tutorial_bash
```

WebServer에서도 일정 시간이 지나면 아래와 같이 tutorial_bash가 만들어진 것을 
확인 할 수 있다.   

<img width="830" alt="스크린샷 2021-03-09 오후 11 33 10" src="https://user-images.githubusercontent.com/26623547/110486957-7b2ea580-8130-11eb-8fbe-096c7872cb7a.png">    


### 3-7) DAG를 활성화하여 실행 확인하기    

만들어진 DAG는 활성화된 상태가 아니어서(Paused) 실행되지 않는다. 실행을 
위해서는 CLI나 Web UI상에서 'Off' 버튼을 눌러 'On' 상태로 변경해주어야 한다.   

`CLI Command는 airflow unpause [DAG ID] 로써 여기서는 Docker compose 명령어와 함께 아래와 같이 실행하면 된다.`    

```
> docker-compose -f docker-compose-CeleryExecutor.yml run --rm webserver airflow unpause tutorial_bash

[2020-05-16 06:04:41,772]  INFO - Filling up the DagBag from /usr/local/airflow/dags/tutorial_bash.py
Dag: tutorial_bash, paused: False
```

Web UI에서 확인하면 'Off' 였던 상태가 'On' 으로 변경되고, DAG가 실행되고 
있는 것을 볼 수 있다.   


<img width="830" alt="스크린샷 2021-03-09 오후 11 36 35" src="https://user-images.githubusercontent.com/26623547/110486979-7ff35980-8130-11eb-8eed-6f46a134aec4.png">   


DAG에서 특정 tak를 클랙했을 때 아래와 같이 팝업창을 볼수 있다. 각 task에 
대해 로그를 보거나 rendered 된 파라미터를 볼수도 있고, task 실패시 Clear 버튼을 
통해 retry 할수도 있다.   

`여기서 선택한 task 부터 다시 돌리고 싶을 경우 Future 를 선택 후 Clear를 
클릭한다.`        

<img width="709" alt="스크린샷 2021-06-03 오후 3 13 17" src="https://user-images.githubusercontent.com/26623547/120596279-84ed4e00-c47e-11eb-87b3-1c400081c3c6.png">


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
<https://leeyh0216.github.io/2020-05-16/airflow_install_and_tutorial>    
<https://www.bucketplace.com/post/2021-04-13-%EB%B2%84%ED%82%B7%ED%94%8C%EB%A0%88%EC%9D%B4%EC%8A%A4-airflow-%EB%8F%84%EC%9E%85%EA%B8%B0/>     

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

