---
layout: post
title: "[Spark] Docker Ubuntu 컨테이너로 Spark 실습환경 만들기"   
subtitle: "도커를 이용한 master, worker 클러스터 환경 구성 / spark-submit "    
comments: true
categories : Spark
date: 2021-08-29
background: '/img/posts/mac.png'
---

지난 글에서는 여러 대의 서버가 아닌 한 대의 서버(PC)에서 스파크를 
구동시키고 동작을 테스트 했다.   
`실무에서 스파크를 사용할 때 보통 여러대의 서버를 직접 클러스터 환경으로 구성하거나 
AWS EMR 클러스터 환경을 사용하는데 
여러 서버를 마치 하나의 서버인 것처럼 다뤄야 하기 때문에 
하나의 작업을 여러 서버에 분산해서 실행하고 그 결과를 
취합 하는 과정에서 예상하지 못한 문제를 겪을 수 있다.`        

간단한 예로는 DB 커넥션 문제가 있을 수 있다. DB 를 접근 할 때 
커넥션 풀로 관리하게 되며, 작업을 나눠서 여러 서버에 
나눠 DB를 접근할 때 각각 독립적은 JVM 위에서 동작하기 때문에 
이를 고려하지 않으면 문제가 발생할 수 있다.   

그렇기 때문에 분산 처리를 위한 시스템 아키텍처와 그와 관련된 
다양한 설정 및 매개변수를 이해하는 것이 중요하다.   

따라서, 클러스터 모드를 직접 설정해보는 것이 이해하는데 도움이 된다. 
하지만 여러대의 서버를 가용하기 부담스러운 경우에는 도커 컨네이너를 띄워서 
실습해 보는 것이 가능하다.   

`스파크 프로그래밍 모델 관점에서 보면 하나의 애플리케이션은 마스터 
역할을 담당하는 Driver 프로그램과 실제 데이터 처치를 담당하는 
여러 개의 executor로 구성된다고 할 수 있다.`   
Driver 프로그램이 구동되어 애플리케이션이 실행될 때 각 워커 노드에는 
executor라고 불리는 스파크 프로세스가 구동되면서 작업을 수행하게 된다.   

즉, "스파크 애플리케이션을 실행했다" 라고 하는 말은 곧 드라이버 프로그램에 
있는 메인 함수를 실행해 스파크 컨텍스트를 생성하고, 이를 이용해 각 
워커 노드(작업에 투입되는 서버)에 익스큐터 프로세스를 구동시켜 작업을 수행했다라는 뜻이다.   

`여기서 주의할 점은 익스큐터가 스레드가 아닌 프로세스라는 점이다.`   
`익스큐터는 CPU와 메모리 등의 자원을 할당받는 프로세스에 해당하는데, 익스큐터에서 
할당 받은 CPU core 갯수에 따라서 익스큐터 내에서도 병렬로 처리가 가능하기 
때문이다.`    

또한, `익스큐터는 크게 두 가지 역할을 수행하는데, 하나는 할당받은 
태스크를 처리하는 것이고, 또 하나는 이미 처리된 데이터를 
나중에 재사용할 수 있게 메모리에 저장해 두는 역할이다.` 이처럼 
동일한 익스큐터에서 작업을 처리함과 동시에 저장도 함께 하기 때문에 
반복적인 작업을 수행할 때 데이터에 대한 접근 속도가 빨라서 전체적으로 
높은 작업 효율을 기대할 수 있다.   

이제 본격적으로 도커를 이용하여 실습 환경을 구성해보자.   

- - - 

## 1. 요구사항   

- master / slave 용으로 각각 하나의 도커 컨테이너를 생성하기   
- 네트워크(ssh), java, hadoop 설치 및 설정하기   
- 각 컨테이너에서는 하둡(정확히는 HDFS)를 사용할 수 있어야 하고 하둡 namenode / datanode는 master 서버에서 가동한다.   
- 도커 컨테이너로 실습 환경을 구성하고 이를 spark-submit을 통해 spark를 실행한다.   

- - - 

## 2. 이미지 준비    

먼저 ubuntu 이미지를 받은 뒤 컨테이너를 띄우고 bash로 접속한다.   

```shell
$ docker pull ubuntu
$ docker run -itd --name spark-base ubuntu    

$ docker exec -it spark-base /bin/bash
```

