---
layout: post
title: "[Java] 인터페이스 "
subtitle: ""
comments: true
categories : Java
date: 2021-01-04
background: '/img/posts/mac.png'
---

## 목표

자바의 인터페이스에 대해 학습하세요.   

## 학습할 것 

- 인터페이스 정의하는 방법   
- 인터페이스 구현하는 방법   
- 인터페이스 레퍼런스를 통해 구현체를 사용하는 방법  
- 인터페이스 상속  
- 인터페이스의 기본 메소드(Default Method), 자바 8
- 인터페이스의 static 메소드, 자바 8   
- 인터페이스의 private 메소드, 자바 9   

- - -

## 1. 인터페이스란 ?    

인터페이스란 일종의 추상클래스이며, 추상클래스보다 추상화의 정도가 더 높다.   
추상클래스는 추상메서드 이외에도 구현부가 있는 일반메서드나 변수를 사용할 수 있는 반면, 
인터페이스는 오직 추상메서드와 상수만을 가질수 있다(자바 8 이전 기준)     

#### 인터페이스 특징 

인터페이스는 추상메서드와 상수만을 사용할수 있다. 그런데 우리는 
인터페이스에 보통 abstract 키워드를 붙이지 않는다.    
abstract을 붙이지 않은 메서드와 static final 을 붙이지 않은 변수를 
선언했고 컴파일 에러는 발생하지 않는다.

```java
public interface InterfaceTest {
    int num = 10;
    public static final int NUM = 10;
    void method();
}
```

InterfaceTest.class 를 바이트 코드를 보면 이유를 알 수 있다.

```java
$ javap -c InterfaceTest  
Compiled from "InterfaceTest.java"

public interface InterfaceTest {
  public static final int num;

  public static final int NUM;

  public abstract void method();
}
```

`메서드는 자동으로 public abstract가 붙었고, 변수는 자동으로 public final static 이 
붙어 상수가 된 것을 확인 할 수 있다.`    

- - - 

## 2. 인터페이스 정의하는 방법   

1) 일반적으로 클래스를 정의할 때 사용하는 키워드 interface를 사용한다.   

2) 모든 변수는(상수) public static final 이 붙어야하며, 생략 시 컴파일러가 자동으로 추가해준다.    

3) 모든 메서드는 public abstract 이 붙어야하며, 생략 가능하다.   

`단, static 메서드와 default 메서드는 예외이다.(자바 8 부터)`   

- - - 

## 3. 인터페이스 구현하는 방법   

## 4. 인터페이스 레퍼런스를 통해 구현체를 사용하는 방법

- - - 

## 5. 인터페이스 상속 

자바는 다중상속이 불가능하다. 그러나 인터페이스는 예외이다. 
스마트폰은 전화기, MP3, 인터넷을 한 기기에서 사용할 수 있는데 
이를 간단하게 코드로 만든다고 하면 아래와 같다. 

```java
public interface Phone {
   void call();
}

public interface Internet {
    void internet();
}

public interface Mp3 {
   void mp3();
}
```

```java
public class Smartphone implements Phone, Internet, Mp3 {
   @Override
   public void call() { }
    
   @Override
   public void internet() { }
   
   @Override
   public void mp3() { }
}
```


- - - 

## 6. 인터페이스의 Default Method, 자바 8 

`인터페이스는 추상메서드와 상수만을 가질수 있는데 자바 8부터는 Default Method가 추가 되었다.`   

인터페이스는 구현보다는 선언에 집중이 되어있는데, 무었때문에 추가되었을까?   

인터페이스에 새로운 메서드를 추가한다는 것은 굉장히 복잡한 일이 될 수 있다.   
추상메서드를 추가하게 되면 인터페이스를 구현한 모든 클래스에 
새로운 메서드를 구현해줘야 한다.   

이를 보완하기 위해 Default Method가 추가된 것이다.   

default 키워드를 앞에 붙여 사용하며, 일반 메서드처럼 구현부가 있어야 한다.   

default가 붙지만 접근제어자는 public이며, 생략 가능하다.   

```java
public interface Keyboard {
    void type();     // 추상메서드
    
    default void typing() { // default method
       System.out.println("키보드로 타이핑을 할 수 있다.");
   }
}
```

Keyboard 클래스에 typing 메서드가 새롭게 추가되었다고 생각해 보면 
추상메서드가 아니고 일반 메서드이기 때문에 이를 구현한 클래스는 변경할 
것이 하나도 없다.   


##### default 메서드가 충돌이 난다면 

만약 메서드 이름이 중복되어 충돌되는 상황이라면   

 클래스에서 default메서드를 재정의했다면 첫번째 우선 순위이다.   


- - - 

## 7. 인터페이스의 static 메서드, 자바 8   

static Method는 default Method와 같이 자바 8에서 부터 추가 되었다.   

`오버라이딩이 가능한 default 메서드와는 다르게 오버라이딩이 불가능하다.`   

`또한, 객체를 만들지 않고 반드시 클래스명을 통해 호출해야 한다.`   

```java
public interface Calculator {
    static int sum(int num1, int num2) { // 오버라이딩 불가( static method )
        return num1 + num2;
    }
    
    default int multiple(int num1, int num2) { // 오버라이딩 가능( default method )
        return num1 * num2;
    }
} 
```

```java
public class Main {
   public static void main(String[] args) {
      int sum = Calculator.sum(10, 20);  // 반드시 클래스명.메서드명() 으로 호출   
   }
}
```

- - -

## 8. 인터페이스 private 메소드, 자바 9   



- - - 

**Reference**    

[https://leegicheol.github.io/whiteship-live-study/whiteship-live-study-08-interface/](https://leegicheol.github.io/whiteship-live-study/whiteship-live-study-08-interface/)   
[https://github.com/whiteship/live-study/issues/8](https://github.com/whiteship/live-study/issues/8)             

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

