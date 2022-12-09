---
layout: post
title: "[DB] MongoDB Replica Set"
subtitle: "Primary, Secondary, Arbiter"
comments: true
categories : Database
date: 2021-09-20
background: '/img/posts/mac.png'
---


## 1. MongoDB 레플리카 셋   

MongoDB의 레플리카 셋 구성 기능은 데이터베이스 고가용성 환경을 위해 
필요한 기술이다.   
DB 노드의 장애가 발생하거나, DB에 문제가 발생하는 경우에도 빠르게 
장애에 대응하여 복구하는 시간을 줄일수 있는 장점을 갖게 한다.    
MongoDB는 자체적인 기능으로 복제 기능을 지원한다.    
`레플리카 셋의 가장 큰 목적은 
서비스중인 MongoDB 인스턴스에 문제가 생겼을 때, 레플리카 셋의 구성원 중의 
하나인 복제 노드가 장애 노드를 즉시 대체하는 것이다.`       
어떠한 상황에서도 클라이언트와 DB와의 통신은 지속적으로 동작할 수 있도록 
구성하는 가장 기본적인 DB 설계 방식이다.   
MongoDB의 복제를 수행하기 위해서는 여러 mongoDB 인스턴스가 모인 
레플리카 셋(묶음)이 필요로 한다.   
레플리카 셋의 구성원이 되면 서로의 정보를 동기화 한다.      

레플리카 셋은 세가지 역할로 구성원을 나눌 수 있다.   

<img width="588" alt="스크린샷 2022-12-10 오전 1 32 58" src="https://user-images.githubusercontent.com/26623547/206748487-0ace20ca-3a3d-43e7-9368-12d400ee08b8.png">   

- Primary: 클라이언트에서 DB로 읽기 및 쓰기 작업을 한다.   
- Secondary: Primary로부터 데이터를 동기화 하며, 클라이언트의 읽기 작업을 분담할 수 있다. 즉, DB의 읽기 작업을 복제노드로 
분산시켜 DB의 읽기 부하를 줄이는 역할을 한다. 하지만 Primary와 Secondary의 동기화 시간을 
즉각적이지 않기 때문에 실시간 반영이 필요한 부분에서는 적용하기가 다소 어려운 부분이 있고, 실시간 
반영이 필요하지 않는 부분에 있어서는 읽기 작업에 대한 역할을 Secondary에 분산시켜 부하를 줄일수 있다.    
- Arbiter: 데이터를 동기화하지는 않으며 레플리카 셋의 복구를 돕는 역할을 한다.   

레플리카 셋 안에서 구성원들 사이에는 2초 간격으로 ping을 수행하여 서로의 
노드를 확인하는 작업을 한다.   
이러한 작업은 MongoDB에서는 Heartbeat이라고 부르며, 이 기능을 통해 
노드 및 DB의 장애를 파악한다.  
10초 동안 응답을 받지 못하면 해당 서버를 장애로 파악한다.   

장애가 발견되면 secondary 노드중에 하나를 Primary로 올리게 되는데 
이때 투표권을 가진 노드들이 Primary로 올리게 될 노드를 결정하여 Primary로 
승급시키게 된다.   

`MongoDB의 레플리카 셋은 최소 3대 이상의 구성원을 가지는 것을 권장하며, 홀수로 
노드의 수를 늘리는 것을 권장하고 있다.`   
레플리카 셋이 Primary와 Secondary 둘만으로 
구성되어 있는 경우에는 Primary에서 장애가 발생했을 때 Secondary 노드만 
남게되면 레플리카 셋의 다수의 멤버 투표를 할 수 없는 상황이 만들어지고 
Secondary는 고립된 노드로 남기 때문에 레플리카 셋이 정상적으로 동작하지 
않게 된다.   
그래서 레플리카 셋은 최소 3개의 세트로 구성해야 한다.    

> 만약 상황이 여의치 않을 때 DB로 사용할 수 있는 노드가 2개로 제한되어 있으면, 
    기타 다른 용도의 노드에 Arbiter를 구성해 선거권만 주면 2대의 DB로도 레플리카 셋을 구성하는 것은 가능하다.   

- - - 

## 2. 멤버 우선순위(Priority)   

`Priority는 레플리카 셋 멤버가 Primary 노드가 될 수 있는 우선순위를 의미한다.`   

> 0~1000까지의 수치이며, 수치가 높을 수록 우선순위가 가장 높다.   
> 단, Priority가 0인 경우에는 Primary 노드가 될 수 없다.   



```
rs0:PRIMARY> rs.conf()
{
  "_id" : "rs0",
  "version" : 1,
  "term" : 1,
  "protocolVersion" : NumberLong(1),
  "writeConcernMajorityJournalDefault" : true,
  "members" : [
    {
      "_id" : 0,
      "host" : "mongodb01:27017",
      "arbiterOnly" : false,
      "buildIndexes" : true,
      "hidden" : false,
      "priority" : 1,
      "tags" : {
      },
      "slaveDelay" : NumberLong(0),
      "votes" : 1
    },
    {
      "_id" : 1,
      "host" : "mongodb02:27017",
      "arbiterOnly" : false,
      "buildIndexes" : true,
      "hidden" : false,
      "priority" : 1,
      "tags" : {
      },
      "slaveDelay" : NumberLong(0),
      "votes" : 1
    },
    {
      "_id" : 2,
      "host" : "mongodb03:27017",
      "arbiterOnly" : false,
      "buildIndexes" : true,
      "hidden" : false,
      "priority" : 1,
      "tags" : {
      },
      "slaveDelay" : NumberLong(0),
      "votes" : 1
    }
  ],
  "settings" : {
    "chainingAllowed" : true,
    "heartbeatIntervalMillis" : 2000,
    "heartbeatTimeoutSecs" : 10,
    "electionTimeoutMillis" : 10000,
    "catchUpTimeoutMillis" : -1,
    "catchUpTakeoverDelayMillis" : 30000,
    "getLastErrorModes" : {
    },
    "getLastErrorDefaults" : {
      "w" : 1,
      "wtimeout" : 0
    },
    "replicaSetId" : ObjectId("5ff56f6c04715ea0b73976f7")
  }
}
```


    








- - -   

**Reference**

<https://rastalion.me/mongodb-replica-set-%EA%B5%AC%EC%84%B1%ED%95%98%EA%B8%B0/>    

{% highlight ruby linenos %}


{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

