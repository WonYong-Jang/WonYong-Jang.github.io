---
layout: post
title: "[Spark] Broadcast, Accumulator 공유변수"   
subtitle: "braodcast, accumulator, closure"    
comments: true
categories : Spark
date: 2021-07-08
background: '/img/posts/mac.png'
---

## 1. Broadcast      

task 별로 각자 가져가야 할 변수를 하나의 변수(broadcast)로 공유할 수 있도록 제공하며, 
     broadcast는 모든 노드에 큰 입력 데이터 셋을 제공할 때 좋은 방법이다.    

`driver에서 생성한 변수를 executor에서 참조할 경우에는 
각 task 별로 copy되어 보내지게 된다.`       

더 자세한 내용은 [이전글](https://wonyong-jang.github.io/spark/2021/06/15/Spark-Serialization.html)을 
참고하자.   

따라서, task 별로 copy되기 때문에, task 갯수가 많거나 copy 대상 사이즈가 큰 경우 
네트워크 및 메모리 오버헤드가 발생하여 성능에 영향을 줄 수 있다.    

`결과적으로 Broadcast는 driver의 변수 값을 각 executor별로 한번만 copy를 해놓고 
task 별로 공유해서 사용할 수 있도록 제공한다.`   

```scala
val broadcastVar = sc.broadcast(Array(1,2,3)) // broadcast 생성   
broadcastVar.value // broadcast에 들어있는 값 사용  
```

<img width="923" alt="스크린샷 2023-01-26 오전 12 00 37" src="https://user-images.githubusercontent.com/26623547/214597678-2f1378c0-3561-4ebd-8bef-129df7076f17.png">   

위 그림은 broadcast 변수값 m을 정의 했고, 
각 task에서 공유해서 참조할 수 있도록 executor당 1개만 copy하여 전달하였다.   
broadcast를 사용하지 않았을 경우, task 마다 m값을 copy해와서 사용해야 하기 때문에 
네트워크 비용 및 메모리를 더 차지하게 될 것이다.    

`또한, 스파크 연산에 쓸 읽기 전용인 값을 직렬화 한 후 모든 작업 노드에 효과적으로 전송하는데 사용한다.`    
`읽기 전용이기 때문에 Immutable한 객체 타입을 브로드 캐스트 하는 것이 안전하다.`     
`드라이버 코드 밖에서 브로드캐스트 변수의 값을 수정할 수 없으며 driver에서 
executor로 단방향 전송된다. 즉, 드라이버로 역전파 할 수 없다.`    


- - - 

## 2. Accumulator   

`Accumulator는 병렬환경에서 효율적으로 집계 연산을 수행하기 위해 제공 되며, 
    원래는 task에서 누적한 데이터를 driver에서 참조하지 못하지만 참조할 수 있도록 제공해 준다.`       
스파크에서는 숫자 타입의 accumulator를 기본 제공하며 프로그래머는 
새로운 타입을 지원하는 accumulator를 작성할 수 있다.   
숫자 형식의 accumulator는 longAccumulator() 또는 doubleAccumulator()를 
메소드를 통해 생성할 수 있다.   

```scala
val accum = sc.longAccumulator("My Accumulator")    // 이름을 통해 여러개의 accumulator도 생성 가능
sc.parallelize(Array(1,2,3,4)).repartition(10).foreach(x => accum.add(x)) // 각 task 별로 누적 진행 
accum.value  // driver에서 전체 누적 값을 확인 가능   
```

위 코드를 3번 실행한 결과는 아래 그림과 같다.   
각 task에서 누적한 결과를 My Accumulator 값이 가지고 있는 것을 확인할 수 있다.  

<img width="850" alt="스크린샷 2023-01-26 오전 12 33 12" src="https://user-images.githubusercontent.com/26623547/214605609-d7c41b37-f0ef-45bb-b4a7-d21dcb330fda.png">    


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

