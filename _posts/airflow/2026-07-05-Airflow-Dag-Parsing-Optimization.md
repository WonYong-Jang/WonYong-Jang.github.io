---
layout: post
title: "[Airflow] Dag Parsing 진단 및 최적화하기"
subtitle: Dag Parsing 최적화
comments: true
categories: Airflow
date: 2026-07-05
background: /img/posts/mac.png
---
## 1. Dag 파싱 최적화

`Dag 파싱은 Airflow 의 dag processor(2.x 는 scheduler 내부에서 진행된다)가 주기적으로 Dag 폴더의 모든 .py 파일을 import 해서 Dag 객체를 만들고, 직렬화해서 Meta DB(serialized_dag 테이블)에 저장하는 과정이다.`   

기본적으로는 아래와 같이 셋팅이 되어 있다.
- min_file_processor_interval(기본 30s): 이미 알고 있는 Dag 파일을 최소 30초 간격으로 다시 파싱한다.
- dag_dir_list_interval(기본 5분, airflow3.x 에서는 refresh_interval): Dag 디렉터리(Dag Bundle)를 다시 스캔하여 새로운 파일, 삭제된 파일, 변경된 파일을 확인한다.

즉, Dag 파일은 한번 실행되는게 아니라 수십 초마다 반복 import 된다고 보면 된다. 

그래서 파싱이 느리면 아래와 같은 문제들이 생긴다.   

- 트리거 -> 실행 지연: 
- scheduler heartbeat 지연
- CPU/Memory 폭증
- dag_processing.total_parse_time 메트릭이 interval 보다 길면 파서가 못따라잡는 상태

먼저 공식문서에 [Best Practice](https://airflow.apache.org/docs/apache-airflow/stable/best-practices.html)를 살펴보자.   

### 1-1) Airlfow 3.x 변경으로 자주 혼동하는 부분

- dag processor 2.3 에서 optional 도입(standalone_dag_processor=True) -> 3.0 에서 mandatory. 더 이상 scheduler 내부에서 안돈다.
- 설정 섹션 이동: 파싱 관련 설정이 [scheduler] -> [dag_processor] 로 이동했기 때문에 옛 섹션에 두면 silent 하게 무시
- .airflowignore 기본 syntax: 2.x regex -> 3.x glob. 가장 비싼 silent breaking change
- dag_dir_list_interval: deprecated 2.x 잔재

### 1-2) 메트릭을 통해 직접 확인

직감 대신 아래 메트릭으로 부터 확인이 가능하다.
- `dag_processing.total_parse_time: 한 사이클 전체 시간`
- `dag_processing.last_duration.<filename>: 파일별 마지막 파싱시간이며, 무거운 파일 확인이 가능하다.`
- `dag_processing.last_runtime.<filename>: 파일별 last run 경과`
- `dag_processing.processes: 활성 child process 수`
- `dag_processing.processor_timeouts: timeout 카운트(cycle 평균 왜곡 원인)`

### 1-3) 인프라 설정 확인

Airflow 3.x 에서는 dag_processor 섹션을 확인해본다. 

```
airflow config get-value dag_processor parsing_processes
airflow config get-value dag_processor min_file_process_interval
airflow config get-value dag_processor file_parsing_sort_mode
```

- parsing_processes: 병렬 파서 수(기본 1)
- file_parsing_sort_mode: 파싱 우선순위. modified_time을 권장한다.(최근 변경 파일 먼저)

### 1-4) .airflowignore 와 silent breaking change

### 1-5) 코드 레벨 안티 패턴


```bash
# top-level Variable.get / Connection.get
rg "^(Variable\.get|Connection\.get)" */dags/

# top-level DB 클라이언트 인스턴스화
rg "^(PostgresClient|KISClient)\(" */dags/

# 동적 Dag 생성
rg "for .+ in .+:" */dags/ | rg "DAG\("
```

- - - 


- - -
Reference 

<https://devocean.sk.com/blog/techBoardDetail.do?page=&boardType=undefined&query=&ID=168274&searchData=&subIndex=&searchText=&techType=&searchDataSub=&searchDataMain=&comment=&p=> 


{% highlight ruby linenos %}
{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

