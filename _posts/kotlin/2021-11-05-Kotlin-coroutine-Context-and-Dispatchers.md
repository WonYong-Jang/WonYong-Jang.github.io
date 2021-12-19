---
layout: post
title: "[Kotlin] Coroutine Context and Dispatchers" 
subtitle: "Debugging coroutines and theadsi, jumping between threads / withContext"    
comments: true
categories : Kotlin
date: 2021-11-05
background: '/img/posts/mac.png'
---

이번글에서는 Coroutine Context와 Dispatcher에 대해서 상세하게 
살펴볼 예정이다.   
`먼저 Coroutine Context를 살펴보면, 코루틴은 항상 실행될 때 Coroutine Context에서 
실행된다. Coroutine Context는 요소들을 설정할 수 있는데, 그 요소들 중에 
대표적으로 Job, Dispatcher 등이 있다.`      

아래에서 조금 더 자세하게 살펴보자.   

- - - 

## Dispatchers and Theads      

먼저 Dispacher와 Thead의 관계에 대해서 살펴보자.   
코루틴은 coroutineConext에서 실행이 되게 되는데, 그 요소들 중에는 Dispatcher가 있다.   
`코루틴은 어떤 thread나 어떤 thread pool에서 실행되는지 결정해주는 요소를 Dispatcher라고 한다.`   

우리는 이전에 코루틴 빌더를 이용하여 코루틴을 실행했는데, 코루틴 빌더는 optional로 
CoroutineContext 파라미터를 가지고 있다.   

`즉, 모든 코루틴 빌더는 optional로 CoroutineContext를 파라미터로 줄 수 있기 때문에 
default로 그냥 사용해도 되고, 아래와 같이 Dispatchers.Unconfined 등으로 명시적으로  
파라미터를 넘겨 코루틴이 실행될 쓰레드를 결정할 수 있다.`         

```kotlin   
fun main() = runBlocking<Unit> {
    launch { // context of the parent, main runBlocking coroutine
        println("main runBlocking      : I'm working in thread ${Thread.currentThread().name}")
    }
    launch(Dispatchers.Unconfined) { // not confined -- will work with main thread
        println("Unconfined            : I'm working in thread ${Thread.currentThread().name}")
    }
    launch(Dispatchers.Default) { // will get dispatched to DefaultDispatcher
        println("Default               : I'm working in thread ${Thread.currentThread().name}")
    }
    newSingleThreadContext("MyOwnThread").use { // will get its own new thread
        launch(it){
            println("newSingleThreadContext: I'm working in thread ${Thread.currentThread().name}")
        }
    }
}
```

Output   

```
Unconfined            : I'm working in thread main
Default               : I'm working in thread DefaultDispatcher-worker-1
newSingleThreadContext: I'm working in thread MyOwnThread
main runBlocking      : I'm working in thread main
```   

위에서 각 4개의 코루틴에 대해 어떤 쓰레드에서 
실행되었는지 확인해보자.   

첫번째 Unconfined는 main 쓰레드에서 실행되었다.   
두번째 Default는 DefaultDispatcher-worker-1 에서 
실행되었다. 이는 이전에 GlobalScope에서 실행되었던 쓰레드와 같은 쓰레드에서 
사용된다.       
세번째 newSingleThreadContext는 비용이 높은 방식인데, 코루틴 실행할 때마다 
쓰레드를 하나씩 만드는 것이다. 해당 쓰레드를 계속해서 
만들어 내기 때문에 use를 사용하여 close를 해줘야 한다.   
네번째는 파라미터가 없이 실행했는데, 자신을 호출했던 CoroutineScope에서 
Context를 상속 받아서 작업한다. 즉, runBlocking과 같은 CoroutineContext에서 
실행된다.   

`Dispatcher는 어떤 스레드에서 실행할지 결정하는 요소이고, 이 요소는 Coroutine Context에 저장된다고 
기억하면 된다.`    

- - - 

## Debugging coroutines and theads   

