---
layout: post
title: "[Spring] 트랜잭션 관리(Transaction)"
subtitle: "전파 레벨(propagation) /Spring Transaction Exception 에서 Rollback 처리 "
comments: true
categories : Spring
date: 2020-03-20
background: '/img/posts/spring.png'
---

## 1. 트랜잭션 

`트랜잭션은 어떤 일련의 작업을 의미 한다. 
어떤 일련의 작업들은 모두 에러 없이 끝나야 하며, 작업 중에서 하나라도 잘못되면 이전에 수행한 모든 작업을 취소하고 
실행 이전의 상태로 되돌리는데, 이것을 롤백이라고 한다.`   

`즉, 데이터에 대한 무결성을 유지하기 위한 처리 방법을 트랜잭션 처리라고 한다.`    

- - - 

### 1-1) 트랜잭션 사용 이유    

트랜잭션은 데이터베이스를 수정하는 작업에는 꼭 사용해야 되는 기능이다. 만약 데이터베이스에 
값을 추가하고 있는데 갑자기 오류가 나면 일부 값이 누락이 되어 잘못된 데이터가 들어갈 수 있기 
때문이다.

> 예를 들어 쇼핑몰에서 거래를 진행할 때 포인트를 이용하여 결재를 진행 한다고 가정하자. 사용할 포인트 만큼 
차감을 하고 포인트를 사용하는 과정에서 에러가 발생한다면, 포인트는 전송되지 않고 사라지는 경우가 발생한다. 
그렇기 때문에 트랜잭션을 이용하여 해당 메서드가 전부 완료되거나 에러가 날 경우는 처음상태로 돌려 놓는 
두 가지 경우로 만들어 완성도를 높일 수 있다.   

```java
@Transactional
public void PointBuyService() {
    minusPoint(); // 포인트 차감   
    sendPoint();  // 포인트 전송   
    progressPayment(); // 결재 진행 
}
```
- - - 

### 1-2) ACID 원칙( 트랜잭션의 성격 )    

##### 1) 원자성(Atomicity)

하나의 트랜잭션은 모두 하나의 단위로 처리되어야 한다.   
예를 들어, 자금 이체는 성공할 수도 실패할 수도 있지만 보내는 쪽에서 돈을 
빼 오는 작업만 성공하고 받는 쪽에 돈을 넣는 작업을 실패해서는 안된다.   
원자성은 이와 같이 중간 단계까지 실행되고 실패하는 일이 없도록 하는 것이다.   

##### 2) 일관성(Consistency)      

트랜잭션이 성공했다면 데이터베이스의 모든 데이터는 일관성을 유지해야 한다.   
예를 들면 트랜잭션이 수행된 후의 데이터 타입이 변경되지 않고 일관성을 유지한다.   

##### 3) 격리(Isolation)    

트랜잭션으로 처리되는 중간에 외부에서의 간섭은 없어야만 한다.

##### 4) 영속성(Durability)        

트랜잭션이 성공적으로 처리되면, 그 결과는 영속적으로 보관되어아 한다.


- - -   

### 1-3) Spring Transaction Exception 상황에서 Rollback  

스프링을 사용하며서 많은 서비스들이 트랜잭션을 단위로 하는 비즈니스 로직을 구현한다. 
여기서는 비즈니스 로직을 구현하는 과정에서 많이 놓치는 Exception 발생 상황에 대해 살펴보자.   
`가장 중요한 것은 Exception 타입에 따라서 어떻게 비즈니스 로직이 진행될지 판단하고, 처리하는 것이다.`   

> 쿠팡 사용자 회원가입 기능을 예로 들어보자. 가입 시에 사용자에게 쿠폰을 발급하는 경우가 존재 할 수 있다. 
사용자가 가입하는 도중에 원인 모를 상황이 발생 가능한데 시스템이 셧다운 되거나, 메모리를 초과 할 수도 있고, 
    또는 개발 단계에서 잘못된 구현으로 트랜잭션이 완료되지 못할 수 있다.   

`여기서 우리가 구분해야 할 부분은 Error와 Exception의 구분이다.`

**Error** : 시스템 셧다운이나 메모리 문제와 같이 시스템 레벨에서 정상적으로 실행되지 못하는 상황으로 H/W와 
관련이 있다. 애플리케이션 코드에서 에러를 잡으려고 하면 안되고 대부분 컴파일시 발견될 수 있는 예외이다.  java.lang.Error 클래스의 서브 클래스들이다.   

**Exception** : 개발 단계에서 잘못된 구현으로 인하여 구현 단계에서 예측하지 못한 상황으로 S/W와 관련이 있다. 
Exception이 발생하면 구현 로직을 수정하여 처리가 가능한 상황이다.   

<img width="754" alt="스크린샷 2020-06-27 오후 4 40 53" src="https://user-images.githubusercontent.com/26623547/85917608-8b4e6f80-b896-11ea-8a9d-765b3e9d9bf7.png">   

위처럼 Error와 Exception은 Throwable을 상속한다. 부모는 같지만 역할은 위에서 설명했듯이 다르다.   

`위 계층도에서 Exception은 다시 두 갈래로 나뉜다.`   