참고로 run 옵션은 컨테이너를 새로 만들어 실행하고, exec는 이미 실행 중인 컨테이너에 
명령을 내린다.   

- -d : 보통 데몬모드라고 부르며, 컨테이너가 백그라운드로 실행된다.   
- -it : -i 와 -t 옵션은 같이 쓰이는 경우가 많다. 두 옵션은 컨테이너를 종료하지 않은 채로 
터미널의 입력을 계속해서 컨테이너로 전달하기 위해 사용한다. 보통 컨테이너의 shell이나 CLI 도구를 사용할 때 유용하다.   
- --name : 컨테이너에 이름을 부여해 주어서, 해당 이름으로 컨테이너를 식별 할 수 있게 해준다.   
- -exec : 실행 중인 컨테이너 상대로 명령어를 날릴 때 사용한다.   


컨테이너에 접속했다면 필요한 패키지 및 라이브버리를 설치한다.   

```shell
$ apt-get update
$ apt-get install vim wget unzip ssh openjdk-8-jdk python3-pip
$ pip3 install pyspark
```   

위에서 openjdk로 자바를 설치 했으니 환경 변수를 아래와 같이 작성한다.   

```shell
$ vi ~/.bashrc

export JAVA_HOME=/usr/lib/jvm/java-8-openjdk-amd64
```

### 2-1) 하둡 바이너리 다운로드   

하둡은 바이너리 파일을 다운로드 받아 환경변수를 설정하는 것으로 충분하다.   

```shell
# 폴더 생성 및 하둡 바이너리 파일 다운로드 / 압축 해제
$ mkdir /opt/hadoop && cd /opt/hadoop
$ wget https://mirror.navercorp.com/apache/hadoop/common/hadoop-3.2.2/hadoop-3.2.2.tar.gz
$ tar -xzf hadoop-3.2.2.tar.gz
$ rm hadoop-3.2.2.tar.gz

# 환경변수 등록
$ vi ~/.bashrc
export HADOOP_HOME=/opt/hadoop/hadoop-3.2.2
export PATH=${HADOOP_HOME}/bin:$PATH

$ source ~/.bashrc
```    

