---
layout: post
title: "[Kotlin] 코틀린의 주요 특성과 기초 배우기"     
subtitle: "property, backing field, class / val, var / fun / array / if, when, for, while / enum / smart cast"    
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

현재 자바가 사용 중인 곳이라면 거의 대부분 코틀린을 활용할 수 있다.    
대표적으로 서버 개발, 안드로이드 앱 개발 등의 분야에서 코틀린을 쓸 수 있다.    
또한, 자바뿐 아니라 자바스크립트도 코틀린을 컴파일 할 수 있다. 따라서 코틀린 코드를 
브라우저나 노드에서 실행할 수 있다.   

다음으로는 코틀린의 주요 특성을 살펴보고 코틀린을 사용해야 하는 
이유를 확인해보자.   

## 1-1) 코틀린의 주요 특성   

#### 1-1-1) 정적 타입 지정 언어   

`자바와 마찬가지로 코틀린도 정적타입 지정 언어다. 정적 타입 지정이라는 
말은 모든 프로그램 구성 요소의 타입을 컴파일 시점에 알 수 있고 
프로그램 안에서 객체의 필드나 메소드를 사용할 때마다 컴파일러가 
타입을 검증해준다는 뜻이다.`   

정적타입의 장점은 성능(실행시점에 어떤
         메소드를 호출할지 알아내는 과정이 필요 없음), 신뢰성, 유지보수성, 도구 지원 등이 있다. 

> 그루비나 JRuby은 동적 타입 지정 언어이다. 동적 타입 지정 언어에서는 
타입과 관계없이 모든 값을 변수에 넣을 수 있고, 메소드나 필드 접근에 
대한 검증이 실행 시점에 일어나며, 그에 따라 코드가 짧아지고 
데이터 구조를 더 유연하게 생성하고 사용할 수 있다. 하지만, 반대로 
이름을 잘못 입력하는 등의 실수도 컴파일시 걸러내지 못하고 실행 시점에 
오류가 발생한다.   

한편 자바와 달리 코틀린에서는 타입을 직접 명시할 필요 없다. 대부분의 경우 
코틀린 컴파일러가 문맥으로 변수 타입을 자동으로 유추할 수 있기 때문에 
생략 가능하다. (타입 추론)     

여기서 반환 타입을 생략할 수 있는 이유는 무엇일까?   
`코틀린은 사용자가 반환 타입을 적지 않아도 컴파일러가 함수 본문 식을 
분석해서 식의 결과 타입을 함수 반환 타입으로 정해주기 때문에 생략이 
가능하다.`   

#### 1-1-2) 함수형 프로그래밍과 객체지향 프로그래밍   

코틀린은 함수형 스타일로 프로그램을 짤 수 있게 지원한다. 하지만 이를 강제하지는 
않으며, 객체지향과 함수형 접근 방법을 함께 조합해서 문제에 가장 적합한 
도구를 사용하면 된다.  

코틀린은 함수형 프로그램을 풍부하게 지원하며, 다음과 같다.   

- 함수 타입을 지원함에 따라 어떤 함수가 다른 함수를 파라미터로 받거나 
함수가 새로운 함수를 반환할 수 있다.   
- 람다 식을 지원함에 따라 번거로운 준비 코드를 작성하지 않아도 코드 블록을 
쉽게 정의하고 여기저기 전달할 수 있다.   
- 데이터 클래스는 불변적인 값 객체를 간편하게 만들 수 있는 구문을 
제공한다.  
- 코틀린 표준 라이브러리는 객체와 컬렉션을 함수형 스타일로 
다룰 수 있는 API를 제공한다.   



- - - 

# 2. 코틀린 프로퍼티(property)와 클래스    

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
    val person = Person()   // new 키워드를 사용하지 않고 생성자를 호출한다.   
    person.name = "Ready"

    println(person.name) // Dev.Ready   
}
```   

위 예제를 보면 setter를 커스텀하게 만든 소스에서 낯선 내용이 등장한다.   
`그건 바로 Backing Field라고 불리는 field이다.`   
코틀린에서는 클래스 내에서 직접적으로 Fields에 대해 선언할 수 없으나 
`프로퍼티가 Backing Field를 필요로 할 때 자동으로 Accessor 메서드 안에서 
참조할 수 있도록 field라는 식별자를 제공해준다.`       

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

# 3. 코틀린의 변수   

변수 선언시 사용하는 키워드는 다음과 같은 2가지가 있다.   

- val(값을 뜻하는 value에서 따옴) : 변경 불가능한(immutable) 참조를 저장하는 
                                    변수다. val로 선언된 변수는 일단 
                                          초기화하고 나면 변경 불가능하다. 
                                            자바로 말하자면 final 변수에 
                                            해당한다.   

- var(변수를 뜻하는 variable에서 따옴) : 변경 가능한(mutable) 참조다. 이런 
                                         변수 값은 바뀔 수 있다. 자바의 
                                                일반 변수에 해당한다.   


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
var s2 = "$s1 and $v"     // 문자열 템플릿 사용

var s3 = """   // 문자열 여러줄로 표현하기    
abc
def
efg
###           // 줄바꿈이나 특수문자까지 그대로 문자열로 사용 가능하다.   
"""
```

