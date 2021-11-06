---
layout: post
title: "[Kotlin] 코루틴(coroutine) 제어" 
subtitle: "코루틴 제어(launch, async, Job, Deferred)"    
comments: true
categories : Kotlin
date: 2021-11-01
background: '/img/posts/mac.png'
---

[이전글](https://wonyong-jang.github.io/kotlin/2021/10/31/Kotlin-coroutine2.html)에서 
코루틴을 사용하기 위한 기초 개념을 알아봤다.   

이 글에서는 코루틴 블록 내에서 어떤 작업을 어떻게 처리하고 
어떠한 결과로 반환 할 것인가 하는 제어에 다룰 예정이다.   

- - - 

## 1. 코루틴 제어   

코루틴 제어를 위한 주요 키워드는 아래와 같다.   

- launch, async   
- Job, Deferred   
- runBlocking   

### 1-1) launch() - Job   

`launch() 함수로 시작된 코루틴 블록은 Job 객체를 반환한다.`       

```kotlin
val job : Job = launch {
    ...
}
```

반환 받은 Job 객체로 코루틴 블록을 취소하거나, 다음 작업의 수행전 
코루틴 블록이 완료되기를 기다릴 수 있다.   

```kotlin
val job = launch {
   var i = 0
   while (i < 10) {
     delay(500)
     i++
   }
}

job.join() // 완료 대기
job.cancel() // 취소
```

여러개의 launch 코루틴 블록을 실행할 경우 각각의 Job객체에 대해서 
join() 함수로 코루틴 블록이 완료 될때까지 다음 코드 수행을 대기할수 있다.   

```kotlin
val job1 : Job = launch {
    var i = 0
    while (i < 10) {
        delay(500)
        i++
    }
}

val job2 = launch {
    var i = 0
    while (i < 10) {
       delay(1000)
       i++
    }
}

job1.join()
job2.join()
```

모든 Job 객체에 대해서 일일히 join 함수를 호출하지 않고 joinAll() 함수를 
이용하여 모든 launch 코루틴 블록이 완료되기를 기다릴 수도 있다.   

```kotlin
joinAll(job1, job2)
```

또는 다음의 예시와 같이 첫번째 launch 코루틴 블록에서 반환받은 
Job 객체를 두번째 launch() 함수의 인자로 사용하면, 동일한 Job 객체로 
두개의 코루틴 블록을 모두 제어 할 수 있다.   

```kotlin
val job1 = launch {
    var i = 0
    while (i < 10) {
        delay(500)
        i++
    }
}

// 위 블록 과 같은 job1 객체를 사용
launch(job1) {
    var i = 0
    while (i < 10) {
        delay(1000)
        i++
    }
}

// 같은 job 객체를 사용하게 되면
// joinAll(job1, job2) 와 같다
job1.join()
```

`launch() 함수로 정의된 코루틴 블록은 즉시 수행되며, 반환 받은 Job 객체는 
해당 블록을 제어는 할수 있지만 코루틴 블록의 결과를 반환하지는 않는다.`   

`코루틴 블록의 결과 값을 반환받고 싶다면 async() 코루틴 블록을 생성한다.`   

### 1-2) async() - Deferred    

`async()함수로 시작된 코루틴 블록은 Deferred 객체를 반환한다.`        

```kotlin
val deferred : Deferred<T> = async {
    ...
    T // 결과값
}
```   

이렇게 시작된 코루틴 블록은 Deferred 객체를 이용해 제어가 가능하며 
동시에 코루틴 블록에서 계산된 결과값을 반환 받을수 있다.   

또한 여러개의 async 코루틴 블록을 실행할 경우 각각의 Deferred 객체에 
대해서 await() 함수로 코루틴 블록이 완료 될때까지 다음 코드 수행을 
대기할수 있다. await() 함수는 코루틴 블록이 완료되면 결과를 반환한다.   

```kotlin
val deferred1 = async {
    var i = 0
    while (i < 10) {
        delay(500)
        i++
    }

    "result1"
}

val deferred2 = async {
    var i = 0
    while (i < 10) {
        delay(1000)
        i++
    }

    "result2"
}

val result1 = deferred1.await()
val result2 = deferred2.await()
        
println("$result1 , $result2") // result1 , result 2 출력
```   

각각의 Deferred 객체에 대해서 await() 함수를 호출하지 않고 awaitAll() 함수를 
이용하여 모든 async 코루틴 블록이 완료되기를 기다릴수도 있다.   

```kotlin
awaitAll(deferred1, deferred2)
```   

- - - 

**Reference**     

<https://medium.com/@limgyumin/%EC%BD%94%ED%8B%80%EB%A6%B0-%EC%BD%94%EB%A3%A8%ED%8B%B4-%EC%A0%9C%EC%96%B4-5132380dad7f>     

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}