코루틴을 디버깅을 하는 것은 쉽지 않다. 왜냐하면 코루틴은 비동기적으로 
실행되고 쓰레드를 
넘나들 수 있고, 하나의 쓰레드를 사용한다고 해도 어떤 순서로 실행 되는지 
확인하기가 어렵다.   

그래서 kotlinx.coroutines는 디버깅을 쉽게할 수 있도록 지원한다.   
아래 VM 옵션을 추가하기만 하면 어떤 코루틴이 실행되고 있는지 
디버깅이 가능해진다.   

```
-Dkotlinx.coroutines.debug
```

- - - 

## Jumping between threads   

이번에는 코루틴이 처음 실행되었던 쓰레드에서 다른 쓰레드로 갔다가 
다시 처음 쓰레드로 돌아오는 예제를 살펴보자.   

`여기서 중요하게 봐야할 부분은 withContext이다.`      
`withContext에 dispatcher를 넣어주면 dispatcher가 가르키는 쓰레드에서 코루틴이 
실행된다.`   
즉, 아래 코드는 처음 runBlocking에서 실행된 코루틴이 ctx1라는 쓰레드에서 
실행이 되지만 withContext(ctx2)를 만나면서 실행 코루틴이 ctx2로 바뀐다.   
그 실행이 끝나게 되면 다시 ctx1라는 쓰레드로 돌아오게 된다.   

> 코틀린 1.2부터 제공하는 use 확장함수를 사용함으로써 새로 만든 쓰레드가 끝났을 때 close를 시켜주기 때문에 
메모리 leak을 막을 수 있다.     
> use 내부 코드를 살펴보면 close를 해주고 있다.   


```kotlin
newSingleThreadContext("Ctx1").use { ctx1 ->
    newSingleThreadContext("Ctx2").use { ctx2 ->
        runBlocking(ctx1) {
            log("Started in ctx1")
            withContext(ctx2) {
                log("Working in ctx2")
            }
            log("Back to ctx1")
        }
    }
}
```

Output  

```
[Ctx1 @coroutine#1] Started in ctx1
[Ctx2 @coroutine#1] Working in ctx2
[Ctx1 @coroutine#1] Back to ctx1
```


`위 결과를 보면 같은 코루틴이 다른 쓰레드에서 jump를 하면서 실행된 것을 확인 할 수 있다.`       

- - - 

### Job in the context   

위에서 `CoroutineContext의 구성요소는 Job과 Dispatcher가 있다고 언급했는데, 
    CoroutineContext[Job]과 같은 형태로 요소를 확인할 수 있다.`   

각각의 Job의 형태를 확인해보자.   

```kotlin
fun main() = runBlocking<Unit> {

    println("My job is ${coroutineContext[Job]}")

    launch {
        println("My job is ${coroutineContext[Job]}")
    }

    async {
        println("My job is ${coroutineContext[Job]}")
    }

    isActive // 확장 프로퍼티 내부를 살펴보면 내부적으로 coroutineContext[Job]을 확인 한다. 
             // get() = coroutineContext[Job]?.isActive ?: true
}
```

Output

```
My job is "coroutine#1":BlockingCoroutine{Active}@4ee285c6 [main @coroutine#1]
My job is "coroutine#2":StandaloneCoroutine{Active}@6bf2d08e [main @coroutine#2]
My job is "coroutine#3":DeferredCoroutine{Active}@5eb5c224 [main @coroutine#3]
```

