---
layout: post
title: "[Jpa] 객체와 관계형 데이터베이스 매핑2"
subtitle: "연관관계 매핑 / 단반향, 양방향 / 연관관계의 주인 / 다중성(다대일, 일대다, 일대일, 다대다)"
comments: true
categories : Jpa
date: 2020-06-23
background: '/img/posts/mac.png'
---

[이전글](https://wonyong-jang.github.io/jpa/2020/06/22/JPA-Object-Database-Mapping.html)

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
}

@Entity
public class Team {

    @Id @GeneratedValue
    @Column(name = "TEAM_ID")
    private Long id;
    private String name;
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
Referrence

<https://www.inflearn.com/course/ORM-JPA-Basic/lecture/21670?tab=curriculum&volume=1.00>

{% highlight ruby linenos %}
{% endhighlight %}

{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

                                                                                                                                         346,1         Bot
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
Referrence

<https://www.inflearn.com/course/ORM-JPA-Basic/lecture/21670?tab=curriculum&volume=1.00>

{% highlight ruby linenos %}
{% endhighlight %}

{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

                                                                                                                                           346,1         Bot

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
Referrence

<https://www.inflearn.com/course/ORM-JPA-Basic/lecture/21670?tab=curriculum&volume=1.00>    

{% highlight ruby linenos %}
{% endhighlight %}

{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

