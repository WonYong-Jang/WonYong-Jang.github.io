---
layout: post
title: "[Spark] PySpark 개념과 주요기능"   
subtitle: "scala 와 python 을 이용한 Spark 비교 / PySpark의 장단점 / 설치 및 주요 기능"             
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

pyspark를 실행하면 즉시 jupyterlab이 실행된다.   

```
pyspark
```

- - - 

**Reference**   

<https://www.databricks.com/kr/glossary/pyspark>   
<https://surgach.tistory.com/105>   


{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

