---
layout: post
title: "[Spark] 아파치 스파크(spark) SQL 의 Tungsten Project"
subtitle: "Spark SQL 사용시 하드웨어(cpu, memory 등) 최적화 제공"    
comments: true
categories : Spark
date: 2021-05-04
background: '/img/posts/mac.png'
---

[저번 글](https://wonyong-jang.github.io/spark/2021/05/03/Spark-DataFrame-Catalyst-Optimizer.html)에서는 
살펴봤던 Catalyst Optimizer은 실행계획 차원(소프트웨어)에서 Spark 성능을 끌어 올리기 위한 방법이며, 
    Tungsten Project 는 하드웨어(cpu, memory 등)를 효율적으로 사용할 수 있도록 하기 위한 방법이다.   

- - - 

## 1. Apache Spark Tungsten 란?   

`Project Tungsten은 Apache Spark의 성능을 책임지고 있는 아주 중요한 
프로젝트 중 하나이며, 메모리와 cpu 성능 개선에 많은 중점을 두고 있다.`      
`Apache Spark 2.x 으로 업그레이드 되면서 Phase 2 Tungsten Engine을 탑재했다.`   

Spark의 병목 현상의 원인 중 하나는 cpu이며, 그 이유는 데이터를 
compress, decompress 하거나 serialize, deserialize 하는 작업이 
cpu 자원을 많이 사용하기 때문이다.   

예를 들어 parquet와 같은 압축 포맷을 사용하면 I/O는 줄어 들 수 있지만 
데이터를 압축하거나 풀 때 cpu를 많이 사용한다.   
또한, Spark는 JVM을 기반으로 하는 scala로 개발되어 있어 
반드시 java object로 변환이 되어야 한다.   
즉, 디스크에서 읽은 데이터를 byte buffer에서 java object로 deserialize 해야 하는 
작업이 필요하다.   

이러한 이유로 Tungsten이 집중적으로 개선시키고자 하는 부분은 3가지이다.   

- Memory Management and Binary Processing   

- Cache aware computation  

- Code Generation   

### 1-1) Memory Management and Binary Processing   

JVM을 기반으로 하는 Scala는 JVM의 기능들을 그대로 사용한다.   
하나의 예로 `Scala에서 내부적으로 Java String 객체를 사용하지만 Java 객체는 메모리 오버헤드가 크다.`      
다시 말해 저장 공간을 많이 차지한다.   
예를 들어 "abcd" 를 String 객체에 저장하면 48 bytes가 필요하지만 UTF-8 로 인코딩하게 되면 단지 4 bytes 만 필요 하다.  

> 하지만, JVM 은 내부적으로 문자열을 UTF-16 으로 다룬다.   

```python
java -jar jol-cli-0.6-full.jar internals java.lang.String
# Running 64-bit HotSpot VM.
# Using compressed oop with 3-bit shift.
# Using compressed klass with 3-bit shift.
# Objects are 8 bytes aligned.
# Field sizes by type: 4, 1, 1, 2, 2, 4, 4, 8, 8 [bytes]
# Array element sizes: 4, 1, 1, 2, 2, 4, 4, 8, 8 [bytes]
 
java.lang.String object internals:
OFFSET SIZE   TYPE   DESCRIPTION     VALUE
0    4          (object header) 01 00 00 00 (00000001 00000000 00000000 00000000) (1)
4    4          (object header) 00 00 00 00 (00000000 00000000 00000000 00000000) (0)
8    4          (object header) bb 15 14 43 (10111011 00010101 00010100 01000011) (1125389755)
12    4  char[]  String.value    []
16    4  int     String.hash     0
20    4  int     String.hash32   0
Instance size: 24 bytes
Space losses: 0 bytes internal + 0 bytes external = 0 bytes total
```

위 화면은 Java String 객체의 layout schema 정보를 출력한 화면이며, 전체 size를 합하면 48 bytes를 확인할 수 있다.  

`JVM의 또 다른 이슈는 garbage collection 이다.`   
Heap 공간은 Young Generation 과 Old Generation으로 나뉜다.    
다시 Young Generation은 Eden과 Survivor Space 영역으로 구성되어 있다.   

<img width="658" alt="스크린샷 2023-12-17 오후 1 58 24" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/dba31bd2-32ad-40d5-965e-dec52e7b18f5">   

새로 만들어진 객체는 Eden 영역에 생성이 되며 계속 살아 있는 객체들은 Survivor Space으로 객체들을 이동 시키기 위해 
minor GC가 발생한다.   
그래도 여전히 Survivor Space에 살아 남은 객체들이 있다면 Old Generation으로 이동이 된다.   
Old Generation에 존재하는 객체들을 제거하기 위해 Major GC를 수행하는데 
최소한으로 그리고 길게 수행되지 않도록 튜닝 작업을 해야 한다.   
왜냐하면 모든 thread 가 Major GC가 끝날 때까지 아무일도 할 수 없기 때문이다.   

> 이를 Stop The World(STW)라고 한다.   

`Tungsten은 위에서 설명한 것처럼 Java 객체의 오버헤드와 garbage collection 문제를 해결하기 위해 sun.misc.Unsafe를 사용한다.`    
`JVM의 heap memory 영역을 사용하지 않고 native 영역 메모리를 사용함으로써 java object 오버헤드 및 GC 문제를 해결 했다.`      

sun.misc.Unsafe는 JVM에서 C-Style 의 low-level 프로그래밍을 하기 위해 사용되고 있으며, 이미 Netty, Cassandra, Akka, Neo4j 등 
유명 프로젝트에서 많이 사용되고 있다.   


### 1-2) Cache aware computation  

`Cache-aware Computation은 CPU L1/L2/L3 cache를 개선해서 데이터 처리 속도를 높이려는 목적이 있다.`        
Spark를 프로파일링 해본 결과 CPU 시간이 main memory로 부터 데이터가 전송되기 까지 기다리는 시간이 
대부분 이였기 때문이다.   
Project Tungsten은 cache-locality를 개선하기 위해 cache에 최적화된 [Alpha Sort](https://www.microsoft.com/en-us/research/publication/alphasort-a-cache-sensitive-parallel-external-sort/?ranMID=24542&ranEAID=TnL5HPStwNw&ranSiteID=TnL5HPStwNw-sDGLoo7qajYenc3DqPRbYg&epi=TnL5HPStwNw-sDGLoo7qajYenc3DqPRbYg&irgwc=1&OCID=AIDcmm549zy227_aff_7593_1243925&tduid=%28ir__ydh69tgju0kfdydfoy2blyj0gv2x9xw33bhjidyr00%29%287593%29%281243925%29%28TnL5HPStwNw-sDGLoo7qajYenc3DqPRbYg%29%28%29&irclickid=_ydh69tgju0kfdydfoy2blyj0gv2x9xw33bhjidyr00)
알고리즘을 사용했다.   

<img width="552" alt="스크린샷 2023-12-17 오후 1 31 58" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/a8c6094c-ab4c-4b74-becf-9a03ec31c1b2">   

위의 그림처럼 일반적인 데이터 정렬 작업시 레코드에 대한 포인터의 배열을 저장한다.   

> 왼쪽 사각형이 포인터   

비교 작업은 메모리에 임의에 위치한 레코드를 가리키는 두 포인터를 참조해야 하기 때문에 
캐쉬 적중률이 낮다.   

<img width="545" alt="스크린샷 2023-12-17 오후 1 32 05" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/f1ed094d-a813-4e03-9932-dab29ee06bbd">   

Alpha sort에서 고안한 방법은 레코드의 정렬키를 포인터와 같이 저장하는 방법이다.   
비교 작업시 레코드를 가리키는 포인터를 참조하지 않아도 되기 때문에 cache locality를 개선 시킬 수 있어 
속도 향상을 기대할 수 있다.   


### 1-3) Code Generation  

`Spark 1.x 버전까지는 아래 쿼리를 evaluation 하기 위해 DBMS 에서 표준처럼 사용하고 있는 Valcano Model을 사용했다.`       

```sql
SELECT COUNT(*) FROM store_sales WHERE ss_item_sk = 1000
```   

Volcano Model 에서 쿼리는 여러 operator로 구성이 되고 하나의 튜플을 다음 연산자로 
반환하는 next 인터페이스가 있다.    

```scala
class Filter(child: Operator, predicate: (Row = Boolean))extends Operator {
 
def next(): Row = {
    var current = child.next()
    while (current == null || predicate(current)) {
        current = child.next()
    }
    return current
    }
}
```

만약에 대학교에 갓 입학한 컴퓨터 공학 학생들에게 위의 쿼리를 코딩 하라고 하면 아마 아래처럼 코딩할 가능성이 크다.   
무척이나 간단해 보이지만 성능 측면에서는 위에서 설명한 Volcano model 보다 훨씬 빠르게 수행된다.   

```scala
var count = 0
for (ss_item_sk in store_sales) {
    if (ss_item_sk == 1000) {
        count += 1
    }
}
```

그 이유는 Volcano model은 여러 이슈가 있지만 그 중에서 polymorphic function dispatches 문제 때문이다.   
Scala 컴파일 시에는 Operator interface의 next 메소드를 확인하지만 런타임시에는 Operator interface의 next를 
구현한 Filter 클래스의 next를 확인한다.   
이처럼 Scala 에서는 어떤 메소드를 실행 시킬지 결정하기 위해 virtual table(vtable)을 관리하는데 이를 
확인하는 행위 자체가 매우 느리다. 하지만 갓 입학한 대학생이 만든 코드는 
오로지 하나의 메소드에서 모든 것을 구현하고 있기 때문에 vtable을 검색하는 행위가 없어 수행속도가 오히려 
빠르다.   

> Volcano model 은 아주 오랫동안 사용했던 general 한 표준 모델이며, 어떠한 SQL 쿼리라도 실행이 가능 하도록 설계되어 있다.   
> 하지만, 기본적으로 현대 컴파일러의 우수한 기능들을 사용하고 있지는 않는다.    

아래 표에서 결과를 확인할 수 있다.   

<img width="658" alt="스크린샷 2023-12-17 오후 1 44 06" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/5d93276f-03d7-4b39-8c2e-15b825171c88">

`이러한 이유 때문에 Tungsten은 대학생의 코딩 스타일을 generation 하고 굉장히 가볍고 컴파일이 빠른 Janino compiler를 
이용해서 JVM byte 코드를 생성한다.`       
`Volcano model 처럼 operator를 나누는 것이 아니라 하나의 메소드 안에서 모든 것이 수행 될 수 있도록 하여 최적화를 진행한다.`      

`즉, Tungsten 의 최적화 중에 하나인 Code Generation은
Spark SQL로 작성한 코드를 최적화된 코드로 Generation 해주며 컴파일하여 RDD로 실행하게 해준다.`   


- - - 

## 2. 마무리    

Project Tungsten는 Spark 1.4 에서 처음 소개 되었으며, 
[SPARK-10309](https://issues.apache.org/jira/browse/SPARK-10309) 와 같이 
issue가 발견되어 tungsten 옵션을 비활성화 하기도 하였다.   

> Spark 1.6에서는 이러한 이슈가 해결된 것처럼 보이지만 여전히 성능 향상은 
크게 없었다.   

```
spark.sql.tungsten.enabled=false
```

하지만 Spark 2.0 부터 아래와 같이 성능 향상이 크게 되었다.    

<img width="600" alt="스크린샷 2023-12-17 오후 2 54 47" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/cdccd293-2f6b-4b76-9048-20e95f6e7b81">   

추가적으로 Spark 3.0 부터는 [Adaptive Query Execution](https://www.databricks.com/blog/2020/05/29/adaptive-query-execution-speeding-up-spark-sql-at-runtime.html), 
[Dynamic Partition Pruning](https://www.waitingforcode.com/apache-spark-sql/whats-new-apache-spark-3-dynamic-partition-pruning/read) 등 많은 부분이 
추가적으로 개선이 되었으니 참고해보자.   

- - - 

**Reference**    

<https://yeo0.tistory.com/entry/Spark-Core-of-Spark-SQL-Engine-Catalyst-Optimizer-Tungsten>   
<https://younggyuchun.wordpress.com/2017/01/31/spark-%EC%84%B1%EB%8A%A5%EC%9D%98-%ED%95%B5%EC%8B%AC-project-tungsten-%ED%86%BA%EC%95%84%EB%B3%B4%EA%B8%B0/>   
<https://1ambda.blog/2021/12/27/practical-spark-10/>  
<https://mallikarjuna_g.gitbooks.io/spark/content/spark-sql-tungsten.html>
<https://www.databricks.com/blog/2015/04/28/project-tungsten-bringing-spark-closer-to-bare-metal.html>   
<https://www.databricks.com/blog/2020/06/18/introducing-apache-spark-3-0-now-available-in-databricks-runtime-7-0.html>   

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

