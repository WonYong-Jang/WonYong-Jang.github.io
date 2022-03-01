---
layout: post
title: "[Jpa] 객체와 관계형 데이터베이스 매핑2"
subtitle: "연관관계 매핑 / 단반향, 양방향 / 연관관계의 주인 / 다중성(다대일, 일대다, 일대일, 다대다)"
comments: true
categories : Jpa
date: 2020-06-23
background: '/img/posts/mac.png'
---

[이전글](https://wonyong-jang.github.io/jpa/2020/06/22/JPA-Object-Database-Mapping.html) 에서 
기본적인 객체와 테이블 매핑에 대해서 살펴봤다.   
이번 글에서는 다양한 연관관계 매핑에 대해서 살펴볼 예정이다.   

- - -

## 1. 다양한 연관관계 매핑

`이제부터 JPA에서 객체와 관계형 데이터베이스의 패러다임의 차이를
이해하고 각 연관관계에서 어떻게 매핑을 하는지 알아보자.`

아래 예제로 이해를 해보자.

- 회원과 팀이 있다.
- 회원은 하나의 팀에만 소속될 수 있다.
- 회원과 팀은 다대일 관계이다.

<img width="500" alt="스크린샷 2022-03-01 오후 2 44 24" src="https://user-images.githubusercontent.com/26623547/156112106-d46e56fd-b1b7-47b0-88fb-966b26785721.png">

DB 모델링을 해본다면, 위와 같은 그림이 될 것이다.
하지만, 이를 그대로 자바 코드로 작성해본다면 Member에서 어떤 팀인지를
확인하고 수정하려면 각 테이블 마다 각각 작업이 이뤄져야 한다.

`객체를 테이블에 맞추어 데이터 중심으로 모델링하면, 협력 관계를 만들 수 없다.`

왜 이런 차이가 발생할까?

`테이블은 외래 키로 조인을 사용해서 연관된 테이블을 찾고, 객체는
참조를 사용해서 연관된 객체를 찾는다.`

둘 사이의 패러다임 차이를 확인했고, 그럼
어떻게 객체지향스럽게 모델링 할 수 있을까?
아래처럼 자바에서는 외래키가 아닌 참조값을 그대로 사용하면 된다.

<img width="500" alt="스크린샷 2022-03-01 오후 2 55 36" src="https://user-images.githubusercontent.com/26623547/156113209-551ad41f-168b-4cc0-8dd8-345ae522ef79.png">

```java
@Entity
public class Member {
    @Id @GeneratedValue
    private Long id;

    @Column(name = "USERNAME")
    private String username;

    @ManyToOne
    @JoinColumn(name = "TEAM_ID")
    private Team team;
    // ...
}

@Entity
public class Team {

    @Id @GeneratedValue
    @Column(name = "TEAM_ID")
    private Long id;
    private String name;
    // ...
}
```

Output

```java
public class JpaMain {
    public static void main(String[] args) {
        EntityManagerFactory emf = Persistence.createEntityManagerFactory("hello");
        EntityManager em = emf.createEntityManager();

        EntityTransaction tx = em.getTransaction();
        tx.begin();

        try {

            Team team = new Team();
            team.setName("TeamA");
            em.persist(team);

            Member member = new Member();
            member.setUsername("member1");
            member.setTeam(team);
            em.persist(member);

            // 1차 캐시에 있는 값 반영 후 DB에 있는 값 확인 하고 싶을 때
            em.flush();  // 쓰기지연 SQL 저장소에 있는 쿼리 반영
            em.clear(); // 영속성 컨텍스트에 있는 값 비우기

            Member findMember = em.find(Member.class, member.getId());
            Team findTeam = findMember.getTeam();
            System.out.println(findTeam.getName());

            tx.commit();
        } catch (Exception e) {
            tx.rollback();
        } finally {
            em.close();
            emf.close();
        }
    }
}
```  

- - - 

## 2. 양방향 연관관계와 연관관계의 주인    

위의 코드에서는 Member에서 Team으로 참조할 수 있었지만, Team에서 Member로 참조를 할 수 없다.   
이를 양방향으로 진행하려면 아래 그림과 같이 단 방향을 하나 더 추가하면 되고, 여기서 중요한 점은 
테이블은 변화가 없다.     
`왜냐하면 관계형 데이터베이스는 외래키를 이용하여 원래부터 양쪽으로 확인이 가능하지만, 
    객체는 방향이 존재한다.`       

<img width="500" alt="스크린샷 2022-03-01 오후 3 41 26" src="https://user-images.githubusercontent.com/26623547/156118280-b286754a-334e-489e-8f2d-772421c50c0f.png">    

```java
@Entity
public class Team {

    @Id @GeneratedValue
    @Column(name = "TEAM_ID")
    private Long id;
    private String name;

    // mappedBy를 이용하여 연결되어 있는 변수명을 입력해준다.
    @OneToMany(mappedBy = "team")
    private List<Member> members = new ArrayList<>();
    // 널 포인터 방지를 위해 초기화를 진행해준다.   
    // ....
}
```   

위처럼 추가하면 양방향 관계가 되며, 여기서 연관관계의 주인과 mappedBy를 이해하는게 중요하다.   
`객체의 양방향 관계는 사실 양방향 관계가 아니라 서로 다른 단방향 관계 2개이다.`   

`그럼 이제 양방향 관계일 때, 둘 중 하나로 외래 키를 관리해야 한다.`      
`즉, 객체의 두 관계 중 하나를 연관관계의 주인을 정해야 한다.`   

- 연관관계의 주인만이 외래 키를 관리하며 등록 및 수정이 가능하다. 
- 주인이 아닌쪽은 읽기만 가능하다.   
- 연관관계 주인이 아니면 mappedBy 속성으로 주인을 지정해 준다.   
- 연관관계 주인이면 mappedBy 속성을 사용하지 않는다.   

그럼 위의 코드에서 Team 클래스를 보면 mappedBy를 사용했고, 
    List<Member> members는 주인이 아니며, 읽기만 가능하다.       
연관관계의 주인은 Member.team 되며, 등록 및 수정이 가능하다.  

`연관관계의 주인을 정할 때, 외래 키가 있는 곳을 주인으로 정하면
설계와 성능면에서 수월해지기 때문에 외래키가 있는 곳을 주인으로 정해주는 것이 중요하다.`   

그럼 이제 양방향 연관관계를 진행할 때, 주의사항에 대해 살펴보자.  

#### 2-1) 주의사항 1

```java
Member member = new Member();
member.setUsername("member1");
em.persist(member);

Team team = new Team();
team.setName("TeamA");
team.getMembers().add(member); // mappedBy
em.persist(team);
```  

가장 많이 하는 실수는 위처럼 코드를 작성하여 연관관계의 주인이 아닌 곳에 
등록 및 수정을 하는 것이다.   
이렇게 되면 TEAM ID가 null값으로 들어가게 되어 
아래처럼 연관관계 주인에 등록을 해줘야 한다.   

```java
Team team = new Team();
team.setName("TeamA");
em.persist(team);

Member member = new Member();
member.setUsername("member1");
member.setTeam(team); // 연관관계 주인   
em.persist(member);
```

여기서 조금 더 나아가서, 연관관계의 주인에만 값을 등록해주고 mappedBy의 값은 입력해주지 
않아도 될까?   

정답은 둘다 채워 넣어 줘야 문제가 없다.   
아래 예제를 통해서 이해해 보자.   

```java
Team team = new Team();
team.setName("TeamA");
em.persist(team);

Member member = new Member();
member.setUsername("member1");
member.setTeam(team);
em.persist(member);

em.flush();  // 쓰기지연 SQL 저장소에 있는 쿼리 반영
em.clear(); // 영속성 컨텍스트에 있는 값 비우기

Team findTeam = em.find(Team.class, team.getId());
List<Member> members = findTeam.getMembers();

for (Member m : members) {
      System.out.println(m.getUsername()); // 정상 출력   
}

tx.commit();
```

위 예제처럼 중간에 flush, clear를 하면 문제 없이 정상적으로 출력되지만, 
    이를 생략하는 순간 문제가 생긴다.  

`flush를 해주게 되면, DB에서 외래키 기준으로 조인을 해서 가져다 주지만, 
    이를 주석해주는 순간 1차 캐시에 저장해둔 상태 그대로 
    가져오기 때문에 출력이 되지 않는다.`    

`양쪽에 값을 넣어주지 않았을 때 또 다른 문제점은 테스트 케이스 작성할 때, 
    문제가 발생하기 때문에 결과적으로 양방향 연관관계일때는 양쪽으로 값을 
    셋팅해주자.`    

이 때, 아래와 같이 `연관관계 편의 메소드`를 만들어서 하는 것을 추천한다.   

```java
Team team = new Team();
team.setName("TeamA");
em.persist(team);

Member member = new Member();
member.setUsername("member1");
member.changeTeam(team); // 연관관계 편의 메소드 
em.persist(member);   
```

```java
@Entity
public class Member {
    @Id @GeneratedValue
    private Long id;

    @Column(name = "USERNAME")
    private String username;

    @ManyToOne
    @JoinColumn(name = "TEAM_ID")
    private Team team;

    // ...

    public void changeTeam(Team team) {
        this.team = team;
        team.getMembers().add(this);
    }
}
```

#### 2-1) 주의사항 2   

양방향 매핑시에 무한 루프를 조심해야 한다.   
`lombok에서 제공해주는 toString() 및 기본 toString() 그대로 
사용시 무한 루프가 발생할 수 있다.`   

> ex) toString(), lombok, JSON 생성 라이브러리    

위에서 실습한 Team과 Member가 양방향 관계이기 때문에 toString() 호출시 
서로 참조를 반복하는 무한루프가 발생한다.  
그렇기 때문에 문제되는 참조를 빼고 사용해야 한다.   

```java
@Override
    public String toString() {
        return "Member{" +
                "id=" + id +
                ", username='" + username + '\'' +
                ", team=" + team +
                '}';
    }
```

```java
@Override
    public String toString() {
        return "Team{" +
                "id=" + id +
                ", name='" + name + '\'' +
                ", members=" + members +
                '}';
    }
```

`또한, JSON 생성 라이브러리를 사용할 때도 문제가 발생할 수 있다.`       
`Entity를 직접 Controller로 보내서 Json으로 변경할 때, 연관관계일 경우 
무한루프를 발생시킨다.`       
`이때는 Controller에서 Entity를 반환 하지말고 반드시 Dto로 변환해서 
보내면 문제는 해결된다.`      


- - -
Referrence

<https://www.inflearn.com/course/ORM-JPA-Basic/lecture/21670?tab=curriculum&volume=1.00>    

{% highlight ruby linenos %}
{% endhighlight %}

{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

