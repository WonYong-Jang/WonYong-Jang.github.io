---
layout: post
title: "[Java] Annotation "
subtitle: "@retention, @target, @documented, 어노테이션 프로세서, 리플렉션, javadoc, ServiceLoader"    
comments: true
categories : Java
date: 2021-02-02
background: '/img/posts/mac.png'
---

## 목표

자바의 어노테이션에 대해 학습하세요.   

## 학습할 것 

- 어노테이션 정의하는 방법   
- @retention   
- @target   
- @documented   
- 어노테이션 프로세서   

- - -

## 1. 어노테이션    

클래스나 메소드 등의 선언시에 @를 사용하는 것을 말한다. 자바 5 부터 새롭게 추가된 요소이며, 
    어노테이션의 용도는 다양한 목적이 있지만 메타 데이터의 비중이 가장 크다.    

> 메타 데이터(meta-data) : 데이터를 위한 데이터를 의미하며, 풀어 이야기 하면 한 데이터에 
                           대한 설명을 의미하는 데이터( 자신의 정보를 담고 있는 데이터 )    

또한, 어노테이션은 주석이라는 뜻을 가지고 있다.    
기본적으로 우리가 아는 주석은 // 또는 /* */ 이렇게 생겼는데, 
어노테이션과 일반적인 주석은 뭐가 다른걸까?     

`단어의 의미인 주석과는 비슷하지만 다른 역할로써 사용되는데 메서드, 클래스 등에 의미를 
단순히 컴파일러에게 알려주기 위한 표식이 아닌 컴파일타임 이나 런타임에 해석될 수 있다.`    

#### 커스텀 어노테이션 

기본적으로 제공해주는 어노테이션이 아닌 커스텀한 어노테이션을 작성하고 
싶다면, 다음과 같이 선언해서 사용할 수 있다.   

```java
@Inherited
public @interface Hello {
    String name();
    int age();
}
```

위의 Hello라는 커스텀 어노테이션이며, String 타입과 int 타입의 멤버를 가진다. 이렇게 
선언한 어노테이션은 아래와 같이 적용해서 사용 가능하다.   

```java
@Hello(name = "mike", age = 20)
public class Animal {
}
```

위의 예제는 name과 age 값을 반드시 지정해줘야 한다. 아래와 같이 
기본값이 설정되어 있다면, 어노테이션을 적용할 때 굳이 어떤 값인지 
작성하지 않아도 된다.   

```java
public @interface Hello {
    String name() default "mike";
    int age() default 20;
}
```

`다음으로 어노테이션은 value라는 기본 값을 가질 수 있다.`       
value라는 element는 어노테이션을 적용할 때 굳이 element의 이름을 명시해주지 
않아도 된다.   

```java
@Hello("mike") // 보통은 name = "mike" 라고 해주는데
public class Animal { // value는 이름 없이 가능하다.
}

public @interface Hello {
    String value();
}
```

String value() 예시로 String 타입을 사용했지만, 굳이 String 타입이 아니어도 가능하다.   
하지만 한 번에 두 개 이상의 값을 할당해야 하는 경우 value라고 하더라도 value를 명시 해야 한다.   

```java
@Hello(value = "mike", num = 20)
public class Animal {
}

public @interface Hello {
    String value();
    int num();
}
```

- - - 

## 2. 자바 어노테이션 종류   

`자바에서 기본적으로 제공하는 어노테이션(빌트 인 어노테이션)` 종류를 알아보자.   

#### 2-1) @Override     

선언한 메서드가 오버라이드 되었다는 것을 나타낸다. 만약 부모 클래스 또는 인터페이스에서 
해당 메서드를 찾을 수 없다면 컴파일 에러를 발생 시킨다.     

`해당 어노테이션을 생략할수는 있지만, 권장하지 않는다.`      
부모 클래스가 수정되었을때 자식클래스에서 오버라이딩 해서 사용하고 있는 메서드에도 
컴파일러가 에러를 보여주기 때문에 실수를 방지할 수 있다. 
그렇기 때문에 오버라이딩 어노테이션을 생략했을 경우 위험한 코드가 될 수 있다.  

