---
layout: post
title: "[DB] DocumentDB(MongoDB) Replica Set 과 readPreference 설정"
subtitle: "Primary, Secondary, Arbiter / Write Concern / 복제 지연"
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
반영이 필요하지 않는 부분에 있어서는 읽기 작업에 대한 역할을 Secondary에 분산시켜 부하를 줄일 수 있다.    
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

## 2. readPreference 설정   

`Secondary 노드들이 동기화한 데이터를 예비 Primary를 위한 후보군으로만 
사용하는 것이 아니라 Read 작업을 분산할 수 있도록 설정해주는 것이다.`       

읽기 작업의 분산을 통해 Primary에 들어오는 부하를 줄일 수 있다.   

MongoDB의 공식문서에 따르면 readPreference 옵션은 5가지가 있다.   

- primary: 기본값이며, Primary 구성원으로부터 값을 읽어 오며, 딜레이 없이 데이터 수정 및 삽입 작업이 가능하다.   

- primaryPreferred: Primary 구성원으로부터 우선적으로 데이터를 읽어온다. 
특별히 Primary 쪽의 읽기 작업이 밀려있지 않으면 Primary에서 
데이터를 가져오기 때문에 변경사항을 바로 확인 할 수 있다. 읽기가 밀려 있는 상태라면 Secondary에서 데이터를 읽어온다.      

- secondary: 모든 읽기 작업을 Secondary에서 처리한다.      

- secondaryPreferred: 우선적으로 읽기 작업이 발생하면 Secondary에 작업을 요청한다. 하지만 모든 Secondary에서 작업이 
밀려 있는 경우 Primary에 읽기 작업을 요청한다.   

- nearest: 해당 구성원이 Primary인지 Secondary인지에 관계없이 네트워크 대기 시간이 가장 짧은 복제본 세트의 구성원에서 읽기 
작업을 한다.   

- - -     

## 3. Write Concern(쓰기 고려)   

`write concern은 MongoDB가 Client의 요청으로 데이터를 기록할 때, 해당 요청에 대한 
Response를 어느 시점에 주느냐에 대한 동작 방식을 말한다.`   

<img width="600" alt="스크린샷 2022-12-11 오후 4 28 01" src="https://user-images.githubusercontent.com/26623547/206891533-4395a708-fcd7-4cf9-8e24-b325d8fc2567.png">     

MongoDB는 Client가 보낸 데이터를 Primary에 기록하고, 이에 대한 Response를 Client에게 
보내게 된다.   

이때, MongoDB를 레플리카 셋을 위 그림처럼 Primary 1대와 Secondary 2대로 구성하였을 경우, 
    Client가 보낸 데이터의 Write 처리는 Primary에서만 먼저 처리하게 되며, 이후 Secondary로 
    변경된 데이터를 동기화 시키는 단계를 거친다.    

`이때 주의해야할 점은 Primary와 Secondary 간 동기화 되는데 시간차가 있다는 점이다.`   

만약 Client가 보낸 데이터를 Primary가 처리한 직후 Client 쪽으로 Response를 보내고 
이후, Primary와 Secondary 간 동기화가 진행된다고 가정하면 Client가 Response를 받는 시점과 
Primary에서 Secondary로 Sync 되는 타이밍 사이에는 데이터 일관성이 보장되지 않는 
위험 구간이 존재하게 되는 것이다.   

<img width="600" alt="스크린샷 2022-12-11 오후 4 36 35" src="https://user-images.githubusercontent.com/26623547/206891811-b092e81f-8c0a-4614-aa4a-8899cfdab754.png">   

만약 이 사이에 Primary에 장애가 발생 했다고 가정해보면, 
    아직 최신 데이터를 Sync 하지 못한 Secondary 멤버가 Primary로 승격되고 Client는 이를 
    알아차리지 못한 채 이미 작업이 완료된 Response를 받았기 때문에 
    Client가 알고 있는 데이터와 DB의 데이터가 unmatch 되는 상횡이 발생되게 된다.   

이러한 문제를 해결하기 위해 
`Client 쪽에 보내는 response 시점을 Primary와 Secondary가 동기화 된 이후로 설정이 가능한데 
이것이 바로 Write concern 설정의 핵심이다.`    

<img width="600" alt="스크린샷 2022-12-11 오후 4 44 38" src="https://user-images.githubusercontent.com/26623547/206892085-45fa534d-eba1-4c0b-994c-45b3f60a2d29.png">   

