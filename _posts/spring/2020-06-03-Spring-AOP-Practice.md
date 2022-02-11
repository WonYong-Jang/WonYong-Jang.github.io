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
`자바에서 AOP를 구현하기 위한 방법은 proxy를 사용하는 방법이다.`    
`즉, Core concern(핵심로직)과 Cross cutting concern (부가적인 로직)을 분리한다.`     

##### Proxy.newProxyInstance

- loader : Proxy가 동일한 기능을 사용하기 위해 로드할 객체 
- interfaces : 복수니까 배열형태로 인터페이스를 넘긴다.
- h : 부가적인 로직을 끼워 넣기 위한 부분 

```java
// proxy는 Exam 클래스와 동일한 기능을 사용한다. proxy에 부가적인 로직(로깅, 에러처리 등)을 추가해서 사용 가능!     
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
- - - 
## 어노테이션을 이용하여 AOP 구현   

- AOP 설정과 관련해서 가장 중요한 라이브러리는 AspectJ와 AspectJ Weaver라는 라이브러리이다. 메이븐 또는 그래들에 추가하기   
- Advice 클래스에 @Aspect 어노테이션을 추가함으로써 Aspect를 구현한 것을 나타낸다.   
- 스프링 컨테이너에 추가하기 위해 Component 어노테이션을 추가한다.    
- @Before, @After, @AfterReturnining, @AfterThrowing, @Around 

#### @Pointcut

`@Pointcut은 Cross cutting concern(부가기능)이 적용될 JoinPoint 들을 정의한 것이다. 
@Annotaion의 경우 조금 복잡한 표현식을 가지고 있다.`     

```
execution(접근제어자 반환형 /  패키지를 포함한 클래스 경로 / 메소드파라미터)  
```

`public의 반환형이 없는 (public void) 형태의 메소드 중 get으로 시작하는 모든 메소드 중 
파라미터가 존재하지 않는 (()) 메소드들에게 적용한다는 의미`   

```
@Pointcut(execution(* *(..))")
```

`첫번째 *기호는 접근제어자 반환형 모두를 상관하지 않고 적용하겠다는 의미이다. 두번째 *기호는 
어떠한 경로에 존재하는 클래스도 상관하지 않고 적용하겠다는 의미이다.    
마지막으로 (..)은 메소드의 파라미터가 몇개가 존재하던지 상관없이 실행하는 경우`

```
@Pointcut("execution(* com.java.ex.Car.accelerate())")  
```

`첫번째 *기호는 역시 접근제어자 반환형을 상관하지 않는다는 의미이며, com.java.ex.Car.accelerate()는 해당 
class의 accelerate() (파라미터가 없는)메소드가 호출될 때 실행하는 경우를 의미한다.`   

```
@Point("execution(* com.java..*.*())")    
```

`위와 거의 비슷하지만 com.java.. 부분은 해당 패키지를 포함한 모든 하위패키지에 적용한다는 의미이다. 
com.java 패키지를 포함한 모든 하위디렉토리의 모든 Class의 모든 파라미터가 존재하지 않는 메소드에 적용한다는 의미이다.`      

#### 어노테이션 예제


```xml
<!-- 아래와 같이 추가 또는 자바 config를 이용하여 추가 -->
<context:component-scan base-package="org.zerock.service"></context:component-scan>	
<context:component-scan base-package="org.zerock.aop"></context:component-scan>

<!-- 스프링 2버전 이후에는 자동으로 proxy 객체를 만들어주는 설정 추가  -->
<aop:aspectj-autoproxy></aop:aspectj-autoproxy>

<!-- Spring boot 사용시 아래와 같이 추가  -->
implementation 'org.springframework.boot:spring-boot-starter-aop'
```

> LogAdvice.java   

```java

@Aspect  // 해당 객체가 Aspect를 구현한 것임으로 나타내기 위함!
@Log4j
@Component
public class LogAdvice {

    @Before( "execution(* org.zerock.service.SampleService*.*(..))")
    public void logBeforeWithParam() {
        log.info("advice");
    }

    @AfterThrowing(pointcut = "execution( * org.zerock.service.SampleService*.*(..))", throwing = "exception")
    public void logException(Exception exception) {
        log.info("Exception...!!!!");
        log.info("exception: " + exception);
    }

    @Around("execution(* org.zerock.service.SampleService*.*(..))")
    public Object logTime( ProceedingJoinPoint pjp) throws Throwable {

        long start = System.currentTimeMillis();

        log.info("Target: " + pjp.getTarget());
        log.info("Param: " + Arrays.toString(pjp.getArgs()));

        Object result = null;

        try {
            result = pjp.proceed();
        }catch (Exception e) {
            e.printStackTrace();
        }

        long end = System.currentTimeMillis();

        log.info("TIME: " + (end - start));

        return result;
    }
}


```

> SampleServiceTests.java

```java

@RunWith(SpringJUnit4ClassRunner.class)
@Log4j
@ContextConfiguration({"file:src/main/webapp/WEB-INF/spring/root-context.xml"})
public class SampleServiceTests {

    @Autowired
    private SampleService service;

    @Test
    public void testClass() {
        log.info(service);
        log.info(service.getClass().getName());
        // getClass()를 이용하여 JDK의 다이나믹 프록시 확인 가능
        // INFO : org.zerock.service.SampleServiceTests - com.sun.proxy.$Proxy23
    }

    @Test
    public void testAdd() throws Exception {
        log.info(service.doAdd("123", "456"));
    }
}

```


- - - 

`스프링으로 AOP를 구현했을 때는 proxy와의 설정 관계를 자바코드와 분리했다는 것이 
가장 큰 장점이고 proxy 설정이 간단해 졌다.`      

- - -
Referrence 

[http://www.newlecture.com](http://www.newlecture.com)   
[https://galid1.tistory.com/498](https://galid1.tistory.com/498)
{% highlight ruby linenos %}
{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