```java
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.SOURCE)
public @interface Override {
}
```    


#### 2-2) @Deprecated   

해당 메서드가 더 이상 사용되지 않음을 표시한다. 만약 사용할 경우 컴파일 경고를 발생 시킨다.    

예를들어, Date클래스가 있는데, 

```java
    /**
     *  ...
     * @param   year    the year minus 1900.
     * @param   month   the month between 0-11.
     * @param   date    the day of the month between 1-31.
     * @see     java.util.Calendar
     * @deprecated As of JDK version 1.1,
     * replaced by <code>Calendar.set(year + 1900, month, date)</code>
     * or <code>GregorianCalendar(year + 1900, month, date)</code>.
     */
    @Deprecated
    public Date(int year, int month, int date) {
        this(year, month, date, 0, 0, 0);
    }
```

Date클래스를 살펴보면 생성자가 deprecated가 존재한다는 것을 확인 할 수 있다. 
읽어보면 이 클래스는 더 이상 사용하지 말고, Calender클래스를 사용을 권장하고 있다.   

그렇다면 이 클래스를 자바 자체에서 삭제하면 되지 않을까?   
그렇게 될 경우 기존에 Date클래스가 작성된 프로그램은 동작하지 않게 될 것이다. 
그러면 개발자가 모두 찾아다니면서 수정해야된다는 뜻이다.
`결국 호환성 때문에 존재하는 어노테이션이라는 것을 알 수 있다.`   


#### 2-3) @SuppressWarnings   

선언한 곳의 컴파일 경고를 무시하도록 한다.    

#### 2-4) @SafeVarargs    

자바 7부터 지원하며, 제너릭 같은 가변인자의 매개변수를 사용할 때의 경고를 
무시한다.   

#### 2-5) @FuncionalInterface   

자바8부터 지원하며, 함수형 인터페이스를 지정하는 어노테이션이다.  
함수형 인터페이스를 사용하는 이유는 람다식은 함수형 인터페이스로만 
접근이 가능하기 때문에 사용한다.   
만약 메서드가 존재하지 않거나, 1개의 추상 메서드(default 메서드 제외)외에 
메서드가 존재할 경우 컴파일 오류를 발생 시킨다.    

- - - 

## 3. 메타 어노테이션의 종류   

메타 어노테이션의 종류를 알아보자   

### 3-1) @Retention    

얼마나 오랫동안 어노테이션 정보가 유지되는지 설정할 수 있다.    

아래와 같은 단계로 이루어지며 각 단계별 설정이 가능하다.  

> SOURCE -> CLASS -> RUNTIME   

#### RetentionPolicy.SOURCE   

`어노테이션 정보가 컴파일시 사라진다. 바이트코드에서도 존재하지 않는다.
즉, 소스 코드에만 유지하겠다는 것이고 컴파일 할때만 사용하고 어노테이션 정보를 
지우겠다는 뜻이다.`         

아래 예시 중 Override는 오버라이딩 되었다는 것을 나타내며, 컴파일 할때 
진짜로 오버라이딩 되었는지만 체크한다.   

> ex) @Override, @SuppressWarnings   

#### RetentionPolicy.CLASS   

`.class 파일에 존재하고 컴파일러에 의해 사용가능하다. 런타임에서는 사라진다.`       
`즉, 바이트 코드 레벨에서 어떤 작업을 해야할 때 유용하다.`      

JVM 클래스 로더에 의해서 바이트 코드를 읽어 들이고 메모리에 적재 할때 
해당 어노테이션 정보를 제외한다.    

리플렉션은 클래스 로더가 메모리에 적재한 정보를 읽어오는 것이기 때문에 
RetentionPolicy.CLASS일 경우는 리플렉션이 불가능하다.   

아래와 같이 커스텀한 어노테이션을 만들고 실제로 바이트코드를 확인하여 
컴파일 되었을 때 어노테이션 정보가 남아있는지 확인 해보자.   

```java
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.CLASS)
public @interface Hello {
}

@Hello
public static void method(){}
```

