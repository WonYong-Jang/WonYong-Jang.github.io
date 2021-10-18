---
layout: post
title: "[Kotlin] 빠르게 배워보는 코틀린"     
subtitle: "val, var / fun / array / if, when, for, while / class / Null을 처리하는 방법 "    
comments: true
categories : Kotlin
date: 2021-10-17
background: '/img/posts/mac.png'
---

이 글에서는 코틀린을 처음 시작하기 위해서 기본적인 기능들에 대해
간략하게 요약한 내용을 다루려고 합니다.    

- - -     


# 1. 코틀린 언어   

코틀린은 인텔리제이를 만든 Jetbrain 에서 만든 프로그래밍 언어다. 인텔리제이 
역시 코틀린을 완벽 지원하고 안드로이드 스튜디오 역시 코틀린을 완벽하게 지원한다.   
또한, 구글에서도 코틀린을 자바에 이어 안드로이드 공식 언어로 선언했다.   

- - - 

# 2. 변수와 상수   

- var   
    - var 는 변수를 선언할 때 사용되는 키워드이다.   
    - var 로 선언한 변수는 값을 변경할 수 있다.   

- val     
    - val 는 상수를 선언할 때 사용되는 키워드이다.   
    - val 로 선언한 상수는 값을 변경 불가하다.   

```kotlin
val a: Int = 1
val b = 2
val c :Int 
c = 3

b += 2  // Val cannot be reassigned   

var x = 5 
x = 1

//String
var v =1
var s1 = "a string"
var s2 = "$s1 and $v"     

var s3 = """   // 문자열 여러줄로 표현하기    
abc
def
efg
###           // 줄바꿈이나 특수문자까지 그대로 문자열로 사용 가능하다.   
"""
```

- - -   

# 3. 함수(메서드)   

fun 키워드를 사용하며 파라미터에는 변수명:타입을 쓰고 리턴타입을 지정한다.     

```kotlin
fun sum(a: Int, b:Int): Int{
    return a + b
}

fun sum(a:Int,b:Int) = a + b    // return 생략 가능   
```

아무것도 리턴하지 않으면 Unit을 리턴 타입으로 사용하거나 생략한다.   

```kotlin   
fun sum(a:Int, b:Int): Unit{
    print("sum(${a},${b})=${a+b}") // sum(1,2)=3
}    
sum(1,2)   
```

- - - 

# 4. 배열   

`배열의 타입은 코틀린에서 Array<T> 이다. Array라는 타입을 코틀린 컴파일러가 
충분히 유추할 수 있는 상황이라면 충분히 생략할 수 있다.`    
배열을 생성하는 함수는 listOf(), arrayOf(), arrayOfNulls(), emptyArray() 가 있다.   
element 접근은 get(), set()을 이용한다.   

```kotlin
val a: Array<Int> = arrayOf(1,2,3)   // 배열 생성과 함께 초기화    
a.set(2,5) // 1,2,5      
a[2] = 5   // 1,2,5    
```

아래는 Array 배열의 크기와 초기값을 설정하는 예시이다.   

```kotlin   
val a = Array<String>(3) { i -> i.toString() }
a.forEach (::println)    // 0 1 2
```

- - - 

# 5. if, when, for, while   

### 5-1) if   

if 구문의 경우 보통의 언어들과 같지만 if문을 식으로 사용하여 값을 리턴 하여 
사용할 수도 있다.   

```kotlin   
val a = 7   
val b = 2   
val bigger = if (a > b) a else b     
```   


### 5-2) when   

`코틀린에서 switch ~ case 구문의 경우 when 키워드를 이용하여 사용할 수 있다.`   

```kotlin   
fun printNumber (num : Int)  = when (num){
    1 -> println("number_one !!! $num")
    2 -> println("number_two !!! $num")
    3 -> println("number_three !!! $num")

    else ->{
        println("숫자 1,2,3 외의 숫자입니다.")
    }
}
printNumber(1)
``` 

또한 아래와 같이 Any타입을 사용하여 응용하여 사용도 가능하다.   

```kotlin
fun cases(obj: Any) {
    when (obj) {
        1 -> println("One")
        "Hello" -> println("Greeting")
        is Long -> println("Long")
        !is String -> println("Not a string")
        else -> println("Unknown")
    }
}
```

