---
layout: post
title: "[Jpa] JPA(Java Persistence API)"
subtitle: "자바 표준 ORM, Hibernate, Spring-data-jpa"
comments: true
categories : Jpa
date: 2020-06-11
background: '/img/posts/spring.png'
---

## JPA

`자바 어플리케이션에서 관계형 데이터베이스를 사용하는 방식을 정의한 인터페이스이다.`   

객체지향적으로 데이터 관리할 수 있기 때문에 비즈니스 로직에 집중 할 수 있으며, 
객체 지향 개발이 가능하다.   
단, 잘 이해하고 사용하지 않으면 데이터 손실이 있을 수 있다.

### SQL Mapper 와 ORM

**1) SQL Mapper : Mybatis, JdbcTemplate와 같이 쿼리를 매핑한다.**       

> SQL <- mapping -> Object 필드   

**2) ORM(Object-Relational-Mapping) : JPA, Hibernate와 같이 
객체를 매핑하여 객체간 관계를 바탕으로 sql을 자동으로 생성한다.**   

> DB 데이터 <- mapping -> Object   

### Spring Data JPA

`Spring에서 제공하는 모듈 중 하나로, 개발자가 JPA를 더 쉽고 편하게 사용할 수 있도록 
도와준다.`      

Hibernate를 쓰는 것과 Spring Data JPA를 쓰는 것 사이에는 큰 차이가 없지만 스프링에서 
아래 이유로 Spring Data JPA를 사용하는 것을 권장 한다.   

- 구현체 교체의 용이성  
- 저장소 교체의 용이성   

> 추상화 정도는 Spring-Data-JPA -> Hibernate -> JPA 이다.   

- - -

### Spring Data - JPA 기본 작업 분류 

전체적인 데이터 핸들링을 하기 위해 아래와 같이 나눌수 있다.   
- 도메인(Entity)   
- Repository
- 트랜잭션, 도메인 기능 간의 순서를 보장하는 Service
- API 요청을 받을 Controller   
- Request 데이터를 받을 DTO 

#### 도메인(엔티티) 

가장 먼저 해야할 일은 데이터의 구조를 설계하는 것이다. 아래 Posts 클래스는 
실제 DB의 테이블과 매칭될 클래스이며, 보통 entity 클래스라고도 한다. JPA를 
사용하면 DB 데이터에 작업할 경우 실제 쿼리를 날리기보다는, 이 Entity 클래스의 
수정을 통해 작업 가능하다.   

> 기존의 Mybatis와 같은 쿼리 매퍼를 사용했다면 dao 패키지를 떠올리겠지만, 
dao 패키지와는 조금 결이 다르다고 생각하면 된다. 그간 xml에 쿼리를 담고, 
클래스틑 오로지 쿼리의 결과만 담던 일들이 모두 도메인 클래스라고 불리는 곳에서 해결된다. 

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

### JpaRepository   

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

### 등록/수정/조회 API 만들기   

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

[jojoldu.tistory.com/295](jojoldu.tistory.com/295)         
[https://requirethings.wordpress.com/2013/10/08/spring-data-jpa-%EA%B8%B0%EB%B3%B8-%EC%9E%91%EC%97%85-%ED%9D%90%EB%A6%84/](https://requirethings.wordpress.com/2013/10/08/spring-data-jpa-%EA%B8%B0%EB%B3%B8-%EC%9E%91%EC%97%85-%ED%9D%90%EB%A6%84/)

{% highlight ruby linenos %}
{% endhighlight %}

{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

