---
layout: post
title: "[Redis] Jedis Pool 최적화(레디스 커넥션 풀)"
subtitle: " "       
comments: true
categories : BigData
date: 2021-05-14
background: '/img/posts/mac.png'
---


JedisPool 파라미터를 잘 사용하게 되면, Redis의 성능을 향상시키는데 도움이 된다.   
이 글에서는 Jedis를 사용할 때, JedisPool을 사용하는 방법과, 리소스 풀 파라미터를 
구성하는 방법에 대해 살펴보자.   
또한, JedisPool을 최적화하기 위한 권장 파라미터 구성을 제공한다.   

- - -

## 1. 사용 방법 

아래와 같이 그래들에 디펜던시를 추가한다.   

```groovy
compile group: 'redis.clients', name:'jedis', versions:'3.6.1'   
```

커넥션 풀과 관련된 클래스들은 JedisPool, JedisPoolConfig, 
    ShardedJedisPool (cluster version) and 
    JedisSentinelPool (master-slave version - with sentinel) 등이 있다.     

아래 예시와 같이 JedisPool을 사용하기 위해 JedisPoolConfig 객체를 생성해 넣어 주고 
접속 호스트, 포트, 타임아웃 시간 등을 이용하여 생성할 수 있다.   
`생성한 JedisPool에서 Jedis 커넥션을 가져와서 사용한 뒤 close() 메소드를 호출해서 
반드시 반납을 해줘야 한다.`   

```java
//1. Initialize a connection pool: host is the connection IP or domain name of the redis service, port is the connection port, password is the connection password, and timeout is the connection, read and write timeout time
JedisPool jedisPool = new JedisPool(new JedisPoolConfig(), host, port, timeout, password);


Jedis jedis;
try {
    //2. Get connection from connection pool
    jedis = jedisPool.getResource();

    //3. Execute command
    String userName = jedis.get("username");
} catch (Exception e) {
    logger.error(e.getMessage(), e);
} finally {
    //4. Return the connection to the resource pool
    if (jedis != null) 
        jedis.close();
}
```

- - - 

## 2. 파라미터 설명   

`Jedis는 Apache Common-pool2를 사용하여 리소스 풀을 관리한다.`      

> 관련 클래스들은 GenericObjectPool, GenericObjectPoolConfig, GenericKeyedObjectPool, GenericKeyedObjectPoolConfig 등이 있다.   

`JedisPool은 스레드로부터 안전한 커넥션 풀이며 모든 리소스를 관리 가능한 범위 내에서 유지할 수 있다.`   

아래는 GenericObjectPoolConfig 공통 파라미터들이며, 각 파라미터를 잘 이해하고 사용해야 성능에 도움을 줄 수 있다.     

<img width="850" alt="스크린샷 2022-12-16 오전 12 40 06" src="https://user-images.githubusercontent.com/26623547/207903456-24f70f57-6580-4633-ac4f-9a9a63f667c2.png">   

아래 파라미터들은 idle connection 탐지와 관련이 있다.   

<img width="850" alt="스크린샷 2022-12-16 오전 12 37 55" src="https://user-images.githubusercontent.com/26623547/207902930-b92687db-efdd-4d3a-9c15-a8e7de0be879.png">   



```java
public class JedisPoolConfig extends GenericObjectPoolConfig {
  public JedisPoolConfig() {
    // defaults to make your life with connection pool easier :)
    setTestWhileIdle(true);
    setMinEvictableIdleTimeMillis(60000);
    setTimeBetweenEvictionRunsMillis(30000);
    setNumTestsPerEvictionRun(-1);
  }
}
```

> org.apache.commons.pool2.impl.BaseObjectPoolConfig에서 모든 기본값을 볼 수 있다.   

- - - 

## 3. 주요 파라미터 구성에 대한 권장 사항 

#### 3-1) maxTotal: 최대 커넥션 수   

maxTotal을 올바르게 설정하려면 다음 요소를 고려해야 한다.   

- 비즈니스에 필요한 Redis 동시 커넥션   
- 클라이언트가 명령을 실행하는 데 걸리는 시간   
- maxTotal에 노드(어플리케이션) 수를 곱한 결과는 Redis에서 허용되는 최대 커넥션 수보다 작아야 한다.   
- 커넥션 생성 및 해제 비용(각 요청에 대해 생성 및 해제된 커넥션 수가 많으면 생성 및 해제 프로세스시 막대한 비용이 소요된다.)   



#### 3-2) maxIdle and minIdle   





- - - 

**Reference**   

<https://theserverside.tistory.com/302>   
<https://github.com/RedisLabs/spark-redis/tree/master/doc>   
<https://docs.jdcloud.com/en/jcs-for-redis/jedispool-connct>    

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}
