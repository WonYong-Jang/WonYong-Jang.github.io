---
layout: post
title: "[Spring] 트랜잭션 Propagation 이해하기"
subtitle: "REQUIRES, REQUIRES_NEW, MANDATORY, SUPPORT ,NESTED, NEVER"
comments: true
categories : Spring
date: 2020-03-21
background: '/img/posts/spring.png'
---

[지난글](https://wonyong-jang.github.io/spring/2020/03/20/Spring-Transaction.html)에서 스프링의 트랜잭션의 전반적인 내용과 
스프링 트랜잭션의 롤백정책에 대해서 살펴봤다.       
이번글에서는 Spring Transactional 어노테이션에서 propagation 특징에 
대해서 정리해보려고 한다.     

- - - 


## 1. Spring Propagation   

<img width="818" alt="스크린샷 2022-03-14 오후 11 05 50" src="https://user-images.githubusercontent.com/26623547/158189534-88ae6f08-466b-49b7-ae0e-ad471094790a.png">      

대부분 글에서 Propagation에 대해서 위처럼 설명한다. 이를 이해하기 위해 
예제 코드로 살펴보자.   

- - - 

### 1-1) REQUIRED     

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

그렇다면 위와 같이 자식에서 발생한 예외를 부모 트랜잭션에서 try-catch 예외 처리 
하는 경우에는 어떻게 될까?    

<img width="1439" alt="스크린샷 2022-03-15 오후 10 42 10" src="https://user-images.githubusercontent.com/26623547/158390678-9301fe97-c2c8-4e57-a007-f590719f4691.png">   

`try-catch를 하더라도 예외가 발생하면 전부 Rollback되는 것을 볼 수 있다.`    
`위 메시지는 부모 트랜잭션과 자식 트랜잭션이 하나로 묶어져있고 그 트랜잭션이 
롤백이 되었기 때문에 출력이 된 것이다.`   

- - - 

### 1-2) REQUIRES_NEW    

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

위의 설명에서 봤던 것처럼 부모, 자식 트랜잭션이 
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

### 1-3) MANDATORY   

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

### 1-4) NESTED   

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
`이유는 부모 트랜잭션이 존재하면 자식 트랜잭션도 부모 트랜잭션에 
합류하기 때문이다.`      

- - - 

### 1-5) NEVER   

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

<https://devlog-wjdrbs96.tistory.com/424>    

- - - 

{% highlight ruby linenos %}


{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

