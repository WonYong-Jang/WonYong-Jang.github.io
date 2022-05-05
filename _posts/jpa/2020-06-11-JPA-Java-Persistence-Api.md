---
layout: post
title: "[JPA] JPA(Java Persistence API) 와 Persistence Context"
subtitle: "자바 표준 ORM, Hibernate, Spring-data-jpa / 영속성 컨텍스트(1차 캐시, 쓰기 지연 SQL) / flush"
comments: true
categories : JPA
date: 2020-06-11
background: '/img/posts/mac.png'
---

## JPA

`자바 어플리케이션에서 관계형 데이터베이스를 
사용하는 방식을 정의한 인터페이스이다.`   

객체지향적으로 데이터 관리할 수 있기 때문에 비즈니스 로직에 집중 할 수 있으며, 
객체 지향 개발이 가능하다.   
단, 잘 이해하고 사용하지 않으면 데이터 손실이 있을 수 있다.   

JPA는 아래와 같이 어플리케이션과 JDBC 사이에서 동작한다.   

<img width="500" alt="스크린샷 2022-02-23 오후 6 57 13" src="https://user-images.githubusercontent.com/26623547/155296915-b49e9e59-f776-44e9-aee9-b7e353b04789.png">    

JPA의 작동 방식은 Persistence클래스로 부터 시작하며, META-INF 디렉토리 하위의 
설정정보를 읽어서 EntityManagerFactory 클래스를 만든다.   
그 이후 필요할 때마다 EntityManger를 만들어서 실행한다.   

<img width="600" alt="스크린샷 2022-02-24 오후 8 56 04" src="https://user-images.githubusercontent.com/26623547/155519514-2ed6d525-85d3-467c-8e1f-404e8e710a2d.png">  

`EntityManagerFactory는 하나만 생성해서 어플리케이션 전체를 공유한다.`   

`여기서 주의할 점은 EntityManager는 고객의 요청이 올때마다 사용하고 버려야한다.`   
`즉, 쓰레드간에 공유하면 안된다.`   

EntityManagerFactory를 통해서 고객의 요청이 오면 EntityManager를
생성하여 내부적으로 데이터베이스 커넥션을 사용하여 DB를 사용한다.

<img width="568" alt="스크린샷 2022-02-24 오후 10 33 38" src="https://user-images.githubusercontent.com/26623547/155533878-06b4efd7-afeb-4769-bf52-9287ffd549f8.png">      

`JPA의 모든 데이터 변경은 아래와 같이 트랜잭션 안에서 실행한다.`   

```java
public class JpaMain {
    public static void main(String[] args) {
        EntityManagerFactory emf = Persistence.createEntityManagerFactory("hello");
        EntityManager em = emf.createEntityManager();

        EntityTransaction tx = em.getTransaction();
        tx.begin();

        try {
            Member member = new Member();
            member.setId(1L);

            em.persist(member);
            tx.commit();
        } catch (Exception e) {
            tx.rollback();
        } finally {
            em.close();
        }
        emf.close();
    }
}
```

> 위의 코드는 JPA의 이해를 돕기 위한 코드이며, 
    이후는 인터페이스를 이용하여 더욱 편리하게 JPA를 사용할 수 있다.   

### 영속성 컨텍스트(PersistenceContext)   

JPA를 이해하려면 영속성 컨텍스트를 이해하는게 중요하다.  
`영속성 컨텍스트는 엔티티를 영구 저장하는 환경 이라는 뜻이다.`   

> 엔티티란 테이블에 대응하는 하나의 클래스이다.  

애플리케이션과 데이터베이스 사이에서 객체를 보관하는 
가상의 데이터베이스 같은 역할을 한다.   
엔티티 매니저를 통해 엔티티를 저장하거나 조회하면 
엔티티 매니저는 영속성 컨텍스트에 엔티티를 보관하고 관리한다.   

> em.persist(member)는 
엔티티 매니저를 사용해 회원 엔티티를 영속성 컨텍스트에 저장한다는 의미    


영속성 컨텍스트 특징은 아래와 같다.   

- 엔티티 매니저를 생성할 때 하나 만들어진다.   
- 엔티티 매니저를 통해서 영속성 컨텍스트에 접근하고 관리할 수 있다.   

엔티티의 생명주기는 아래와 같다.   

