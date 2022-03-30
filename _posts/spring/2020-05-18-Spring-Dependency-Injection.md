---
layout: post
title: "[Spring] Dependency Injection"
subtitle: "종속성 주입 ( 부품 조립 ) / 다양한 의존성 주입 방법(생성자 주입, 필드 주입, 수정자 주입)"
comments: true
categories : Spring
date: 2020-05-18
background: '/img/posts/spring.png'
---

# Dependency Injection

Spring 프레임워크는 3가지 핵심 프로그래밍 모델을 지원하고 있는데, 
       그 중 하나가 의존성 주입(Dependency Injection, DI)이다.    
`DI란 외부에서 두 객체 간의 관계를 결정해주는 디자인 패턴으로, 
    인터페이스를 사이에 둬서 클래스 레벨에서는 의존관계가 고정되지 
    않도록 하고 런타임 시에 관계를 다이나믹하게 주입하여 유연성을 
    확보하고 결합도를 낮출 수 있게 해준다.`   

> Spring 프레임워크 3가지 핵심 프로그래밍 모델은 DI/IoC, PSA, AOP이다.   

여기서 의존성이란 한 객체가 다른 객체를 사용할 때 의존성이 있다고 한다.   

`스프링에서 DI는 의존성(종속성) 주입라고 하는데 부품 조립이라고 생각하면 이해하기 쉽다.`        
`즉, 객체를 직접 생성하는 것이 아니라 외부에서 생성한 후 주입 시켜주는 방식이다.`      

예를 들어 다음과 같이 Store 객체가 Pencil 객체를 사용하고 있는 경우에 
우리는 Store객체가 Pencil 객체에 의존성이 있다고 표현한다.   

```java
public class Store { 
    private Pencil pencil; 
}
```

<img width="494" alt="스크린샷 2022-03-28 오후 11 38 10" src="https://user-images.githubusercontent.com/26623547/160422777-2367d5e6-fbaa-4455-86fd-3146c4d645b2.png">   

그리고 두 객체 간의 관계(의존성)를 맺어주는 것을 의존성 주입이라고 하며, 
    생성자 주입, 필드 주입, 수정자 주입 등 다양한 주입 방법이 있다.   

<img width="420" alt="스크린샷 2022-03-28 오후 11 38 15" src="https://user-images.githubusercontent.com/26623547/160422790-ebb336e6-a499-4e35-a5ff-edc356682bcd.png">   

## 1. 의존성 주입이 필요한 이유   

예를 들어 연필이라는 상품과 1개의 연필을 판매하는 Store 클래스가 있다고 하자.   

```java
public class Pencil {
}
```

```java
public class Store {
    private Pencil pencil;
    public Store() {
        this.pencil = new Pencil();   
    }
}
```   

위와 같은 예시는 다음과 같은 문제점을 가지고 있다.   

- 두 클래스가 강하게 결합되어 있다.  
- 객체들 간의 관계가 아니라 클래스 간의 관계가 맺어지고 있다.   

##### 1-1) 두 클래스가 강하게 결합되어 있다.   

위와 같은 Store 클래스는 현재 Pencil 클래스와 `강하게 결합되어 있다는 문제점`을 
가지고 있다.   
두 클래스가 강하게 결합되어 있어서 만약 Store에서 Pencil이 아닌 Food와 
같은 상품을 판매하고자 한다면 Store 클래스의 생성자에 변경이 필요하다.   
즉, 유연성이 떨어진다.    

> 이에 대한 해결책으로 상속을 떠올릴 수 있지만, 상속은 제약이 많고 
확장성이 떨어지므로 피하는 것이 좋다.   

##### 1-2) 객체들 간의 관계가 아니라 클래스 간의 관계가 맺어지고 있다.     

