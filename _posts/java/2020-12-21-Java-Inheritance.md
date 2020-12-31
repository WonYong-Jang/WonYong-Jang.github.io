---
layout: post
title: "[Java] 상속 "
subtitle: "super, 다이나믹 메소드 디스패치, 더블 디스패치(방문자패턴) , 추상클래스, Object 클래스"
comments: true
categories : Java
date: 2020-12-21
background: '/img/posts/mac.png'
---

## 목표

자바의 상속에 대해 학습하세요.   

## 학습할 것 

- 자바 상속의 특징
- super 키워드
- 메소드 오버라이딩
- 다이나믹 메소드 디스패치(Dynamic Method Dispatch)   
- 추상 클래스    
- Object 클래스   

- - -

## 1. 자바의 상속( extends ) 

현실 세계에서 부모님이 자식들에게 재산을 물려주는 것과 비슷하다. 차이라고 하면 
자식(클래스)이 상속받고 싶은 부모(클래스)를 선택해서 물려받는다. 이때 상속받는 
클래스를 자식 클래스, 하위클래스 또는 서브 클래스라고 부른다. 상속을 해주는 
클래스를 부모 클래스, 상위 클래스 또는 슈퍼 클래스라고 한다.   

#### 1-1) 상속의 대상    

자식 클래스가 부모 클래스로부터 상속을 받게 되면 부모 클래스의 필드와 메서드를 물려받게 된다. 
`단, 접근 제어자가 private을 갖는 필드나 메소드는 상속이 불가하고, 패키지가 다를 경우 접근제어자가 
default인 경우도 상속이 불가하다.`   

#### 1-2) 상속의 특징   

`자바에서는 자식 클래스가 여러 부모로부터 다중 상속을 받는 것은 불가능하다.`    
1개의 부모 클래스로부터 단일 상속만 허용된다. 하지만 부모 클래스는 여러개의 자식 클래스에게 
상속이 가능하다.   

- - - 

## 2-1. super() 키워드    

this() 키워드는 자기 자신의 생성자를 호출하는 키워드라면 super() 는 자신의 부모 클래스의 생성자를 
호출하는 키워드이다.    
바로 윗 단계의 부모 클래스 뿐 아니라 부모의 부모 또 부모의 부모 클래스의 생성자를 모두 호출한다.  
super()를 사용하지 않은 경우엗 자동으로 상위클래스의 기본생성자를 호출한다.   

#### 예제 1

아래와 같이 예제를 보자.   
School -> Teacher -> Student 순으로 상속을 주고 받는다. Teacher 클래스는 School에게 상속받고 Student 클래스는 
Teacher클래스에게 상속받으므로 Student 클래스틑 School 클래스의 자원 역시 사용 할 수 있는 자식 클래스이다.   

```java
public class Student extends Teacher
public class Teacher extends School
public class School
```

```java
public class School{
    public School() {
        System.out.println("school");
    }
}

public class Teacher extends School {
    public Teacher() {
        System.out.println("teacher");
    }
}

public class Student extends Teacher {

    public Student() {
        super(); // 
        System.out.println("student");
    }
}
```

super() 로 인해서 Student의 브모클래스의 생성자인 Teacher클래스의 생성자가 호출된다. 그렇지만 super는 조상의 
조상클래스까지 확인하는 키워드라 Teacher클래스가 상속받는 클래스가 있는지 확인한다. School 클래스까지 확인하고 
더이상 상속받는 클래스가 없으므로 School 클래스의 생성자부터 실행하고 Teacher 클래스 생성자를 실행 후 
Student 클래스로 돌아온다. 
결과는 아래와 같이 출력된다. 

```
// 호출 결과 
school
teacher
student
```

#### 예제 2   

클래스를 인스턴스하게 되면 기본 생성자가 자동으로 생성된다. 그런데 아래처럼 파라미터가 있는 생성자만 
만들어주면 기본 생성자는 만들어지지 않는다.    
`그런데 문제는 자식들이 부모의 기본생성자를 호출하도록 되어 있기 때문에 부모에서 없는 기본 생성자를 못찾아 
오류가 발생한다.`    
`자식 클래스의 기본생성자에는 super() 키워드가 생략되어 있기 때문이다!`   

```java
public class Student extends Teacher {
    public Student() {
        super(); // 생략되어 있음 
    }
```

