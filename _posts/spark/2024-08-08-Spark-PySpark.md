---
layout: post
title: "[Spark] PySpark 개념과 주요기능"   
subtitle: "scala 와 python 을 이용한 Spark 비교 / 설치 및 주요 기능 / Temp View"             
comments: true   
categories : Spark   
date: 2024-08-08     
background: '/img/posts/mac.png'   
---

`Apache Spark는 Scala 프로그래밍 언어로 작성되었고, 
    PySpark는 Python 환경에서 Apache Spark를 사용할 수 있는 인터페이스이다.`      

> 사실상 Spark 용 Python API의 일종이다.   


<img width="800" alt="스크린샷 2024-08-10 오후 1 51 37" src="https://github.com/user-attachments/assets/8fd00141-f5d8-4202-8c00-279f0bdbbeae">   

PySpark는 Spark SQL, DataFrame, Streaming, MLlib and Spark Core 와 
같은 대부분의 Spark 기능을 제공한다.   

이제 PySpark에 대해서 자세히 살펴보자.    

- - - 

## 1. Data Flow   

먼저 PySpark 가 어떻게 동작하는지 살펴보자.   

<img width="729" alt="스크린샷 2024-08-10 오후 2 53 43" src="https://github.com/user-attachments/assets/68bb7605-6c69-49c1-8016-7c24f5cd1cd6">    

`PySpark를 사용하면 Scala Spark 를 사용할때와는 다르게 Python 프로세스가 존재한다.`    

1. Python Driver Process는 Py4j 를 이용해서 별도 JVM 프로세스에 Spark Context를 생성한다.   
2. PySpark 에서도 spark.sparkContext 객체가 존재하지만, 이것은 
명령을 내리기 위한 객체이며 실제로는 명령을 받은 JVM 내의 SparkContext가 필요한 작업을 수행한다.   

`같은 노드 내에 있더라도 Python Process와 JVM Process는 서로 다른 
프로세스이므로 데이터(메모리)를 공유할 수 없다.`   
IPC(Inter-Process Communication)간 통신을 위해 Socket을 이용한다.   
Executor는 Pipe를 이용하여 통신한다.    

즉, Spark는 JVM에서 동작하는 프레임워크이며, PySpark는 Python에서 
Spark를 사용하기 위해 Python 코드를 JVM으로 변환해야 한다.   

또한 Scala를 이용한 Spark의 경우 위처럼 Socket 통신이 불필요하기 때문에 
PySpark에 비해 오버헤드가 적을 수 있다.   

PySpark에서 UDF(User Defined Function)을 사용할 때, Python 프로세스를 
별도로 실행하고 데이터를 전달하여 계산을 한다.   
이 과정에서 네트워크 통신 및 직렬화 및 역직렬화로 인한 성능 저하가 
발생할 수 있다.   

하지만 PySpark는 Spark 버전이 올라감에 따라 성능이 개선되고 있다.   
`즉, 분산처리 기능을 그대로 활용하면서도 Python에서의 편리함을 유지할 수 
    있다는 장점이 있으며 Spark SQL 이나 데이터 프레임을 사용하는 경우는 
    다른 언어와 성능차이가 미미하거나 없다.`    




- - - 

## 2. 설치   

anaconda 를 이용하여 pyspark를 설치해보자.  

```
conda --version

# pyspark 이름의 가상환경 생성 
conda create --name pyspark python=3.8

# 활성화
conda activate pyspark
```

```
pip install pyspark==3.4.1
pip install jupyter
```

pyspark를 실행할 때 아래 2개의 환경변수를 .bashrc 또는 .zshrc에 넣어주면 
pyspark를 실행하면 jupyterlab을 실행하게 된다.   

```
# jupyter 
export PYSPARK_DRIVER_PYTHON=jupyter
export PYSPARK_DRIVER_PYTHON_OPTS='notebook'

# bind spark driver address 
export SPARK_LOCAL_IP="127.0.0.1"

export PYSPARK_PYTHON=/Users/wonyong/opt/anaconda3/envs/pyspark/bin/python
```

