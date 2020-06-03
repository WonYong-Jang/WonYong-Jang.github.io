---
layout: post
title: "[Spring] AOP (Aspect-Oriented-Programming)"
subtitle: "관점 지향 프로그래밍"
comments: true
categories : Spring
date: 2020-03-08
background: '/img/posts/spring.png'
---

## AOP(관점 지향 프로그래밍)   

<p>관점(Aspect)라는 용어는 개발자들에게 관심사(concern)이라는 말로 용통된다.
관심사는 개발 시 필요한 고민이나 염두에 두어야 하는 일이라고 생각할 수 있는데,
코드를 작성하면서 염두에 두어야 하는 일들은 주로 아래와 같다.</p>

- 파라미터가 올바르게 들어왔을까?   
- 로그는 적절하게 남기고 있는가?   
- 이 작업을 하는 사용자가 적절한 권한을 가진 사용자인가?    
- 이 작업에서 발생할 수 있는 모든 예외는 어떻게 처리해야 하는가?   

**위와 같은 고민들은 핵심로직은 아니지만 코드를 온전하게 만들기 위해서 필요한 고민들인데
이전에는 개발자가 반복적으로 코드를 작성하여 중복이 생기고 핵심 로직을 파악하기 어렵게 만들기 
때문에 AOP라는 개념이 탄생했다.**    

`즉, AOP란 실제 핵심 로직(Core Concern)을 수행하면서 발생하는 횡단 관심사(Cross Cutting Concern)를 한데 모아 처리하는 것을 AOP라 한다.`   

`AOP가 추구하는 것은 관심사의 분리이다!! AOP는 개발자가 염두에 두어야 하는
일들을 별도의 관심사로 분리하고, 핵심 비즈니스 로직만을 작성할 것을 권장한다.`   

> Cross Cutting concern == 주변로직(로그, 보안 , 트랜잭션, 에러 처리) 

> ex) 나눗셈을 구현 한다고 치면 핵심로직은 두개의 숫자를 나누는 것이지만, 주변 로직은
0을 나누는 것이 아닌지 등을 체크 하는 것!   

> 프로그램 실행 방향은 위에서 아래로 진행하는데 실행 방향과 cross 방향으로 진행 하면서 떼어 내고 붙이고 할수 있다고 하여 Cross Cutting Concern 라 부른다.   
<img width="600" alt="스크린샷 2020-06-01 오후 9 38 02" src="https://user-images.githubusercontent.com/26623547/83409926-5cd4a480-a450-11ea-99b7-083df65941cb.png">    

```ruby
```

<h3>AOP 용어들</h3>

<br/>
<img width="500" alt="스크린샷 2020-03-08 오후 8 59 13" src="https://user-images.githubusercontent.com/26623547/76162294-beea7a00-617f-11ea-890e-f3991970d082.png">
<img width="500" alt="스크린샷 2020-03-08 오후 9 27 14" src="https://user-images.githubusercontent.com/26623547/76162706-9fede700-6183-11ea-9810-d9f7aade50e6.png">
<br/>

<p><u>1) Target: 개발자가 작성한 비즈니스 로직을 가지는 객체</u></p>
target은 순수한 비즈니스 로직을 의미하고, 어떠한 관심사들과도 관계를 맺지 않는다(순서한 core)
<p><u>2) Proxy : target을 전체적으로 감싸고 있는 존재</u></p>
내부적으로 Target을 을 호출하지만, 중간에 필요한 관심사들을 거쳐서 Target을 호출하도록
자동 혹은 수동으로 작성된다. Proxy 존재는 직접 코드를 통해서 구현하는 경우도 있지만,
대부분 스프링 AOP 기능을 이용해서 자동으로 생성되는 auto-proxy 방식을 이용
<p><u>3) JoinPoint : Target 객체가 가진 여러 메서드</u></p>
<p><u>4) Pointcut : Target 에 가진 여러 메서드에 관심사를 결합할 것인지를 결정해야 하는데 이 결정을 Pointcut 이라 한다.</u></p>
Advice를 어떤 JoinPoint에 결합할 것인지를 결정하는 설정이다. AOP에서 Target은
결과적으로 Pointcut에 의해서 자신에게 없는 기능들을 가지게 된다.

<p><b>- execution(@execution) : </b>메서드를 기준으로 Pointcut을 설정</p>
<p><b>- within(@within) : </b>특정한 타입(클래스)을 기준으로 Pointcut 설정</p>
<p><b>- this : </b>주어진 인터페이스를 구현한 객체를 대상으로 Pointcut을 설정</p>
<p><b>- args(@args) : </b>특정한 파라미터를 가지는 대상들만을 Pointcut으로 설정</p>
<p><b>- @annotation : </b>특정한 어노테이션이 적용된 대상들만을 Pointcut 으로 설정</p>

<p><u>5) Aspect :  Advice와 함께 관심사라는 용어로 사용</u></p>
Aspect 는 관심사 자체를 의미하는 추상명사
<p><u>6) Advice : Aspect를 구현한 코드( 동작 위치에 따라 다음과같이 구분 )</u></p>

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
Referrence 

[http://www.newlecture.com](http://www.newlecture.com)   

{% highlight ruby linenos %}
{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