위의 오류 해결법은 부모의 기본생성자를 만들어주는 방법이 있고 부모의 파라미터가 있는 생성자를 super()에 
매개변수를 추가하여 호출함으로써 해결 가능하다.   

```java
public class Teacher extends School {
    public Teacher(String name, String code) {
        super(name, code);
    }
```




## 2-2. super 키워드 

this 가 자기자신의 멤버필드 또는 메소드를 사용할 때 객체를 생성하지 않고 접근할 수 있는 키워드 였다면 
super는 부모의 멤버필드 또는 메소드에 접근하는 키워드이다.    
상위클래스의 멤버변수를 사용하기 위해서 super.변수명으로 접근한다.   
`주의할 점은 super 키워드를 사용하면 자신을 제외한 조상 클래스에서 멤버필드 또는 메서드를 찾고 그 중 
가장 가까이에 있는 멤버필드 또는 메서드를 가르킨다.`


## 3. 메소드 오버라이딩, 오버로딩 

`자바에서 다형성을 지원하는 방법으로 메소드 오버로딩과 오버라이딩이 있다.`          
상속을 받으면 부모클래스의 멤버 변수 뿐 아니라 메소드도 가져오는데 이때 메소드를 재정의 하는 것이다.   
메소드 오버라이딩 조건은 아래와 같다.   

- 호출하고자 하는 메소드는 부모 클래스에 존재해야 한다.   
- 메소드 명은 동일해야 한다.   
- 매개변수와 타입이 같아야 한다.   
- 반환 타입도 같아야 한다.   
- 접근제어자는 부모클래스에 정의된 것 보다 넓거나 같아야 한다.   
- 메소드 오버라이딩과 메소드 오버로딩 성립조건은 아래와 같다.   

<img width="533" alt="스크린샷 2020-12-22 오후 9 04 49" src="https://user-images.githubusercontent.com/26623547/102887129-b3abd500-4499-11eb-84fd-45b04179c888.png">  

#### 3-1) Method Signature   

Method Signature는 그것만으로 메서드를 구분지을 수 있는 근거가 되어야 한다. 
`자바에서 메서드 시그니처는 메서드 명과 파라미터 순서, 타입, 개수를 의미한다.`    
리턴 타입과 exceptions은 메서드 시그니처가 아니다.   

`자바 컴파일러는 오버로딩된 함수를 메서드 시그니처를 통해서 구별하기 때문에 
이를 이해하는게 중요하다`   

> 아래 두 메서드는 다른 시그니처를 가진다.

```java
doSomething(String[] y);
doSomething(String y);
```

> 아래 메서드들은 모두 같은 시그니처를 가진다.   

```java
int doSomething(int y) 
String doSomething(int x)
int doSomething(int z) throws java.lang.Exception
```


- - - 

## 4. 추상 클래스   

클래스들의 공통되는 필드와 메서드를 정의한 클래스를 말한다.   

`객체를 직접 생성할 수 있는 클래스를 실체클래스라고 하는데, 실체 클래스들의 
공통적인 특성을 추출해서 선언한 클래스를 추상클래스라고 한다. 여기서 
추상클래스와 실체클래스는 상속적인 관계를 가지고 있다.`   

추상클래스는 아래와 같은 이유로 사용을 한다.   

- 공통된 필드와 메서드를 통일할 목적으로 사용 
- 실체클래스 구현시, 시간절약이 가능하고 규격에 맞는 실체 클래스 구현이 가능하다.   

`추상 메소드의 접근 지정자로 private는 사용할 수 없는데 이는 자식 클래스에서 
받아서 구현되어야 하므로 당연하다. 다른 접근 지정자(public, protected)는 
사용할 수 있고 생략되면 default 접근지정자로 사용한다.`   

- - - 

## 5. 메소드 디스패치(Method Dispatch)  

메소드 디스패치란 어떤 메소드를 호출할지 결정하여 실제로 실행시키는 과정이다.    

### 5-1) 메소드 디스패치 종류  

- 정적 메소드 디스패치(Static Method Dispatch): `컴파일 시점에서`, 특정 메소드를 호출할 것이라는 걸 명확하게 알고 있는 경우    

- 동적 메소드 디스패치(Dynamic Method Dispatch): `런타임 시점에서`, 호출되는 메소드가 동적으로 정해지는 경우   

