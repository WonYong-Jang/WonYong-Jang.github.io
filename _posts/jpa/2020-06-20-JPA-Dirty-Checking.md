---
layout: post
title: "[JPA] 더티 체킹(Dirty Checking) 이란? "
subtitle: "ORM 에서의 더티 체킹 / Bulk update와 dirty checking 주의사항 / @DynamicUpdate"
comments: true
categories : JPA
date: 2020-06-20
background: '/img/posts/mac.png'
---

## 1. 더티 체킹(Dirty Checking)이란? 

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

> 영속성과 비영속성 등의 개념은 아래에서 다시 설명한다.   

위 경우는 준영속/비영속 상태의 엔티티는 Dirty Checking 대상에 포함되지 않는다.   
`즉, 값을 변경해도 데이터베이스에 반영되지 않는다는 것이다`        

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

> 첫번째와 동일하게 update 쿼리를 확인할 수 있다    


### 1-1) 변경 부분만 update 하고 싶을 땐?   

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

## 2. Bulk Update   

JPA는 보통 데이터를 가져와서 변경하면 변경 감지(dirty checking)를 통해 
DB에 업데이트 쿼리를 수행한다.   
이런 업데이트들은 건 별로 select 이후 update가 이뤄지기 때문에 수천 건을 
업데이트 해야하는 경우 비효율적일 수 있다.   

JPA를 사용해서도 수천, 수만 건의 데이터를 한번에 업데이트 하는 
Bulk update쿼리를 사용할 수 있다.   

Bulk update하는 방법과 Bulk update 사용시 주의사항에 대해서 살펴보자.   


```java
// 순수 JPA
@PersistenceContext EntityManager em; 

public int bulkAgePlus(int age) {
    return em.createQuery(
                "update Member m set m.age = m.age + 1" + 
                "where m.age >= :age")
            .setParameter("age", age)
            .executeUpdate();
}


// Spring Data JPA
@Repository
public interface MemberRepository extends JpaRepository<Member, Long> {
    @Modifying
    @Query("update Member m set m.age = m.age + 1 where m.age >= :age")
    int increaseAgeOfAllMembersOver(@Param("age") int age);
}
```

`위와 같이 Spring Data JPA에서는 Bulk update를 하기 위해서는 
@Query와 함께 @Modifying 어노테이션을 사용해야 한다.`      

`@Modifying 어노테이션을 사용할 때 주의할 점은 반환 타입을 반드시 void나 int 또는 Integer로 지정해야 
한다는 것이다.`   

다른 타입을 사용할 경우 아래와 같이 에러가 발생한다.   

```
org.springframework.dao.InvalidDataAccessApiUsageException: Modifying queries can only use void or int/Integer as return type! Offending method: public abstract long io.lcalmsky.springdatajpa.domain.repository.MemberRepository.increaseAgeOfAllMembersOver(int)
```

여기서 Bulk update시 또 하나의 주의해야할 사항이 있는데, 아래 코드로 살펴보자.     

```java
@Test
@DisplayName("벌크 업데이트 테스트: 나이가 n살 이상인 멤버의 나이를 1씩 증가시킨다")
@Transactional
public void bulkUpdate() {
    // given
    memberRepository.save(new Member("a", 10));
    memberRepository.save(new Member("b", 15));
    memberRepository.save(new Member("c", 20));
    memberRepository.save(new Member("d", 30));
    memberRepository.save(new Member("e", 40));
    // when
    int count = memberRepository.increaseAgeOfAllMembersOver(20);
    Member member = memberRepository.findByUsername("e");

    // then
    assertEquals(3, count);
    assertEquals(41, member.getAge()); 
}
```   

`Bulk update를 하게 되면, 영속성 컨텍스트에 반영을 하지 않고 
바로 DB에 반영하게 된다.`   

즉, 같은 트랜잭션 내에 Bulk update가 이뤄지고 update한 엔티티를 
조회하여 로직을 수행하는 경우 문제가 발생할 수 있다.   
위 예제와 같이 member 객체가 20살 이상이기 때문에 한살이 추가 되어야 
하지만, 테스트 결과는 40살이다.   

그 이유는 update는 이뤄져서 DB에는 반영되었지만 영속성 컨텍스트의 
1차 캐시에 반영이 되지 않기 때문에 조회시 40살 그대로 조회가 된다.   

그럼 Bulk update가 이뤄진 후에 반드시 조회가 필요한 경우는 어떻게 해야할까?   
아래와 같이 Bulk update 이후 영속성 컨텍스트를 비워주는 로직이 추가되어야 한다.   

```java
// 순수 JPA
@Test
@DisplayName("벌크 업데이트 테스트: 나이가 n살 이상인 멤버의 나이를 1씩 증가시킨다")
@Transactional
public void bulkUpdate() {
    // given
    memberRepository.save(new Member("a", 10));
    memberRepository.save(new Member("b", 15));
    memberRepository.save(new Member("c", 20));
    memberRepository.save(new Member("d", 30));
    memberRepository.save(new Member("e", 40));
    // when
    int count = memberRepository.increaseAgeOfAllMembersOver(20);

    entityManager.flush(); 
    entityManager.clear();

    Member member = memberRepository.findByUsername("e");

    // then
    assertEquals(3, count);
    assertEquals(41, member.getAge());
}

// Spring Data JPA
@Repository
public interface MemberRepository extends JpaRepository<Member, Long> {
    @Modifying(clearAutomatically = true)
    @Query("update Member m set m.age = m.age + 1 where m.age >= :age")
    int increaseAgeOfAllMembersOver(@Param("age") int age);
}
```

`flushAutomatically옵션은 flush()만, clearAutomatically옵션은 flush() 이후 
clear()까지 호출 해준다.`     

그럼 무조건 Bulk update 이후 영속성 컨텍스트를 비워줘야 할까?   
답은 상황에 따라 다르다.   
설계에 따라 Bulk update이후 조회가 필요 하지 않는 경우는 옵션을 
반드시 추가할 필요는 없다.    


```java
// 순수 JPA
@PersistenceContext EntityManager em;

public int bulkAgePlus(int age) {
    return em.createQuery(
                "update Member m set m.age = m.age + 1" +
                "where m.age >= :age")
            .setParameter("age", age)
            .executeUpdate();
}



// Spring Data Jpa
@Modifying
@Query("update Member m set m.age = m.age + 1 where m.age >= :age")
int bulkAgePlus(@Param("age") int age);
```

- - -
Referrence

<https://wonyong-jang.github.io/jpa/2020/06/11/JPA-Java-Persistence-Api.html>    
[https://jojoldu.tistory.com/415](https://jojoldu.tistory.com/415)

{% highlight ruby linenos %}
{% endhighlight %}

{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

