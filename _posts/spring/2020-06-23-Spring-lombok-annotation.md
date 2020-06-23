---
layout: post
title: "[Spring] lombok 어노테이션"
subtitle: "접근자/설정자, 생성자 자동 생성, Builder"
comments: true
categories : Spring
date: 2020-06-23
background: '/img/posts/spring.png'
---

# 생성자 자동생성

Lombok을 사용하면 생성자도 자동으로 생성이 가능하다. @NoArgsConstructor은 파라미터가 없는 
기본생성자를 생성해주고, @AllArgsConstructor 는 모든 필드 값을 파라미터로 받는 생성자를 만들어준다.   
마지막으로, @RequiredArgsConstructor는 final이나 @NonNull인 필드 값만 파라미터로 
받는 생성자를 만들어준다.   

```java
@NoArgsConstructor
@RequiredArgsConstructor
@AllArgsConstructor
public class User {
  private Long id;
  
  private final String username;
  private final String password;

  private int[] scores;
}
```


```java
User user1 = new User();        // NoArgsConstructor
User user2 = new User("dale", "1234"); // RequiredArgsConstructor
User user3 = new User(1L, "dale", "1234", null); // AllArgsConstructor 
```

### @RequiredArgsConstructor 의존성 주입 

`초기화되지 않은 final 필드나, @NonNull이 붙은 필드에대해 생성자를 생성해 준다. 
주로 의존성 주입(Dependency Injection) 편의성을 위해서 사용되곤 한다.` 

스프링 4.3부터는 클래스 안에 생성자가 오직 한개만 존재하고, 그 생성자의 파라미터 타입이 
빈으로 등록되어 있다면 @Autowired 어노테이션 없이 자동으로 의존성 주입이 된다.   

```java
@Service
public class SampleService {

    private SampleRepository sampleRepository; // @Autowired 없이 자동 주입된다! 
    public SampleService(SampleRepository sampleRepository) {
        this.sampleRepository = sampleRepository;
    }
}

```

> 아래와 같이 @RequriedArgsConstructor 이용하여 의존성 주입이 가능하다.   

```java
@Service
@RequiredArgsConstructor 
public class SampleService {

    private final SampleRepository sampleRepository; // 자동 주입된다!
}
```
 
### @RequriedArgsConstructor를 사용이유   

`의존성을 주입해야 하는 Service 객체가 여러개일 경우, 어노테이션도 여러개 써야하므로 
중복을 피하고 유지보수를 높히기 위해서이다. 또한, 아래와같이 A서비스와 B서비스를 필드로 
의존성 주입받는 경우 필드 주입 순환 참조시 문제가 될수 있다.`   

`필드 주입의 경우 에러도 발생하지 않기 때문에 문제의 원인을 찾기 힘들지만, 생성자로 의존성을 
주입하는 경우 에러가 발생하여 문제를 확인 할 수 있다.`   


```java
// AService > BService
AService aService = new AService(BService);

//BService > AService
BService bService = new BService(AService);
```


- - -

# ToString 메소드 자동 생성

toString() 메소드를 직접 작성하기 보다는 @ToString 어노테이션을 이용하면 자동으로 생성해 준다.   
아래와 같이 exclue 속성을 이용하면 특정 필드를 toString() 결과에서 제외시킬 수 있다.   

```java
@ToString(exclude = "password")
public class User {
  private Long id;
  private String username;
  private String password;
  private int[] scores;
}
```

- - -
Referrence 

[https://www.daleseo.com/lombok-popular-annotations/](https://www.daleseo.com/lombok-popular-annotations/)         


{% highlight ruby linenos %}
{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

