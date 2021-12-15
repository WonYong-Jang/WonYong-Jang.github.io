---
layout: post
title: "[Kotlin] 컬렉션 및 함수 정의와 호출"     
subtitle: "확장 함수와 확장 프로퍼티 / 최상위 함수와 로컬 함수 / 중위 호출 문법 / 가변 인자/ 구조 분해 선언(destructuring declaration)"    
comments: true
categories : Kotlin
date: 2021-10-21
background: '/img/posts/mac.png'
---

이번글에서는 모든 프로그램에서 핵심이라 할 수 있는 
함수 정의와 호출 기능을 코틀린이 어떻게 개선했는지 살펴본다.   

- - - 

## 1. 코틀린에서 컬렉션 만들기    

먼저, 코틀린에서 컬렉션을 어떻게 지원하는지와 여러가지 사용방법에 대해 살펴보자.   
`아래와 같이 컬렉션을 사용할 수 있으며, 표준 자바 컬렉션을 그대로 
지원하기 때문에 자바 코드와 상호작용하기에 유리하다.`   
또한, 코틀린 컬렉션은 자바 컬렉션과 똑같은 클래스지만, 코틀린에서는 
자바보다 더 많은 기능을 쓸 수 있다. 예를 들어 리스트의 
마지막 원소를 가져오거나 수로 이루어진 콜렉션의 최대값을 찾을 수 있다.   

```kotlin
val set: HashSet<Int> = hashSetOf(1, 7, 2) // hashSet
val list: ArrayList<Int> = arrayListOf(1, 7, 2) // arrayList
val map: HashMap<Int, String> = hashMapOf(1 to "one", 2 to "two") // hashMap
val strings: List<String> = listOf("first", "second", "fourteenth") // List
```

- - - 

## 2. 함수를 호출하기 쉽게 만들기   

`코틀린으로 작성한 함수를 호출할 때는 함수에 전달하는 인자 중 일부(또는 전부)의 
이름을 명시할 수 있다.`   

```kotlin
joinToString(strings, separator = " ", prefix = " ", postfix = ".")

fun joinToString(collections: List<String>, separator: String, prefix: String, postfix: String) {
    // ...
}
```

이름을 붙인 인자는 다음에 살펴볼 디폴트 파라미터 값과 함께 사용할 때 쓸모가 
많다.   

#### 2-1) 디폴트 파라미터 값   

자바에서 일부 클래스에서 오버로딩한 메소드가 너무 많아진다는 문제가 있다.   

> java.lang.Thread 구현을 살펴보면 많은 오버로딩을 볼 수 있다.   

`코틀린에서는 함수 선언에서 파라미터의 디폴트 값을 지정할 수 있으므로 
이런 오버로드 중 상당수를 피할 수 있다.`   

```kotlin
fun <T>joinToString (
    collections: Collection<T>,
    separator: String = ", ",
    prefix: String = "",
    postfix: String = "" ) {
}
```

함수의 디폴트 파라미터 값은 함수를 호출하는 쪽이 아니라 함수 선언하는 쪽에서 지정해야 한다.   

자바에는 디폴트 파라미터 값이라는 개념이 없어서 코틀린 함수를 자바에서 
호출해야 하는 경우에는 그 코틀린 함수가 디폴트 파라미터 값을 제공하더라도 
모든 인자를 명시해야 한다.   

`이럴때, @JvmOverloads 애노테이션을 함수에 추가할 수 있다. 함수에 
추가하면 코틀린 컴파일러가 자동으로 맨 마지막 파라미터부터 파라미터를 
하나씩 생략한 오버로딩한 자바 메소드를 추가해준다.`   
다시말하면, 모든 경우의 메소드를 모두 생성해준다.   

```kotlin
@JvmOverloads fun<T> joinToString ( collection: Collection<T>,
        // ...
) {}  

// 자바에서 아래와 같이 사용 
String joinToString(Collection<T> collection, String seperator, String prefix, String postfix);
String joinToString(Collection<T> collection, String seperator);
```

#### 2-2) 최상위 함수와 프로퍼티    

자바에서는 모든 코드를 클래스 기반에서 작성해야 한다. 하지만 특정 
도메인 영역에는 포함되기 어려운 유틸에 관련된 변수나 메소드를 생성해야 
할 경우가 있는데, 클래스를 하나 생성하고 그 클래스에 static 멤버로 선언하여 
사용하는 것이 보통이다.   

- `코틀린에서는 이런 무의미한 클래스가 필요 없다.`   
- `코틀린에서는 코틀린 파일(.kt)의 최상위 수준, 모든 다른 클래스의 밖에 선언된 메서드와 프로퍼티는 static 멤버로 처리한다.`   
- `이런 함수나 프로퍼티는 패키지의 멤버이므로 다른 패키지에서 사용하고자 한다면 해당 패키지를 import 해야 한다.`   

