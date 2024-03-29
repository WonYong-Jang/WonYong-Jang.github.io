---
layout: post
title: "[Kotlin] 코루틴(coroutine) 사용해보기"     
subtitle: "suspend, resume, globalScope, launch, dispatcher coroutineScope, runBlocking, coroutineContext, async"    
comments: true
categories : Kotlin
date: 2021-10-31
background: '/img/posts/mac.png'
---

[이전글](https://wonyong-jang.github.io/kotlin/2021/10/28/Kotlin-coroutine-start.html)에서 
코루틴의 개념에 대해서 살펴봤다.   

코루틴은 우리가 흔히 알고 있는 함수의 상위 개념이라고 볼 수 있다.     
일반 함수의 경우 caller가 함수를 호출하면 호출 당한 함수는 
caller에게 어떤 값을 return하고 끝이난다.    
`그러나 코루틴은 suspend/resume도 가능하다. 즉, caller가 함수를 call하고 
함수가 caller에게 값을 return하면서 종료하는 것 뿐만 아니라 값을 return 하지 
않고 잠시 멈추었다가 필요할 때에 다시 resume(재개)할 수도 있다.`    

`코루틴으로 메인쓰레드를 너무 오래 블락시키는 Long running task문제를 해결 할 수 있다.`    
안드로이드 플랫폼은 메인쓰레드에서 5초 이상 걸리는 긴 작업을 할 경우 앱을 
죽여버린다. 그래서 network나 DB 접근 같이 오래 걸리는 작업은 
모두 다른 스레드에서 작업하고, 그 결과를 받아 ui를 그려주는 것은 다시 Main 쓰레드로 
돌아와서 작업 해야한다. 기존에는 이런 작업을 콜백으로 처리했다.      

```kotlin
class MyViewModel: ViewModel() {
    fun fetchDocs() {
        get("dev.android.com") { result ->
            show(result)
        }
    }
}
```   

get 함수는 비록 메인 스레드에서 호출되었지만, 네트워크를 타고 데이터베이스에 
접근하는 기능은 다른 스레드에서 해야만 한다.   
그리고 result 정보가 도착하면 콜백 함수는 메인스레드에서 동작해야 한다. 이런 
비동기 작업을 코루틴을 이용해서 더 읽기 쉽고 작성하기 편하게 할 수 있다.    

이제 코루틴에 대해서 자세히 살펴보자.   

- - - 

## 1. 코루틴   

코루틴을 공식문서 예제를 보면서 이해해보자.   
아래에서 delay가 구현되어 있는 부분을 보면 suspend 키워드가 붙은 함수이다.   
suspend는 잠시 중단 한다는 의미이고, 잠시 중단한다면 언젠가 다시 resume 된다는 뜻이다.   
코드에서는 delay라는 suspend 함수가 끝이 나면 그때 caller가 resume 시켜 아랫줄 
코드를 실행시킨다.      

```kotlin
import kotlinx.coroutines.*

fun main() {
    GlobalScope.launch { // launch a new coroutine in background and continue
        delay(1000L) // non-blocking delay for 1 second (default time unit is ms
        println("World!") // print after delay
    }
    println("Hello,") // main thread continues while coroutine is delayed
    Thread.sleep(2000L) // block main thread for 2 seconds to keep JVM alive
}
// Hello,
// World!
```

delay라는 함수는 현재 실행중인 thread를 block시키진 않지만 코루틴은 
일시 중지시킨다. thread입장에서는 non-blocking이다.   

`문서에서는 blocking과 non-blocking이 자주 나오는데, 이것은 쓰레드 입장에서 
봐야한다. 우선은 쓰레드를 멈춘다면 blocking이고, 쓰레드를 멈추지 
않는다면 non-blocking이라고 이해하자.`     

> GlobalScope.launch {} 코드 블록은 코루틴을 생성하기 위한 코루틴 빌더이며, 
    이렇게 생성되어 실행되는 코루틴은 호출(실행) 스레드를 블록하지 않기 
    때문에 그대로 두면 메인 함수가 종료되고 메인 함수를 실행한 메인 스레드 
    역시 종료되어 프로그램이 끝나게 된다. 이를 방지하기 위해 
    임의의 시간을 지정하여 지연시킨 것이다.    
> 이렇게 스레드를 멈추는 역할을 수행하는 함수를 중단 함수(Blocking function)이라고 한다. 
우리는 이러한 중단 함수가 현재 스레드를 멈추게 할 수 있다는 것을 코드상에 보다 
명시적으로 나타내기 위해 다음과 같이 runBlocking {} 블록을 사용할 수 있다.   

### 1-1) CoroutineScope, CoroutineConext      

`CoroutineScope는 말 그대로 코루틴의 범위, 코루틴 블록을 묶음으로 제어할 수 있는
단위이다.`    

`위 코드에서 GlobalScope는 CoroutineScope를 상속받아 구현되어 있다. 
GlobalScope는 Dispatchers.Unconfinded에서 동작한다.`    

> Dispatcher에 대해서는 아래에서 다시 설명할 예정이다.   

`launch라는 코루틴 빌더는 늘 어떤 코루틴 스코프 안에서 코루틴을 launch한다. 
아래 코드에서는 새로운 코루틴을 GlobalScope에서 launch하도록 했다.`         
`이 말은 Global이 의미하는 것처럼, 새롭게 launch된 코루틴은 해당 
어플리케이션 전체의 생명주기에 적용된다는 말이다.`    

> 즉, GlobalScope는 전역 scope이다. 실무에서는 잘 사용하지 않지만 
간단한 예제를 위해서 사용하였다.     

`CoroutineContext는 코루틴을 어떻게 처리 할것인지에 대한 여러가지 
정보의 집합이다.`   
CoroutineContext의 주요 요소로는 job과 dispatcher가 있다.   

### 1-2) runBlocking   

위 코드는 쓰레드를 중단시키지 않는 non-blocking 함수(delay)와  
쓰레드를 잠시 멈추는 blocking 함수(Thread.sleep)를 같이 섞어 쓰고 있다.   
이렇게 섞어 쓰게 되면 무엇이 blocking 함수이고 무엇이 non-blocking 함수인지 
헷갈릴수 있다.    
runBlocking 코루틴 빌더를 사용해서 blocking을 조금 더 명확하게 명시해보자.     

```kotlin
import kotlinx.coroutines.*

fun main() {
    GlobalScope.launch { // launch a new coroutine in background and continue
        delay(1000L)
        println("World!")
    }
    println("Hello,") // main thread continues here immediately
    runBlocking {     // but this expression blocks the main thread
        delay(2000L)  // ... while we delay for 2 seconds to keep JVM alive
    }
}
```

위 코드에서 Thread.sleep(2000L) 이부분이 delay(2000L)으로 바뀌었다.   
delay는 아래와 같이 suspend 함수이며, non-blocking 함수이다.   
`suspend함수는 다른 suspend함수에서 사용되거나, 코루틴 스코프 안에서만 
사용 가능하다.`   

```kotlin
public suspend fun delay(timeMillis: Long) {
    //...
}
```

즉, 위와 같이 코루틴 빌더인 runBlocking 으로 감싸서 사용 가능하다.   
Blocking을 run(실행, 시작)한다는 뜻의 runBlocking은 이름만 보아도 
꽤 명시적이다.   
`runBlocking은 이름이 내포하듯이 현재 쓰레드(여기선 main 쓰레드)를 블록킹 
시키고 새로운 코루틴을 실행시킨다.`   

runBlocking이 현재 쓰레드를 블락 시키지 않는다면, Hello만 출력하고 
프로그램이 종료될 것이다. 하지만 실행해 보면 Hello, World를 
정상적으로 출력하는 것을 확인할 수 있다.   

언제까지 Blocking 시킬까?   
`runBlocking 블록 안에 있는 코드가 모두 실행을 끝마칠 때 까지 블록된다.`   
runBlocking 안에 2초의 delay를 주었으므로 2초동안 메인쓰레드가 블록된다. 2초의 
딜레이가 끝나면 main()함수는 종료된다. 메인쓰레드가 블록되어 있는 2초 동안에, 
    이전에 launch했던 코루틴은 계속 동작하고 있다.    

한편 delay는 suspend 함수이기 때문에 코루틴이 아닌 일반 쓰레드에서는 
사용이 불가능한데, runBlocking 블락안에 delay()가 사용가능한 것으로 보아 
runBlocking 역시 새로운 코루틴을 생성하는 것으로 보인다. 동시에 자신이 속한 쓰레드를 블록킹 시킨다.    

위 코드를 한 번 더 진화시켜보자.   

```kotlin 
import kotlinx.coroutines.*

fun main() = runBlocking<Unit> { // start main coroutine
    GlobalScope.launch { // launch a new coroutine in background and continue
        delay(1000L)
        println("World!")
    }
    println("Hello,") // main coroutine continues here immediately
    delay(2000L)      // delaying for 2 seconds to keep JVM alive
}
```   

runBlocking을 메인스레드 전체에 걸어줌으로써 시작부터 메인 쓰레드를 
블락시키고 top-level 코루틴을 시작한다.   
`즉, 우리는 메인스레드의 모든 작업이 종료된 후에 프로그램이 
종료되길 원하기 때문에 runBlocking을 중간에 실행해서 쓰레드를 
block 시키는것보다 top-level에 위치시켜서 사용하는 것이 
좋은 방법이다.`       

위에서 설명했듯이 `runBlocking은 블록 안에 있는 모든 모루틴들이 완료될 때까지 
자신이 속한 스레드를 종료시키지 않고 블락시킨다.`   
따라서 runBlocking에서 가장 오래 걸리는 작업인 delay(2초)가 끝날 때까지 
메인쓰레드는 죽지 않고 살아있다.   

그런데 1초의 시간뒤에 "World!"라는 단어를 찍기위하여 2초를 기다리는 일은 
별로 좋아보이지 않는다. 예를 들어 1초의 시간이 어떠한 디비를 접속해서 
데이터를 가져오는 비동기 처리 작업이라고 한다면, 그때 걸리는 시간이 
무조건 1초가 걸린다고 가정할 수는 없으므로 2초라는 구체적인 시간동안 스레드를 
죽이지 않는 건 좋지 못하다.    
디비를 조회하는 시간이 3초가 넘어갈수도 있기 때문에 `우리는 디비를 조회해서 
어떤 응답을 가져오면, 그 즉시 어떤 일을 처리하고 프로그램을 
종료시킬 방법이 필요하다.`   

`Job을 통해 그런일이 가능하다.`       

```kotlin
import kotlinx.coroutines.*

fun main() = runBlocking {
    val job = GlobalScope.launch { // launch a new coroutine and keep a reference to its Job
        delay(1000L)
        println("World!")
    }
    println("Hello,")
    job.join() // wait until child coroutine completes
}
```

위의 코드에서 1초의 딜레이 이후 "World!"가 찍히는 것을 보기위해 2초동안 프로그램을 
종료시키지 않는 delay(2000L)라는 코드가 없다.   
`위 코드는 GlobalScope.launch로 생성한 코루틴이 제 기능을 다 완수하는 
즉시 프로그램을 종료시킨다.`     
`job이라는 변수가 특정 코루틴의 레퍼런스를 가지고 있고, job.join()이 job이 
끝나기를 계속 기다리기 때문이다.`   
job이 끝나지 않으면 runBlocking()으로 생성한 코루틴은 끝나지 않는다.   

위 코드에서는 runBlocking의 블록 안에서 GlobalScope로 코루틴을 만들어 
launch했지만, GlobalScope를 사용하지 않고, runBlocking이 만든 CoroutineScope와 
같은 스코프로 코루틴을 만들 수 있다.     
이를 `Structed concurrency`라고 부르며, 위의 예시에서 runBlocking이 
만든 coroutineScope안에 GlobalScope를 이용하여 독립적인 
coroutineScope를 또 만들어서 사용하기 때문에, top-level의 
coroutineScope와 아무런 관계를 가지지 못한다.(구조적으로 관계가 없다.)   

만약 아래와 같은 코드를 작성했다고 해보자.    
GlobalScope를 이용하여 CoroutineScope를 만들어서 job을 반환했지만, 
    job.join 호출을 누락했다고 해보자.   
그렇다면, Hello만을 출력하게된다.   
즉, top-level coroutineScope와 GlobalScope가 만든, coroutineScope가 
구조적으로 관계가 없기 때문에, Hello를 출력하고 기다리지 않고 
프로그램을 종료시킨다.   


```kotlin
fun main() = runBlocking {
    val job = GlobalScope.launch { // launch a new coroutine and keep a referenc
        delay(1000L)
        println("World!")
    }
    println("Hello,")
}
// Hello,   
```

그렇다면, top-level 코루틴(runBlocking에서 만든)과 launch를 구조적으로 관계를 가지게 하려면?   
`Structed concurrency를 이용 하면 된다.`     
`launch를 GlobalScope에서 실행하게 하지말고, 
    아래와 같이 top-level에서 만든 coroutineScope에서 
실행할 수 있도록 하면 된다.`       

아래 코드처럼 그냥 launch를 호출하여 더 깔끔한 코드를 만들 수 있다.    

```kotlin
fun main() = runBlocking { // this: CoroutineScope

    // this.launch 에서 아래와 같이 생략 가능하다!
    launch { // launch a new coroutine in the scope of runBlocking
        delay(1000L)
        println("World!")
    }
    println("Hello,")
}
```    


### 1-3) coroutineScope       

만일 어떤 코루틴들을 위한 사용자 정의 스코프가 필요한 경우가 있다면 
coroutineScope{ } 빌더를 이용할 수 있다. 이 빌더를 통해 
생성 된 코루틴은 모든 자식 코루틴들이 끝날때까지 종료되지 않는 스코프를 정의하는 
코루틴이다.    

이 시점에 우리는 예제로 계속 사용하고 있는 runBlocking 빌더와 coroutineScope 빌더가 
무슨 차이가 있는지 궁금할 수 있다.     

`그 차이는 runBlocking과 달리 coroutineScope는 자식들의 종료를 기다리는 동안 
현재 스레드를 블록하지 않는다는 점이다.`   

```kotlin
fun main(args: Array<String>) = runBlocking {
    launch {
        delay(200L)
        println("Task from runBlocking")
    }

    coroutineScope {
        launch {
            delay(500L)
            println("Task from nested launch")
        }
        delay(100L)
        println("Task from coroutine scope")
    }
    println("Coroutine scope is over")
}

// Output   
// Task from coroutine scope
// Task from runBlocking
// Task from nested launch
// Coroutine scope is over
```   



### 1-4) suspend 와 resume   

위에서 나온 용어 중에 suspend 와 resume에 대해서 정리해보자.   

- suspend : 현재의 코루틴을 멈춘다.     
- resume : 멈춰있던 코루틴 부분을 다시 시작한다.   

suspend와 resume은 콜백을 대체하기 위해 같이 쓰인다.   

```kotlin
class MyViewModel: ViewModel() {
    fun fetchDocs() {
        get("dev.android.com") { result ->
            show(result)
        }
    }
}
```

위 함수에서 콜백을 제거하기 위해 코루틴을 사용해보자.   
`suspend 키워드를 사용하는 함수는 CoroutineScope에서만 사용할 수 있다.`   

```kotlin
// Dispatchers.Main
suspend fun fetchDocs() {
    // Dispatchers.IO
    val result = get("developer.android.com")
    // Dispatchers.Main
    show(result)
}
// look at this in the next section
suspend fun get(url: String) = withContext(Dispatchers.IO){/*...*/}
```

`suspend함수( get )가 자신의 역할(network요청이나 DB 접근)을 끝내면 
메인쓰레드에 콜백으로 알려주는 것이 아니라, 그저 멈춰있던 
코루틴 부분을 시작하는 것이다.`    

코루틴은 스스로 suspend(중단)할 수 있으며 dispatcher는 코루틴을 resume하는 
방법을 알고 있다.   
[링크](https://medium.com/androiddevelopers/coroutines-on-android-part-i-getting-the-background-3e0e54d20bb)를 
참고하자.   

주의할 점은 함수 앞에 suspend를 적어준다고 해서 그것이 함수를 백그라운드 스레드에서 
실행시킨다는 뜻은 아니다. 코루틴은 메인 쓰레드 위에서 돈다. 메인스레드에서 하기에는 너무 
오래 걸리는 작업을 하기 위해서는 코루틴을 Default나 IO dispatchr에서 
관리되도록 해야한다. 코루틴이 
메인 스레드 위에서 실행되더라도 꼭 dispatcher에 의해서 동작해야만 한다.   

### 1-5) dispatcher   

dispatcher는 CoroutineContext의 주요 요소이다.   
`CoroutineContext를 상속받아 어떤 쓰레드를 이용해서 어떻게 동작할 것인지를 
미리 정의해 두었다.`    

코루틴들이 어디서 실행되는지를 명시하기 위해 코틀린은 아래와 같이 
3가지 유형의 Dispatchers를 제공한다.      

- Dispatchers.Default : CPU 사용량이 많은 작업에 사용한다. 주 스레드에서 작업하기에는 
너무 긴 작업들에게 알맞다. 스레드 풀(Thread Pool)을 사용해 실행한다.      

- Dispatchers.IO : 네트워크, 디스크 사용할때 사용한다. 파일 읽고, 쓰고, 쏘켓을 
읽고, 쓰는 작업을 멈추는것에 최적화되어 있다. 긴 시간을 실행하는 I/O 작업을 위해 준비된 스레드를 사용한다.   

- Dispatchers.Main : 메인스레드를 사용한다. 안드로이드의 경우 UI 쓰레드를 사용한다.     

Dispatchers.Main은 UI 구성하는 쓰레드를 메인으로 사용하는 플랫폼에서 사용한다.   
대표적으로 안드로이드의 경우 메인 스레드는 UI 쓰레드이고, 안드로이드에서 
Dispatchers.Main은 UI 쓰레드를 사용하여 동작한다. 

Dispatchers.Main을 사용할수 없는 플랫폼도 있으며, 이러한 플랫폼에서 
사용할 경우, IllegalStateException이 발생할수 있다.   

그 외에, 코루틴 공식 문서에 Dispatchers.Unconfined도 존재한다.    
Dispatchers.Unconfined는 다른 Dispatcher와 달리 특정 스레드 또는 
특정 쓰레드 풀을 지정하지 않는다. 일반적으로 사용하지 않으며 특정 목적을 
위해서만 사용한다.   

더 자세한 내용은 [CoroutineDispatcher](https://kotlin.github.io/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/-coroutine-dispatcher/)를 
참고하자.   

결국 개발자가 선택한 dispatcher에 따라서 실행되는 쓰레드가 달라진다.     

- - - 

## 2. 코루틴 사용해보기   

위의 예제를 토대로 코루틴을 처음 시작할때 아래와 같이 사용하면 된다.   

1. 사용할 Dispatcher를 결정한다.   
2. Dispatcher를 이용해서 CoroutineScope를 만든다.   
3. CoroutineScope의 launch 또는 async에 수행할 코드 블록을 넘기면 된다.     

`launch와 async는 CoroutineScope의 확장함수이며, 넘겨 받는 코드 블록으로 
코루틴을 만들고 실행해주는 코루틴 빌더이다.`    

`launch는 Job 객체를, async는 Deferred 객체를 반환하며, 이 객체를 
사용해서 수행 결과를 받거나, 작업이 끝나기를 대기하거나 취소하는 등의 
제어가 가능하다.`    

다음은 코루틴 블록을 만들고 실행하는 가장 기본적인 코드의 형태이다.   

```kotlin
// 이 CoroutineScope 는 메인 스레드를 기본으로 동작합니다
// Dispatchers.IO 나 Dispatchers.Default 등의 다른 Dispatcher 를 사용해도 됩니다
val scope = CoroutineScope(Dispatchers.Main)

scope.launch {
    // 포그라운드 작업
}

scope.launch(Dispatchers.Default) {
    // CoroutineContext 를 변경하여 백그라운드로 전환하여 작업을 처리합니다
}
```

다음 예시에서 내부 코루틴 블록은 멈추지 않는다.   

```kotlin
val scope = CoroutineScope(Dispatchers.Main)

val job = scope.launch {
   // ...
        
   CoroutineScope(Dispatchers.Main).launch {
     // 외부 코루틴 블록이 취소 되어도 끝까지 수행됨
   }
      
   // ...
}

// 외부 코루틴 블록을 취소
job.cancel()
```

기존 CoroutineScope를 사용할지, 새로운 CoroutineScope를 만들지 
결정하는 것은 코루틴 블록이 특정상황에 어떻게 동작하는지 이해하고 있어야 한다.    

위 예시에서는 외부 코루틴 블록의 내부에서 새로운 CoroutineScope를 만들었다.   

이로서 외부 코루틴 블록과 내부 코루틴 블록은 서로 제어범위가 달라진다.   

Job의 객체의 cancel()메서드는 자신이 해당하는 CoroutineScope의 코루틴 블록을 
취소시켜 멈출수 있지만, 내부 코루틴 블록은 다른 CoroutineScope로 
분리되었기 때문에 멈출수 없다.   

`즉, 외부 코루틴 블록이 멈춰도, 내부 코루틴 블록은 끝까지 수행된다`    .   

- - -

## 3. suspend와 resume 실습으로 이해해보기   

suspend와 resume에 대한 개념을 이해해보자.   
그전에 각각 어떤 쓰레드에서 실행되는지, 어느 코루틴이 
실행되는지 확인을 위해서 아래와 같이 설정해보자.   

println을 쓰레드를 확인할 수 있도록 오버라이드 후, VM 옵션을 설정한다.   

```kotlin
fun <T>println(msg: T) {
    kotlin.io.println("$msg [${Thread.currentThread().name}]")
}
```

VM 옵션을 추가한다.   

```
-Dkotlinx.coroutines.debug
```


```kotlin
import kotlinx.coroutines.*

fun main() = runBlocking  {
    launch {
        repeat(5) { i ->
            println("Coroutine A, $i")
        }
    }

    launch {
        repeat(5) { i ->
            println("Coroutine B, $i")
        }
    }
    println("Coroutine Outer")
}
```

Output  

```
Coroutine Outer [main @coroutine#1]
Coroutine A, 0 [main @coroutine#2]
Coroutine A, 1 [main @coroutine#2]
Coroutine A, 2 [main @coroutine#2]
Coroutine A, 3 [main @coroutine#2]
Coroutine A, 4 [main @coroutine#2]
Coroutine B, 0 [main @coroutine#3]
Coroutine B, 1 [main @coroutine#3]
Coroutine B, 2 [main @coroutine#3]
Coroutine B, 3 [main @coroutine#3]
Coroutine B, 4 [main @coroutine#3]
``` 

위처럼 코루틴을 3개를 만든 것을 확인할 수 있고, 모두 Main 쓰레드에서 
실행된 것을 확인 할 수 있다.    
첫번째 코루틴은 runBlocking에 의해 생성되었고, launch에 의해 각각 1개씩 
생성되었다.   

그럼 아래와 같이 수정하여 결과를 비교해보자.   

<img width="600" alt="스크린샷 2021-12-10 오후 9 37 08" src="https://user-images.githubusercontent.com/26623547/145575290-1dad87fb-0ac6-425f-9f95-48feb1584e23.png">    

`suspend 함수인 delay를 추가하였고, 빨간색 박스처럼 suspend function call 이라는 
마크가 생겼다.`   
즉 suspend함수를 만나게 되면, 코루틴이 중단되고 다른 코루틴에서 resume 된다.   

결과는 아래와 같다.  

Output   

```
Coroutine Outer [main @coroutine#1]
Coroutine A, 0 [main @coroutine#2]
Coroutine B, 0 [main @coroutine#3]
Coroutine B, 1 [main @coroutine#3]
Coroutine B, 2 [main @coroutine#3]
Coroutine B, 3 [main @coroutine#3]
Coroutine B, 4 [main @coroutine#3]
Coroutine A, 1 [main @coroutine#2]
Coroutine A, 2 [main @coroutine#2]
Coroutine A, 3 [main @coroutine#2]
Coroutine A, 4 [main @coroutine#2]
```   

마지막 으로 코루틴 각각 번갈아 가며, 실행되게 하려면 아래와 같이 수정하면 된다.   

```kotlin
fun main() = runBlocking  {
    launch {
        repeat(5) { i ->
            println("Coroutine A, $i")
            delay(10L)
        }
    }

    launch {
        repeat(5) { i ->
            println("Coroutine B, $i")
            delay(10L)
        }
    }
    println("Coroutine Outer")
}

fun <T>println(msg: T) {
    kotlin.io.println("$msg [${Thread.currentThread().name}]")
}
```   

Output  

```
Coroutine Outer [main @coroutine#1]
Coroutine A, 0 [main @coroutine#2]
Coroutine B, 0 [main @coroutine#3]
Coroutine A, 1 [main @coroutine#2]
Coroutine B, 1 [main @coroutine#3]
Coroutine A, 2 [main @coroutine#2]
Coroutine B, 2 [main @coroutine#3]
Coroutine A, 3 [main @coroutine#2]
Coroutine B, 3 [main @coroutine#3]
Coroutine A, 4 [main @coroutine#2]
Coroutine B, 4 [main @coroutine#3]
```   



[다음 글](https://wonyong-jang.github.io/kotlin/2021/11/01/Kotlin-coroutine-launch-asynch-job-deferred.html)에서는 lauch, async, Job, Deferred의 자세한 내용을 살펴볼 예정이다.   

- - - 

**Reference**     

<https://thdev.tech/kotlin/2020/12/07/Coroutines-Flow-Callback/>   
<https://medium.com/@limgyumin/%EC%BD%94%ED%8B%80%EB%A6%B0-%EC%BD%94%EB%A3%A8%ED%8B%B4%EC%9D%98-%EA%B8%B0%EC%B4%88-cac60d4d621b>   
<https://wooooooak.github.io/kotlin/2019/06/18/coroutineStudy/>   
<https://wooooooak.github.io/kotlin/2019/06/28/coroutineStudy2/>    
<https://www.inflearn.com/course/%EC%83%88%EC%B0%A8%EC%9B%90-%EC%BD%94%ED%8B%80%EB%A6%B0-%EC%BD%94%EB%A3%A8%ED%8B%B4/lecture/48247?tab=curriculum>   

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

