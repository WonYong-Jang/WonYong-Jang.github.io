---
layout: post
title: "[Spark] 아파치 스파크 Serialization "
subtitle: "Serialization challenges with Spark and Scala"    
comments: true
categories : Spark
date: 2021-06-15
background: '/img/posts/mac.png'
---


Spark를 이용하여 개발을 진행할 때 발생하는 가장 일반적인 문제 중 하나는 
NotSerializableExcetpion이다.     

```
org.apache.spark.SparkException: Task not serializable
  at org.apache.spark.util.ClosureCleaner$.ensureSerializable(ClosureCleaner.scala:304)
  at org.apache.spark.util.ClosureCleaner$.org$apache$spark$util$ClosureCleaner$$clean(ClosureCleaner.scala:294)
  at org.apache.spark.util.ClosureCleaner$.clean(ClosureCleaner.scala:122)
  at org.apache.spark.SparkContext.clean(SparkContext.scala:2058)
  ...
Caused by: java.io.NotSerializableException
```   

`spark는 네트워크로 데이터를 전송하거나 디스크에 쓸 때 객체들을 직렬화해 
바이너리 포맷으로 변환한다.` 기본적으로 Java에 내장된 직렬화를 
이용하지만 spark는 java 직렬화보다 훨씬 향상된 서드파티 라이브러리인 kryo를 
쓰는 것을 지원한다.    

Kyro를 사용할 경우는 아래와 같이 설정한다.   

```
conf.set( "spark.serializer", "org.apache.spark.serializer.KryoSerializer" )
```

`직렬화는 셔플(노드 간 데이터 전송)에도 사용된다. 로컬 디스크 또는 네트워크를 
통해 데이터가 JVM을 떠나야 할 때마다 직렬화 해야한다.`         

직렬화 규칙은 매우 간단해 보이지만, 복잡한 코드 기반에서 이를 해석하는 것은 
간단하지 않을 수 있다.   

여기서는 Spark에서 직렬화의 여러 예제를 살펴보고 이를 이해해 보자.     

- - -  

## Serialization Rules   

예제를 보기전에 Spark 코드에서 기대하는 직렬화의 기본 rule에 대해 살펴보자.   


#### When will objects need to be Serialized?   

RDD 또는 Dataframe, Dataset 에서 function을 수행할 때 각 executor에게 전송하여 
실행할 수 있도록 직렬화해야 하는 것이 일반적이다.    

#### What gets Serialized?    

직렬화 되는 항목에 대한 규칙은 Java와 일반적으로 동일하다.   

> 오직 object 만 직렬화 가능하다.   

`map으로 전달되는 function은 그 자체로 object이기 때문에 직렬화되어야 한다.    
이 function 내에서 다른 object를 참조하는 경우에 해당 object도 직렬화 
해야 한다. 
즉, 이러한 필드 중 하나만 access해도 모두 직렬화 해야 한다.`    

- - - 

## Basic Examples   

testRDD를 이용하여 여러 예제를 살펴보자.   

```scala 
val testRdd: RDD[Int]    
```

#### 1) basic spark map   

아래는 간단한 예로서, 이 경우 직렬화할 유일한 것은 입력에 1을 추가하는 
적용 방법을 가진 Function1 Object이다. Example Object는 
직렬화되지 않는다.   

```scala 
object Example {
    def myFunc = testRdd.map(_ + 1)   
}
```   

> Function1 은 다른 함수에 식을 넘기거나 val에 저장할 수도 있다. 위를 풀어서 
작성하면 아래와 같은 소스코드이다.   

```scala 
def myFunc = testRdd.map(new Function1[Int, Int] {
            override def apply(v1: Int): Int = {
                v1 + 1
            }
        }
```    

`==> PASS`    

#### 2) spark map with external variable   

위와 매우 유사하지만 이번에는 anonymous function 기능 내에서 num value 를 access 한다.   
`따라서 포함된 예제 object 전체를 직렬화 해야 한다.`       
직렬화하지 않으면 에러를 발생시킨다.   

