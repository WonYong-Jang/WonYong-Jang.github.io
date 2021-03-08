---
layout: post
title: "[Airflow] 아파치 Airflow - Workflow "
subtitle: "DAG(Directed Acyclic Graph) / 데이터 워크 플로우 관리 도구/ execution_date 의미  "    
comments: true
categories : BigData
date: 2021-03-08
background: '/img/posts/mac.png'
---

# Apache Airflow   

빅데이터 분석이나, 머신러닝 코드를 만들다 보면 필요한것 중에 하나가 
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

#### Apache Airflow 기본 동작 원리   

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

#### Executor의 종류 및 특징과 장단점   

앞에서 Airflow의 기본 동작 원리를 설명하면서 Airflow에 Executor라는 개념이 
있다고 언급했는데, `Executor는 문자 그대로 작업의 한 단위인 태스크 인스턴스를 
실행하는 주체이다.`    

Executor에는 다양한 종류가 있고 각 종류에 따라 동작 원리가 상이하다. 
현재 Airflow에는 Sequential Executor와 Debug Executor, Local Executor, Dask 
Executor, Celery Executor, Kubernetes Executor를 제공하고 있으며 
Airflow 2.0에는 CeleryKubernetes Executor가 추가되었다.   

- - - 

## 설치 방법    

apache/airflow를 docker images로 로컬에서 간단하게 설치하고 테스트 할 수 있다.   


```
git clone https://github.com/puckel/docker-airflow
cd docker-airflow
docker pull puckel/docker-airflow 
docker-compose -f docker-compose-LocalExecutor.yml up -d 
```
     
자세한 사용방법은 아래 링크를 참고하자.   

<https://github.com/puckel/docker-airflow>    

그 후 local:8080을 통해 airflow web ui에 접속 가능하다.   

- - - 

## execution_date 주의 사항   

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

**Reference**    

<https://blog.naver.com/gyrbsdl18/221561318823>   
<https://zzsza.github.io/data/2018/01/04/airflow-1/>    
<https://medium.com/@aldente0630/%EC%95%84%ED%8C%8C%EC%B9%98-%EC%97%90%EC%96%B4%ED%94%8C%EB%A1%9C%EC%9A%B0%EB%A1%9C-%EC%9E%91%EC%97%85%ED%9D%90%EB%A6%84-%EA%B0%9C%EB%B0%9C%ED%95%B4%EB%B3%B4%EA%B8%B0-8f3653d749b4>   
<https://engineering.linecorp.com/ko/blog/data-engineering-with-airflow-k8s-1/>    
<https://bomwo.cc/posts/execution_date/>   

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

