---
layout: post
title: "[Spark] 아파치 스파크 Serialization "
subtitle: "Serialization challenges with Spark and Scala / Passing function to spark"    
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

## 1. Serialization Rules   

예제를 보기전에 Spark 코드에서 기대하는 직렬화의 기본 rule에 대해 살펴보자.   


#### 1-1) When will objects need to be Serialized?   

RDD 또는 Dataframe, Dataset 에서 function을 수행할 때 각 executor에게 전송하여 
실행할 수 있도록 직렬화해야 하는 것이 일반적이다.    

#### 1-2) What gets Serialized?    

직렬화 되는 항목에 대한 규칙은 Java와 일반적으로 동일하다.   

> 오직 object 만 직렬화 가능하다.   

`map으로 전달되는 function은 그 자체로 object이기 때문에 직렬화되어야 한다.    
이 function 내에서 다른 object를 참조하는 경우에 해당 object도 직렬화 
해야 한다. 
즉, 이러한 필드 중 하나만 access해도 모두 직렬화 해야 한다.`    

> map으로 전달되는 function은 driver가 아닌, executor에서 실행되기 때문에 
직렬화 하여 네트워크를 통해 전송 된다.   

- - - 

## 2. Basic Examples   

testRDD를 이용하여 여러 예제를 살펴보자.   

```scala 
val testRdd: RDD[Int]    
```

#### 2-1) basic spark map (PASS) 

아래는 간단한 예로서, 이 경우 직렬화할 유일한 것은 입력에 1을 추가하는 
적용 방법을 가진 Function1 Object이다.    
따라서 Example Object는 
직렬화가 필요 없기 때문에 직렬화 되지 않는다.   

```scala 
object Example {
    def myFunc = testRdd.map(_ + 1)   
}
```   

> Function1 은 함수의 인자가 1개인 것을 나타낸다. 위를 풀어서 
작성하면 아래와 같은 소스코드이다.   

```scala 
def myFunc = testRdd.map(new Function1[Int, Int] {
            override def apply(v1: Int): Int = {
                v1 + 1
            }
        }
```    


#### 2) spark map with external variable (FAIL) 

위와 매우 유사하지만 이번에는 anonymous function 기능 내에서 
num 변수를 access 한다.   

`map으로 전달되는 function은 executor에서 실행되고, num 변수는 
driver에서 가지고 있는 변수 이다.`      
`따라서, num 변수도 같이 copy가 되어야 한다.`      

> 참고로, num 변수가 executor에서 복사되어 사용하다가 다른 값으로 변경되어도
driver에서 사용하는 num 변수에는 업데이트가 안된 다는 것을 주의해야한다.     

`하지만 주의해야할 점은 num 변수만 copy 하는게 아닌, num 변수를 
포함하는 object 전체를 직렬화한다.`      
그렇기 때문에 해당 객체에 어떤 함수 및 멤버 변수가 있을지 모르기 때문에 
side effect가 발생할 가능성이 있고, 해당 객체 크기가 크다면 
성능에도 영향을 끼칠 수 있게 된다.    

아래 예제는 object 전체를 직렬화 해야 한다.     
`기본적으로 자동으로 직렬화를 시도하지만 
Serializable 하지 않다면, 에러를 발생시킨다.`       

> 아래는 Example object가 serializable하지 않기 때문에 실패한다.   

```scala 
object Example {
    val num = 1
    def myFunc = testRdd.map(_ + num)    
}
```


#### 3) spark map with external variable - the first way to fix it (PASS)   

2번에 대한 한가지 해결책은 문제의 object를 직렬화 할 수 있게 만드는 것이다.     

작동은 정상적으로 하지만 object 전체를 직렬화 해야 하는 것이 위에서 언급한 
문제점들이 많기 때문에 바람직 하지 않을 수도 있다.     

```scala 
object Example extends Serializable {
  val num = 1 
  def myFunc = testRdd.map(_ + num)
}
```


#### 4) spark map with external variable - a flawed way to fix it (FAIL)    

