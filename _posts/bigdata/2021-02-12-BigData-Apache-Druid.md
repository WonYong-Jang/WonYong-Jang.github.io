---
layout: post
title: "[Druid] Apache Druid"
subtitle: "아파치 Druid 설치 및 데이터 로드하고 쿼리 학습하기"    
comments: true
categories : BigData
date: 2021-02-12
background: '/img/posts/mac.png'
---

# Apache Druid 란?  

Apache Druid는 대규모 데이터 세트에 대한 빠른 조각 분석을 위해 설계된 
실시간 분석 데이터베이스이다. Druid는 실시간 수집(real-time ingest), 빠른 쿼리 성능(fast query performance) 및 
높은 가동 시간(uptime)이 중요한 경우를 지원하기 위한 데이터베이스로 
가장 자주 사용된다.    
따라서, Druid는 일반적으로 분석 어플리케이션의 GUI를 지원하거나 
빠른 집계가 필요한 동시성 높은 API 백엔드로 사용된다.   

- - - 

## Quickstart   

[druid.apache.org](https://druid.apache.org/docs/latest/tutorials/index.html)를 참고하였고 
Quickstart를 통해 Apache druid를 설치해보고 sample data를 통해서 실습해보자.   

> Druid는 공식적으로 자바 8만을 지원한다. 자바 최신버전에 대한 지원은 현재 실험 단계에 있다.   
> Linux, Mac OS X, or other Unix-like OS(Windows is not supported)   

> Druid relies on the environment variables JAVA_HOME or DRUID_JAVA_HOME

#### Step 1. Intall Druid 

[0.20.1 release](https://www.apache.org/dyn/closer.cgi?path=/druid/0.20.1/apache-druid-0.20.1-bin.tar.gz) 를 설치하고 
아래를 참고하여 압축을 푼다.   

```
$ tar -xzf apache-druid-0.20.1-bin.tar.gz
$ cd apache-druid-0.20.1
```

디렉토리 안에는 LICENSE 와 NOTICE파일들 그리고 실행 파일, configuration files, sample data 등이 있다.   

#### Step 2. Start up Druid services   

아래 명령을 이용하여 micro-quickstart를 실행하자.   

```
$ ./bin/start-micro-quickstart
```

```
$ ./bin/start-micro-quickstart
[Fri May  3 11:40:50 2019] Running command[zk], logging to[/apache-druid-0.20.1/var/sv/zk.log]: bin/run-zk conf
[Fri May  3 11:40:50 2019] Running command[coordinator-overlord], logging to[/apache-druid-0.20.1/var/sv/coordinator-overlord.log]: bin/run-druid coordinator-overlord conf/druid/single-server/micro-quickstart
[Fri May  3 11:40:50 2019] Running command[broker], logging to[/apache-druid-0.20.1/var/sv/broker.log]: bin/run-druid broker conf/druid/single-server/micro-quickstart
[Fri May  3 11:40:50 2019] Running command[router], logging to[/apache-druid-0.20.1/var/sv/router.log]: bin/run-druid router conf/druid/single-server/micro-quickstart
[Fri May  3 11:40:50 2019] Running command[historical], logging to[/apache-druid-0.20.1/var/sv/historical.log]: bin/run-druid historical conf/druid/single-server/micro-quickstart
[Fri May  3 11:40:50 2019] Running command[middleManager], logging to[/apache-druid-0.20.1/var/sv/middleManager.log]: bin/run-druid middleManager conf/druid/single-server/micro-quickstart
```

클러스터 메타 데이터 저장소 및 서비스 세그먼트와 같은 모든 persistent state는 
Druid 루트 디렉터리 하위의 var 디렉터리에 보관된다. 위의 시작 스크립트에 
출력에 표시된 것처럼 각 서비스는 var/sv 아래의 로그파일에 기록한다.   

언제든지 전체 var 디렉토리를 삭제하여 Druid를 원래 설치 후 상태로 되돌릴 수도 있다.   
시작 스크립트를 종료하기 위해서는 스크립트에서  CTRL+C를 이용하여 종료한다.   

#### Step 3. Open the Druid console   

After the Druid services finish startup, open the Druid console at http://localhost:8888.   

<img width="800" alt="스크린샷 2021-02-12 오후 7 05 51" src="https://user-images.githubusercontent.com/26623547/107755220-dfdf2600-6d65-11eb-8013-df0a800cd9cf.png">   

#### Step 4. Load data   

샘플데이터를 로드해보자.  

###### 1) 헤더에 위치해있는 Load data 버튼을 클릭한다.     

###### 2) Local disk 클릭 후 Connect data 클릭한다.    

###### 3) 아래와 같이 경로 입력한다.     

<img width="800" alt="스크린샷 2021-02-13 오후 3 39 18" src="https://user-images.githubusercontent.com/26623547/107843847-b976c480-6e11-11eb-9be0-c60422dc585e.png">   

    - Base directory : quickstart/tutorial/   
    - File filter : wikiticker-2015-09-12-sampled.json.gz   

###### 4) Click Apply    

```
quickstart/tutorial/wikiticker-2015-09-12-sampled.json.gz
```

<img width="800" alt="스크린샷 2021-02-12 오후 7 15 11" src="https://user-images.githubusercontent.com/26623547/107756113-149fad00-6d67-11eb-8951-bc2c30a69caa.png">   

base directory를 입력하고 File filter에 와일드 카드를 입력하면 한번에 
여러 파일 선택할 수 있다.     

Apply 버튼을 클릭하면 아래와 같이 raw data가 로드 된것을 볼 수 있다.   

<img width="800" alt="스크린샷 2021-02-12 오후 7 25 37" src="https://user-images.githubusercontent.com/26623547/107757174-8fb59300-6d68-11eb-971c-d71bce7ca68c.png">   

###### 5) Click Next: parse data   

데이터 로더는 데이터 형식에 적합한 파서를 자동으로 결정하려고 한다. 이 경우 
오른쪽 하단의 input format 이 json으로 표시되었기 때문에 json으로 식별한다.   

<img width="800" alt="스크린샷 2021-02-12 오후 7 35 02" src="https://user-images.githubusercontent.com/26623547/107757859-73febc80-6d69-11eb-9e54-badb78b1cad7.png">   

다른 input format 옵션을 자유롭게 선택하여 구성 설정과 Druid가 다른 유형의 
데이터를 어떻게 구문 분석하는지도 이처럼 확인해 보면된다.   


###### 6) Json 구문 분석기를 선택한 상태에서 Click next: Parse time을 클릭한다.   

구문 분석 시간설정은 데이터의 기본 타임 스탬프 열을 보고 조정할 수 있는 곳이다.   

<img width="800" alt="스크린샷 2021-02-12 오후 7 46 03" src="https://user-images.githubusercontent.com/26623547/107758971-f8057400-6d6a-11eb-8aee-dc273a464be0.png">   

Druid는 데이터에 기본 타임스탬프 열이 있어야 한다. 데이터에 타임 스탬프가 없는 
경우 Constant value를 선택해야 한다. 이 예제에서는 타입스탬프가 열에 있기 때문에 
From column을 선택했다.    

###### 7) Click Next: Transform, Next: Filter, and then Next: Configure schema, skipping a few steps.   

이 tutorial에서 수집 시간 변환 및 필터 적용은 가이드의 범위를 벗어나므로 
transformation 이나 filtering settings를 조정할 필요 없다.    

###### 8) Configure schema settings은 수집되는 측정 기준 및 측정 항목을 구성하는 곳이다. 

이 구성의 결과는 수집 후 데이터가 Druid에 어떻게 표시되는지를 나타낸다.  

데이터 세트가 매우 작기 때문에 [rollup](https://druid.apache.org/docs/latest/ingestion/index.html#rollup) 스위치 설정 해제하고 메시지가 표시되면 
변경 사항을 확인하여 rollup을 끌 수 있다.   

<img width="800" alt="스크린샷 2021-02-12 오후 7 55 17" src="https://user-images.githubusercontent.com/26623547/107760737-97c40180-6d6d-11eb-9d69-c8a57274290b.png">   

###### 9) Click Next: Partition to configure how the data will be split into segments.  

이경우에는는 Segment granularity에 DAY를 선택한다.    

<img width="800" alt="스크린샷 2021-02-12 오후 8 07 14" src="https://user-images.githubusercontent.com/26623547/107761146-3b151680-6d6e-11eb-8ac2-52123bc14951.png">  

작은 데이터 세트이기 때문에 세그먼트 단위를 DAY로 
선택하여 제공될수 있도록 조정할 수 있다. 

###### 10) Click Next: Tune and Next: Publish     

###### 11) Publish Setting에서 Datasource name을 변경할 수 있다.    

default name인 wikiticker-2015-09-12-sampled 에서 wikipedia로 변경해보자.   

<img width="800" alt="스크린샷 2021-02-12 오후 8 16 13" src="https://user-images.githubusercontent.com/26623547/107761794-4ae12a80-6d6f-11eb-964d-2b6b665c63ed.png">   

###### 12) Click Next: Edit spec   

데이터 로더로 구성한 수집 사양을 검토한다.   

<img width="800" alt="스크린샷 2021-02-12 오후 8 18 01" src="https://user-images.githubusercontent.com/26623547/107761961-9693d400-6d6f-11eb-881e-20c02b195c55.png">   

자유롭게 이전단계에서 설정을 변경하여 사양이 어떻게 업데이트 되는지 
확인 가능하다.  

###### 13) 사양을 모두 확인하였으면 Submit 클릭   

<img width="800" alt="스크린샷 2021-02-12 오후 8 25 12" src="https://user-images.githubusercontent.com/26623547/107762593-9942f900-6d70-11eb-868c-771656c016b5.png">    

작업이 완료됨과 동시에 SUCCESS라는 메시지를 볼 수 있다. 이 보기는 자동으로 refresh가 되므로 
상태 보기를 위해 브라우저를 새로 고침 할 필요는 없다.   

이제 하나 이상의 세그먼트가 구축되었으며 데이터 서버에서 선택되었음을 의미한다.   

#### Step 5. Query the data   

아래와 같이 쿼리를 이용하여 데이터를 확인 할 수 있다.   

###### 1) Click Datasources form the console header.  

Datasource name인 wikipedia를 확인 할 수 있다. 또한, Availability column에서 
Fully available로 보이면 쿼리를 날릴 수 있다.   

###### 2) datasource가 이용가능할 때 Actions 에 있는 아이콘을 클릭하고 Query with SQL을 선택한다.  

<img width="800" alt="스크린샷 2021-02-12 오후 8 36 10" src="https://user-images.githubusercontent.com/26623547/107763436-f9866a80-6d71-11eb-8825-30cad33b2ec4.png">    

###### 3) 쿼리 를 입력하고 결과를 확인한다.  


<img width="800" alt="스크린샷 2021-02-12 오후 8 38 54" src="https://user-images.githubusercontent.com/26623547/107763697-613cb580-6d72-11eb-8ee0-8c4ae3c53c88.png">   

- - - 

## Querying data 

이제 SQL을 사용해서 아파치 Druid에서 어떻게 쿼리 데이터를 보여주는지 알아보자.   

### Query SQL from the Druid console   

Druid 콘솔에는 쿼리를 쉽게 빌드 및 테스트하고 결과를 볼수 있는 view를 제공한다.   

###### 1) Start up the Druid cluster   

###### 2) Click Query from the header to open the Query view   


<img width="800" alt="스크린샷 2021-02-13 오후 4 01 55" src="https://user-images.githubusercontent.com/26623547/107844391-4f145300-6e16-11eb-867d-41229f4aa414.png">   

위처럼 쿼리를 작성하여 데이터를 확인 할 수 있다.   

###### 3) 왼쪽 pane에서 wikipedia datasource 트리를 확장해라.   

우리 page dimension에 대한 쿼리를 만들수 있다.   

###### 4) Click page and then Show:page from the menu   

<img width="800" alt="스크린샷 2021-02-13 오후 4 19 32" src="https://user-images.githubusercontent.com/26623547/107844518-496b3d00-6e17-11eb-9cfc-0f19d6ad3736.png">   

SELECT 쿼리가 보이고 즉시 실행된다. 만약 아무 데이터가 보이지 않는다면 아래를 확인하고 
정상적으로 나온다면 다음 step으로 넘어가면 된다.   

default로 데이터에 대한 쿼리 filter가 마지막 날의 데이터를 필터링 하지만 
데이터는 그보다 더 오래 되었기 때문에 필터를 제거 하면 된다.   

```
datasource tree에서 _time을 클릭 하고 Remove Filter를 클릭한다.  
```

##### 5) Click Run to run the query.  

데이터의 2개의 컬럼(page, count)을 볼수 있다.   

<img width="800" alt="스크린샷 2021-02-13 오후 4 35 59" src="https://user-images.githubusercontent.com/26623547/107844768-b1228780-6e19-11eb-91da-436fbcdab1c9.png">   

결과들은 콘솔에서 default로 100개로 제한된다.    
위 사진에 보이는 Smart query limit 이 활성화 되어 있기 때문에 
실수로 방대한 양의 쿼리를 리턴하는 것을 방지하기 위해 사용된다.   

###### 6) 다양한 쿼리를 변경하여 연습해보자.   

다양한 쿼리 문법은 [Aggregation functions](https://druid.apache.org/docs/latest/querying/sql.html#aggregation-functions) 를 참고하자.   

또한 왼쪽 pane 에 보이는 각 컬럼들을 클릭해보면 Filter가 나오게 된다. 
Filter를 확인해보면 각 컬럼 별로 사용할 수 있는 where 조건에 대해 
힌트를 주어 참고 할 수 있다.   

<img width="800" alt="스크린샷 2021-02-13 오후 5 09 08" src="https://user-images.githubusercontent.com/26623547/107845364-3b6cea80-6e1e-11eb-8852-967f4165cdcd.png">   


###### 7) Explain SQL Query.    

내부적으로 모든 Druid SQL query 는 데이터 노드에서 실행전에 JSON 기반 
Druid 기본 쿼리 형식의 쿼리로 변환된다.   

Druid SQL는 복잡한 쿼리를 작성하고 성능 문제를 해결하는데 유용하게 사용된다. 
자세한 내용은 [Native queries](https://druid.apache.org/docs/latest/querying/querying.html)를 참고하자.   

Run 버튼 옆에 있는 `...`를 클릭후 Explain SQL Query를 선택한다.   

<img width="800" alt="스크린샷 2021-02-13 오후 5 26 08" src="https://user-images.githubusercontent.com/26623547/107845667-956eaf80-6e20-11eb-95a7-5c1db906daf5.png">   

explain plan을 확인 할수 있는 또 다른 방법은 EXPLAIN PLAN FOR 를 쿼리 
맨위에 추가한다. 아래를 확인해보자.   


```
EXPLAIN PLAN FOR
SELECT
 "page",
 "countryName",
 COUNT(*) AS "Edits"
FROM "wikipedia"
WHERE "countryName" IS NOT NULL
GROUP BY 1, 2
ORDER BY "Edits" DESC
```

`이 방법은 특히 HTTP 또는 command line에서 쿼리를 실행할 때 유용하다.`   

###### 8) Edit conext   

마지막으로 `...` 을 클릭 후 Edit context를 선택하면 쿼리 실행을 제어하는 
추가 매개 변수를 추가할 수 있다.   
[Context flags](https://druid.apache.org/docs/latest/querying/query-context.html)를 참고하여 쿼리 컨텍스트 옵션을 
JSON 키-값 쌍으로 입력 할 수 있다.   

- - - 

### More Druid SQL examples   

아래 더 다양한 쿼리를 확인해 보자.   

```
SELECT FLOOR(__time to HOUR) AS HourTime, SUM(deleted) AS LinesDeleted
FROM wikipedia WHERE "__time" BETWEEN TIMESTAMP '2015-09-12 00:00:00' AND TIMESTAMP '2015-09-13 00:00:00'
GROUP BY 1
```

```
SELECT channel, page, SUM(added)
FROM wikipedia WHERE "__time" BETWEEN TIMESTAMP '2015-09-12 00:00:00' AND TIMESTAMP '2015-09-13 00:00:00'
GROUP BY channel, page
ORDER BY SUM(added) DESC
```

- - - 

### Other ways to invoke SQL queries   

Druid 패키지에는 Druid 클라이언트가 존재 한다.   
아래 명령으로 Druid 클라이언트를 실행 시킨다.   

```
$ ./bin/dsql

Welcome to dsql, the command-line client for Druid SQL.
Type "\h" for help.
dsql>
```   

```
dsql> SELECT page, COUNT(*) AS Edits FROM wikipedia WHERE "__time" BETWEEN TIMESTAMP '2015-09-12 00:00:00' AND TIMESTAMP '2015-09-13 00:00:00' GROUP BY page ORDER BY Edits DESC LIMIT 10;
┌──────────────────────────────────────────────────────────┬───────┐
│ page                                                     │ Edits │
├──────────────────────────────────────────────────────────┼───────┤
│ Wikipedia:Vandalismusmeldung                             │    33 │
│ User:Cyde/List of candidates for speedy deletion/Subpage │    28 │
│ Jeremy Corbyn                                            │    27 │
│ Wikipedia:Administrators' noticeboard/Incidents          │    21 │
│ Flavia Pennetta                                          │    20 │
│ Total Drama Presents: The Ridonculous Race               │    18 │
│ User talk:Dudeperson176123                               │    18 │
│ Wikipédia:Le Bistro/12 septembre 2015                    │    18 │
│ Wikipedia:In the news/Candidates                         │    17 │
│ Wikipedia:Requests for page protection                   │    17 │
└──────────────────────────────────────────────────────────┴───────┘
Retrieved 10 rows in 0.06s.
```

- - - 

### Query SQL over HTTP   

Druid는 HTTP를 통해 Druid Broker에 직접 쿼리를 제출 할 수 있다.   

tutorial package에 SQL query를 이미 포함 하고 있어서 
이를 이용하여 실습을 해보자    

```
// quickstart/tutorial/wikipedia-top-pages-sql.json 내용은 
// 아래와 같은 쿼리가 있다.   
{
  "query":"SELECT page, COUNT(*) AS Edits FROM wikipedia WHERE \"__time\" BETWEEN TIMESTAMP '2015-09-12 00:00:00' AND TIMESTAMP '2015-09-13 00:00:00' GROUP BY page ORDER BY Edits DESC LIMIT 10"
}
```

```
// 경로 : quickstart/tutorial/wikipedia-top-pages-sql.json   
// -X : Reqeust 사용할 method 종류(GET, POST, PUT, PATCH, DELETE)   
// -H : Header 
// -d : HTTP Post data 
// file을 POST할 경우 file name 앞에 @ 를 붙여줌   

$ curl -X 'POST' -H 'Content-Type:application/json' -d @quickstart/tutorial/wikipedia-top-pages-sql.json http://localhost:8888/druid/v2/sql
```

Druid 폴더 위치에서 위와 같은 명령을 입력하면 아래와 같이 결과를 볼 수 있다.   



Output 

```
[
  {
    "page": "Wikipedia:Vandalismusmeldung",
    "Edits": 33
  },
  {
    "page": "User:Cyde/List of candidates for speedy deletion/Subpage",
    "Edits": 28
  },
  {
    "page": "Jeremy Corbyn",
    "Edits": 27
  },
  {
    "page": "Wikipedia:Administrators' noticeboard/Incidents",
    "Edits": 21
  },
  {
    "page": "Flavia Pennetta",
    "Edits": 20
  },
  {
    "page": "Total Drama Presents: The Ridonculous Race",
    "Edits": 18
  },
  {
    "page": "User talk:Dudeperson176123",
    "Edits": 18
  },
  {
    "page": "Wikipédia:Le Bistro/12 septembre 2015",
    "Edits": 18
  },
  {
    "page": "Wikipedia:In the news/Candidates",
    "Edits": 17
  },
  {
    "page": "Wikipedia:Requests for page protection",
    "Edits": 17
  }
]
```

- - - 


**Reference**    

<https://druid.apache.org/docs/latest/tutorials/tutorial-query.html>   
<https://druid.apache.org/docs/latest/tutorials/index.html>  
<https://druid.apache.org/docs/latest/design/index.html>   


{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

