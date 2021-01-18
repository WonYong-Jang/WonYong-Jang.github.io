---
layout: post
title: "[Java] 인터페이스 "
subtitle: "인터페이스의 default method, static method, private method, 함수형 인터페이스 "
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
- 함수형 인터페이스   
- Constant Interface   
- - -

## 1. 인터페이스란 ?    

인터페이스란 일종의 추상클래스이며, 추상클래스보다 추상화의 정도가 더 높다.   
추상클래스는 추상메서드 이외에도 구현부가 있는 일반메서드나 변수를 사용할 수 있는 반면, 
인터페이스는 오직 추상메서드와 상수만을 가질수 있다(자바 8 이전 기준)   

> 자바 8부터는 인터페이스도 default method와 static method가 추가 됨으로써 
구현부가 있는 메서드를 생성할 수 있다.   

인터페이스와 abstract 클래스를 사용하는 이유는 아래와 같다.   

설계시 선언해두면, 개발할 때 기능을 구현하는 데에만 집중할 수 있다. `상속이 
상위 클래스의 기능을 하위 클래스가 물려 받는 것이라고 한다면, 인터페이스는 
하위 클래스에 특정 메서드를 구현하도록 강제한다`          

인터페이스는 객체로 생성할 수 없기 때문에 생성자를 가질 수 없다.   

`또한, 자바의 다형성을 극대화 하여 코드의 수정을 줄이고 유지보수성을 높인다.`    

다형성을 극대화하여 loose coupling에 도움을 준다. 아래는 관련 링크이다.    

[관련 링크](https://wonyong-jang.github.io/java/2020/05/17/Java-Loose-coupling.html)   


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

#### 추상클래스와 인터페이스의 차이점   

1) 추상 클래스는 일반 메서드와 추상 메서드 둘다 가질 수 있다.     
인터페이스는 오로지 추상 메서드와 상수만을 가진다. 하지만, 자바 8 부터는 default method와 static method가 추가 되어 
일반 메서드도 생성 가능.   

2) 인터페이스 내에 존재하는 메서드는 public abstract 로 선언되며 생략 가능   
( 위 바이트코드 참조)   

3) 인터페이스 내에 존재하는 변수는 무조건 public static final로 선언되며, 이를 생략 가능   

`4) 추상클래스는 일반 변수 선언이 가능하지만 인터페이스는 상수만 선언 가능!`    

인터페이스가 자바 8부터 default method, static method 또한, private 까지 제공하면서 
더 이상 추상클래스가 필요 없어진 걸까 ? 

인터페이스가 추상클래스가 제공하는 기능들을 사용할 수 있게 되면서 인터페이스를 
많이 사용하게 된 건 맞지만 `인터페이스는 일반 변수 선언이 불가능하다.`   

```java
public abstract class AbstractTest {
    private int num = 10;  // 인터페이스에서는 public static final 상수만 사용가능   

    public int method() {
        return num*num;
    }
}
```

#### 익명 구현 객체 

인터페이스를 구현하기 위해 해당 인터페이스를 구현할 클래스를 생성해야 하는데 
일회성이고 재사용할 필요가 없다면 굳이 클래스 파일을 만들 필요가 없다. 이럴 경우 
익명 클래스를 사용하면 된다.   

```java
// 구현할 인터페이스 
public interface Car {
    void drive();
}

public class Test {
    public static void main(String[] args) {

        // 익명 객체 
        // 필드와 메서드를 선언할 수 있지만, 
        // 익명 객체 안에서만 사용가능
        Car car = new Car() {
            @Override
            public void drive() { // 인터페이스에 선언된 추상 메서드 구현 
                System.out.println("Drive!");
            }
        };
        // 하나의 실행문이므로 끝에 세미콜론 반드시 붙여야 함
    }
}
```


- - - 

## 2. 인터페이스 정의하는 방법   

1) 일반적으로 클래스를 정의할 때 사용하는 키워드 interface를 사용한다.   

> 접근 제어자로는 public 또는 default를 사용한다.   

2) 모든 변수는(상수) public static final 이 붙어야하며, 생략 시 컴파일러가 자동으로 추가해준다.    

3) 모든 메서드는 public abstract 이 붙어야하며, 생략 가능하다.   

`단, static 메서드와 default 메서드는 예외이다.(자바 8 부터)`   

- - - 

## 3. 인터페이스 구현하는 방법   

implements 라는 키워드를 쓴 후 인터페이스를 나열하면 되고 상속과 달리 여러개의 인터페이스를 implements 할 수 있다.      

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

## 4. 인터페이스 레퍼런스를 통해 구현체를 사용하는 방법