- 비영속(new/transient)   
    - 영속성 컨텍스트와 전혀 관계가 없는 새로운 상태    
- 영속(managed)   
    - 영속성 컨텍스트에 관리되는 상태   
- 준영속(detached)
    - 영속성 컨텍스트에 저장되었다가 분리된 상태   
- 삭제(removed)   
    - 삭제된 상태    

비영속과 준영속은 사실 비슷한 느낌이지만 둘의 
가장 큰 차이는 한번 영속상태가 된 적이 있는가 없는가의 차이이다.   
영속상태가 되려면 식별자가 반드시 존재해야 한다. 그래서 영속 상태가 
되었다가 다시 준 영속 상태가 되면 식별자가 항상 존재하게 된다.   

`사실 실무에서는 이렇게 영속상태가 되었다가 바로 준영속 상태가 되는 
일은 드물다. 대신에 엔티티를 조회했는데, 트랜잭션이 끝나버리고 
영속성 컨텍스트도 사라지면 그때 조회한 엔티티가 준영속 상태가 된다.`      

아래 코드로 살펴보면, em.persist 하기 전에 단순 객체만 생성해놓은 
상태는 비영속 상태이다.   
`persist 하는 순간 영속 상태가 된다. 주의할 점은 이때 DB에 저장이 
되는 것이 아니라 commit 하는 순간 DB에 저장된다.`   

```java
// 객체를 생성한 상태(비영속)
Member member = new Member();
member.setId("member1");
member.setUsername("kaven");

EntityManager em = emf.createEntityManager();
em.getTransaction().begin();

// 객체를 저장한 상태(영속)
em.persist(member);

// find를 해서 1차 캐시에 없으면 올려 놓기 때문에 
// 현재 상태도 영속 상태   
em.find(Member.class, 1L);
```

detach는 영속성 컨텍스트에서 다시 지운다는 것이고, 
    remove는 실제로 DB 값을 지운다.   

```java
// 회원 엔티티를 영속성 컨텍스트에서 분리, 준영속 상태   
em.detach(member);

// entityManger안에 있는 전체 영속성 컨텍스트 모두 분리, 준영속 상태가 됨    
em.clear();

// 객체를 삭제한 상태(삭제)
em.remove(member);   
```

그럼 왜 영속성 컨텍스트를 사용할까?  

`결국 DB와 어플리케이션 사이에서 중간 계층이 있고, 이를 통해 
여러가지 이점을 얻을 수 있다.`   

##### 1) 엔티티 조회, 1차 캐시   

영속성 컨텍스트는 내부에 1차 캐시를 가지고 있다.   

<img width="600" alt="스크린샷 2022-02-24 오후 11 37 07" src="https://user-images.githubusercontent.com/26623547/155544977-224be3db-f9bd-4fe9-9e7a-7d165ab506b4.png">   

위처럼 persist를 하는 순간 pk값(id)과 객체를 맵핑하여 1차 캐시에 
가지고 있는다.     

그럼 어떤 이점이 있을까?   

`이를 한 트랜잭션 내에 1차 캐시에 이미 있는 값을 
조회하는 경우 DB를 조회하지 않고 1차 캐시에 있는 
내용을 그대로 가져온다.`       
`반면, 조회했을 때 1차 캐시에 없다면 DB에서 가져와서 
1차 캐시에 저장을 하고 반환을 한다.`        

단, 1차 캐시에서 id값으로 엔티티를 찾아 올때, 객체의 타입 정보를 같이 
확인하고 찾아 온다.   
단순히 id값을 식별자로 엔티티를 찾아오게 되면, 전혀 다른 엔티티이지만 
id값이 같은 경우는 문제가 발생할 수 있기 때문에 영속성 컨텍스트에 
저장할 때부터 식별자를 id와 타입으로 같이 저장해둔다.     

> 하이버네이트의 EntityKey 클래스 내부 로직을 확인해보면, id와 타입을 확인하여 
엔티티를 찾는 로직을 확인 할 수 있다.   

`마지막으로 1차캐시는 어플리케이션이 전체 공유하는 캐시가 아니라 한 트랜잭션 내에서만 
캐시를 하고 공유한다는 점 주의하자.`            


##### 2) 영속 엔티티의 동일성 보장   

JPA는 영속 엔티티의 동일성을 보장해준다.   
마치 자바 컬렉션에서 동일한 객체를 꺼내서 
비교했을 때 true가 나오는 것과 비슷하다.   

