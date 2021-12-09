---
layout: post
title: "[Kotlin] Break and Continue, Return label"     
subtitle: "람다식에서 return문 사용할 때 주의사항"    
comments: true
categories : Kotlin
date: 2021-11-30
background: '/img/posts/mac.png'
---

`코틀린은 모든 표현식에 label을 붙일 수 있다.`      
`라벨은 식별자 뒤에 @를 붙이는 식으로 완성한다.`   
예를 들어 abc@, fooBar@들은 유효한 라벨이다. 

## Break and Continue Labels   

## Return at Labels  

- - - 

## 람다식에서 return문 사용하기   

코틀린은 함수형 프로그래밍을 지원하기 때문에 익명함수, 람다식을 
사용할 경우가 흔하다.   
map, filter, reduce, forEach 등 함수를 인자로 받는 함수들(고차함수)의 
매개변수로 우리만의 로직이 담긴 함수를 넘길 때 
람다를 자주 사용한다.   
자주 사용하는 만큼 꼭 알고 사용해야할 부분이 있다.   

#### 1. 일반 함수를 넘겼을 때   

일반적으로 함수 내부의 return은 그 함수만 종료시킨다. 물론 코틀린의 label을 
사용해서 종료시킬 함수를 지정할 수 있지만 그렇지 않은 경우 `return문을 
포함하는 가장 가까운 함수를 종료시키게 된다.`    
우선 람다식이 아니라 일반적인 익명 함수를 넣은 예시를 보자.   

```kotlin
fun exampleFunc() {
    var ints = listOf(0,1,2,3)
    ints.forEach(
        fun(value: Int) {
            if (value == 0) return
            print("value ")
        }
    )
}

// 1 2 3
```

0, 1, 2, 3이 담긴 배열에서 forEach를 돌며 0이 아닌 요소만 출력하는 함수다. 
우선 forEach의 인자로 이름없는 함수를 넘겨주었다.    
이 경우는 if문에서 value == 0 이 걸리게 되며 우리가 넘긴 이름 없는 
함수만 종료된다.   
이것은 위에서 언급했듯이 `일반적인 함수로써 함수 내부의 return은 그 함수만 
종료시킨다는 원칙에 맞는 현상이다.`      

#### 2. 람다식을 넘겼을 때   

```kotlin
fun exampleFunc2() {
    var ints = listOf(0,1,2,3)
    ints.forEach {
        if (it == 0) return
        print(it)
    }
}
// 아무것도 출력되지 않음
```

forEach의 인자로 람다식을 넘기니 결과값이 달라진다. 왜 그럴까?   
`람다식은 자기 자신의 block 범위를 가지지 않기 때문이다. 즉, 람다식 내부의 
context는 자신을 감싸고 있는 외부 block인 것이다.`   
따라서 위의 코드의 경우, 람다식 내부의 return은 자기 자신을 종료시키는 
것이 아니라 exampleFun2를 종료시킨다.   

#### 3. 람다식에 대해서만 return 하고 싶다면?   

`람다식 자체만 return으로 끝내고 싶다면 위에서 언급한 코틀린의 label문법을 
사용하면 된다.`   

```kotlin
fun exampleFunc3() {
    var ints = listOf(0,1,2,3)
    ints.forEach label@ {
        if (it == 0) return@label
        print(it)
    }
}
// 1 2 3
```

람다식에서 return문을 만나게 되면, 원래는 자신의 context는 exampleFun3이기 때문에 
exampleFun3이 종료되어야 한다. 하지만, `label을 return하도록 코딩했으므로 해당 
라벨이 가르키는 자기 자신(람다)만 종료된다.`   
`주의해야 할 점은 forEach가 끝이나는게 아니라 forEach로 넘겨준 람다가 
끝이 난다는 것이고, forEach로 여러번 실행시킨 람다들 중에 
조건에 맞는 람다만 종료된다는 것이다.`

#### 3. 매번 label을 사용해야하나?   

이런식으로 람다를 사용할 일이 굉장히 많은데 그때마다 label을 사용해야 할까?    
물론 완전히 안쓸수는 없지만 label을 줄일 수는 있다.   

`암시적 label이란 것을 사용하면 label을 줄일 수 있다. 람다식을 사용할 때 
암시적 label은 자동으로 람다가 사용된 함수의 이름이 된다.`   
예를 들어 forEach()가 람다를 사용했다면, 그 람다의 암시적 label이름은 
"forEach"인 것이다.   
아래 예제를 보자.   

```kotlin
fun exampleFunc4() {
    var ints = listOf(0,1,2,3)
    ints.forEach {
        if (it == 0) return@forEach
        print(it)
    }
}
// 1 2 3
```

위 코드처럼 람다식 첫 부분에 label을 따로 명시하지 않아도 된다. 암시적 label이 
forEach를 가르키기 때문이다.    
만약 ints.forEach가 아니라 ints.map을 사용할 때면 람다식 내부의 return문에 
return@map과 같이 선언해주면 된다.   

#### 4. 람다가 아닌 forEach를 끝내는 방법   

위 예제를 조금 변형시켜 리스트의 요소 중 1을 만나면 forEach를 끝내보자.   
그러기 위해선 요소가 1일 때 람다가 종료될 게 아니라 forEach가 종료 되어야 한다.    
코틀린 공식 문서는 아래와 같은 방법의 예제 코드를 내놓았다.   

```kotlin
fun exampleFunc5() {
    var ints = listOf(0,1,2,3)
    run loop@ {
        ints.forEach {
            if (it == 1) return@loop
            print(it)
        }
    }
}
// 0
```

forEach를 감싸는 함수(run)를 선언하여, 조건에 맞을 경우 감싼 함수(run)을 
종료시키면 된다.   

- - - 

**Reference**     

<https://wooooooak.github.io/kotlin/2019/02/16/kotlin_label/>   
<https://kotlinlang.org/docs/returns.html>   

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

