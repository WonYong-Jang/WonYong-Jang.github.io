---
layout: post
title: "[Java] 예외 처리 "
subtitle: "Error, Exception, try-with-resource, custom exception, checked, unckecked exception"
comments: true
categories : Java
date: 2021-01-14
background: '/img/posts/mac.png'
---

## 목표

자바의 예외 처리에 대해 학습하세요.   

## 학습할 것 

- Exception과 Error의 차이는?   
- 자바가 제공하는 예외 계층 구조      
- 자바에서 예외처리 방법(try, catch, throw, throws, finally)   
- RuntimeException과 RE가 아닌 것의 차이는?   
- 커스텀한 예외 만드는 방법     

- - -

## 1. Exception과 Error의 차이?

Exception과 Error의 차이점에 대해 알아보자.

##### 1) Error

`컴퓨터 하드웨어의 오작동 또는 고장으로 인해 응용프로그램에 이상이 생겼거나
JVM 실행에 문제가 생겼을 경우 발생한다.`

java.lang.Error의 서브 클래스들이다. OutOfMemoryError, StackOverFlowError와 같이 
복구할 수 없는 심각한 수준의 에러를 뜻한다. 시스템에 비정상적인 상황이 생겼을 때 
발생하므로 System level의 문제이다.   

##### 2) Exception

`컴퓨터의 에러가 아닌 사용자의 잘못된 조작 또는 개발자의 잘못된 코딩으로 인해 발생한다.`   

예외가 발생하면 프로그램이 종료가 된다는 것은 에러와 동일하지만 예외는 예외처리를 통해서 
프로그램이 종료되지 않고 정상적으로 작동되게 만들어 줄 수 있다.    

- - - 

## 2. 자바가 제공하는 예외 계층 구조

아래 그림처럼 Throwable은 Object를 직접 상속받고 있고
Error와 Exception은 Throwable을 상속한다. 부모는 같지만 역할은 다르다.

<img width="800" alt="스크린샷 2021-01-17 오후 2 11 15" src="https://user-images.githubusercontent.com/26623547/104831615-f6f93800-58cd-11eb-9682-e192bab57851.png">

`위 계층도에서 Exception은 다시 두 갈래로 나뉜다.`

##### 1) Checked Exception

`Exception을 상속하는 하위 클래스 중 Runtime Exception을 제외한 모든 Exception은 Checked Exception이다.`

`Checked Exception은 컴파일 시점에서 확인될 수 있는 예외이다.`
만약 코드 내에서 Checked Exception을 발생시킨다면, 해당 예외는 반드시 try-catch 또는 throws 구문을 통해서 처리해야 한다.

예를들면, 존재하지 않는 파일을 처리하려는 경우(FileNotFoundException), 실수로 클래스의 이름을 잘못
입력한 경우(ClassNotFoundException), 입력한 데이터의 형식이 잘못된 경우(DataFormatException)에 발생한다.

아래와 같이 Checked Exception 중에 하나인 IOException을 발생시키는 메서드를 선언했다고 하면

<img width="380" alt="스크린샷 2021-01-17 오후 2 22 17" src="https://user-images.githubusercontent.com/26623547/104831822-7fc4a380-58cf-11eb-8611-d1d2bb3a60fe.png">

이 코드는 컴파일 자체가 안된다. IOException은 Checked Exception이기 때문에 컴파일 단계에서 예외가 확인이 된다.
`따라서 위 코드를 컴파일 하려면 try-catch또는 throws로 예외를 던져줘야 한다.`

<img width="380" alt="스크린샷 2021-01-17 오후 2 22 47" src="https://user-images.githubusercontent.com/26623547/104831823-80f5d080-58cf-11eb-8d68-f09628880ab8.png">

위처럼 예외를 던져주면 컴파일이 가능하다.

##### 2) UnChecked Exception