### 5-3) for  

`일반적인 프로그래밍 언어에서 제공해주는 키워드인 for 언어와 사용법이 
비슷할 수도 있지만, step을 지정하는 부분이 조금 다르다.`   

```kotlin
for (n in numbers){
    sum +=n
}   

for (i in 1..3){
     println(i)  // 1 2 3   
} 

for (i in 1..5 step 2){ 
     println(i)  // 1 3 5
}

for (i in 10 downTo 0 step 3){
     println(i)  // 10 7 4 1   
}
```   

또한, 아래와 같이 사용도 가능하다.   

```kotlin
val items = listOf("apple", "banana", "kiwi")

for(index in 0 until items.size) {
   println("$index is ${items[index]}")
}

for(index in items.indices) {
   println("$index is ${items[index]}")
}
// 0 is apple
// 1 is banana
// 2 is kiwi
```

### 5-4) while   

코틀린에서는 다른 언어에서 제공하는 while, do ~ while 문을 동일하게 제공한다.   

```kotlin
var i = 0
    do {
        i++
        println(i)
    }while(i >= 10)

var i2 = 0
    while (i2 < 10){
        i2++
        println(i2)
    }
```

- - -   

# 6. Class   

### 6-1) 클래스 선언   

클래스를 단순하게 선언하는 것은 어렵지 않다. 다만 new 키워드를 
코틀린에서는 사용하지 않는다는 점이 어색하게 다가올수도 있을 것 같다.   

```kotlin
class Fruit {

}

val fruit = Fruit()
```

- - - 

# 7. Null을 처리하는 방법   

자바의 경우 int, boolean과 같은 primitive type을 제외한 객체들은 항상 
null이 될 수 있다.    
`코틀린은 자바와 다르게 Nullable과 Non-nullable 타입으로 프로퍼티를 
선언할 수 있다.`   
`Non-nullable 타입으로 선언하면 객체가 null이 아닌 것을 보장하기 때문에 
null check등의 코드를 작성할 필요가 없다.`   

타입을 선언할 때 ?를 붙이면 null을 할당할 수 있는 프로퍼티이고, ?가 
붙지 않으면 null이 허용되지 않는 프로퍼티를 의미한다.   

nullable 프로퍼티는 null을 할당할 수 있지만, nonNullable에 
null을 할당하려고 하면 컴파일 에러가 발생한다.   

```kotlin
val nullable: String? = null   // 컴파일 성공
val nonNullable: String = null // 컴파일 에러
```

`아래와 같이 Int? 를 통해 Null 혹은 Int 값이 반환될 수 있음을 명시한다.`   

```kotlin
fun parseInt2(str: String): Int? {
    val numberList = listOf("0", "1", "2", "3", "4", "5", "6", "7", "8", "9")
    if(numberList.contains(str)){
        return parseInt(str)
    } else{
        return null
    }
}
```    

## 7-1) 코틀린에서 NPE가 발생하는 경우   

코틀린은 nullable과 non-nullable 개념을 만들어, null에 안전한 프로그램을 
만들 수 있게 도와준다. 그래서 코틀린만 
사용한다면 Null Pointer Exception 같은 예외가 발생하지 않을 수도 있다.   
`하지만, 코틀린에서는 NPE가 발생하지 않을 것 같지만 자바의 라이브러리를 쓰는 
경우 NPE가 발생할 수 있다.` 자바에서는 non-nullable 타입이 없기 때문에 
자바 라이브러리를 사용할 때 nullable 타입으로 리턴 된다.   


## 7-2) nullable 타입을 non-nullable 타입으로 변경하기    

코틀린에서 아래와 같은 자바 라이브러리를 사용한다고 가정해보자. 
`이 함수는 String을 리턴하며, 코틀린에서는 이 타입을 nullable인 
String? 으로 인식한다.`   

```java
String getString() {
  String str = "";
  ....
  return str;
}
```   

코틀린에서 이 함수의 리턴 값을 non-nullable인 String으로 변환하고 
싶다면 어떻게 할까?   