또한 위의 Store와 Pencil는 객체들 간의 관계가 아니라 클래스들 간의 
관계가 맺어져 있다는 문제가 있다.      
올바른 객체지향적 설계라면 객체들 간에 관계가 맺어져야 하지만 현재는 
Store 클래스와 Pencil 클래스가 관계를 맺고 있다.      
객체들 간에 관계가 맺어졌다면 다른 객체의 구체 클래스(Pencil 또는 Food)를 
전혀 알지 못하더라도, (해당 클래스가 인터페이스를 구현했다면) 인터페이스 
타입(Product)으로 사용할 수 있다.   

`결국 위와 같은 문제점이 발생하는 근본적인 이유는 Store에서 불필요하게 
어떤 제품을 판매할 지에 대한 관심이 분리되지 않았기 때문이다.`   

Spring에서는 DI를 적용하여 이러한 문제를 해결하고자 하였다.   

## 2. 의존성 주입을 통한 해결   

`위와 같은 문제를 해결하기 위해서는 우선 다형성이 필요하다.`     
Pencil, Food 등 여러가지 제품을 하나로 표현하기 위해서는 Product라는 
Interface가 필요하다.   
그리고 Pencil에서 Product 인터페이스를 우선 구현해주도록 하자.   

```java
public interface Product {
}
```

```java
public class Pencil implements Product {
}
```

이제 우리는 Store와 Pencil이 강하게 결합되어 있는 부분을 제거해 주어야 한다.  
`이를 제거하기 위해서는 다음과 같이 외부에서 상품을 주입(Injection)받아야 한다.`   

```java
public class Store {
    private Product product;
    public Store(Product product) {
        this.product = product;
    }
}
```

`여기서 Spring이 DI 컨테이너를 필요로 하는 이유를 알 수 있는데, 우선 Store에서 
Product 객체를 주입하기 위해서는 애플리케이션 실행 시점에 필요한 객체(빈)를 
생성해야 하며, 의존성이 있는 두 객체를 연결하기 위해 한 객체를 다른 객체로 
주입시켜야 하기 때문이다.`        
예를 들어 다음과 같이 Pencil 이라는 객체를 만들고, 그 객체를 
Store로 주입시켜주는 역할을 위해 DI/IoC 컨테이너가 필요하게 된 것이다.   

```java
public class BeanFactory {
    public void store() {
        // Bean의 생성
        Product pencil = new Pencil();

        // 의존성 주입 
        Store store = new Store(pencil);
    }
}
```

그리고 이러한 개념은 제어의 역전(Inversion of Control, IoC)라고 불리기도 한다.    
`어떠한 객체를 사용할지에 대한 책임이 BeanFactory와 같은 클래스에게 
넘어갔고, 자신은 수동적으로 주입받는 객체를 사용하기 때문이다.`   
실제 Spring에서는 BeanFactory를 확장한 Application Context를 사용한다.   


- - - 

## 3. 의존성 주입 정리     

한 객체가 어떤 객체(구체 클래스)에 의존할 것인지는 별도의 관심사이다.   
`Spring에서는 DI/IoC 컨테이너를 통해 서로 강하게 결합되어 있는 두 클래스를 
분리하고, 두 객체 간의 관계를 결정해 줌으로써 결합도를 낮추고 
유연성을 확보하고자 하였다.`   
의존성 주입으로 애플리케이션 실행시점에 객체를 생성하고 관계를 
결정해 줌으로써 다른 구체 클래스에 의존하는 코드를 제거하며 서로 
다른 두 객체의 결합을 약하게 만들어주었다.   
`또한, 이러한 방법은 상속보다 훨씬 유연하다. 단, 여기서 주의해야 하는 것은 
다른 빈을 주입받으려면 자기 자신이 반드시 컨테이너의 빈이여야 한다는 것이다.`   

- 두 객체 간의 관계라는 관심사의 분리   
- 두 객체 간의 결합도를 낮춤   
- 객체의 유연성을 높임   
- 테스트 작성을 용이하게 함   

- - -   

## 4. 다양한 의존성 주입 방법   

