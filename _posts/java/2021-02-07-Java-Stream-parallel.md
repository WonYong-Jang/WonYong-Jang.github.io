---
layout: post
title: "[Java] Stream parallel"
subtitle: "병렬 Stream 사용 방법과 사용시 주의사항 / Thread Pool / ForkJoinPool"   
comments: true
categories : Java
date: 2021-02-07
background: '/img/posts/mac.png'
---

자바에서는 다양한 방법으로 병렬 처리를 만들 수 있다. 기본적인 Thread 클래스를 이용할 수 
있으며, ExecutorService를 이용하여 쓰레드 풀도 쉽게 만들 수 있다. 그리고 CompletableFuture를 이용하면 
쓰레드 간의 데이터 동기화, 실행 순서 등도 원하는 대로 조작 할 수 있다.   

그리고 자바8에서 등장한 Stream은 병렬 처리를 쉽게 사용할 수 있게 메서드를 
제공해준다. 만들어 놓은 Stream에 parallel를 추가하기만 하면 된다.   

자바8의 병렬 Stream에 대해서 알아보고 사용함에 있어서 
주의 사항에 대해서도 알아보자.   

- - - 


# Steam parallel      

병렬 Stream은 내부적으로 자바 7에 추가된 Fork / Join Framework를 사용한다.    
`Fork / Join Framework은 작업을 분할 가능한 만큼 쪼개고 쪼개진 작업을 별도의 work Thread를 통해 작업 후 
결과를 합치는 과정을 거쳐 결과를 만들어 낸다.`   

분할정복 알고리즘과 비슷하다고 보면 되는데 fork를 통해 task를 분담하고 join을 통해 합치게 된다.   

<img width="671" alt="스크린샷 2021-02-21 오후 11 42 06" src="https://user-images.githubusercontent.com/26623547/108628490-a497d200-749e-11eb-9485-1d0ad3b91983.png">   

Fork / Join framework의 중심은 AbstractExecutorService 클래스를 
확장한 ForkJoinPool이다.   