이게 가능한 이유는 같은 트랜잭션 
내에서 실행하여 1차 캐시가 존재하기 때문에 가능하다.    

```java
Member a = em.find(Member.class, "member1");
Member b = em.find(Member.class, "member1");

System.out.println(a == b); // 동일성 비교 true  
```

##### 3) 엔티티 등록, 트랜잭션을 지원하는 쓰기 지연   

`영속성 컨텍스트는 1차 캐시도 있지만, 쓰기 지연 SQL 저장소도 있다.`   
`아래 코드와 그림을 보면, memberA를 persist를 하게 되면, 
    1차 캐시를 넣고, 쓰기 지연 SQL 저장소에 쿼리를 만들어 쌓는다.`           
`memberB를 persist해도 동일한 과정을 거치며, commit 하는 순간에 
flush가 되면서 DB에 저장된다.`     

`데이터베이스 commit 하기 직전에 flush를 이용하여 변경사항을 DB에 반영한다.`          
`flush 란 영속성 컨텍스트의 변경내용을 데이터베이스에 반영하는 것이다.`        
`flush가 변경사항을 반영하는 것이지 1차 캐시를 지우지는 않는다.`         
flush를 직접 호출하는 경우는 거의 없지만 테스트 해볼 때는 em.flush() 이용하여 직접 호출할 수 있다.    
flush 기본 설정값은 FlushModeType.AUTO이며, 커밋이나 쿼리를 실행하기 직전 flush가 실행된다.     


```java
EntityManager em = emf.createEntityManager();
EntityTransaction transaction = em.getTransaction();
// 엔티티 매니저는 데이터 변경시 트랜잭션을 시작해야 한다.   
transaction.begin(); // 트랜잭션 시작   

em.persist(memberA);
em.persist(memberB);
// 여기까지 INSERT SQL을 데이터베이스에 보내지 않는다.   

// 커밋하는 순간 데이터베이스에 INSERT SQL을 보낸다.
transaction.commit(); // 트랜잭션 커밋   
```  

<img width="745" alt="스크린샷 2022-02-24 오후 11 58 54" src="https://user-images.githubusercontent.com/26623547/155550039-3be8c056-acc9-458b-a911-f2202856ba0a.png">   


##### 4) 엔티티 수정(Dirty Checking)   

JPA는 commit하는 순간 내부적으로 flush가 호출되고, 이때 
엔티티와 스냅샷을 비교한다.   
`1차 캐시에는 처음 들어온 상태인 스냅샷을 넣어두고 commit 하는 순간 
변경된 값이 있는지 비교하여, 변경된 
값이 있으면 update 쿼리를 쓰기 지연 SQL에 넣어둔다.`     

<img width="800" alt="스크린샷 2022-02-25 오전 12 13 06" src="https://user-images.githubusercontent.com/26623547/155551753-bc407009-f57e-4bde-90a3-c5a3dda7c714.png">   

자세한 내용은 
[Dirty Checking](https://wonyong-jang.github.io/jpa/2020/06/20/JPA-Dirty-Checking.html)을 
참고하자.   


- - -    

## SQL Mapper 와 ORM

**1) SQL Mapper : Mybatis, JdbcTemplate와 같이 쿼리를 매핑한다.**       

> SQL <- mapping -> Object 필드   

**2) ORM(Object-Relational-Mapping) : JPA, Hibernate와 같이 
객체를 매핑하여 객체간 관계를 바탕으로 sql을 자동으로 생성한다.**  

> DB 데이터 <- mapping -> Object   
> 예를 들면, User 테이블의 데이터를 출력하기 위해서 MySql 에서는 select * from user; 라는 query를 
실행해야 하지만, ORM을 사용하면 User 테이블과 매핑된 객체를 user라 할 때, user.findAll() 을 이용하여 
데이터 조회가 가능   

- - -   

## Spring Data JPA 와 Hibernate   

`Spring Data JPA는 
Spring에서 제공하는 모듈 중 하나로, 개발자가 JPA를 더 쉽고 편하게 
사용할 수 있도록 도와준다.`     

기존에 JPA를 사용하려면 EntityManager를 주입받아 사용해야 하지만, 
    Spring Data JPA는 JPA를 한단계 더 추상화 시킨 Repository 인터페이스를 제공한다.   



