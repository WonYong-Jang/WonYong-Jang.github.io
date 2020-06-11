---
layout: post
title: "[Spring] JPA(Java Persistence API)"
subtitle: "자바 표준 ORM, Hibernate, Spring-data-jpa"
comments: true
categories : Spring
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

### Spring Data - JPA 기본 작업 흐름

전체적인 데이터 핸들링 프로세스 개발은 다음 네단계로 이루어진다.
- 도메인 개발
- 리포지토리(Repository)개발
- 서비스(Service) 개발
- 서비스 클래스를 통해 사용 

#### 도메인(엔티티) 

가장 먼저 해야할 일은 데이터의 구조를 설계하는 것이다. 아래 Posts 클래스는 
실제 DB의 테이블과 매칭될 클래스이며, 보통 entity 클래스라고도 한다. JPA를 
사용하면 DB 데이터에 작업할 경우 실제 쿼리를 날리기보다는, 이 Entity 클래스의 
수정을 통해 작업 가능하다.   

`DB 저장하기 위해 유저가 정의한 클래스가 필요한데 이를 Entity 클래스라고 한다.`   

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
한다면 이때 Entity 클래스와 기본 Repositorysms 함께 움직여야 하므로 도메인 패키지에서 
함께 관리해야 한다.   

- - -
Referrence

[jojoldu.tistory.com/295](jojoldu.tistory.com/295)         
[https://requirethings.wordpress.com/2013/10/08/spring-data-jpa-%EA%B8%B0%EB%B3%B8-%EC%9E%91%EC%97%85-%ED%9D%90%EB%A6%84/](https://requirethings.wordpress.com/2013/10/08/spring-data-jpa-%EA%B8%B0%EB%B3%B8-%EC%9E%91%EC%97%85-%ED%9D%90%EB%A6%84/)

{% highlight ruby linenos %}
{% endhighlight %}

{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

