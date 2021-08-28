---
layout: post
title: "[Hadoop] Apache Hadoop과 설치하고 실습하기"
subtitle: "Hadoop의 hdfs와 mapreduce 이해하기"       
comments: true
categories : Hadoop
date: 2021-08-06
background: '/img/posts/mac.png'
---

# 하둡(Hadoop)     

하둡은 빅데이터 인프라 기술 중에 하나로 분산처리를 통해 수많은 데이터를 저장하고 
처리하는 기술이다.    
하둡 프레임워크는 몇 가지 프레임워크로 이루어져 있다. 이중에서도 
`가장 핵심적인 기능을 하는 것은 맵리듀스(MapReduce) 프레임워크와 
분산형 파일 시스템(HDFS)이다.`    

`하둡의 동작흐름은 데이터가 들어오면, 데이터를 쪼갠다. 그리고 
그 데이터를 분리해서 저장한다. 따라서 데이터를 쪼갠 후에 어느 데이터 노드에 
저장이 되어 있는지를 기록해 놓는 부분(메타데이터)이 필요하다.`      
`정리하면, 하둡에서 데이터를 저장하기 전에 네임노드에서 분산을 하고 
저장위치를 분배한다. 그 후에 여러개 중에 지정된 데이터 노드에 저장을 한다고 
간단히 이해하자.`     


## 맵리듀스의 원리     

상식적으로 1명이 100개를 훑어보는 것과 100명이 1개씩 훑어보는 것이 빠를 것이다. 
이것이 분산처리의 핵심이지만 100명이 훑어본 결과를 취합하고 정리하는 소요가 
있게 마련이다. 또한 탐색할 양이 101개이거나 1개의 길이가 서로 다르다면 
이를 동일한 업무크기로 나누는 일도 쉽지가 않을 것이다.   

맵리듀스는 이러한 처리를 돕는 역할을 한다. 이름 그대로 Map단계와 Reduce단계로 
이루어진다. 먼저 Map 단계에서는 흩어져 있는 데이터를 key, value로 데이터를 
묶어준다. 예를 들어 key는 몇 번째 데이터인지, value는 값을 추출한 정보를 가진다. 
그리고 Reduce단계는 Map단계의 key를 중심으로 필터링 및 정렬한다.   

- - - 

## 1. 하둡 설치 

macOS에서 brew를 이용하여 쉽게 설치할 수 있다.   

```
$ brew install hadoop   
```   

아래와 같이 에러가 발생한다면 /usr/local/sbin 폴더를 생성하면 해결된다.   

```
" Error: The `brew link` step did not complete successfully. The formula built, but is not symlinked into /usr/local. Could not symlink sbin/FederationStateStore. /usr/local/sbin is not writable."
```

- - - 

## 2. 하둡 설정    

하둡 설정을 위해 관련된 파일을 수정해줘야 한다. 수정해야 할 파일은 아래 경로에 있다.     

```
$ cd /usr/local/Cellar/hadoop/3.3.1/libexec/etc/hadoop
// 또는 Finder에서 Cmd+Shift+G 명령어를 이용하여 경로 검색
```

- `hadoop-env.sh`     
- `core-site.xml`     
- `mapred-site.xml`  
- `hdfs-site.xml`      

#### 2-1) hadoop-env.sh   

해당하는 파일의 기존 내용이 없다면 변경에 해당하는 내용을 추가로 기재한다.    

```
기존: export HADOOP_OPTS="$HADOOP_OPTS -Djava.net.preferIPv4Stack=true"
변경: export HADOOP_OPTS="$HADOOP_OPTS -Djava.net.preferIPv4Stack=true -Djava.security.krb5.realm= -Djava.security.krb5.kdc=" 
```   

#### 2-2) core-site.xml    

core-site.xml 파일은 HDFS와 맵리듀스에 공통적으로 사용되는 IO와 같은 
하둡 코어를 위한 환경을 설정하는 파일이다.   
파일의 configuration 태그 안에 작성한다.   

```
  <configuration>
      <property>
          <name>hadoop.tmp.dir</name>
          <value>/usr/local/Cellar/hadoop/hdfs/tmp</value>
          <description>A base for other temporary directories.</description>
      </property>
      <property>
          <name>fs.default.name</name>
          <value>hdfs://localhost:9000</value>
      </property>
  </configuration>
```

#### 2-3) mapred-site.xml    

mapred-site.xml 파일은 Job Tracker와 Task Tracker 같은 맵리듀스 데몬을 
위한 환경을 설정하는 파일이다.    
파일의 configuration 태그 안에 작성한다.   

