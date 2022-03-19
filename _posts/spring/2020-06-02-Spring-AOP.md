---
layout: post
title: "[Spring] AOP (Aspect-Oriented-Programming)"
subtitle: "관점 지향 프로그래밍 / Proxy / Aspect, Advice / Pointcut, JoinPoint / CGLib, Dynamic Proxy"
comments: true
categories : Spring
date: 2020-06-02
background: '/img/posts/spring.png'
---

## 1. AOP(관점 지향 프로그래밍)   

관점(Aspect)라는 용어는 개발자들에게 관심사(concern)이라는 말로 용통된다.   
관심사는 개발 시 필요한 고민이나 염두에 두어야 하는 일이라고 생각할 수 있는데, 
코드를 작성하면서 염두에 두어야 하는 일들은 주로 아래와 같다.    

- 파라미터가 올바르게 들어왔을까?   
- 로그는 적절하게 남기고 있는가?   
- 이 작업을 하는 사용자가 적절한 권한을 가진 사용자인가?    
- 이 작업에서 발생할 수 있는 모든 예외는 어떻게 처리해야 하는가?   

**위와 같은 고민들은 핵심로직은 아니지만 코드를 온전하게 만들기 위해서 필요한 고민들인데
이전에는 개발자가 반복적으로 코드를 작성하여 중복이 생기고 핵심 로직을 파악하기 어렵게 만들기 
때문에 AOP라는 개념이 탄생했다.**    

`즉, AOP란 실제 핵심 로직(Core Concern)을 수행하면서 발생하는 횡단 관심사(Cross Cutting Concern)를 한데 모아 처리하는 것을 AOP라 한다.`  

개발자의 입장에서 AOP를 적용한다는 것은 기존의 코드를 수정하지 않고도 원하는 cross cutting concern을 엮을 수 있다는 점이 장점이다!    

`AOP가 추구하는 것은 관심사의 분리이다!! AOP는 개발자가 염두에 두어야 하는
일들을 별도의 관심사로 분리하고, 핵심 비즈니스 로직만을 작성할 것을 권장한다.`   

> Cross Cutting concern == 주변로직(로그, 보안 , 트랜잭션, 에러 처리) 

> ex) 나눗셈을 구현 한다고 치면 핵심로직은 두개의 숫자를 나누는 것이지만, 주변 로직은
0을 나누는 것이 아닌지 등을 체크 하는 것!   

> 프로그램 실행 방향은 위에서 아래로 진행하는데 실행 방향과 cross 방향으로 진행 하면서 떼어 내고 붙이고 할수 있다고 하여 Cross Cutting Concern 라 부른다.     
<img width="600" alt="스크린샷 2020-06-01 오후 9 38 02" src="https://user-images.githubusercontent.com/26623547/83409926-5cd4a480-a450-11ea-99b7-083df65941cb.png">    

- - - 
### 1-1) AOP 용어들     

<img width="500" alt="스크린샷 2020-03-08 오후 8 59 13" src="https://user-images.githubusercontent.com/26623547/76162294-beea7a00-617f-11ea-890e-f3991970d082.png">   
<img width="500" alt="스크린샷 2020-03-08 오후 9 27 14" src="https://user-images.githubusercontent.com/26623547/76162706-9fede700-6183-11ea-9810-d9f7aade50e6.png">   


#### Target   

`개발자가 작성한 비즈니스 로직(Core concern)을 가지는 객체`   

target은 순수한 비즈니스 로직을 가지고 있고, 어떠한 관심사들과도 관계를 맺지 않는다.

#### Proxy   

`target을 전체적으로 감싸고 있는 존재`   

내부적으로 Target을 호출하지만, 중간에 필요한 관심사들을 거쳐서 Target을 호출하도록 
자동 혹은 수동으로 작성된다. Proxy 존재는 직접 코드를 통해서 구현하는 경우도 있지만, 
대부분 스프링 AOP 기능을 이용해서 자동으로 생성되는 auto-proxy 방식을 이용