인터페이스 레퍼런스는 인터페이스를 구현한 클래스의 인스턴스를 가르킬 수 있고, 
    해당 인터페이스에 선언된 메서드(수퍼 인스턴스 메서드 포함)만 호출 할 수 있다.   


- - - 

## 5. 인터페이스 상속 

인터페이스의 상속 구조에서는 `서브 인터페이스는 수퍼 인터페이스의 메서드까지 모두 가지고 있으므로 이를 구현한 
클래스에서는 모든 메서드를 구현해 주어야 한다.`       

인터페이스는 클래스와 달리 다중 상속이 가능하다.   
인터페이스의 메서드는 추상 메서드로 구현하기 전의 메서드이기 때문에 어떤 인터페이스의 메서드를 상속받아도 
같기 때문이다.   

하지만 아래와 같은 경우를 주의하자.    

`상위 인터페이스에 있는 메서드 중에 메서드 명과 파라미터 형식은 같지만 리턴 타입이 다른 메서드가 있다면, 
    둥 중 어떤 것을 상속받느냐에 따라 규칙이 달라지기 때문에 다중 상속이 불가능 하다!`   

<img width="500" alt="스크린샷 2021-01-07 오후 10 31 41" src="https://user-images.githubusercontent.com/26623547/103898422-3ee2c700-5138-11eb-80dc-e7f141c63311.png">    

위와 같이 수퍼 인터페이스 A, C 에서 메서드 명과 파라미터 형식이 같은 m1메서드의 
리턴 타입만 다르기 때문에 컴파일 에러를 발생시킨다.   

Method Signature에 의해서 같은 메서드로 취급하지만 실제로는 리턴 타입이 다르기 때문에 
컴파일 에러를 발생시키는 것 같다.( 잘못된 설명이라면 댓글 부탁드려요)  

[Method Signature 설명](http://localhost:4000/java/2020/12/21/Java-Inheritance.html)

- - - 

## 6. 인터페이스의 Default Method, 자바 8 

과거 인터페이스의 default 메소드가 없었을 때 인터페이스 여러가지 메서드들 중 
한가지 메서드만 사용하는 구현체가 있을 경우 아래와 같이 개발하였다.    

```java
public interface InterfaceTest {

    void a();
    void b();
    void c();
}
```

```java
public abstract class AbstractTest implements InterfaceTest{

    @Override
    public void a() { }

    @Override
    public void b() { }

    @Override
    public void c() { }
}
```

```java
// 자바 8 이전에는 추상클래스를 상속받아서 사용   
public class ClassTest extends AbstractTest{

    @Override
    public void a() { // 원하는 메서드만 구현해서 사용 
        System.out.println("a 메서드만 구현 ");
    }
}
```

자바 8 이전 인터페이스는 추상메서드와 상수만 있었기 때문에
구현보다는 선언에 집중이 되어있는데, 무엇때문에 default 메서드가 추가되었을까?

자바 8 이상에서는 인터페이스의 default 메소드가 제공됨에 따라 
중간에 추상 클래스가 필요없이도 모든 메서드를 구현하지 않고 원하는 
메서드만 오버라이딩하여 개발이 가능하게 되었다.   

default 키워드를 앞에 붙여 사용하며, 일반 메서드처럼 구현부가 있어야 한다.

default가 붙지만 접근제어자는 public이며, 생략 가능하다.

```java
public interface InterfaceTest {

    default void a() {}
    default void b() {}
    default void c() {}
}
```

> 위를 implements 하여 원하는 메서드만 오버라이딩이 가능하다! 이를 통해, 구현체들은 
상속에 대해 자유로워지게 되었다.   

`추상클래스를 한번 상속받아 사용하게 되면 자바는 다중 상속이 안되므로, 그 구현체는 
더 이상 상속을 하지 못하는 단점에서 벗어날 수 있게 되었다.`    

또한, 인터페이스에 새로운 메서드를 추가한다는 것은 굉장히 복잡한 일이 될 수 있다.   
추상메서드를 추가하게 되면 인터페이스를 구현한 모든 클래스에 
새로운 메서드를 구현해줘야 한다.   

Default Method를 사용하게 되면 `하위 호완성`을 유지할 수 있기 때문에 
기존에 구현된 클래스들이 영향을 받지 않으면서 새로운 메서드를 추가 할 수 있다.     


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

또한, 필요하다면 오버라이딩하여 재정의할 수 있다.   


##### default 메서드가 충돌이 난다면 

만약 메서드 이름이 중복되어 충돌되는 상황이라면 직접 오버라이딩 해줘야 한다.   

아래와 같이 2개의 인터페이스에 동일한 메소드 a(), b()가 있고 구현체에서 
두 인터페이스를 구현하려고 할때 에러가 발생한다. 그럴 경우 
아래와 같이 메소드를 오버라이딩 해주면 된다.   

```java
public class ClassTest implements InterfaceTest, InterfaceTest2{

    @Override
    public void a() {   } // 재정의 하여 해결 

    @Override
    public void b() {   }
}
```




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

## 8. 인터페이스의 private 메서드, 자바 9    

자바 9에서는 추가적으로 private method와 private static mehotd가 추가되었다.   

- 메서드의 몸통 {}이 있고 abstract이 아니다. 
- 구현체에서 구현할 수 없고 자식 인터페이스에서 상속이 불가능하다.   
- static 메서드도 private이 가능하다.   

추가된 이유는 아래와 같다.   

- java 8 의 default method와 static method는 특정 기능을 처리하는 내부 method 임에도 불구하고, 
    public method로 만들어야 하기때문에 불편함이 있다.   

- interface를 구현하는 다른 interface 혹은 class가 해당 method에 엑세스 하거나 
상속할 수 있는 것을 원치 않은 경우도 있지만 그렇게 할 수 없었다.   

- - - 

## 9. 함수형 인터페이스(Functional Interface)       

`Functional Interface는 1개의 추상 메서드를 갖고 있는 인터페이스를 말한다.` Single Abstract 
Method(SAM)이라 불리기도 한다.     


자바 8에서는 함수를 `1급 시민`처럼 다룰 수 있도록, 함수형 인터페이스를 제공한다.   

1급시민 되면 아래처럼 다룰 수 있게 된다.   

1) 변수에 값을 할당할 수 있다.   
2) 함수를 파라미터로 넘겨줄 수 있다.   
3) 함수의 반환값이 될 수 있다.     

