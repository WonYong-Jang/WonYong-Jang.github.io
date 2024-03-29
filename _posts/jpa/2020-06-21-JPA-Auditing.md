---
layout: post
title: "[JPA] Auditing으로 생성시간/수정시간 자동화"
subtitle: "@EnableJpaAuditing, @EntityListeners ,@MappedSuperclass"
comments: true
categories : JPA
date: 2020-06-21
background: '/img/posts/mac.png'
---

## 1. Auditing으로 생성시간/수정시간 자동화   

`보통 entity에는 해당 데이터의 생성시간과 수정시간을 포함한다. 언제 만들어졌는지, 
언제 수정되었는지 등은 차후 유지보수에 있어 굉장히 중요한 정보이기 때문이다.`    
그렇다 보니 매번 DB에 insert하기 전에 날짜 데이터를 등록/수정하는 코드가 여기저기 
들어가게 된다.   

```java
// 생성일 추가 코드 예제
public void savePosts() {
    ...
    posts.setCreateDate(new LocalDate()); // 매번 set 해줘야함 
    postsRepository.save(posts);
    ...
}
```

이런 단순하고 반복적인 코드가 모든 테이블과 서비스 메소드에 포함되어야 한다고 
생각하면 어마어마하게 귀찮고 코드가 지저분해진다.   
`이 문제를 JPA Auditing을 이용하여 해결 가능하다.`          

### 1-1) LocalDate 사용    

`Java8부터 LocalDate와 LocalDateTime이 등장했고, 그간 Java의 기본 날짜 타입인 
Date의 문제점을 제대로 고친 타입이라 Java8인 경우 무조건 써야한다.`   

> Java8이 나오기 전까지 사용되었던 Date와 Calendar 클래스는 아래와 같은 문제가 있다.   
> 1. 불변(변경이 불가능한)객체가 아니기 때문에 멀티스레드 환경에서 언제든 문제 발생 가능성이 있다.   
> 2. Calendar는 월(Month)값이 설계가 잘못되었다. ( ex) 10월을 나타내는 Calendar.OCTOBER의 숫자 값은 9로 되어 있다.   

### 1-2) Entity 생성     

`아래 BaseTimeEntity 클래스는 모든 Entity의 상위 클래스가 되어 Entity들의 
createdDate, modifiedDate를 자동으로 관리하는 역할을 한다.`    

`실제 Entity가 아니기 때문에 테이블과 매핑이 되지 않는다. 즉, 
    부모 클래스를 상속받는 자식 클래스에 매핑 정보만 제공해준다.`   

`직접 생성해서 사용할 일이 없으므로 추상 클래스로 생성하는 것을 권장한다.`      

<img width="234" alt="스크린샷 2020-06-21 오후 4 44 27" src="https://user-images.githubusercontent.com/26623547/85219482-1505c500-b3df-11ea-8608-e8d428e6a6ce.png">   

```java
@Getter
@MappedSuperclass // JPA Entity 클래스들이 BaseTimeEntity을 상속할 경우 필드들 (createdDate, modifiedDate)도 컬럼으로 인식하도록 한다!   
@EntityListeners(AuditingEntityListener.class) // BaseTimeEntity 클래스에 Auditing 기능을 포함시킨다!   
public abstract class BaseTimeEntity {

    // Entity가 생성되어 저장될 때 시간이 자동 저장된다.
    @CreatedDate
    @Column(updatable = false) // 최초 저장 후 수정 금지
    private LocalDateTime createdDate;

    // 조회한 Entity의 값을 변경할 때 시간이 자동 저장된다.   
    @LastModifiedDate
    private LocalDateTime modifiedDate;
}
```

`위의 @MappedSuperClass 어노테이션은 엔티티의 공통 매핑 정보가 필요할 때 
주로 사용한다.`   
`즉, 부모 클래스에 필드를 선언하고 단순히 속성만 받아서 사용하고 싶을 때 사용하는 
방법이다.`   



> 아래 Entity가 BaseTimeEntity를 상속받도록 변경한다.   

```java
...
public class Posts extends BaseTimeEntity {
...
```

`마지막으로 JPA Auditing 어노테이션들을 모두 활성화할 수 있도록 Application 클래스에 
활성화 어노테이션 하나를 추가한다.`      