Hibernate는 JPA의 구현체이고, Spring Data JPA는 JPA에 대한 데이터 접근의 
추상화라고 말할 수 있다. 




### Spring Data JPA 기본 작업 분류 

전체적인 데이터 핸들링을 하기 위해 아래와 같이 나눌수 있다.   
- 도메인(Entity)   
- Repository
- 트랜잭션, 도메인 기능 간의 순서를 보장하는 Service
- API 요청을 받을 Controller   
- Request 데이터를 받을 DTO 

#### 1) 도메인(엔티티) 

가장 먼저 해야할 일은 데이터의 구조를 설계하는 것이다. 아래 Posts 클래스는 
실제 DB의 테이블과 매칭될 클래스이며, 보통 entity 클래스라고도 한다. JPA를 
사용하면 DB 데이터에 작업할 경우 실제 쿼리를 날리기보다는, 이 Entity 클래스의 
수정을 통해 작업 가능하다.   

> 기존의 Mybatis와 같은 쿼리 매퍼를 사용했다면 dao 패키지를 떠올리겠지만, 
dao 패키지와는 조금 결이 다르다고 생각하면 된다. 그간 xml에 쿼리를 담고, 
클래스를 오로지 쿼리의 결과만 담던 일들이 모두 도메인 클래스라고 불리는 곳에서 해결된다. 

`DB 저장하기 위해 유저가 정의한 클래스가 필요한데 이를 Entity 클래스라고 한다.`   
`절대로 Entity 클래스를 Request/Response 클래스(DTO) 클래스로 사용하면 안된다!`    
`Entity 클래스는 데이터베이스와 맞닿는 핵심 클래스이기 때문에 Entity 클래스를 
기준으로 테이블이 생성되고, 스키마가 변경된다.`   

```java
@Getter
@NoArgsConstructor
@Entity             // 테이블과 링크될 클래스임을 나타냄 
public class Posts {

    @Id         // 해당 테이블의 PK 필드 
    // PK 생성규칙을 나타낸다.
    // 스프링 부트 2.0에서는 GenerationType.IDENTITY 옵션을 추가해야만 auto_increment가 된다!   
    // 스프링 부트 2.0버전과 1.5 버전의 차이 확인 : https://jojoldu.tistory.com/295   
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 테이블의 컬럼을 나타내며 굳이 선언하지 않더라도 해당 클래스의 필드 모두 컬럼이 된다.    
    // 사용 이유는, 기본값 외에 추가로 변경이 필요한 옵션이 있으면 사용한다.   
    // 문자열은 VARCHAR(255)가 기본값인데, 사이즈를 500으로 늘린다.   
    @Column(length = 500, nullable = false)
    private String title;

    // 타입을 TEXT로 변경   
    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    private String author;
    
    // 빌더 패턴 
    @Builder
    public Posts(String title, String content, String author) {
        this.title = title;
        this.content = content;
        this.author = author;
    }
}
```

`Entity 클래스에서는 필드의 값 변경이 필요한 경우를 제외하고 
절대 Setter 메소드를 만들지 않는다!`   
`Setter가 없는 상황에서 DB값을 삽입하는 것은 생성자를 통해서 삽입한다`   
`@Builder를 통해서 생성 시점에 값을 채워넣어 준다.`   
@Entity 선언시 기본생성자는 꼭 존재해야 하며, final class, inner class, enum, interface에는 
사용할수 없고 필드에 final을 사용하면 안된다.   

1) @Transient : 필드 매핑이 이루어지지 않는다. 

즉, 데이터베이스에 저장하지 않고 조회하지도 않는다. 객체에 임시로 어떤 값을 보관하고 싶을 때 
사용할 수 있다. 예를들면, 상품이라는 엔티티에 대해서 가격과 할인된 가격 필드가 있을 때, 할인된 
가격은 일시적인 저장용도일 뿐이고, 컬럼으로 사용하고 싶지 않을 수도 있다.   

```java
@Transient
private Integer foo;
```   

2) @Enumerated : 자바의 enum 타입을 매핑할 때 사용한다.

아래와 같은 경우는 kind 필드 값에는 A, B, C값만 추가할 수 있다. 정형화된 데이터를 
받을 때 사용하면 좋다.   

