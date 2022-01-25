---
layout: post
title: "[Kotlin] 인라인과 람다 내부의 return은 언제 불가능할까?"     
subtitle: "람다와 인라인(inline) 이해 / noninline / use"    
comments: true
categories : Kotlin
date: 2021-12-01
background: '/img/posts/mac.png'
---

람다의 경우 컴파일 단계에서 파라미터 개수에 따라 FunctionN 형태의 
인터페이스로 변환이 된다.   
예를 들어 아래와 같이 파라미터가 두 개인 람다 식은 Function2의 인터페이스로 
변환되는 것을 알 수 있다.   

```kotlin
fun calculator(x: Int, y: Int, operation: (Int, Int) -> Int) {
   operation(x, y)
}

// 아래의 경우 Function2<P1, P2, R> 인터페이스로 변환 
/* 컴파일 시, FunctionN 형태의 인터페이스 구현 객체로 변환 */
public final void calculator(int x, int y, @NotNull Function2 operation) {
   Intrinsics.checkNotNullParameter(operation, "operation");
   operation.invoke(x, y);
}
```

그렇기 때문에 람다 식을 사용하는 경우 일반 함수 구현에 비해 부가적인 
비용이 들게 되기 때문에, 똑같은 작업을 하는 일반 함수보다 덜 효율적이게 된다.   

이를 해결하기 위해, 코틀린은 inline 키워드를 제공하고 있고 
이에 따른 람다 내부 return의 차이에 대해서도 살펴보자.   

- - - 

## 1. 인라인 함수   

`코틀린이 보통 람다를 무명 클래스로 컴파일하지만 람다 식을 
사용할 때마다 새로운 클래스가 만들어지지 않는다.`   
`하지만 람다가 변수를 포획하면 생성되는 시점마다 새로운 무명 클래스 객체가 
생성된다.`   
이런 경우는 실행 시점에 무명 클래스의 생성에 부가 비용이 들어서, 
    일반 함수를 사용한 구현보다 덜 효율적이다.   

이와 같은 상황에서 사용하는 것이 인라인(inline) 키워드이다.    
`inline 변경자를 어떤 함수에 붙이면 컴파일러는 그 함수를 호출하는 모든 문장을 함수 본문에 
해당하는 바이트코드로 바꿔치기 해준다.`   

아래 예제를 보면서 살펴보자.   

#### 1-1) 무의미한 객체 생성 예방   

인라인 함수를 사용하면 람다식을 사용했을 때 무의미하게 객체가 생성되는 
것을 막을 수 있다. 이를 확인하기 위해서 우선 코틀린의 람다식이 
컴파일될 때 어떻게 변하는지 확인해보자.   

```kotlin
fun nonInlined(block: () -> Unit) {
    block()
}

fun doSomething() {
    nonInlined { println("do something") }
}
```

nonInlined라는 함수는 고차 함수로 함수 타입을 인자로 받고 있다. 그리고 
doSomething()은 noInlined함수를 호출하는 함수이다. 이러한 코드를 
자바로 표현한다면 아래와 같다.   

```java
public void nonInlined(Function0 block) {
    block.invoke();
}

public void doSomething() {
    noInlined(System.out.println("do something");
}
```

이렇게 표현되는 코드는 실제로 컴파일하면 아래와 같이 변환된다. `이 코드에서의 
문제점은 nonInlined의 파라미터로 새로운 객체를 생성하여 넘겨준다는 것이다.`   
이 객체는 doSomething 함수를 호출할 때마다 새로 만들어진다.   
즉, 이와 같이 사용하면 무의미하게 생성되는 객체로 인해 낭비가 생기는 것이다.   

```kotlin
public static final void doSomething() {
    nonInlined(new Function() {
        public final void invoke() {
            System.out.println("do something");
        }
    });
}
```   

이러한 문제점을 해결하기 위해서 인라인을 사용하는 것이다. `인라인을 
어떤 함수에 붙이면 inline된 코드는 변환된 바이트 코드 자체가 그 부분으로 
    쏙 들어가기 때문에 더 이상 람다를 인터페이스로 구현하는 FunctionN 객체는 
    생기지 않고, 오버헤드가 발생하지 않는다.`      

예제는 아래와 같다.   

```kotlin
inline fun inlined(block: () -> Unit) {
    block()
}

fun doSomething() {
    inlined { println("do something") }
}
```   

