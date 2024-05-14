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

> 주피터 노트북에서 spark를 실행할 수 있는 환경을 제공해준다.   

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

추가적으로 kafka 등을 연동하기 위해 환경설정이 복잡하므로 아래와 같이 docker compose를 
이용하여 빠르게 연동할 수 있다.   

```yml
version: '3.9'
services:
  spark:  ## master
    image: docker.io/bitnami/spark:3.4
    volumes:
      - .:/opt/bitnami/spark/work   
      - ./spark_conf/log4j2.properties:/opt/bitnami/spark/conf/log4j2.properties
      - ./spark_conf/spark-defaults.conf:/opt/bitnami/spark/conf/spark-defaults.conf
      - ./spark-events:/tmp/spark-events
    environment:
      - SPARK_MODE=master
      - SPARK_RPC_AUTHENTICATION_ENABLED=no
      - SPARK_RPC_ENCRYPTION_ENABLED=no
      - SPARK_LOCAL_STORAGE_ENCRYPTION_ENABLED=no
      - SPARK_SSL_ENABLED=no
      - SPARK_USER=spark
    user: "root"   ## test 를 위해서 사용, production 환경에서는 사용하지 말 것   
    ports:
      - '8080:8080'
      - '18080:18080'
      - '4040:4040'
    networks:
      - backend
  spark-worker: 
    image: docker.io/bitnami/spark:3.4
    volumes:
      - .:/opt/bitnami/spark/work  
    environment:
      - SPARK_MODE=worker
      - SPARK_MASTER_URL=spark://spark:7077   ## master 이름인 spark 지정
      - SPARK_WORKER_MEMORY=1G
      - SPARK_WORKER_CORES=1
      - SPARK_RPC_AUTHENTICATION_ENABLED=no
      - SPARK_RPC_ENCRYPTION_ENABLED=no
      - SPARK_LOCAL_STORAGE_ENCRYPTION_ENABLED=no
      - SPARK_SSL_ENABLED=no
      - SPARK_USER=spark
    user: "root" ## test 를 위해 
    networks:
      - backend
  pyspark:
    image: jupyter/pyspark-notebook
    user: "root"
    environment:
      - NB_GID=100
      - GRANT_SUDO=yes
    volumes:
      - .:/home/jovyan/work
    ports:
      - "8888:8888"
    networks:
      - backend
  kafka:
    image: bitnami/kafka:3.4
    volumes:
      - ./kafka-persistence:/bitnami/kafka
    environment:
      - KAFKA_CFG_NODE_ID=0
      - KAFKA_CFG_AUTO_CREATE_TOPICS_ENABLE=true
      - KAFKA_CFG_PROCESS_ROLES=controller,broker
      - KAFKA_CFG_LISTENERS=PLAINTEXT://:9092,CONTROLLER://:9093,EXTERNAL://:9094
      - KAFKA_CFG_ADVERTISED_LISTENERS=PLAINTEXT://kafka:9092,EXTERNAL://localhost:9094
      - KAFKA_CFG_LISTENER_SECURITY_PROTOCOL_MAP=CONTROLLER:PLAINTEXT,EXTERNAL:PLAINTEXT,PLAINTEXT:PLAINTEXT
      - KAFKA_CFG_CONTROLLER_QUORUM_VOTERS=0@kafka:9093
      - KAFKA_CFG_CONTROLLER_LISTENER_NAMES=CONTROLLER
    ports:
      - "9092:9092"
      - "9094:9094"
    networks:
      - backend
  cassandra:
    image: bitnami/cassandra:4.0.11
    volumes:
      - ./cassandra-persistence:/bitnami
    environment:
      - CASSANDRA_TRANSPORT_PORT_NUMBER=7000
    ports:
      - "9042:9042"
    networks:
      - backend
networks:   ## 동일한 네트워크 사용   
  backend:
    driver: bridge
```

`위 파일 위치에서 docker compose up 명령어를 입력하면 아래와 같이 도커가 실행되며, 
    pyspark-notebook의 경우 logs를 확인해보면 접속할 수 있는 url을 동일하게 제공해준다.`     

```
$ docker ps
CONTAINER ID   IMAGE                      COMMAND                  CREATED          STATUS                    PORTS                                                                      NAMES
c843d890bb24   jupyter/pyspark-notebook   "tini -g -- start-no…"   16 seconds ago   Up 14 seconds (healthy)   4040/tcp, 0.0.0.0:8888->8888/tcp                                           learn-pyspark-pyspark-1
470660b845e6   bitnami/spark:3.4          "/opt/bitnami/script…"   16 seconds ago   Up 15 seconds             0.0.0.0:4040->4040/tcp, 0.0.0.0:8080->8080/tcp, 0.0.0.0:18080->18080/tcp   learn-pyspark-spark-1
cac008fc957b   bitnami/kafka:3.4          "/opt/bitnami/script…"   16 seconds ago   Up 14 seconds             0.0.0.0:9092->9092/tcp, 0.0.0.0:9094->9094/tcp                             learn-pyspark-kafka-1
6a4aedbbdce3   bitnami/spark:3.4          "/opt/bitnami/script…"   16 seconds ago   Up 15 seconds                                                                                        learn-pyspark-spark-worker-1
c1aaa5ee99a6   bitnami/cassandra:4.0.11   "/opt/bitnami/script…"   16 seconds ago   Up 15 seconds             7000/tcp, 0.0.0.0:9042->9042/tcp                                           learn-pyspark-cassandra-1


$ docker logs c843d890bb24
Entered start.sh with args: jupyter lab
// ...
    To access the server, open this file in a browser:
        file:///home/jovyan/.local/share/jupyter/runtime/jpserver-20-open.html
    Or copy and paste one of these URLs:
        http://127.0.0.1:8888/...
```

<img width="886" alt="스크린샷 2024-05-14 오후 6 06 57" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/8b0f7973-9dec-40ff-811a-22372f3f9844">     

그 후 `spark master 컨테이너에 직접 접근하여 spark history server를 직접 실행`해야 한다.   

```
$ docker exec -it 470660b845e6 /bin/bash

$ root@470660b845e6:/opt/bitnami/spark# ./sbin/start-history-server.sh
starting org.apache.spark.deploy.history.HistoryServer, logging to /opt/bitnami/spark/logs/spark--org.apache.spark.deploy.history.HistoryServer-1-470660b845e6.out
```  

마지막으로 spark-submit은 아래와 같이 job을 제출할 수 있다.       

```
spark-submit --master spark://spark:7077 <python file name>
```

히스토리 서버는 18080 port이며, 아래와 같이 확인할 수 있다.   

<img width="754" alt="스크린샷 2024-05-14 오후 6 31 28" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/34bc9226-a2b4-4d3e-9389-0c44d69b851f">   

<img width="913" alt="스크린샷 2024-05-14 오후 6 31 06" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/356655ba-51d0-4b00-83ab-a51a753f971e">    

- - - 

**Reference**    

<https://spark.apache.org/downloads.html>   
<https://archive.apache.org/dist/spark/>   

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