`기본적으로 모든 변수를 val 키워드를 사용해 불변 변수로 선언하고, 나중에
꼭 필요할 때에만 var로 변경하는 것을 권장한다.`

`val 변수는 블록을 실행할 때 정확히 한 번만 초기화 돼야 한다. 하지만
어떤 블록이 실행될 때 오직 한 초기화 문장만 실행됨을 컴파일러가
확인할 수 있다면 조건에 따라 val 값을 다른 여러 값으로 초기화 할 수도 있다.`    

```kotlin
val message: String   // 타입을 명시하면 초기화 없이 선언 가능 
    if(a == "Kotlin"){
        message = "hello"
    }
    else message ="world"
```   

`즉, val 참조 자체는 불변일지라도 그 참조가 가르키는 객체의 내부 값은 
변경될 수 있다는 사실을 꼭 기억해야 한다.`   
아래와 같은 코드는 완전히 올바른 코틀린 코드이다.   

```kotlin
val languages = arrayListOf("Java") // 불변 참조를 선언한다.
languages.add("Kotlin")          // 참조가 가르키는 객체 내부를 변경한다.   
```

`또한, var 키워드에 대해서 오해할 수 있는 부분을 살펴보면, 변수의 값을 
변경할 수 있지만, 변수의 타입은 고정돼 바뀌지 않는다.`       
예를 들어 다음코드는 컴파일 할 수 없다.   

```kotlin
var answer = 42
answer = "no answer" // 컴파일 오류 발생 Error: type mismatch  
```   

컴파일러는 변수 선언 시점의 초기화 식으로부터 변수의 타입을 추론하며, 
    변수 선언 이후 변수 재대입이 이뤄질 때는 이미 추론한 변수의 
    타입을 염두에 두고 대입문의 타입을 검사한다.   

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

# 6. if, when, for, while, enum      

### 6-1) if   

if 구문의 경우 보통의 언어들과 같지만 if문을 식으로 사용하여 값을 리턴 하여 
사용할 수도 있다.   

```kotlin   
val a = 7   
val b = 2   
val bigger = if (a > b) a else b     
```  

코틀린의 if가 값을 만들어 내기 때문에 자바와 달리 3항 연산자가 따로 없다.   

### 6-2) enum   

자바에서 마찬가지로 코틀린도 enum을 아래와 같이 정의가 가능하다.   

```kotlin
enum class Color {
    RED, ORANGE, YELLOW
}
```

자바와 마찬가지로 enum은 단순히 값만 열거하는 존재가 아니다. `enum 클래스 안에서도 
프로퍼티나 메소드를 정의할 수 있다.` 다음은 프로퍼티와 메소드를 enum안에서 
선언하는 방법을 보여준다.   

```kotlin
enum class Color(
    val r: Int, val g: Int, val b: Int // 상수의 프로퍼티를 정의한다.
) {
    RED(255, 0, 0), ORANGE(255, 165, 0), // 각 상수를 생성할 때 그에 대한 프로퍼티 값을 지정한다.
    YELLOW(255, 255, 0);  // 반드시 세미콜론을 사용해야 한다.   

    fun rgb() = (r * 256 + g) * 256 + b // enum 클래스 안에서 메소드를 정의한다.
}

println(Color.RED.rgb())
```

enum에서도 일반적인 클래스와 마찬가지로 생성자와 프로퍼티를 선언한다. 
각 enum 상수를 정의할 때는 그 상수에 해당하는 프로퍼티 값을 
지정해야만 한다. 이 예제에서는 코틀린에서 유일하게 세미콜론(;)이 
필수인 부분을 볼 수 있다.   
`enum 클래스 안에서 메소드를 정의하는 경우 반드시 enum 상수 목록과 
메소드 정의 사이에 세미콜론을 넣어야 한다.`      


### 6-3) when   

`when은 자바의 switch를 대치하되 훨씬 더 강력하며, 앞으로 더 자주 사용할 
프로그래밍 요소라고 생각할 수 있다.`    

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

