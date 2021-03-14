---
layout: post
title: "[Java] 람다 표현식(Lambda Expressions)"
subtitle: "람다식 사용법 / 함수형 인터페이스 / Variable Capture / 메서드, 생성자 레퍼런스 / invokedynamic"       
comments: true
categories : Java
date: 2021-03-12
background: '/img/posts/mac.png'
---

# 목표     

자바의 람다식에 대해 학습하세요.    

## 학습할 것   

- 람다식 사용법   
- 함수형 인터페이스    
- Variable Capture   
- 메서드, 생성자 레퍼런스   

- - - 

# 1. 람다식이란?    

`람다식은 메서드를 하나의 식(expression)으로 표현한 것이며 익명 함수(anonymous 
        function)이라고도 한다`               

`람다식은 람다식 자체로 메서드의 매개변수가 될 수 있고, 메서드의 결과로 반환될 수 있다는 것이 
핵심이며, 이를 first-class-function이라고 부른다. 이는 함수형 프로그래밍에 필수적이다.`   

물론 자바는 함수형 패러다임을 설계단계에서부터 고려한 다른 언어들과는 다르게 
순수한 객체지향 언어로 설계되었으며, 함수형 패러다임의 이점을 잘 가져오기 위해 
많은 노력이 들어간 결과물이 바로 자바의 람다식이다.   

람다식을 사용하기에 앞서 `익명 객체(익명 클래스)` 라는 것에 대해 알면 좋다.   
아래와 같이 Functional이라는 인터페이스를 implements를 이용하여 
구현한 클래스를 만들지 않고 인터페이스를 바로 구현하여 사용하는 방법이 익명 
객체이다.   

```java
public interface Functional {
    int cal(int a, int b);
} 

Functional functional = new Functional() { 
        @Override
        public int cal(int a, int b) {
             return a+b;
         }
};
System.out.println(functional.cal(3,3));
```

위의 익명 구현 객체를 아래와 같이 람다식으로 한줄로 표현 가능하다.    

> 익명 객체를 람다식으로 대체 가능한 이유?    
    > 인터페이스를 구현한 익명 객체의 메서드와 람다식의 매개변수 타입과 개수 그리고 반환 값이 일치하기 때문에 대체 가능하다.   


```java
Functional functional = (a, b) -> a+b;
```

람다식 얘기에 앞서 굳이 익명 객체에 대해 언급한 이유는 
`익명 객체가 람다식으로 대체 될 수 있다고 해서 동작 방식과 특징이 
동일한 개념이라고 생각 할 수 있기 때문이다.`    

익명 클래스로 작성한 코드와 이를 람다로 대체한 코드 각각을 
바이트 코드를 비교해 보면 차이를 알 수 있다.   

`람다는 익명 클래스와 다르게 invokedynamic을 사용하는 것을 볼 수 있는데 
이는 아래와 같은 이점이 있다.`    

1) 미래의 최적화를 위해 특정 전략으로 고정하지 않은 것(즉, 최대한 바이트코드로 
    고정되어 컴파일 되지 않게 하는것)      

특정 translation strategy (실제 자바 실행 로직으로 변환하는 과정 및 전략)을 
런타임에서 결정할 수 있다. 따라서, 미래에 변해서 JVM 스펙이 업데이트 되었다고 
하더라도 소스코드 수정이나, 재컴파일 없이 그대로 실행 가능하다!   

만약 람다가 컴파일 타임에서 완벽하게 변환이 되었다고 한다면, 나중에 
수정사항이 있을 경우 프로젝트를 모두 재컴파일 해야 하는 일이 
생길 수 있다.   


2) 클래스 파일 표현에 안정성을 가지는 방법    

