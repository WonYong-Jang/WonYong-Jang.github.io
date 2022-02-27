---
layout: post
title: "[Jpa] 객체와 관계형 데이터베이스 매핑"
subtitle: "객체와 테이블, 필드와 컬럼, 연관관계 매핑 / 단반향, 양방향 / 연관관계의 주인 / 다중성(다대일, 일대다, 일대일, 다대다)"
comments: true
categories : Jpa
date: 2020-06-22
background: '/img/posts/mac.png'
---

JPA를 이해하기 위해 가장 중요한 2가지는 [영속성 컨텍스트](https://wonyong-jang.github.io/jpa/2020/06/11/JPA-Java-Persistence-Api.html)를 통해 
JPA가 어떻게 동작하는지 이해하는 것과 
객체와 관계형 데이터베이스를 어떻게 맵핑하는지에 대한 부분이다.     

이 글에서는 엔티티 맵핑에 대해서 살펴보자.     

- - - 

## 1. 데이터베이스 스키마 자동 생성   

시작전에 빠른 테스트를 위해서 데이터베이스 스키마를 자동 설정하는 방법을 살펴보자.   
해당 설정은 운영서버에서는 사용하지 말고, 로컬 또는 개발환경에서만 사용하자.   

> 운영서버에서 drop, alter를 런타임에 실행했을때, 데이터 수에 따라 장애가 발생할 수 있다.   

<img width="600" alt="스크린샷 2022-02-26 오후 5 56 05" src="https://user-images.githubusercontent.com/26623547/155837032-119fe445-9b52-48ac-ae9d-1877f9fb1688.png">   

```java
<property name="hibernate.hbm2ddl.auto" value="create" />
```

위 설정을 진행하면, 엔티티를 생성 및 수정할 때마다 테이블을 직접 수정해 줄 필요 없이 
런타임 과정에서 직접 테이블 수정까지 해준다.     

- - - 

## 2. 객체와 테이블 매핑   

처음은 클래스와 테이블을 매핑해야 하며, 
@Entity가 붙은 클래스는 JPA가 관리하는 엔티티라 한다.   

`즉 JPA를 사용해서 테이블과 매핑할 클래스는 @Entity가 필수이다.`   

여기서 주의사항은 아래와 같다.   

- `기본 생성자는 필수(파라미터가 없는 public 또는 protected 생성자)`      
- `final 클래스, enum, interface, inner 클래스는 사용할 수 없다.`      
- `저장할 필드에 final은 사용할 수 없다.`       

```java
@Entity(name = "Member") 
// name 속성은 JPA에서 사용할 엔티티 이름을 지정한다. 
// name 속성이 없다면 클래스 이름을 기본으로 사용한다.    
public class Member {
    @Id
    private Long id;
    private String name;
    // ...
}
```   

- - -

## 3. 필드와 컬럼 매핑   

아래 Member 엔티티 예제로 살펴보자.   

```java
@Entity(name = "Member")
public class Member {
    @Id
    private Long id;

    // 객체는 username이며, DB는 name으로 사용하고 싶은 경우
    @Column(name = "name")
    private String username;

    private Integer age;

    // Enum 타입을 사용하는 경우
    @Enumerated(EnumType.STRING)
    private RoleType roleType;

    // 날짜 타입을 사용하는 경우
    @Temporal(TemporalType.TIMESTAMP)
    private Date createdDate;

    @Temporal(TemporalType.TIMESTAMP)
    private Date lastModifiedDate;

    // varchar 보다 큰 내용을 사용하는 경우
    @Lob
    private String description;

    // 특정 필드를 DB 컬럼과 매핑을 하지 않는 경우   
    @Transient   
    private int temp;
    // ...
}
```

Output  

```
Hibernate: 
    
    create table Member (
       id bigint not null,
        age integer,
        createdDate timestamp,
        description clob,
        lastModifiedDate timestamp,
        roleType varchar(255),
        name varchar(255),
        primary key (id)
    )
```

그럼 위의 컬럼 매핑에 나왔던 내용을 자세히 알아보자.   

##### 1) @Enumerated  

Enumerated 타입의 기본값은 ORDINAL이며, 이를 사용했을 경우 Enum의 순서를 
DB에 저장하게 된다.   
이렇게 사용했을 때, Enum이 변경되었을때 매핑 정보가 잘못되어 문제가 
발생할 수 있다.   

<img width="500" alt="스크린샷 2022-02-26 오후 6 31 12" src="https://user-images.githubusercontent.com/26623547/155838002-720c81cf-81f1-4a21-9aba-59f596266d40.png">   

##### 2) Temporal   

자바 8를 사용하면서 LocalDate, LocalDateTime이 나왔고, 이를 
사용할때는 아래와 같이 생략하여 사용 가능하다.   

```java
private LocalDate createDate2;
private LocalDateTime createDate3;
```

<img width="500" alt="스크린샷 2022-02-26 오후 6 40 55" src="https://user-images.githubusercontent.com/26623547/155838300-659d984a-6648-4c03-b976-80db22b8f04f.png">   


##### 3) @Lob   

데이터베이스 BLOB, CLOB 타입과 매핑을 한다.   
매핑하는 필드 타입이 문자면 CLOB과 매핑되며, 나머지는 BLOB과 매핑된다.   


- - - 

## 4. 기본 키 매핑   

`기본 키를 직접 할당 하고자 할때는 @Id만 사용하고, 자동 생성해주기를 
원하면 @GeneratedValue를 추가한다.`        

@GeneratedValue를 사용할 때 몇가지 옵션을 살펴보자.   

##### 1) IDENTITY 전략   

주로 Mysql에서 사용하며 기본 키 생성을 데이터베이스에 위임한다.   
아래와 같이 작성하게 되면, id값을 직접 넣지 않고 DB에서 
키를 생성해서 넣어준다.   

```java
@Id
@GeneratedValue(strategy = GenerationType.IDENTITY)
private Long id;
```

이렇게되면 우리가 id값을 알 수 있는 시점은 DB에 들어가봐야 알 수 있다.   
하지만, [영속성 컨텍스트](https://wonyong-jang.github.io/jpa/2020/06/11/JPA-Java-Persistence-Api.html) 에서 
관리되려면 PK 값이 있어야 했다.   
`다시 말하면, 영속성 컨텍스트 1차 캐시에는 pk를 이용하여 관리하기 때문에 
이런 경우는 관리를 할 수 가 없다.`     

`그렇기 때문에 IDENTITY를 사용했을 경우는 em.persist(member) 하는 시점에 
실제 DB insert 쿼리를 날려 데이터를 저장하고, id값을 반환받아 1차 캐시에 
저장한다.`      

> 원래는 persist하는 순간 1차 캐시에 값을 저장해놓고 commit 하는 시점에 DB에 저장한다.   

##### 2) SEQUENCE 전략   

주로 Oracle에서 사용하며, 아래와 같이 사용할 경우 
hibernate에서 제공하는 sequence를 기본으로 사용한다.   

```java
@Id
@GeneratedValue(strategy = GenerationType.SEQUENCE)   
private Long id;
```

엔티티 별로 시퀀스를 별도로 관리하고 싶다면 아래와 같이 사용 가능하다.   

```java
@Entity
@SequenceGenerator(
        name = "MEMBER_SEQ_GENERATOR",
        sequenceName = "MEMBER_SEQ", // 매핑할 데이터베이스 시퀀스 이름  
        initialValue = 1, allocationSize = 1)
public class Member {
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE,
            generator = "MEMBER_SEQ_GENERATOR")
    private Long id;
    //...
}
```  

IDENTITY 전략과 비교해보자.  

`persist를 하는 순간 SEQUENCE 전략 또한, pk 값을 바로 알 수 없기 때문에 
시퀀스를 저장하고 있는 DB에 pk 값을 얻어와서 1차 캐시에 저장한다.`      
`이때, 아직까지는 DB에 저장을 하지 않고, commit 하는 순간에 
DB에 반영 된다.`   

위 방식에서 저장할 때마다 시퀀스를 저장하고 있는 DB를 호출하여 
값을 계속 얻어와야 하기 때문에 이를 최적화 할 수 있는 방법이 있다.   

이때, 위의 옵션 중에 allocationSize()를 수정할 수 있다.  
기본 값은 50이며, 이를 사용하게 되면 호출할 때마다 시퀀스 DB를 
호출하지 않고, 50개를 미리 가져와서 최적화 하는 방식이다.   

이때, size를 매우 크게 해놓고 사용할 수도 있지만, 시스템을 
재시작 또는 종료하게 되면 메모리에 놓고 사용하기 때문에 
날라가게 된다.   
이때, 다시 사용하게 되었을 때 크게 이슈는 없지만 중간에 빈 공백이 
생기게 되기 때문에 50~100이 적절해 보인다.   



- - -
Referrence

<https://www.inflearn.com/course/ORM-JPA-Basic/lecture/21670?tab=curriculum&volume=1.00>    

{% highlight ruby linenos %}
{% endhighlight %}

{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