#### Pointcuts 와 JoinPoint 그리고 weaving   

<img width="700" alt="스크린샷 2020-06-06 오후 4 01 41" src="https://user-images.githubusercontent.com/26623547/83938654-66278d80-a811-11ea-9128-859669601436.png">

`1) JoinPoint : Target 객체가 가진 여러 메서드`     
`2) Pointcut : Target 에 가진 여러 메서드에 관심사를 결합할 것인지를 결정해야 하는데 이 결정을 Pointcut 이라 한다.`   

Advice를 어떤 JoinPoint에 결합할 것인지를 결정하는 설정이다.    

<p><b>- execution(@execution) : </b>메서드를 기준으로 Pointcut을 설정</p>
<p><b>- within(@within) : </b>특정한 타입(클래스)을 기준으로 Pointcut 설정</p>
<p><b>- this : </b>주어진 인터페이스를 구현한 객체를 대상으로 Pointcut을 설정</p>
<p><b>- args(@args) : </b>특정한 파라미터를 가지는 대상들만을 Pointcut으로 설정</p>
<p><b>- @annotation : </b>특정한 어노테이션이 적용된 대상들만을 Pointcut 으로 설정</p>

`3) Weaving : Advice를 핵심코드와 연결, 적용`   

#### Aspect 와 Advice   

`1) Aspect :  Advice와 함께 관심사라는 용어로 사용`   

Aspect 는 관심사 자체를 의미하는 추상명사

`2) Advice : Aspect를 구현한 코드( 동작 위치에 따라 다음과같이 구분 )`   

