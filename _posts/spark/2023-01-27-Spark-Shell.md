---
layout: post
title: "[Spark] 설치 및 실습 환경 구성하기"   
subtitle: "scala언어의 spark prompt를 실행하는 script / docker 를 이용한 spark 실행 / databricks 플랫폼 community edition"    
comments: true
categories : Spark
date: 2023-01-27
background: '/img/posts/mac.png'
---   

이번 글에서는 Spark를 실습하기 위한 여러 방법들을 살펴보자.   

- - -  

## 1. Spark 설치 및 Spark shell 실행   

[스파크 공식문서](https://spark.apache.org/downloads.html)에서 버전을 확인 후 설치한다.     
또는 [release archives](https://archive.apache.org/dist/spark/)에서 모든 버전을 확인할 수 있다.     

```
$ wget https://archive.apache.org/dist/spark/spark-3.2.1/spark-3.2.1-bin-hadoop3.2.tgz
$ tar xvfz spark-3.2.1-bin-hadoop3.2.tgz   
$ mv spark-3.2.1-bin-hadoop3.2 spark3
```  

spark를 실행하기 위해 java가 필요하며, 환경변수 역시 설정해주어야 한다.    
`spark-env.sh는 spark가 기동되면서 실행하는 쉘이며, 환경변수 등을 
설정할 수 있다.`    

```
$ cd spark3/conf
$ cp spark-env.sh.template spark-env.sh
$ vi spark-env.sh

JAVA_HOME=/Library/Java/JavaVirtualMachines/jdk-11.0.15.1.jdk/Contents/Home

$ ./bin/spark-shell --master local[*] // 멀티쓰레드 환경 실행 
```

위와 같이 spark-shell을 실행 시키면 된다.   

> spark shell은 spark의 인터프리터로써, sparkContext, sparkSession등을 미리 만들어서 
제공한다.   
> spark shell을 통해 여러 연산들을 학습할 때 유용하다.   

spark shell을 실행해보면 아래와 같은 로그를 확인할 수 있다.   

```
Spark context Web UI available at [이용가능한 ui 주소]
Spark context available as 'sc' (master = local[*], app id = local-1674827513610).
Spark session available as 'spark'.
Welcome to
      ____              __
     / __/__  ___ _____/ /__
    _\ \/ _ \/ _ `/ __/  '_/
   /___/ .__/\_,_/_/ /_/\_\   version 3.0.1
      /_/

Using Scala version 2.12.10 (Java HotSpot(TM) 64-Bit Server VM, Java 11.0.15.1)
Type in expressions to have them evaluated.
Type :help for more information.

scala>
```

위에서 제공하는 ui 주소로 접속해보면 아래와 같은 화면을 확인할 수 있다.   

<img width="700" alt="스크린샷 2023-01-28 오후 9 05 00" src="https://user-images.githubusercontent.com/26623547/215265536-14c39b5f-8538-4511-8cb9-2c1c384d632e.png">   

또한, 미리 생성된 sparkContext와 sparkSession 또한 아래와 같이 확인 가능하다.   

```
scala> sc // sparkContext
res0: org.apache.spark.SparkContext = org.apache.spark.SparkContext@14ef94ec

scala> spark // sparkSession
res1: org.apache.spark.sql.SparkSession = org.apache.spark.sql.SparkSession@738e057b

scala> sc.master // spark의 master 정보 확인
res2: String = local[*] // 로컬의 모든 core 사용 
```

이제 새로운 터미널을 열어서 드라이버 프로그램이 실행되었는지 확인해보자.   

```
$ jps
3000 SparkSubmit
```

`SparkSubmit은 스파크 어플리케이션을 제출할 때 기동되는 자바 프로세스이다.`    
단, 로컬에서 실행했을 때는 executor를 요청하지 않기 때문에 
SparkSubmit 프로세스가 드라이버 역할을 하게 된다.   

- - - 

## 2. Docker를 이용하여 설치    

아래 명령어를 통해 docker 이미지를 다운받고, 실행하게 되면 접속할 수 있는 
url을 전달해준다.   

```
$ docker run -it --rm -p 8888:8888 -v /Users/jang-won-yong/dev/learn-pyspark/pyspark:/home/jovyan/work jupyter/pyspark-notebook   

//...
[I 2024-05-06 07:26:12.950 ServerApp]     http://127.0.0.1:8888/lab
[I 2024-05-06 07:26:12.951 ServerApp] Use Control-C to stop this server and shut down all kernels (twice to skip confirmation).
[C 2024-05-06 07:26:12.955 ServerApp]

    To access the server, open this file in a browser:
        file:///home/jovyan/.local/share/jupyter/runtime/jpserver-8-open.html
    Or copy and paste one of these URLs:
        http://5dc38f90046b:8888/lab
        http://127.0.0.1:8888/lab
```

- - - 

## 3. Databricks 를 이용하여 Spark 실행   




- - - 

**Reference**    

<https://spark.apache.org/downloads.html>   
<https://archive.apache.org/dist/spark/>   

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

