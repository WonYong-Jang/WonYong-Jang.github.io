---
layout: post
title: "[Scala] Jackson을 이용한 deserialize 이슈"
subtitle: "java.lang.Integer cannot be cast to java.lang.Long 에러 발생 및 Solution"    
comments: true
categories : Scala
date: 2023-11-10
background: '/img/posts/mac.png'
---

이번 글에서는 scala에서 Option[Long]과 같은 Option 타입을 사용하여 
Jackson 라이브러리를 이용한 역직렬화를 할 때 발생했던 이슈에 대해서 공유할 예정이다.  

[링크](https://github.com/FasterXML/jackson-module-scala/issues/213)를 참고해보면, 
jackson-module-scala 사용하여 역직렬화를 할 때 발생할 수 있는 버그 임을 확인 했다.    

> 현재 아래와 같이 scala 2.11 버전을 사용하고 있다.   

```groovy
implementation group: 'com.fasterxml.jackson.module', name: 'jackson-module-scala_2.11', version: '2.9.4'
```

- - - 

## 1. Reproduce the issue

아래와 같이 문제를 재연해보자.   

```scala
case class Ticket
(
  id: Long,
  mergeTicketId: Option[Long]
)

class SomeService {
  def someMethod(value: Long): Long = {
    value
  }
}

class JacksonDeserializeTest extends FunSpec {

  val objectMapper = buildMapper
  val service = new SomeService

  describe("JacksonDeserializeTest") {

    it("java.lang.Integer cannot be cast to java.lang.Long") {
      val json = """{"id" : 1, "mergeTicketId" : 2 }"""

      val ticket = objectMapper.readValue[Ticket](json)

      assert(ticket.mergeTicketId.isDefined === true)
      assert(service.someMethod(ticket.mergeTicketId.get) === 2)
    }
  }

  def buildMapper: ObjectMapper with ScalaObjectMapper = {
    val mapper = new ObjectMapper() with ScalaObjectMapper
    mapper.registerModule(DefaultScalaModule)
    mapper
  }
}
```

Output

```
java.lang.Integer cannot be cast to java.lang.Long
java.lang.ClassCastException: java.lang.Integer cannot be cast to java.lang.Long
	at scala.runtime.BoxesRunTime.unboxToLong(BoxesRunTime.java:105)
```

- - -

## 2. What is happening, and why?   

자바와 스칼라 차이, 그리고 Jackson 처리방식을 확인해 보면 문제를 확인할 수 있다.   

### 2-1) Java Approach   

##### 2-1-1) Generics with Reference Types Only   


```java
List<int>     // not allowed   
List<Integer> // use the boxed type
```


### 2-2) Scala Approach   

##### 2-2-1) Generics with Primitive Types  

`스칼라는 자바와 달리 primitive 타입을 generic class에 type argument로 사용하는 것을 지원한다.`    

```scala
Option[Int] // 여기서 Int는 scala에서 primitive type 이다.   
```

JVM Level 에서는 이를 Option[Object]로 나타낸다.   


### 2-3) Interaction with Jackson   

`Jackson은 주로 java library이며, scala module을 지원 하지만 
Option과 같은 타입에 대해서는 java reflection을 사용한다.`   

즉, Jackson은 java.lang.Integer, java.lang.Long, java,math,BigInteger, java.lang.String 
과 같이 Object 타입을 사용한다.   

다시 말하면, 스칼라 컴파일러는 primitive 타입으로 알고 있지만 JVM과 Jackson은 이를 Object 로 
타입을 다룬다.   

문제가 되는 상황은 아래와 같다.   

### 2-4) Issue Scenario   

- 스칼라에서 Option[Long]을 사용한다면, 스칼라 컴파일러는 Option[Object]로 JVM에 나타낸다.   
- Jackson 은 Object를 java.lang.Long로 해석한다.   
- 스칼라 컴파일러는 이를 알지 못하며 long 으로 처리하려고 한다.   
- 이때, 만약 실제 값이 long 이 아니면, ClassCastException 을 발생시킨다.   
    > long의 type 범위가 아닌, int 범위의 작은 숫자일 경우 문제가 발생한다.   

`즉, 이 문제는 스칼라 타입과 JVM의 limitation과 Jackson's Java-centric type resolution 때문에 발생하게 된다.`   



- - - 

## 3. Solution   

위에서 언급한 버그를 해결하기 위한 방법은 아래와 같다.  

더 자세한 내용은 [링크](https://github.com/FasterXML/jackson-module-scala/wiki/FAQ)를 참고하자.   

### 3-1) Using alternative types  

Option[java.lang.Integer], Option[java.lang.Long]과 같은 타입을 사용한다.  

```scala
case class Ticket
(
  id: Long,
  mergeTicketId: Option[java.lang.Long]
)
```

### 3-2) JsonDeserialize annotation   

@JsonDeserialize 어노테이션을 추가하여 해당 타입 사용하도록 한다.   

```scala
case class Ticket
(
  id: Long,
  @JsonDeserialize(contentAs=classOf[java.lang.Long])
  mergeTicketId: Option[Long]
)
```

- - - 

**Reference**    

<https://github.com/FasterXML/jackson-module-scala/wiki/FAQ>  
<https://github.com/FasterXML/jackson-module-scala/issues/62>   
<https://stackoverflow.com/questions/19379967/strange-deserializing-problems-with-generic-types-using-scala-and-jackson-and-ja>   
<https://github.com/FasterXML/jackson-module-scala/issues/213>   

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

