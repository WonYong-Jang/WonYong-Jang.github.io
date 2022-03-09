---
layout: post
title: "[JPA] 경로 표현식과 페치 조인(fetch join)"
subtitle: "JPQL의 경로 표현식 / N+1 성능 문제 해결 / 페치 조인 사용시 주의사항"
comments: true
categories : JPA
date: 2020-09-25
background: '/img/posts/mac.png'
---

이번글에서는 JPQL의 경로 표현식과 JPA 성능 문제를 
해결해 줄 수 있는 페치 조인에 대해서 살펴보자.      

- - -   

## 1. 경로 표현식   

`JPQL에서 객체의 원하는 필드를 .(점)을 찍어 
객체 그래프를 탐색하는 것이다.`   

상태필드, 단일값 연관필드, 컬렉션 값 연관필드 3가지 방식이 있다.   
JPQL을 사용하면서 경로 표현식에 대해서 잘 이해하지 못하면, 
    예상하지 못한 쿼리가 발생하게 된다.   

- 상태 필드(state field) : 단순히 값을 저장하기 위한 필드
    - ex) m.username    
    - 경로 탐색의 끝   

- 단일 값 연관 필드(association field)   
    - @ManyToOne, @OneToOne, 대상이 엔티티(ex: m.team)   
    - `묵시적 내부 조인(inner join)발생`    
    - 계속해서 탐색이 가능하다.  

    ```java
    // team은 엔티티이기 때문에 팀에서 한번 더 탐색이 가능하다.  ex) m.team.username    
    // m.team에서 묵시적 내부조인이 발생한다.   
    // 즉, JPQL에서 join을 명시적으로 해주지 않아도 묵시적으로 조인이 발생한다.  
    String query = "select m.team from Member m";
    ```

- 컬렉션 값 연관 필드
    - @OneToMany, @ManyToMany, 대상이 컬렉션(ex: m.orders)   
    - `묵시적 내부 조인 발생`   
    - 더 이상 탐색이 불가능하다.    
    - FROM 절에서 명시적 조인을 통해 별칭을 얻으면 별칭을 통해 탐색이 가능하다.   

    ```java
    // t.members 하는 순간 묵시적으로 내부조인이 발생한다.   
    // 위의 단일 값 연관 필드와는 다르게 members에서 더이상 탐색이 불가능하다.  
    // t.members.username 이 불가능하다.   
    String query = "select t.members from Team t";   

    // 이를 해결하기 위해 명시적 조인을 하고 별칭을 지정하여 탐색이 가능하다.   
    String query = "select m.username from Team t join t.members m";  
    ```    


`묵시적 조인이 발생하게 개발을 진행하게 되면, 
    추후 운영하고 쿼리 튜닝을 하기가 어려워지므로 
    항상 명시적으로 join을 하여 개발을 진행하자.`      

> 묵시적 조인은 코드가 복잡해 졌을 때, 추가 쿼리가 발생하고 있다는 것을 
한눈에 파악하기 어렵다.   

- - - 

## 2. 페치 조인(fetch join)   

`JPQL에서 성능 최적화를 위해 제공하는 기능이며, SQL 조인의 종류가 아니다.`  
`연관된 엔티티나 컬렉션을 SQL 한 번에 함께 조회하는 기능을 제공한다.`   

회원과 팀 엔티티의 예제를 가지고 이해해 보자.   

<img width="700" alt="스크린샷 2022-03-05 오후 3 59 06" src="https://user-images.githubusercontent.com/26623547/156872610-d369d367-c4ac-465e-8e3f-861fd542dfd1.png">   

회원을 조회하면서 연관된 팀도 함께 조회를 하려면 아래와 같이 가능하다.   

```
[JPQL]   
select m from Member m join fetch m.team  

[SQL]
SELECT M.*, T.* FROM MEMBER M
INNER JOIN TEAM T ON M.TEAM_ID=T.ID  
```

이를 코드를 작성하여 자세히 이해해보자.   

```java
public class JpaMain {
    public static void main(String[] args) {
        EntityManagerFactory emf = Persistence.createEntityManagerFactory("hello");
        EntityManager em = emf.createEntityManager();

        EntityTransaction tx = em.getTransaction();
        tx.begin();

        try {

            Team teamA = new Team();
            teamA.setName("TeamA");
            em.persist(teamA);

            Team teamB = new Team();
            teamB.setName("TeamB");
            em.persist(teamB);

            Member member1 = new Member();
            member1.setUsername("회원1");
            member1.setTeam(teamA);
            em.persist(member1);

            Member member2 = new Member();
            member2.setUsername("회원2");
            member2.setTeam(teamA);
            em.persist(member2);

            Member member3 = new Member();
            member3.setUsername("회원3");
            member3.setTeam(teamB);
            em.persist(member3);

            em.flush();
            em.clear();

            String query = "select m from Member m";

            List<Member> resultList = em.createQuery(query, Member.class).getResultList();

            for (Member member : resultList) {
                System.out.println("member name : " + member.getUsername());
                System.out.println("team name : " + member.getTeam().getName());
            }

            tx.commit();
        } catch (Exception e) {
            tx.rollback();
            e.printStackTrace();
        } finally {
            em.close();
            emf.close();
        }
    }
}
```  