`Write Concern을 설정하게 되면 Primary가 데이터 쓰기를 처리한 이후 바로 Client에게 
Response를 보내는 것이 아니라 Secondary 쪽으로 데이터를 동기화 작업을 완료한 이후에 
Client에게 Response를 보내게 된다.`       

이렇게 되면 Client와 Primary, Secondary 간에 데이터 일관성을 유지할 수 있게 된다.   

#### 3-1) Write Concern 옵션   

`Write Concern을 지정하는데는 크게 w, j, wtimeout을 설정`할 수 있는데 자세한 내용은 
아래와 같다.   

- w option   
    - w 를 설정하게 되면, 레플리카 셋에 속한 멤버 중 지정된 수 만큼 멤버에게 데이터 쓰기가 완료되었는지 확인한다.   
    - 만약 Primary, Secondary가 총 3대로 구성된 레플리카 셋일 경우, w=3으로 설정시 3대의 멤버에 데이터 쓰기가 완료된 것을 확인하고 response를 반환하게 된다.   
    - 보통은 w=1이 Default 설정이며, 이런 경우 Primary에만 기록 완료되면 response 하게 된다.   

    - 만약, `w = majority로 설정할 경우, 멤버의 과반수 이상을 자동으로 설정하게 된다. 즉, 3대의 멤버가 레플리카 셋에 속해 있을 경우 w=2와 동일한 설정으로 보면 된다.`      

- j option   
    - 해당 값을 설정하면, 데이터 쓰기 작업이 디스크 상의 journal에 기록된 후 완료로 판단하는 옵션이다.   
    - 만약, 레플리카 셋의 멤버가 3대인 경우 w=majority, j=true로 설정시 Primary 1대 Secondary 1대 총 2대의 멤버에서 디스크의 journal까지 기록이 완료 된 후 response 하게된다.   

- wtimeout   
    - 해당 값을 설정하면, Primary에서 Secondary로 데이터 동기화시 timeout 값을 설정하는 옵션이다.   
    - 만약 wtimeout의 limit을 넘어가게 되면 실제로 데이터가 Primary에 기록되었다고 해도 error를 리턴하게 된다.   
    - 설정 단위는 milisecond 이다.   


> 위에서 Journaling이란, 스토리지에 데이터를 저장하기 전에 Journal 영역에 데이터의 변경 이력을 저장하고, 스토리지에 데이터 변경 내역을 저장하는 활동을 말한다.   


- - - 

## 4. 복제 지연   

복제 지연에 관한 정보는 아래 명령어로 확인 가능하다.   

> AWS DocumentDB는 Primary와 Secondary간 복제 지연 현상에 대해 보통 100ms 이하 일 것이라고 
가이드 하고 있다.   

```
rs.printSecondaryReplicationInfo()
```

- - - 

## 5. 멤버 우선순위(Priority) 및 설정 확인   

`Priority는 레플리카 셋 멤버가 Primary 노드가 될 수 있는 우선순위를 의미한다.`   

> 0~1000까지의 수치이며, 수치가 높을 수록 우선순위가 가장 높다.   
> 단, Priority가 0인 경우에는 Primary 노드가 될 수 없다.   

레플리카 셋 config 설정은 아래와 같이 확인 가능하다.   

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
      "w" : "majority",
      "wtimeout" : 0
    },
    "replicaSetId" : ObjectId("5ff56f6c04715ea0b73976f7")
  }
}
```

위에서 write concern에 관련된 설정을 확인해보자.   

"writeConcernMajorityJournalDefault: true" 는 write concern을 majority로 설정한 후 disk로 
data journal을 기록하는 설정이다.   

> DocumentDB는 데이터의 내구성을 높이기 위해 majority와 dis journaling을 사용하도록 기본적으로 
설정되어 있음을 알 수 있다.   




- - -   

**Reference**

<https://www.mongodb.com/docs/manual/reference/replica-configuration/#rsconf.writeConcernMajorityJournalDefault>   
<https://www.mongodb.com/docs/manual/reference/write-concern/>   
<https://bluese05.tistory.com/74>    
<https://rastalion.me/mongodb-replica-set-%EA%B5%AC%EC%84%B1%ED%95%98%EA%B8%B0/>    

{% highlight ruby linenos %}


{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

