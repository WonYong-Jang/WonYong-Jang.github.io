---
layout: post
title: "[Spring] RetryTemplate"
subtitle: "RetryOperations, RetryContext, RetryCallback, Recovery Callback, Retry Policies, Backoff Policies" 
comments: true
categories : Spring
date: 2021-02-18
background: '/img/posts/spring.png'
---

## RetryTemplate   

비지니스 로직을 처리할 때 Exception이 발생하는 경우가 있다. 이 때 에러를 무시할 수도 있고, 
    에러를 잡아서 다시 처리해야할 때도 있다.   
`에러를 다시 처리해야할 경우 Spring에서 제공하는 RetryTemplate을 유용하게 사용할 수 있다.`    
`이는 일시적인 네트워크 결함과 같이 오류가 일시적 일 수 있는 경우에 유용하다.`   

Spring Retry에는 작업에 대한 재시도를 자동화하기 위한 인터페이스인 RetryOperations가 있다.   
아래는 RetryOperations인터페이스 코드이며, execute() 메소드가 존재하는데 매개변수인 
RetryCallback은 실패 시 재시도해야 하는 비즈니스 로직 삽입을 허용하는 
인터페이스 이다.   

```java
public interface RetryOperations {
	<T, E extends Throwable> T execute(RetryCallback<T, E> retryCallback) throws E;
    ...
}
```

아래는 RetryCallback 인터페이스이며, RetryCallback은 doWithRetry라는 메소드를 하나 가지고 
있는 간단한 인터페이스이다.   
doWithRetry 메소드에는 재시도를 할 비즈니스 로직이 들어간다.    


```java
public interface RetryCallback<T, E extends Throwable> {
	T doWithRetry(RetryContext context) throws E;
}
```

콜백이 실패하면 재시도 정책에 따라서 특정 횟수 혹은 특정 시간동안 재시도를 할 것이다.   


RetryTemplate은 RetryOperations의 구현체이다.   
@Configuration 클래스에서 RetryTemplate Bean을 구성해서 사용해보자.   

- - - 

## RetryTemplate 사용

```java
implementation 'org.springframework.retry:spring-retry'

@Configuration
public class RetryTemplateConfig {

    @Bean
    public RetryTemplate someRetryTemplate() {
        FixedBackOffPolicy backOffPolicy = new FixedBackOffPolicy();
        backOffPolicy.setBackOffPeriod(1); //지정한 시간만큼 대기후 재시도 한다.
        // ExponentialBackOffPolicy backOffPolicy = new ExponentialBackOffPolicy();
        // backOffPolicy.setInitialInterval(100L); //millisecond
        // backOffPolicy.setMultiplier(2); //interval * N 만큼 대기후 재시도 한다.

        SimpleRetryPolicy retryPolicy = new SimpleRetryPolicy();
        retryPolicy.setMaxAttempts(2); //retry max count

        RetryTemplate retryTemplate = new RetryTemplate();
        retryTemplate.setBackOffPolicy(backOffPolicy);
        retryTemplate.setRetryPolicy(retryPolicy);
        return retryTemplate;
    }
}
```

```java
@Service
public class SomeClass {
    
    @Autowired
    private RetryTemplate someRetryTemplate;   

    public String apply() {
        String result = someRetryTemplate.execute(context -> someFunction());
        return result;
    }
}
```

#### Recovery Callback   

`재시도가 전부 실패하면, RetryOperations는 RecoveryCallback을 호출한다.`   
이 기능을 사용하려면 execute 메소드를 호출할 때 RecoveryCallback 객체를 
전달해주어야 한다.   

```java
Foo foo = template.execute(new RetryCallback<Foo>() {
    public Foo doWithRetry(RetryContext context) {
        // business logic here
    },
  new RecoveryCallback<Foo>() {
    Foo recover(RetryContext context) throws Exception {
          // recover logic here
    }
});
```

모든 재시도가 실패하고 더 이상 재시도할 수 없는 경우, RecoveryCallback 메소드를 호출한다.    
RecoveryCallback의 recover 메소드에서는 재시도가 전부 실패한 경우에 대한 대체 로직을 수행한다.   

#### Backoff Policies   

오류가 발생하여 재시도를 할 때 재시도를 하기전에 잠깐 기다리는 것이 유용할 때가 많다.   
일반적으로 오류는 잠깐 동안 기다리기만 해도 해결되는 경우가 많다.   
`RetryCallback이 실패하면 RetryTemplate은 BackoffPolicy에 따라 실행을 
일시적으로 중지할 수 있다.`   

```java
public interface BackOffPolicy {

	BackOffContext start(RetryContext context);

	void backOff(BackOffContext backOffContext) throws BackOffInterruptedException;
}
```

BackoffPolicy 인터페이스의 backOff 메소드를 원하는 방식으로 구현하면 된다.   
backoff 시간을 기하급수적으로 증가시키고 싶으면 ExponentialBackoffPolicy를 
사용하면 된다. 고정된 시간으로 backoff 시키고자 한다면 FixedBackOffPolicy를 사용하면 된다.   

#### Retry Policies   

`RetryTemplate에서 재시도 할지 여부는 RetryPolicy에 의해 결정된다.`   
RetryTemplate은 RetryPolicy의 open 메소드를 통해서 RetryContext 객체를 생성한다.   
그리고 RetryCallback의 doWithRetry 메소드 인자로 생성된 RetryContext 객체를 전달한다.   
RetryTemplate은 콜백이 실패한 경우 RetryPolicy에게 상태를 업데이트 하도록 요청한다.   
그리고, RetryPolicy의 canRetry 메소드를 호출하여, 재시도가 가능한지 여부를 묻는다. 
만약 재시도가 불가능한경우 RetryTemplate은 마지막 콜백 실행시 발생한 예외를 던진다.   
단, RecoveryCallback이 있는 경우 RecoveryCallback 메소드를 호출한다.    


```java
// Set the max attempts including the initial attempt before retrying
// and retry on all exceptions (this is the default):
SimpleRetryPolicy policy = new SimpleRetryPolicy(5, Collections.singletonMap(Exception.class, true));

// Use the policy...
RetryTemplate template = new RetryTemplate();
template.setRetryPolicy(policy);
template.execute(new RetryCallback<Foo>() {
    public Foo doWithRetry(RetryContext context) {
        // business logic here
    }
});
```

위처럼, 모든 예외를 재시도 하는 것은 비효율적일 수 있다. 따라서 모든 예외에 
대해 재시도 하지말고, 재시도 가능할 것 같은 예외에 대해서만 재시도 할 수 있다.  

> 재시도 해도 또 다시 예외가 발생할 것이 확실한 경우에 재시도를 하는 것은 비효율적이기 때문이다.   

`ExceptionClassifierRetryPolicy라는 보다 유연한 RetryPolicy도 있다.`   
이는 예외 유형에 따라 다르게 재시도할 수 있도록 해준다. ExceptionClassifierRetryPolicy는 
예외 유형에 따라 RetryPolicy를 결정한다.   
`즉, 콜백 메소드에서 발생하는 예외 유형에 따라 RetryPolicy를 다르게 하고 싶을 때 유용하다.`   

- - -
Referrence 

<https://jjhwqqq.tistory.com/192>   
<https://gunju-ko.github.io/spring/2018/09/12/RetryTemplate.html>   

{% highlight ruby linenos %}
{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

