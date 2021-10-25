---
layout: post
title: "[Kotlin] 코틀린 Null 처리"     
subtitle: "nullable, non-nullable / safe call / safe cast / Elvis Operation / !! 연산자 "    
comments: true
categories : Kotlin
date: 2021-10-19
background: '/img/posts/mac.png'
---

코틀린에서는 자바보다 null 처리를 좀 더 명확하게 한다.   
따라서 NPE(Null Pointer Exception)가 발생하는 빈도를 현저히 낮출 수 있다.   
이 글에서는 자바와 비교하여 코틀린에서 null을 처리하는 다양한 방법에 
대해서 살펴볼 예정이다.     

- - - 


## 1. 코틀린에서 Null을 처리하는 방법   

자바의 경우 int, boolean과 같은 primitive type을 제외한 객체들은 항상 
null이 될 수 있다.   

```java
public int getLen(String str) { 
    return str.lengh(); 
}
```   

자바에서 위 함수는 컴파일시 문제없이 빌드 되지만, runtime에 인자로 null이 
들어오게 되면 NPE가 발생한다.   

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

위의 방법 외에도 null을 처리하는 다양한 방법에 대해서 더 자세히 알아보자.     

- - - 


## 2. nullable 타입을 non-nullable 타입으로 변경    

코틀린은 nullable과 non-nullable 개념을 만들어, null에 안전한 프로그램을
만들 수 있게 도와준다. 그래서 코틀린만
사용한다면 Null Pointer Exception 같은 예외가 발생하지 않을 수도 있다.
`하지만, 코틀린에서는 NPE가 발생하지 않을 것 같지만 자바의 라이브러리를 쓰는
경우 NPE가 발생할 수 있다.` 자바에서는 non-nullable 타입이 없기 때문에
자바 라이브러리를 사용할 때 nullable 타입으로 리턴 된다.

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

- - - 

## 3. 안전하게 nullable 프로퍼티 접근하기   

코틀린에서 nullable 프로퍼티를 사용할 때 안전하게 사용하는 
다양한 방법들에 대해서 알아보자.    

### 3-1) 조건문으로 nullable 접근   

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

### 3-2) Safe call 연산자로 nullable 접근 ( ?. )

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

### 3-3) 안전하게 nullable 프로퍼티 할당   

어떤 프로퍼티를 다른 프로퍼티에 할당할 때, 객체가 null인 경우 
default 값을 할당하고 싶을 수 있다. 자바에서는 삼항연산자를 
사용하여 아래 코드처럼 객체가 null인 경우 default 값을 설정해줄 수 
있다.   

```java
String b = null;
int l = (b != null) ? b.length() : -1;
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
    - 코틀린에서 형변환할 때 Safe Cast를 이용하면 안전하다. 아래코드에서 string은 문자열이지만 Any타입니다.    
    - as?를 이용하여 String과 Int로 형변환을 시도하고 있다. String은 가능하기 때문에 성공하였고, Int는 타입이 맞지 않기 때문에 null을 리턴하였다.   
    ```kotlin
    val string: Any = "AnyString"
    val safeString: String? = string as? String
    val safeInt: Int? = string as? Int
    println(safeString) // AnyString
    println(safeInt)    // null
    ```
    - 실행 결과를 보면 safeInt는 캐스팅이 실패하여 null이 할당되었다.   

#### 3-4) Collection의 Null 객체를 모두 제거   

Collection에 있는 null 객체를 미리 제거할 수 있는 함수도 제공한다.    
다음은 List에 있는 null 객체를 filterNotNull 메서드를 이용하여 삭제하는 
코드이다.   

```kotlin
val nullableList: List<Int?> = listOf(1, 2, null, 4)
val intList: List<Int> = nullableList.filterNotNull()
println(intList) // [1, 2, 4]   
```  

실행 결과를 보면 null이 제거된 나머지 아이템들만 출력된다.   

- - - 

**Reference**     

<https://codechacha.com/ko/kotlin-null-safety/>   
<https://tourspace.tistory.com/114>   

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

