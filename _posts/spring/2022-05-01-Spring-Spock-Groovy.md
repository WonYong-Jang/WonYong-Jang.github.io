---
layout: post
title: "[Spring] Spock을 이용한 테스트 케이스 작성"
subtitle: "스프링과 Spock을 이용한 테스트 / JUnit과 비교" 
comments: true
categories : Spring
date: 2022-05-01
background: '/img/posts/spring.png'
---

## 1. Spock 소개   

`Spock는 BDD(Behaviour-Driven Development) 프레임워크이다.`   
`TDD프레임워크인 JUnit과 비슷한 점이 많으나, 기대하는 동작과 
테스트의 의도를 더 명확하게 드러내주는 산만한 코드는 뒤로 
숨겨주는 등의 큰 장점이 있다.`   

또한, Groovy 기술을 이용해서 작성하지만 Groovy에서는 자바를 편하게 
가져다 사용하기 때문에 자바 코드의 테스팅에도 사용할 수 있다.   

만약 기존에 junit을 사용해본 경험이 있다면 spock을 배우는 것 역시 쉽다.   
junit의 주요 요소들은 모두 spock에 있기 때문이다.  
둘의 구성요소를 비교해보면 아래와 같다.   

<img width="782" alt="스크린샷 2022-04-30 오후 10 14 24" src="https://user-images.githubusercontent.com/26623547/166107075-adae39ae-aba4-4f40-ac6e-146481c3330b.png">   

이제 JUnit을 기반으로 테스트를 작성할 때 불편했던 점과 Spock으로 
해결할 수 있는 부분을 살펴보자.    

- - - 

## 2. Spock 시작하기 

먼저 Spock 플러그인을 설치해보자. 이 플러그인은 테스트 클래스에서 Spock를 
위한 구문 강조와 오류 표시를 지원한다.   

<img width="739" alt="스크린샷 2022-04-30 오후 10 07 17" src="https://user-images.githubusercontent.com/26623547/166106836-9ef0a621-eb42-43a8-827c-d3384192c001.png">   

그 후 Spock를 사용하기 위해서는 아래 의존성을 추가해야 한다.   

```gradle
plugins {
    id 'groovy' // groovy 지원 
    id 'java'
}
```

`spock를 사용하기 위해서는 spock-core를 추가하고, 런타임에 클래스 기반 mock 생성하기 위해서는 
byte-buddy가 필요하다.`    
`또한, 스프링과 같이 사용한다면 spock-spring도 추가해준다.`       

```gradle
testImplementation('org.spockframework:spock-core:2.1-groovy-3.0')
testImplementation('org.spockframework:spock-spring:2.1-groovy-3.0')   

// 런타임에 클래스 기반 mock을 만들기 위해서 필요 
testImplementation('net.bytebuddy:byte-buddy:1.9.3')   
```



간단한 사용법은 아래와 같다.   

- 테스트 클래스는 Groovy 클래스로 생성하고 Specification 클래스를 상속 받는다.   
- feature(테스트 메서드)는 def를 이용해서 함수로 선언한다.   
- feature의 이름은 명명 규칙과 무관하게 작성하므로 한글로 의도를 명확하게 써줄 수 있다.   
- 테스트를 진행한다.   

`Spock에서는 given(또는 setup), when, then과 같은 코드 블록을 block 이라 부르며, 
    테스트 메서드는 Spock에서 feature 메서드라고 하며 feature 메서드에는 이와 같은 블록이 
    최소한 하나는 들어 있어야 한다.`        

Specification은 extends하면 Spock Test 클래스가 된다.    

Spock에서는 given, when, then 외에 추가로 3개가 더있어 총 6단계의 
라이프사이클을 가지고 있다.   

<img width="600" alt="스크린샷 2022-04-30 오후 11 08 34" src="https://user-images.githubusercontent.com/26623547/166108944-eb6cedcb-6dd1-420f-9d15-966add0fa7aa.png">   

#### 2-1) 첫 번째 테스트 클래스 작성하기   

프로젝트의 src > test > groovy를 에 새로운 Groovy 클래스를 생성한다.   

