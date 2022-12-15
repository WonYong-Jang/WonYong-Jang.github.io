---
layout: post
title: "[Scala] implicit"
subtitle: "암시적 파라미터, 암시적 변환 "    
comments: true
categories : Scala
date: 2022-02-25
background: '/img/posts/mac.png'
---

## implicit 변환    

스칼라의 암묵적 변환은 자바나 파이썬 등에서는 찾아볼 수 없는 
스칼라의 특별한 문법이다.      

`아래는 암묵적 변환을 보여주는 대표적인 코드로써 실행하면 "Hello, Kaven"이 
호출된다. 이 코드가 특별한 이유는 sayHello()메서드에 인자값으로 
Person 객체를 전달해야 하는데 문자열을 전달하고 있기 때문이다.`   

```scala 
object ImplicitTest {
  def main(args: Array[String]): Unit = {

    case class Person(name: String)

    implicit def stringToPerson(name: String) : Person = Person(name)

    def sayHello(p: Person): Unit = {
      println("Hello, "+p.name)
    }

    sayHello("kaven!")
  }
}
```

이것이 가능한 이유는 바로 스칼라의 암묵적 변환 때문인데 implicit으로 선언된 
stringToPerson()이라는 메서드가 스칼라 컴파일러에 의해 자동으로 호출됐기 
때문이다.     
`즉, sayHello("kaven!")이라고 호출했을 때 정상적인 경우라면 오류를 발생시키고 
종료돼야 하지만 스칼라에서는 implicit으로 선언된 메서드 중에 
문자열을 Person으로 변환할 수 있는 
메서드가 호출 가능한 범주 내에 선언돼 있는지를 조사해 봐서, 있다면 그 메서드를 
먼저 호출해 문자열을 Person으로 바꾸고 그 결과로 sayHello()를 호출한다.`    

암묵적 호출의 또 다른 형태는 좀 더 당황스러운 코드를 만들어 내기도 한다.   

```scala    
object ImplicitTest {
  def main(args: Array[String]): Unit = {

    case class Person(name: String)

    implicit class myClass(name: String) {
      def toPerson: Person = {
        Person(name)
      }
    }

    def sayHello(p: Person): Unit = {
      println("Hello, "+p.name)
    }

    sayHello("kaven!".toPerson)
  }
}

```

위 코드 역시 실행하면 "Hello, kaven!"이 호출된다. 그런데 이번에는 sayHello() 메서드를 
호출하면서 "kaven!".toPerson과 같이 문자열에는 없는 toPerson이라는 메서드를 
호출하고 있다.   

`실제로 이 메서드는 String이 아닌 myClass라는 클래스에 정의된 메서드로써 이 역시 
스칼라 컴파일러에 의해 암묵적으로 호출된 것이다.`   

`이 경우 myClass 앞에 implicit라는 키워드가 표시돼 있는 것이 중요한데 스칼라 
컴파일러는 특정 객체에서 그 객체에 존재하지 않는 메서드가 호출됐을 때 
암묵적으로 호출 가능한 메서드가 있는지 찾아보고 있다면 
그것을 호출해 주는 역할을 수행하기 때문이다.`    

이처럼 원래 클래스에는 없는 메서드를 암묵적 변환 방법을 사용해서 
타입별로 다르게 구현하여 추가하는 방법을 흔히 `타입 클래스 패턴`이라고 하며, 
    특히, 스파크SQL에서 이와 같은 형태를 자주 볼 수 있다.      

예를 들어, 스파크SQL에서 튜플의 시퀀스를 데이터셋 등으로 변환하거나 
컬럼명을 나타내는 문자열을 컬럼 객체로 변환할 때 spark.implicits._ 와 같은
 방법으로 사용하는데, 이는 SparkSession.implicits 클래스에 
 정의된 암묵적 변환 요소들을 임포트함으로써 원래의 Seq나 Tuple, List, String 
 등에는 없는 메서드를 마치 해당 클래스에 있는 것처럼 사용하기 위함이다.   

따라서 만약 암묵적 변환을 사용하지 않았다면 매번 변환을 위한 코드를 
일일이 적어야 했을 것이다.   

사실 암묵적 변환은 단순히 코드를 간결하게 해주는 것 말고도 스칼라의 타입 시스템 
및 제네릭과 연동되어 스칼라의 정교한 타입 시스템을 제어하는 곳에도 응용되고 
있다. 지금 당장 스칼라 코드를 작성하지 않더라도 스칼라의 함수적 
특징과 타입 시스템에 대해 알아두는 것은 스파크를 비롯한 
여러 부분에서 크게 도움이 될 것이다.    





- - - 

**Reference**    

<https://partnerjun.tistory.com/56>     
<https://groups.google.com/g/scala-korea/c/dfkcfM5yM9M>   
<https://docs.scala-lang.org/ko/tour/tour-of-scala.html>     
<https://docs.scala-lang.org/ko/tutorials/scala-for-java-programmers.html#%EC%8B%9C%EC%9E%91%ED%95%98%EB%A9%B4%EC%84%9C>    
<https://partnerjun.tistory.com/11>   
<https://sung-studynote.tistory.com/73>    

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