`Unchecked Exception은 컴파일 단계에서 확인되지 않는 예외이다.`
RuntimeException과 그 하위 클래스, 그리고 Error와 그 하위 클래스가 이에 속한다.
이 예외들은 컴파일러가 예외를 처리하거나 선언하도록 강제하지 않는다.

위의 예시를 RuntimeException으로 바꾸면 컴파일 에러가 발생하지 않는다. 이미, 컴파일이 끝나고
애플리케이션 서비스가 런타임일 때 발생하기 때문에 try-catch 또는 throws 구문을 사용해서
개발자가 로직상에 방어 코드를 만들 어 줄 수 있다.

<img width="380" alt="스크린샷 2021-01-17 오후 2 33 11" src="https://user-images.githubusercontent.com/26623547/104831978-f31ae500-58d0-11eb-9624-bd1e2763b034.png">

##### 3) 왜 Checked, Unckecked Exception으로 나눴을까?   


<https://docs.oracle.com/javase/tutorial/essential/exceptions/runtime.html>


- - - 

## 3. 자바에서 예외 처리하는 방법   

자바에서 예외를 처리할 수 있는 방법은 아래와 같다.      

##### 1) try-catch 

try 블록에는 여러 개의 catch 블록이 올 수 있으며, 이 중 `발생한 예외의 종류와 
일치하는 단 한 개의 catch 블록만 수행된다.`    

catch 블록안에 예외 클래스의 e는 해당 클래스의 인스턴스를 가르키는 
참조 변수(Reference variable)이다.   


```java
try {
      // 1을 0으로 나누었으므로 예외 발생
      System.out.println(1 / 0);
} catch (IllegalArgumentException e) {  // instanceof 확인 -> false 
      System.out.println(e.getClass().getName());
      System.out.println(e.getMessage());
} catch (ArithmeticException e) {   // instanceof 확인 -> true, ArithmeticException 인스턴스 생성!   
      System.out.println(e.getClass().getName());
      System.out.println(e.getMessage());  
      // e.printStackTrace();  
} catch (NullPointerException e) {  // skip   
      System.out.println(e.getClass().getName());
      System.out.println(e.getMessage());
}
```

Output   

```
java.lang.ArithmeticException
/ by zero
```

위처럼 참조 변수를 통해서 발생한 예외 클래스의 인스턴스를 참조할 수 있다. 해당 인스턴스에는 
발생한 예외에 대한 정보가 담겨있다. 이를 통해 Message, StackTrace 등 여러 정보를 얻어올 수 있다.   

> printStackTrace() : 예외 발생 당시의 호출스택에 있었던 메서드의 정보와 예외 메시지를 화면에 출력한다.   
> getMessage() : 발생한 예외클래스의 인스턴스에 저장된 메시지를 얻을 수 있다.    

또한, 발생한 예외 클래스는 catch 문을 순차적으로 instanceof를 통해 확인한다. 
아래 소스에서 더 포괄적인 RuntimeException이 catch문을 통해 먼저 온다면 
컴파일 에러가 발생하게 된다.     

무조건 더 포괄적인 RuntimeException에서 catch 문이 걸리기 때문에 
더 구체적인 IllegalArgumentException은 의미 없는 코드가 되므로 
컴파일 에러가 발생한다.

```java
try {
     System.out.println("try block");
} catch (IllegalArgumentException e) { // 구체적인 예외 클래스가 먼저 와야함   
     System.out.println("구체적인 예외");
} catch (RuntimeException e) {         // 더 포괄적인 예외 클래스  
     System.out.println("포괄적인 예외");
}
```


##### 2) 참조 변수 중복    

catch 블록 안에 다시 try-catch 구문을 사용할 수 있는데, 이때 `상위 catch 블록 안에 
참조 변수의 이름이 중복되어서는 안된다.`     

변수의 스코프를 생각해 보면 당연하다.   