Output

```java
 public static method()V
  @Lcom/example/demo/Hello;() // invisible
   L0
    LINENUMBER 6 L0
    RETURN
    MAXSTACK = 0
    MAXLOCALS = 0
```

위와 같이 바이트코드를 확인해 보면, 커스텀 어노테이션인 hello에 
invisible이라는 주석이 있는 것을 확인 할 수 있다.    
해당 주석이 붙은 정보는 런타임시 사라진다.   


#### RetentionPolicy.RUNTIME   

`런타임까지 해당 어노테이션 정보를 유지 하겠다는 것이다.   
바이트 코드에 존재 하다가  
실행시 어노테이션 정보가 JVM에 의해서 참조 가능해진다. 
즉, 자바 리플렉션이 사용 가능하다.`   

> @Component 어노테이션이 대표적으로 RetentionPolicy.RUNTIME이다.   

커스텀하게 만든 어노테이션의 RetentionPolicy.RUNTIME일 경우 
유지 정보가 런타임까지 모두 포함되므로 편하게 사용할 수 있지만 
런타임까지 가지고 있을 필요가 없는 정보라면 CLASS 또는 SOURCE로 
설정 변경을 한번 쯤 생각해보는 것을 권장한다.   

```java
  public static method()V
  @Lcom/example/demo/Hello;()
   L0
    LINENUMBER 6 L0
    RETURN
    MAXSTACK = 0
    MAXLOCALS = 0
```

위의 바이트 코드를 확인해보면 커스텀 어노테이션인 hello 옆에 invisible이라는 
주석이 없다. 이는 클래스 로더에 의해 메모리까지 올라간다는 의미 이다.  



아래는 같이 어노테이션과 리플렉션을 활용하여 연습한 예제이다.   

```java
public class Loop {

    @AnnotationLoop(loopCnt = 10) 
    public void method() {
        System.out.print("*");
    }
}

@Target({ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
public @interface AnnotationLoop {
    int loopCnt() default 1;
}

public class HelloController {

    public static void main(String[] args) throws InvocationTargetException, IllegalAccessException {
        // Loop 클래스에 선언된 public Method 가져온다
        // 단, 슈퍼 클래스에 선언된 public Method도 가져온다.
        // Loop 클래스에 선언된 모든 method를 가져오려면(private도 포함)
        // getDeclaredMethods()를 이용한다.
        Method[] methods = Loop.class.getMethods();
        for (Method method : methods) {

            if(method.isAnnotationPresent(AnnotationLoop.class)) {
                AnnotationLoop annotation = method.getAnnotation(AnnotationLoop.class);

                for(int i=0; i< annotation.loopCnt(); i++) {
                    method.invoke(new Loop());
                }
            }
        }
    }
}

// Output 
// **********
```

### 3-2) @Target    

어노테이션이 적용할 위치를 선택한다. 명시하지 않는다면 
어디든 적용이 가능해 진다.   

종류는 다음과 같다.   

- ElementType.PACKAGE : package
- ElementType.TYPE : class, interface, enum
- ElementType.ANNOTATION_TYPE : annotation
- ElementType.CONSTRUCTOR : constructor
- ElementType.FIELD : field
- ElementType.LOCAL_VARIABLE : local variable   
- ElementType.METHOD : mehotd

여러 곳에 적용하려면 아래와 같이 배열 형태로 적용 가능하다.   

```
@Target({ElementType.FIELD, ElementType.METHOD})
```

### 3-3) @Documented   

`어노테이션 정보가 javadoc으로 작성된 문서에 포함되도록 하는 메타 에노테이션이다.`      

직접 javadoc을 만들 수 있다는 뜻이며, Tools -> Generate JavaDoc 으로 
만들 수 있다.  

Output Directory에 저장할 폴더를 선택하고 
Other Command line arguments에 -encoding UTF-8 -charset UTF-8 -docencoding UTF-8 까지 
지정해줘야 한글이 깨지지 않고 javadoc을 성공적으로 만들 수 있다.   


### 3-4) @Inherited   

