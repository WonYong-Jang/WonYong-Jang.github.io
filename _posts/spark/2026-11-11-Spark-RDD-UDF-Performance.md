---
layout: post
title: "[Spark] PySpark에서 RDD의 mapPartitions를 이용한 Thrift 처리와 Python UDF 비교"
subtitle: RDD 기반 파티션 처리와 Python UDF 동작 방식 및 성능 비교
comments: true
categories: Spark
date: 2026-11-11
background: /img/posts/mac.png
---
현재 업무에서 Hive 테이블을 데이터 소스로 사용하는 Spark 배치를 구성하면서 Thrift 데이터를 처리할 일이 생겼다. 이에 Thrift의 기본 개념을 살펴보고, Thrift 바이너리 데이터를 Spark DataFrame 내장 연산으로 처리하는 방식과 UDF로 처리하는 방식의 동작 및 성능을 비교해 보려고 한다.

데이터 소스인 Hive 테이블에는 Base64로 인코딩된 컬럼이 있다. 이 값을 디코딩하면 Thrift로 직렬화된 바이너리 데이터를 얻을 수 있다.

이 글에서는 Python으로 Thrift 바이너리를 다루는 로직을 작성한 뒤 DataFrame에서 처리하는 방식과, 같은 로직을 UDF로 적용하는 방식을 비교한다.

> 현재 Spark Version 은 3.4 를 사용하고 있다.   

## 1. Thrift  란? 

`Apache Thrift는 서로 다른 프로그래밍 언어로 작성된 시스템이 데이터를 주고받을 수 있도록 돕는 프레임워크이다.`      
데이터 구조와 서비스 인터페이스를 언어 중립적인 IDL(Interface Definition Language) 파일에 정의하면, Thrfit 컴파일러가 각 언어에서 사용할 코드를 생성한다.   

`Thrfit 를 사용하는 이유는 데이터 구조를 한 곳에 정의하고 여러 언어에서 같은 규약으로 다룰 수 있기 때문이다.`      
예를 들어 한 시스템은 Java로 데이터를 생성하고, 다른 시스템은 Python으로 읽을 수 있다.    
데이터를 저장하거나 전송할 때는 사람이 바로 읽을 수 있는 텍스트 대신 Thrift 프로토콜로 직렬화한 바이너리를 사용할 수 있다.   

다만 Thrift 데이터는 바이너리만 보고 구조를 알아내기 어렵다. `어떤 필드가 어떤 타입인지 해석하려면 데이터를 만들 때 사용한 .thrift IDL과 프로토콜 정보를 알아야 한다.`      IDL은 필드와 타입을 정의하고, 컴파일러는 그 정의에 맞는 언어별 코드를 생성한다.   

이 글에서 다루는 사례는 Hive 테이블에 저장된 Thrift 데이터이다. 컬럼 값이 Base64로 인코딩되어 있다면 먼저 Base64를 디코딩해 바이너리를 얻고, 해당 데이터를 생성한 .thrift 정의와 프로토콜에 맞춰 역직렬화 해야 한다.

> Base64는 바이너리를 문자열로 표현하는 인코딩 방식이고, Thrift는 그 바이너리 안의 데이터 구조를 정의하는 별도의 규약이다.   


## 2. RDD 기반 파티션 처리와 Python UDF 동작 방식

두 방식 모두 Spark 클러스터에서 분산 실행되지만, PySpark 에서 동작 방식이 다르다.  

### 1-1) RDD 기반 파티션 처리



Python에서 Thrift 데이터를 읽으려면 일반적으로 해당 데이터의 .thrift 정의로 생성한 Python 코드와, 데이터를 직렬화할 때 사용한 프로토콜이 필요하다. 


```python
from thrift.protocol import TCompactProtocol
from thrift.transport import TTransport
from generated.ttypes import MyRecord

transport = TTransport.TMemoryBuffer(payload_bytes)
protocol = TCompactProtocol.TCompactProtocol(transport)

record = MyRecord()
record.read(protocol)
```



## 3. 성능 차이

### 3-1) RDD 기반 처리

mapPartitions에서 Python으로 Thrift를 처리하면 JVM과 Python worker 사이에 데이터 전달 및 직렬화 비용이 발생한다. 
다만 이 비용은 mapPartitions만의 비용은 아니다. Python UDF도 Python worker에서 실행되므로 JVM과 Python 사이의 경계를 넘는다.

이 통신은 보통 executor와 같은 머신에서 실행되는 Python 프로세스 사이의 통신이다.

### 3-2) UDF 기반 처리

Python UDF는 Spark 버전과 설정에 따라 Arrow를 통한 전달 최적화를 사용할 수 있다.   Arrow 데이터 전달, 직렬화 비용을 줄일 수 있지만 Python 함수를 실행하는 경계 자체를 없애지는 않는다.  

- - -

Reference



{% highlight ruby linenos %}
{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}