```java
try {
    //...
} catch (IllegalArgumentException e) {
      try{
         // ... 
      }catch (ArithmeticException e) { // 에러 발생: 해당 변수 이름을 e로 할 수 없다.   
                                       // Variable 'e' is already defined in the scope
} 
```

##### 3) Multicatch block   

자바 7부터 여러 catch block을 하나로 합칠 수 있게 되었다.   

```java
try {
       System.out.println(1 / 0);
} catch (IllegalArgumentException | ArithmeticException e) {
       System.out.println(e.getMessage());
}
```
     
단, 나열된 예외 클래스들이 부모-자식 관계에 있다면 오류가 발생한다.   

```java
try {
       System.out.println(1 / 0);
} catch (RuntimeException | ArithmeticException e) { // 에러 발생! 
       System.out.println(e.getMessage());
}
```

`자식 클래스로 잡아낼 수 있는 예외는 부모 클래스로도 잡아 낼 수 있기 때문에 사실상 코드가 중복된 것이나 
마찬가지이기 때문이다.`    

##### 4) throw   

throw 키워드를 이용해서 고의로 예외를 발생시킬 수도 있다.   

```java
try {
    throw new Exception("문제 발생"); // 고의로 예외 발생   
} catch (Exception e) {
     e.printStackTrace();
     System.out.println("message: "+e.getMessage());
}
```

Output    

```
java.lang.Exception: 문제 발생
	at Test.main(Test.java:11)
message: 문제 발생
```

예외 인스턴스를 생성할 때, 생성자에 String을 넣어주면 메시지로 저장된다. 
이 메시지는 getMessage(), printStackTrace() 를 통해 얻을 수 있다.    

##### 5) throws    

throws 키워드를 통해 메서드에 예외를 선언 할 수 있다.    
메서드의 선언부에 예외를 선엄함으로써 메서드를 사용하려는 사람이 메서드의 선언부를 보았을 때, 
이 메서드를 사용하기 위해서는 어떠한 예외들이 처리되어야 하는지 쉽게 알 수 있다.   

```java
void method() throws Exception1, Exception2, ... , ExceptionN {
        // 메서드의 내용
}
```

`예외를 메서드의 throws에 명시하는 것은 예외를 처리하는 것이 아니라, 자신을 호출한 메서드에게 예외를 전달하여 
예외처리를 떠맡기는 것이다. 예외를 전달받은 메서드는 자신을 호출하는 또다른 메서드에게 전달할 수 있으며, 이런 식으로 
계속 호출스택에 있는 메서드들을 따라 전달되다가 마지막에 main메서드에서도 예외가 
처리되지 않으면, main메서드가 종료되면서 프로그램 전체가 종료된다.`   

throws 는 결국 예외처리 되는 것이 아닌 단순히 전달만 되는 것이므로 결국 어느 한 곳에서는 
try-catch문으로 처리를 해주어야 한다.   


##### 6) finally   

finally는 try-catch와 함께 예외의 발생 여부와 상관없이 항상 실행되어야 할 코드를 포함시킬 목적으로 사용된다. 
try-catch문의 끝에 선택적으로 덧붙여 사용할 수 있으며, try-catch-finally의 순서로 구성된다.    

예외가 발생한 경우에는 try -> catch -> finally 순으로 실행되고, 예외가 발생하지 
않는 경우에는 try - finally 순으로 실행된다.   

`한가자 주의할 점은 finally 블록 내에 문장은 try, catch 블록에 return문이 있더라도 실행 된다는 것이다.`   

```java
try {
     System.out.println("try block");
     return; // return 실행!
} catch (Exception e) {
     System.out.println("catch block");
} finally {
     System.out.println("finally block");
}
System.out.println("main");
```

Output   

```
try block
finally block
```

위처럼 try 문에서 return을 하여도 finally문은 반드시 실행 된다.    

**(주의) finally 안에서 return 을 하는 경우에는 신중해야 한다.**   

