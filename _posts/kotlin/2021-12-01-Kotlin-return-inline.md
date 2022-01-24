---
layout: post
title: "[Kotlin] 인라인과 람다 내부의 return은 언제 불가능할까?"     
subtitle: ""    
comments: true
categories : Kotlin
date: 2021-12-01
background: '/img/posts/mac.png'
---

## 람다 내부의 return은 언제 불가능할까?   

고차함수에서 넘긴 람다에서 return은 사용 가능할 때가 있고, 
    불가능할 때가 있다.    
    `정확하게는 인라인 고차함수의 경우 return 사용이 가능하고, 일반함수는 
    return 사용이 불가하다.`    

예를 들어 흔히 사용하는 forEach의 경우 inline 고차함수라서 
람다 내부에서 return이 가능하다.   

```kotlin
fun findAndPrintTen(numbers: List<Int>) {
    numbers.forEach {
        if (it == 10) {
            println("find 10!!")
            return
        }
    }
}

fun main() {
    findAndPrintTen(listOf(1,2,3,10))
}

// find 10!!
```

```kotlin
@kotlin.internal.HidesMembers
public inline fun <T> Iterable<T>.forEach(action: (T) -> Unit): Unit {
    for (element in this) action(element)
}
```

`그러나 inline이 아닌 일반 고차함수의 람다에서는 return을 사용할 수 없다.`       
원인을 알아보기 위해 forEach를 직접 만들어서 테스트해보자.    

```kotlin
inline fun <Int> Collection<Int>.forEachA(block: (Int) -> Unit) {
    for (e in this) block(e)
}

fun <Int> Collection<Int>.forEachB(block: (Int) -> Unit) {
    for (e in this) block(e)
}
```   

`forEachA는 inline 고차함수고, forEachB는 일반 고차함수다. forEachA로 
넘긴 람다에서는 return을 사용할 수 있고, forEachB로 넘긴 람다에서는 
return을 사용하지 못할 것이다. 확인을 위해 
findAndPrintTen() 함수로 돌아가서 forEachA와 forEachB를 사용하도록 
한 번씩 변경해보자.`   

```kotlin
fun findAndPrintTen(numbers: List<Int>) {
    numbers.forEachA {
        if (it == 10) {
            println("find 10!!")
            return
        }
    }
}

fun findAndPrintTen(numbers: List<Int>) {
    numbers.forEachB {
        if (it == 10) {
            println("find 10!!")
            return  // compile error : 'return' is not allowed here
        }
    }
}
```

언급했던 것처럼 forEachB는 해당 위치에서는 
return을 사용하지 못한다는 컴파일 에러를 발생시킨다.    

왜 이럴까?   

forEachA의 경우는 inline 함수이기 때문에 파라미터로 받는 람다가 
호출하는 쪽에 inline된다. 예를 들어, 컴파일러는 아래 코드를   

```kotlin
fun findAndPrintTen(numbers: List<Int>) {
    numbers.forEachA {
        if (it == 10) {
            println("find 10!!")
            return // findAndPrintTen를 return 시킨다
        } 
    }
}
```  

아래처럼 변환시킨다.   

```kotlin
fun findAndPrintTen(numbers: List<Int>) {
    for (number in numbers) {
        if (number == 10) {
            println("find 10!!")
            return // findAndPrintTen를 return 시킨다
        }
    }
}
```   

즉 forEachA로 넘긴 람다 block이 컴파일러에 의해 그대로 inline되기 때문에 
return문을 만나면 일반 for문에서 return을 하는 것과 동일하게 
findAndPrintTen을 리턴시킬 수 있다. 그래서 inline 고차함수로 넘긴 
람다에서 return이 허용된다.   

반면 forEachB 파라미터로 받은 람다의 경우 호출하는 쪽에 inline되지 않는다. 
람다로 받은 함수는 컴파일러에 의해 아무런 처리가 되지 않고, 컴파일 된 이후 
Function 타입의 객체가 된다.   

람다가 결국 Function 타입의 객체라면, 이 람다를 변수에 저장할 수도 있다는 
뜻인데 이런 현상 때문에 return이 금지되는 것이다.   
만약 람다를 외부에 저장해놓고, 자신을 호출한 함수의 context를 
벗어난 곳에서 함수가 실행된다면 예상치 못한 버그가 일어날 수 있기 때문이다.   
위 코드의 경우에는 findAndPrintTen 함수가 이미 끝난 상태에서 어딘가에 
저장된 람다가 다시 호출되는 경우라고 볼 수 있다.   

실제로 아래의 코드를 보면, inline 고차함수로 넘긴 람다는 다른 변수에 저장이 
불가능하다(그래서 return이 허용)   
반면, 일반 고차함수로 넘긴 람다는 다른 변수로 저장이 가능하며 return문으로 
인한 버그 방지를 위해 return을 금지한다.   

```kotlin
var savedFunc: () -> Unit = {}

inline fun test1(block: () -> Unit) {
    savedFunc = block // compile error:  inline될 것이기 때문에 변수로 저장할 수 없다.
}

fun test2(block: () -> Unit) {
    savedFunc = block
}
```

> inline 함수의 람다는 객체가 아니므로 변수에 저장 불가하다.   



- - - 

**Reference**     

<https://wooooooak.github.io/kotlin/2022/01/11/%EB%9E%8C%EB%8B%A4%EB%82%B4%EB%B6%80%EC%97%90%EC%84%9C%EC%9D%98return/>   
<https://wooooooak.github.io/kotlin/2022/01/11/%EB%9E%8C%EB%8B%A4%EB%82%B4%EB%B6%80%EC%97%90%EC%84%9C%EC%9D%98return/>   
<https://wooooooak.github.io/kotlin/2019/02/16/kotlin_label/>   
<https://kotlinlang.org/docs/returns.html>   

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