<p><b>- Before Advice</b> : Target의 JoinPoint를 호출하기 전에 실행되는 코드(코드의 실행 자체에는 관여할수 없음)</p>
<p><b>- After Returning Advice</b> : 모든 실행이 정상적으로 이루어진 후에 동작하는 코드</p>
<p><b>- After Throwing Advice</b> : 예외가 발생한 뒤에 동작하는 코드</p>
<p><b>- After Advice</b> : 정상적으로 실행되거나 예외가 발생했을 때 구분 없이 샐행되는 코드</p>
<p><b>- Around Advice</b> : 메서드의 실행 자체를 제어할 수 있는 가장 강력한 코드( 직접 대상 메서드를 호출하고 결과나 예외를
처리할 수 있다.</p>

스프링 3버전 이후에는 어노테이션만으로도 모든 설정이 가능해졌다. 

<p>Target 에 어떤 Advice 적용할 것인지는 XML을 이용한 설정, 또는 어노테이션을 
이용하는 방식이 가능하다.</p>   

- - - 

## 2. Spring AOP의 Proxy 패턴   

`Spring AOP는 기본적으로 디자인 패턴 중 하나인 Proxy 패턴을 사용하여 구현되는데, 
Spring에서 사용하는 두 가지 프록시 구현체가 있다.`   

`하나는 JDK Proxy(Dynamic Proxy)와 CGLib이다.`    

둘의 차이는 다음 그림과 같다.   

<img width="731" alt="스크린샷 2022-03-19 오후 3 58 32" src="https://user-images.githubusercontent.com/26623547/159111289-542c8c00-bf68-4ab0-8552-eced0f80fa88.png">     

그럼 왜 두가지 방식이 존재할까?   

#### 2-1) JDK Proxy   

`먼저, JDK Proxy(Dynamic Proxy)의 경우 AOP를 적용하여 구현된 클래스의 인터페이스를 
프록시 객체로 구현해서 코드를 끼워 넣는 방식이다.`   

`JDK Proxy의 경우 AOP적용을 위해서 반드시 인터페이스를 구현해야 한다는 
단점이 있다.`   
그동안 서비스 계층에서 인터페이스를 XXXImpl 클래스를 작성하던 관례가 
이러한 JDK Proxy의 특성 때문이다.   

```java
public class ExamDynamicHandler implements InvocationHandler {
    private ExamInterface target; // 타깃 객체에 대한 클래스를 직접 참조하는것이 아닌 Interface를 이용

    public ExamDynamicHandler(ExamInterface target) {
        this.target = target;
    }

    @Override
    public Object invoke(Object proxy, Method method, Object[] args)
            throws Throwable {
        // TODO Auto-generated method stub
        // 메소드에 대한 명세, 파라미터등을 가져오는 과정에서 Reflection 사용
        String ret = (String)method.invoke(target, args); //타입 Safe하지 않는 단점이 있다.
        return ret.toUpperCase(); //메소드 기능에 대한 확장
    }
}
```   

Dynimic Proxy는 InvocationHandler라는 인터페이스를 구현한다.
InvocationHandler의 invoke 메소드를 오버라이딩 하여 Proxy 위임 기능을
수행하는데, 이때 메소드에 대한 명세와 파라미터를 가져오는 과정에서
리플렉션을 사용한다.   

> JDK Proxy의 경우 자바에서 기본적으로 제공하고 있는 기능이다.   

#### 2-2) CGLib   

`반면, CGLib의 경우 외부 3rd party Library이며, JDK Proxy와 달리 
리플렉션을 사용하지 않고 바이트코드 조작을 통해 프록시 객체 생성을 한다.`   

`또한, 인터페이스를 구현하지 않고도 해당 구현체를 상속받는 것으로 
문제를 해결하기 때문에 성능상 이점이 있다.`   

즉, 인터페이스가 아닌 클래스에 대해서 동적 프록시를 생성할 수 있기 
때문에 다양한 프로젝트에 널리 사용되고 있다.   


```java
// 1. Enhancer 객체를 생성
Enhancer enhancer = new Enhancer();
// 2. setSuperclass() 메소드에 프록시할 클래스 지정
enhancer.setSuperclass(BoardServiceImpl.class);
enhancer.setCallback(NoOp.INSTANCE);
// 3. enhancer.create()로 프록시 생성
Object obj = enhancer.create();
// 4. 프록시를 통해서 간접 접근
BoardServiceImpl boardService = (BoardServiceImpl)obj;
boardService.writePost(postDTO);
```

CGLib은 Enhancer라는 클래스를 바탕으로 Proxy를 생성한다.   
`상속을 통해 프록시 객체가 생성되기 때문에 더욱 성능상에 이점을 누릴 수 있다.`     


위의 enhancer.setCallback(NoOp.INSTNACE); 라는 코드가 존재하는데 이는 
Enhancer 프록시 객체가 직접 원본 객체에 접근하기 위한 옵션이다.  

```java
BoardServiceProxy.writePost(postDTO) -> BoardServiceImpl.writePost(postDTO)
```

기본적으로 프록시 객체들은 직접 원본 객체를 호출하기 보다는, 별도의 작업을 
수행하는데 CGLib의 경우 Callback을 사용한다.   

> CGLib에서 가장 많이 사용하는 콜백은 net,sf.cglib.proxy.MethodInterceptor인데, 
    프록시와 원본 객체 사이에 인터셉터를 두어 메소드 호출을 조작하는 것을 도와줄 수 있게 된다.   

```java
BoardServiceProxy -> BoardServiceInterceptor -> BoardServiceImpl
```

Springboot의 경우 기본적으로 프록시 객체를 생성할 때 CGLib를 사용한다.    
자바 리플렉션 방식보다 CGLib의 MethodProxy이 더 빠르고 예외를 발생시키지 않는다고 하여 
Springboot에서는 CGLib를 기본 프록시 객체 생성 라이브러리로 채택하게 되었다.   

> 리플렉션 자체가 비용이 비싼 API이기 때문에 가급적 사용하지 않는 것을 권장하고 있다.   

[다음 글](https://wonyong-jang.github.io/spring/2020/06/03/Spring-AOP-Practice.html)에서는 
AOP를 직접 구현해보자.   

- - -
Referrence 

<https://minkukjo.github.io/framework/2021/05/23/Spring/>     
<http://www.newlecture.com>   

{% highlight ruby linenos %}
{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