<img width="300" alt="스크린샷 2022-04-30 오후 11 03 29" src="https://user-images.githubusercontent.com/26623547/166108754-3c5c37ee-1a26-4a16-bf83-ae4dfa9050af.png">    

간단한 Spock 테스트 코드를 통해 살펴보자.   

`groovy 언어로 작성하기 때문에 테스트 메소드 
이름을 문자열로 작성할 수 있게 되었다.`   

> 자바에서도 한글 메서드명이 가능하긴 했지만, 가장 앞에 특수문자 사용하기 등의 
제약조건이 있는 반면, groovy는 이 모든 제약 조건에서 빠져나올 수 있다.   

이제는 정말 명확하게 테스트 케이스의 의도를 표현할 수 있게 되었다.   

```java
import spock.lang.Specification

class MainTest extends Specification{

    def "Hello의 길이는 정말 5글자인가?"() {

        given:
        String input = "hello"

        when:
        int result = input.length()

        then:
        result == 5
    }
}

```

given, when, then 등의 블록들 간의 변수들은 공유되어 사용할 수 있다.  
즉, given: 에서 선언한 변수는 then: 에서도 사용 가능하다.   

#### 2-2) where 블록 이용하여 테스트하기   

여기서 [where 블록](https://spockframework.org/spock/docs/1.0/spock_primer.html)에 대해서 
생소할수 있는데, 아래 예제를 살펴보자.   

```java
class MainTest extends Specification{

    def "computing the maximum of two numbers"() {

        expect:
        Math.max(a, b) == c

        where:
        a | b | c
        5 | 1 | 5
        3 | 9 | 9
    }
}
```

위 코드를 실행해보면 아주 재밌는 결과를 볼 수 있다.   
Math.max(a,b) == c 테스트 코드의 a,b,c에 각각 5,1,5 와 3,9,9가 입력되어 
expect: 메소드가 실행된다.   

`만약 이를 JUnit 기반의 테스트코드로 작성했다면 어떻게 작성했을까?`      
`a, b, c 각 검사 케이스가 많아질 수록 중복코드가 계속해서 발생했을 것이다.`   

`또한, 테스트가 실패되는 경우 JUnit은 제일 처음 실패한 케이스만 알 수 있다면, 
    Spock은 실패한 모든 테스트 케이스와 그 내용을 더 상세히 알려준다.`   

<img width="910" alt="스크린샷 2022-05-01 오후 5 24 34" src="https://user-images.githubusercontent.com/26623547/166138116-cefaf6e0-67c0-481b-bdbb-ee731843236d.png">   

`@Unroll을 추가하여 메소드 이름에 각 변수명들이 매칭되어 테스트 결과에 
각각 값이 반영되어 출력해줄 수도 있다.`      

```java
class MainTest extends Specification{

    @Unroll
    def "computing the maximum of two numbers [입력값1: #a, 입력값2: #b, 결과값: #c]"() {

        expect:
        Math.max(a, b) == c

        where:
        a | b | c
        5 | 1 | 5
        3 | 9 | 9
        2 | 2 | 2
    }
}
```

<img width="549" alt="스크린샷 2022-05-01 오후 6 21 35" src="https://user-images.githubusercontent.com/26623547/166139953-b2a8d2f8-b8c7-4045-a7b0-3eeb7eb44642.png">   


#### 2-3) 예외 테스트   

Spock을 이용하여 예외가 발생하는지를 테스트 해보자.   
아래는 입력값을 0으로 나눴을때 발생하는 에러를 확인하고 정상적으로 
예외처리를 하는지 확인한다.   

```java
public class DivideUtils {
    public static int divide(int input, int divide) {
        if(divide == 0) {
            throw new ArithmeticException("0으로 나눌 수 없다.");
        }
        return input/divide;
    }
}
```

```java
class MainTest extends Specification{

    def "음수가 들어오면 예외가 발생하는지 확인해보자"() {

        given:
        int input = 5

        when:
        DivideUtils.divide(input, 0)

        then:
        def e = thrown(ArithmeticException.class)
        e.message == "0으로 나눌 수 없다."
    }
}
```

`Spock에서 예외는 thrown() 메서드로 검증할 수 있다.`   
`thrown() 메서드는 발생한 예외를 확인할 수 있을 뿐만 아니라 객체를 
반환하기 때문에 예외에 따른 메시지도 검증을 할 수 있다.`   
테스트 코드를 작성한 흐름에 따라 예외를 확인할 수 있으니, 
    처음 코드를 본 사람도 더 쉽게 이해가 가능하다.      

#### 2-4) Mock 테스트    

Spock의 강력한 기능 중 또 하나는 Mock이다.   

Mock을 생성하기 위한 방법은 아래 2가지 방법으로 진행 가능하다.   

```java
def numberBuilder = Mock(NumberBuilder.class)   
NumberBuilder numberBuilder = Mock()
```

`Spock에서 Mock 객체의 반환값은 >> 로 설정할 수 있다.`        
아래 예제를 보자.  

```java
class MainTest extends Specification{

    def "입력값을 받아서 divideNumber로 나눈다."() {

        given:
        def numberBuilder = Mock(NumberBuilder.class)
        int divideNumber = 2

        when:
        numberBuilder.buildNumber() >> 5  // 목 객체 5 반환 하도록 설정

        int input = numberBuilder.buildNumber()
        DivideUtils.divide(input, divideNumber)

        then:
        DivideUtils.divide(input,divideNumber) == 2
    }
}
```   

만약 Exception을 반환해야 한다면 아래와 같이 가능하다.  

```java
numberBuilder.buildNumber() >> { throw new Exception() }
```

#### 2-5) 호출 횟수 검증   

Spock의 실행 횟수 검증 방법을 살펴보자.   

아래와 같이 `메소드 앞에 숫자를 * 하면 그게 바로 수행 횟수 검증 코드가 된다.`   


```java
1 * numberBuilder.buildNumber()
```

위의 1 값을 2로 변경하면 2번 호출 되었는지를 확인한다.   
`혹은 최소 실행 횟수와 최대 실행 횟수를 지정하여 검증할 수도 있다.`      

```java
// 최소 1번 이상 실행   
(0.._) * numberBuilder.buildNumber()

// 최대 2번까지 실행   
(_..2) * numberBuilder.buildNumber()

// 최소 1번에서 최대 2번까지 실행   
(1..2) * numberBuilder.buildNumber()
```

---

## 마치며   

간략하게 기존 테스트 코딩의 불편함을 살펴봤으며, Spock으로 많은 
불편이 해소되고 코드가 간결해지는 것을 보았다.   

실제로 사용해보면, 글로 보는 것보다 더 좋다고 느낄 것이다.   

어쩌면 테스트 편의성을 확보하는 일이 당장 시급하지 않을 수도 있다.   
새 기능 구현, 트러블슈팅 등에 밀리기 쉽다. 하지만 그렇게 중요한 
일정들 사이에서 어렵사리 작성했던 테스트 코드를 한 달 뒤에 다시 봤을 때 
이해하지 못하겠다면 또 테스트를 작성하고 싶은 생각이 들까?   

그래서 되도록이면 나중에 봤을 때 혹은 다른 개발자가 봤을 때에도 
그 테스트 코드의 의도와 내용을 쉽게 파악할 수 있게 
테스트를 작성하는 것이 중요하다.   
또 그렇게 하는게 어렵지도 않다면 마다할 이유가 없지 않을까?   

반드시 테스트 코드를 Java로 작성해야 하고 JUnit과 Mockito로 코딩해야 
하는 환경이 아니라면 충분히 유연한 언어인 Groovy와 올인원 성격의 
Spock으로 쉬우면서도 오래 두어도 신선한 테스트를 작성해보길 권장한다.   


- - -
Referrence 

<https://goodteacher.tistory.com/340>   
<https://d2.naver.com/helloworld/568425>   
<https://www.baeldung.com/spring-spock-testing>   
<https://jojoldu.tistory.com/229>   
<https://goodteacher.tistory.com/336>    
<https://spockframework.org/>    
<https://techblog.woowahan.com/2560/>    
<https://jojoldu.tistory.com/228>    
<https://spockframework.org/spock/docs/1.0/spock_primer.html>   

{% highlight ruby linenos %}
{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