그 외에 기본적인 hadoop 설정(core-site.xml, hdfs-site.xml..)은 
[미디엄 포스트](https://alibaba-cloud.medium.com/how-to-install-hadoop-cluster-on-ubuntu-16-04-bd9f52e5447c)를 참고했다.     
하둡 파일 시스템에 접근할 때 네임노드(namenode) 정보를 
추가하지 않고도 좀 더 편리하게 접근 
할 수 있다는 장점이 있기 때문에 설정하는 것을 권장한다.      

### 2-2) 스파크 바이너리 다운로드     

하둡과 동일하게 스파크도 바이너리 파일을 설치하고 환경변수를 등록한다.   

```shell
# 폴더 생성 및 하둡 바이너리 파일 다운로드 / 압축 해제   
$ mkdir /opt/spark && cd /opt/spark
$ wget https://mirror.navercorp.com/apache/spark/spark-3.1.1/spark-3.1.1-bin-hadoop2.7.tgz   
$ tar -xzf spark-2.3.2-bin-hadoop2.7.tgz
$ rm spark-2.3.2-bin-hadoop2.7.tgz

# 환경 변수 등록  
$ vi ~/.bashrc
export SPARK_HOME=/opt/spark/spark-2.3.2-bin-hadoop2.7
export PATH=${SPARK_HOME}/bin:$PATH
export PYSPARK_PYTHON=/usr/bin/python3

$ source ~/.bashrc
```

### 2-3) 이미지 생성     

일반적으로 도커 컨테이너 상에서 작업한 내용들은 컨테이너가 종료되면 
함께 사라진다.    
`도커 컨테이너 상에서 작업한 내용을 이미지로 커밋(commit)하여 나중에 
해당 이미지로부터 다시 컨테이너를 실행함으로써 작업했던 내용을 다시 사용할 수 
있다.`    
환경설정이 완료된 컨테이너를 이미지로 만든다.   

```shell
$ docker commit spark-base hadoop-spark   

# docker commit -m "메시지" 컨테이너명 이미지명:태그   
# docker commit -m "first commit" spark-base hadoop-spark:0.0.1   
# 컨테이너명, 이미지명은 각각 아이디로 대체 가능하다.   
# -a, --author string 작성자  

$ docker images  # 이미지 확인   
```

- - - 

## 3. 마스터 컨테이너 띄우기   

먼저 마스터로 사용할 컨테이너를 띄운다.   

```shell
$ docker run -itd --name spark-master -p 9870:9870 -p 8080:8080 -v {로컬 폴더경로}:{컨테이너 내부 폴더경로} hadoop-spark   

# -p 옵션 중 왼쪽은 호스트에서 접속할 실제 포트이고, 오른쪽은 컨테이너에 리스팅하고 있는 포트이다.   
```   

- 9870 port : hadoop namenode webserver   
- 8080 port : spark master webserver    
- -p : 호스트(host) 컴퓨터에서 컨테이너에 리스닝하고 있는 포트로 접속을 할 수 있도록 설정 해준다.   
- -v : 호스트와 컨테이너 간의 볼륨(volume)설정을 위해서 사용된다. 호스트(host) 컴퓨터의 
파일 시스템의 특정 경로를 컨테이너의 파일 시스템의 특정 경로로 마운트(mount)를 해준다.   

`위에서 설명한 v 옵션은 볼륨 마운트를 해서 로컬에서 작성한 코드를 도커 컨테이너에 바로 마운트가 
가능하도록 해준다.`   
로컬 폴더는 코드를 작성하는 폴더라면 아무 폴더나 상관없지만 이 글에서는 
편의를 위해 [위키북스 spark github](https://github.com/wikibook/spark)를 통으로 clone 받아서 
마운트를 하겠다.    

포트가 잘 바인딩 되었는지 확인하고, 컨테이너에 접속한다.   

```shell
$ docker exec -it spark-master /bin/bash    
```

접속이 정상적으로 되었다면, 위에서 설치 및 설정한 하둡의 namenode, datanode가
제대로 올라가는지 확인한다.     

```shell
$ hdfs namenode -format   # 포맷
$ hdfs namenode 

$ hdfs datanode -foramt   # 포맷  
$ hdfs datanode 
```   

localhost:9870으로 접속했을 때 하둡에 대한 overview 페이지가 
나온다면 성공이다.   

<img width="695" alt="스크린샷 2021-09-02 오후 10 50 23" src="https://user-images.githubusercontent.com/26623547/131855913-e9cf1b38-a40f-4e7f-8bde-360e91894624.png">   

namenode host와 port는 위에서 설정한 하둡 파일 중 core-site.xml의 
fs.defaultFS의 value를 따라간다.   

```shell  

# hdfs sample 폴더 생성 
# hdfs dfs -mkdir hdfs://{namenode_host:port}/sample   
$ hdfs dfs -mkdir hdfs://localhost:9000/sample  

# README.md 파일 hdfs sample 폴더에 추가  
$ cd ${SPARK_HOME}
$ hdfs dfs -put ./README.md hdfs://localhost:9000/sample/   

# 폴더에 파일 확인   
$ hdfs dfs -ls hdfs://localhost:9000/sample   
Found 1 items
-rw-r--r--   1 root supergroup       4488 2021-05-08 22:21 hdfs://localhost:9000/sample/README.md
```

- - - 

## 4. worker 컨테이너 생성하고 띄우기    

다음으로는 worker 컨테이너를 띄우고 master 컨테이너와 연결해보자.   
따로 설정하지 않으면 worker web ui는 8081 포트로 바인딩되기 때문에 
8081 포트만 하나 열어주자.   

```shell
$ docker run -itd --name spark-worker -p 8081:8081 hadoop-spark    
```

- - - 

## 5. ssh    

사실 도커 컨테이너 내부 ssh 통신을 권장하지는 않는다. [공식문서](https://docs.docker.com/samples/running_ssh_service/)    
컨테이너끼리 자체적인 [network](https://docs.docker.com/network/)를 제공하고 있다. 
그러나 docker network가 spark 환경에서 원하는대로 잘 작동하는지 모르기 때문에, 
    ssh를 이용해서 서버들을 연결해보자.   

master container에 접속한 뒤 ssh key를 생성해준다.   

```shell   
$ docker exec -it spark-master /bin/bash   

# ssh key 생성   
root@master# ssh-keygen -t rsa 
...
생략
...
```   

그럼 이제 worker 컨테이너에 key를 등록해보자.   

```shell
docker exec -it spark-worker /bin/bash  

root@worker# mkdir ~/.ssh
root@worker# cd ~/.ssh
root@worker# vi authorized_keys
```

`~/.ssh 폴더 안에 authorized_keys라는 파일을 생성한 뒤 master의 id_rsa.pub(공개키) 파일 내용을 
복사해 붙여넣는다.`   
`master의 public key를 이 곳에 등록함으로써 master가 ssh를 이용해 
worker에 접속할 수 있게 된다.`   

`worker도 master와 동일하게 ssh key를 만들어 master의 authorized_keys에 
등록한다.`   

등록이 완료되었다면 master 컨테이너에서 worker 컨테이너에 접속이 가능한지 
확인해본다. worker container IP는 컨테이너 내부 /etc/hosts 파일에서 
확인 또는 hostname -I 명령어로 확인 가능하다.   

```shell 
root@master# ssh ${worker container IP}
Welcome to Ubuntu 20.04.2 LTS (GNU/Linux 5.10.25-linuxkit x86_64)

 * Documentation:  https://help.ubuntu.com
 * Management:     https://landscape.canonical.com
 * Support:        https://ubuntu.com/advantage

This system has been minimized by removing packages and content that are
not required on a system that users do not log into.
```

만약 ssh 접속시 Permission denied 에러가 발생한다면 아래와 같이 해결한다.   


```shell
$ vi /etc/ssh/sshd_config
# Port 22
# 위와 같이 되어 있는 부분을 주석을 푼다.   

$ service ssh restart   
```

- - - 

## 6. worker 등록   

`master에 worker를 등록한다.`      
master 컨테이너에 ${SPARK_HOME}/conf로 들어간 뒤,    

```shell
root@master# cd ${SPARK_HOME}/conf   
root@master:~# cp slaves.template workers   
```

> 정확한 버전은 모르겠으나 3.0 부터는 slave라는 대신 worker라는 단어를 
사용하고 있다. conf 폴더 안에 설정 파일들이 template 파일로 존재하는데 
버전마다 그 이름을 slave 또는 worker로 다를 수 있다.   

`파일을 생성했다면 workers 파일 안에 적혀 있는 localhost는 지워주고 
아까 확인했던 worker 컨테이너의 ip를 적어준다.`    

`web ui에서 worker 정보를 확인하고 싶다면, worker에 master host를 
등록해줘야 한다.` 등록을 하지 않더라도 worker는 작동하지만 
worker 정보가 web ui에 보이지 않는다.   

```shell
root@worker# vi ${SPARK_HOME}/spark-env.sh   
root@worker# export SPARK_MASTER_HOST=spark://{HOST_NAME}:7077   
```

그럼 이제 worker 등록까지 완료되었으니 클러스터 매니저를 실행해보자.    

```shell
root@master# cd ${SPARK_HOME}/sbin
root@master# ./start-master.sh
starting org.apache.spark.deploy.....

# 위에서 작성한 마스터 ip와 port를 작성한다.   
root@master# ./start-slave.sh spark://{MASTER_HOST_NAME}:{PORT}
...
```

localhost:8080에 접속해 master web ui를 확인했을 때, worker에 뭔가 
제대로 등록되어 있다면 성공했다.     

<img width="700" alt="스크린샷 2021-09-03 오전 8 45 17" src="https://user-images.githubusercontent.com/26623547/131929726-56b41101-d945-4ef9-b8b7-229da437bb7f.png">  


- - - 

## 7. spark-submit   

spark-submit은 스파크에서 제공해주는 실행 스크립트이다. 이를 
이용해서 여러 라이브러리를 참조하는 소스코드를 직접 실행시키거나, 
    배포 파일을 만든 뒤 스파크 클러스터에 배포해 사용할 수 있다. 

- - - 

**Reference**    

<https://eprj453.github.io/spark/2021/05/08/spark-docker-ubuntu-%EC%BB%A8%ED%85%8C%EC%9D%B4%EB%84%88%EB%A1%9C-spark-%EC%8B%A4%EC%8A%B5%ED%99%98%EA%B2%BD-%EB%A7%8C%EB%93%A4%EA%B8%B0-1.-%EC%BB%A8%ED%85%8C%EC%9D%B4%EB%84%88-%EC%A4%80%EB%B9%84/>   
<https://www.daleseo.com/docker-volumes-bind-mounts/#%EB%B3%BC%EB%A5%A8-vs-%EB%B0%94%EC%9D%B8%EB%93%9C-%EB%A7%88%EC%9A%B4%ED%8A%B8>   


{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

