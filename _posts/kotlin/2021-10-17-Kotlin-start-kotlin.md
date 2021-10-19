---
layout: post
title: "[Kotlin] 빠르게 배워보는 코틀린"     
subtitle: "property / val, var / fun / array / if, when, for, while / class "    
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

# 2. 코틀린 프로퍼티(property)    

코틀린에서는 기존의 프로그래밍 언어에서의 사고방식을 어느 정도는 
지우고 새롭게 처음부터 공식문서를 본다는 마음으로 이해해야 이해가 
되는 부분들이 조금씩 있다. 프로퍼티가 그 중의 하나이다.     

일반 프로그래밍 언어에서 field 또는 변수(variable)로 불리는 개념이지만, 
    `코틀린에서는 클래스의 변수를 프로퍼티(property)라고 부른다. 클래스 내에서 
    var, val로 선언되는 변수들이다.`       

코틀린은 프로퍼티를 언어 기본 기능으로 제공한다. 프로퍼티를 조금 더 
자세히 살펴보면, `프로퍼티란 필드와 접근자를 통칭하는 것이다.`    
일반적인 자바빈 클래스인 Person을 보면서 정확히 알아보자.   

```java
public class Person {
    private final String name;
    private boolean isMarried;

    public Person(String name, boolean isMarried) {
        this.name = name;
        this.isMarried = isMarried;
    }

    public String getName() {
        return this.name;
    }

    public void setIsMarried(boolean isMarried) {
        this.isMarried = isMarried;
    }

    public boolean getIsMarried() {
        return this.isMarried;
    }
}
```   

자바에서는 데이터를 필드(field)에 저장한다. name과 isMarried 라는 
데이터를 Person클래스의 필드에 저장한 것이다.   
한편 `각 데이터마다 적용되는 getter와 setter를 접근자`라고 부른다. 이 
접근자를 통해서 가시성이 private인 데이터들에 접근할 수 있다.      

위의 자바 코드에서 Person 클래스 필드에 들어가는 데이터들이 점점 증가한다면 
getter와 setter같은 코드가 많아져서 가독성이 떨어질 것이다.   
코틀린에서는 위의 Person클래스를 간단하게 정의할 수 있다.   

```kotlin
class Person(val name: String, var isMarried: Boolean)   
```

자세히보면 자바코드에서 setter를 제공하지 않는 name 은 val로 선언하였고, 
    getter와 setter모두 제공하는 isMarried는 var로 선언하였다.   
    val과 var은 아래에서 더 자세히 설명하겠지만, val은 불변, var은 가변 데이터를 
    선언할 때 사용한다.    
    이와 같은 맥락으로 val로 선언한 name은 setter가 생성되지 않는다.    
이 부분을 코틀린 코드로 보자면 아래와 같다.   

```kotlin
class Person {
    val name: Int
        get() {
            return this.age
        }

    var isMarried: Boolean
        get() {
            return this.isMarried
        }
        set(isMarried: Boolean) {
            this.isMarried = isMarried
        }
}
```     

`val로 선언한 name의 경우 setter가 없다. setter를 만들고 싶어도 val은 
불변이기에 만들 수 없다.`(억지로 만드려고 하면 컴파일에러가 뜬다)   
    참고로 위에서 get()과 set()을 정해준 것은 커스텀 접근자이다.   
    `기본적으로는 코틀린 클래스를 만들 때 생성자에 넣어준 데이터들에 대하여 
    get()과 set()이 숨겨져 있으나, 위의 코드처럼 명시적으로 적어줄 수 있다. 
    그 말은 getter와 setter를 커스텀 할 수도 있다는 뜻이다.`      

아래와 같이 커스텀하게 구현이 가능하다.   

```kotlin
class Person {
    var name: String = "Not Assigned"
        set(value) {
            field = "Dev." + value
        }
}

fun main(args: Array<String>) {
    val person = Person()
    person.name = "Ready"

    println(person.name) // Dev.Ready   
}
```   

위 예제를 보면 setter를 커스텀하게 만든 소스에서 낯선 내용이 등장한다.   
`그건 바로 Backing Field라고 불리는 field이다.`   
코틀린에서는 클래스 내에서 직접적으로 Fields에 대해 선언할 수 없으나 
프로퍼티가 Backing Field를 필요로 할 때 자동으로 Accessor 메서드 안에서 
참조할 수 있도록 field라는 식별자를 제공해준다.   

위 코드에서 사용된 field 역시 이러한 Backing Field를 의미하며, field가 
가르키는 것이 곧 name이라 보면 된다.   
조금 더 설명하자면, 위 main 함수에서 person.name = "Ready"가 실행 될 때 
person 객체의 name 프로퍼티를 직접 접근하는 것이 아니라 setter 함수를 
호출 하는 것이고, 그에 따라 set(value)에서 value에 "Ready"라는 값이 
전달되어 field(name)에 "Dev.Ready" 값이 할당되게 되어 출력되는 것이다.   


