---
layout: post
title: "[Scala] is 로 시작하는 Boolean 타입 필드 사용시 이슈"
subtitle: "java, kotlin 그리고 scala 언어에서의 차이 / jackson을 이용한 serialize 할 때 주의사항 "    
comments: true
categories : Scala
date: 2023-11-25
background: '/img/posts/mac.png'
---

이번 글에서는 업무에서 Kotlin 로직을 Scala로 전환하는 과정에서 
발생한 이슈 중 jackson 라이브러리를 사용할 때 발생한 이슈를 공유할 예정이다.      

기존 Kotlin 로직은 아래 dto를 jackson serialize 하여 kafka 에 
publish 하였다.     

```kotlin
data class Ticket(
    val id: Long,
    val isActive: Boolean
)
```

위 dto와 동일하게 scala에서 로직을 작성하였지만, 다른 결과값을 발생시켰다.   

```scala
case class Ticket
(
  id: Long,
  isActive: Boolean
)
``` 

이러한 문제가 발생하는 원인에 대해 살펴보고 
각 언어에서 jackson을 사용할 때 차이점을 살펴보자.   

> 현재 업무에서 jackson 버전 2.9.4 를 사용하고 있다.     

- - - 

## 1. 바이트 코드 및 디컴파일 결과 확인   

각 언어에서 컴파일했을 때 다른 결과값을 확인하기 위해 
인텔리제이에서 바이트코드 확인하는 방법은 아래와 같다.   

> View -> Show ByteCode

<img width="300" alt="스크린샷 2023-11-25 오후 1 35 59" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/1fcc38d3-3dbb-4e9f-98bd-27928884e233">   

또한, 디컴파일 결과를 확인하기 위해서는 build -> classes 에서 각 파일 경로를 통해 
확인할 수 있다.   

<img width="300" alt="스크린샷 2023-11-25 오후 1 44 30" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/bac90358-99a3-4af9-bfe0-832ceac3095d">   

- - - 

## 2. Java   

`JavaBeans Naming Convention으로 primitive boolean 타입의 
getter method의 경우 is prefix를 붙여준다.`     

```java
@Getter
@Setter
public class Ticket {
    private Long id;
    private boolean active;
}
```

> 아래 결과값들은 디컴파일된 코드를 확인하였다.   

```java
public class Ticket {
    private Long id;
    private boolean active;

    public Ticket() {
    }

    public Long getId() {
        return this.id;
    }

    public boolean isActive() { //// is 
        return this.active;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setActive(boolean active) {
        this.active = active;
    }
}
```

아래와 같이 active 필드 타입을 Boolean reference 타입으로 변경했을 때는 
결과가 다르다.  

```java
public class Ticket {
    private Long id;
    private Boolean active;

    public Ticket() {
    }

    public Long getId() {
        return this.id;
    }

    public Boolean getActive() { //// get
        return this.active;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }
}
```

boolean 타입 이름에 is 를 붙였을 때 primitive 타입과 reference 타입의 
차이점도 살펴보자.   

```java
@Getter
public class Ticket {
    private Long id;
    private boolean isActive;
```

> isActive 타입을 primitive type 으로 변경했을 때 결과는 아래와 같다.   

```java
public class Ticket {
    private Long id;
    private boolean isActive;

    public Ticket() {
    }

    public Long getId() {
        return this.id;
    }

    public boolean isActive() { ////
        return this.isActive;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setActive(boolean isActive) {
        this.isActive = isActive;
    }
}
```

> isActive 타입을 reference type 으로 변경했을 때 결과는 아래와 같다.   

```java
public class Ticket {
    private Long id;
    private Boolean isActive;

    public Ticket() {
    }

    public Long getId() {
        return this.id;
    }

    public Boolean getIsActive() { //// 
        return this.isActive;
    } 

    public void setId(Long id) {
        this.id = id;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }
}
```  

`여기서 jackson 을 이용하여 serialize를 했을 때 의도한 것과 다른 
결과값이 나타날 수 있다.`    