아래와 같이 strings라는 이름의 패키지에 prefix.kt라는 파일을 생성하여 함수 하나를 선언해보자.   

```kotlin
package strings

fun prefixAddFirst(s: String, prefix: String): String {
    return prefix+s
}

>>> print(prefixAddFirst("hello", "Juhee! "))
Juhee! hello
```

`코틀린도 JVM에서 실행되기 때문에, 코틀린 컴파일러는 이 파일을 컴파일 할 때 
코틀린 파일명으로 새로운 클래스를 정의해준다.`   
예제와 같은 경우 파일명이 prefix.kt이므로 PreFixKt라는 이름으로 클래스가 
만들어진다.   
컴파일 후에는 자바에서는 다음과 같은 코드로 인식될 것이다.   

```java
package strings

public class PrefixKt {
  public static String prefixAddFirst(String s, String prefix) {
    return prefix+s
  }
}
```   

> 코틀린 최상위 함수가 포함되는 클래스의 이름을 바꾸고 싶다면 파일에 @JvmName 어노테이션을 
추가하면 된다.   

```kotlin
@file:JvmName("StringFunctions")  // 클래스 이름을 지정하는 애노테이션   

package strings // 어노테이션 다음에 패키지 문이 와야 한다.   

fun jointToString(...): String {...}
```

함수와 마찬가지로 프로퍼티도 파일의 최상위 수준에 놓일 수 있다.   

```kotlin
var opCount = 0 // 최상위 프로퍼티를 선언한다.

fun performOperation() {
    opCount++  // 최상위 프로퍼티의 값을 변경한다.
}

fun reportOperationCount() {
    print("Operation performed $opCount times") // 최상위 프로퍼티 값을 읽는다.   
}
```   

함수와 마찬가지로 최상위 프로퍼티도 정적 필드에 저장 된다.     
최상위 프로퍼티를 활용해 val로 선언하면 상수로 사용할 수 있다.   

```kotlin
val UNIX_LINE_SEPARATOR = "\n"
```   

기본적으로 최상위 프로퍼티도 일반적인 프로퍼티처럼 접근자 메소드(getter, setter)를 통해 자바코드에 노출된다.     

> val의 경우 게터, var의 경우 게터와 세터가 생긴다.   

이를 자바에서 사용하려면 getter를 이용해야 하므로, 자연스럽지 못하다. 더 
자연스럽게 사용하려면 이 상수를 public static final 필드로 컴파일 해야 한다.   
const 변경자를 추가하면 프로퍼티를 public static final 필드로 
컴파일하게 만들 수 있다.    

```kotlin
const val UNIX_LINE_SEPARATOR = "\n"
```

위 코드는 다음 자바와 동일한 바이트 코드를 만들어 낸다.   

```java
public static final String UNIX_LINE_SEPARATOR = "\n"
```   

- - - 

## 3. 메소드를 다른 클래스에 추가(확장 함수, 확장 프로퍼티)    

#### 3-1) 확장 함수   

`코틀린에서 확장함수는 어떤 클래스의 멤버 메소드인 것처럼 호출할 수 있지만 
그 클래스의 밖에 선언된 함수다.`     
`따라서 확장함수는 이미 정의된 클래스에 새로운 기능을 추가하여 
사용하고자 할 때 기존 클래스를 수정하지 않고도 필요한 기능을 
추가할 수 있다.`   

아래는 String 객체를 확장한 함수이다.   

```kotlin
fun String.lastChar():Char = this.get(this.length - 1)   

// String.lastChar() 중 String을 수신 객체 타입이라고 한다.   
// this.get(this.length - 1) 중 this를 수신 객체라고 한다.   
```

확장 함수를 만들려면 추가하려는 함수 이름 앞에 그 함수가 확장할 
클래스의 이름을 덧붙이기만 하면 된다.   
클래스 이름을 수신 객체 타입(receiver type)이라 부르며, 확장 함수가 
호출되는 대상이 되는 값을 수신 객체(receiver object)라고 부른다.   

<img width="495" alt="스크린샷 2021-12-15 오전 8 35 17" src="https://user-images.githubusercontent.com/26623547/146096251-9fec7745-344b-4f1e-9e9f-a4bd5dcfbadf.png">   

```kotlin
println("kotlin".lastChr()) 
// 여기서 수신객체는 kotlin이며, 수신객체 타입은 String 이다.   
``` 

위의 사용은 마치 String 클래스에 새로운 메소드를 추가하는 것과 같다.   
`위 확장함수 식에서 this는 생략 가능하다.`   

- 확장 함수 내부에서 일반적인 인스턴스 메소드의 내부에서와 마찬가지로 수신 객체의 메소드나 프로퍼티를 바로 사용할 수 있지만 캡슐화를 해치치 않는다.   

- `클래스 안에서 정의한 메소드와 달리 확장 함수 안에서 클래스 내부에서만 사용할 수 있는 private 멤버나 protected 멤버를 사용할 수 없다.`      

