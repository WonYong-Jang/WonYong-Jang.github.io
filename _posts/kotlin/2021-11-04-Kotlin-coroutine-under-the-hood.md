---
layout: post
title: "[Kotlin] Coroutines under the hood" 
subtitle: "코루틴 내부 동작 방식 이해하기 / Continuation Passing Style"    
comments: true
categories : Kotlin
date: 2021-11-04
background: '/img/posts/mac.png'
---

이번글에서는 코루틴을 공부하다가 보면, 여러가지 의문점이 생겼을 것이다.   
어떻게 함수가 호출이 되었다가 중단(suspend)이 되고, 다시 resume이 되는지 이해하기 힘들 것이다.    
내부동작을 이해하지 못하고 코루틴 라이브러리를 사용해도 잘 동작하긴 하지만, 
    내부 동작을 이해하고 사용하면, 조금 더 깊이있게 
    사용하 수 있을 것이다.   

[Deep Dive into Coroutines on JVM by Roman Elizarov](https://www.youtube.com/watch?v=YrrUCSi72E8)에 
더 자세한 설명이 있다.   

- - - 

## CPS Transforms

위에 언급한 유투브 영상을 참고해서 설명해보면, 
코루틴을 사용하다 보면 suspend 되고 resume되는 과정이 마법처럼 느껴지지만 
`코루틴 코드가 컴파일 되면 내부적으로 CPS(Continuation Passing Style)로 변경된다.`        

`Continuation Passing Style이란 것은 결국 콜백(Callback)이라고 생각하면 된다.`       
아직까지는 이해하기 힘들지만, 아래 예제를 보면서 이해해보자.   
서버에서 토큰을 가져오고, 게시물을 post한 후에 post 완료 처리를 하는 
3개의 연산(suspend function)을 코루틴으로 비동기 처리한다고 했을 때, 
    이 코드가 컴파일 될 때 CPS로 변경될 될 것이다.   

<img width="800" alt="스크린샷 2021-12-18 오후 3 56 40" src="https://user-images.githubusercontent.com/26623547/146632504-cc729355-1277-4937-ba61-aad73fca19fe.png">   

위 예제를 컴파일 후 바이트 코드를 살펴보면, 아래와 같이 몇가지 
중요한 변화가 있다. (CPS Transformation)       
`먼저, 아래와 같이 suspend function 함수인 createPost의 바이트 코드에서 
마지막 파라미터에 Continuation 객체를 넘겨주게 변경 된다.`      

<img width="800" alt="스크린샷 2021-12-18 오후 4 03 45" src="https://user-images.githubusercontent.com/26623547/146632699-f7bbefe9-c40a-4e00-852b-31bce817a15d.png">     

`그리고, 또 다른 변화는 우리가 순차적으로 작성했던 suspend function들에 
각각 LABEL이 생기게 된다.`   
`왜냐하면 suspend function이 중단되고 재개될 때 필요한 suspend point가 필요하기 
때문이다.`   

<img width="800" alt="스크린샷 2021-12-18 오후 4 04 50" src="https://user-images.githubusercontent.com/26623547/146632704-be7497f7-8d78-40f5-8865-ea5dcdb1ae70.png">   

이런 작업들은 코틀린 컴파일러가 내부적으로 하게된다.  
결국 위 바이트 코드는 아래와 같은 코드와 같을 것이다.   
우리가 작성했던 suspend function들이 switch문의 각 case가 되는 것이고, 
0번부터 2번까지 각각 중단하고 재개하는 suspend point가 되는 것이다.   

<img width="800" alt="스크린샷 2021-12-18 오후 4 05 14" src="https://user-images.githubusercontent.com/26623547/146632705-8e6d974d-ec0b-4f5f-93c2-47890dde6e60.png">   

그럼 LABEL이 다 완성되고 나면, 위에서 언급한 Continuation 객체를 
마지막 파라미터로 받을 수 있게 변경되는데, `매번 suspend function을 
호출할 때마다 Continuation 객체를 같이 넘긴다.`    
`Continuation은 중단하고 재개하는 인터페이스를 가진 객체이다. 그렇기 때문에 
콜백 인터페이스라고 생각하면 이해가 빠르다.`   
`아래에서 sm은 state machine을 의미하는데, 각 suspend function이 
호출될 때 상태값을 같이 넘겨주는 것이다.`   

<img width="800" alt="스크린샷 2021-12-18 오후 4 18 41" src="https://user-images.githubusercontent.com/26623547/146633031-00a47d8f-7833-4bf1-bc4e-8b084957fa80.png">  

즉, 각각의 suspend function이 마지막 파라미터로 Continuation 객체를 
가져가게 되는 것이고, 현재 LABEL인 suspend function이 완료되면 
resume을 호출한다.   

resume은 결국 결국 자기 자신을 호출하는 것이다. 아래 예제의 경우는 
`현재 LABEL의 suspend function이 완료되면, 자기 자신인 postItem 함수를 
호출하고, 현재 LABEL 값에 1을 더하여 다른 케이스를 불릴 수 있도록 한다.`      
그럼 마치 내부적으로 함수가 호출될 때 마다 각 suspend function을 순차적으로 
실행하는 것처럼 보이게 된다.   

<img width="800" alt="스크린샷 2021-12-18 오후 4 32 58" src="https://user-images.githubusercontent.com/26623547/146633389-15604711-4512-48ad-9739-5784ee0abb36.png">    

- - - 

## CPS simulation  

위에서 바이트 코드를 보면서 코루틴의 내부 동작을 살펴봤다.  
결국 콜백을 통해 suspend function을 중단하고 재개할 수 있었는데 
`내가 콜백을 하는게 아니라 코틀린 컴파일러가 내부적으로 
콜백 형태로 만들어서 콜백을 해주는 것이다.`      

이러한 어려운 동작들을 내부적으로 알아서 해주기 때문에 
개발자는 단순히 순차적으로 작성한 코드만으로 
비동기 처리를 할 수 있다.   

위에서 봤던 바이트 코드를 실제로 
코틀린 코드로 구현한다면, 아래와 같은 코드가 될 것이다.    
해당 코드에서 각 케이스 문을 중단점으로 찍고 디버깅을 해보면 
이해하기 쉬울 것이다.   

```kotlin
fun main() {
    println("[in] main")
    myCoroutine(MyContinuation())
    println("\n[out] main")
}

fun myCoroutine(cont: MyContinuation) {
    when(cont.label) {
        0 -> {
            println("\nmyCoroutine(), label: ${cont.label}")
            cont.label = 1  // 다음 LABEL 설정 
            fetchUserData(cont)
        }
        1 -> {
            println("\nmyCoroutine(), label: ${cont.label}")
            val userData = cont.result
            cont.label = 2
            cacheUserData(userData, cont)
        }
        2 -> {
            println("\nmyCoroutine(), label: ${cont.label}")
            val userCache = cont.result
            updateTextView(userCache)
        }
    }
}

fun fetchUserData(cont: MyContinuation) {
    println("fetchUserData(), called")
    val result = "[서버에서 받은 사용자 정보]"
    println("fetchUserData(), 작업완료: $result")
    cont.resumeWith(Result.success(result))  // 작업이 완료되면 resume 콜백 실행 
}

fun cacheUserData(user: String, cont: MyContinuation) {
    println("cacheUserData(), called")
    val result = "[캐쉬함 $user]"
    println("cacheUserData(), 작업완료: $result")
    cont.resumeWith(Result.success(result))  // 작업이 완료되면 resume 콜백 실행 
}

fun updateTextView(user: String) {
    println("updateTextView(), called")
    println("updateTextView(), 작업완료: [텍스트 뷰에 출력 $user]")
}

class MyContinuation(override val context: CoroutineContext = EmptyCoroutineContext)
    : Continuation<String> {

    var label = 0    // LABEL이 0부터 시작함   
    var result = ""

    override fun resumeWith(result: Result<String>) {
        this.result = result.getOrThrow()
        println("Continuation.resumeWith()")
        myCoroutine(this)
    }
}
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