### 4-1. 생성자 주입(Constructor Injection)    

생성자 주입(Constructor Injection)은 생성자를 통해 의존 관계를 주입하는 방법이다.    

```java
@Service 
public class UserServiceImpl implements UserService {
    private UserRepository userRepository; 
    private MemberService memberService; 

    @Autowired // 생략 가능   
    public UserServiceImpl(UserRepository userRepository, MemberService memberService) { 
        this.userRepository = userRepository; 
        this.memberService = memberService; 
    } 
}
```

`생성자 주입은 생성자의 호출 시점에 1회 호출 되는 것이 보장된다.`   
`그렇기 때문에 주입 받은 객체가 변하지 않거나, 반드시 객체의 주입이 
필요한 경우 강제하기 위해 사용할 수 있다.`   
또한, Spring 프레임워크에서는 생성자 주입을 적극 권장하고 있기 때문에, 
    생성자가 1개만 있을 경우에 @Autowired를 생략해도 주입이 가능하도록 
    편의성을 제공하고 있다.   

> 스프링 4.3 부터 생성자 1개일 경우 @Autowired 생략이 가능하다.   

그렇기 때문에 위의 코드에서 @Autowired 생략이 가능하다.   

### 4-2. 수정자 주입(Setter Injection)   

수정자 주입은 필드 값을 변경하는 Setter를 통해서 의존 관계를 주입하는 
방법이다.   
Setter 주입은 생성자 주입과 다르게 `주입받은 객체가 변경될 가능성이 
있는 경우에 사용한다.`   

> 하지만, 실제로 변경이 필요한 경우는 극히 드물다.   

```java
@Service 
public class UserServiceImpl implements UserService {
    private UserRepository userRepository; 
    private MemberService memberService; 

    @Autowired 
    public void setUserRepository(UserRepository userRepository) { 
        this.userRepository = userRepository; 
    }

    @Autowired 
    public void setMemberService(MemberService memberService) { 
        this.memberService = memberService; 
    } 
}
```

@Autowired로 주입할 대상이 없는 경우에는 오류가 발생한다.    
주입할 대상이 없어도 동작하도록 하려면 @Autowired(required = false)를 
통해 설정할 수 있다.   

### 4-3. 필드 주입(Field Injection)   

필드 주입(Field Injection)은 필드에 바로 의존 관계를 주입하는 방법이다.    
IntelliJ에서 필드 인젝션을 사용하면 Field Injejction is not recommended이라는 
경고 문구가 발생한다.   

```java
@Service
public class UserServiceImpl implements UserService {
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private MemberService memberService;
}
```

필드 주입을 이용하면 코드가 간결해져서 과거에 상당히 많이 이용되었던 
주입 방법이다.   
하지만, 필드 주입은 여러 단점이 존재하기 때문에 생성자 주입을 권장하고 있다.   
이에 대한 내용은 아래에서 자세히 살펴보자.   

- - - 

## 5. 생성자 주입을 사용해야 하는 이유   

최근에는 Spring을 포함한 DI 프레임워크의 대부분이 생성자 주입을 
권장하고 있는데, 자세한 이유를 살펴보도록 하자.   

##### 5-1) 객체의 불변성 확보   

실제로 개발을 하다 보면 느끼겠지만, `의존 관계 주입의 변경이 필요한 
상황은 거의 없다.`   
수정자 주입이나 일반 메소드 주입을 이용하면 불필요하게 수정의 
가능성을 열어두게 되며, 이는 OOP의 5가지 개발 원칙 중 OCP(Open-Closed Principal, 개방-폐쇄의 법칙)를 
위반하게 된다.    
그러므로 `생성자 주입을 통해 변경의 가능성을 배제하고 불변성을 보장하는 것이 좋다.`       

##### 5-2) 테스트 코드 작성   

실제 코드가 `필드 주입으로 작성된 경우에는 순수한 자바 코드로 단위 테스트를 
작성하는 것이 불가능하다.`    

