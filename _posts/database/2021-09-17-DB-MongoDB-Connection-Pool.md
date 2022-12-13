---
layout: post
title: "[DB] MongoDB 커넥션"
subtitle: "maxConnectionIdleTime, maxConnectionLifeTime, minPoolSize, maxPoolSize / MongoClientSettings"
comments: true
categories : Database
date: 2021-09-17
background: '/img/posts/mac.png'
---

## 1. MongoDB 커넥션 관리    

`MongoDB 드라이버는 커넥션 풀을 명시적으로 설정하지 않아도 커넥션 풀을 사용하고 
기본 값이 MaxPoolSize 100, MinPoolSize 0이다.`   


웹 어플리케이션에서 동시적으로 많은 트래픽이 몰리는 상황에서는 사용하지 
않는 커넥션을 계속 점유하는 문제가 발생할 수 있다.   

이 문제는 `MaxConnIdleTime`을 추가 설정함으로써 해결할 수 있다.   

```
clientOptions := options.Client().ApplyURI("mongodb://localhost:27017")
clientOptions.SetMaxPoolSize(100)
clientOptions.SetMinPoolSize(10)
clientOptions.SetMaxConnIdleTime(10 * time.Second)
```

위와 같이 설정하면 최초에는 커넥션을 10개를 생성하고 최대 100개까지 
늘어나며, `사용하지 않고 대기하고 있는 커넥션 즉 유후 커넥션은 10초가 
지나면 종료한다.`   

`여기서 주의해야 할 점은 MongoDB 드라이버의 유휴 커넥션을 종료 시키는 시점이다.`     

드라이버 내부에서 유휴 시간을 지속적으로 확인하여 종료 시키는 것이 
아니라, maintenanceInitialDelayMS, maintenanceFrequencyMS 시간에 따라 일정 주기로 
관리를 한다.
`해당 주기에 따라, 유휴 커넥션을 모두 정리하고, 최소 커넥션 풀의 크기를 확인하여 
부족한 커넥션을 생성하는 행위가 maintenance라고 한다.`   

즉, 이것은 엄밀하게 커넥션이 최대 유휴 시간이 지나도 종료되지 않을 수 
있음을 의미한다.   


- - - 

## 2. 커넥션 확인 

아래는 서버 상태를 조회할 수 있다.    

```
db.serverStatus() 
```

아래는 DB 세션 연결 수, 허용 수, 여태까지 연결된 수를 확인 가능하다.     

```
db.serverStatus().connections   

{
    "currnet": 58,
    "available": 51142,
    "totalCreated": 116599,
    "active": 2
}
```

replication 조회 및 상태 구성 확인 가능하다.   

```
rs.status()
rs.conf()
```

- - - 

## 3. MongoClientSettins    

아래는 MongoClientSettings를 이용하여 MongoDB에서 사용할 설정을 셋팅할 수 있는 
샘플 코드이다.   

minSize와 maxSize로 connection을 관리할 수 있는 것을 확인할 수 있다.   

자세한 내용은 [링크](https://aws.amazon.com/ko/blogs/database/building-resilient-applications-with-amazon-documentdb-with-mongodb-compatibility-part-1-client-configuration/)를 
확인하자.   

```java
MongoClientSettings settings =
         MongoClientSettings.builder()
                 .applyToClusterSettings(builder ->
                         builder.hosts(Arrays.asList(new ServerAddress(clusterEndpoint, 27017))))
                 .applyToClusterSettings(builder ->
                         builder.requiredClusterType(ClusterType.REPLICA_SET))
                 .applyToClusterSettings(builder ->
                         builder.requiredReplicaSetName("rs0"))
                 .applyToClusterSettings(builder ->
                         builder.mode(ClusterConnectionMode.MULTIPLE))
                 .readPreference(ReadPreference.secondaryPreferred())
                 .applyToSslSettings(builder ->
                         builder.enabled(true))
                 .credential(MongoCredential.createCredential(username,"Admin",password.toCharArray()))
                 .applyToConnectionPoolSettings(builder ->
                         builder.maxSize(10))
                 .applyToConnectionPoolSettings(builder ->
                         builder.maxWaitQueueSize(2))
                 .applyToConnectionPoolSettings(builder ->
                         builder.maxConnectionIdleTime(10, TimeUnit.MINUTES))
                 .applyToConnectionPoolSettings(builder ->
                         builder.maxWaitTime(2, TimeUnit.MINUTES))
                 .applyToClusterSettings(builder ->
                         builder.serverSelectionTimeout(30, TimeUnit.SECONDS))
                 .applyToSocketSettings(builder ->
                         builder.connectTimeout(10, TimeUnit.SECONDS))
                 .applyToSocketSettings(builder ->
                         builder.readTimeout(0, TimeUnit.SECONDS))
                 .build();

MongoClient mongoClient =  MongoClients.create(settings);
```

- - -   

**Reference**

<https://aws.amazon.com/ko/blogs/database/building-resilient-applications-with-amazon-documentdb-with-mongodb-compatibility-part-1-client-configuration/>   
<https://medium.com/@kyle_martin/mongodb-in-production-how-connection-pool-size-can-bottleneck-application-scale-439c6e5a8424>   
<https://www.mongodb.com/docs/manual/tutorial/connection-pool-performance-tuning/>   
<https://www.popit.kr/mongodb-golang-%EB%93%9C%EB%9D%BC%EC%9D%B4%EB%B2%84%EC%9D%98-%EC%BB%A8%ED%85%8D%EC%8A%A4%ED%8A%B8%EC%99%80-%EC%BB%A4%EB%84%A5%EC%85%98/>     
<https://www.mongodb.com/docs/drivers/java/sync/v4.3/fundamentals/monitoring/#std-label-command-events-java>   

{% highlight ruby linenos %}


{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

