---
layout: post
title: "[Spring] 트랜잭션 전파(Propagation) 이해하기"
subtitle: "REQUIRES, REQUIRES_NEW, MANDATORY, SUPPORT, NESTED, NEVER"
comments: true
categories : Spring
date: 2020-03-21
background: '/img/posts/spring.png'
---

[지난글](https://wonyong-jang.github.io/spring/2020/03/20/Spring-Transaction.html)에서 스프링의 트랜잭션의 전반적인 내용과 
스프링 트랜잭션의 롤백정책에 대해서 살펴봤다.       
이번글에서는 Spring Transactional 어노테이션에서 제공하는 
propagation 옵션에 대해서 정리해보려고 한다.     

- - - 


## Spring Propagation     

Spring에서 사용하는 어노테이션 @Transactional은 해당 메서드를 하나의 
트랜잭션 안에서 진행할 수 있도록 만들어주는 역할을 한다.   
이때 트랜잭션 내부에서 트랜잭션을 또 호출한다면 이를 어떻게 
처리하고 있을까?       
이는 새로운 트랜잭션이 생성될 수도 있고, 이미 트랜잭션이 있다면 부모 트랜잭션에 
합류할 수도 있을 것이다.   
`진행되고 있는 트랜잭션에서 다른 트랜잭션이 호출될 때 어떻게 처리할지 
결정하는 것을 트랜잭션 전파 설정이라고 한다.`   

스프링에서 제공하고 있는 전파 설정 옵션들은 아래와 같다.   

- REQUIRED(default) : 이미 시작된 트랜잭션이 있으면 참여하고 없으면 새로 시작한다.   

- REQUIES_NEW : 항상 새로운 트랜잭션을 시작한다. 이미 시작된 트랜잭션이 있다면, 기존의 트랜잭션은 메소드가 
종료할 때까지 잠시 대기 상태로 두고 자신의 트랜잭션을 독립적으로 실행한다.     

- SUPPORTS : 이미 시작된 트랜잭션이 있으면 참여하고, 없으면 트랜잭션 없이 진행한다.   

- NESTED : 이미 진행중인 트랜잭션이 있으면 중첩 트랜잭션을 시작한다. 중첩 트랜잭션은 트랜잭션 안에 트랜잭션을 만드는 것이며, 독립적인 트랜잭션을 만드는 REQUIRES_NEW와는 다르다. 즉, 부모 트랜잭션의 커밋과 롤백에는 
영향을 받지만 자신의 커밋과 롤백은 부모 트랜잭션에 영향을 주지 않는다. 만약, 이미 진행 중인 트랜잭션이 없는 경우 Propagation.REQUIRED와 동일하게 작동한다.    

- MANDATORY : REQUIRED와 비슷하게 이미 시작된 트랜잭션이 있으면 참여한다. 하지만, 트랜잭션이 시작된 것이 
없으면 예외를 발생시킨다. 혼자서는 독립적으로 트랜잭션을 진행하면 안되는 경우에 사용한다.   

- NOT_ SUPPORTED : 트랜잭션을 사용하지 않게 한다. 이미 진행 중인 트랜잭션이 있으면 일시 정지한다.   

- NEVER : 트랜잭션을 사용하지 않도록 강제한다. 이미 진행 중인 트랜잭션도 존재하면 안된다. 있다면 예외를 발생시킨다.    



대부분 글에서 Propagation에 대해서 위처럼 설명한다. 이를 이해하기 위해 
예제 코드로 살펴보자.   

- - - 

### 1. REQUIRED     

`스프링에서 @Transactional 어노테이션을 아무 설정을 하지 않고 사용하면 Propagation 기본값인 
REQUIRED가 설정된다.`       

`REQUIRED 속성은 자식/부모에서 rollback이 발생된다면 자식과 부모 모두 rollback 한다.`     
아래 예제 코드 처럼 자식 트랜잭션에서 예외가 발생하면 부모, 자식 모두 롤백되어 
어떤 유저도 저장되지 않는다.   
물론, 부모에서 예외가 발생해도 마찬가지이다.   

```java
@Service
@RequiredArgsConstructor
public class UserService { 

    private final UserRepository userRepository;
    private final UserChildService userChildService;
    @Transactional
    public void parentMethod() { // 부모
        userRepository.save(createUser("k1"));
        userChildService.childMethod();
        userRepository.save(createUser("k3"));
    }
}
```

```java
@Service
@RequiredArgsConstructor
public class UserChildService {

    private final UserRepository userRepository;
    @Transactional
    public void childMethod() { // 자식
        userRepository.save(createUser("k2"));
        throw new RuntimeException(); // 예외 발생
    }
}
```   

그렇다면 위의 예제에서 자식에서 발생한 예외를 부모 트랜잭션에서 try-catch 예외 처리 
하는 경우에는 어떻게 될까?     

<img width="1439" alt="스크린샷 2022-03-15 오후 10 42 10" src="https://user-images.githubusercontent.com/26623547/158390678-9301fe97-c2c8-4e57-a007-f590719f4691.png">   

`try-catch를 하더라도 예외가 발생하면 전부 Rollback되는 것을 볼 수 있다.`    
`위 메시지는 부모 트랜잭션과 자식 트랜잭션이 하나로 묶어져있고 그 트랜잭션이 
롤백이 되었기 때문에 출력이 된 것이다.`   

- - - 

### 2. REQUIRES_NEW    

이번에는 자식 메소드에서 REQUIRES_NEW 옵션을 준 후에 아래 코드에서 
테스트를 해보자.   

```java
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final UserChildService userChildService;
    @Transactional
    public void parentMethod() { // 부모

        userRepository.save(createUser("k1"));
        userChildService.childMethod();
        userRepository.save(createUser("k3"));
    }
}
```

```java
@Service
@RequiredArgsConstructor
public class UserChildService {

    private final UserRepository userRepository;
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void childMethod() { // 자식
        userRepository.save(createUser("k2"));
        throw new RuntimeException(); // 예외 발생
    }
}
```  

위의 설명에서 봤던 것처럼 부모, 자식 트랜잭션이 독립적으로  
각각 열리기 때문에 자식에서 예외가 발생해도 부모에서 save 한 것은 
저장이 되는 것을 예상했다.      

하지만 결과를 확인해보면, 모두 Rollback 된 것을 확인 할 수 있다.   

`여기 주의해야 할 사항은, 트랜잭션 전파 되는 것과 예외가 전파 되는 것이 
다르다는 것이다.`    

`자식쪽에 예외가 발생할 경우 자식쪽은 트랜잭션이 롤백이 된다. 이 때 
부모쪽은 트랜잭션이 전파가 되지 않지만 예외는 전파된다.`   
`부모쪽에서 그 예외를 자식으로부터 받았기 때문에 부모쪽에도 예외가 전파되어 
롤백이 된 것이다.`   

즉, 아래와 같이 REQUIRES_NEW를 try-catch로 감싼 후 결과를 확인해보면, 
    부모쪽만 커밋이 되어 정상적으로 저장이 된다. 

```java
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final UserChildService userChildService;
    @Transactional
    public void parentMethod() { // 부모
        try {
            userRepository.save(createUser("k1"));
            userChildService.childMethod();
            userRepository.save(createUser("k3"));
        } catch (RuntimeException e) {
            e.printStackTrace();
        }
    }
```

```shell
mysql> select * from user;
+----+------+
| id | name |
+----+------+
|  1 | k1   |
+----+------+
1 row in set (0.00 sec)
``` 

그렇다면 부모에서 예외가 발생한 경우에 어떻게 될까?   

```java
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final UserChildService userChildService;
    @Transactional
    public void parentMethod() { // 부모
        userRepository.save(createUser("k1"));
        userChildService.childMethod();
        userRepository.save(createUser("k3"));
        throw new RuntimeException(); // 부모에서 예외 발생 
    }
```

```java
@Service
@RequiredArgsConstructor
public class UserChildService {

    private final UserRepository userRepository;
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void childMethod() { // 자식
        userRepository.save(createUser("k2"));
    }
}
```   

자식은 정상적으로 커밋이 되어 저장이 되었다.   
`REQUIRES_NEW는 부모 트랜잭션에서 예외가 발생해도 자식 트랜잭션에서 
꼭 커밋되어야 하는 상황에서 사용하면 좋을 것 같다.`   

```shell
mysql> select * from user;
+----+------+
| id | name |
+----+------+
|  2 | k2   |
+----+------+
1 row in set (0.00 sec)
```

- - - 

### 3. MANDATORY   

MANDATORY는 부모 트랜잭션이 존재하면 무조건 부모 트랜잭션에 합류시키고, 
    부모 트랜잭션에 트랜잭션이 시작된 것이 없다면 예외를 발생시킨다.  
`즉, 혼자서는 독립적으로 트랜잭션을 진행하면 안되는 경우에 사용한다.`   

```java
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final UserChildService userChildService;
    // 부모 트랜잭션이 없는 상태
    public void parentMethod() { // 부모
        userRepository.save(createUser("k1"));
        userChildService.childMethod();
        userRepository.save(createUser("k3"));
    }
}
```

```java
@Service
@RequiredArgsConstructor
public class UserChildService {

    private final UserRepository userRepository;
    @Transactional(propagation = Propagation.MANDATORY)
    public void childMethod() { // 자식
        userRepository.save(createUser("k2"));
    }
}
```

<img width="1500" alt="스크린샷 2022-03-15 오후 11 11 28" src="https://user-images.githubusercontent.com/26623547/158396600-12c20230-71c3-4cd4-bbb3-1c9b9bbddf63.png">   

예측 했던 것처럼 부모에서 트랜잭션을 시작하지 않아서 위와 같은 에러가 
발생한 것을 볼 수 있다.   

```shell
mysql> select * from user;
+----+------+
| id | name |
+----+------+
|  1 | k1   |
+----+------+
1 row in set (0.00 sec)
```   

데이터 베이스를 확인해보면, 부모에서 첫 번째로 저장한 User 1 번만 
저장되고 나머지는 저장되지 않은 것을 확인할 수 있다.   

- - - 

### 4. NESTED   

`위에서 NESTED 옵션은 이미 진행중인 트랜잭션이 있으면 중첩 트랜잭션을 시작하며, 
    중첩 트랜잭션은 독립적인 트랜잭션을 만드는 REQUIRES_NEW와는 다르다고 설명했다.`    

예를 들어 어떤 중요한 작업을 진행하는 중에 작업 로그를 DB에 저장해야 한다고 해보자.   
그런데 로그를 저장하는 작업이 실패하더라도 메인 작업의 트랜잭션까지는 롤백해서는 안되는 
경우가 있다.   
반면에 로그를 남긴 후에 핵심 작업에서 예외가 발생한다면 이때는 저장한 로그도 
롤백해야 한다. 바로 이럴 때 로그 작업을 메인 트랜잭션에서 분리해서 
중첩 트랜잭션으로 만들어 두면 된다.   
메인 트랜잭션이 롤백되면 중첩된 로그 트랜잭션도 같이 롤백이 되지만, 반대로 
중첩된 로그 트랜잭션이 롤백되어도 메인 작업에 이상이 없다면 메인 트랜잭션은 
정상적으로 커밋된다.   

> 중첩 트랜잭션은 JDBC 3.0 스펙의 저장포인트(savepoint)를 지원하는 드라이버와 
DataSourceTransactionManager를 이용할 경우에 적용 가능하다. 또는 중첩 트랜잭션을 
지원하는 일부 WAS의 JTA 트랜잭션 매니저를 이용할 때도 적용할 수 있다.   
> 유용한 트랜잭션 전파 방식이지만 모든 트랜잭션 매니저에 다 적용 가능한 건 아니므로, 
    적용하려면 사용할 트랜잭션 매니저와 드라이버, WAS의 문서를 참조해보고, 미리 
    학습 테스트를 만들어서 검증해봐야 한다.   



NESTED 속성에서는 부모 트랜잭션에서 에러가 발생하면 자식 트랜잭션은 어떻게 
되는지 확인해보자.    

```java
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final UserChildService userChildService;
    @Transactional // 트랜잭션 존재
    public void parentMethod() { // 부모
        userRepository.save(createUser("k1"));
        userChildService.childMethod();
        userRepository.save(createUser("k3"));
        throw new RuntimeException();
    }
}
```

```java
@Service
@RequiredArgsConstructor
public class UserChildService {

    private final UserRepository userRepository;
    @Transactional(propagation = Propagation.NESTED)
    public void childMethod() { // 자식
        userRepository.save(createUser("k2"));
    }
}
```

`위 코드를 실행하면 자식 트랜잭션도 커밋이 되지 않는다.`        
`이유는 부모 트랜잭션이 존재하면 자식 트랜잭션이 중첩되어 생성되고, 자식 트랜잭션은 부모 트랜잭션의 롤백에 
영향을 받기 때문이다.`    

그럼 자식 트랜잭션에서 예외가 발생했을 때 어떻게 되는지 살펴보자.   

```java
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final UserChildService userChildService;
    @Transactional // 트랜잭션 존재
    public void parentMethod() { // 부모
        try {
            userRepository.save(createUser("k1"));
            userChildService.childMethod();
            userRepository.save(createUser("k3"));
            throw new RuntimeException();
        } catch (Exception e) { // 부모에서 예외 처리
            e.printStackTrace();
        }
    }
}
```

```java
@Service
@RequiredArgsConstructor
public class UserChildService {

    private final UserRepository userRepository;
    @Transactional(propagation = Propagation.NESTED)
    public void childMethod() { // 자식
        userRepository.save(createUser("k2"));
        throw new RuntimeException();
    }
}
```   

결과를 확인해보면, 자식 트랜잭션을 호출하기 전 부모 트랜잭션에서 호출한 
Insert 쿼리가 커밋된 것을 볼 수 있다.   

```shell
mysql> select * from user;
+----+------+
| id | name |
+----+------+
|  1 | k1   |
+----+------+
1 row in set (0.00 sec)
```   

그럼 마지막으로 부모 트랜잭션이 존재하지 않는다면 새로운 트랜잭션을 
생성한다고 했는데, 결과를 확인해보자.   

```java
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final UserChildService userChildService;
    // 부모 트랜잭션 존재하지 않음
    public void parentMethod() { // 부모
        try {
            userRepository.save(createUser("k1"));
            userChildService.childMethod();
            userRepository.save(createUser("k3"));
        } catch (Exception e) { // 부모에서 예외 처리
            e.printStackTrace();
        }
    }
}
```

```java
@Service
@RequiredArgsConstructor
public class UserChildService {

    private final UserRepository userRepository;
    @Transactional(propagation = Propagation.NESTED)
    public void childMethod() { // 자식
        userRepository.save(createUser("k2"));
        throw new RuntimeException();
    }
}
```

```shell
mysql> select * from user;
+----+------+
| id | name |
+----+------+
|  1 | k1   |
+----+------+
1 row in set (0.00 sec)
```

위처럼 부모 트랜잭션이 없을 때는 자식 트랜잭션에서 새로 열리다 보니 자식 트랜잭션에서 
예외가 발생해도 부모 트랜잭션에서는 k1 유저가 커밋된 것을 볼 수 있다.   

- - - 

### 5. NEVER   

`NEVER는 메소드가 트랜잭션을 필요로 하지 않는다. 만약 진행 중인 트랜잭션이 
존재하면 예외를 발생시킨다.`    

```java
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final UserChildService userChildService;
    @Transactional // 트랜잭션 존재 
    public void parentMethod() { // 부모
        userRepository.save(createUser("k1"));
        userChildService.childMethod();
        userRepository.save(createUser("k3"));
    }
```

```java
@Service
@RequiredArgsConstructor
public class UserChildService {

    private final UserRepository userRepository;
    @Transactional(propagation = Propagation.NEVER)
    public void childMethod() { // 자식
        userRepository.save(createUser("k2"));
    }
}
```  

<img width="1500" alt="스크린샷 2022-03-15 오후 11 19 49" src="https://user-images.githubusercontent.com/26623547/158398526-a3a96110-552d-4272-8f4e-56ed79ea933a.png">    
 

`위처럼 부모에서 트랜잭션이 존재한다면 Existing transaction found for transaction marked with propagation 'never' 
에러가 발생하는 것을 볼 수 있다.`   

- - -

Reference   

<https://deveric.tistory.com/86>   
<https://devlog-wjdrbs96.tistory.com/424>     
<https://springsource.tistory.com/136>   

- - - 

{% highlight ruby linenos %}


{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

