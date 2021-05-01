---
layout: post
title: "[Scala] 예외 처리 ( Option, Either, Try )"
subtitle: "NullPointerException 을 처리하기 위한 여러가지 방법"    
comments: true
categories : Scala
date: 2021-04-29
background: '/img/posts/mac.png'
---

# 스칼라 예외처리    

Scala에서는 JVM 기반 언어 최대의 적인 NPE(NullPointerException)를 
functional하게 handling 할 수 있는 다양한 수단을 제공하고 있다.    
Scala의 exception handling 3인방인 Option, Either, Try 에 대해 알아보도록 하자.   

- - - 

## Option   

Java에서는 빈 List에 find를 할 때 값이 없으면 null을 반환하거나 exception throw를 
하는 것이 일반적인 상황이다. 이 일반적인 상황은 매우 위험한 상황이 될 수 있는데 
잘못해서 null을 reference 했다간 큰 일이 날 수 있고, exception throw 또한 호출부에서 
잘 해결해주지 않으면 프로그램이 뻗어버리기 때문이다. exception이 발생했다고 해서 
프로그램이 뻗어버리는 것은 좋은 상황은 아니다.    

<img width="450" alt="스크린샷 2021-04-29 오후 4 10 55" src="https://user-images.githubusercontent.com/26623547/116514188-a732ff80-a905-11eb-9b46-4ea593974c84.png">   

`Scala에서는 이러한 일을 좀 더 우아하게 처리해줄 수 있게 Option[T] 라는 type을 제공한다.`   
값이 있으면 Some(value), 값이 없으면 None을 반환한다. 

> None은 Option[Nothing]을 상속하는 object이다. null 대신 사용하여 
NullPointerException을 방지 할 수 있다. 

Option은 2가지의 특징을 가지고 있다.   

- `Type safety : Option으로 감싼 값을 매개변수를 통해 전달해 타입의 안정성을 보장할 수 있다.`      

- `Functionally aware : Option은 버그를 적게 생성하는데 도움이 되는 함수형 프로그래밍 방법을 제공한다.   
또한, 연속적으로 계산되는 상황에서 안정적으로 실행된다. 즉, 중간에 문제가 생기는 것을 방어한다.`   

Option은 Some 또는 None에 대한 메서드를 제공한다.   

- isDefined - true if the object is Some   
- nonEmpty - true if the object is Some   
- isEmpty - true if the object is None   

```scala  
val ol: Option[Int] = Option(null)   
assert(false == ol.isDefined)  // ol == None   
```

#### Retrieving an Option's Contents  

Option으로 감싼 값을 여러 방법으로 가져올 수 있다.    
아래와 같이 get 메서드를 이용할 수 있으며, 만약 값이 None이라면 
NoSuchElementException을 발생 시킬 수 있기 때문에 isDefined 메서드로 
Some인지 확인하는 작업이다.   

```scala 
val o1: Option[Int] = ...
val v1 = if (o1.isDefined) {
  o1.get
} else {
  0
}
```

또 다른 방법은 패턴 매칭을 이용하는 방법이다.   

```scala   
val o1: Option[Int] = ...
val v1 = o1 match {
  case Some(n) =>
    n
  case None =>
    0
}
```   

아래는 더 간편한 방식으로 Option의 값을 가져올 수 있다.     

- getOrElse : Option내에 있는 값이 Some이면 값을 가져오고, 그렇지 않으면 default 값을 리턴한다.     

- orElse : 실제로 값을 추출하지는 않지만, None인 경우 값을 채우려한다. Option이 비어 있지 않으면 
이 Option을 반환하고, 그렇지 않은 입력한 Option을 반환한다.   

```scala 
val v1 = o1.getOrElse(0) // Some이면 값을 가져오고 None이면 0 리턴   
```

#### Mapping Options   

스칼라 공식문서에는 아래와 같이 Option이 설명되어 있다.   

> Represents optional values. Instances of Option are either an instance of scala.Some or the object None. 
The most idiomatic way to use an scala.Option instance is to treat it as a collection or monad and use map,flatMap, filter, or foreach      

map, flatMap, filter 또는 foreach를 사용하는 것을 권장하고 있다.   

```scala 
final def map[B](f: (A) => B): Option[B]   
```

아래 소스와 같이 map을 통해서 Option안에 있는 값이나 타입을 변경할 수 있다.   

```scala
val o1: Option[Int] = Some(10)
assert(o1.map(_.toString).contains("10"))
assert(o1.map(_ * 2.0).contains(20))

val o2: Option[Int] = None
assert(o2.map(_.toString).isEmpty)
```



- - - 

## Either   

Either는 Exception과 결과 값을 한번에 받을 수 있는 타입니다.    

아래와 같이 Either에 값을 담을 수 있다.   
인자로 제대로 된 값이 들어오면 Right 즉, Either의 오른쪽에 담고 
인자에 제대로 된 값이 안 들어오면 Left 즉, Either의 왼쪽에 값을 
담는다.   

<img width="450" alt="스크린샷 2021-04-29 오후 4 11 02" src="https://user-images.githubusercontent.com/26623547/116514202-abf7b380-a905-11eb-81c1-16ac05b9b031.png">   

```scala 
def eitherTest(num: Option[Int]): Either[String, Int] = num match {
  case Some(n) => Right(n)
  case None => Left("Error! Number is missing!")
}
```

그 후, 아래와 같이 Either[String, Int] 타입을 확인할 수 있다.


```scala  
val result = eitherExample(Some(7)) match {
  case Right(num) => num
  case Left(err) => err
}
```

- - - 

## Try   

자바에서 try/catch를 이용한 예외처리는 스칼라에서도 가능하다.    
아래와 같이 예외를 처리할 수 있지만, try/catch를 통한 예외처리는 여러 가지 
문제가 있다.   

우선 다른 함수를 호출할 때, 어떤 예외가 발생할지 모른다. 

```scala 
try {
  methodThatMayThrowAnException()
} catch {
  case e: MyException => // do stuff
  case e: NonFatal => // do stuff
  case _: Throwable => // do stuff
} finally {
  anotherPieceOfCode() // useful to close a database connection for instance
}
```


<img width="450" alt="스크린샷 2021-04-29 오후 4 11 10" src="https://user-images.githubusercontent.com/26623547/116514217-b0bc6780-a905-11eb-85c8-a52a44361f76.png">   

다음과 같이 사용한다.   

```scala 
Try {
    upperString(str)
}

match {
    case Success(_) => ...
    case Failure(_) => ...
}
```



- - - 

**Reference**    

<https://alvinalexander.com/scala/best-practice-option-some-none-pattern-scala-idioms/>    
<https://www.scala-lang.org/api/2.13.3/scala/Option.html>   
<https://www.baeldung.com/scala/option-type>   
<https://jaxenter.com/cheat-sheet-complete-guide-scala-136558.html>   
<https://nephtyws.github.io/programming/scala-option-either-try/>   

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

