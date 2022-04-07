---
layout: post
title: "[JPA] 성능 최적화하기 (읽기 전용으로 변경, OSIV)"
subtitle: "hibernate.readOnly / @Transactional(readOnly=true) / save() 메서드 최적화"
comments: true
categories : JPA
date: 2020-09-26
background: '/img/posts/mac.png'
---

엔티티가 영속성 컨텍스트에 관리되면 1차 캐시부터 변경 감지까지 얻을 수 있는 
혜택이 많다.   
하지만 영속성 컨텍스트는 변경 감지를 위해서 스냅샷 인스턴스를 보관하므로 
더 많은 메모리를 사용하는 단점이 존재한다.   

만약 조회만 하는 경우에 읽기 전용으로 엔티티를 조회하면 메모리 사용량을 
최적화할 수 있다.   

그러면 읽기 전용으로 엔티티를 조회하는 방법에는 어떤 방법이 있을까?   

- - -   

## 1. 읽기 전용으로 엔티티를 조회하여 성능 최적화   


### 1-1) 스칼라 타입으로 조회    

먼저, 첫번째 방법은 엔티티가 아닌 스칼라 타입으로 필요한 필드만 
조회하는 것이다.   
엔티티 객체가 아니므로 영속성 컨텍스트 결과를 관리하지 않는다.   

```shell
select o.id, o.name from Order p  
```

### 1-2) 읽기 전용 쿼리 힌트 사용    

하이버네이트 전용 힌트인 org.hibernate.readOnly를 사용하면 엔티티를 읽기 
전용으로 조회할 수 있다.  
`읽기 전용이므로 영속성 컨텍스트가 스냅샷을 저장하지 
않으므로 메모리 사용량을 최적화 할 수 있다.`       

```java
// Jpa 표준
Member member = em.createQuery("SELECT m FROM Member m", Member.class)
    .setHint("org.hibernate.readOnly", true)
    .getSingleResult();

// Spring Data Jpa
@QueryHints(value = @QueryHint(name = "org.hibernate.readOnly",value = "true"))
Member findreadOnlyByUsername(String username);
```

> 스냅샷만 저장하지 않는 것이지, 1차 캐시에는 그대로 저장한다.   
> 똑같은 식별자로 2번 조회했을 경우 반환되는 엔티티 주소가 같고, select 쿼리가 
한번만 나간다.   


### 1-3) 읽기 전용 트랜잭션 사용   

스프링 프레임워크에서 어노테이션으로 트랜잭션을 읽기 전용 모드로 설정할 수 있다.   

```java
@Transactional(readOnly=true)
```

`Hibernate는 readOnly=true 옵션을 주면 스프링 프레임워크가 
하이버네이트 Session의 Flush Mode를 FlushMode.MANUAL로 설정한다.`     

<img width="593" alt="스크린샷 2022-03-20 오후 8 51 34" src="https://user-images.githubusercontent.com/26623547/159160899-fd59b956-42fb-41d0-9dc2-199db440dc1a.png">   

`이렇게 하면 강제로 flush를 호출하지 않는 한 트랜잭션 커밋 시 flush를 하지 않는다.`   

결국은 Hibernate는 flush를 호출하지 않게 되고, 변경은 자연스럽게 무시되게 된다.    
`즉, flush가 호출되지 않고 Dirty Checking을 하지 않기 때문에 성능적으로도 
이점을 얻을 수 있다.`   

[Dirty Checking](https://wonyong-jang.github.io/jpa/2020/06/20/JPA-Dirty-Checking.html)은 
Enitity와 스탭샷과 비교하는 것이며, 자세한 내용은 링크를 참고하자.    

`참고로, 스프링 5.1 이후 버전에서 @Tranactional(readOnly=true)를 
사용하게 되면 @QueryHint의 readOnly까지 모두 동작한다.`       


- - - 

## 2. save() 메서드 최적화   

### 2-1) save()의 오해

JPA에서 save() 메소드의 실제 구현된 코드를 보면 아래와 같다.   
코드를 보면, 저장하고자 하는 entity가 이전에 DB에 저장된 적이 있는지 
확인하는 코드를 볼 수 있다.    
`즉, DB에 저장된 적 없는 새로운 entity일 경우 persist를 해주고, 
    그렇지 않은 경우는 merge를 호출한다.`      

여기서 merge란 DB의 데이터를 가져온 후 현재 entity로 전체 교체를 
해주는 메카니즘으로 동작한다.   

```java
@Transactional
	@Override
	public <S extends T> S save(S entity) {

		Assert.notNull(entity, "Entity must not be null.");

		if (entityInformation.isNew(entity)) { // 새로운 엔티티인지 확인   
			em.persist(entity);
			return entity;
		} else {
			return em.merge(entity);
		}
	}
```

save() 메소드를 사용할 때, merge가 발생할 수 있는 경우를 모르고 
사용하는 경우가 많다.   
merge는 select 쿼리가 한번 발생 후 병합이 진행 되기 때문에, 
    가급적 update는 [변경 감지](https://wonyong-jang.github.io/jpa/2020/06/20/JPA-Dirty-Checking.html)를 
    사용하는 것이 좋은 방법이다.     

> 보통 merge는 데이터를 update할 때 사용하기 보다는, 영속성 상태인 엔티티가 
영속성 컨텍스트 범위를 벗어 났을 때(detached) 이를 다시 넣어 줄때 보통 사용한다.     

그럼 위에서 언급했던, `새로운 엔티티를 판단하는 기본 전략은 무엇일까?`      

- 식별자가 객체일 때 null로 판단한다.   
    ex) @Id private Long id;     

- 식별자가 자바 기본 타입일 때 0으로 판단한다.    
    ex) @Id private long id;   