위 코드를 살펴보면 회원1, 회원2를 find하여 loop를 돌면서 회원 이름과 
연관관계인 팀의 이름을 출력하는 예제이다.   

`처음 Member를 찾기 위한 쿼리가 나가고, 그 이후 loop를 
돌면서, Team을 찾을 때마다 계속해서 쿼리가 발생하는 것을 
볼수 있다.`   

> 동일한 Team이라면, 영속성 컨텍스트에 저장이 되기 때문에 쿼리가 
발생하지 않고 1차 캐시에서 가져온다.   

`동일한 Team을 가져올 때, 1차 캐시에서 가져오기 때문에 
쿼리가 발생하지 않기는 하지만 최대 N+1 문제가 발생한다.`   

이는, FetchType.EAGER로 설정해도 동일한 문제가 발생하며, 
    여기서 N+1 문제라는 것은 Member를 검색하기 위한 쿼리(1)로 인하여 
    Team을 각각 찾기 위한 쿼리(N)이 추가로 발생한다는 의미이다.   

`처음 Member를 찾는 쿼리(1)를 통해 Member가 1000명이 검색되었다면, 
    Member 각각의 Team을 찾기 위한 쿼리가 최대 1000번까지 
    발생할 수 있다는 의미이다.`   

그럼 N+1 성능 문제를 어떻게 해결할까?   

몇가지 방법이 있지만, 가장 많이 사용하는 방법은 `페치 조인`으로 해결한다.   

```java
String query = "select m from Member m join fetch m.team";
```

`join fetch를 사용하여 한번에 조인하여 데이터를 한번에 가져온다.`   
`FetchType.LAZY로 설정하여도 join fetch가 우선순위가 높다.`   

- - - 

## 3. 페치조인과 일반 조인 차이   

JPQL은 결과를 반환할 때 연관관계를 고려하지 않는다.   
단지 select 절에 지정한 엔티티만 조회할 뿐이다.    
여기서는 team 엔티티만 조회하고, 회원 엔티티는 조회하지 않는다.   
`일반 조인 실행시 연관된 엔티티를 함께 조회하지 않는다.`     


```
[JPQL]
select t from Team t join t.members m

[SQL]
select t.* 
from team t inner join members on t.id=m.team_id
```

- - - 

## 4. 페치 조인 사용시 주의사항   

### 4-1) 컬렉션 페치 조인시 중복이 발생할 수 있다.   

`위의 예제와 다르게 페치 조인 대상이 컬렉션일 경우 중복 문제가 발생할 수 있다.`   

```
[JPQL]
select t from Team join fetch t.members   

// output  
// team = 팀A / members = 2
// team = 팀A / members = 2
// team = 팀B / members = 1  
```

<img width="500" alt="스크린샷 2022-03-05 오후 4 52 35" src="https://user-images.githubusercontent.com/26623547/156874199-02473f44-11f9-4047-a2f0-aa7d22c10a8f.png">   

위와 같이 teamA 입장에서 보면 매칭되는 Member는 2명이기 때문에 2개의 row가 
생기게 된다.   
`이러한 중복을 제거하기 위해서는 JPQL의 DISTINCT를 사용해야 한다.`   

> SQL의 DISTICNT는 row가 완전히 동일해야 제거 가능하며, JPQL의 DISTINCT와는 
다르다.   

`JPQL의 DISTINCT는 SQL에 DISTINCT를 해주면서, 애플리케이션에서 엔티티 중복도 
같이 제거해준다.`   

```java
[JPQL]
select distinct t from Team join fetch t.members
```

`그림과 같이 Join한 Member의 데이터는 1차 캐시에 보관되며, 
애플리케이션에서 같은 식별자를 가진 엔티티를 제거한다.`         

<img width="550" alt="스크린샷 2022-03-05 오후 6 47 29" src="https://user-images.githubusercontent.com/26623547/156877957-85505abd-1d7a-44dd-ad7d-d311f1f89706.png">   

### 4-2) 페치 조인 대상에는 별칭을 줄 수 없다.    

`JPA 표준 스펙에는 fetch join 대상에 별칭을 줄 수 없다. 그런데 하이버네이트는 
허용한다.`      
`이 말은 결국 fetch join 대상에 별칭을 사용은 할 수 있지만 
여러 문제가 발생할 수 있으니 주의해서 사용해야 한다.`       

`별칭을 이용하여 where 조건에서 일부의 데이터만 가져오는 온 이후, 
    데이터 조작을 통하여 일부 데이터만 업데이트 되는 경우는 
    데이터 무결성이 깨질 수 있다.`       