```scala 
object Example {
    val num = 1
    def myFunc = testRdd.map(_ + num)    
}
```


`==> FAIL`    

#### 3) spark map with external variable - the first way to fix it   

2번에 대한 한가지 해결책은 문제의 object를 직렬화 할 수 있게 만드는 것이다.   
작동은 정상적으로 하지만 object 전체를 직렬화 해야 하는 것이 
바람직 하지 않을 수도 있다.   

```scala 
object Example extends Serializable {
  val num = 1 
  def myFunc = testRdd.map(_ + num)
}
```


`==> PASS`   

#### 4) spark map with external variable - a flawed way to fix it   

Example object 전체를 직렬화를 피하기 위해서 아래와 같이 시도를 해보자.  

이 경우 myFunc의 scope에 enclosednum value를 생성했고, 이 값을 
참조하면 myFunc 범위에 필요한 모든 항목에 access 할 수 있으므로 
전체 object를 직렬화 하는 것을 피할 수 있지 않을까?   
하지만, enclosedNum이 lazy val 이기 때문에 여전히 num에 대한 정보를 필요로 
하므로 Example object 전체를 직렬화 하려고 시도한다.   

```scala 
object Example {
  val num = 1
  def myFunc = {
    lazy val enclosedNum = num
    testRdd.map(_ + enclosedNum)
  }
}
```

`==> FAIL`   

#### 5) spark map with external variable - properly fixed!

위 예제와 유사하지만 enclosedNum을 val로 수정해주면 Example object를 
전체 직렬화 하지 않고도 문제를 해결할 수 있다.   

```scala   
object Example {
  val num = 1
  def myFunc = {
    val enclosedNum = num
    testRdd.map(_ + enclosedNum)
  }
}
```   

`==> PASS`   

#### 6) nested objects, a simple example   

object를 중첩하여 조금 더 복잡한 예제를 살펴보자.       

조금 더 복잡해보이지만 원칙은 같다. 여기서 innerNum은 map 함수가 참조하고 
있다. 그렇기 때문에 NestedExample object 전체를 직렬화 하였기 때문에 
정상적으로 동작한다.   
이전과 동일하게 myFunc 함수 내에 새로운 변수를 생성하여 innerNum을 받아서 
NestedExample object 전체를 직렬화 하는 것을 피할 수도 있다.   

```scala 
object Example {
  val outerNum = 1
  object NestedExample extends Serializable {
    val innerNum = 10
    def myFunc = testRdd.map(_ + innerNum)
  }
}
```   

`==> PASS`    

#### 7) nested objects gone wrong   

`이 경우는 outerNum이 map function 내에서 참조된다. 이 의미는 
Example object 가 전체가 직렬화 되어야 한다는 것이다.`   
그렇기 때문에 직렬화 실패 에러가 발생한다.    

```scala 
object Example {
  val outerNum = 1
  object NestedExample extends Serializable {
    val innerNum = 10
    def myFunc = testRdd.map(_ + outerNum)
  }
}
```

`==> FAIL`     

#### 8) nested objects, using enclosing in the inner object   

이 예제에서 이전에 해결했던 방법으로 수정이 가능하다.   
`지금 map이 오직 NestedExample object에서의 값들만 참조하고 있기 때문에 
정상적으로 작동한다.`    

```scala 
object Example {
  val outerNum = 1
  object NestedExample extends Serializable {
    val innerNum = 10
    val encOuterNum = outerNum
    def myFunc = testRdd.map(_ + encOuterNum)
  }
}
```   

`==> PASS`    


- - - 

**Reference**    

<https://medium.com/onzo-tech/serialization-challenges-with-spark-and-scala-a2287cd51c54>     
<https://medium.com/onzo-tech/serialization-challenges-with-spark-and-scala-part-2-now-for-something-really-challenging-bd0f391bd142>   
<https://github.com/onzo-com/spark-demo/>   

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