Example object 전체를 직렬화를 피하기 위해서 아래와 같이 시도를 해보자.  

이 경우 myFunc의 scope에 enclosedNum 변수를 생성했고, 이 값을 
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


#### 5) spark map with external variable - properly fixed! (PASS)   

위 예제와 유사하지만 enclosedNum을 val로 수정해주면 Example object를 
전체 직렬화 하지 않고도 문제를 해결할 수 있다.   

`위에서 언급한 것처럼, map으로 전달 되는 function은 네트워크를 통해 
executor에서 실행되며 이때 num 변수를 사용하기 위해 this.num을 호출하게 된다.`       
`이때 this가 serializable 하지 않다면 에러가 발생하게 된다.`      

`따라서, 아래와 같이 this를 사용하지 않도록 함수 범위 내에서 
로컬 변수로 선언하게 되면 object 전체가 아닌 로컬 변수만 copy 해서 
사용하게 된다.`   

> enclosedNum은 멤버 변수가 아닌 로컬 변수이다.     

```scala   
object Example {
  val num = 1
  def myFunc = {
    val enclosedNum = num
    testRdd.map(_ + enclosedNum)
  }
}
```   

`즉, 외부에 선언된 변수를 참조하기 위해서는 함수 내에 로컬 변수로 새롭게 정의하여 
사용한다면 직렬화 문제를 피할 수 있게 된다.`   


#### 6) nested objects, a simple example (PASS)    

object를 중첩하여 조금 더 복잡한 예제를 살펴보자.       

조금 더 복잡해 보이지만 원칙은 같다. 여기서 innerNum은 map 함수가 참조하고 
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


#### 7) nested objects gone wrong (FAIL)     

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


#### 8) nested objects, using enclosing in the inner object (PASS)

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

- - - 

## 3. Passing Function     

Driver에 있는 변수를 사용할 경우 더 다양한 예제를 살펴보자.   

아래 예제에서 partition 및 task를 출력하기 위한 코드를 
먼저 간략하게 살펴보자.   

```scala
val tc = org.apache.spark.TaskContext.get
println(s"${tc.partitonId}")      
println(s"${tc.stageId}")         
println(s"${tc.attemptNumber}")
println(s"${tc.taskAttemptId}")
```

#### 3-1) 예제 1    

아래 예제를 보면, 1부터 10까지를 counter 변수에 순차적으로 
누적합을 구하는 예제이다.   

`foreach에서 실행한 function은 executor에서 실행된다.`      

> 로컬 환경의 경우 driver 자체가 executor 역할을 같이 하게 된다.    

결과를 확인해보면, foreach에서 계산하여 누적한 결과값은 55이다.   
하지만, 실제 counter 변수를 출력해보면 결과는 0 인 것을 확인할 수 있다.   

`로컬로 실행하더라도 driver가 executor의 역할을 같이하므로, 
    구분은 명확하게 한다.`   

`즉 최초 선언된 counter 변수는 driver에서 선언된 변수이지만, executor에서 
사용하기 위해 counter 변수를 copy해서 사용한다.`   

executor에서 copy한 counter 변수를 변경하여도, driver에 있는 counter 변수와는 
관련이 없다.   


```scala
var counter = 0
val rdd = sc.parallelize(1 to 10, 1) // 1개 파티션만 생성하여 하나의 executor에서만 실행되도록  
rdd.foreach{x => counter +=x; println(s"counter: $counter");}  // foreach action을 실행한다.   
// counter: 1
// counter: 3
// counter: 6
// counter: 10
// counter: 15
// counter: 21
// counter: 28
// counter: 36
// counter: 45
// counter: 55

println(s"Counter value: $counter ")
// Counter value: 0
```


#### 3-2) 예제 2   

이번에는 파티션 2개를 이용하여 테스트해보자.   

TaskContext를 이용하여 task id를 같이 확인해보자.   
파티션 1개당 하나의 task를 처리하기 때문에, task는 2개가 생성된다.    

