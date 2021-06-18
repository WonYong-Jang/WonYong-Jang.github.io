---
layout: post
title: "[Scala] val 과 def 차이"
subtitle: "val 과 def 함수를 만들 때, trait에서 추상 멤버를 사용할 때"    
comments: true
categories : Scala
date: 2021-06-16
background: '/img/posts/mac.png'
---

## When Creating functions     

val과 def 함수를 만들 때 차이점 없이 스칼라 코드를 작성할 수도 있다. 아래 예제를 보자.   

> 우선 def 함수는 엄밀하게 함수가 아니라 method이지만 편의를 위해 함수라고 부른다.    

```scala 
val isEvenVal = (i: Int) => i % 2 == 0   // a function
def isEvenDef(i: Int) = i % 2 == 0       // a method
```

그다음 List에 filter 메서드에 전달해보면,   

```scala 
scala> val xs = List(1,2,3,4)

scala> xs.filter(isEvenVal)     //val

scala> xs.filter(isEvenDef)     //def
```    

위와 같이 차이점이 거의 보이지 않지만, 스칼라 개발자로써 val과 def의 
차이점을 정확히 이해하는 것은 어떤 경우의 코드 작동 방식을 이해하는 것에 
도움이 된다.    

val과 def의 차이점에 대해 각각 살펴보자.   

#### val 함수     

val 함수는 아래와 같이 사용할 수 있다.   
`여기서 val 함수는 Function class의 instance 변수라는 점이 중요하다.`   

```scala 
scala> val toUpperVal: String => String = _.toUpperCase
toUpperVal: String => String = <function1>    
```

scala REPL에서 val 함수를 만든 후 결과를 보면 val 함수는 Function1의 
instance 임을 알 수 있다.   

Function1은 함수의 인자가 1개인 것을 나타낸다.   

인자가 2개인 함수를 만들어보자.   

```scala 
scala> val sumVal = (x: Int, y: Int) => x + y
sumVal: (Int, Int) => Int = <function2>   
```

`scala에서는 이런식으로 Function0 부터 Function22까지 즉, 0개의 인자부터 
22개의 인자까지 받을 수 있는 Class를 제공한다.`    

`Function class에는 apply method가 존재한다. 우리는 sumVal(1, 2)처럼 호출을 
할 때 호출하는 생김새가 함수처럼 보이지만, 사실 이것은 Scala의 
syntactic sugar이다.`    
`sumVal(1, 2)을 사용하는 것은 내부적으로 sumVal.apply(1,2)를 사용하는 것과 
동일하다.`    

`val 함수는 Function class의 instance 변수이므로, 다음과 같이 
anonymous class를 사용하여 val 함수를 생성할 수도 있다.`     

```scala   
val strLen = new Function1[String, Int] {
      override def apply(v1: String): Int = {
        v1.length
      }
    }
strLen("abc") // 출력 : 3
```

#### def 함수    

def는 클래스나 object안에 정의해야 하는 method이다.   




- - - 

## When to use val or def in Scala traits?   

[Stack overflow](https://stackoverflow.com/questions/19642053/when-to-use-val-or-def-in-scala-traits)의 
글을 참고 하였고, `해당 글에는 trait에 추상 멤버를 사용할 때 val을 사용하는 것은 
안티 패턴이며, def를 권장하고 있다.`        

우선 def는 def, val, lazy val, 객체에 의해 구현 될 수 있다.    
즉, def가 멤버를 정의하는데에 있어서 가장 추상적인 형태이기 때문에 
trait에서 추상 멤버를 사용하는데 가장 적합하다.   

아래 예제를 보면서 이해해보자.   
trait를 def를 이용하여 추상 멤버를 생성했고 F1, F2, F3 각각을 
상속 받았을때 모두 정상적으로 구현 가능하다.   

```scala 
trait Foo { def bar: Int }

object F1 extends Foo { def bar = util.Random.nextInt(33) } // ok

class F2(val bar: Int) extends Foo // ok

object F3 extends Foo {
  lazy val bar = { // ok
    Thread.sleep(5000)  // really heavy number crunching
    42
  }
}
```

`하지만 만약 아래와 같이 trait를 사용한다면, F1, F3은 정상적으로 define하지 못한다.`   

```scala   
trait Foo { val bar: Int }    
```

`또한, val을 사용했을때 초기화 문제가 발생할 수 있다.`    
아래와 같이 사용했을 때 원하지 않는 결과가 발생할 수 있다.   

```scala 
trait Foo { 
  val bar: Int 
  val schoko = bar + bar
}

object Fail extends Foo {
  val bar = 33
}

Fail.schoko  // zero!!
```


- - - 

**Reference**    

<https://alvinalexander.com/scala/fp-book-diffs-val-def-scala-functions/>   
<http://jason-heo.github.io/programming/2019/05/25/scala-val-vs-def-func.html>   
<https://stackoverflow.com/questions/19642053/when-to-use-val-or-def-in-scala-traits>   

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