아래와 같이 페치 조인을 여러 단계로 하는 경우는 사용해도 괜찮다.   

```
select t from Team t join fetch t.members m join fetch m.xxx   
```

또한, 아래와 같이 Team은 fetch join 대상이 아니므로 
where에서 마음껏 사용이 가능하다.   

```
select t from Team t join fetch t.members m where m.username = ?
```

그런데 Member(t.members m)은 페치 조인 대상이기 때문에 where 같은 곳에서 
사용하면 위험하다.   
애플리케이션에서 fetch join의 결과는 연관된 모든 엔티티가 
있을 것이라고 가정하고 사용해야 한다.   
`이렇게 페치 조인에 별칭을 잘못 사용해서 컬렉션 결과를 필터링 해버리면, 
    객체의 상태와 DB의 상태 일관성이 깨지게 된다.`       

이를 사용하기 위해서는 데이터 일관성이 해치지 않는다면 
사용 가능하다.  
또한, 일관성이 깨져도 엔티티를 변경하지 않고 조회 용으로만 
주의해서 사용한다면 크게 문제는 없다.  

> 하지만 여기서 2차 캐시를 사용하면 문제가 발생할 수있으니 주의해야 한다.   

### 4-3) 둘 이상의 컬렉션은 페치 조인할 수 없다.   

위에서 컬렉션을 페치 조인했을 경우, 데이터 중복이 발생할 수 있다는 것을 
확인했다.   
그런데 여기서 둘 이상의 컬렉션을 페치 조인하게 되면 데이터 중복이 
걷잡을 수 없을 만큼 늘어날 수 있기 때문에 
`컬렉션을 페치조인할 때는 1개만 사용하기를 권장한다.`       


### 4-4) 컬렉션을 페치 조인하면 페이징 API 사용할 수 없다.  

`일대일, 다대일 같은 단일 값 연관 필드들은 페치 조인해도 페이징이 가능하다.`   

`일대다, 다대다는 위에서 본 것처럼 중복이 발생하게 된다. 이를, 중복 제거한다 하더라도 
내부적으로 문제가 발생할 수 있다.`    

기본적으로 컬렉션과 페치조인했을 경우 많은 문제가 발생하기 때문에 
이를 반대로 뒤집어서 페치 조인하여 해결하는 방법이 있다.   

```java
String query = "select m from Member m join fetch m.team t";   
```   

또 다른 해결 방법은 페치조인을 사용하지 않고 해결하는 방법이 있다.   
아래와 같이 사용하게 되었을 때, getMemgers()를 호출할때마다 
쿼리가 계속 호출되기 때문에 N+1 문제가 발생할 것이다.   

```java
String query = "select t from Team t";

List<Team> result = em.createQuery(query, Team.class)
    .setFirstResult(0)
    .setMaxResults(2)
    .getResultList();

for(Team team : result) {
    System.out.println(team.getMembers());
}
```

`이를 @BatchSize(size= 100)를 이용하여 정해진 갯수만큼 가져올 수 있다.`     

> 각각 지정할수도 있고, global로 config 파일에 추가하여 적용할 수도 있다.    
> hibernate.default_batch_fetch_size 옵션을 추가하여 글로벌로 이용 가능하다.    

> 위 옵션의 사이즈는 보통 100~1000를 권장한다.   

이 전략은 SQL IN절을 사용하는데, 데이터베이스에 따라 IN 절 파라미터를 
1000으로 제한하기도 한다.   

```java
@BatchSize(size = 100)
@OneToMany(mappedBy = "team")
private List<Member> members = new ArrayList<>();
```

`이렇게 적용하게 되면, 정해진 size만큼 team에 연관된 멤버들을 
한번에 가져오게 된다.`      
`즉, 100개의 팀에 연관된 members를 한번에 가져온다.`    
그러면 team을 loop돌면서 members를 가져올때마다 발생한 쿼리를 줄일 수 있게 
된다.   
또한, 페이징도 가능하게 된다.     
`결국 N+1 성능문제를 1+1로 최적화 할 수 있게 된다.`       


정리를 해보면, 페치 조인이 N+1 성능 문제를 효과적으로 해결해 주기 때문에 
꼭 알고 있어야 하지만, 모든 문제를 해결해 주지는 않는다.   

여러 테이블을 조인해서 엔티티가 가진 모양이 아닌 전혀 다른 결과를 
내야 하면, 페치 조인 보다는 일반 조인을 사용하고 필요한 
데이터들만 조회해서 DTO로 반환하는 것이 효과적이다.   

- - -
Referrence

<https://www.inflearn.com/questions/15876>   
<https://www.inflearn.com/course/ORM-JPA-Basic/lecture/21670?tab=curriculum&volume=1.00>   

{% highlight ruby linenos %}
{% endhighlight %}

{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

