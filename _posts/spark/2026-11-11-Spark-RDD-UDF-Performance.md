---
layout: post
title: "[Spark] Thrift 처리 방식 비교 : PySpark RDD mapPartitions, Python UDF, Java로 구현한 Hive GenericUDF"
subtitle: PySpark에서 Thrift 역직렬화의 실행 경로와 성능에 영향을 주는 요소
comments: true
categories: Spark
date: 2026-11-11
background: /img/posts/mac.png
---
현재 업무에서 Hive 테이블을 데이터 소스로 사용하는 Spark 배치를 구성하면서 Thrift 데이터를 처리할 일이 생겼다. 이에 Thrift의 기본 개념을 살펴보고, PySpark RDD의 mapPartitions, Python UDF, Java로 구현한 Hive GenericUDF를 이용한 처리 방식에 따른 실행 구조와 성능 특성을 비교해 보려고 한다.

데이터 소스인 Hive 테이블에는 Base64로 인코딩된 컬럼이 있다. 이 값을 디코딩하면 Thrift로 직렬화된 바이너리 데이터를 얻을 수 있다.

RDD와 Python UDF에서는 같은 Python 디코딩 함수를 사용하고, GenericUDF에서는 동일한 역할을 하는 로직을 Java로 구현한다.   
이를 통해 Python 디코딩을 Spark에 연결하는 방식의 차이와, 디코딩 자체를 JVM에서 실행하는 경우의 차이를 살펴본다.   

- - - 
## 1. Thrift 란? 

`Apache Thrift는 서로 다른 프로그래밍 언어로 작성된 시스템이 데이터를 주고받을 수 있도록 돕는 프레임워크이다.`      
데이터 구조와 서비스 인터페이스를 언어 중립적인 IDL(Interface Definition Language) 파일에 정의하면, Thrift 컴파일러가 각 언어에서 사용할 코드를 생성한다.   

`Thrift 를 사용하는 이유는 데이터 구조를 한 곳에 정의하고 여러 언어에서 같은 규약으로 다룰 수 있기 때문이다.`      
예를 들어 한 시스템은 Java로 데이터를 생성하고, 다른 시스템은 Python으로 읽을 수 있다.    
데이터를 저장하거나 전송할 때는 사람이 바로 읽을 수 있는 텍스트 대신 Thrift 프로토콜로 직렬화한 바이너리를 사용할 수 있다.   

다만 Thrift 데이터는 바이너리만 보고 구조를 알아내기 어렵다. `어떤 필드가 어떤 타입인지 해석하려면 데이터를 만들 때 사용한 .thrift IDL과 프로토콜 정보를 알아야 한다.`      
IDL은 필드와 타입을 정의하고, 컴파일러는 그 정의에 맞는 언어별 코드를 생성한다.   

이 글에서 다루는 사례는 Hive 테이블에 저장된 Thrift 데이터이다. 컬럼 값이 Base64로 인코딩되어 있다면 먼저 Base64를 디코딩해 Thrift 바이너리를 얻고, 해당 데이터를 생성한 .thrift 정의와 프로토콜에 맞춰 역직렬화 해야 한다.   

> Base64는 바이너리를 문자열로 표현하는 인코딩 방식이고, Thrift는 그 바이너리 안의 데이터 구조를 정의하는 별도의 규약이다.   


- - - 

## 2. RDD 기반 처리와 Python UDF, Java/Hive UDF 의 동작 방식

PySpark에서 Thrift 데이터를 처리하는 방법으로 RDD.mapPartitions, Python UDF, Java/Hive UDF를 비교해 보자.   

`세 방식 모두 Spark 클러스터에서 분산 실행되지만, Thrift를 해석하는 코드가 실행되는 위치와 데이터를 전달하는 방식이 다르다.`   

> 여기서 Spark 3.4 환경을 기준으로 설명한다.     
> 예시 코드는 MessageSchedule에서 제공하는 예약 시간과 등록 시간을 이용한다.   

### 2-1) RDD 의 mapPartitions를 이용하는 방식(DataFrame)

DataFrame을 RDD로 변환한 뒤, mapPartitions에서 Python으로 Thrift 데이터를 해석하고 결과를 다시 DataFrame으로 만드는 방식이다.

```python
def decode_operation_payload(encoded):
	# Extract registration and scheduled timestamps using the generated thrift schema
	# 실제 디코딩이 필요한 시점에만 생성 패키지를 로드 하도록 
	from ScheduledMessage.ttypes import ScheduledMessageOP
	
	# Thrift 프로토콜이 바이너리를 읽을 수 있게 전달하는 역할
	transport = TMemoryBuffer(base64.b64decode(encoded, validate=True))
	
	# IDL 에서 생성한 클래스
	message = ScheduledMessageOP()
	# Thrift 런타임이 제공하는 프로토콜로 데이터 읽기   
	# protocol은 데이터 생성할 때 사용한 것과 일치해야 한다.   
	message.read(TCompactProtocol(transport)) 
	return message.registeredTime, message.scheduled.initialScheduledTime
```

