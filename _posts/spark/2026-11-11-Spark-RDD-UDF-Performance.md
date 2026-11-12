---
layout: post
title: "[Spark] Thrift 처리 방식 비교 : PySpark RDD mapPartitions, Python UDF, Java/Hive UDF"
subtitle: Thrift 역직렬화의 실행 경로와 성능에 영향을 주는 요소
comments: true
categories: Spark
date: 2026-11-11
background: /img/posts/mac.png
---
현재 업무에서 Hive 테이블을 데이터 소스로 사용하는 Spark 배치를 구성하면서 Thrift 데이터를 처리할 일이 생겼다. 이에 Thrift의 기본 개념을 살펴보고, PySpark RDD의 mapPartitions, Python UDF, Java/Hive UDF를 이용한 처리 방식에 따른 실행 구조와 성능 특성을 비교해 보려고 한다.

데이터 소스인 Hive 테이블에는 Base64로 인코딩된 컬럼이 있다. 이 값을 디코딩하면 Thrift로 직렬화된 바이너리 데이터를 얻을 수 있다.

RDD와 Python UDF에서는 같은 Python 디코딩 함수를 사용하고, Java/Hive UDF에서는 동일한 데이터를 해석하는 로직을 Java로 구현한다.   
이를 통해 Python 디코딩을 Spark에 연결하는 방식의 차이와, 디코딩 자체를 JVM에서 실행하는 경우의 차이를 살펴본다.   

## 1. Thrift 란? 

`Apache Thrift는 서로 다른 프로그래밍 언어로 작성된 시스템이 데이터를 주고받을 수 있도록 돕는 프레임워크이다.`      
데이터 구조와 서비스 인터페이스를 언어 중립적인 IDL(Interface Definition Language) 파일에 정의하면, Thrift 컴파일러가 각 언어에서 사용할 코드를 생성한다.   

`Thrift 를 사용하는 이유는 데이터 구조를 한 곳에 정의하고 여러 언어에서 같은 규약으로 다룰 수 있기 때문이다.`      
예를 들어 한 시스템은 Java로 데이터를 생성하고, 다른 시스템은 Python으로 읽을 수 있다.    
데이터를 저장하거나 전송할 때는 사람이 바로 읽을 수 있는 텍스트 대신 Thrift 프로토콜로 직렬화한 바이너리를 사용할 수 있다.   

다만 Thrift 데이터는 바이너리만 보고 구조를 알아내기 어렵다. `어떤 필드가 어떤 타입인지 해석하려면 데이터를 만들 때 사용한 .thrift IDL과 프로토콜 정보를 알아야 한다.`      IDL은 필드와 타입을 정의하고, 컴파일러는 그 정의에 맞는 언어별 코드를 생성한다.   

이 글에서 다루는 사례는 Hive 테이블에 저장된 Thrift 데이터이다. 컬럼 값이 Base64로 인코딩되어 있다면 먼저 Base64를 디코딩해 바이너리를 얻고, 해당 데이터를 생성한 .thrift 정의와 프로토콜에 맞춰 역직렬화 해야 한다.

아래는 Compact Protocol 을 사용한 예시이다.   

```python
from thrift.protocol import TCompactProtocol
from thrift.transport import TTransport
from generated.ttypes import MyRecord

transport = TTransport.TMemoryBuffer(payload_bytes)
protocol = TCompactProtocol.TCompactProtocol(transport)

record = MyRecord()
record.read(protocol)
```

> Base64는 바이너리를 문자열로 표현하는 인코딩 방식이고, Thrift는 그 바이너리 안의 데이터 구조를 정의하는 별도의 규약이다.   


## 2. RDD 기반 처리와 Python UDF, Java/Hive UDF 의 동작 방식

PySpark에서 Thrift 데이터를 처리하는 방법으로 RDD.mapPartitions, Python UDF, Java/Hive UDF를 비교해 보자.   

`세 방식 모두 Spark 클러스터에서 분산 실행되지만, Thrift를 해석하는 코드가 실행되는 위치와 데이터를 전달하는 방식이 다르다.`   

> 여기서 Spark 3.4 환경을 기준으로 설명한다.     

### 2-1) RDD 의 mapPartitions를 이용하는 방식

DataFrame을 RDD로 변환한 뒤, mapPartitions에서 Python으로 Thrift 데이터를 해석하고 결과를 다시 DataFrame으로 만드는 방식이다.

```python
def decode_partition(rows):
	for row in rows:
		registered_ms, scheduled_ms = decode_operation_payload(
			row.op_type,
			row.raw_param2,
		)
		yield tuple(row) + (registered_ms, scheduled_ms)
		
result = spark.createDataFrame(
	operations.rdd.mapPartitions(decode_partition),
	schema=result_schema,
)
```

> decode_operation_payload는 Base64 문자열을 디코딩하고, Thrift에서 필요한 두 값을 추출하는 Python 함수라고 가정한다.

실행 흐름은 다음과 같다.  

```
executor JVM
	-> 선택한 행을 Python worker로 전달
	-> Python에서 Thrift 해석 
	-> 행의 결과를 JVM 으로 반환
	-> DataFrame 으로 후속 처리
```

`이 방식은 DataFrame에서 출발하지만, Thrift 처리는 Spark SQL 내장 연산이 아니라 PySpark RDD 연산이다.`   

mapPartitions에 전달한 함수는 파티션 단위로 호출된다. 따라서 파티션 내에서 공유할 객체를 한 번 초기화하는 구조를 만들 수 있다. 다만 위 코드에서 호출하는 디코더가 매번 transport와 protocol을 생성한다면, 해당 객체는 여전히 행마다 생성된다.  