```java
@EnableJpaAuditing // JPA Auditing 꼭 추가 해야 한다.   
@SpringBootApplication
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}
```

### 1-3) 테스트 코드 작성   

- LocalDateTime.of() : 인자로 전달한 값에 따른 시간 데이터 생성한다.

- isAfter() : 검증 대상의 시간이 인자로 전달된 시간 이후인지를 검증하는 메서드   


```java
@Test
public void BaseTimeEntity_등록() {

    LocalDateTime now = LocalDateTime.of(2020, 6,4, 0,0,0);
    postsRepository.save(Posts.builder().title("title").content("content").author("author").build());

    Posts posts = postsRepository.findAll().get(0);

    System.out.println(">>>>>>> createDate="+posts.getCreatedDate()+", modifiedDate="+posts.getModifiedDate());

    assertThat(posts.getCreatedDate()).isAfter(now);
    assertThat(posts.getModifiedDate()).isAfter(now);
}
```

> 아래와 같이 실제 시간이 잘 저장된 것을 확인 가능하다.   

`앞으로 추가될 엔티티들은 더이상 등록일/수정일로 고민할 필요가 없다. @EntityListeners(AuditingEntityListener.class) 로 등록된 
클래스만 상속받으면 자동으로 해결 가능하다!`   

<img width="825" alt="스크린샷 2020-06-21 오후 5 23 35" src="https://user-images.githubusercontent.com/26623547/85220105-f655fd00-b3e3-11ea-842d-3ab431661445.png">   

- - - 

## 2. Auditing으로 등록자/수정자 자동화       

위에서 생성시간과 수정시간을 Auditing을 통해 자동화 했던 것처럼, 
    등록자와 수정자 또한 자동화가 가능하다.   

`기존 소스에서 Spring data 어노테이션인 @CreatedBy, @LastModifiedBy을 추가하면 된다.`      


```java
@MappedSuperclass // JPA Entity 클래스들이 BaseTimeEntity을 상속할 경우 필드들 (createdDate, modifiedDate)도 컬럼으로 인식하도록 한다!
@EntityListeners(AuditingEntityListener.class) // BaseTimeEntity 클래스에 Auditing 기능을 포함시킨다!
public abstract class BaseTimeEntity {

    // Entity가 생성되어 저장될 때 시간이 자동 저장된다.
    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdDate;

    // 조회한 Entity의 값을 변경할 때 시간이 자동 저장된다.
    @LastModifiedDate
    private LocalDateTime modifiedDate;

    @CreatedBy
    @Column(updatable = false)
    private String createdBy;

    @LastModifiedBy
    private String lastModifiedBy;
}
```   

또한, 등록자와 수정자에 넣어줄 Bean 설정을 아래와 같이 해줘야 한다.   

> 아래 예제이기 때문에 UUID로 등록자 및 수정자를 만들었지만 실무에서는 보통 
세션정보의 유저id를 넣어준다.    

```java
public interface AuditorAware<T> {

	/**
	 * Returns the current auditor of the application.
	 *
	 * @return the current auditor.
	 */
	Optional<T> getCurrentAuditor();
}
```

```java
@SpringBootApplication
@EnableJpaAuditing // JPA Auditing
public class DemoApplication {

	public static void main(String[] args) { SpringApplication.run(DemoApplication.class, args); }

	@Bean
	public AuditorAware<String> auditorProvider() {
	    return () -> Optional.of(UUID.randomUUID().toString());
	}
}
```


`이처럼 등록자 수정자에 넣어줄 값을 정해놓으면, 엔티티가 등록되거나 
수정 될때마다 auditorProvider()를 호출해서 값을 꺼내서 등록 및 수정을 해준다.`     




- - -
Referrence

<https://www.inflearn.com/course/%EC%8A%A4%ED%94%84%EB%A7%81-%EB%8D%B0%EC%9D%B4%ED%84%B0-JPA-%EC%8B%A4%EC%A0%84/lecture/28023?tab=curriculum&volume=1.00>   
<https://jojoldu.tistory.com>    

{% highlight ruby linenos %}
{% endhighlight %}

{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