`상속받은 클래스에도 어노테이션이 유지된다는 뜻이다.`   

아래 예제를 보면 Hello라는 커스텀한 어노테이션을 만들었고 @Inherited를 
추가하였다.   

그리고 Animal 클래스에만 Hello라는 어노테이션을 붙이고 
컨트롤러에서 Aminal을 상속받은 Dog클래스를 리플렉션을 이용하여 
어노테이션을 확인하였다.   

```java
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@Inherited
public @interface Hello {
}

@Hello
public class Animal {   
}

public class Dog extends Animal {
}

public class HelloController {

    public static void main(String[] args) throws InvocationTargetException, IllegalAccessException {

        Annotation[] annotations = Dog.class.getAnnotations(); // 리플렉션

        for (Annotation annotation : annotations) {
            System.out.println(annotation);
        }
    }
}
// Output 

// 출력 :  @com.example.demo.Hello()
```

결과는 위와 같이 상속받은 클래스의 어노테이션이 유지가 된 것을 확인 할 수 있다.   

`참고로 Dog클래스에 선언되어 있는 어노테이션만 가지고 오고 싶다면 getDeclaredAnnotations() 을 사용하여 
가져올 수 있다.    
이것을 getDeclaredMethods() 등으로 응용하여 사용하면 해당 클래스에 선언 되어 
있는 모든 메소드들(private 포함)을 모두 가져올 수 있다.` 

`getMethods()을 사용할 경우 슈퍼 클래스의 메소드들 까지 모두 가져오지만 public 한 메소드들만 
가져올 수 있다.`   


### 3-5) @Repeatable   

자바8 부터 지원하며, 연속적으로 어노테이션을 선언할 수 있게 해준다.   




위에서 살펴본 어노테이션들은 메타 어노테이션이라고 한다. 위의 어노테이션의 
공통점을 살펴보면 모두 @Target(ElementType.ANNOTATION_TYPE)로 되어 있다는 점이다.    
결국, 타겟이 어노테이션 타입으로 지정 되어있으면 메타 어노테이션이라고 생각해도 될 것 같다.   

- - - 

## 4. 어노테이션 프로세서   

`런타임시에 리플렉션을 사용하는 어노테이션과는 달리 컴파일 타임에 
이루어지며, 어노테이션 정보를 참고하여 코드를 분석하고 생성하는 등의 작업을 
할 수 있는 기능이다.`         

`어노테이션 프로세서의 장점이라고 한다면, 이러한 동작이 컴파일 타임에
이루어지기 때문에 런타임에 비용이 추가되지 않는다는 것이다.
하지만, 단점으로는 잘 알고 쓰지 않는다면 의도하지 않는 동작을 할 수도 있기 때문에 
정확히 알고 써야 한다.`   

대표적인 기술로는 롬북(lombok)이 있으며 컴파일 타임에 바이트 코드를 생성해주는 
라이브러리이다.    
아래는 롬북 사용 예시 중 하나이다.  

```java
@Data
public class Test {
    private int num;
}
```   

위 코드를 컴파일 하여 확인해보면 아래 코드로 
변경 된 것을 확인 할 수 있다.

```java
public class Test {
    private int num;

    public Test() {
    }

    public int getNum() {
        return this.num;
    }

    public void setNum(final int num) {
        this.num = num;
    }

    public boolean equals(final Object o) {
        if (o == this) {
            return true;
        } else if (!(o instanceof Test)) {
            return false;
        } else {
            Test other = (Test)o;
            if (!other.canEqual(this)) {
                return false;
            } else {
                return this.getNum() == other.getNum();
            }
        }
    }

    protected boolean canEqual(final Object other) {
        return other instanceof Test;
    }

    public int hashCode() {
        int PRIME = true;
        int result = 1;
        int result = result * 59 + this.getNum();
        return result;
    }

    public String toString() {
        return "Test(num=" + this.getNum() + ")";
    }
}
```

위를 설명하면 @Data라는 어노테이션이 붙으면 자바는 이 어노테이션이 
붙은 곳을 찾아 컴파일 할때 생성 해 준다. 그렇기 때문에 
setter, getter등 직접 만들지 않고도 자동으로 생성 해 준다.   