> 물론 ReflectionTestUtils를 사용해 주입해 줄 수 있기는 하다.   

아래 예시를 보자.   

```java
@Service 
public class UserServiceImpl implements UserService { 

    @Autowired 
    private UserRepository userRepository; 
    @Autowired 
    private MemberService memberService; 

    @Override public void register(String name) { 
        userRepository.add(name); 
    } 
}
```   

위의 코드에 대한 순수 자바 테스트 코드를 작성하면 다음과 
같이 작성할 수 있다.   

```java
public class UserServiceTest {
    
    @Test
    public void addTest() {
        UserService userService = new UserServiceImpl();
        userService.register("kaven");   
    }
}
```

위와 같이 작성한 테스트 코드는 Spring과 같은 DI 프레임워크 위에서 
동작하지 않으므로 의존 관계 주입이 되지 않을 것이고, userRepository가 
null이 되어 userRepository의 add 호출시 NPE가 발생할 것이다.   
이를 해결하기 위해 Setter를 사용하면 여러 곳에서 사용 가능한 
싱글톤 패턴 기반의 빈이 변경될 수 있는 치명적인 단점을 갖게 된다.   
또한 반대로 테스트 코드에서도 @Autowired를 사용하기 위해 
스프링 빈을 올리면 단위 테스트가 아니며 컴포넌트들을 등록하고 
초기화하는 시간이 커져 테스트 비용이 증가하게 된다.   

`반면에 생성자 주입을 사용하면 컴파일 시점에 객체를 주입받아 테스트 코드를 
작성할 수 있으며, 주입하는 객체가 누락된 경우 컴파일 시점에 오류를 
발견할 수 있다.`   
아래와 같이 직접 생성자를 넣어 줘서 테스트가 가능하다.   

```java
@Service
public class ExampleService {
    private final ExampleRepository exampleRepository;

    public ExampleService(ExampleRepository exampleRepository) {
        this.exampleRepository = exampleRepository;
    }
    public void save(int seq) {
        exampleRepository.save(seq);
    }
}

public class ExampleTest {
    @Test
    public void test() {
        ExampleRepository exampleRepository = new ExampleRepository();
        ExampleService exampleService = new ExampleService(exampleRepository);
        exampleService.save(1);
    }
}
```

##### 5-3) final 키워드 작성 및 Lombok과의 결합   

생성자 주입을 사용하면 필드 객체에 final 키워드를 사용할 수 있으며, 
    `컴파일 시점에 누락된 의존성을 확인할 수 있다.`   
`반면에 생성자 주입을 제외한 다른 주입 방법들은 객체의 생성(생성자 호출) 이후에 
호출되므로 final 키워드를 사용할 수 없다.`   

또한, final 키워드를 붙임으로써 Lombok과 결합되어 코드를 간결하게 작성할 수 있다.   
Lombok에는 @RequiredArgsConstructor 어노테이션을 제공하며, 생성자의 인자로 추가할 
변수에 @NonNull 또는 final을 붙이게 되면, 해당 변수를 생성자의 인자로 추가해준다.  
아래와 같이 사용 가능하다.   

```java
@Service 
@RequiredArgsConstructor 
public class UserServiceImpl implements UserService { 
    private final UserRepository userRepository; 
    // 또는 @NonNull private UserRepository userRepository; 
    private final MemberService memberService; 

    @Override public void register(String name) { 
        userRepository.add(name); 
    } 
}
```



##### 5-4) 순환 참조 에러 방지   

`애플리케이션 구동 시점(객체의 생성 시점)에 순환 참조 에러를 방지할 수 있다.`   
아래와 같이 UserServiceImpl의 register 함수가 memberService의 add를 호출하고, 
    memberServiceImpl의 add함수가 UserServiceImpl의 register 함수를 
    호출한다면 어떻게 될까?   