#### 2-1) 생성자에 val, var의 유무 차이   

아래 둘의 차이는 무엇일까?   

```kotlin
class Person(val name: String) // 1

class Person(name: String) //2
```

`먼저 생성자에 val(또는 var)이 있는 경우 멤버변수로 변환된다.`
즉, class Person(val name: String)의 경우 아래 자바 코드로 변환된다.

```java
public final class Person {
   @NotNull
   private final String name;

   @NotNull
   public final String getName() {
      return this.name;
   }

   public Person(@NotNull String name) {
      Intrinsics.checkParameterIsNotNull(name, "name");
      super();
      this.name = name;
   }
}
```

반면 class Person(name: String)의 경우 아래의 자바 코드와 같다.   

```java
public final class Person {
   public Person(@NotNull String name) {
      Intrinsics.checkParameterIsNotNull(name, "name");
      super();
   }
}
```   

`코틀린 클래스 생성자에 val이나 var이 없는 경우에는 
생성자의 파라미터들은 초기화 할때만 사용 된다. 따라서 val이나 var이 없는 
경우에는 프로퍼티가 되지 못했기 때문에 클래스의 생성자 외 
다른 메서드에서는 사용할 수 없다.`     


#### 2-2) 주의 사항    

`디컴파일한 자바 코드에서 필드가 private이라고 하여 코틀린의 프로퍼티도 
private은 아니다.`    
`즉, 필드와 프로퍼티를 다르게 인식할 줄 알아야 한다.`   
`자바는 기본적으로 필드로 다루고, 코틀린은 프로퍼티(필드 + 접근자)를 기본으로 
다루는 언어다.`   

```kotlin
class Person(var name: String)
```   

위의 코드는 아래의 자바 코드가 된다.   

```java
public class Person {
    private String name;

    public Person(String name) {
        this.name = name;
    }

    public Void setName(String value) {
        this.name = value;
    }

    public String getName() {
        return this.name;
    }
}
```

`자바 필드인 name 자체만 보면 private 키워드가 붙어있으므로 private이 맞지만, 
    프로퍼티 전체를 보면 다르다. 필드는 private이지만 getter와 setter로 
    접근이 모두 가능하기 때문에 프로퍼티는 private하다고 볼 수 없다.`   
    위 코드에서 name 프로퍼티가 private이기 위해서는 아래와 같은 코틀린 코드가 필요하다.   

```kotlin
class Person(private var name: String)
```   

name 앞에 private 이 붙었다. private이 붙지 않은 상태였어도 디컴파일한 자바 코드의 
필드에는 private이 붙지만, 코틀린은 기본적으로 필드가 아닌 프로퍼티를 다루기 때문에 
프로퍼티 전체가 private이 된다. 디 컴파일된 자바 코드는 아래와 같다.   

```kotlin
public final class Property {
   private String name;

   public Property(@NotNull String name) {
      Intrinsics.checkParameterIsNotNull(name, "name");
      super();
      this.name = name;
   }
}
```  

즉, getter와 setter가 없어서 프로퍼티가 private이라고 볼 수 있다.    

정리해보면    

- 자바는 필드를 기본으로, 코틀린은 프로퍼티를 기본으로 다룬다.   
- 디컴파일된 자바 코드의 필드가 private이라고 해서 kotlin 프로퍼티가 private인 것은 아니다.   


- - - 

# 3. 변수와 상수   

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

# 4. 함수(메서드)   

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

# 5. 배열   

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

# 6. if, when, for, while   

### 6-1) if   

if 구문의 경우 보통의 언어들과 같지만 if문을 식으로 사용하여 값을 리턴 하여 
사용할 수도 있다.   

```kotlin   
val a = 7   
val b = 2   
val bigger = if (a > b) a else b     
```   


### 6-2) when   

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

### 6-3) for  

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

### 6-4) while   

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

# 7. Class   

### 7-1) 클래스 선언   

클래스를 단순하게 선언하는 것은 어렵지 않다. 다만 new 키워드를 
코틀린에서는 사용하지 않는다는 점이 어색하게 다가올수도 있을 것 같다.   

```kotlin
class Fruit {

}

val fruit = Fruit()
```



- - - 

**Reference**     

<https://wooooooak.github.io/kotlin/2019/05/24/property/>   
<https://github.com/RumbleKAT/WeekEndStudy/blob/main/kotlin.md>   
<https://velog.io/@gosgjung/%EC%BD%94%ED%8B%80%EB%A6%B0%EC%96%B8%EC%96%B4-%EA%B8%B0%EB%B3%B8%EA%B0%9C%EB%85%90-%EC%B4%9D%EC%A0%95%EB%A6%AC-%EC%8A%A4%EC%95%95%EC%A3%BC%EC%9D%98>   

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

