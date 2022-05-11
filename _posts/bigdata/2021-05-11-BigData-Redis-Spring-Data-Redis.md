---
layout: post
title: "[Redis] Spring Data Redis 사용하여 캐싱하기"
subtitle: "Spring에서 RedisTemplate와 RedisRepository / @Cacheable, @CachePut, @CacheEvict / @Indexed "       
comments: true
categories : BigData
date: 2021-05-11   
background: '/img/posts/mac.png'
---

이번 포스팅에서는 Java에서 Spring Data Redis를 이용하여 
Redis와 통신하는 방법에 대해서 알아보자.   

Redis에 대한 개념은 [이전글](https://wonyong-jang.github.io/bigdata/2021/05/04/BigData-Redis-Collection.html)를 
참고하자.     

Java의 Redis Client는 크게 두 가지가 있다.   
Jedis와 Lettuce이며, 원래 Jedis를 많이 사용했으나 
Lettuce와 비교했을 때 TPS/CPU/응답속도 등 모두 Lettuce가 월등히 
성능이 좋기 때문에 추세가 넘어가고 있었다.   

그러다 결국 Spring boot 2.0 부터 Jedis가 기본 클라이언트에서 
deprecated 되고 Lettuce가 탑재되었다.   

더 자세한 내용은 [Spring Session에서 Jedis 대신 Lettuce를 사용하는 이유](https://github.com/spring-projects/spring-session/issues/789)를 
참고하자.     

- - - 

## Spring Boot에서 Redis 설정   

Spring Boot에서 Redis를 사용하는 방법은 RedisRepository와 
RedisTemplate 두 가지가 있다.   

그전에 아래와 같이 설정이 필요하다.   
build.gradle에 아래 라이브러리를 추가한다.   

```
implementation 'org.springframework.boot:spring-boot-starter-data-redis'
```

또한, application.yml에 host와 port를 설정한다.   

```java
spring:
  redis:
    host: localhost
    port: 6379
```

마지막으로 Configuration에서 Bean에 등록해준다.    

```java
@Configuration
public class RedisConfig {

    @Value("${spring.redis.host}")
    private String host;

    @Value("${spring.redis.port}")
    private int port;

    @Bean
    public RedisConnectionFactory redisConnectionFactory() {
        return new LettuceConnectionFactory(host, port);
    }
}
```   

- - - 

## 1. RedisRepository      

`Spring Data Redis의 Redis Repository를 이용하면 간단하게 Domain Entity를 
Redis Hash로 만들 수 있다.`   
`다만 트랜잭션을 지원하지 않기 때문에 만약 트랜잭션을 적용하고 
싶다면 RedisTemplate을 사용해야 한다.`   

##### Entity   

```java
@Getter
@RedisHash(value = "people", timeToLive = 30)
public class Person {

    @Id
    private String id;
    private String name;
    private Integer age;
    private LocalDateTime createdAt;

    public Person(String name, Integer age) {
        this.name = name;
        this.age = age;
        this.createdAt = LocalDateTime.now();
    }
}
```   

- Redis에 저장할 자료구조인 객체를 정의한다.   
- 일반적인 객체 선언 후 `@RedisHash`를 붙이면 된다.   
    - value : Redis의 keyspace값으로 사용된다.   
    - timeToLive : 만료시간을 seconds 단위로 설정할 수 있다. 기본값은 만료시간이 없는 -1L이다.  
        - @TimeToLive(unit = TimeUnit.MILLISECONDS) 필드에 선언하여 사용할 수도 있으며, 옵션단위를 변경도 가능하다.   
- @Id 어노테이션이 붙은 필드가 Redis Key값이 되며 null로 세팅하면 랜덤값이 설정된다. 
    - `keyspace와 합쳐져서 레디스에 저장된 최종 키 값은 keyspace:id가 된다.`       

##### Repository   

```java
public interface PersonRedisRepository extends CrudRepository<Person, String> {
}
```

- CrudRepository를 상속받는 Repository 클래스를 추가한다.   

##### Test   

```java
@SpringBootTest
public class RedisRepositoryTest {

    @Autowired
    private PersonRedisRepository repo;

    @Test
    void test() {
        Person person = new Person("Park", 20);

        // 저장
        repo.save(person);

        // `keyspace:id` 값을 가져옴
        repo.findById(person.getId());

        // Person Entity 의 @RedisHash 에 정의되어 있는 keyspace (people) 에 속한 키의 갯수를 구함
        repo.count();

        // 삭제
        repo.delete(person);
    }
}
```

##### redis-cli로 데이터 확인   

<img width="600" alt="스크린샷 2022-01-31 오후 12 53 45" src="https://user-images.githubusercontent.com/26623547/151736785-05e8ce1e-071e-4182-9588-ec45911b1f4f.png">   

- id 값을 설정하지 않았기 때문에 랜덤값이 들어간 것을 확인할 수 있다.   
- 데이터를 저장하면 people과 people:{id값} 라는 두개의 키값이 저장되었다.   
- people 키값은 Set 자료구조이며, People 엔티티에 해당하는 모든 Key를 
가지고 있다.   
- people:{id값} 은 Hash자료구조이며 테스트 코드에서 작성한 값대로 field, value가 들어있는 것을 확인할 수 있다.   
- timeToLive를 설정했기 때문에 30초 뒤에 사라진다. ttl 명령어로 확인 가능하다.   


##### @Indexed   

`@Indexed 어노테이션을 사용해서 id값 외에 다른 필드로 조회할 수 있도록 SecondIndex를 지원한다.`         



```java
@Getter
@RedisHash(value = "people", timeToLive = 30)
public class Person {

    @Id
    private String id;
    @Indexed // 필드 값으로 데이터 찾을 수 있게 하는 어노테이션 
    private String name;
...
}


public interface PersonRedisRepository extends CrudRepository<Person, String> {
    Optional<Person> findByName(String name);
}
```

- - - 


## 2. RedisTemplate  

`redisTemplate에는 redis가 제공하는 list, set, sorted set, hash... 와 같은 
다양한 command를 지원하기 위한 opsFor* method가 있다.`    
사용하고자 하는 redis command에 대응되는 method를 호출하여 사용하면 된다.   
해당 method를 호출하면 각 redis command에 대응된 operation 객체가 반환된다.   

<img width="800" alt="스크린샷 2022-02-01 오후 8 00 05" src="https://user-images.githubusercontent.com/26623547/151956793-15f1ac95-7d66-47b0-bd3b-3ab6e23256a9.png">   


##### config 설정 추가   

```java
@Configuration
public class RedisConfig {
    @Value("${spring.redis.host}")
    private String host;

    @Value("${spring.redis.port}")
    private int port;

    @Bean
    public RedisConnectionFactory redisConnectionFactory() {
        return new LettuceConnectionFactory(host, port);
    }

    @Bean
    public RedisTemplate<?, ?> redisTemplate() {
        RedisTemplate<?, ?> redisTemplate = new RedisTemplate<>();
        redisTemplate.setConnectionFactory(redisConnectionFactory());
        return redisTemplate;
    }
}
```

##### String 

```java
@SpringBootTest
class RedisControllerTest {

    @Autowired
    private RedisTemplate<String, String> redisTemplate;

    @Test
    void testHash() {
        // given
        ValueOperations<String, String> valueOperations = redisTemplate.opsForValue();
        String key = "stringKey";

        // when
        valueOperations.set(key, "hello");

        // then
        String value = valueOperations.get(key);
        assertThat(value).isEqualTo("hello");
    }
}
```

##### Set   

```java
@Test
void testSet() {
    // given
    SetOperations<String, String> setOperations = redisTemplate.opsForSet();
    String key = "setKey";

    // when
    setOperations.add(key, "h", "e", "l", "l", "o");

    // then
    Set<String> members = setOperations.members(key);
    Long size = setOperations.size(key);

    assertThat(members).containsOnly("h", "e", "l", "o");
    assertThat(size).isEqualTo(4);
}
```

##### Hash   

```java
@Test
void testHash() {
    // given
    HashOperations<String, Object, Object> hashOperations = redisTemplate.opsForHash();
    String key = "hashKey";

    // when
    hashOperations.put(key, "hello", "world");

    // then
    Object value = hashOperations.get(key, "hello");
    assertThat(value).isEqualTo("world");

    Map<Object, Object> entries = hashOperations.entries(key);
    assertThat(entries.keySet()).containsExactly("hello");
    assertThat(entries.values()).containsExactly("world");

    Long size = hashOperations.size(key);
    assertThat(size).isEqualTo(entries.size());
}
```  

##### Geospatial   

```java
@Test
void testGeo() {
    GeoOperations<String, String> geoOperations = redisTemplate.opsForGeo();
    String key = "geopoints";

    Point point1 = new Point(127.0753893256187439, 37.62959205066435686);
    Point point2 = new Point(127.07614034414291382, 37.62974666865508055);

    geoOperations.add(key, point1, "Union Coffee");
    geoOperations.add(key, point2, "CU");

    Point point = new Point(127, 38);
    Metric metric = RedisGeoCommands.DistanceUnit.KILOMETERS;
    Distance distance = new Distance(200, metric);
    Circle circle = new Circle(point, distance);

    // 경도, 위도(127, 38) 기준으로 반경 200 km를 찾고, 
    // 가장 가까운 순서로 5개 위치정보 추출하기 
    // 거리와 좌표정보 같이 출력 
    RedisGeoCommands.GeoRadiusCommandArgs args = RedisGeoCommands
            .GeoRadiusCommandArgs
            .newGeoRadiusArgs()
            .includeDistance()
            .includeCoordinates()
            .sortAscending()
            .limit(5);
        
    GeoResults<RedisGeoCommands.GeoLocation<String>> radius = geoOperations
            .radius(key, circle, args);

    if (radius != null) {
        radius.forEach(geoLocationGeoResult -> {
            RedisGeoCommands.GeoLocation<String> content = geoLocationGeoResult.getContent();
            //member name such as tianjin
            String name = content.getName();
            // Corresponding latitude and longitude coordinates
            Point pos = content.getPoint();
            // Distance from the center point
            Distance dis = geoLocationGeoResult.getDistance();

            System.out.println(name);
            System.out.println(pos);
            System.out.println(dis);
        });
    }

    // CU에 대한 좌표 정보 삭제   
    //geoOperations.remove(key, "CU");
}
```  

`위의 코드를 살펴보면, opsForGeo()를 이용하여 Geospatial 자료구조를 만들었다.`      
`해당 자료구조에 CU, Union Coffee의 좌표 정보를 추가했고, 
    이제 좌표정보(127, 38)을 기준으로 반경 200 km 에 들어있는 가장 가까운 
    좌표 정보를 5개 찾는다.`        
    `또한, 찾은 데이터의 거리와 좌표정보도 같이 출력하게 된다.`       

- - - 

**Reference**   

<https://bcp0109.tistory.com/328>   
<https://sabarada.tistory.com/105>   

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}
