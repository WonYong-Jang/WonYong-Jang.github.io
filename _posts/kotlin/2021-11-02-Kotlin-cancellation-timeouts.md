---
layout: post
title: "[Kotlin] 코루틴(coroutine) Cancellation and Timeouts" 
subtitle: "코루틴 취소와 타임아웃 / isActive 상태값 / JobCancellationException"    
comments: true
categories : Kotlin
date: 2021-11-02
background: '/img/posts/mac.png'
---

[이전글](https://wonyong-jang.github.io/kotlin/2021/11/01/Kotlin-coroutine3.html)에서는 
코루틴을 제어하기 위한 여러가지 방법을 살펴봤다.   
그 중에서 코루틴을 취소하기 위한 방법으로 job.cancel()을 이용하였는데, 
    이에 대해 자세히 살펴보자.   

이번글에서는 실행 중인 코루틴을 취소하는 여러가지 방법에 대해서 
살펴볼 예정이다.   
실행중인 코루틴을 정교하게 취소해 주는 것이 중요한 
이유는 메모리와 리소스를 차지하기 때문에 이를 잘 이해하지 못한다면, 
    메모리 leak이 발생할 수도 있다.   

- - - 

## 1. 코루틴 취소   

아래 코드는 1000번을 반복하고, 0.5초를 딜레이하며 프린트 하는 소스코드이다.   
하지만 실행 중 1.3초가 지난 후에 코루틴을 취소하기 위해 job.cancel()을 
추가 했다.   

```kotlin
fun main() = runBlocking  {

    val job = launch {
        repeat(1000) { i ->
            println("job: I'm sleeping $i ...")
            delay(500L)
        }
    }

    delay(1300L)
    println("main: I'm tired of waiting!")
    job.cancel()
    job.join()
    println("main: Now I can quit.")
}
```   

Output  

```
job: I'm sleeping 0 ... [main @coroutine#2]
job: I'm sleeping 1 ... [main @coroutine#2]
job: I'm sleeping 2 ... [main @coroutine#2]
main: I'm tired of waiting! [main @coroutine#1]
main: Now I can quit. [main @coroutine#1]
```   

위의 결과를 보면 job.cancel()을 이용하여 취소가 되는 것을 확인 할 수 있다.   

#### 1-1) Cancellation is cooperative   

위의 예제와는 다르게 코루틴을 취소해도 계속 동작하는 예제이다.   

```kotlin
fun main() = runBlocking  {

    val startTime = System.currentTimeMillis()
    val job = launch(Dispatchers.Default) {
        var nextPrintTime = startTime
        var i = 0
        while (i < 5) {
            if(System.currentTimeMillis() >= nextPrintTime) {
                println("job: I'm sleeping ${i++} ... ")
                nextPrintTime += 500L
            }
        }
    }

    delay(1300L)
    println("main: I'm tired of waiting!")
    job.cancelAndJoin() // cancels the job and waits for its completion
    println("main: Now I can quit.")
}
```

Output   

```
job: I'm sleeping 0 ...  [DefaultDispatcher-worker-1 @coroutine#2]
job: I'm sleeping 1 ...  [DefaultDispatcher-worker-1 @coroutine#2]
job: I'm sleeping 2 ...  [DefaultDispatcher-worker-1 @coroutine#2]
main: I'm tired of waiting! [main @coroutine#1]
job: I'm sleeping 3 ...  [DefaultDispatcher-worker-1 @coroutine#2]
job: I'm sleeping 4 ...  [DefaultDispatcher-worker-1 @coroutine#2]
main: Now I can quit. [main @coroutine#1]
```

위의 결과를 보면 1.3초가 지난 후에도 코루틴이 취소되지 않고 
실행되는 것을 확인 할 수 있다.

`코루틴이 취소되려면 코루틴 코드 자체에서 협조적이여야 한다.`    
`첫번째 예제에서 다른 점은 suspend 함수가 불리지 않았다는 것이다.`   

이번 예제에서 `suspend 함수인 delay 함수를 중간에 끼워 넣어보면 
정상적으로 취소` 되는 것을 확인 할 수 있다.   
또는 `yield() 함수를 중간에 끼워 넣어도 잘 취소된다.`   

```kotlin
while (i < 5) {
    if(System.currentTimeMillis() >= nextPrintTime) {
            //delay(500L)
            yield()
            println("job: I'm sleeping ${i++} ... ")
            nextPrintTime += 500L
         }
    }
```

`코루틴을 취소하라는 명령을 하게 되면, 코루틴이 suspend 되고 
resume이 되는 시점에 exception을 던지면서 중지를 하게 된다.`   

아래와 같이 try~catch로 exception을 잡아보면 cancellation exception을 
확인 할 수 있다.   

```kotlin
fun main() = runBlocking  {

    val startTime = System.currentTimeMillis()
    val job = launch(Dispatchers.Default) {
        try {
            var nextPrintTime = startTime
            var i = 0
            while (i < 5) {
                if(System.currentTimeMillis() >= nextPrintTime) {
                    //delay(500L)
                    yield()
                    println("job: I'm sleeping ${i++} ... ")
                    nextPrintTime += 500L
                }
            }
        } catch (e: Exception) {
            kotlin.io.println("Exception $e")
        }
    }

    delay(1300L)
    println("main: I'm tired of waiting!")
    job.cancelAndJoin() // cancels the job and waits for its completion
    println("main: Now I can quit.")
}

// Exception kotlinx.coroutines.JobCancellationException: StandaloneCoroutine was cancelled; job="coroutine#2":StandaloneCoroutine{Cancelling}@29bbc08f
```      

`또한, 코루틴에서 네트워크나 파일을 쓰다가 종료하게 될 때는 해당 리소스를 
닫아주고 종료해야 되는데 그 위치는 아래와 같다.`   

```kotlin
fun main() = runBlocking  {

    val job = launch {
        try {
            repeat(1000) { i ->
                println("job: I'm sleeping $i ...")
                delay(500L)
            }
        } finally {
            println("job: I'm running finally")
        }
    }

    delay(1300L)
    println("main: I'm tired of waiting!")
    job.cancelAndJoin() // cancels the job and waits for its completion
    println("main: Now I can quit.")
}
```  

Output  

```
job: I'm sleeping 0 ... [main @coroutine#2]
job: I'm sleeping 1 ... [main @coroutine#2]
job: I'm sleeping 2 ... [main @coroutine#2]
main: I'm tired of waiting! [main @coroutine#1]
job: I'm running finally [main @coroutine#2]
main: Now I can quit. [main @coroutine#1]
```

위와 같이 finally 블록에서 리소스를 해제해주면 된다.   

마지막으로 드문 경우이긴 하지만, 코루틴을 중간에 종료 시킨 후에 
다시 코루틴을 실행해야 하는 경우는 아래 처럼 가능하다.   
withContext에 NonCancellable 코루틴 컨텍스트를 넘겨서 진행한다.  

```kotlin
fun main() = runBlocking  {

    val job = launch {
        try {
            repeat(1000) { i ->
                println("job: I'm sleeping $i ...")
                delay(500L)
            }
        } finally {
            withContext(NonCancellable) {
                println("job: I'm running finally")
                delay(500L)
                println("restart")
            }

        }
    }

    delay(1300L)
    println("main: I'm tired of waiting!")
    job.cancelAndJoin() // cancels the job and waits for its completion
    println("main: Now I can quit.")
}
```

Output

```
job: I'm sleeping 0 ... [main @coroutine#2]
job: I'm sleeping 1 ... [main @coroutine#2]
job: I'm sleeping 2 ... [main @coroutine#2]
main: I'm tired of waiting! [main @coroutine#1]
job: I'm running finally [main @coroutine#2]
restart [main @coroutine#2]
main: Now I can quit. [main @coroutine#1]
```

#### 1-2) Making computation code cancellable   

위에서 코루틴을 중간에 취소하기 위해서는 suspend 함수를 주기적으로 
실행해야만 suspend 이후 resume하기 직전에 exception을 던져 취소 할 수 있었다.   
이 방법 외에 `코루틴을 취소할 수있는 두번째 방법은 isActive 상태값을 이용하는 방식이다.`   

`isActive는 아래와 같이 코루틴 job의 상태를 확인 하는 확장 프로퍼티이다.`      

```kotlin
public val CoroutineScope.isActive: Boolean
    get() = coroutineContext[Job]?.isActive ?: true
```

```kotlin
fun main() = runBlocking  {

    val startTime = System.currentTimeMillis()
    val job = launch(Dispatchers.Default) {
        try {
            var nextPrintTime = startTime
            var i = 0
            kotlin.io.println("isActive $isActive")
            while (isActive) {
                if(System.currentTimeMillis() >= nextPrintTime) {
                    println("job: I'm sleeping ${i++} ... ")
                    nextPrintTime += 500L
                }
            }
            kotlin.io.println("isActive $isActive")
        } catch (e: Exception) {
            kotlin.io.println("Exception $e")
        }
    }

    delay(1300L)
    println("main: I'm tired of waiting!")
    job.cancelAndJoin() // cancels the job and waits for its completion
    println("main: Now I can quit.")
}
```

Output   

```
isActive true
job: I'm sleeping 0 ...  [DefaultDispatcher-worker-1 @coroutine#2]
job: I'm sleeping 1 ...  [DefaultDispatcher-worker-1 @coroutine#2]
job: I'm sleeping 2 ...  [DefaultDispatcher-worker-1 @coroutine#2]
main: I'm tired of waiting! [main @coroutine#1]
isActive false
main: Now I can quit. [main @coroutine#1]
```

`위의 결과를 살펴보면, while 들어가기 전에 isActive는 true였고, cancel 이후에는 
false로 변경되어 중간에 코루틴을 취소가 가능해졌다.`   

이 방법은 exception을 던지지 않고 상태값을 이용하여 코루틴을 중지시킬 수 있도록 
제공해준다.   

#### 1-3) Timeout   

이전 예제에서는 코루틴 스스로가 내부에서 cancel을 확인하는 방법 2가지를 확인했다.   
suspend 함수를 주기적으로 호출하거나,  
        상태값(isActive)으로 확인하는 방법이 있었다.   

`그 외에도 Timeout으로 코루틴을 취소가 가능하다. 코루틴을 실행할 때 
미리 timeout을 지정해서 취소할 수 있다.`   

```kotlin
fun main() = runBlocking  {

    withTimeout(1300L) {
        repeat(1000) { i ->
            println("job: I'm sleeping $i ... ")
            delay(500L)
        }
    }
}
```

Output

```
job: I'm sleeping 0 ...  [main @coroutine#1]
job: I'm sleeping 1 ...  [main @coroutine#1]
job: I'm sleeping 2 ...  [main @coroutine#1]
Exception in thread "main" kotlinx.coroutines.TimeoutCancellationException: Timed out waiting for 1300 ms
	(Coroutine boundary)
	at MainKt$main$1$1.invokeSuspend(main.kt:8)
	at MainKt$main$1.invokeSuspend(main.kt:5)
Caused by: kotlinx.coroutines.TimeoutCancellationException: Timed out waiting for 1300 ms
	at kotlinx.coroutines.TimeoutKt.TimeoutCancellationException(Timeout.kt:186)
	at kotlinx.coroutines.TimeoutCoroutine.run(Timeout.kt:156)
	at kotlinx.coroutines.EventLoopImplBase$DelayedRunnableTask.run(EventLoop.common.kt:497)
	at kotlinx.coroutines.EventLoopImplBase.processNextEvent(EventLoop.common.kt:274)
	at kotlinx.coroutines.DefaultExecutor.run(DefaultExecutor.kt:69)
	at java.lang.Thread.run(Thread.java:748)
```

위의 결과를 확인해보면, 정해진 시간이 경과되서도 코루틴이 종료되지 
않으면, exception을 발생시키면서 종료된다.   
예외를 발생시키지 않고 null을 리턴해주는 방법도 있는데, 아래와 같다.     

```kotlin
fun main() = runBlocking  {

    val result = withTimeoutOrNull(1300L) {
        repeat(1000) { i ->
            println("job: I'm sleeping $i ... ")
            delay(500L)
        }
    }
    println("Result is: $result")
}
```

- - -    

## 정리 

이번글을 정리해보면, 코루틴을 launch 했을 때 Job 객체를 반환하고, 
    해당 Job을 이용하여 코루틴 실행 중에 취소 할 수 있었다.   
중요한 점은, 취소한다고 해서 코루틴이 종료되는 것은 아니다.   
코루틴 코드 자체에서 협조적이여야 하며, 첫번째 방법은 
suspend 함수를 주기적으로 호출해서 resume 될때 exception을 발생시켜서 종료 
할 수 있다.   

두번째 방법은 isActive 상태값을 확인해서 취소가 가능하다.   

세번째는 Timeout을 이용하여 코루틴을 실행시키면 정해둔 시간이 경과되면 
종료된다.   


- - - 

**Reference**     

<https://kotlinlang.org/docs/cancellation-and-timeouts.html>    
<https://www.inflearn.com/course/%EC%83%88%EC%B0%A8%EC%9B%90-%EC%BD%94%ED%8B%80%EB%A6%B0-%EC%BD%94%EB%A3%A8%ED%8B%B4/lecture/48249?tab=curriculum>   

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}