read()는 바이너리를 Thrift 객체로 역직렬화 한다.

```python
def decode_partition(rows):
	for row in rows:
		registered_ms, scheduled_ms = decode_operation_payload(
			row.op_type, row.raw_param2,
		)
		yield tuple(row) + (registered_ms, scheduled_ms)
		
result = spark.createDataFrame(
	operations.rdd.mapPartitions(decode_partition),
	schema=result_schema,
)
```

`또한, IDL에서 생성한 Python 코드와 Thrift 패키지를 하나의 ZIP으로 묶어 spark-submit --py-files로 전달한다.`   

```sh
# ScheduledMessageOP.thrift 파일을 읽어 Python에서 사용할 Thrift 코드를 생성
$ thrift -r --gen py ScheduledMessageOP.thrift
```


```
dependencies.zip
├── thrift/                 # Thrift Python 런타임
├── ScheduledMessageOP/     # IDL에서 생성한 Python 패키지
│   ├── __init__.py
│   ├── ttypes.py
│   └── constants.py        # 생성된 경우
└── util/                   # 함께 배포할 유틸리티 패키지
    └── __init__.py
```

`ttypes.py 는 IDL 에 정의된 데이터 구조를 Thrift 컴파일러로 생성한 Python 코드이다.`   
IDL의 struct에 대응하는 클래스와 직렬화, 역직렬화 코드를 포함한다. 

```python
class ScheduleMessageOP:
	def __init__(self, ...):
		self.registeredTime = ...
		# ...
	def read(self, protocol):
		# ...
	def write(self, protocol):
ScheduledMessageOP.thrift_spec = (
	# 필드 ID, 타입, 이름, 중첩 구조 정보
)
```

> 위에서 message.read() 를 사용할 수 있는 이유가 역직렬화 코드가 미리 정의되어 있었기 때문이다. 


실행 흐름은 다음과 같다.  

```
executor JVM
	-> 선택한 행(또는 특정 컬럼)을 Python worker로 전달
	-> Python에서 Thrift 해석 
	-> 행의 결과를 JVM 으로 반환
	-> DataFrame 으로 후속 처리
```

`이 방식은 DataFrame에서 출발하지만, Thrift 처리는 Spark SQL 내장 연산이 아니라 PySpark RDD 연산이다.`   

`mapPartitions에 전달한 함수는 파티션 단위로 호출된다.` 따라서 파티션 내에서 공유할 객체를 한 번 초기화하는 구조를 만들 수 있다.    
`다만 위 코드에서 호출하는 디코더가 매번 transport와 protocol을 생성한다면, 해당 객체는 여전히 행마다 생성된다.`     

> Thrift 메시지 객체를 파티션 마다 한 번만 만들어서 재사용하게 되면 행에 없는 필드에 이전 행의 값이 남을 수도 있기 때문에 권장하지 않는다.   

`JVM과 Python 사이에는 데이터 전달과 직렬화 비용이 발생한다.`   
`단, DataFrame 에서 사용하는 Spark SQL은 JVM에서 실행하고, RDD에 전달한 Python 함수(mapPartition)은 Python worker에서 실행된다.`   

`또한 RDD.mapPartitions는 함수 안의 모든 처리를 SQL 계획 바깥에서 실행한다.`     

> 그 안에 필터, 컬럼 가공, 디코딩을 넣어도 Spark SQL은 그 내용을 모른다. 
> 결과를 다시 DataFrame으로 만들어도, 새 SQL 계획은 그 결과부터 시작하게 된다.

즉, Spark SQL 옵티마이저가 Python 로직을 넘어 원래 DataFrame 까지 이어서 최적화하는 데 한계가 생길 수 있다.   

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
	decode_udf('op_type', 'raw_param2'),
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

`Python UDF는 SQL 실행 계획 안에 포함되어 주변 DataFrame 연산과 함께 계획되지만, 함수 내부의 Thrift 해석 로직은 Spark가 분석하거나 최적화하지 않는다.`   
다만, Python UDF는 SQL 계획의 한 단계이며, Spark는 함수 내용은 모르지만 UDF에 어떤 컬럼이 입력 되는지는 알고 있다.   
그래서 주변 SQL 연산을 같은 계획 안에서 조정할 기회가 생긴다.  

> 예를들어 UDF가 필요 없는 행을 먼저 걸러내거나, 사용하지 않는 컬럼을 제외하는 식의 최적화는 가능해진다. 
> UDF를 가로질러 모든 최적화가 가능한 것은 아니다.  

반면, 위 RDD.mapPartitions 는 SQL 실행 계획 바깥에서 실행 되므로 컬럼 사용 등을 SQL 엔진이 볼 수 없다는 차이가 있다.   

`하지만 둘 다 디코딩 로직 자체는 최적화되지 않는다.`    
차이를 정리해보면, Python UDF가 SQL 계획 안에 있어 주변 SQL 연산과 함께 계획 될 수 있고, RDD 변환 뒤의 연산은 SQL 엔진에서 보이지 않는다는 점이다.   

