---
layout: post
title: "[JPA] JPA 엔티티 작성 ( Setter 금지 )"
subtitle: "JPA 엔티티 일관성을 유지하는 방법"
comments: true
categories : JPA
date: 2020-06-16
background: '/img/posts/mac.png'
---

## JPA 엔티티 작성 - Setter 금지 

`엔티티를 작성할 때 객체의 일관성을 보장하기 위한 방법 중 하나가 습관적으로 
모든 필드에 Setter 생성하는것을 금지하는 것이다.`   

Setter를 무분별하게 남용하다 보면 여기저기서 객체(엔티티)의 값을 변경할 수 있으므로 
객체의 일관성을 보장할수 없다.   

또한, Setter는 그 의도를 알기 힘들다. 
예를 들면 아래 코드의 경우 멤버 객체를 set메소드를 통해 변경하는데 무엇을 
하는건지 한번에 알 수 없다.(예제의 경우 간단한 변경이지만 복잡해질 경우 객체의 값을 
        변경하는 행위가 무엇을 위해 변경하는지 한 눈에 알기 힘들 수 있다!)    


```java
Member member = new Member();
member.setName(value);
member.setTel(value);
...
member.set...
```

**아래 코드 처럼 객체에 메소드를 제공하여 변경하면 변경 의도를 한번에 알 수 있고, 
    객체 자신의 값을 자신이 변경하는 것이 객체 지향 관점에도 더 바람직하다.**   


```java
// 멤버의 기본정보를 수정한다는 것을 한눈에 알 수 있다
member.changeBasicInfo(value, value);
```  


```java
//Member 엔티티 내부에 매서드 생성
public void changeBasicInfo(String name, String tel) {
    this.name = name;
    this.tel = tel;
}

```
- - -

`객체의 일관성을 유지하기 위해 객체 생성 시점에 값들을 넣어줌으로써 Setter 사용을 줄일 수 있다.`   

`객체의 생성자 설정 (필드가 많을경우 롬복의 @Builder 사용하면 좋다)`   
```java
@Builder
public Member(String username, String password, String name, String tel, Address address) {
        this.username = username;
        this.password = password;
        this.name = name;
        this.tel = tel;
        this.address = address;
    }
```

```java
// 객체 생성 시 값 세팅(빌더패턴 사용)
Member member = Member.Builder()
      .username(value)
      .password(value)
      .name(value);
      .tel(value)
      .address(value)
      .build();
```


`무분별한 Setter 생성을 금지하는 것은 엔티티 뿐 아니라 객체 생성 및 변경 시 모두 
해당하는 부분이다. 객체의 일관성을 유지할 수 있어야 프로그램의 유지 보수성을 
끌어 올릴수 있다.`   

- - -
Referrence

[https://jojoldu.tistory.com/295](https://jojoldu.tistory.com/295)         
[https://velog.io/@aidenshin/%EB%82%B4%EA%B0%80-%EC%83%9D%EA%B0%81%ED%95%98%EB%8A%94-JPA-%EC%97%94%ED%8B%B0%ED%8B%B0-%EC%9E%91%EC%84%B1-%EC%9B%90%EC%B9%99](https://velog.io/@aidenshin/%EB%82%B4%EA%B0%80-%EC%83%9D%EA%B0%81%ED%95%98%EB%8A%94-JPA-%EC%97%94%ED%8B%B0%ED%8B%B0-%EC%9E%91%EC%84%B1-%EC%9B%90%EC%B9%99)

{% highlight ruby linenos %}
{% endhighlight %}

{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