- 더블 메소드 디스패치(Double Method Dispatch): `런타임 시점에서`, 정적 또는 동적 메소드 디스패치를 두번 진행하는 경우    

### 5-1-1) 정적 메소드 디스패치(Static Method Dispatch)   

자바에서 객체 생성은 런타임시에 호출된다.    
즉, 컴파일 시점에서 알 수 있는 것은 타입에 대한 정보이다. 타입 자체가 
Dispatch라는 구현 클래스이기 때문에 해당 메서드를 호출하면 어떤 메서드가 
호출될지 정적으로 정해진다.

```java
public class Test {
    public static void main(String[] args) {
        Dispatch dispatch = new Dispatch();
        System.out.println(dispatch.method());
    }
}

public class Dispatch {
    public String method() {
        return "static method dispatch call!";
    }
}
```

> javap -c Test // 바이트 코드에도 실행 메소드가 확인됨  

```
public class Test {
  public Test();
    Code:
       0: aload_0
       1: invokespecial #1                  // Method java/lang/Object."<init>":()V
       4: return

  public static void main(java.lang.String[]);
    Code:
       0: new           #7                  // class Dispatch
       3: dup
       4: invokespecial #9                  // Method Dispatch."<init>":()V
       7: astore_1
       8: getstatic     #10                 // Field java/lang/System.out:Ljava/io/PrintStream;
      11: aload_1
      12: invokevirtual #16                 // Method Dispatch.method:()Ljava/lang/String;
      15: invokevirtual #20                 // Method java/io/PrintStream.println:(Ljava/lang/String;)V
      18: return
}
```

### 5-1-2) 동적 메소드 디스패치    

컴파일 시점이 아닌 실행시점에서 메소드 호출을 결정하는 경우이다.   
`인터페이스, 추상클래스의 추상메소드 또는 상속을 통한 오버라이딩한 메소드를 호출하는 경우`     
컴파일러는 타입에 대한 정보를 알고 있으므로 Runtime시에 호출 객체를 확인해 해당 객체의 메서드를 
호출한다.   
Runtime시에 호출 객체를 알 수 있으므로 바이트 코드에도 어떤 객체의 메서드를 
호출해야하는지 드러나지 않는다.   

```java
public class Test {
    public static void main(String[] args) {
        Dispatchable dispatch = new Dispatch();
        System.out.println(dispatch.method());
    }
}

public interface Dispatchable {
    String method();
}

public class Dispatch implements Dispatchable{
    public String method() {
        return "dynamic method dispatch call!";
    }
}
```

> javap -c Test // Static Dispatch 결과와 다르게 메소드가 명시되어 있지 않고 인터페이스로 
명시되어 있음 (12라인)   

```
public class Test {
  public Test();
    Code:
       0: aload_0
       1: invokespecial #1                  // Method java/lang/Object."<init>":()V
       4: return

  public static void main(java.lang.String[]);
    Code:
       0: new           #7                  // class Dispatch
       3: dup
       4: invokespecial #9                  // Method Dispatch."<init>":()V
       7: astore_1
       8: getstatic     #10                 // Field java/lang/System.out:Ljava/io/PrintStream;
      11: aload_1
      12: invokeinterface #16,  1           // InterfaceMethod Dispatchable.method:()Ljava/lang/String;
      17: invokevirtual #22                 // Method java/io/PrintStream.println:(Ljava/lang/String;)V
      20: return
}
```


### 5-1-3) 더블 메소드 디스패치 

`더블 메소드 디스패치는 Dynamic Dispatch를 두 번 하는 것을 의미한다.`       
디자인 패턴 중 방문자 패턴(Visitor Pattern)과 밀접한 관계가 있다.   

#### 방문자 패턴 ( 디자인 패턴 )    

`방문자 패턴을 이용하면 객체에서 처리를 분리해서 사용할 수 있다.`   
여기서 객체란 클래스를 의미하고 처리는 메소드를 의미한다. 객체에서 미리 
정의되지 못한 처리부분(메소드)을 객체 밖에서 분리하여 처리할수 있도록 한다.   

> 분리를 하게 되면, 구조를 수정하지 않고 새로운 동작을 기존 객체에 추가할 수 있다!   
> 새로운 연산을 더 만들고 싶다면, 새로운 방문자를 추가하면 된다.   

