---
layout: post
title: "[Scala] 스칼라의 Type에 대해서 "
subtitle: "type bounds(Upper bound, Lower bound), type variance"    
comments: true
categories : Scala
date: 2021-03-05
background: '/img/posts/mac.png'
---

# 스칼라 Type    

스칼라는 정적타이핑이지만 타입추론을 제공하고 있기 때문에 
타입에 대해서 많은 정보를 명시하지 않아도 된다. 

> 타입 추론은 컴파일타임때 일어 난다.   

```scala   
var num: Int = 10 // 타입 명시함
// num: Int = 10
var num2 = 10 // 타입 추론 사용
// num2: Int = 10
var str = "Ousider" // 타입 추론함
// str: java.lang.String = "Outsider"
```


<img width="730" alt="스크린샷 2021-03-16 오후 5 39 10" src="https://user-images.githubusercontent.com/26623547/111280026-b07e4a80-867e-11eb-9630-c982abecfdcb.png">    


스칼라에서 타입의 구조는 위와 같으며 `Any, Nothing, Option이라는 특별한 타입을 
제공하고 있다.`    

`Any 타입은 모든 타입의 superclass이기 때문에 어떤 타입의 오브젝트도 참조할 수 
있는 추상클래스이다.`   

`AnyVal, AnyRef는 Any의 자식으로 AnyVal은 Int, Double 같은 Java의 primitive타입과 
매핑되는 타입들의 기본이 되고 AnyRef는 모든 레퍼런스 타입의 기본이 된다.`   

AnyRef는 바로 자바의 Object에 매핑된다.   

`Nothing 타입은 모든 타입의 최하위 타입이다.`   
정해진 타입외에 exception을 리턴하게 되면 Nothing타입으로 추론한다.    

`Option[T]타입은 결과가 정해지지 않은 경우를 위해서 지원한다. 상황에 따라 
Option[T]를 상속받는 Some[T]나 None을 리턴할 수 있으며 이는 NullPointException을 
줄일 수 있게 해준다.`    

- - - 

## 메서드 리턴타입 추론    

메서드의 리턴타입에 대한 추론은 메서드를 정의하는 방법에 따라 달라지는데 
`메서드를 등호(=)로 정의한다면 스칼라는 리턴타입을 추론하고 없다면 void가 된다.`    

```scala
def method1() { 6 } // 리턴타입 void
def method2() = { 6 } // 리턴타입 Int
def method3() = 6 // 리턴타입 Int
def method4 : Double = 6 // 리턴타입 Double
```

> 메서드를 정의할 때 body가 한 문장이면 {} 를 생략 가능하다.    

- - -    

## 타입 바운드     

`스칼라에서 타입 바운드(type bounds)는 타입 매개변수와 타입 변수에 제약을 
거는 행위이다.`    
이를 통해 타입에 안전하게(type safety) 코딩을 할 수 있도록 한다.    
아래와 같은 3개의 타입 바운드가 존재한다.

- Upper Bound ( 자바에서는 extends )    
- Lower Bound ( 자바에서는 super )   
- Context Bound   

> View Bound를 사용하다가 scala 2.10 부터 deprecated되고 Context Bound로 전환되었다.    

#### Upper Type Bounds    

먼저 `Upper Bound` (한국 말로 상위 타입 경계라 한다)   

[T <: S] 이렇게 표현할 수 있다. T는 타입 매개변수이고 S는 타입이다.   

아래 예시를 살펴보자.   

```scala  
abstract class Animal { def name: String }

abstract class Pet extends Animal { def owner: String }  // Pet 에서만 사용할 메서드   

class Cat extends Pet {
  override def name: String = "Cat"
  override def owner: String = "mike"
}

class Dog extends Pet {
  override def name: String = "Dog"
  override def owner: String = "kaven"
}

class Lion extends Animal {
  override def name: String = "Lion"
}

class PetContainer[T <: Pet](t: T) {  // Upper bound    
  def pet: T = t
}

object Main extends App {

  val dogContainer = new PetContainer[Dog](new Dog)
  val catContainer = new PetContainer[Cat](new Cat)

  println(dogContainer.pet.name) // 출력 : Dog
  println(catContainer.pet.name) // 출력 : Cat
}
```

PetContainer 클래스를 살펴보면, upper bound(<:)를 사용했다.   

`따라서 Pet의 자식 클래스를 사용할 수 있도록 제한을 걸었다.`

`upper bound(<:)의 제약을 넘어서면, 타입 파라미터 바운드와 타입이 안 맞는다는 에러가 발생한다.`    

```scala
val lionContainer = new PetContainer[Lion](new Lion)  // ths would not compile   
```

```
inferred type arguments [Member] do not conform to method print's type parameter bounds [T <: SchoolMember]
type mismatch;
```

`Upper Bound를 사용하는 이유는 제너릭 파라미터에 있는 메서드나 속성만 사용하고자 할때 
제한을 건다.`    
위의 경우는 Animal에는 없고 Pet에만 있는 owner 라는 메서드를 사용해야 할때 
이러한 제한을 걸게 된다.   


#### Lower Bounds   


다음은 `Lower Bound` 이다.( 한국 말로 하위 타입 경계라 한다.)    
자바의 super 개념과 동일하다.   


```scala
class LowerBounds[Parent] {
    def print[T >: Parent](t: T) {
      println(t)
    }
}

class Parent
class Child extends Parent

val parent = new Parent
val child = new Child

val instance = new LowerBounds[Parent] 
instance.print(parent) // 출력 : Main$Parent@3a03464   
instance.print(child)  // 출력 : Main$Child@2d3fcdbd   
```

위의 예제는 Parent 보다 큰 타입만 받도록 하는 예제이다.    
LowerBounds 클래스에 [T >: Parent] 라는 제약이 있는 print 메서드를 정의했다.   

결과를 실행해보면, Upper Bounds의 예시처럼 에러를 기대하겠지만, 실제로 
테스트해보면 잘 출력된다. 

단순한 Lower bounds만으로 스칼라가 에러를 출력하지 않는다.


- - - 

**Reference**    

<https://blog.outsider.ne.kr/478>    
<https://knight76.tistory.com/entry/scala-class-4-%EC%98%88%EC%8B%9C>   

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