pyspark를 실행하면 즉시 jupyterlab이 실행되며, 
    Pycharm, Intellij, VS Code 등과 같은 IDE를 같이 사용할 수도 있다.   

```
pyspark
```

- - - 

## 3. 주요 기능    

이제 pyspark 의 간단한 코드를 작성해보자.      
아래 코드는 SparkSession을 이용하여 데이터 프레임을 생성후 출력하는 
예제이다.   

```python
from pyspark.sql import SparkSession

spark = SparkSession.builder.appName("Basic PySpark Example").getOrCreate()

# 데이터 생성
data = [
    (1, "Alice", 29),
    (2, "Bob", 31),
    (3, "Cathy", 25)
]

# 데이터프레임 생성
columns = ["id", "name", "age"]
df = spark.createDataFrame(data, columns)

# 데이터프레임 출력
df.show()

# SparkSession 종료
spark.stop()
```

### 3-1) SQL 사용과 Temp View    

DataFrame 외에 친근한 SQL 문으로 데이터를 다룰 수도 있다.   
`이때 Temp View를 생성 하고 SparkSession.sql() 메서드를 통해 SQL을 작성할 수 있다.`   

```python
# Temp View 생성
df.createOrReplaceTempView("dfTable")
# SparkSession 을 통해서 SQL 사용
spark.sql("SELECT age FROM dfTable").show()
```   

Temp View 의 종류는 아래와 같이 제공 되며 생성한 Temp View 테이블들을 확인하거나 
삭제할 수도 있다.  

```python
# Spark 세션의 임시 뷰 목록 조회   
spark.catalog.listTables()

# 특정 임시 뷰 삭제   
spark.catalog.dropTempView("view_name")   
# 글로벌 임시 뷰 삭제   
spark.catalog.dropGlobalTempView("view_name")
```

##### createTempView   

데이터 프레임을 세션 범위에서 Temp View로 등록한다.   
단, 동일한 이름의 뷰가 이미 존재하는 경우 오류가 발생한다.   

- 유효 범위: 현재 세션    

> 여기서 세션은 SparkSession을 의미한다.   
 
##### createOrReplaceTempView    

데이터프레임을 세션 범위에서 Temp View로 등록하며, 동일한 
이름의 뷰가 이미 존재하는 경우 기존 뷰를 덮어쓴다.   

- 유효 범위: 현재 세션   

##### createGlobalTempView, createOrReplaceGlobalTempView   

데이터 프레임을 모든 세션에서 사용할 수 있는 글로벌 Temp View로 등록한다.    
동일한 이름 존재 여부에 따라서 에러를 발생지킬지 
덮어쓸지가 나뉜다.

- 유효 범위: 모든 세션   

예를 들면 spark1 이름의 SparkSession에서 생성한 Temp View를 spark2 이름의 SparkSession에서 
접근이 가능하다.   

`Temp View는 SparkSession 의 생명 주기에 따라 존재하기 때문에, 세션이 종료되면 해당 세션 내에서 
생성된 모든 Temp View 도 사라진다.`   

> spark.stop() 을 통해 세션을 종료할 수 있다.   

단, Global Temp View는 SparkSession이 아닌 어플리케이션 전체 범위에 공유된다.   
따라서 한 세션이 종료되어도 다른 세션에서 여전히 접근이 가능하다. 그러나 어플리케이션이 
완전히 종료되면 Global Temp View도 제거 된다.   

> Global Temp View는 전역 상태로 남기기 위해 임시 데이터베이스로 연결되기 때문에 
신중히 사용해야 한다.   

- - - 

**Reference**   

<https://www.databricks.com/kr/glossary/pyspark>   
<https://surgach.tistory.com/105>   


{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