그렇다면 컴파일러는 어노테이션 프로세서가 있는것을 어떻게 알고 
어노테이션에 대해 전처리를 할 수 있을까?   

lombok 라이브러리를 좀 더 자세히 들여다 보자.   

<img width="941" alt="스크린샷 2021-02-11 오후 10 08 13" src="https://user-images.githubusercontent.com/26623547/107640535-c67ea100-6cb5-11eb-892d-5260b6cbe8e3.png">   

위를 보면 lombok 라이브러리의 META-INF 디렉토리 하위에 
services라는 폴더가 있다.    
그 폴더에는 javax.annotaion.processing.Processor 라는 파일이 있고 
컴파일러는 해당 내용을 참고하게 된다.   

```
lombok.launch.AnnotationProcessorHider$AnnotationProcessor
lombok.launch.AnnotationProcessorHider$ClaimingProcessor
```


위의 내용은 `ServiceLoader`라는 개념인데 
[링크](https://riptutorial.com/java/example/19523/simple-serviceloader-example) 를 참고하자.    

#### ServiceLoader

`ServiceLoader는 인터페이스 구현체들을 dynamic loading을 할 수 있도록 해준다. 즉, 
 ServiceLoader 클래스를 이용하면 공통 인터페이스를 준수하는 서비스 구현체를 손쉽게 
 로드할 수 있다.` 

간단한 예시로 이해를 해보자.    
HelloService라는 인터페이스를 정의하여 jar파일로 패키징한다.  

```java
package me.kaven;

public interface HelloService {
    String method();
}
```

<img width="900" alt="스크린샷 2021-02-11 오후 11 28 20" src="https://user-images.githubusercontent.com/26623547/107649579-f3848100-6cc0-11eb-8bd3-48ab5984b228.png">   

위와 같이 install을 클릭하여 jar파일을 생성해준다.

그 후 새 프로젝트를 생성하여 아래와 같이 HelloServiceImpl 구현체를 만든다.   

```java
package com.example;

import me.kaven.HelloService;

public class HelloServiceImpl implements HelloService {
    @Override
    public String method() {
        return "success";
    }
}
```

`jar파일로 패키징 하기전에 이 jar파일이 HelloService의 구현체를 제공하는 jar 라는것이 
선언된 file을 선언해야 한다.`        

`META-INF/services 디렉토리를 만들고 그 안에 파일 이름을 인터페이스의
fully-qualified name로 생성한다.`      

`파일 안의 내용은 구현체의 fully-qualified name을 작성한다.`        

완성된 내용은 아래와 같다.   

<img width="895" alt="스크린샷 2021-02-11 오후 11 50 21" src="https://user-images.githubusercontent.com/26623547/107653243-c0dc8780-6cc4-11eb-9fc1-6d805e306665.png">   

이제 jar 파일로 패키징 후 Test라는 새 프로젝트에서 확인해보자.  
방금 패키징한 jar를 메이븐에 추가한 후 아래와 같이 사용이 가능하다.   

```java
public class Test {
    public static void main(String[] args) {
        ServiceLoader<HelloService> loader = ServiceLoader.load(HelloService.class);
        for (HelloService helloService : loader) {
            System.out.println(helloService.method());
        }
    }
}
```

```maven
<dependencies>
        <dependency>
            <groupId>com.example</groupId>
            <artifactId>demo-service-impl</artifactId>
            <version>0.0.1-SNAPSHOT</version>
        </dependency>
    </dependencies>
```

우리는 HelloService라는 인터페이스만 가지고 이를 구현한 구현체들을 
동적으로 가져올 수 있는 것을 확인 하였다!    


- - - 

**Reference**    

<https://b-programmer.tistory.com/264>   
<https://blog.naver.com/hsm622/222226824623>  
<https://blog.naver.com/hsm622/222218251749>   
<https://wisdom-and-record.tistory.com/52>    
<https://github.com/whiteship/live-study/issues/12>      

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