##### 1. Checked Exception   

`Exception을 상속받는 하위 클래스 중 Runtime Exception을 제외한 모든 Exception`   

- 예를들면, 존재하지 않는 파일을 처리하려는 경우(FileNotFoundException), 실수로 클래스의 
이름을 잘못 입력한 경우(ClassNotFoundExcetipn), 입력한 데이터의 형식이 잘못된 경우
(DataFormatException)에 발생한다.   
- 컴파일 시점에 에러가 나타나기 때문에 try-catch 또는 throws 구문을 통해서 
처리할 수 있게 IDE에서 알려준다. 즉, 명시적인 예외 처리를 꼭 해주어야 한다.   
- **스프링에서 예외발생시 기본 트랜잭션 처리전략 : non-rollback**   

##### 2. UnChecked Excepton

`Runtime Exception 하위 Exception`   

- 예를 들면, 배열의 범위를 벗어난 경우(IndexOutOfBoundsException), 값이 null인 참조 변수의 
멤버를 호출한 경우(NullPointerException), 클래스 간의 형 변환을 잘못한 경우
(ClassCastException), 정수를 0으로 나누려하는경우(ArithmeticException)에 발생한다.   
- 이미 컴파일이 끝나고, 애플리케이션 서비스가 런타임일때 발생하기 때문에 try-catch 또는 
throws 구문을 사용해서 로직상에서 방어 코드를 만들어 줄수 있다. 즉, 명시적인 예외 처리를 
강제하지는 않는다.   
- **스프링에서 예외발생시 기본 트랜잭션 처리전략: rollback**     

- - -

> 다시 돌아와서, 쿠팡 사용자 회원가입 기능을 Exception 관점에서 보면 비즈니스 요구사항에 따라서 2가지로 나뉠수 있다.   
> 1. 사용자 가입은 허용하지만, 쿠폰 발급은 보류해도 된다.(Checked Exception)       
> 2. 중간에 문제가 발생했을 경우는 모두 Rollback 되어야 한다.(Unchecked Exception)         


```java

@Service
public class UserService {

    @Autowired
    private UserRepository repository;

    // 1번의 경우!
    @Transactional
    public void checkedExceptionTest(UserDto userDto) throws Exception {

        repository.save(userDto); //회원 가입
        throw new Exception();    // 중간에 예외 발생했다고 가정  
        ...
        // 쿠폰 지급   
    }

    // 2번의 경우!
    @Transactional
    public void unCheckedExceptionTest(UserDto userDto) {

        repository.save(userDto);     // 회원가입
        throw new RuntimeException(); // 중간에 예외 발생했다고 가정 
        ...
        // 쿠폰 지급   
    }
}

```

`1. 임의로 Checked Exception을 발생시켰지만, 회원 정보는 생성되었고 쿠폰 발급은 보류 된다. 스프링에서 
@Transactional을 사용한 Checked Exception은 롤백되지 않는다.`   

`2. 임의로 Unchecked Exception을 발생과 동시에 모두 Rollback 된다.`   

**물론 스프링은 기본적으로 Checked 또는 Unchecked를 구분하여 Rollback을 구분하지만, rollback 시킬 
Exception을 지정 가능하다!**   

> rollbackFor 옵션을 이용하면 Rollback이 되는 클래스를 지정 가능하다. 

```java
// Exception예외로 롤백을 하려면 다음과 같이 지정하면 된다.
@Transactional(rollbackFor = Exception.class) 
// 여러개의 예외를 지정할 수도 있습니다. 
@Transactional(rollbackFro = {RuntimeException.class, Exception.class})
```

> 추가적으로 특정 예외가 발생하면 롤백이 되지 않도록 지정하는 방법이다.

```java
@Transactional(noRollbackFor={IgnoreRollbackException.class})
```

스프링에서 제공하는 선언적 트랜잭션의 기본값 설정은 아래와 같다.   

##### @Transactional 기본 설정(선언적 트랜잭션)      

- 트랜잭션 전파 설정: Propagation.REQUIRED 
실행중인 트랜잭션 컨텍스트가 있으면 그 트랜잭션 내에서 실행되고, 없으면 새로 트랜잭션을 생성한다.   

- 트랜잭션 고립 레벨: Isolation.DEFAULT
데이터베이스 설정을 따른다.   

- 읽기 전용: false( 읽기/ 쓰기가 기본값)   
성능을 최적화 하기 위해 사용할 수도 있고 특정 트랜잭션 작업 안에서 쓰기 작업이 
일어나는 것을 의도적으로 방지하기 위해 사용할 수도 있다.   
ex) @Transactional(readOnly = true)   

- 타임아웃: -1 ( 타임아웃되지 않는다.)   
지정된 시간 내에 해당 메소드 수행이 완료되지 않는 경우 rollback 수행   
ex) @Transactional(timeout=10)   

`스프링에서 선언적 트랜잭션을 사용할 때 예외에 따른 롤백처리는 
Checked 예외는 롤백되지 않고, Unchecked 예외는 롤백된다!`   

- - -

Reference   

[https://interconnection.tistory.com/122](https://interconnection.tistory.com/122)

- - - 

{% highlight ruby linenos %}


{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