```java
@Service 
public class UserServiceImpl implements UserService { 

    @Autowired 
    private MemberServiceImpl memberService; 

    @Override public void register(String name) {
        memberService.add(name); 
    } 
}
```

```java
@Service 
public class MemberServiceImpl extends MemberService { 

    @Autowired 
    private UserServiceImpl userService; 

    public void add(String name){ 
        userService.register(name); 
    } 
}
```

위의 두 메소드는 서로를 계속 호출할 것이고, 메모리에 함수의 CallStack이 
계속 쌓여 StackOverflow 에러가 발생하게 된다.      

즉 생성자 주입을 사용하지 않게 되면, 순환참조 발견을 실제 코드가 호출 되는 
시점에야 발견할 수 있게 된다.   
`객체 생성 시점에 순환참조가 일어나는게 아니라, 객체 생성 후 
비즈니스 로직상에 순환참조가 일어나는 것이다.`   

> 필드 주입이나, 수정자 주입은 객체 생성 시점에 순환참조가 일어나는지 아닌지 
발견할 수 있는 방법이 없다.   

`하지만, 생성자 주입을 이용하면 이러한 순환참조 문제를 방지할 수 있다.`     
`애플리케이션 구동 시점(객체의 생성 시점)에 에러가 발생하기 때문이다.`     

```
Description: 

The dependencies of some of the beans in the application context form a cycle:

┌─────┐ 
| memberServiceImpl defined in file   
↑     ↓ 
| userServiceImpl defined in file    
└─────┘
```

`이유는 Bean에 등록하기 위해 객체를 생성하는 과정에서 다음과 같이
순환 참조가 발생하기 때문이다.`  

> 컨테이너가 빈을 생성하는 시점에서 객체생성에 사이클 관계가 생기기 때문이다.   

```
new UserServiceImpl(new MemberServiceImpl(new UserServiceImpl(new MemberServiceImpl()...)))
```

정리를 해보면, 이러한 이유들로 DI 프레임워크를 사용하는 경우, 생성자 주입을 
사용하는 것을 권장한다.   

- 객체의 불변성을 확보할 수 있다.   
- 테스트 코드의 작성이 용이해진다.   
- final 키워드를 사용할 수 있고, Lombok과의 결합을 통해 코드를 간결하게 작성할 수 있다.   
- 순환 참조 문제를 애플리케이션 구동(객체의 생성) 시점에 파악하여 방지할 수 있다.   


- - - 

## 실습 

Exam 이라는 인터페이스가 있고 그 인터페이스를 구현한 NewLecExam 클래스가 있다.    
ExamConsole이라는 인터페이스는 출력 방식에 따라 InlineExamConsole 과 GridExamConsole를 
사용하는데 Exam 객체를 주입하여 출력해준다. 


<img width="211" alt="스크린샷 2020-05-18 오후 10 24 13" src="https://user-images.githubusercontent.com/26623547/82218347-bc15bd80-9956-11ea-8eec-a078ea1864f1.png">

#### 스프링 DI를 사용하지 않고 직접 구현    
<img width="572" alt="스크린샷 2020-05-18 오후 10 22 17" src="https://user-images.githubusercontent.com/26623547/82218363-c1730800-9956-11ea-82a3-c9c68b13f86a.png">

> Exam 과 ExamConsole 인터페이스 
<img width="700" alt="스크린샷 2020-05-18 오후 10 31 11" src="https://user-images.githubusercontent.com/26623547/82218783-5e35a580-9957-11ea-9c45-4d76954a3c39.png">

> Exam 인터페이스를 받아 구현   
<img width="300" alt="스크린샷 2020-05-18 오후 10 34 46" src="https://user-images.githubusercontent.com/26623547/82219289-05b2d800-9958-11ea-9262-334620415e1e.png">

> 출력 방식에 따른 console 구현
<img width="900" alt="스크린샷 2020-05-18 오후 10 35 55" src="https://user-images.githubusercontent.com/26623547/82219292-08adc880-9958-11ea-9a54-d4314554dfdd.png">