ForkJoinPool에 대해 알아보기 위해 
[javaDocs](https://docs.oracle.com/javase/8/docs/api/java/util/concurrent/ForkJoinPool.html)을 일부 발췌한 내용이다.   

An ExecutorService for running ForkJoinTasks. A ForkJoinPool provides the entry point for submissions from non-ForkJoinTask clients, as well as management and monitoring operations.
A ForkJoinPool differs from other kinds of ExecutorService mainly by virtue of employing work-stealing: all threads in the pool attempt to find and execute tasks submitted to 
the pool and/or created by other active tasks (eventually blocking waiting for work if none exist). This enables efficient processing when most tasks spawn other subtasks (as do most ForkJoinTasks), as well as when many small tasks are submitted to the pool from external clients. Especially when setting asyncMode to true in constructors, ForkJoinPools may also be appropriate for use with event-style tasks that are never joined.   

주의 깊게 봐야할 부분은 아래와 같다.    
- `다른 종류의 ExecutorService와는 다르게 Work-stealing 메커니즘을 사용한다.`   
- `때문에 대부분의 task가 하위 task를 생성하는 경우, 외부 클라이언트에 의한 small task가 많을 경우 
효과적일 수 있다.`   

하지만 크게 와닿지 않는다. 조금 더 쉽게 풀어서 예를 들면 아래와 같다.   

1. 1부터 10000까지 더해야하는 task가 있다.   
2. Fork - Join 을 위해 아래 작업을 수행한다.   
    2-1. task를 가능한 잘게 쪼갠다. (Fork)   
    2-2. ForkJoinPool에 있는 Thread들은 각각의 task를 처리하며 그 과정은 아래와 같다.(Join)   
        2-2-1. ForkJoinPool 내부에는 inbound queue가 존재하며 inbound queue에는 task가 쌓인다.   
        2-2-2. 각각의 Thread 들은 쌓여있는 task를 자신에게 개별 할당 된 queue에 적재해가며 처리한다.   
        2-2-3. 만약 각각의 queue에 task가 더 남아 있지 않으면 다른 Thread들의 queue에 남아 있는 task를 steal 한다.   

그림으로는 아래와 같다.   
`왼족에서 task를 보내면(submit) 하나의 inbound queue에 누적되고 그걸 A와 
B 쓰레드가 가져다가 일을 처리 한다. A와 B는 각자 큐가 있으며, 자신의 
큐에 아무 task가 없으면 상대방의 큐에서 steal 하는데 이는 멍청하게 놀고 있는 
쓰레드를 방지하기 위함이다.`    

> 쓰레드 자신의 task queue로 deque를 사용한다. deque는 양쪽 끝으로 넣다, 뺄 수 있는 
독특한 구조이며, ForkJoinPool에서 중추를 담당하고 있다. 각 쓰레드는 
deque의 한쪽 끝에서만 일한다. 스택처럼 한쪽에서만 일하고 있고, 
    그 나머지 반대 쪽에서는 task를 훔치러 온 다른 쓰레드가 접근한다.    

<img width="733" alt="스크린샷 2021-09-08 오전 8 59 00" src="https://user-images.githubusercontent.com/26623547/132424771-53b5de4f-46af-4066-997b-9bb7ce8f3f05.png">   

지금까지 병렬 stream이 내부적으로 ForkJoinPool을 사용하고 있다고 
알아보았는데, 아래와 같은 코드를 살펴보자.   

```java
new ForkJoinPool(10).submit(() -> {   
    integerList.parallelStream().forEach((integer) -> {
```

위의 코드는 병렬 stream은 내부적으로 ForkJoinPool을 사용하는데 왜 ForkJoinPool을 
명시적으로 선언하여 사용하였는지가 의문이 들 수 있다.   

ForkJoinPool 생성자에서 전달하는 인자는 int parallelism으로 병렬지수를 의미한다.   

 

그리고 병렬 스트림의 Fork / Join Framework의 work Thread의 수는 서비스가 돌아가는 서버의 
CPU 코어 수에 종속된다. 즉 개인 PC에서 돌렸을 때 4Core PC라면 thread는 4개로 작업을 
진행한다. 

> 자바에서는 Runtime.getRuntime().availableProcessors()으로 JVM에서 이용가능한 CPU Core 개수를 확인 가능하다.   

> 참고로 Intel i7 쿼드 코어 PC에서 코드를 실행했을 때 4가 출력될 것이라고 예상했으나 실제로는 8개가 출력된다. 
이는 Intel이라는 회사가 하이퍼스레딩이라는 기술을 지원 해주기 때문인데, 이것은 물리적 코어 한개당 스레드 2개를 
할당해 성능을 높이는 기술이다. 그래서 물리적 코어는 4개이지만 논리적 코어는 8개인 것이다.   

만약 3초가 걸리는 작업이 4개가 있고 이를 순차적으로 실행했을 경우는 12초가 걸리지만 
4Core PC에서 병렬로 실행했을 경우 
대략 3초가 걸리게 된다.    
만약 5개로 테스트 했을 경우 6초의 결과를 얻을 수 있음을 예상할 수 있고 
실제로 결과가 그렇게 나온다.   


아래의 예제를 확인해보자.   

- - - 

## Stream parallel 예제   

name과 age를 가진 Person이라는 객체가 있다. 우리는 nameList 라는 이름 배열을 가지고 있다고 
가정하자. nameList에 있는 이름 리스트를 이용하여 Person객체를 생성하고 age는 외부 API를 통해 
받아온다고 가정하여 3초의 delay를 주었다.   

```java
@Getter
@Setter
public class Person {

    private String name;
    private int age;

    public Person(String name) {
        this.name = name;
    }

    public void findAge(String name) {

        try {
            Thread.sleep(3000L); // 3초 
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        System.out.println(this.getName());
    }
}
```

```java
public class Main {
    public static void main(String[] args) {

        List<String> nameList = new ArrayList<>(Arrays.asList("mike","kaven", "sol", "harry"));

        long beforeTime = System.currentTimeMillis();

        nameList.stream()
                .map(Person::new)
                .forEach(s -> s.findAge(s.getName()));

        long afterTime = System.currentTimeMillis();
        long result = (afterTime - beforeTime)/1000; 
        System.out.println(result);      // 출력 : 12초   
    }
}
```

위와 같이 nameList를 stream을 Person 객체를 만드는 소스이다. 그 후 findAge 메소드를 
호출하게 되면 3초간의 delay가 생기게 된다. 순차적으로 3초씩 
진행하기 때문에 12초가 걸린 후 종료 된다.   

해당 스트림을 병렬 스트림으로 변경 후 결과를 확인 해보자. parallel 메서드만 추가 
하면 병렬 처리가 이루어진다.      
core 4개 기준으로 결과는 3초의 시간이 걸린다.

```java
nameList.stream()
                .parallel()   // parallel 추가 ! 
                .map(Person::new)
                .forEach(s -> s.findAge(s.getName()));
```


`위의 결과를 보고 생각해 봐야 할 부분이 많이 있다. 우리가 운영 중인 시스템에 
이렇게 모든 Stream을 병렬 스트림으로 변경한다고 하면 정말 큰일 날 수가 있다. Stream의 
paralle에 대해 좀 더 깊게 알아보자.`       

- - - 

## Tread Pool 그리고 주의사항    

`병렬 Stream 사용할 때 가장 큰 문제는 threadPool을 global하게 이용한다는 것이다. 즉, 모든 병렬 Stream이 
동일한 ThreadPool에서 thread를 가져와 사용한다.`    

Thread Pool 에 대해 알아보고 주의사항에 대해 확인 해보자.   


Thread Pool은 무분별하게 Thread의 수가 늘어나는 것을 막아준다.    
`필요할 때 빌려주고 사용하지 않으면 반납하여 Thread의 숫자를 유지하는 역할을 한다.`       
그런데 만약 Thread를 사용중인 곳에서 아래 이미지 처럼 Thread를 반납하지 않고 
계속 점유중이라면 어떻게 될까?   

<img width="400" alt="스크린샷 2021-02-21 오후 7 48 16" src="https://user-images.githubusercontent.com/26623547/108622941-6b039e80-747f-11eb-96d8-fe70d9022dc8.png">    

이렇게 되면 Thread 1, 2, 3은 사용할 수 없으며 Thread 4 한개만을 이용해서 
모든 요청을 처리하게 된다. 특히, Thread 1, 2, 3 이 sleep과 같이 아무런 일을 
하지 않으면서 점유를 하고 있다면 이는 문제가 크다.    
`만약 Thread 4까지 점유중이게 되면 더이상 요청은 처리되지 않고 Thread Pool Queue에 
쌓이게 되며 일정시간 이상 되면 요청이 Drop 되는 현상까지 발생할 것이다.`   

이러한 Thread Pool을 사용할 때 주의해야 할 점은 병렬 Stream을 사용할 경우에도 
동일하게 적용된다. Thread Pool을 global하게 공유하기 때문에 
만약 A메서드에서 4개의 Thread를 모두 점유하면 다른 병렬 Stream의 요청은 
처리되지 않고 대기하게 된다.   

또한, `병렬 스트림을 통해 I/O 작업을 할때 문제가 생길 수 있다.`    
병렬 Stream은 위에서 말한 것처럼 Thread Pool을 공유한다. 그래서 병렬 Stream으로 
blocking io가 발생하는 작업을 하게 되면 Thread Pool 내부의 스레드들은 block 되게 된다. 
이때 이 Thread Pool을 사용하는 다른 쪽의 병렬 Stream은 스레드를 얻을 때 까지 계속해서 
기다리게 되어 문제가 발생한다.    

- - - 

## 커스텀 ForkJoinPool을 이용한 병렬 스트림    

위에 언급한 문제점은 ForkJoinPool을 커스텀하게 제작함으로써 해결할 수 있다.   



- - - 

## 병렬 Stream 처리 성능   

`스트림 병렬 처리가 스트림 순차 처리보다 항상 실행 성능이 좋다고 판단해서는 안된다.`    
병렬 처리에 영향을 미치는 여러가지 요인에 대해 확인해보자.   

#### 요소의 수와 요소당 처리 시간   

컬렉션에 요소의 수가 적고 요소당 처리 시간이 짧으면 순차 처리가 오히려 병렬 처리보다 
빠를 수 있다. 병렬 처리는 작업들을 분할하고 다시 합치는 비용, 스레들 간의 컨텍스트 스위치 비용도 포함되기 때문이다.   

#### Stream 소스의 종류    

ArrayList, 배열은 랜덤 액세스를 지원(인덱스로 접근)하기 때문에 포크 단계에서 쉽게 
요소를 분리할 수 있어 병렬 처리 시간이 절약된다. 반면에 HashSet, TreeSet은 요소를 분리하기가 
쉽지 않고, LinkedList는 랜덤 엑세스를 지원하지 않아 링크를 따라가야 하므로 
역시 요소를 분리하기가 쉽지 않다. 또한 BufferedReader.lines()은 전체 요소의 
수를 알기 어렵기 때문에 포크 단계에서 부분 요소로 나누기 어렵다. 따라서 
이들 소스들은 ArrayList, 배열 보다는 상대적으로 병렬처리가 늦다.      


#### CPU 코어(Core)의 수      

싱글 코어 CPU일 경우 순차 처리가 빠르다. 병렬 처리를 할 경우 스레드의 수만 증가하고 
번갈아 가면서 스케줄링을 해야하므로 좋지 못한 결과를 준다. 코어의 수가 많으면 많을 수록 
병렬 작업 처리 속도는 빨라진다.   

- - - 

## 정리   

병렬 Stream 사용 예제와 내부 동작 원리 및 주의사항에 대해 알아봤다.   
사용은 간단하지만, 사용함에 있어서 신중해야 한다고 느꼈다. 따라서 문제가 없을지 
추측하는 것보다는 테스트를 통해 순차 연산과 비교해서 결과 값의 차이는 없는지, 
    처리시간의 단축이 병렬화 처리로 인해 사용되는 비용보다 효율적인지 판단해야 한다.   

- - - 

**Reference**    

<https://multifrontgarden.tistory.com/254>   
<https://sabarada.tistory.com/102>   
<https://dev-milk.tistory.com/5>   
<https://hamait.tistory.com/612>   

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

