---
layout: post
title: "[Kotlin] 코루틴(coroutine) suspend 함수 구성하기" 
subtitle: "suspend 함수 작성하는 best practice / structed concurrency "    
comments: true
categories : Kotlin
date: 2021-11-03
background: '/img/posts/mac.png'
---

[이전글](https://wonyong-jang.github.io/kotlin/2021/11/02/Kotlin-coroutine-cancellation-timeouts.html)에서는 
코루틴을 취소할 수 있는 여러가지 방법에 대해서 살펴봤다.   

이번글에서는 suspend function을 어떻게 조합해서 코루틴을 유용하게 
작성할 수 있는지에 대해서 살펴보자.   

- - - 

## 1. Sequential by default    

첫번째 예제는 suspend 함수 두개가 있고, 어떻게 실행되는지 살펴보자.   
이 두개의 suspend 함수는 순차적으로 실행된다.   


```kotlin
fun main() = runBlocking  {
    val time = measureTimeMillis {
        val one = doSomethingUsefulOne()
        val two = doSomethingUsefulTwo()
        println("The answer is ${one + two}")
    }
    println("Completed in $time ms")
}

suspend fun doSomethingUsefulOne(): Int {
    println("start doSomethingUsefulOne")
    delay(1000L) // pretend we are doing something useful here
    return 13
}

suspend fun doSomethingUsefulTwo(): Int {
    println("start doSomethingUsefulTwo")
    delay(1000L) // pretend we are doing something useful here, too
    return 29
}
```   

Output  

```
start doSomethingUsefulOne [main @coroutine#1]
start doSomethingUsefulTwo [main @coroutine#1]
The answer is 42 [main @coroutine#1]
Completed in 2011 ms [main @coroutine#1]
```   

결과를 보면, 2초가 걸렸고, 두개의 suspend 함수가 순차적으로 실행된 것을 
확인 할 수 있다.   
`이처럼 코루틴을 이용하면, 비동기 실행을 순차적인 코드로 작성할 수 있다. 이전처럼 비동기 실행을 순차적으로 
실행시키기 위해서 콜백 함수를 이용하지 않아도 된다.`    

`즉, 이전의 복잡한 콜백 헬 소스코드를 사용하지 않아도 되며, 비동기 처리 이기 때문에 
해당 쓰레드를 block 시키지 않는다.`    

- - - 

## 2. Concurrent using async   

첫 번째 예제에서 2개의 suspend 함수 각각 1초가 걸렸고, 2개의 함수가 
dependency가 없는 독립된 연산이라면, 더 빠르게 실행 할 수 있다.   

이런 경우 2개의 함수를 동시에 실행 시킬 수 있는데, 아래와 같다.   

```kotlin
fun main() = runBlocking  {
    val time = measureTimeMillis {
        val one = async { doSomethingUsefulOne() }
        val two = async { doSomethingUsefulTwo() }
        
        println("The answer is ${one.await() + two.await()}")
    }
    println("Completed in $time ms")
}
// Output : 1초    
```   

위처럼 async를 이용하여 각 suspend 함수를 감싸서 동시에 실행 시킬 수 있다.   
launch를 이용하여 감싸도 되며, 두 키워드의 차이점은 [링크](https://wonyong-jang.github.io/kotlin/2021/11/01/Kotlin-coroutine-launch-asynch-job-deferred.html)를 
참조하자.    
`즉, 동시에 실행 시키기 위해서는 async 또는 launch를 이용하여 명시적으로 
콜을 해야 한다.`    

결과를 확인해보면 1초가 걸리는 것을 확인 할 수 있으며, 
    아래 코드와 차이점을 이해할 수 있어야 한다.   
아래 코드는 one 함수가 1초를 실행시키고 기다렸다가 two 함수를 
실행시키기 때문에 2초가 걸리게 된다.    


```kotlin
fun main() = runBlocking  {
    val time = measureTimeMillis {
        val one = async { doSomethingUsefulOne() }
        val oneResult = one.await()
        val two = async { doSomethingUsefulTwo() }
        val twoResult = two.await()

        println("The answer is ${oneResult + twoResult}")
    }
    println("Completed in $time ms")
}
// Output : 2초   
```

- - - 

## 3. Lazily started async   

이번에는 async로 실행한 코루틴 빌더를 아래와 같이 실행을 늦출 수도 있다.   

```kotlin
fun main() = runBlocking  {
    val time = measureTimeMillis {
        val one = async(start = CoroutineStart.LAZY) { doSomethingUsefulOne() }
        val two = async(start = CoroutineStart.LAZY) { doSomethingUsefulTwo() }
        // some computation
        one.start() // start the first one
        two.start() // start the second one
        println("The answer is ${one.await() + two.await()}")
    }
    println("Completed in $time ms")
}
// Output : 1초   
```

위에서 실행을 늦춘 async 블록을 start()를 이용하여 동시에 
실행했고, 결과는 동일하게 1초가 걸린다.   
하지만, start()를 주석처리하여 결과를 다시 확인해보면 2초가 걸리는데 
왜 그럴까?   

```kotlin
fun main() = runBlocking  {
    val time = measureTimeMillis {
        val one = async(start = CoroutineStart.LAZY) { doSomethingUsefulOne() }
        val two = async(start = CoroutineStart.LAZY) { doSomethingUsefulTwo() }
        // some computation
        // one.start() // start the first one
        //two.start() // start the second one
        println("The answer is ${one.await() + two.await()}")
    }
    println("Completed in $time ms")
}
// Output : 2초    
```

async 코루틴을 2개 만들었지만, 실행을 하지 않았고 start() 를 
주석처리 했기 때문에 첫번째 코루틴이 one.await()를 만났을 때 
1초동안 실행하고 그 후 two.await()를 순차적으로 실행하기 때문에 
2초가 걸린다.    

- - - 

## 4. Async-style functions     

이번 예제에서는 코루틴을 잘못 사용한 예제이며, 그에 따라 
발생할 수 있는 문제에 대해서 살펴보자.   

위 예제에서 async 블록 자체를 함수로 만들어서, 다른곳에서도 
사용할 수 있도록 만들었다.    
또한, suspend 함수가 아닌 일반함수로 만들어서 
어디서나 사용할 수 있도록 만들었다.   

`여기서 주의할 점은 GlobalScope.async 를 이용했다는 점이고, 
    코루틴 scope 또는 suspend 함수 내에서만 사용하는게 아니라 
    일반함수로 만들었기 때문에 Exception이 발생했을 때 치명적인 문제가 발생할 수 있다.`   

```kotlin
// note that we don't have `runBlocking` to the right of `main` in this example
fun main() {
    try {
        val time = measureTimeMillis {
            // we can initiate async actions outside of a coroutine
            val one = doSomethingUsefulOneAsync()
            val two = doSomethingUsefulTwoAsync()
            // but waiting for a result must involve either suspending or blocking.
            // here we use `runBlocking { ... }` to block the main thread while waiting for the result
            runBlocking {
                println("The answer is ${one.await() + two.await()}")
            }
        }
        println("Completed in $time ms")
    } catch (e: Exception) { }
}

fun doSomethingUsefulOneAsync() = GlobalScope.async {
    println("start doSomethingUsefulOne")
    val res = doSomethingUsefulOne()
    println("end doSomethingUsefulOne")
    res
}

fun doSomethingUsefulTwoAsync() = GlobalScope.async {
    println("start doSomethingUsefulTwo")
    val res = doSomethingUsefulTwo()
    println("end doSomethingUsefulTwo")
    res
}

suspend fun doSomethingUsefulOne(): Int {
    delay(1000L) // pretend we are doing something useful here
    return 13
}

suspend fun doSomethingUsefulTwo(): Int {
    delay(1000L) // pretend we are doing something useful here, too
    return 29
}
```   

Output

```
start doSomethingUsefulTwo [DefaultDispatcher-worker-2 @coroutine#2]
start doSomethingUsefulOne [DefaultDispatcher-worker-1 @coroutine#1]
end doSomethingUsefulTwo [DefaultDispatcher-worker-1 @coroutine#2]
end doSomethingUsefulOne [DefaultDispatcher-worker-3 @coroutine#1]
The answer is 42 [main @coroutine#3]
Completed in 1134 ms [main] 
```    

위의 결과는 정상적인 것처럼 보이지만, 중간에 exception을 발생시켜서 
모든 코루틴이 종료가 되는지 확인해보자.   

```kotlin
fun main() {
    try {
        val time = measureTimeMillis {
            // we can initiate async actions outside of a coroutine
            val one = doSomethingUsefulOneAsync()
            val two = doSomethingUsefulTwoAsync()

            println("Exception")
            throw Exception("my Exception") 

            // but waiting for a result must involve either suspending or blocking.
            // here we use `runBlocking { ... }` to block the main thread while waiting for the result
            runBlocking {
                println("The answer is ${one.await() + two.await()}")
            }
        }
        println("Completed in $time ms")
    } catch (e: Exception) { }

    runBlocking {
        delay(10000L)
    }
}
```

`실행 결과를 살펴보면, Exception이 발생했음에도 모든 코루틴이 
실행이 되는 것을 확인 할 수 있다.`    
그 이유는 GlobalScope로 실행했기 때문에, 어플리케이션 전역 scope가 적용되어 
exception이 전파되지 않는다.   

`공식문서에서는 위의 구조를 절때 권장하지 않으며, structed concurrency를 
이용하라고 권장한다.`   

아래에서 살펴보자.   

- - - 

## 5. Structed concurrency with async    

위의 잘못된 예제의 솔루션은 아래와 같다.   
concurrentSum()은 coroutineScope로 감싸서 suspend 함수로 만들었다.  
`scope 안에서 exception이 발생하게 되면, scope안의 모든 코루틴에 
exception이 전파되어 예외 핸들링이 가능해진다.`   


```kotlin
fun main() = runBlocking {
    val time = measureTimeMillis {
        println("The answer is ${concurrentSum()}")
    }
    println("Completed in $time ms")
}

suspend fun concurrentSum(): Int = coroutineScope {
    val one = async { doSomethingUsefulOne() }
    val two = async { doSomethingUsefulTwo() }
    one.await() + two.await()
}

suspend fun doSomethingUsefulOne(): Int {
    delay(1000L) // pretend we are doing something useful here
    return 13
}

suspend fun doSomethingUsefulTwo(): Int {
    delay(1000L) // pretend we are doing something useful here, too
    return 29
}
```

그럼 예외처리를 어떻게 핸들링 할 수 있는지 살펴보자.   


```kotlin
fun main() = runBlocking {
    try {
        val time = measureTimeMillis {
            println("The answer is ${concurrentSum()}")
        }
        println("Completed in $time ms")
    } catch (e: Exception) { }

    runBlocking {
        delay(10000)
    }
}

suspend fun concurrentSum(): Int = coroutineScope {

    val one = async { doSomethingUsefulOne() }
    val two = async { doSomethingUsefulTwo() }

    delay(10)
    println("Exception")
    throw Exception("my exception")

    one.await() + two.await()
}

suspend fun doSomethingUsefulOne(): Int {
    println("start doSomethingUsefulOne")
    delay(3000L) // pretend we are doing something useful here
    println("end doSomethingUsefulOne")
    return 13
}

suspend fun doSomethingUsefulTwo(): Int {
    println("start doSomethingUsefulTwo")
    delay(3000L) // pretend we are doing something useful here, too
    println("end doSomethingUsefulTwo")
    return 29
}
```

Output

```
start doSomethingUsefulOne [main @coroutine#2]
start doSomethingUsefulTwo [main @coroutine#3]
Exception [main @coroutine#1]
```

`이처럼, exception이 발생하면, 예외가 전파되어 scope 내에 코루틴이 전부 
취소가 된다.`     

`즉, 이 말은 scope 내에 코루틴 들 중 하나라도 exception이 
발생하게 되면, scope 내의 코루틴과 해당 코루틴을 실행한 부모 코루틴 까지 
예외가 전파되어 리소스를 안전하게 처리 할 수 있다는 것이다.`    


- - - 

**Reference**     

<https://kotlinlang.org/docs/composing-suspending-functions.html>   
<https://www.inflearn.com/course/%EC%83%88%EC%B0%A8%EC%9B%90-%EC%BD%94%ED%8B%80%EB%A6%B0-%EC%BD%94%EB%A3%A8%ED%8B%B4/lecture/48250?tab=curriculum>   


{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}