- 확장함수는 프로젝트 안의 모든 소스코드에서 사용할수 있는 것은 아니고, 
    다른 파일(.kt)에서 사용하기 위해서는 그 함수를 import 해야 한다.   

- 한 파일 안에서 다른 여러 패키지에 속해 있는 이름이 같은 함수를 가져와야 한다면, 충돌을 막기 위해 as 키워드를 이용해서 이름을 변경할 수 있다.   

    ```kotlin
    import strings.lastChar as last
    val c = "Kotlin".last()
    ```

- `확장 함수는 오버라이드 할 수 없다. 확장 함수는 클래스의 일부가 아니라 클래스 밖에 선언 되기 때문이다.`      

- 자바에서는 확장함수를 StringUtil.kt파일에 정의했다면, StringUtilKt.lastChar("java")로 호출 가능하다.   


#### 3-2) 확장 프로퍼티   

확장 함수를 이용하여 확장 프로퍼티를 만들 수 있다. 
바로 멤버변수의 accessor를 확장함수로 커스텀 하는 방법인데, 
    위에서 만난 확장 함수를 확장 프로퍼티로 변경하는 
    코드를 살펴보자.   

```kotlin
fun String.lastChr(): Char = this.get(this.length - 1)

//getter함수를 확장함수로 커스텀 하여 확장프로퍼티로 만듦
val String.lastChr : String
  get() = get(length-1)
```

이런식으로 setter를 커스텀하여서도 가능하다.   

```kotlin
var StringBuilder.lastChar: Char
  get() = get(length-1)
  set(value: Char) {
      this.setCharAt(length - 1, value)
  }

>>> println("Kotlin".lastChr)
n
>>> val sb = StringBuilder("Kotlin?")
>>> sb.lastChr = '!'
>>> println(sb)
Kotlin!
```

- - - 

## 4. 컬렉션 처리(가변 길이 인자, 중위 함수 호출)   

#### 4-1) 가변 인자 함수  

자바에서는 가변 인자로 타입뒤에 "..." 을 사용한다.   
코틀린에서는 vararg 변경자를 붙인다.  

```java
//자바
public static void main(String... args) { ... }
```

```kotlin
//코틀린
fun main(vararg  values: String) {
    val list = listOf("list=", *values) //*연산자가 배열 내용을 펼쳐줍니다
    println(list)
}

main("a","b","c") //"[list=, a, b]" 출력
```

#### 4-2) 중위 호출   

`1 to "one" 처럼 to 를 중간에 사용하는 것을 중위 호출이라고 한다.`   
`이때 to는 일반 메소드이다.`   

```kotlin
val mapData = mapOf(
    1 to "one",   //1(객체) to(메소드이름), "one"(유일한 인자)
    2 to "two",   //to 메소드를 공백으로 구분하여 사용 가능
    3.to("three") //to는 메소드이기때문에 .to(...) 로도 사용 가능
)
```

일반 메소드를 중위 호출이 가능하도록 만드려면 infix 변경자를 메소드 
앞에 추가해야 된다.   
infix 변경자의 인수는 한개만 가능하다.   

```kotlin
//infix 를 사용한 중위 호출 생성
infix fun Any.to(other:Any) = Pair(this, other)

//잘못된 사용. 컴파일 에러. 인수는 한개여야 합니다
infix fun Any.to(other:Any, other2:Any) = Pair(this, other)
```   

#### 4-3) 구조 분해 선언   

코틀린 표준 라이브러리 클래스 중에서 Pair 클래스가 있다.   
Pair 클래스는 두 쌍의 값을 가지고 있다.    

1 to "one" 중위 호출은 Pair 클래스를 리턴하고,   
  이 Pair는 (number, name)에 값을 설정한다.   

```kotlin
val (number, name) = 1 to "one" //number=1, name="one"
```  

구조 분해 선언은 for 문에서 인덱스와 값을 변수에 저장할 수 있다.   

```kotlin
for((index, value) in list.withIndex()) { //withIndex() 를 이용해서 구조 분해 선언
            println("$index, $value")
}
```



- - - 

**Reference**     

<https://lovia98.github.io/blog/kotlin-static.html>   
<https://hongku.tistory.com/360>   
<https://pompitzz.github.io/blog/Kotlin/kotlinInAction.html#%E1%84%8E%E1%85%AC%E1%84%89%E1%85%A1%E1%86%BC%E1%84%8B%E1%85%B1-%E1%84%92%E1%85%A1%E1%86%B7%E1%84%89%E1%85%AE%E1%84%8B%E1%85%AA-%E1%84%8E%E1%85%AC%E1%84%89%E1%85%A1%E1%86%BC%E1%84%8B%E1%85%B1-%E1%84%91%E1%85%B3%E1%84%85%E1%85%A9%E1%84%91%E1%85%A5%E1%84%90%E1%85%B5>    

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

