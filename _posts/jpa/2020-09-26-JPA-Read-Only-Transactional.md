---
layout: post
title: "[JPA] 읽기 전용으로 성능 최적화 및 OSIV"
subtitle: "hibernate.readOnly / @Transactional(readOnly=true)"
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

## 1. 읽기 전용으로 엔티티를 조회하는 방법   


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





- - -
Referrence

<https://tech.yangs.kr/22>  
<https://www.inflearn.com/questions/15876>   
<https://www.inflearn.com/course/ORM-JPA-Basic/lecture/21670?tab=curriculum&volume=1.00>   
<https://www.inflearn.com/course/%EC%8A%A4%ED%94%84%EB%A7%81-%EB%8D%B0%EC%9D%B4%ED%84%B0-JPA-%EC%8B%A4%EC%A0%84/lecture/27997?tab=curriculum&volume=1.00>   

{% highlight ruby linenos %}
{% endhighlight %}

{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