위의 예제에서 is라는 생소한 키워드가 있는데, `코틀린에서 is를 사용해 변수 
타입을 검사한다.`         

> is 검사는 자바의 instanceof와 비슷하다.   

하지만 자바에서 어떤 변수의 타입을 instanceof로 확인한 다음에 
그 타입에 속한 멤버에 접근하기 위해서는 명시적으로 변수 타입을 캐스팅 해야한다.   

코틀린에서는 프로그래머 대신 컴파일러가 대신 캐스팅을 해준다.   
`어떤 변수가 원하는 타입인지 일단 is로 검사하고 나면 굳이 변수를 원하는 
타입으로 캐스팅하지 않아도 마치 처음부터 그 변수가 원하는 타입으로 선언된 
것처럼 사용할 수 있다. 이를 스마트 캐스트(smart cast)라고 부른다.`   

```kotlin
if(e is Sum) {
    return e.right + e.left  //is 검사가 완료되면 스마트 캐스트가 이루어진다.  
}
```

주의할 점은 `스마트 캐스트는 is로 변수에 든 값의 타입을 검사한 다음에 
그 값이 바뀔 수 없는 경우에만 동작한다.`   
예를들어 클래스의 프로퍼티에 대해 스마트 캐스트를 사용한다면 
그 프로퍼티는 반드시 val이어야 하며 커스텀 접근자를 사용한 것이여도 
안된다.   
val이 아니거나 val이지만 커스텀 접근자를 사용하는 경우에는 해당 프로퍼티에 
대한 접근이 항상 같은 값을 내놓는다고 확신할 수 없기 때문이다.   
원하는 타입으로 명시적으로 타입 캐스팅하려면 as 키워드를 사용할 수도 있다.   

```kotlin
val n = e as Num   
```



`또한, 자바에서는 break를 빼먹어서 오류가 생기는 경우가 자주 있었지만 코틀린의 
        when을 사용할 경우 분기의 끝에 break를 넣지 않아도 된다.`   
한 분기 안에 여러 값을 매치 패턴으로 사용하려면 콤마(,)로 분리하면 된다. 아래 
예제를 보자.   

```kotlin
fun getWarmth(color: Color) = when(color) {
    Color.RED, Color.ORANGE -> "warn"
    Color.BLUE -> "cold"
}
```   

`코틀린의 when이 자바의 switch 보다 훨씬 강력한 이유는 분기 조건에 
enum이나 리터럴값만 사용할 수 있는 자바와 달리 코틀린의 when은 
임의의 객체를 허용한다.`   

다음 코드를 살펴보자.   

```kotlin
fun mix(c1: Color, c2: Color) =
    when(setOf(c1, c2)) {              // when 식의 인자로 아무 객체나 사용할 수 있다.   
        setOf(RED, YELLOW) -> ORANGE
        setOf(BLUE, YELLOW) -> GREEN
        else -> throw Exception("error")  // 매치되는 분기 조건이 없으면 이 문장 실행 
    }
// println(mix(BLUE, YELLOW))
```


### 6-4) for  

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

인덱스와 함께 컬럭션을 이터레이터도 가능하다.   

```kotlin
val list = arrayListOf("10", "11", "1001")
for((index, element) in list.withIndex()) {
    println("$index: $element")
}

// 0: 10
// 1: 11
// 2: 1001
```

`위의 예제에서 in 연산자 사용해서 for문을 이터레이터 했는데, in으로 
컬렉션이나 범위의 원소를 검사할 수도 있다.`   

아래와 같이 in과 !in 연산자를 when 식에서 사용해도 된다.   

```kotlin
fun recognize(c: Char) = when (c) {
    in '0'..'9' -> "It's a digit!"  // c 값이 0부터 9사이에 있는지 검사   
    in 'a'..'z', in 'A'..'Z' -> "It's a letter" // 여러 범위 조건을 함께 사용해도 된다.   
}

// c in 'a'..'z' => 'a' <= c && c <= 'z' 로 변환된다.   
```



### 6-5) while   

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

**Reference**     

<https://wooooooak.github.io/kotlin/2019/05/24/property/>   
<https://github.com/RumbleKAT/WeekEndStudy/blob/main/kotlin.md>   
<https://velog.io/@gosgjung/%EC%BD%94%ED%8B%80%EB%A6%B0%EC%96%B8%EC%96%B4-%EA%B8%B0%EB%B3%B8%EA%B0%9C%EB%85%90-%EC%B4%9D%EC%A0%95%EB%A6%AC-%EC%8A%A4%EC%95%95%EC%A3%BC%EC%9D%98>   

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