```
  <configuration>
      <property>
          <name>mapred.job.tracker</name>
          <value>localhost:9010</value>
      </property>
  </configuration>
```   

#### 2-4) hdfs-site.xml   

hdfs-site.xml 파일은 네임노드, 보조 네임노드, 데이터 노드 등과 같이 
HDFS 데몬을 위한 환경을 설정하는 파일이다.   
파일의 configuration 태그 안에 작성한다.   

```
  <configuration>
      <property>
          <name>dfs.replication</name>
          <value>1</value>
      </property>
  </configuration>
```

- - - 

## 3. 하둡 실행  

하둡을 실행하기 전에 하둡 파일 시스템(HDFS)으로 포맷을 해야한다.   
터미널에서 다음과 같이 입력하여 HDFS로 포맷한다.    

```
$ cd cd /usr/local/cellar/hadoop/3.3.1/libexec/bin
$ hdfs namenode -format
```

포맷 후, 아래와 같이 ssh key를 생성하고 사용한다.   
key 이름과 비밀번호 입력 라인이 나올때, 빈칸으로 엔터를 
누르면 자동으로 id_rsa.pub이 생성된다.       

```
$ ssh-keygen -t rsa
$ cat ~/.ssh/id_rsa.pub >> ~/.ssh/authorized_keys
```

이제 하둡을 실행할 때 아래와 같이 에러가 날 경우는 
원격 로그인을 허용하지 않았을 경우 발생 한다.   


```
"localhost: ssh: connect to host localhost port 22: Connection refused"   
```

환경설정의 공유에 들어가서 원격 로그인을 허용한다.    

<img width="591" alt="스크린샷 2021-08-06 오후 11 14 22" src="https://user-images.githubusercontent.com/26623547/128523833-79843bec-8a03-403b-9190-6c9d21ecd0ff.png">   

아래와 같이 ssh가 제대로 접속되는지 확인 할 수 있다.   

```
$ ssh localhost    
```   

#### 3-1) 실행 및 종료 명령어    

하둡을 실행하고 종료하는 명령어는 다음과 같다.   

- 실행  

```
$ cd /usr/local/cellar/hadoop/3.3.1/libexec/sbin
$ ./start-all.sh
# 또는
$ ./start-dfs.sh
# 또는
$ ./start-yarn.sh
```  

- 종료  

```
$ cd /usr/local/cellar/hadoop/3.3.1/libexec/sbin   
$ ./stop-all.sh
# 또는
$ ./stop-dfs.sh
# 또는
$ ./stop-yarn.sh
```  

정상적으로 실행된 것인지 알고 싶을 때 jps 명령어를 입력한다.    

```
29171 NodeManager
28644 NameNode
29255 Jps
28745 DataNode
28206 ResourceManager
28879 SecondaryNameNode
```

참고로 start-dfs.sh 실행할때 아래와 같이 warning이 나올수 있는데, 이는 
64비트 운영체제에서 32비트 하둡을 실행하기 때문에 발생하는 에러라고 한다.    
인터넷 검색해보니 해결방법이 없지는 않으나, 크게 중요한 문제는 아니라고 한다.  
해당 warning이 떠도 실행은 잘된다.   

```
"2018-12-16 09:22:37,400 WARN util.NativeCodeLoader: Unable to load native-hadoop library for your platform... using builtin-java classes where applicable"    
```    


#### 3-2) 하둡 실행 확인      

localhost로 접속해서 하둡의 상태를 체크할 수 있다.   

Cluster status : [http://localhost:8088](http://localhost:8088)     
HDFS status : [http://localhost:9870](http://localhost:9870)   
Secondary NameNode status : [http://localhost:9868](http://localhost:9868)   

<img width="711" alt="스크린샷 2021-08-06 오후 11 15 02" src="https://user-images.githubusercontent.com/26623547/128523847-dbc654c6-c301-4e9d-add8-fbe332a48363.png">



- - - 

**Reference**   

<https://han-py.tistory.com/361>   
<http://www.incodom.kr/hadoop_%EC%B4%9D%EC%A0%95%EB%A6%AC>    
<https://tariat.tistory.com/492>   
<https://rap0d.github.io/tip/2019/10/01/mac_hadoop_in_mac/>   
<https://key4920.github.io/p/mac-os%EC%97%90-%ED%95%98%EB%91%A1hadoop-%EC%84%A4%EC%B9%98/>   

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}