단지 inline 키워드를 함수에 추가하였다. 이를 컴파일한 코드를 보면 확인할 수 있지만 
위와 같이 불필요한 객체를 생성하지 않고 내부에서 사용되는 함수가 
호출하는 함수(doSomething)의 내부에 삽입된다.   

```java
public static final void doSomething() {
    System.out.println("do something");
}
```  

#### 1-2) 리소스 관리를 위해 inline 된 람다 사용   

개발을 진행하면서 리소스를 획득하여 사용하고 필요 작업을 마친 후 해제해줘야 
하는 리소스 관리가 필요할 때가 있다.   
예를 들면 BufferedReader와 같은 I/O 클래스들을 사용하는 경우 사용 완료 후에는 
close()와 같이 리소스를 해제해주곤 하는데, 이때 보통 사용하는 방법은 
try/finally문을 사용하거나 try with resources문을 사용하는 것이다.    

코틀린에서는 try with resources를 제공하는 대신 `작업을 아주 매끄럽게 처리할 수 있는 use 라는 함수를 제공해준다.`      

```kotlin
/* use 함수로 리소스 자동 관리하기 */
fun readFirstLineFromFile(path: String): String {
   BufferedReader(FileReader(path)).use { br ->
      return br.readLine()  //람다에서 반환하는 것이 아닌 readFirstLineFromFile에서 반환한다.
   }
}
```

use를 쓰게 되면 finally에서 리소스 close를 강제로 해줘야 하는 번거로움이 없어지며, 
    exception이 발생하여 비정상 종료가 되더라도 리소스 해제를 해주도록 구현되어 있다.   



#### 1-3) noninline   

둘 이상의 람다를 인자로 받는 함수에서 일부 람다만 인라이닝하고 싶을 때도 
있을 수 있다.    
예를 들면 어떤 람다에 너무 많은 코드가 들어가거나 어떤 람다에 
인라이닝을 하면 안되는 코드가 들어갈 가능성이 있을 때이다.   
`이런식으로 인라아닝하면 안되는 파라미터를 받는다면 noninline 변경자를 
파라미터 이름 앞에 붙여서 인라이닝을 금지할 수 있다.`   

```kotlin
inline fun sample(inlined: () -> Unit, noinline noInlined: () -> Unit) {
    
}
```

#### 1-3) 정리   

위의 설명을 본다면 언제나 inline을 사용하는게 좋아보인다. 하지만 기본적으로 
`일반 함수 호출의 경우에는 JVM이 이미 강력하게 인라이닝을 지원하고 있다.`       
`따라서 일반 함수에는 inline 키워드를 추가할 필요가 없다.`     

반면 위에서 설명했듯이 람다를 인자로 받는 함수를 인라이닝하면 여러 이점으로 
인해 이익이 많다.   
`즉, inline 키워드는 람다를 인자로 받는 함수만 성능이 좋아질 가능성이 높으며, 
    그외 다른 코드의 경우는 주의 깊게 성능을 측정하고 분석해야 한다.`   

`단, inline 함수를 만들 때 코드 크기가 큰 함수의 경우는 모든 호출 지점에 
바이트코드가 복사되기 때문에 오히려 더 성능을 악화시킬 수 있기 때문에 
가급적이면 코드 크기가 작은 부분에만 inline 함수를 사용하길 권장한다.`      

> 실제로, 코틀린 라이브러리가 제공하는 inline 함수(filter, foreach..)를 보면 
모두 다 크기가 아주 작다는 사실을 알 수 있다.   

- - - 

## 2. 람다 내부의 return은 언제 불가능할까?   

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

<https://velog.io/@changhee09/%EC%BD%94%ED%8B%80%EB%A6%B0-%EC%9D%B8%EB%9D%BC%EC%9D%B8-%ED%95%A8%EC%88%98>   
<https://wooooooak.github.io/kotlin/2022/01/11/%EB%9E%8C%EB%8B%A4%EB%82%B4%EB%B6%80%EC%97%90%EC%84%9C%EC%9D%98return/>   
<https://wooooooak.github.io/kotlin/2022/01/11/%EB%9E%8C%EB%8B%A4%EB%82%B4%EB%B6%80%EC%97%90%EC%84%9C%EC%9D%98return/>   
<https://wooooooak.github.io/kotlin/2019/02/16/kotlin_label/>   
<https://kotlinlang.org/docs/returns.html>   

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

