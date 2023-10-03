---
layout: post
title: "[Scala] val 과 def 차이와 주의사항"
subtitle: "val 과 def 차이, def를 val로 변환, trait에서 추상 멤버를 사용할 때(val 사용시 초기화 이슈)"    
comments: true
categories : Scala
date: 2021-06-16
background: '/img/posts/mac.png'
---

스칼라에서 val과 def 를 각각 구분하여 사용하고 있고 이에 대한 
차이를 이해하는 것은 중요하다.  

기본적으로 val은 Immutable 하기 때문에 한번만 초기화 되며, 재할당 될 수 없다.    
반면, def 는 호출 될 때마다 실행되어 값이 변경될 수 있다.   

```scala
val pi = 3.14  // constant value, will always be 3.14
def getCurrentTimeMillis: Long = System.currentTimeMillis()
```

scala 전반적인 기본 개념은 [링크](https://wonyong-jang.github.io/scala/2021/02/24/Scala.html)를 
참고하자.   

이번 글에서는 val과 def를 사용할 때 주의사항과 
언제 사용해야 하는지 자세히 살펴보자.   

- - - 

## 1. When Creating functions     

val과 def 함수를 만들 때 차이점 없이 스칼라 코드를 작성할 수도 있다.    
아래 예제를 보자.      

> 우선 def 함수는 엄밀하게 함수가 아니라 method이지만 편의를 위해 함수라고 언급할 예정이다.    

```scala 
val isEvenVal = (i: Int) => i % 2 == 0   // a function
def isEvenDef(i: Int) = i % 2 == 0       // a method
```

그다음 List에 filter 메서드에 전달해보면,   

```scala 
scala> val xs = List(1,2,3,4)

scala> xs.filter(isEvenVal)     // val

scala> xs.filter(isEvenDef)     // def
```    

위와 같이 차이점이 거의 보이지 않지만, 스칼라 개발자로써 val과 def의  
차이점을 정확히 이해하는 것은 코드 작동 방식을 이해하는 것에 도움이 된다.   

하나의 예시로 
Spark sql에서 [udf](https://jaceklaskowski.gitbooks.io/mastering-spark-sql/content/spark-sql-udfs.html) 
사용할 때를 살펴보자.   

```scala
import org.apache.spark.sql.functions.udf

// 함수 생성
def toUpper(value: String) = value.toUpperCase
// udf 함수 등록
val myUDF = udf(toUpper _)

// test용 DataFrame 생성  
val df = Seq(Person("kim", 10), Person("lee", 20)).toDF

// UDF 사용 및 결과 확인 
df.withColumn("upper_name", myUDF($"name")).show()

+----+---+----------+
|name|age|upper_name|
+----+---+----------+
| kim| 10|       KIM|
| lee| 20|       LEE|
+----+---+----------+
```

위 예시에서 UDF를 만들 때 val 이 아닌, def로 생성하게 되면 에러가 발생한다.   

```scala
// 함수 생성
def toUpper(value: String) = value.toUpperCase

// 함수 등록
val upper = org.apache.spark.sql.functions.udf(toUpper)

<console>:25: error: missing argument list for method toUpper
Unapplied methods are only converted to functions when a function type is expected.
You can make this conversion explicit by writing `toUpper _` or `toUpper(_)` instead of `toUpper`.
```

물론, 아래와 같이 `def를 val로 변환하여 해결`할 수 있지만 
이에 대해 아래에서 자세히 살펴보자.   


```scala
// 함수 생성
def toUpper(value: String) = value.toUpperCase
// udf 함수 등록
val myUDF = udf(toUpper _)
```

이제 val과 def의 차이점에 대해 각각 살펴보자.   

### 1-1) val 함수     

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

> scala 버전 2.11 기준이다.   

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

### 1-2) def 함수    

def는 클래스나 object안에 정의해야 하는 method이다.  


```scala
def toUpper(value: String) = value.toUpperCase // method

// 아래 예시는 method가 아닌, function임을 주의하자.   
def toUpper: String => String = _.toUpperCase // function
```

`위에서 확인했던 udf 예시에서 def로 생성한 메서드를 이용했을 때 에러가 발생했던 이유는 udf가 아래와 같이 
Function type의 인자를 받도록 되어 있기 때문이다.`   

```scala
def udf[RT: TypeTag, A1: TypeTag](f: Function1[A1, RT]): UserDefinedFunction = {
    val inputTypes = Try(ScalaReflection.schemaFor(typeTag[A1]).dataType :: Nil).toOption
    UserDefinedFunction(f, ScalaReflection.schemaFor(typeTag[RT]).dataType, inputTypes)
}
```

`따라서, 아래와 같이 udf 등록시 def를 val로 변환해 주었을 때 udf 등록이 가능했던 것이다.`       

```scala
scala> toUpper _
res7: (Int, Int) => Int = <function2>
```

- - - 

## 2. When to use val or def in Scala traits?   

[Stack overflow](https://stackoverflow.com/questions/19642053/when-to-use-val-or-def-in-scala-traits)의 
글을 참고 하였고, `해당 글에는 trait에 추상 멤버를 사용할 때 val을 사용하는 것은 
안티 패턴이며, def를 권장하고 있다.`        

val 로 선언된 멤버 변수가 초기화 되기 전에 access를 할 때, NullPointerException 또는 부정확한 결과값을 
리턴할 수 있는 문제가 발생할 수 있다.   

> 즉, 초기화 순서 문제가 발생할 수 있다.   

`우선 def는 def, val, lazy val 객체에 의해 구현 될 수 있다.`        

> trait내에 def로 선언하고 상속받은 trait 또는 class에서 def, val, lazy val 등으로 
구현될 수 있다.   


`결론부터 말하면, def가 멤버를 정의하는데에 있어서 가장 추상적인 형태이기 때문에 
trait에서 추상 멤버를 사용하는데 가장 적합하다.`       

아래 예시를 살펴보면서 이해해보자.   

### 2-1) Potential Initialization Issue with val   

아래 예시 결과를 확인해보면, 초기화 이슈로 기대한 결과값과 다르게 
출력된 것을 확인할 수 있다.  

즉, val name이 초기화 되기 전에 오버라이드 된 message가 먼저 호출 되었기 때문에 
null이 출력되었다.   

```scala
trait Greeting {
  val message: String = "Hello, World!"
}

class CustomGreeting extends Greeting {
  override val message: String = s"Hello, $name!"
  val name: String = "User"
}

object Start {
  def main(args: Array[String]): Unit = {

    val myGreeting = new CustomGreeting
    println(myGreeting.message)
  }
}
```

Output

```
Hello, null!
```

이에 대한 해결책으로 def 를 사용하는 것이다.  

> 또는 lazy val을 사용하여 해결할 수도 있다.  

`def는 결과를 저장하지 않고, evaluate가 발생하는 시점에 불리기 때문에 이러한 
초기화 이슈를 해결할 수 있다.`   

```scala
trait Greeting {
  def message: String = "Hello, World!"
}

class CustomGreeting extends Greeting {
  override def message: String = s"Hello, $name!"  // 또는 lazy val 사용 
  val name: String = "User"
}
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