```java
@Enumerated(EnumType.STRING)
@Column( name="kind", nullable=false, columnDefinition = "enum('A','B','C')")
private Enum kind;
```   

#### 2) JpaRepository   

Mybatis 에서는 DAO라고 불리는 DB Layer접근자이다.       
`JPA에선 Repository라고 부르며 인터페이스로 생성한다.`    
`단순히 인터페이스를 생성 후, JpaRepository<Entity 클래스, PK 타입>을 상속하면 
기본적인 CRUD 메소드가 자동으로 생성된다.`   

@Repository를 추가할 필요 없고 주의할 점은 Entity 클래스와 Entity Repository는 
함께 위치해야 한다는점이다. 나중에 규모가 커져 도메인별로 프로젝트를 분리해야 
한다면 이때 Entity 클래스와 기본 Repository는 함께 움직여야 하므로 도메인 패키지에서 
함께 관리해야 한다.   

```java
public interface PostsRepository extends JpaRepository<Posts, Long> {
}
```
> SpringDataJpa에서 제공하지 않는 메소드는 아래처럼 쿼리로 작성 가능하다!   

```java
public interface PostsRepository extends JpaRepository<Posts, Long> {

    @Query("SELECT p FROM Posts p ORDER BY p.id DESC")
    List<Posts> findAllDesc();
}
```

#### 3) 등록/수정/조회 API 만들기   

API를 만들기 위해 총 3개의 클래스가 필요하다.(DTO, Controller, Service)   
[웹 계층 링크](https://wonyong-jang.github.io/spring/2020/06/14/Spring-Web-Layer.html)   


> 아래처럼 View Layer에서 받은 데이터를 Dto로 받아서 Controller에서 사용 할 것!  

```java
@RequiredArgsConstructor
@RestController
public class PostsApiController {

    private final PostsService postsService;

    @PostMapping("/api/v1/posts")
    public Long save(@RequestBody PostsSaveRequestDto requestDto) {
        return postsService.save(requestDto);
    }
}
```

> 아래와같이 Service는 트랜잭션과 도메인 도메인간의 순서만 보장해준다.   

```java
@RequiredArgsConstructor
@Service
public class PostsService {

    private final PostsRepository postsRepository;

    @Transactional
    public Long save(PostsSaveRequestDto requestDto) {
        return postsRepository.save(requestDto.toEntity()).getId();
    }
}

```

> 아래 소스와 같이 Entity 클래스는 주로 수많은 서비스 클래스나 비즈니스 로직들이 
Entity 클래스를 기준으로 동작한다. Entity 클래스가 변경되면 여러 클래스에 영향을 
끼치지만, Request와 Response용 Dto는 View를 위한 클래스라 정말 자주 변경이 필요하다.   

`View Layer 와 DB Layer의 역할 분리를 철저하게 하는게 좋다. 실제로 Controller에서 
결과값으로 여러 테이블을 조인해서 줘야 할 경우가 빈번하므로 Entity 클래스만으로 
표현하기가 어려운 경우가 많다.`    
`꼭 Entity 클래스와 Controller에서 쓸 Dto는 분리해서 사용해야 한다!`      

```java
@Getter
@NoArgsConstructor
public class PostsSaveRequestDto {
    private String title;
    private String content;
    private String author;

    @Builder
    public PostsSaveRequestDto(String title, String content, String author) {
        this.title = title;
        this.content = content;
        this.author = author;
    }
    
    // Posts 엔티티에 @Builder를 선언했기 때문에 사용가능   
    public Posts toEntity() {
        return Posts.builder()
                .title(title)
                .content(content)
                .author(author)
                .build();
    }
}
```

- - -
Referrence

<https://dev-coco.tistory.com/74>   
<https://www.inflearn.com/course/ORM-JPA-Basic/lecture/21670?tab=curriculum&volume=1.00>   
[jojoldu.tistory.com/295](jojoldu.tistory.com/295)         
[https://requirethings.wordpress.com/2013/10/08/spring-data-jpa-%EA%B8%B0%EB%B3%B8-%EC%9E%91%EC%97%85-%ED%9D%90%EB%A6%84/](https://requirethings.wordpress.com/2013/10/08/spring-data-jpa-%EA%B8%B0%EB%B3%B8-%EC%9E%91%EC%97%85-%ED%9D%90%EB%A6%84/)

{% highlight ruby linenos %}
{% endhighlight %}

{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

