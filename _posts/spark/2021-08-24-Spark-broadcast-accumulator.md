---
layout: post
title: "[Spark] Broadcast, Accumulator 공유변수"   
subtitle: "braodcast, accumulator, closure"    
comments: true
categories : Spark
date: 2021-07-08
background: '/img/posts/mac.png'
---

## Broadcast      

스파크는 브로드캐스트 변수를 제공하는 효율적인 알고리즘을 제공하며 
모든 노드에 큰 입력 데이터 셋을 제공할 때 좋은 방법이다.       

`스파크 연산에 쓸 읽기 전용인 값을 직렬화 한 후 모든 작업 노드에 효과적으로 전송하는데 사용한다.`    
`읽기 전용이기 때문에 Immutable한 객체 타입을 브로드 캐스트 하는 것이 안전하다.`     
`드라이버 코드 밖에서 브로드캐스트 변수의 값을 수정할 수 없으며 드라이버에서 
태스크로 단방향 전송된다. 즉, 드라이버로 
역전파 할 수 없다.`    

브로드캐스트 변수는 broadcast() 메소드를 호출하여 생성할 수 있으며 
value 메소드를 통해 값을 이용할 수 있다.   



스파크가 클로저에서 쓰이던 모든 변수들을 작업 노드에 자동으로 보내던 것을 생각해보자.    


- 편리하지만 작은 작업사이즈에 최적화 되어 있다.   
- 병렬 작업에서 동일 변수를 사용할 수도 있으므로 효과적이지 못하다.   

##### 클로저(Closure)란?   

위에서 언급한 클로저란 
RDD operations 실행하기 위해 각 executor에 visible한 variables or methods를 의미한다.   

Job Execution Flow on Spark는 아래와 같다.   

- Spark는 RDD operations 처리를 tasks로 나눈다.   
- RDD operation 실행 전에 task의 closure를 계산한다.   
- closure는 serialized 되고 각 executor에 보내진다.    
- executor는 각 task를 주어진 task closure를 이용하여 실행한다. (각 executor에 보내진 closure내의 변수들은 copy를 하고 수행된다.)   


클로저라는 개념을 조금 더 이해하기 위해 local 모드와 cluster 모드에서 
클로저를 비교해보자.    

아래 예제는 local mode와 cluster mode에서 각각 다른 결과값을 출력한다.   

```scala 
var counter = 0 
var rdd = sc.parallelize(data) 

// Wrong: Don't do this!! 
rdd.foreach(x => counter += x) 

println("Counter value: " + counter)
```

- In cluster mode   

`각 executor에서 실행하는 foreach 함수에서 참조하는 counter는 driver node에서 
보낸 closure내의 변수(counter)를 copy한 값이다.`         
driver node의 memory에 상주하는 counter는 executor에 visible하지 않고, 
각 executor는 직렬화된 closure의 copy된 변수만을 볼 수 있다.   
그렇기 때문에 driver node의 counter 변수의 최종 값은 0으로 남게 된다.   



- In local mode

`executor는 driver node와 동일한 JVM에서 실행되며, foreach 함수를 실행 시 
original counter를 참조하고 counter 값을 업데이트한다.`       

위와 같이 분산 환경에서 global aggregation이 필요한 시나리조에서는 accumulator를 
사용해야 한다.    
accumulator는 cluster의 worker nodes에서 실행 시 변수를 안전하게 
업데이트하는 mechanism을 제공한다.    


또한, 바이트 사이즈가 큰 값들을 브로드캐스팅할 때 값을 Serialization하거나 
Serialization 된 값을 네트워크로 보내는 시간이 오래걸린다면 
병목현상이 발생한다.   
즉, 빠르고 작은 단위의 데이터 직렬화 포맷을 선택해야 한다.   
`기본적으로 쓰는 Java Serialization 보다는 Kyro Serialization을 사용하자.`        



## Accumulator   


`Accumulator는 병렬환경에서 효율적으로 집계 연산을 수행하기 위해 제공된다.`   
스파크에서는 숫자 타입의 accumulator를 기본 제공하며 프로그래머는 
새로운 타입을 지원하는 accumulator를 작성할 수 있다.   
숫자 형식의 accumulator는 longAccumulator() 또는 doubleAccumulator()를 
메소드를 통해 생성할 수 있다.   


`또한, 프로그래머가 직접 accumulator를 작성할 수도 있는데 이럴 경우 accumulatorV2를 
상속받아 구현하면 된다.`    
accumulatorV2는 추상클래스이며 여러개의 메서드를 가지고 있다. 대표적으로 reset과 
add인데 reset에는 초기화시 동작을 add에는 추가시 동작을 작성하면 된다.    

```scala 
class MyAccumulator extends AccumulatorV2[Long, Long] { 
    private var sum : Long = 0 
    override def reset(): Unit = sum = 0 
    override def add(v: Long): Unit = sum += v 
}
```

accumulatorV2를 구현한 사용자의 accumulator는 스파크에서 호출시 
한번씩만 동작하도록 보장한다. 커스텀 accumulator는 아래와 같이 
등록해서 사용하면 된다.    

```scala 
sc.register(new MyAccumulator, "My Accumulator")
```



- - - 

**Reference**    

<http://spark.apache.org/docs/latest/programming-guide.html#parallelized-collections>   
<https://jjaesang.github.io/spark/2017/04/12/spark_ch6.html>    


{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

