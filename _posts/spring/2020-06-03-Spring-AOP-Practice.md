---
layout: post
title: "[Spring] AOP 구현하기"
subtitle: "자바코드, 스프링으로 AOP 구현하기"
comments: true
categories : Spring
date: 2020-06-03
background: '/img/posts/spring.png'
---

## 순수 자바코드로 AOP 구현  

[AOP 개념 링크](https://wonyong-jang.github.io/spring/2020/03/08/Spring-AOP.html)   

기존 개발자들은 total이라는 메소드 속도가 느리다고 전달받았을 때 아래와 같이 
핵심로직 사이에 코드를 추가하여 시간을 확인하는 식으로 구현하였다.   
```java
    public int total() {
        long start = System.currentTimeMillis();

        int result = kor+eng+math+com; // 핵심 로직!!!

        try { // 테스트를 위한 시간 sleep
            Thread.sleep(200);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        long end = System.currentTimeMillis();

        long message = end - start;
        System.out.println("실행시간 : " + message);

        return result;
    }
```
`
자바에서 AOP를 구현하기 위한 방법은 proxy를 사용하는 방법이다.   
즉, Core concern(핵심로직)과 Cross cutting concern
(부가적인 로직)을 분리한다.   
`

##### Proxy.newProxyInstance

- loader : Proxy가 동일한 기능을 사용하기 위해 로드할 객체 
- interfaces : 복수니까 배열형태로 인터페이스를 넘긴다.
- h : 부가적인 로직을 끼워 넣기 위한 부분 

```java
// proxy는 Exam 클래스와 동일한 기능을 사용한다. proxy에 부가적인 로직(로깅, 
// 에러처리 등)을 추가해서 사용 가능!   
Exam proxy = newProxyInstance(ClassLoader loader,
                Class<?>[] interfaces,
               InvocationHandler h)
```


```java
public class Program {
    
    public static void main(String[] args) {
     
        Exam exam = new NewLecExam(1,1,1,1); // 실제 업무 로직 
        
        Exam proxy = (Exam) Proxy.newProxyInstance(NewLecExam.class.getClassLoader(), 
                new Class[] {Exam.class},
                new InvocationHandler() {
                    
                    @Override
                    public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
                        
                        long start = System.currentTimeMillis();
                        
                        // method.invoke 실제 메소드 호출할수 있는 기능
                        // invoke(실제 업무객체, 호출 메소드 파라미터)
                        Object result = method.invoke(exam, args);
                        // result: 실제 업무가 반환하는 값

                        long end = System.currentTimeMillis();
                      
                        long message = end - start;
                        System.out.println("실행시간 : " + message);
                        
                        return result;
                    }
                }
                );
        
        //System.out.printf("total is " + exam.avg());
       
        System.out.printf("total is %d\n",  proxy.total());
        System.out.printf("avg is %f\n",  proxy.avg());
        // 실제 업무로직이 아닌 Proxy를 이용하여 
        // 실제 업무로직 위 아래로 부가적인 로직을 끼워 넣었다! 

        /*
            실행시간 : 201
            total is 4
            실행시간 : 204
            avg is 1.000000
        */
    }

```
- - - 

## 스프링으로 AOP 구현하기 



**Advice 종류**  

- Before : 업무 로직 전에 실행 
- After returnning : 업무 로직 후에 실행 
- After throwing : 예외 처리 
- Around : 업무 로직 앞 뒤 모두 실행 

> 패키지 리스트    
<img width="180" alt="스크린샷 2020-06-03 오후 11 43 37" src="https://user-images.githubusercontent.com/26623547/83651157-25066200-a5f4-11ea-92f5-1b0eb3df26f1.png">    

- - -
### AroundAdvice  

> Prgram.java    

```java
public class Program {

    public static void main(String[] args) {

        ApplicationContext context =
                new ClassPathXmlApplicationContext("spring/aop/setting.xml");

        // xml에 설정한 proxy 가져오기 ! 
        Exam proxy = (Exam) context.getBean("proxy");

        System.out.printf("total is %d\n",  proxy.total());
        System.out.printf("avg is %f\n",  proxy.avg());
    }
}
```

> AroundAdvice를 구현한 LogAroundAdvice.java    

```java
public class LogAroundAdvice implements MethodInterceptor {

    @Override
    public Object invoke(MethodInvocation invocation) throws Throwable {
        long start = System.currentTimeMillis();

        // java 에서 했을때 method.invoke 와 동일한 기능 !
        Object result = invocation.proceed();

        long end = System.currentTimeMillis();

        long message = end - start;
        System.out.println("실행시간 : " + message);

        return result;
    }
}
```

> setting.xml   

```xml

    <bean id ="LogAroundAdvice" class ="spring.aop.advice.LogAroundAdvice" />
    <bean id="target" class ="spring.aop.entity.NewLecExam" p:kor = "1" p:eng="1" p:math="1" p:com="1"/>

    <!-- Spring 에서 제공하는 Proxy 사용  -->
    <bean id="proxy" class= "org.springframework.aop.framework.ProxyFactoryBean">
        <!-- 실제 로드할 객체  -->
        <property name = "target" ref = "target" />

        <!-- 부가적인 로직을 넣을 Handler   -->
        <property name = "interceptorNames">
            <list>
                <value>LogAroundAdvice</value>
            </list>
        </property>

        <!-- 자바로 직접 구현했을 때 인터페이스를 넣어줘야 했는데
        스프링을 이용한 AOP는 직접 알아서 맵핑  -->
    </bean>

```
- - - 

### BeforeAdvice   

> LogBeforeAdvice.java

```java
public class LogBeforeAdvice implements MethodBeforeAdvice{

    @Override
    public void before(Method method, Object[] args, Object target) throws Throwable {
        System.out.println("앞에서 실행될 로직입니다. ");
    }
}
```

> setting.xml 에 추가 

```xml
    <bean id ="LogAroundAdvice" class ="spring.aop.advice.LogAroundAdvice" />
    <bean id ="LogBeforeAdvice" class ="spring.aop.advice.LogBeforeAdvice" />
    <bean id ="LogAfterReturningAdvice" class ="spring.aop.advice.LogAfterReturningAdvice" />
    <bean id ="LogAfterThrowingAdvice" class ="spring.aop.advice.LogAfterThrowingAdvice" />
    <bean id="target" class ="spring.aop.entity.NewLecExam" p:kor = "1" p:eng="1" p:math="1" p:com="1"/>
    
    <!-- Spring 에서 제공하는 Proxy 사용  -->
    <bean id="proxy" class= "org.springframework.aop.framework.ProxyFactoryBean">
        <!-- 실제 로드할 객체  -->
        <property name = "target" ref = "target" />
        
        <!-- 부가적인 로직을 넣을 Handler   -->
        <property name = "interceptorNames">
            <list>
                <value>LogAroundAdvice</value> 
                <value>LogBeforeAdvice</value> <!-- 배열 형태로 추가 가능 -->
                <value>LogAfterReturningAdvice</value>
                <value>LogAfterThrowingAdvice</value>
            </list>
        </property>
        
        <!-- 자바로 직접 구현했을 때 인터페이스를 넣어줘야 했는데 
        스프링이 직접 알아서 맵핑  -->
    </bean>

```
- - -
### After Returning Advice

> LogAfterReturningAdvice.java    

```java

public class LogAfterReturningAdvice implements AfterReturningAdvice{

    @Override
    public void afterReturning(Object returnValue, Method method, Object[] args, Object arg) throws Throwable {
        System.out.println("returnValue:"+ returnValue+", "
                + "method: "+ method.getName());
    }
    /*
       returnValue:4, method: total
       returnValue:1.0, method: avg
    */
}

```
- - -

### After Throwing Advice   

- 예외를 발생키기 위해서 국어 점수가 100점이 넘을 경우 IllegalArgumentException 발생시켜보기   

`Core concern 실행 중 예외가 발생했을 경우는 After Advice로 가지 않고 After Throwing Advice로 
바로 넘어가서 예외를 처리한다.`   

> NewLecExam.java   

```java

if(kor > 100)
            throw new IllegalArgumentException("유효하지 않는 국어점수 ");

```


```java

// ThrowsAdvice 구현 해야할 구현체가 정해져 있지 않다!
// 다른 Advice는 전달할 인자와 전달 받을 인자가 정해져 있지만
// ThrowsAdvice는 어떤 예외가 발생하느냐에 따라서 함수 인지가 달라지기 때문에
// 구현할 것을 직접 선택해서 구현해야 함
public class LogAfterThrowingAdvice implements ThrowsAdvice{

    public void afterThrowing(IllegalArgumentException e) throws Throwable {
        System.out.println("예외가 발생하였습니다. :" + e.getMessage());
    }
}

```

```
앞에서 실행될 로직입니다.
Exception in thread "main" 예외가 발생하였습니다. :유효하지 않는 국어점수
java.lang.IllegalArgumentException: 유효하지 않는 국어점수
```


`스프링으로 AOP를 구현했을 때는 proxy와의 설정 관계를 자바코드와 분리했다는 것이 
가장 큰 장점이고 proxy 설정이 간단해 졌다.`      

- - -
Referrence 

[http://www.newlecture.com](http://www.newlecture.com)   

{% highlight ruby linenos %}
{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