함수형 인터페이스는 아래와 같이 사용한다.    

```java
// 어노테이션으로 Functional Interface임을 명시 
// 이처럼 명시했을 경우 2개 이상 추상메서드를 가질 경우 컴파일 에러! 
@FunctionalInterface
interface Addition {
    int addition(final int num1, final int num2);
}
```

- `한개의 추상 메서드만 가져야 한다.`     
- `@FunctionalInterface 어노테이션을 붙여야 한다.`        

이렇게 되면 Addition타입을 가지는 addition이라는 메서드는 이제부터 1급시민 처럼 
사용할 수 있다.   

##### 1. 변수에 값을 할당    

```java
Addition add = (num1, num2) -> num1+num2; // 함수 형태로 변수에 값을 넣음 
System.out.println(add.addition(2,2));    // 결과값 : 4
```

##### 2. 함수를 파라미터로 넘겨줌    

```java
public class Test {
    public static void main(String[] args) {

        method((num1, num2) -> (num1+num2)); // 함수가 파라미터로 들어감   

    }
    public static void method(Addition add) {
        System.out.println(add.addition(1,2));
    }
}
```

##### 3. 함수의 반환값이 될 수 있어야 한다.    


```java
public static void main(String[] args) {
    Addition add = test();
    System.out.println(add.addition(1,2));
}

static Addition test() {
    return (i1, i2) -> i1 + i2; // 함수가 리턴값에 들어감
}
```

- - - 
## 10. Constant Interface   

`Constant Interface는 사용을 추천하지 않는 Anti 패턴이다.`     

Constant Interface는 오직 상수만 정의한 인터페이스이다. 인터페이스에서 
변수를 등록할 때 자동으로 public static final 이 붙어서 상수가 되기 때문에 
어디에서나 접근할 수 있다. 또한, 하나의 클래스에 여러 개의 인터페이스를 
implements 할 수 있는데, Constant Interface를 implements 할 경우, 인터페이스의 
클래스명을 네임스페이스로 붙이지 않고 바로 사용할 수 있다.   

하지만 아래와 같은 이유로 사용을 추천하지 않는다.   

- 사용하지 않을 수도 있는 상수를 포함하여 모두 가져오기 때문에 계속 가지고 있어야 한다.   

- 상수 인터페이스를 implements한 클래스에 같은 상수를 가질 경우, 클래스에 정의한 상수가 
사용되므로 사용자가 의도한 흐름으로 프로그램이 돌아가지 않을 수 있다.   

`자바 문서에서는 Constant interface를 Anti 패턴으로 명시하였고 이에 대한 
방안으로 상수만 모아놓은 클래스를 생성하여 import static 하여 사용을 권장한다.`   



- - - 

**Reference**    


[https://leegicheol.github.io/whiteship-live-study/whiteship-live-study-08-interface/](https://leegicheol.github.io/whiteship-live-study/whiteship-live-study-08-interface/)   
[https://github.com/whiteship/live-study/issues/8](https://github.com/whiteship/live-study/issues/8)             


{% highlight ruby linenos %}
{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