람다는 이 두가지의 모두 이점을 가지기 위해, `람다라는 표현 () -> {} 을 실제 
자바 메서드 실행 로직(바이트 코드로 나온 실행 메서드)로 컴파일 타임이 아닌 
invokedynamic을 통해서 런타임에서 로직을 연결하고 실행한다. 이를 통해서, 
    실제 람다 표현을 실행하는 로직을 결정하는 전략을 런타임에서 lazy하게 
    결정할 수 있다는 장점이 있다.`    


다른 차이점에 대해서는 아래 Variable Capture 부분에서 자세히 설명 한다.    


## 1.1 람다식 사용법    

람다식은 생략 가능한 부분이 꽤 많기 때문에 헷갈릴 수 있지만, 기본적으로 
화살표를 기준으로 좌측에는 매개변수가 오고 우측에는 실행 코드가 작성 된다는 것을 
기억하면 된다.    

```
(매개변수) -> {실행 코드}    
```

```java
public interface Functional {
    int cal(int a, int b);
}

public interface Functional2 {
    void print(String str);
}

public interface Functional3 {
    void noArgs();
}

// 1. 작성 가능한 모든 내용을 생략 없이 작성한 경우     
Functional2 functional2 = (String name) -> { System.out.println(name) };

// 2. 매개변수의 타입을 생략한 경우   
Functional2 functional2 = (name) -> { System.out.println(name) };    

// 3. 매개변수가 한개여서 소괄호를 생략한 경우    
Functional2 functional2 = name -> { System.out.println(name) };          

// 4. 실행 코드가 한 줄이어서 중괄호를 생략한 경우    
Functional2 functional2 = name -> System.out.println(name);    

// 5. 매개변수가 없어서 소괄호를 생략할 수 없는 경우    
Functional3 functional3 = () -> System.out.println("functiona3");    

// 6. 반환값이 있는 경우 return 키워드 사용하는 경우     
Functional functional = (a, b) -> {
       System.out.println("print");
       return a+b;
};

// 7. 실행 코드가 반환 코드만 존재하는 경우 키워드와 중괄호 생략한 경우    
Functional functional = (a, b) -> a+b;
```



## 1.2 람다식의 등장배경과 장단점 

하나의 CPU 안에 다수의 코어를 삽입하는 멀티 코어 프로세서들이 등장하면서 
일반 프로그래머에게도 병렬화 프로그램에 대한 필요성이 생기기 시작했다.   

이러한 추세에 대응 하기 위해 자바8 에서는 병렬화를 위한 
컬렉션(배열, List, Set, Map)을 강화했고, 이러한 컬렉션을 더 효율적으로 
사용하기 위해 스트림이 추가되었고 또 스트림을 효율적으로 사용하기 위해 
함수형 프로그램이, 다시 함수형 프로그래밍을 위해 람다가, 또 
람다를 지원하기 위한 함수형 인터페이스가 나오게 되었다.   

아래와 같이 정리해 볼 수 있다.   

> 빅데이터 지원 -> 병렬화 강화 -> 컬렉션 강화 -> 스트림 강화 -> 람다 도입 -> 인터페이스 명세 변경 -> 함수형 인터페이스 도입   

#### 장점    

- 코드를 간결하게 만들 수 있어 가독성이 향상된다.   
- 멀티쓰레드 환경에서 병렬처리가 가능하다.    
- 람다는 지연연산을 수행 함으로써 불필요한 연산을 최소화 할 수 있다. (지연 연산)   
- 함수를 만드는 과정 없이 한번에 처리하기에 생산성이 높아진다.   

#### 단점   

- 람다로 인한 무명함수는 재사용이 불가능하다.   
- stream() 에서 람다를 사용할 시에 단순 for문 혹은 while 보다 성능이 떨어진다.   
- 람다를 무분별하게 사용하면 코드가 클린하지 못하다.   

## 1.3 람다식의 타입과 형변환    

함수형 인터페이스로 람다식을 참조할 수 있는 것일 뿐이지 
람다식의 타입이 함수형 인터페이스의 타입과 일치하는 것은 아니다.   
람다식은 익명 객체에서 온것이고 익명 객체는 타입이 없다.   