> 두 방식 모두 필요한 컬럼을 명시적으로 선택한다면 그 차이가 성능 차이로 크게 이어지지 않을 수 있다.  


### 2-3) Hive GenericUDF 를 이용하는 방식 

Thrift 디코딩 로직을 Java의 Hive GenericUDF 인터페이스로 구현하고, 해당 클래스가 포함된 JAR을 Spark에서 사용할 수 있도록 배포(e.g. hdfs, s3) 한다.   
그 뒤, Spark SQL 함수로 등록하여 사용하는 방식이다.   

> 이 방식은 Hive GenericUDF 통합을 전제로 하므로, 클러스터의 Spark, Hive 의존성과 UDF 구현의 호환성도 확인해야 한다. 

thrift 컴파일러를 통해 실행하면 필드 구조가 정의되어 있는 java 클래스가 생성되며, GenericUDF 구현체는 직접 작성해줘야 한다.

```sh
$ thrift -r --gen java ScheduledMessageOP.thrift
```

그 이후 spark-submit 에서 아래와 같이 JAR와 함수 이름을 등록 한다. 

```python
# Java 구현체가 포함된 JAR를 Spark에서 사용할 수 있도록 추가
# 또는 spark-submit --jars 로 전달
ADD JAR 'viewfs://.../.jar'

# SQL 함수 이름과 JAR 안의 Java 구현 클래스를 연결하는 명령
CREATE TEMPORARY FUNCTION decode_operation_payload AS com.company.ScheduledMessageOP
```

실행 흐름은 다음과 같다.

```
executor JVM
	-> GenericUDF 호출
	-> JVM에서 Thrift 해석
	-> 해석 결과 반환
	-> SQL로 후속 처리
```

`행별 Thrift 해석은 executor JVM 내부에서 실행된다. 이 처리 구간에서는 Python worker로 데이터를 전달할 필요가 없다.`   

`앞의 RDD 구현과 비교하면 JVM 과 Python 사이 데이터 전달과 Python 결과를 DataFrame으로 재구성하는 비용을 피할 수 있다.`      
`대신 Java 코드를 빌드하고, executor에서 사용할 JAR와 의존성을 배포해야 한다.`   

`Hive GenericUDF 역시 사용자 정의 함수이므로 Spark가 내장 SQL 함수처럼 분석하고 최적화하지 못한다. 성능상 기대 효과는 Python worker 왕복을 줄이고 JVM 안에서 디코딩을 수행할 수 있기 때문에 Python 실행 경계에서 발생하는 비용을 줄일 가능성이 있다.`    
다만 실제 성능은 Thrift 디코딩 비용, 데이터 크기 등에 따라 달라진다.    

---  

## 3. 성능 비교 및 추후 검토 계획

RDD.mapPartitions 방식과 Hive GenericUDF 방식을 동일한 데이터로 성능 비교했을 때  비슷한 실행 시간이 확인되었다.

테이블 스캔량은 2TB 이상이었지만, Thrift 디코딩 대상은 필터 후 일부 행으로 제한되어 있어서 큰 차이가 없는 것으로 확인되었다.

디코딩할 데이터가 많아 JVM-Python worker 간 직렬화 부하가 발생하게 된다면 다음을 고려해 볼 수 있다.   

Python UDF 방식도 비교하기 위해 Spark 3.4 에서 `spark.sql.execution.pythonUDF.arrow.enabled=true` 를 적용할 수 있다.   
이 설정은 JVM과 Python worker 사이의 데이터 전달을 Arrow 기반으로 최적화하지만, Thrift 디코딩 함수는 계속 행별로 실행된다.

> 이 설정은 Spark 3.4 기준 기본적으로 비활성화 되어 있다.     

Pandas UDF도 Arrow 배치 전달을 사용하므로 비교 후보가 될 수 있다. 다만 Thrift 데이터는 각 행마다 개별적으로 역직렬화해야 하므로, 이 작업에서 Pandas UDF가 더 빠를지는 JVM-Python 데이터 전달 비용이 전체 시간에서 차지하는 비율을 측정한 뒤 판단해야 한다.   

- - - 
## 4. 결론

현재 업무의 기존 배치에서는 Hive GenericUDF 를 주로 사용했었다.   
이 방식은 Java 코드와  Thrift에서 생성한 클래스를 JAR로 빌드하고 배포해야 하므로, 현
재 PySpark 중심의 코드베이스에서는 관리 부담이 있었다.   

이번 테스트 데이터와 환경에서는 RDD mapPartitions 방식과 Hive GenericUDF 방식의 전체 실행 시간에 큰 차이가 없었다. 이에 성능 우위가 확인되지 않은 상황에서, 기존 PySpark 코드와 함께 관리할 수 있다는 점을 고려해 RDD 기반 방식을 선택했다.

향후에는 Spark 3.4의 Arrow 최적화 Python UDF와 Pandas UDF 등을 적용했을 때 JVM 과 Python 사이의 비용을 줄일 수 있을지 검토해볼 예정이다.


- - -

Reference



{% highlight ruby linenos %}
{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}
