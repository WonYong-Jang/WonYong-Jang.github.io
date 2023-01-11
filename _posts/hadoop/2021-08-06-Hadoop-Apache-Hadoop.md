---
layout: post
title: "[Hadoop] Apache Hadoop과 설치하고 실습하기"
subtitle: "Hadoop의 hdfs와 mapreduce 이해하기"       
comments: true
categories : Hadoop
date: 2021-08-06
background: '/img/posts/mac.png'
---

## 1. 하둡(Hadoop) 이란

하둡은 빅데이터 인프라 기술 중에 하나로 분산처리를 통해 수많은 데이터를 저장하고 
처리하는 기술이다.    
하둡 프레임워크는 몇 가지 프레임워크로 이루어져 있다. 이중에서도 
`가장 핵심적인 기능을 하는 것은 맵리듀스(MapReduce) 프레임워크와 
분산형 파일 시스템(HDFS)이다.`    

하둡은 여러 대의 서버를 이용해 하나의 클러스터를 구성하며, 이렇게 클러스터로
묶인 서버의 자원을 하나의 서버처럼 사용할 수 있는 클러스터 컴퓨팅 환경을
제공한다.    

기본적인 동작 방법은 분석할 데이터를 하둡 파일 시스템인 HDFS에 저장해 두고
HDFS 상에서 맵리듀스 프로그램을 이용해 데이터 처리를 수행하는
방식이다.

`하둡 파일 시스템(HDFS)은 네임노드와 여러 개의 데이터 노드로 구성되며, 
    하나의 네임노드가 나머지 데이터 노드를 관리하는 형태로 동작한다.`   

`데이터를 저장할 때는 네임노드가 전체 데이터를 블록이라고 하는 일정한 크기로 나눠서 
여러 데이터 노드에 분산해서 저장하는데, 이 때 각 블록들이 
어느 데이터 노드에 저장돼 있는지에 대한 메타정보를 네임노드에 기록한다.`   
`그리고 맵리듀스 잡을 실행 할 때 거꾸로 네임노드로부터 
메타정보를 읽어서 처리할 데이터의 위치를 확인하고 분산처리를 수행한다.`      


- - - 

## 2. 맵리듀스의 원리     

상식적으로 1명이 100개를 훑어보는 것보다 100명이 1개씩 훑어보는 것이 빠를 것이다.    
이것이 분산처리의 핵심이지만 100명이 훑어본 결과를 취합하고 정리하는 시간이 소요되기
마련이다. 또한 탐색할 양이 101개이거나 1개의 길이가 서로 다르다면 
이를 동일한 업무크기로 나누는 일도 쉽지가 않을 것이다.   

맵리듀스는 이러한 처리를 돕는 역할을 한다. 이름 그대로 Map단계와 Reduce단계로 
이루어진다. 먼저 Map 단계에서는 흩어져 있는 데이터를 key, value로 데이터를 
묶어준다. 예를 들어 key는 몇 번째 데이터인지, value는 값을 추출한 정보를 가진다. 
그리고 Reduce단계는 Map단계의 key를 중심으로 필터링 및 정렬한다.   

- - - 

## 3. 하둡 설치   

#### 3-1) ssh와 java 버전 확인    

Hadoop 설치 전에 java가 설치되어 있어야 하며, 아래 명령어를 이용하여
ssh 사용가능한지 확인한다.   

> java 8 이상 버전으로 설치한다.   

아래와 같이 ssh key가 없는 경우 생성한다.    
key 이름과 비밀번호 입력 라인이 나올때, 빈칸으로 엔터를
누르면 자동으로 id_rsa.pub이 생성된다.

```
# 키가 없는 경우 키 생성
$ ssh-keygen -t rsa
$ cat ~/.ssh/id_rsa.pub >> ~/.ssh/authorized_keys
```

이제 하둡을 실행할 때 아래와 같이 에러가 날 경우는
원격 로그인을 허용하지 않았을 경우 발생 한다.


```
"localhost: ssh: connect to host localhost port 22: Connection refused"
```

환경설정의 공유에 들어가서 원격 로그인을 허용한다.

<img width="591" alt="스크린샷 2021-08-06 오후 11 14 22" src="https://user-images.githubusercontent.com/26623547/128523833-79843bec-8a03-403b-9190-6c9d21ecd0ff.png">

아래와 같이 ssh가 제대로 접속되는지 확인 할 수 있다.

```
$ ssh localhost
Last login: Wed Jan 11 00:37:47 2023
```


#### 3-2) hadoop 설치   

그 후 [Hadoop 공식문서](https://hadoop.apache.org/)에서 Binary Download를 클릭한다.   


```
$ wget https://dlcdn.apache.org/hadoop/common/hadoop-3.3.4/hadoop-3.3.4.tar.gz
$ tar zxvf hadoop-3.3.4.tar.gz

$ vi ~/.zshrc

# hadoop 환경 변수 추가
export HADOOP_HOME=/Users/jang-won-yong/dev/hadoop/hadoop-3.3.4
export PATH=$PATH:$HADOOP_HOME/bin
```

위에서 추가한 hadoop 환경 변수를 확인해보자.

```
$ source ~/.zshrc
$ echo $HADOOP_HOME
```

최종적으로 hadoop 명령어로 설치가 정상적으로 되었는지 확인한다.

```
$ hadoop
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
Last login: Wed Jan 11 00:37:47 2023   
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
