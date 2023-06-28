---
layout: post
title: "[Kotlin] let, with, run, apply, also 정리"     
subtitle: "Scope Functions 범위 지정 함수"      
comments: true
categories : Kotlin
date: 2021-12-05
background: '/img/posts/mac.png'
---

코틀린에서 아래와 같이 생긴 확장함수들이 있다.   
객체를 사용할 때 명령문들을 블록 { } 으로 묶어서 
간결하게 사용할수 있게 해주는 함수들이다.   

> let, with, run, apply, also

이번 글에서는 비슷하면서 다른 각 함수들의 차이점에 대해서 살펴보자.   

- - - 

## 1. 일반적인 사용 방식   

일반적으로 객체를 변경하려면 아래와 같이 사용한다.   

```kotlin
data class Person(var name: String, var age: Int)

val person = Person("", 0)
person.name = "James"
person.age = 56
println("$person")

// Person(name=James, age=56)
```

위 코드를 블럭으로 묶어서 간결한 코드로 만들 수 있는데, 
    Scope Functions에 대해서 자세히 살펴보자.   

- - - 

## 2. Scope Functions   

`Scope Functions은 객체를 사용할 때 Scope(범위, 영역)를 일시적으로 만들어서 속성(property)나 
함수를 처리하는 용도로 사용되는 함수이다.`   

### 2-1) let   

```kotlin
fun <T, R> T.let(block: (T) -> R): R
```

let 함수는 매개 변수화 된 타입 T의 확장함수이다.    
자기 자신을 받아서 R을 반환하는((T) -> R) 람다 식을 입력으로 받고, 
    블럭 함수의 반환 값 R을 반환한다.   
아래와 같이 Person 클래스의 확장 함수로 사용되어 person.let의 형태가 가능해진다.   

let 함수를 사용하면 객체의 상태를 변경할 수 있다.   

```kotlin
val person = Person("", 0)
val resultIt = person.let {
    it.name = "James"
    it.age = 56
    it // (T)->R 부분에서의 R에 해당하는 반환값.
}

val resultStr = person.let {
    it.name = "Steve"
    it.age = 59
    "{$name is $age}" // (T)->R 부분에서의 R에 해당하는 반환값.
}

val resultUnit = person.let {
    it.name = "Joe"
    it.age = 63
    // (T)->R 부분에서의 R에 해당하는 반환값 없음
}

println("$resultIt")
println("$resultStr")
println("$resultUnit")


// Person(name=James, age=56)
// Steve is 59
// kotlin.Unit
```

블럭의 마지막 return 값에 따라 let의 return 값 형태도 달라지는 모습을 보인다.   

`또한, T?.let { } 형태에서의 let 블럭 안에는 non-null 만 들어올 수 있어서 non-null 체크시에 
유용하게 쓸 수 있다.`      
`객체를 선언하는 상황일 경우에는 elvis operator(?:)를 사용해서 기본값을 지정해 줄 수도 있다.`    

```kotlin
val nameStr = person?.let { it.name } ?: "Defalut name"
```


### 2-2) with     

```kotlin
fun <T, R> with(receiver: T, block: T.() -> R): R
```

`with는 일반 함수이기 때문에 객체 receive를 직접 입력받고, 객체를 사용하기 
위한 두 번째 파라미터 블럭을 받는다.`    

객체 receiver를 입력 받으면 블럭 내에 this를 사용하지 않고도 입력받은 
객체(receiver)의 속성을 변경할 수 있다.   

`즉, 아래 예제에서 with(T) 타입으로 Person을 받으면 {} 블럭 안에서 바로 name 이나 
age 프로퍼티에 접근할 수 있다.`     

단, 리시버는 non-null 객체만 사용 가능하다.   

```kotlin
val person = Person("James", 56)
with(person) {
    println(name)
    println(age)
    //자기자신을 반환해야 하는 경우 it이 아닌 this를 사용한다
}

// James
// 56
```

> 객체에서 여러 개의 메소드를 호출할 때 유용하다.   

### 2-3) run   

run은 두 가지 형태로 선언되어 있다. 먼저 첫 번째는 아래와 같다.   

```kotlin
fun <T, R> T.run(block: T.() -> R): R
```

아래와 같이 사용할 수 있다.  

```kotlin
val person = Person("James", 56)
val ageNextYear = person.run {
    ++age
}

println("$ageNextYear")

// 57
```

두 번째 run 선언은 아래와 같다.   

```kotlin
fun <R> run(block: () -> R): R
```

`위 형태는 확장 함수가 아니고, 블럭에 입력 값도 없다. 따라서 객체를 
전달 받아서 속성을 변경하는 형식에 사용되는 함수가 아니다.`   
`이 함수는 어떤 객체를 생성하기 위한 명령문을 블락 안에 묶음으로써 
가독성을 높이는 역할을 한다.`   

```kotlin
val person = run {
    val name = "James"
    val age = 56
    Person(name, age)
}
```

### 2-4) apply   

```kotlin
fun <T> T.apply(block: T.() -> Unit): T
```

`apply는 T의 확장 함수이고, 블럭 함수의 입력갑을 람다 리시버로 받았기 때문에 
블럭 안에서 프로퍼티를 호출할 때 it 이나 this를 사용할 필요가 없다.`   
run과 유사하지만 블럭에서 return 값을 받지 않으며 자기 자신인 T를 
반환한다는 점이 다르다.   

```kotlin
val person = Person("", 0)
val result = person.apply {
    name = "James"
    age = 56
}

println("$person")

//Person(name=James, age=56)
```

`앞에서 살펴 본 let, with, run은 모두 맨 마지막 반환되는 값이 R이었다.`     
`하지만 apply와 아래에서 살펴볼 also는 T를 반환한다.`    

즉, 마지막에 객체 자기 자신(T)를 반환하기 때문에 위 예제의 결과도 Person 타입이 
되었다.  

> apply는 객체 자신을 다시 반환하기 때문에 특정 객체의 프로퍼티를 설정 후 바로 
사용하기 쉽다.   
> 주로 객체의 함수를 사용하지 않고 자기 자신을 다시 반환할 때 사용 되기 때문에 
객체의 초기화나 변경할 때 사용한다.   


### 2-5) also

```kotlin
fun <T> T.also(block: (T) -> Unit): T
```

also는 T의 확장함수이고, 블럭 함수의 입력으로 람다 리시버를 받지 않고 this로 받는다.   
apply와 마찬가지로 T를 반환한다.   

```kotlin
val person = Person("", 0)
val result = person.also {
    it.name = "James"
    it.age = 56
}

println("$person")

//Person(name=James, age=56)
```

블럭 함수의 입력으로 T를 받았기 때문에 it를 사용해 
프로퍼티에 접근하는 것을 볼 수 있다.   
그래서 객체의 속성을 전혀 사용하지 않거나 변경하지 않고 사용하는 경우에 also를 
사용한다.   

예를 들면, 객체의 사이드 이펙트를 확인하거나 객체의 프로퍼티에 데이터를 
할당하기 전에 해당 데이터의 유효성을 검사할 때 유용하게 사용할 수 있다.   

```kotlin
val author = author.also {
      requireNotNull(it.age)
      print(it.name)
    }
```

- - - 

**Reference**    

<https://blog.yena.io/studynote/2020/04/15/Kotlin-Scope-Functions.html>  
<https://kotlinlang.org/docs/scope-functions.html>   

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