위의 기본 전략을 바탕으로 주의해야할 사항이 있다.   

식별자를 @GenerateValue로 사용하지 않고, 직접 추가해줄 때 save() 메소드가 어떻게 동작할까?   

`식별자에 값이 들어 있기 때문에 새로운 엔티티임에도 불구하고 
persist 호출되는게 아니라 merge를 호출하게 된다.`    
`즉, 새로운 엔티티임에도 불구하고 계속해서 merge를 호출함으로써 select 쿼리가 추가로 
발생하게 된다.`       

이때는 `Persistable 인터페이스를 통해서, 기본 전략을 변경해줘서 최적화` 할 수 있다.     

```java
@Entity
@EntityListeners(AuditingEuntityListener.class)   
@Data
public class Item implements Persistable<String> {
    @Id
    private String id;

    @CreatedDate
    private LocalDateTime createdDate;

    public Item(String id) {
        this.id = id;
    }

    @Override
    public String getId() {
        return id;
    }
    @Override
    public boolean isNew() {
        return createDate == null; // 로직 추가 
    }
}
```

위와 같이 [Audting](https://wonyong-jang.github.io/jpa/2020/06/21/JPA-Auditing.html)을 
통해서 해당 엔티티가 새로 생성된 엔티티인지 구분하는 로직을 추가하여 merge 호출을 피할 수 있다.   

> Audting은 JPA의 persist 호출 전에 발생하는 이벤트이기 때문에 새로운 
엔티티인지 아닌지 구분이 가능하다.   


### 2-2) save()와 saveAll() 

다건 데이터를 insert 할 때, save()보다는 saveAll()을 사용하는게 
성능상 이점이 있다.  

save()와 saveAll() 메소드는 아래와 같이 구현되어 있다.   

```java
@Transactional
@Override
public <S extends T> S save(S entity) {

	if (entityInformation.isNew(entity)) {
		em.persist(entity);
		return entity;
	} else {
		return em.merge(entity);
	}
}

@Transactional
@Override
public <S extends T> List<S> saveAll(Iterable<S> entities) {

	Assert.notNull(entities, "Entities must not be null!");

	List<S> result = new ArrayList<S>();

	for (S entity : entities) {
		result.add(save(entity));
	}

	return result;
}
```   

코드만 보면, saveAll()은 save()를 호출하는 구조로 되어 있다.   
하지만 왜 대량의 데이터를 처리할 때, saveAll()이 성능이 좋을까?   

`해당 메소드는 @Transactional로 감싸져 있으며 @Transactional은 프록시 기반으로 
동작한다.`   
`즉, 대량의 데이터를 저장할때 save()메소드를 여러번 호출하면 
    각각 프록시를 통해 호출이 되지만, saveAll()메소드는 한번의 
    프록시 호출이 이루어지고 나서, 내부적으로 this.save를 호출하기 때문에 
    프록시 호출이 아닌 내부 호출로 성능을 향상시킬 수 있다.`   

[스프링 트랜잭션](https://wonyong-jang.github.io/spring/2020/03/20/Spring-Transaction.html)에 대한 
자세한 설명은 링크를 참고하자.   





- - - 

## 3. OSIV와 성능 최적화    

OSIV(Open Session In View)는 영속성 컨텍스트를 뷰까지 열어두는 기능이다.    
영속성 컨텍스트가 유지되면 엔티티도 영속 상태로 유지된다.   
뷰까지 영속성 컨텍스트가 살아있다면 뷰에서도 지연 로딩을 사용할 수가 있다.   

> JPA에서는 OEIV(Open EntityManager In View), 하이버네이트에선 OSIV(Open Session In View)라고 
한다. 하지만 관례상 둘 다 OSIV로 부른다.     

아래 그림과 같이 OSIV는 트랜잭션 범위 내에 영속상태를 유지할 뿐만 아니라, 
    Controller, View, Filter Interceptor 등 요청이 끝날때 까지 
    영속 상태를 유지한다.   

> 단 트랜잭션 범위내에서만 수정이 가능하며, 그외에는 지연로딩을 포함한 조회만 가능하다.    

<img width="750" alt="스크린샷 2022-04-04 오후 11 40 33" src="https://user-images.githubusercontent.com/26623547/161568804-c7b7a60e-a23f-4edf-a1a6-6b4186f008ed.png">  

- spring.jpa.open-in-view: true   

`Spring Boot JPA 의존성을 주입 받아 어플리케이션을 구성할 경우 
spring.jpa.open-in-view의 기본값인 true로 지정되어 있어 
OSIV가 적용된 상태로 어플리케이션이 구성된다.`   

<img width="733" alt="스크린샷 2022-04-04 오후 11 44 36" src="https://user-images.githubusercontent.com/26623547/161569492-aa5b7a57-7ea9-45b6-8120-cd6ea61220d1.png">   

 
위 처럼 spring.jpa.open-in-view의 값을 기본값(true)으로 어플리케이션을 
구동하면, 어플리케이션 시작 시점에 위와 같은 warn 로그를 남기게 된다.    

`warn 로그를 남기는 이유가 있는데, OSIV 전략은 트랜잭션 
시작처럼 최초 데이터베이스 커넥션 시작 시점부터 API응답이 
끝날 때까지 영속성 컨텍스트와 데이터베이스 커넥션을 유지한다.`     

> JPA가 데이터베이스 커넥션을 획득하는 시점은 트랜잭션을 시작할 때,
    커넥션을 획득한다.  
> OSIV가 off이면, 트랜잭션이 끝나는 시점에 데이터베이스 커넥션을 반환하지만, 
    OSIV가 on인 상태에서는 요청이 끝날때까지 데이터베이스 커넥션을 유지한다.     

  
그래서 지금까지 View Template이나 API 컨트롤러에서 지연 로딩이 가능했던 
것이다.   
지연 로딩은 영속성 컨텍스트가 살아있어야 가능하고, 영속성 컨텍스트는 
기본적으로 데이터베이스 커넥션을 유지한다.   
이것 자체가 큰 장점이다.   


`하지만 치명적인 단점은 이 전략은 너무 오랜시간동안 데이터베이스 커넥션 리소스를 
사용하기 때문에, 실시간 트래픽이 중요한 어플리케이션에서는 
커넥션이 모자랄 수 있다. 이것은 결국 장애로 이어진다.`      
예를 들어서 컨트롤러에서 외부 API를 호출하면 외부 API 대기 시간 만큼 
커넥션 리소스를 반환하지 못하고 유지해야 한다.    

OSIV를 OFF하려면 아래 옵션으로 가능하다.   


<img width="750" alt="스크린샷 2022-04-05 오전 12 03 00" src="https://user-images.githubusercontent.com/26623547/161573223-eb83d5b1-72f5-465a-9be8-b7cae1710261.png">      

- spring.jpa.open-in-view: false           

`OSIV를 끄면 트랜잭션을 종료할 때 영속성 컨텍스트를 닫고, 데이터베이스 
커넥션도 반환한다. 따라서 커넥션 리소스를 낭비하지 않는다.`   
OSIV를 끄면 모든 지연로딩을 트랜잭션 안에서 처리해야 한다.   
따라서 지금까지 작성한 많은 지연로딩 코드를 트랜잭션 안으로 넣어야 
하는 단점이 있다.    
그리고 view template에서 지연로딩이 동작하지 않는다.   
결론적으로 트랜잭션안에서 지연로딩을 모두 호출해주거나, 페치 조인을 사용해야 한다.   

#### OSIV 정리    

OSIV를 사용하게 되면, 지연로딩을 트랜잭션 범위 외에도 자유롭게 
사용가능한 장점이 있지만 성능상 이슈가 있을 수 있다.  
반면 OSIV를 끄면 성능이 향상되지만 트랜잭션내에서 지연로딩을 
모두 처리해야 한다.   

OSIV의 사용 여부는 보통, `고객 서비스의 실시간 API는 OSIV를 
끄고, ADMIN처럼 커넥션을 많이 사용하지 않는 곳에서는 OSIV를 키는 것을 
권장한다.`       


##### 특징   

- OSIV는 클라이언트 요청이 들어올 때 영속성 컨텍스트를 생성해서 
요청이 끝날 때까지 같은 영속성 컨텍스트를 유지한다. 즉, 한번 조회된 
엔티티는 요청이 끝날 때까지 영속 상태를 유지한다.   

- 엔티티 수정은 트랜잭션이 있는 계층에서만 동작한다. 트랜잭션이 없는 
프리젠테이션 계층은 지연 로딩을 포함해 조회만 할 수 있다.   

##### 단점   

- 영속성 컨텍스트와 DB 커넥션은 1:1로 물고 있는 관계이기 때문에 프리젠테이션 
로직까지 DB 커넥션 자원을 낭비하게 된다.   




- - -
Referrence

<https://ykh6242.tistory.com/102>   
<https://vladmihalcea.com/spring-read-only-transaction-hibernate-optimization/>   
<https://tech.yangs.kr/22>  
<https://www.inflearn.com/questions/15876>   
<https://www.inflearn.com/course/ORM-JPA-Basic/lecture/21670?tab=curriculum&volume=1.00>   
<https://www.inflearn.com/course/%EC%8A%A4%ED%94%84%EB%A7%81-%EB%8D%B0%EC%9D%B4%ED%84%B0-JPA-%EC%8B%A4%EC%A0%84/lecture/27997?tab=curriculum&volume=1.00>   

{% highlight ruby linenos %}
{% endhighlight %}

{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