`JVM과 Python 사이에는 데이터 전달과 직렬화 비용이 발생한다.`   

또한 RDD로 전환하면 Spark SQL 옵티마이저가 Python 로직을 넘어 원래 DataFrame 까지 이어서 최적화하는 데 한계가 생길 수 있다.
### 2-2) Python UDF를 이용하는 방식 

같은 Python 디코딩 함수를 UDF로 등록해 DataFrame의 컬럼에 적용할 수도 있다.

```python
from pyspark.sql import functions as F

decode_udf = F.udf(
	decode_operation_payload,
	'struct<registered_ms:bigint,scheduled_ms:bigint>',
)

result = operations.withColumn(
	'payload',
	decode_udf(
		F.col('op_type'),
		F.col('raw_param2'),
	)
)
```

실행 흐름은 다음과 같다.

```
executor JVM
	-> UDF 인자 컬럼을 Python worker로 전달
	-> Python에서 Thrift 해석
	-> UDF 결과를 JVM으로 반환
	-> SQL 실행 계획 안에서 후속 처리
```

`Python UDF도 Python worker에서 실행되므로 JVM과 Python 사이의 전달 비용이 있다.`     
`따라서 RDD 처리를 Python UDF로 바꾸는 것만으로 Python 실행 경계가 사라지지는 않는다.`

차이는 전달 범위와 SQL 실행 계획의 유지 여부에 있다.   
위 예시는 op_type과 raw_param2만 Python으로 전달하고 결과 두 값만 반환한다.  
`다른 컬럼은 JVM에 남겨둘 수 있다. 행 전체를 왕복시키는 앞의 RDD 구현보다 전달량을 줄일 여지가 있다.`   

`Python UDF는 SQL 실행 계획 안에 표현되지만, Spark가 함수 내부의 Thrift 해석 로직까지 분석하거나 최적화하는 것은 아니다.`   

> 추후 Pandas UDF 를 검토해봐도 좋을 것 같다.   
### 2-3) Java/Hive UDF 를 이용하는 방식 

Thrift 해석 로직을 Java의 Hive GenericUDF 인터페이스로 구현하고, 해당 클래스가 포함된 JAR을 Spark에서 사용할 수 있도록 배포한 뒤 Spark SQL 함수로 등록할 수 있다.   

> 이 방식은 Hive UDF 통합을 전제로 하므로, 클러스터의 Spark, Hive 의존성과 UDF 구현의 호환성도 확인해야 한다. 


실행 흐름은 다음과 같다.

```
executor JVM
	-> Java/Hive UDF 호출
	-> JVM에서 Thrift 해석
	-> 해석 결과 반환
	-> SQL로 후속 처리
```

`행별 Thrift 해석은 executor JVM 내부에서 실행된다. 이 처리 구간에서는 Python worker로 데이터를 전달할 필요가 없다.`   

`앞의 RDD 구현과 비교하면 JVM 과 Python 사이 데이터 전달과 Python 결과를 DataFrame으로 재구성하는 비용을 피할 수 있다.`      
`대신 Java 코드를 빌드하고, executor에서 사용할 JAR와 의존성을 배포해야 한다.`   

`Java/Hive UDF 역시 사용자 정의 함수이므로 Spark가 내장 SQL 함수처럼 분석하고 최적화하지 못한다. 성능상 기대 효과는 Python worker 왕복을 줄이고 JVM 안에서 디코딩을 수행할 수 있기 때문에 Python 실행 경계에서 발생하는 비용을 줄일 가능성이 있다.`   다만 실제 성능은 Thrift 디코딩 비용, 데이터 크기 등에 따라 달라진다.    


## 3. 성능에 영향을 주는 요소

### 3-1) RDD 기반 처리

mapPartitions에서 Python으로 Thrift를 처리하면 JVM과 Python worker 사이에 데이터 전달 및 직렬화 비용이 발생한다. 
다만 이 비용은 mapPartitions만의 비용은 아니다. Python UDF도 Python worker에서 실행되므로 JVM과 Python 사이의 경계를 넘는다.

이 통신은 보통 executor와 같은 머신에서 실행되는 Python 프로세스 사이의 통신이다.

### 3-2) Python UDF 기반 처리

Spark 3.4에서는 spark.sql.execution.pythonUDF.arrow.enabled=true로 일반 Python UDF의 JVM-Python 간 데이터 전달에 Arrow 최적화를 적용할수 있다. 이 설정은 기본적으로 비활성화 되어 있다.     

> 단, Spark 3.4 기준으로 struct 입력을 지원하지 않는다.   

Arrow는 데이터 직렬화와 전달 비용을 줄일 수 있지만, 일반 Python UDF의 함수 호출은 여전히 Python worker에서 행별로 실행된다. 


- - - 
## 4. 결론

현재 업무에서 주로 Java/Hive UDF 를 사용하고 있었고, Thrift에 대한 스키마 정의와 디코딩을 위한 Java 코드가 Jar로 빌드되어 hdfs 에 관리되고 있었다.  
이러한 방식은 스키마에 대한 정의와 디코딩에 대한 코드가 Jar로 관리되고, 빌드한 Jar를 직접 hdfs에 업로드하여 관리되므로 유지보수에 부담이 생겼다. 
따라서, 성능을 비교했을 때 큰 차이가 없는 점과 현재 사용하고 있는 PySpark 코드 내에서 관리할수 있는 장점이 있는 RDD 기반으로 진행하는 것으로 결정했다. 
추후 Pandas UDF 등도 검토해서 장점이 확인된다면 변경할 예정이다.  


- - -

Reference



{% highlight ruby linenos %}
{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}