<br>
#### 스프링 Application Context 를 이용 

`DI 지시서를 읽어서 생성해주고 조립해주는 스프링의 객체 이름`   
`Application Context는 인터페이스이며, 실질적으로 구현하는 대표적인 예는 ClassPathXmlApplicationContext`   

Application Context가 관리하는 객체들을 **Bean**이라고 부르며, Bean과 Bean 사이의 
의존관계를 처리하는 방식을 XML, 어노테이션, Java 설정 방식을 이용가능    

> 사용하기 전 spring-context 라이브러리를 메이븐 또는 그래들에 추가

- Program.java   
<img width="550" alt="스크린샷 2020-05-19 오후 9 01 37" src="https://user-images.githubusercontent.com/26623547/82324158-26406800-9a14-11ea-8424-92a2b9051e19.png">

- setting.xml ( Ref 형식 DI )
<img width="550" alt="스크린샷 2020-05-19 오후 9 02 15" src="https://user-images.githubusercontent.com/26623547/82324171-2d677600-9a14-11ea-826c-67bbcc69ea53.png">

- 위의 setting.xml 에서 console을 GridExamConsole을 사용하도록 설정한 상태에서 
InlineExamConsole로 변경하려면 ?

`자바 소스코드는 변경이 필요 없고 DI 설정 파일인 setting.xml의 console 설정 부분만 변경하면 된다! `   
`스프링 DI를 사용함으로써 소스코드 유지보수가 쉽고 Loose coupling을 통해 유연한 변경이 가능 `   

- setting.xml( 값 형식 DI )   
<img width="435" alt="스크린샷 2020-05-24 오후 4 50 16" src="https://user-images.githubusercontent.com/26623547/82748941-cca7b700-9de0-11ea-9e20-4b541ba9bd73.png">   

- setting.xml( 생성자 형식 DI )   
<img width="460" alt="스크린샷 2020-05-24 오후 5 08 19" src="https://user-images.githubusercontent.com/26623547/82748999-33c56b80-9de1-11ea-8205-d27dd69209fb.png">   

- setting.xml( 네임스페이스 형식 DI )   
<img width="809" alt="스크린샷 2020-05-24 오후 5 43 01" src="https://user-images.githubusercontent.com/26623547/82749733-337b9f00-9de6-11ea-816e-4c1c55af56e7.png">   
> 위 처럼 소스 유지보수를 위해 네임스페이스를 적극 활용 할 것 

##### 콜렉션 형식 DI   

- Program.java   
<img width="489" alt="스크린샷 2020-05-24 오후 6 25 06" src="https://user-images.githubusercontent.com/26623547/82750556-f31f1f80-9deb-11ea-8700-bdaa7c8dbd2b.png">   


- setting.xml( 생성자를 통해 Colletion 목록을 추가하는 DI )    
<img width="540" alt="스크린샷 2020-05-24 오후 6 05 55" src="https://user-images.githubusercontent.com/26623547/82750168-3deb6800-9de9-11ea-90d3-c963845cdf90.png">   
> 위의 소스는 ArrayList 사이즈는 2이며, 생성자 안의 list 태그는 목록을 단지 
셋팅 할 뿐 객체 자체를 만들지 못한다!!   

- setting.xml( Colletion 을 개별적으로 생성 )    
<img width="482" alt="스크린샷 2020-05-24 오후 6 24 50" src="https://user-images.githubusercontent.com/26623547/82750553-eef30200-9deb-11ea-991f-61bcf9397b8b.png">    
네임스페이스 이용(xmlns:util="http://www.springframework.org/schema/util)   
`실제로 객체를 만들어서 개별적으로 사용 가능하다.`    



---

Reference

<https://mangkyu.tistory.com/125>   
<https://mangkyu.tistory.com/150>  
<http://www.newlecture.com>   


{% highlight ruby linenos %}
{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