- try 안에 return: finally 블록을 거쳐 정상 실행   
- catch 안에 return: finally 블록을 거쳐 정상 실행   
- `finally 안에 return: try 블록 안에서 발생한 예외 무시되고 finally 거쳐서 정상 종료`   



##### 7) try-with-resources (자바 7이상이면 반드시 사용할 것!)     

`try-with-resources는 try(...)에서 선언된 객체들에 대해서 try가 종료될 때 
자동으로 자원을 해제해주는 기능이다.`    
try에서 선언된 객체가 AutoCloseable을 구현하였다면 Java는 try구문이 종료될 때 
객체의 close() 메소드를 호출해 준다.   

아래 자바 7 이전에 try-catch-finally 구문에서 자원을 해제하려면 지저분했던 코드를 
예로 보자.    

```java
public static void main(String args[]) throws IOException {
    FileInputStream is = null;
    BufferedInputStream bis = null;
    try {
        is = new FileInputStream("file.txt");
        bis = new BufferedInputStream(is);
        int data = -1;
        while((data = bis.read()) != -1){
            System.out.print((char) data);
        }
    } finally {
        // close resources
        if (is != null) is.close();
        if (bis != null) bis.close();
        // throws IOException을 해주지 않았다면..
        // 여기서도 try-catch로 감싸서 예외처리를 해줘야함   
        // 또한, IOException은 checked Exception이므로 
        // unckecked Exception에 대한 예외를 잡으로면 2중으로 
        // 예외처리를 해야함..
    }
}
```

다음 코드는 파일을 열고 문자열을 모두 출력하는 코드이다. 코드를 보면 
try에서 InputStream 객체를 생성하고 finally에서 close를 해주었다. try 안의 
코드를 실행하다 Exception이 발생하는 경우 모든 코드가 실행되지 않을 수 있기 
때문에 finally에 close 코드를 넣어주어야 한다. 심지어 InputStream객체가 null 인지 
체크해줘야 하며 close에 대한 Exception 처리도 해줘야 한다.    
여기서는 main에서 IOException를 throws한다고 명시적으로 선언했기 때문에 
close에 대한 try-catch 구문을 작성하지 않았다.   

이렇게 복잡한 코드를 자바7부터는 try-with-resources를 사용하여 리팩토링이 가능하다.   

```java
public static void main(String args[]) throws IOException {    
    try (
        FileInputStream is = new FileInputStream("file.txt");
        BufferedInputStream bis = new BufferedInputStream(is)) {
        int data = -1;
        while ((data = bis.read()) != -1) {
            System.out.print((char) data);
        }
    }
}
```

코드를 보면 try(...) 안에 InputStream 객체 선언 및 할당하였다. 여기에서 
선언한 변수들은 try 안에서 사용할 수 있다. 코드가 try 문을 벗어나면 
try-with-resources는 try(...) 안에서 선언된 객체의 close() 메소드들을 
호출하여 자원을 반납해준다. 그래서 `finally에서 close()를 명시적으로 호출해줄 필요가 없다.`   

만약, 위의 코드에서 finally 구문을 추가했을 경우 실행 순서는 try문을 실행 후 
try이 끝나게 되면 자원을 반납해주고 finally 구문이 실행된다.   

try-with-resources의 장점은 코드를 짧고 간결하게 만들어 읽기 쉽고 유지보수가 
쉬워진다. 또한 명시적으로 close를 호출하려면 많은 if와 try-catch를 사용해야 하기 
때문에 실수로 close를 빼먹는 경우가 있다.   

`try-with-resources에서 자동으로 close가 호출되는 것은 AutoCloseable을 구현한 
객체에만 해당 된다.`    

```java
// AutoCloseable 인터페이스는 자바 7부터 지원   
public interface AutoCloseable {
    void close() throws Exception;
}
```

위의 예제에서 BufferedInputStream의 상속구조는 다음과 같다.   