이전에 [코루틴 취소](https://wonyong-jang.github.io/kotlin/2021/11/02/Kotlin-coroutine-cancellation-timeouts.html)를 
살펴봤을 때 isActive 상태값을 이용하여 코루틴을 취소했었다.   
isActive는 확장 프로퍼티였고, 해당 코드를 다시 살펴보면 
내부적으로 coroutineContext에서 Job의 형태를 꺼내어 상태값을 
체크해준다는 것을 알 수 있다.      

```kotlin
public val CoroutineScope.isActive: Boolean
    get() = coroutineContext[Job]?.isActive ?: true
```    

- - - 

## Children of a coroutine   

`코루틴들 간에 부모 자식 관계를 가질 수 있고, 코루틴 내부에서 
새로운 코루틴이 실행되면 기본적으로 부모 자식 관계가 성립된다.`  

단, 아래 두가지 경우는 부모 자식 관계가 성립되지 않는다.   
- `GlobalScope는 어플리케이션 전체를 사용하는 scope이기 때문에 
독립적으로 실행되어 부모 자식 관계가 성립되지 않는다.`   

- `아래 예제의 job1처럼 부모와 다른 Job 객체가 새 코루틴 컨텍스트로 전달되면 상위 범위의 Job을 오버라이드 하여 
부모 자식 관계가 성립되지 않는다.`      

그럼 여기서 부모 자식 관계가 성립된다는 것은 어떤 의미일까?   

`부모 자식 관계 코루틴은 
부모 코루틴을 실행 중에 cancel을 하게되면 하위 코루틴도 같이 
종료가 된다는 의미이고, 부모 코루틴의 작업이 모두 종료가 되어도 
자식 코루틴 작업이 남아 있을 경우 기다려 주게 된다.`   


```kotlin
fun main() = runBlocking<Unit> {

    // launch a coroutine to process some kind of incoming request
    val request = launch {

        launch(Job()) {
            println("job1: I run in my own Job and execute independently!")
            delay(1000)
            println("job1: I am not affected by cancellation of the request")
        }

        GlobalScope.launch {
            println("job2: I run in GlobalScope and execute independently!")
            delay(1000)
            println("job2: I am not affected by cancellation of the request")
        }

        // and the other inherits the parent context
        launch {
            delay(100)
            println("job3: I am a child of the request coroutine")
            delay(1000)
            println("job3: I will not execute this line if my parent request is cancelled")
        }
    }
    delay(500)
    request.cancel() // cancel processing of the request
    delay(1000) // delay a second to see what happens
    println("main: Who has survived request cancellation?")

}
```  

Output   

```
job2: I run in GlobalScope and execute independently! [DefaultDispatcher-worker-1 @coroutine#4]
job1: I run in my own Job and execute independently! [main @coroutine#3]
job3: I am a child of the request coroutine [main @coroutine#5]
job1: I am not affected by cancellation of the request [main @coroutine#3]
job2: I am not affected by cancellation of the request [DefaultDispatcher-worker-1 @coroutine#4]
main: Who has survived request cancellation? [main @coroutine#1]
```

위 결과를 보면 job3 만 부모 코루틴과 부모 자식 관계가 성립하여 
실행 중에 취소가 된것을 확인할 수 있고, 
    job1, job2는 각각 독립적으로 실행되어 모두 실행된 것을 확인할 수 있다.   

- - -    

## Combining context elements   

`코루틴 빌더에 coroutine context 파라미터로 Dispatcher를 전달해주는 
예제를 많이 살펴봤는데, + 연산자를 통해서 다양한 요소를 합쳐서 
전달 할 수도 있다.`   

```kotlin
fun main() = runBlocking<Unit> {
    launch(Dispatchers.Default + CoroutineName("CustomCoroutineName")) {
        println("I'm working in thread ${Thread.currentThread().name}")
    }
}
```

Output   

```
I'm working in thread DefaultDispatcher-worker-1 @CustomCoroutineName#2 [DefaultDispatcher-worker-1 @CustomCoroutineName#2]
```

`아래와 같이 plus 연산자가 내부적으로 오버라이드 되어 있기 때문에 아래와 같이
Dispatcher와 CoroutineName을 전달하다.`


```kotlin
public operator fun plus(context: CoroutineContext): CoroutineContext =
// ...
```


- - - 

**Reference**     

<https://www.youtube.com/watch?v=YrrUCSi72E8>   
<https://kotlinlang.org/docs/composing-suspending-functions.html>   
<https://www.inflearn.com/course/%EC%83%88%EC%B0%A8%EC%9B%90-%EC%BD%94%ED%8B%80%EB%A6%B0-%EC%BD%94%EB%A3%A8%ED%8B%B4/lecture/48250?tab=curriculum>   


{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}