정확히는 타입은 있지만 컴파일러가 임의로 이름을 정하기 때문에 알 수 없는 것이다. 
그래서 대입 연산자의 양변의 타입을 일치시키기 위해 형변환이 필요하다.    

```java
MyFunction f = (MyFunction)( () -> { } );   
```

`람다식은 MyFunction 인터페이스를 직접 구현하지 않았지만, 이 인터페이스를 구현한 
클래스의 객체와 완전히 동일하기 때문에 위와 같은 형변환을 허용한다. 그리고 
이 형변환은 생략 가능하다.`       

참고로 람다식은 이름이 없을 뿐 분명히 객체인데도, Object 타입으로 형변환 
할 수 없다. 람다식은 오직 함수형 인터페이스로만 형변환이 가능하다.   

```java
Object obj = (Object)( () -> { } ); // error. 함수형 인터페이스로만 가능    
```

굳이 변경하고자 한다면, 함수형 인터페이스로 변환하고 난 후에 가능하다.   

```java
Object obj = (MyFunction02)(() -> {});   
```






- - - 

# 2. 함수형 인터페이스란?   

`함수형 인터페이스는 추상 메서드가 하나뿐인 인터페이스이다.`        
`함수형 인터페이스(Functional Interface)를 사용하는 이유는 자바의 람다식은 
함수형 인터페이스로만 접근이 가능하기 때문이다.`    

```java
public interface Functional {
    int cal(int a, int b);
}

public class Main {
    public static void main(String[] args) {

        Functional functional = (a, b) -> {return a + b;};
        System.out.println(functional.cal(2,3 )); // 출력 : 5   
    }
}
```

또한 @FunctionalInterface 를 사용하면 다른 사람이 추상 메서드를 추가하는 
상황을 예방할 수 있다.    
추상 메서드가 1개만 선언되었는지 확인해주며, 만약 2개 이상 추상메서드가 
정의된다면 에러 메시지를 보여주게 된다.    


```java
@FunctionalInterface
public interface Functional {
    int cal(int a, int b);  // 추상 메서드는 오로지 1개만 있어야 한다.  

    // static 메서드가 있어도 된다.
    static void bbb() {}

    // default 메서드가 있어도 된다.
    default void ccc() {}
}
```

위처럼 사용이 가능하다.   

### 2.1 Java에서 기본으로 제공하는 함수형 인터페이스   

자바에서 미리 정의해둔 자주 사용할만한 Functional Interface를 알아보자.   

- Function    
- BiFunction  
- UnaryOperator    
- Consumer   
- Supplier   
- Predicate  
- Runnable ( 멀티 쓰레드 )
- 등등   