```
java.lang.Object
  java.io.InputStream
    java.io.FilterInputStream
      java.io.BufferedInputStream
```

InputStream은 AutoCloseable을 상속받은 Closeable을 구현하였다.   

```java
public abstract class InputStream extends Object implements Closeable {
  ....
}

public interface Closeable extends AutoCloseable {
    void close() throws IOException;
}
```

이런 이류로 위의 예제에서 BufferedInputStream 객체가 try-with-resources에 
의해서 해제될 수 있었다.   

`만약 내가 만든 클래스가 try-with-resources으로 자원이 해제되길 원한다면 
AutoCloseable을 implements하면 된다.`       


- - -

## 4. RuntimeException과 RE가 아닌 것의 차이는?   



- - - 

## 5. 커스텀한 예외 만드는 방법   

기존의 정의된 예외 클래스 외에 필요에 따라 개발자가 새로운 예외 클래스를 정의하여 사용할 수 있다.   
먼저, 커스텀 예외를 만들기 전에 참고해야할 몇가지 사항이 있다.   

##### 1) Always Provide a Benefit   

자바 표준 예외들에는 다양한 장점을 가지는 기능들이 포함되어 있다.    
이미 JDK가 제공하고 있는 방대한 양의 예외들과 비교했을 때 만들고자 하는 커스텀 예외가 어떠한 장점도 제공하지 못한다면?   
커스텀 예외를 만드는 이유를 다시 생각해 볼 필요가 있다.   

어떠한 장점을 제공할 수 없는 예외를 만드는 것 보다 오히려 IllegalArgumentException과 같은 
표준 예외 중 하나를 사용하는 것이 더 좋은 선택이다.   

##### 2) Follow the Naming Convention   

JDK가 제공하는 예외 클래스들을 보면 클래스의 이름이 모두 Exception으로 끝나는 것을 알 수 있다. 
이러한 네이밍 규칙은 자바 생태계 전체에 사용되는 규칙이다.   

즉, 만들고자 하는 커스텀 예외 클래스들도 이러한 네이밍 규칙을 따르는 것이 좋다.   

##### 3) Provide javadoc Comments for your Exception class   

많은 커스텀 예외들이 어떠한 javadoc 코멘트도 없이 만들어진 경우가 있다. 
기본적으로 API의 모든 클래스, 멤버변수, 생성자에 대해서 문서화 하는 것이 Best Practices이다.    

##### 4) Provide a constructor that sets the cause    

커스텀 예외를 던지기 전에 표준 예외를 Catch하는 케이스가 꽤 많다. 이 사실을 꼭 기억하도록 하자.   

보통 캐치된 예외에는 제품에 발생한 오류를 분석하는데 필요한 중요한 정보가 포함되어 있다.   
예제를 보면 NumberFormatException은 에러에 대한 상세정보를 제공한다.   
MyBusinessException의 cause처럼 cause정보를 설정하지 않으면 중요한 정보를 잃을 수 있다.   

```java
public void wrapException(String input) throws MyBusinessException {
    try {
        // do something
    } catch (NumberFormatException e) {
        // root cause 정보인 NumberFormatException을 생성자에 
        // 넣어 주므로써 어디에서 온 예외정보인지 확인 가능하다!   
        throw new MyBusinessException("A message that describes the error.", e, ErrorCode.INVALID_PORT_CONFIGURATION);
    }
}
```

- - - 

**Reference**    

<https://docs.oracle.com/javase/tutorial/essential/exceptions/runtime.html>     
[https://www.notion.so/9-17a778bba6ed4436ac3d7b9415b6babb](https://www.notion.so/9-17a778bba6ed4436ac3d7b9415b6babb)      
[https://codechacha.com/ko/java-try-with-resources/](https://codechacha.com/ko/java-try-with-resources/)   
[https://github.com/whiteship/live-study/issues/9](https://github.com/whiteship/live-study/issues/9)             

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