```java
@Getter
@Setter
@Builder
public class Ticket {
    private Long id;
    private boolean isActive;
}
```

```java
ObjectMapper objectMapper = new ObjectMapper();
String result = objectMapper.writeValueAsString(Ticket.builder()
        .id(1L)
        .isActive(true)
        .build());

System.out.println(result);
// Output   
// {"id":1,"active":true}
```

`위 결과를 보면 의도한 결과값 isActive가 아닌 is 가 제외된 active 필드 결과값을 
확인할 수 있다.`      
`primitive 타입과 다르게 reference 타입은 정상적으로 isActive 필드로 
결과값을 나타낸다.`   

`위의 문제가 발생하는 이유는 jackson 라이브러리는 serialize 할 때, getter method를 참조하여 
필드를 가져온다.`     

> 위의 언급한 JavaBeans Naming Convention을 따른다.   

`즉, JavaBeans Naming Convention에 따라 isActive() 메소드를 참고하여 
is prefix를 제외한 active 라는 필드로 결정하게 된다.`      

이 문제를 해결 하기 위해서는 reference boolean type을 사용하거나, 
    필드 이름에서 is prefix를 사용하지 않는 것도 방법이 될 수 있다.   

또한 @JsonProperty("isActive") 와 같이 직접 필드와 맵핑해 주는 방법도 있다.   

- - - 

## 3. Kotlin   

kotlin도 동일하게 jackson 사용시 문제가 발생할 수 있다.    

```kotlin
data class Ticket(
    val id: Long,
    val isActive: Boolean
)
```

`jackson-module-kotlin 2.10.0 까지는 data class를 serialize 할 때 boolean 타입의 
is prefix를 제거했다.`   

```kotlin
val mapper = ObjectMapper()
mapper.registerModule(KotlinModule())

println(mapper.writeValueAsString(Ticket(1L, true)))
// {"id":1,"active":true}
```

`하지만, jackson-module-kotlin 2.10.1 부터는 이 스펙이 변경되어 
is prefix를 포함하게 된다.`   

```kotlin
// 버전 upgrade 후 결과 
{"id":1,"isActive":true}
```


더 자세한 내용은 
[https://github.com/FasterXML/jackson-module-kotlin/issues/80](https://github.com/FasterXML/jackson-module-kotlin/issues/80) 를 
참고하자.   

spring boot는 기본적으로 jackson을 사용하고 있기 때문에 spring boot 버전을 올리는 것만으로 
api 스펙이 변경 될 수 있다.  
따라서, 버전을 올릴 때 이러한 케이스를 고려하여 테스트를 진행해야 한다.   

- - - 

## 4. Scala   

`스칼라의 경우는 is 로 시작하는 boolean 타입일 때, 
Java Beans Naming Convention을 따르지 않는다.`   

따라서, jackson-module-scala 를 이용하여 serialize 할 때, 자바 또는 코틀린과 다른 결과값을 
전달 할 수 있으니 주의 해야 한다.   

`즉, 처음에서 언급한 kotlin dto에서 isActive 필드의 경우 기존에는 serialize 할 때 is 가 제거되어 
active로 결과값이 전달 하고 있었다.`      
`하지만, scala로 전환하면서 동일하게 필드 이름을 지정해 주었음에도 불구하고 결과값이 
다른 이유는 언어에 따라 이러한 처리 방식이 다르기 때문이다.`       

- - - 

**Reference**    

<https://velog.io/@hellojihyoung/Error-Response-JSON%EC%97%90%EC%84%9C-Boolean%EC%9D%98-is%EA%B0%80-%EC%83%9D%EB%9E%B5%EB%90%98%EB%8A%94-%EB%AC%B8%EC%A0%9C>   
<https://stackoverflow.com/questions/32270422/jackson-renames-primitive-boolean-field-by-removing-is>    
<https://maxjang.com/7>    
<https://multifrontgarden.tistory.com/269>  
<https://github.com/FasterXML/jackson-module-scala/issues/291>   
<https://github.com/FasterXML/jackson-module-kotlin/issues/346>   

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