`아래와 같이 String? 타입을 String 타입에 할당하려고 하면 
컴파일 에러를 발생 시킨다.`   

```kotlin
var nonNullString1: String = getString()     // 컴파일 에러
```   

`반면에 아래 코드는 컴파일이 된다. 그 이유는 !! 연산자를 사용했기 때문이다.`      
`!! 연산자는 객체가 null이 아닌 것을 보장한다. 만약 null이라면 NPE를 
발생시킨다.`    

```kotlin
var nonNullString2: String = getString()!!   // 컴파일 성공   
```

`이런 이유로 !! 연산자는 null이 아닌 것을 보장할 수 있는 
객체에만 사용해야 한다.`   


## 7-3) 안전하게 nullable 프로퍼티 접근하기   

코틀린에서 nullable 프로퍼티를 사용할 때 안전하게 사용하는 
다양한 방법들에 대해서 알아보자.    

#### 7-3-1) 조건문으로 nullable 접근   

가장 쉬운 방법은 if-else를 이용하는 것이다. 자바에서는 흔히 
사용하는 방식이다.    
아래 코드는 String?을 접근하기 전에 if로 null을 체크하는 코드이다.     

```kotlin
val b: String? = "Kotlin"
    if (b != null && b.length > 0) {
        print("String of length ${b.length}")
    } else {
        print("Empty string")
    }
```

단점은 if-else 루프가 반복되는 경우 가독성을 해칠 수 있다.   

#### 7-3-2) Safe call 연산자로 nullable 접근   

`Safa call은 객체를 접근 할 때 ?. 로 접근하는 방법을 말한다.`   
예를 들어 아래 코드에서 b?.length를 수행 할 때 b가 null이라면 length를 
호출하지 않고 null을 리턴한다.    
그렇기 때문에 NPE가 발생하지 않는다.   

```kotlin
val a: String = "Kotlin"
val b: String? = null
println(b?.length)
println(a?.length) // Unnecessary safe call
```

위의 코드에서 a?.length는 불필요하게 Safe call을 사용하고 있다.   
a는 non-nullalble이기 때문이다.   

아래와 같이 또 다른 예시를 보면, 여러 객체로 둘러 쌓인 String에 
접근하는 코드이다. `a?.b?.c?.d?. 를 수행할 때, 이 객체들 중에 null이 
있으면 null을 리턴하게 된다.`      

```kotlin
println(a?.b?.c?.d?.length)
```

#### 7-3-3) 안전하게 nullable 프로퍼티 할당   

어떤 프로퍼티를 다른 프로퍼티에 할당할 때, 객체가 null인 경우 
default 값을 할당하고 싶을 수 있다. 자바에서는 삼항연산자를 
사용하여 아래 코드처럼 객체가 null인 경우 default 값을 설정해줄 수 
있다.   

```java
String b = null;
int l =  b != null ? b.length() : -1;
```

`하지만 코틀린은 삼항연산자를 지원하지 않는다. 삼항 연산자를 대체할 수 있는 
것들에 대해서 살펴보자.`   

- if-else   
    - if-else로 삼항연산자를 대체할 수 있다.    
    ```kotlin   
    val l = if (b != null) b.length else -1
    ```   

- `엘비스 연산자(Elvis Operation)`   
    - 엘비스 연산자는 ?: 를 말한다. 삼항연산자와 비슷한데 ?: 왼쪽은 객체가 null이 아니면 
    이 객체를 리턴하고 null 이라면 ?: 의 오른쪽 객체를 리턴한다.    
    ```kotlin
    val l = b?.length ?: -1
    ```   

- `Safe Cast`   
    - 

- - - 

**Reference**     

<https://codechacha.com/ko/kotlin-null-safety/>    
<https://github.com/RumbleKAT/WeekEndStudy/blob/main/kotlin.md>   
<https://velog.io/@gosgjung/%EC%BD%94%ED%8B%80%EB%A6%B0%EC%96%B8%EC%96%B4-%EA%B8%B0%EB%B3%B8%EA%B0%9C%EB%85%90-%EC%B4%9D%EC%A0%95%EB%A6%AC-%EC%8A%A4%EC%95%95%EC%A3%BC%EC%9D%98>   

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