더 자세한 내용은 [docs](https://docs.oracle.com/javase/8/docs/api/java/util/function/package-summary.html) 참고하자.   


#### 2.1.1 Function<T, R>   

`값을 하나 받아서 리턴하는 일반적인 함수`         

- 별명 : 트랜스포머(변신로봇)   
- 이유 : 값을 변환하여 리턴하기 때문    

##### apply

```java
/**
     * Applies this function to the given argument.
     *
     * @param t the function argument
     * @return the function result
     */
    R apply(T t);
```

```java
Function<Integer, Integer> plus = (number) -> number + 10;
System.out.println(plus.apply(5)); // 출력 : 15
```

또한 T의 매개변수를 받아서 R로 리턴한다는 것은 위처럼 같은 Integer 타입만을 의미하는 것은 아니다.    
아래와 같이 Integer 타입을 받아서 다른 타입으로 변경이 가능하다.    

```java
// Function<Integer, Double>  
Function<Integer,Double> function = integer -> Double.valueOf(integer);
```

##### compose   

입력값을 가지고 먼저 뒤에 오는 함수를 적용한다.   
그 결과값을 가지고 입력값으로 사용하는 것이다.   

```java
Function<Integer, Integer> plus1 = (number) -> number * 2;
Function<Integer, Integer> plus2 = (number) -> number + 1;

Function<Integer, Integer> compose = plus1.compose(plus2);
System.out.println(compose.apply(5)); // 출력 : 12 
```

##### andThen   

compose와 반대로 먼저 적용하고 뒤에 오는 함수를 적용한다.    

```java
Function<Integer, Integer> plus1 = (number) -> number * 2;
Function<Integer, Integer> plus2 = (number) -> number + 1;

Function<Integer, Integer> compose = plus1.andThen(plus2);
System.out.println(compose.apply(5)); // 출력 : 11
```


#### 2.1.2 BiFunction<T, U, R>    

`Function과 유사하지만 입력값을 2개를 받는 것이다.`     


```java
// (T, U) -> R   

BiFunction<T, U, R>
```

#### 2.1.3 UnaryOperator<T>   

`Function<T, R>의 특수한 형태이며 입력값을 하나 받아서 동일한 
타입을 리턴하는 함수`     

입력/리턴 값이 같으므로 이전의 Function을 아래와 같이 변경 가능하다.   

```java
// Function<Integer, Integer> plus10 = (number) -> number + 10;
UnaryOperator<Integer> plus10 = (number) -> number + 10;


// Function<Integer, Integer> multiply2 = (number) -> number * 2;
UnaryOperator<Integer> multiply2 = (number) -> number * 2;
```


#### 2.1.4 Consumer<T>   

`매개변수는 있고 리턴이 없는 함수`    

```java
/**
* Performs this operation on the given argument.
*
* @param t the input argument
*/
void accept(T t);   
```

- 별명 : Spartan(스파르탄)   
- 이유 : 모든 것을 빼앗고 아무것도 내주지 마라!   


```java
Consumer<Integer> print = Integer -> System.out.println("print");   
print.accept(10);   
```


#### 2.1.5 Supplier<T>    

`T 타입의 값을 제공해주는 함수`       

```java
/**
* Gets a result.
*
* @return a result
*/
T get();
```

- 별명 : 게으른 공급자   
- 이유 : 입력값이 존재하지 않는데, 내가 원하는 것을 미리 준비하기 때문에   

```java
Supplier<Integer> get10 = () -> 10;
System.out.println(get10.get());
```

#### 2.1.6 Predicate<T>   

`T타입의 값을 받아서 boolean을 반환하는 함수 인터페이스이며, 
    여러 조건식들을 논리 연산자인 and, or, not 등으로 연결해서 하나의 식으로 
    구성할 수 있는 것처럼 여러 Predicate를 and(), or(), negate()로 연결해서 
    하나의 새로운 Predicate로 결합할 수 있다.`         


```java
boolean test(T t);
```

- 별명: 판사   
- 이유 : 참과 거짓으로 판단하기 때문에    

```java
Predicate<Integer> predicate = i -> i < 10;
boolean test = predicate.test(5);
System.out.println(test); // true  
```

- - - 

# 3. Variable Capture    

람다식의 실행 코드 블록 내에서 클래스의 멤버 필드와 멤버 메서드, 그리고 
지역 변수를 사용할 수 있다.    
클래스의 멤버 필드와 멤버 메서드는 특별한 제약 없이 사용 가능하지만, 
    지역변수를 사용함에 있어서는 제약이 존재한다.   
이 내용을 잘 이해하기 위해서는 JVM의 메모리 구조에 대해 잘 알고 있어야 한다.   

이를 이해하기 위한 개념들에 대해 잠깐 살명해 보면    

1. 클래스의 멤버 메서드의 매개변수와 이 메서드 실행 블록 내부의 지역 변수는 
JVM의 stack에 생성되고 메서드 실행이 끝나면 stack에서 사라진다.   

2. new 연산자를 사용해서 생성한 객체는 JVM의 heap 영역에 객체가 생성되고 GC(Garbage Collector)에 의해 
관리되며, 더 이상 사용하지 않는 객체에 대해 필요한 경우 메모리에서 제거한다.   

`heap에 생성된 객체가 stack의 변수를 사용하려고 하는데, 사용하려는 시점에 stack에 
더이상 해당 변수가 존재하지 않을 수 있다.`   
`왜냐하면 stack은 메서드 실행이 끝나면 매개변수나 지역변수에 대해 제거하기 때문이다. 그래서 더 이상 존재하지 않는 
변수를 사용하려 할 수 있기 때문에 오류가 발생한다.`   

**자바는 이 문제를 Variable Capture라고 하는 값 복사를 사용해서 해결하고 있다.**    

아래 예제를 살펴보자.   

```java
public class VariableCapture {

    public static void main(String[] args) {

        VariableCapture capture = new VariableCapture();
        capture.run();
    }

    private void run() {
        String str = "로컬 변수";

        class LocalClass {
            void printStr() {
                System.out.println(str);
            }
        }
    }
}
```

run 메서드에서 갖고 있는 변수 str은 run 메서드 실행이 완료되면 사라진다.    
그런데 `run 메서드 안의 로컬 클래스인 LocalClass에서 testStr을 사용해야 하니까 
자바에서는 값 복사를 해오는데 이를 Variable Capture이다.`       

이것은 내부 클래스에서 뿐만 아니라, 익명클래스, 람다 등에서 발생 할 수 있다.   

자바 8이전에는 로컬 변수를 참조 할 때 final 키워드를 사용해야 Variable Capture을 
할 수 있었다.   

```java
private void run() {
	final String str = "변수 캡처"; // 자바 8 이전 에는 final 키워드 필수

	class LocalClass {
		void printStr() {
			System.out.println(str);
		}
	}
}
```

final 키워드를 사용하지 않은 경우 concurrency 문제가 생길 수 있어서 컴파일러가 
방지한다.   

그러나, 자바 8부터는 effective final을 지원해 final 키워드를 사용하지 않은 변수를 
로컬 클래스, 익명 클래스 구현체 또는 람다에서 참조할 수 있다.     

`effective final 사실상 final이란 변수가 추후 변경되지 않은 상황의 변수를 지칭하는데, 
    나중에 변수가 변경된다면?, effective final이 아니라면?`   

```java
public class VariableCapture {

    public static void main(String[] args) {

        VariableCapture capture = new VariableCapture();
        capture.run();
    }

    private void run() {
        int baseNumber = 10;

        class LocalClass {
            void printNumber() {
                System.out.println(baseNumber); // 컴파일 에러 발생!
            }
        }

        Consumer<Integer> consumer = new Consumer<Integer>() {
            @Override
            public void accept(Integer integer) {
                System.out.println(baseNumber); // 컴파일 에러 발생!
            }
        };

        IntConsumer intConsumer = (i) -> System.out.println(i + baseNumber); //컴파일 에러 발생!

        baseNumber++;
    }
}
```

Variable 'baseNumber' is accessed from within inner class, needs to be final or effectively final 같은 
컴파일 에러가 발생한다.     

### 람다 vs 익명 클래스 vs 로컬 클래스    

##### 공통점    

- Variable Capture 지원   
- effective final 지원    

##### 차이점    

- 익명클래스, 로컬클래스는 각각의 scope을 가지고 있기 때문에 쉐도잉 지원    
- 람다는 해당 람다식을 구현한 곳(ex. 메서드)과 같은 scope을 갖기 때문에 쉐도잉을 지원하지 않는다.  

쉐도잉에 대한 예제는 아래와 같다.    

```java
public class VariableCapture2 {

	public static void main(String[] args) {
		VariableCapture2 test = new VariableCapture2();
		test.run();
	}

	private void run() {
		int baseNumber = 10;

		class LocalClass {
			void printNumber() {
				int baseNumber = 11;
				System.out.println(baseNumber);
			}
		}

		Consumer<Integer> consumer = new Consumer<Integer>() {
			int baseNumber = 13;
			@Override
			public void accept(Integer integer) {
				System.out.println(baseNumber);
			}
		};

		LocalClass localClass = new LocalClass();
		localClass.printNumber();
		consumer.accept(1);
	}
}
```

output 

```
11
13
```


`run 메서드의 지역변수인 baseNumber의 값은 10이였는데 로컬 클래스, 익명 클래스와 run 메서드는 
서로 다른 scope에 있기 때문에 가려져서 11과 13이 출력된 것이다. 이것을 
쉐도잉이라고 한다.`      

`하지만 람다는 run() 메서드와 같은 scope에 있어서 쉐도잉이 불가능하다.`    

<img width="700" alt="스크린샷 2021-03-14 오후 3 12 21" src="https://user-images.githubusercontent.com/26623547/111060098-e3d5a380-84dd-11eb-9340-d7709e7141ad.png">   

<img width="700" alt="스크린샷 2021-03-14 오후 4 02 12" src="https://user-images.githubusercontent.com/26623547/111060232-a9203b00-84de-11eb-9167-9ade8dfdd4e6.png">    

위와 같이 같은 scope이라는 컴파일 에러가 발생한다.   

- - - 

# 4. 메서드, 생성자 레퍼런스   

`메서드, 생성자 레퍼런스는 람다식을 더 간략하게 표현할 수 있게 해준다.`         
콜론 두개 ::를 사용하며, 크게 다음과 같이 구분할 수 있다.   

- static 메서드 참조 -> `타입::static 메서드`   
- 특정 객체의 인스턴스 메서드 참조 -> `객체 래퍼런스::인스턴스 메서드`   
- 임의 객체의 인스턴스 메서드 참조 -> `타입::인스턴스 메서드`    
- 생성자 참조 -> `타입::new`     

아래와 같이 예제를 통해서 하나씩 살펴보자.   

```java
public class Greeting {
    private String name;
    public Greeting(){ }
    public Greeting(String name){
        this.name = name;
    }
    public String hello(String name){
        return "hello " + name;
    }
    public static String hi(String name){
        return "hi " + name;
    }
}
```    

`UnaryOperator를 이용해서 static 메서드를 참조하는 예제는 아래와 같다.`    

```java
UnaryOperator<String> usingGreeting = Greeting::hi;
        
System.out.println(usingGreeting.apply("kaven"));
//print : hi kaven
```

`아래는 인스턴스 메서드를 사용한 예제이다.`   

```java
Greeting greeting = new Greeting();
UnaryOperator<String> usingGreeting = greeting::hello;
System.out.println(usingGreeting.apply("kaven"));
```

`아래는 생성자를 사용한 예제이며, Supplier와 Function을 각각 사용하였다.`    

```java
// 입력값은 없는데 반환값은 있는 함수형 인터페이스 > Supplier
Supplier<Greeting> newGreeting = Greeting::new;
Greeting greeting = newGreeting.get();
```

```java
// 입력값은 없는데 반환값은 있는 함수형 인터페이스 > Supplier
Supplier<Greeting> newGreeting = Greeting::new;
Greeting greeting = newGreeting.get();
```

`아래는 임의의 객체를 참조하는 메서드 레퍼런스 예제이다.   `

```java
String[] names = {"D", "B", "C", "A"};
Arrays.sort(names, String::compareToIgnoreCase);
System.out.println(Arrays.toString(names));
```
- - - 

**Reference**   

<https://velog.io/@kwj1270/Lambda>    
<https://www.notion.so/758e363f9fb04872a604999f8af6a1ae>   
<https://www.notion.so/a875fcd046db4ddd8dce01bf61743f5e>   
<https://yadon079.github.io/2021/java%20study%20halle/week-15>    

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}