`즉, 방문자 패턴이란 기존 클래스 필드 정보를 유지하면서 새로운 연산을 추가하는 방식이다.`   

##### 예시 

<img width="250" alt="스크린샷 2020-12-30 오후 9 58 08" src="https://user-images.githubusercontent.com/26623547/103353942-8a202880-4aed-11eb-9499-98841e764b53.png">

<img width="250" alt="스크린샷 2020-12-30 오후 9 58 02" src="https://user-images.githubusercontent.com/26623547/103353946-8e4c4600-4aed-11eb-9948-4cbe0a8bbc40.png">

Car 인터페이스가 있고 이를 구현한 Bus, Truck 클래스가 각각 있다. 버스와 
트럭의 메소드는 편의상 같게 정의하였다.   

```java
public interface Car {

    int drive(); // 이동 할때 마다 기름 -1

    int getFuel(); // 남은 기름 확인

    String visit(ViewVisitor viewVisitor); // 방문자 패턴 
}
```

`위처럼 방문자 패턴을 적용하기 위해서는 인터페이스에 visit 메서드 한줄을 추가해야 한다!`     

```java
public class Bus implements Car {

    private int fuel;

    public Bus(int fuel) {
        this.fuel = fuel;
    }

    @Override
    public int drive() {
        return --fuel;
    }

    @Override
    public int getFuel() {
        return fuel;
    }

    @Override
    public String visit(ViewVisitor viewVisitor) { // 방문자 패턴
        return viewVisitor.visit(this);
    }
}

```

`위는 viewVisitor에게 자기 자신을 인자로 넘겨서 책임을 위임하는 모습이다!`   

아래는 방문자 인터페이스이다.    

```java
public interface ViewVisitor {

    String visit(Bus bus);

    String visit(Truck truck);
}
```

`아래와 같이 책임을 위임받아 기존 객체 변경 없이 
새로운 메소드를 만들어 낼 수 있다!`   


```java
public class CarViewVisitor implements ViewVisitor{

    private static final String BUS_STATUS = "현재 버스의 기름 상태 : ";
    private static final String TRUCK_STATUS = "현재 트럭의 기름 상태 : ";

    @Override
    public String visit(Bus bus) {
        return BUS_STATUS + bus.getFuel();
    }

    @Override
    public String visit(Truck truck) {
        return TRUCK_STATUS + truck.getFuel();
    }
}
```

아래와 같이 Junit을 이용하여 테스트 코드를 작성해보자   

```java
class BusTest {
    @Test
    void 버스가_운전하고_상태를_제대로_출력하는지_테스트() {
        /* Given */
        Bus bus = new Bus(10); // 기름 10으로 초기화 
        /* When */
        bus.drive();           // 기름 -1 
        /* Then */
        assertThat(bus.getFuel()).isEqualTo(9);
        assertThat(bus.visit(new CarViewVisitor())).isEqualTo("현재 버스의 기름 상태 : 9");
    }
}
```

- - - 

## 6. Object 클래스   

모든 클래스는 Object 클래스의 자식 클래스이다. 내가 임의로 만든 클래스도 
Object 클래스를 상속받고 있다. extends Object를 써넣지 않았는데도 어떻게 되는걸까?  
이것은 컴파일러가 컴파일 타임에 끼워 넣어 준다.   

<img width="700" alt="스크린샷 2020-12-27 오후 9 33 56" src="https://user-images.githubusercontent.com/26623547/103170906-504fe780-488b-11eb-8457-222ca5f901ae.png">      


- - - 

**Reference**    

[https://huisam.tistory.com/entry/Visitor](https://huisam.tistory.com/entry/Visitor)      
[https://www.youtube.com/watch?v=YzFzLpwxSM4](https://www.youtube.com/watch?v=YzFzLpwxSM4)     
[https://limkydev.tistory.com/188](https://limkydev.tistory.com/188)     
[https://hyeonstorage.tistory.com/185](https://hyeonstorage.tistory.com/185)   
[https://commin.tistory.com/101](https://commin.tistory.com/101)   
[https://blog.naver.com/heartflow89/220960019390](https://blog.naver.com/heartflow89/220960019390)     
[https://github.com/whiteship/live-study/issues/6](https://github.com/whiteship/live-study/issues/6)             

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

