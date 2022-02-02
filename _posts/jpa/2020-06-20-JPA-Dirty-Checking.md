---
layout: post
title: "[Jpa] 더티 체킹(Dirty Checking) 이란? "
subtitle: "ORM 에서의 더티 체킹 / @DynamicUpdate"
comments: true
categories : Jpa
date: 2020-06-20
background: '/img/posts/mac.png'
---

# 더티 체킹(Dirty Checking)이란? 

Spring Data Jpa와 같은 ORM 구현체를 사용하다보면 더티 체킹이란 단어를 종종 듣게 된다.   

예를들어 다음과 같은 코드가 있다.  
(Spring Data Jap가 익숙하겠지만, 네이티브한 코드 먼저 보면 아래와 같다.)   

```java
@Slf4j
@RequiredArgsConstructor
@Service
public class PayService {

    public void updateNative(Long id, String tradeNo) {
        EntityManager em = entityManagerFactory.createEntityManager();
        EntityTransaction tx = em.getTransaction();
        tx.begin(); //트랜잭션 시작
        Pay pay = em.find(Pay.class, id);
        pay.changeTradeNo(tradeNo); // 엔티티만 변경
        tx.commit(); //트랜잭션 커밋
    }
}
```

코드를 보면 별도로 데이터베이스에 save 하지 않는다.   

1. 트랜잭션이 시작되고   
2. 엔티티를 조회하고   
3. 엔티티의 값을 변경하고  
4. 트랜잭션을 커밋한다.   

`여기서 데이터베이스에 update 쿼리에 관한 코드는 어디에도 없다!`   

그럼 아래와 같이 코드가 어떻게 작동하는지 테스트 코드를 작성해본다.   

```java
@RunWith(SpringRunner.class)
@SpringBootTest
public class PayServiceTest {

    @Autowired
    PayRepository payRepository;

    @Autowired
    PayService payService;

    @After
    public void tearDown() throws Exception {
        payRepository.deleteAll();
    }

    @Test
    public void 엔티티매니저로_확인() {
        //given
        Pay pay = payRepository.save(new Pay("test1",  100));

        //when
        String updateTradeNo = "test2";
        payService.updateNative(pay.getId(), updateTradeNo); // update

        //then
        Pay saved = payRepository.findAll().get(0);
        assertThat(saved.getTradeNo()).isEqualTo(updateTradeNo);
    }
}
```

<img width="333" alt="스크린샷 2020-06-20 오후 6 06 52" src="https://user-images.githubusercontent.com/26623547/85198132-1f618980-b321-11ea-8cc7-f394b9340ff0.png">   

테스트 코드를 수행해보면, 위와 같은 로그를 볼수 있다.   
`Pay 엔티티만 변경하였을 뿐인데 update 쿼리가 실행된 것을 알수 있다. 
이유는 Dirty Checking 덕분이다!`      

> 여기에서 Dirty란 상태의 변화가 생긴 정도로 이해하면 된다.   
> 즉, Dirty Checking이란 상태 변경 검사이다.   

`JPA에서는 트랜잭션이 끝나는 시점에 변화가 있는 모든 엔티티 객체를 데이터 
베이스에 자동으로 반영해준다.`   

이때 변화가 있다의 기준은 **최초 조회 상태**이다. 

JPA에서는 엔티티를 조회하면 해당 엔티티의 조회 상태 그대로를 스냅샷을 만들어 놓는다.   
그리고 트랜잭션이 끝나는 시점에는 이 스냅샷과 비교해서 다른점이 있다면 update query를 데이터베이스로 전달한다.   

`당연히 이런 상태 변경 검사의 대상은 영속성 컨텍스트가 관리하는 엔티티에만 적용된다.`   

- detach된 엔티티(준영속)   
- DB에 반영되기 전 처음 생성된 엔티티(비영속)

위 경우는 준영속/비영속 상태의 엔티티는 Dirty Checking 대상에 포함되지 않는다.   
`즉, 값을 변경해도 데이터베이스에 반영되지 않는다는 것이다! `   

Spring Data Jpa와 @Transactional이 함께 할 경우엔 아래와 같다.    

```java
@Slf4j
@RequiredArgsConstructor
@Service
public class PayService {

    private final PayRepository payRepository;

    @Transactional
    public void update(Long id, String tradeNo) {
        Pay pay = payRepository.getOne(id);
        pay.changeTradeNo(tradeNo);
    }
}
```

테스트 코드는 아래와 같다.   

```java
@Test
public void SpringDataJpa로_확인() {
    //given
    Pay pay = payRepository.save(new Pay("test1",  100));

    //when
    String updateTradeNo = "test2";
    payService.update(pay.getId(), updateTradeNo);

    //then
    Pay saved = payRepository.findAll().get(0);
    assertThat(saved.getTradeNo()).isEqualTo(updateTradeNo);
}
```

> 첫번째와 동일하게 update 쿼리를 확인할 수 있다!    


- - - 

## 변경 부분만 update 하고 싶을 땐?   

Dirty Checking으로 생성되는 update 쿼리는 기본적으로 모든 필드를 업데이트 한다.   

`JPA에서는 전체 필드를 업데이트하는 방식을 기본값으로 사용한다.`   
전체 필드를 업데이트하는 방식의 장점은 다음과 같다.   

- 생성되는 쿼리가 같아 부트 실행시점에 미리 만들어서 재사용가능하다.   
- 데이터베이스 입장에서 쿼리 재사용이 가능하다.( 동일한 쿼리를 받으면 이전에 파싱된 쿼리를 재사용한다.)   

다만 필드가 20~30개 이상인 경우엔 이런 전체 필드 Update 쿼리가 부담스러울 수 있다.   

`이런 경우엔 @DynamicUpdate로 변경 필드만 반영되도록 할수 있다.`   

엔티티 최상단에 아래와 같이 @DynamicUpdate 를 선언한다.   

```java
@Getter
@NoArgsConstructor
@Entity
@DynamicUpdate // 변경한 필드만 대응
public class Pay {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String tradeNo;
    private long amount;
```

<img width="190" alt="스크린샷 2020-06-20 오후 6 24 49" src="https://user-images.githubusercontent.com/26623547/85198415-84b67a00-b323-11ea-8dad-19d5e8bf6c5d.png">   
    

`변경분 trade_no 만 update 쿼리에 반영된 것을 확인 가능하다!`    

- - -
Referrence

[https://jojoldu.tistory.com/415](https://jojoldu.tistory.com/415)

{% highlight ruby linenos %}
{% endhighlight %}

{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