예제 1과 동일하게 `counter 변수를 copy하여 executor에서 사용하는데 copy하는 단위는 task 별로 
copy가 된다.`    
task1에서 하나의 counter가 copy되며, task2에서도 하나의 counter가 copy된다.   
`즉, task1의 counter와 task2의 counter는 서로 별개의 변수이다.`   


```scala
val rdd2 = sc.parallelize(1 to 10, 2)
rdd2.foreach{x => counter += x; println(s"task ${org.apache.spark.TaskContext.get.taskAttemptId} value ${x} counter: $counter");}
// task 1 value 1 counter: 1
// task 2 value 6 counter: 6
// task 1 value 2 counter: 3
// task 2 value 7 counter: 13
// task 1 value 3 counter: 6
// task 2 value 8 counter: 21
// task 1 value 4 counter: 10
// task 2 value 9 counter: 30
// task 1 value 5 counter: 15
// task 2 value 10 counter: 40
```

#### 3-3) 예제 3   

이번에는 task 별로 별개의 counter 변수를 copy하는 부분을 
결과로 살펴보고, action이 수행 될 때마다 새로운 task가 실행됨을 
검증해보자.   

```scala
val m = Array(1,2,3)
val data = sc.makeRDD(1 to 4, 2)
val data1 = data.map{r => println(s"map #1 m.hashCode ${m.hashCode} taskAttempId ${org.apache.spark.TaskContext.get.taskAttemptId}"); r}   
val data2 = data1.map{r => println(s"map #2 m.hashCode ${m.hashCode} taskAttempId ${org.apache.spark.TaskContext.get.taskAttemptId}"); r}

m.hashCode 

data2.count // action 실행
// map #1 m.hashCode 34667591 taskAttempId 16
// map #1 m.hashCode 1466921556 taskAttempId 15
// map #2 m.hashCode 34667591 taskAttempId 16
// map #2 m.hashCode 1466921556 taskAttempId 15
// map #1 m.hashCode 34667591 taskAttempId 16
// map #1 m.hashCode 1466921556 taskAttempId 15
// map #2 m.hashCode 34667591 taskAttempId 16
// map #2 m.hashCode 1466921556 taskAttempId 15

data2.count // action 실행 
// map #1 m.hashCode 1180070613 taskAttempId 17
// map #2 m.hashCode 1180070613 taskAttempId 17
// map #1 m.hashCode 1180070613 taskAttempId 17
// map #2 m.hashCode 1180070613 taskAttempId 17
// map #1 m.hashCode 1172463664 taskAttempId 18
// map #2 m.hashCode 1172463664 taskAttempId 18
// map #1 m.hashCode 1172463664 taskAttempId 18
// map #2 m.hashCode 1172463664 taskAttempId 18
```

위에서 결과값을 확인해보면, `task 별로 변수가 copy` 됨을 확인할 수 있다.  
파티션은 2개로 지정했기 때문에 task가 2개가 생성되었고, 각 task 별로 
같은 hashCode 임을 확인했다.      

즉, 각 task 별로 동일한 변수(m)를 사용하는 것을 확인할 수 있다.  

> 당연하게 driver 와 task 별로 다른 변수값이기 때문에 해시값이 다르다.   

또한, web ui를 통해 stage를 살펴보면 아래와 같다.   

<img width="171" alt="스크린샷 2023-02-04 오후 7 37 46" src="https://user-images.githubusercontent.com/26623547/216762494-348f5fe2-603e-4ca4-9042-b87117d637c7.png">   

위 그림과 해시 코드를 통해서 확인할 수 있는 부분은 `동일한 stage에서는 하나의 task는 파이프라인 별로 수행된다는 것이다.`     

> 해시코드를 통해 검증한것처럼, 2번의 map 함수가 하나의 task로 한번에 수행된다.   

더 자세한 설명은 [링크](https://wonyong-jang.github.io/spark/2021/04/11/Spark.html)의 Stage 부분을 참고해보자.   


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

