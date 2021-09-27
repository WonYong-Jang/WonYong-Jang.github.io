---
layout: post
title: "[Scala] Case Object vs Enumerations"
subtitle: "스칼라에서 열거형을 사용하는 2가지 방법 / Scala 2, 3"    
comments: true
categories : Scala
date: 2021-09-26
background: '/img/posts/mac.png'
---

enumerated type은 지정한 값들만을 포함하는 데이터 타입이며, 대부분 최신 
프로그래밍 언어에서 지원한다.   
즉, 열거형에 사용될 수 있는 특정한 값들을 정의해서 해당 값들만 
사용할 수 있게 한다.   

`스칼라에서는 enumerated type을 사용할 수 있는 방법은 2가지가 있으며, 
    이 글에서는 2가지 방법을 살펴보고 어떤 방법을 사용하는 것이 
    Best Practice인지 살펴보자.`         

## 1. Scala Enumerations   

스칼라에서 열거형을 사용할 수 있는 첫번째 방법은 Enumeration을 
상속 받는 방법이다.   

```scala  
object CurrencyEnum extends Enumeration {
  type Currency = Value
  
  val GBP = Value(1, "GBP")
  val EUR = Value
}
```

Value의 파라미터에 대해 보면 아래와 같다. i와 name을 받고 있으며, 
    이 글에서는 i를 id로 표현한다.   

```scala
  /** Creates a fresh value, part of this enumeration, called `name`
   *  and identified by the integer `i`.
   *
   * @param i    An integer that identifies this value at run-time. It must be
   *             unique amongst all values of the enumeration.
   * @param name A human-readable name for that value.
   * @return     Fresh value with the provided identifier `i` and name `name`.
   */
  protected final def Value(i: Int, name: String): Value = new Val(i, name)
```

`Enumeration은 values 메서드를 통해 iteration을 제공하며, 열거형 값에 id(Integer)와 name(String)을 
지정할 수 있다.`       
위의 경우 GBP 타입에 id를 1로 지정했고 name을 "GBP"라고 지정했다. 만약 id와 name을 
지정하지 않으면 스칼라 컴파일러는 default로 지정한다.    
스칼라는 지정된 id를 추적하여 다음 숫자를 할당한다. 명시적으로 입력을 하지 않는다면 0부터 시작한다.    
위의 예시에서 GBP id를 1로 지정했으므로, 그 다음 EUR 의 id는 2로 지정하게 된다.    
만약 EUR의 id만 3으로 지정했다면, GBP는 0부터 시작하여 id가 지정된다.   
또한, name은 default로 변수의 이름으로 지정된다.   

아래는 열거형을 values 메서드를 이용하여 iteration하여 
id와 name을 출력하는 예시이다.   

```scala
CurrencyEnum.values.foreach(value => {
      println("ordinal: " + value.id)
      println("name: " + value)
    })

println("CurrencyEnum.Value: " + CurrencyEnum(1)) 
// id 값을 이용해서 가져올 수도 있다.   
// 또는 CurrencyEnum.withName("GBP") 도 동일한 결과값을 출력한다.   


//  Output   
// ordinal: 1
// name: GBP
// ordinal: 2
// name: EUR

// CurrencyEnum.Value: GBP
```

`하지만 enumeration은 몇가지 큰 단점이 있다!`       

- 아래와 같이 열거형의 타입을 구분하지 못하여 오버로딩에 문제가 생긴다.     

<img width="674" alt="스크린샷 2021-09-26 오후 11 29 58" src="https://user-images.githubusercontent.com/26623547/134812164-2f84edf7-48ef-4c95-8884-066a2c512d84.png">   

- 또 다른 문제점은 더 많은 데이터를 가진 타입으로 확장하기가 어렵다는 것이다.    

- withName 메서드를 제공해 줘서 사용하기 쉽지만 지정되지 않은 name이 들어올 경우 
NoSuchElementException가 발생하기 때문에 안전하지 않다.     

- - - 

## 2. A type-Saaf Alternative    

`위의 문제점을 해결하기 위해 sealed traits or abstract classes and case objects를 사용할 수 있다.    
이 방법은 Type-safe하며, 열거형 값에 더 많은 필드를 가질 수 있다.`      

> Enumeration을 상속받는 방법은 id와 name 값만 필드로 가질 수 있다.   

```scala    
sealed abstract class CurrencyADT(name: String, iso: String)

object CurrencyADT {
  case object EUR extends CurrencyADT("Euro", "EUR")
  case object USD extends CurrencyADT("United States Dollar", "USD")
}
```

이 방법도 단점을 가지고 있다. Enumeration을 상속받아 열거형을 
만들면 values 메서드와 withName 메서드를 제공해주는데, 이 방법은 
직접 구현해 주어야 한다.   

하지만 withName메서드가 안전하지 않다는 단점이 있기 때문에 아래와 
같이 직접 구현하여 단점을 장점으로 만들 수 있다.   

values를 직접 구현하고 이를 통해 안전한 withName 메서드를 다음과 
같이 구현 가능하다.   

```scala   
object CurrencyADT { 
     val values: Seq[CurrencyADT] = Seq(EUR, USD)  // values 리스트 
}
```

```scala 
val isoToCurrency: Map[String, CurrencyADT] = values.map(c => c.iso -> c).toMap

// 안전한 withName 메서드    
def fromIso(iso: String): Option[CurrencyADT] = isoToCurrency.get(iso.toUpperCase)
```

## 3. A Look Towards the Future   

Scala 2 버전에서는 자바의 Enum이 호환이 안되지만, Scala 3버전 부터는 
자바 Enum이 호환이 된다.  

즉, 아래와 같이 사용 가능하며, Scala 2 에서 열거형을 사용할 때 
문제가 된 부분을 해결해 줄 수 있다.   

```scala   
object CurrencyADT(name: String, iso: String) extends java.lang.Enum {
    case EUR("Euro", "EUR")
    case USD("United States Dollar", "USD")
}
```

- - - 

**Reference**    

<https://www.baeldung.com/scala/enumerations>   
<https://www.baeldung.com/scala/case-objects-vs-enumerations>    
<https://www.baeldung.com/scala/algebraic-data-types>    
<https://pedrorijo.com/blog/scala-enums/>   

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

