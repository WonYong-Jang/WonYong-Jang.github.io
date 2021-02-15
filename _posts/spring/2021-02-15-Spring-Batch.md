---
layout: post
title: "[Spring] Spring Batch"
subtitle: "Tasklet 방식, Chunk oriented processing 방식"
comments: true
categories : Spring
date: 2021-02-15
background: '/img/posts/spring.png'
---

# 1. Batch 란? 

배치(Batch)는 일괄처리 라는 뜻을 가지고 있다. 배치 어플리케이션은 
다음과 같은 조건을 만족해야만 한다.   

- 대용량 데이터 : 대량의 데이터를 가져오거나, 전달하거나, 계산하는 등의 
처리를 할 수 있어야 한다.    

- 자동화 : 심각한 문제 해결을 제외하고는 사용자 개입없이 실행 되어야 한다.   

- 견고성 : 잘못된 데이터를 충돌/중단 없이 처리할 수 있어야 한다.   

- 신뢰성 : 무엇이 잘못되었는지를 추적할 수 있어야 한다. ( 로깅, 알림 )   

- 성능 : 지정한 시간 안에 처리를 완료하거나 동시에 실행되는 다른 어플리케이션을 
방해하지 않도록 수행되어야 한다.   

## 1-1 Spring Batch?   

`Spring Batch는 Spring의 특성을 그대로 가져왔다. 그래서 DI, AOP, 서비스 추상화 등 
Spring 프레임워크 3대 요소를 모두 사용할 수 있다.`   

Spring Batch에서 Job은 하나의 배치 작업 단위를 말한다. Job 안에는 아래처럼 
여러 Step이 존재하고, Step 안에 Tasklet 혹은 Reader & Processor & Writer 묶음이 존재한다.   

<img width="700" alt="스크린샷 2021-02-15 오후 8 45 38" src="https://user-images.githubusercontent.com/26623547/107942696-f2a86380-6fce-11eb-839d-5ca5e8d13e60.png">   

Job안에 여러 Step이 있다는건 쉽게 이해되지만, Step이 품고 있는 단위가 애매하게 보일 수 있다.   

`Tasklet 하나와 Reader & Processor & Writer 한 묶음이 같은 레벨이다. 즉, Reader & Processor 가 끝나고 Tasklet으로 
마무리 짓는 등으로 만들 수 없다는 것을 명심하자.( 둘 중 하나만 선택 할 것 )`   

> Tasklet은 어찌보면, Spring MVC의 @Component, @Bean과 비슷한 역할이라고 생각하면 
이해가 쉽다. 명확한 역할은 없지만, 개발자가 지정한 커스텀한 기능을 위한 단위로 보면 된다.   

### Step    

`Step은 Job 내부에 구성되어 실제 배치작업 수행을 위해 작업을 정의하고 제어한다. 
즉, Step에서는 입력 자원을 설정하고, 어떤 방법으로 어떤 과정을 통해 처리할지 그리고 
어떻게 출력 자원을 만들 것인지에 대한 모든 설정을 포함한다.`       

Step은 Job의 독립적이고 순차적 단계를 캡슐화하는 도메인 객체이다. 
그러므로 모든 Job은 적어도 하나 이상의 Step으로 구성되며 Step에 실제 
배치작업을 처리하고 제어하기 위해 필요한 모든 정보가 포함된다.   

Spring Batch는 Tasklet 방식과 Chunk 방식 크게 2가지가 있다. 2가지 방식을 
알아보자.   


### Tasklet   

`Tasklet은 계속 진행할지, 그리고 끝낼지 두가지 경우만 제공한다. Chunk와 같이 
Reader, Processor, Writer 세 로직을 나눠 제공하는 형태가 아니라, 1회성 
처리 로직 또는 Reader, Processor, Writer를 한 로직에 모아 놓는 방식의 
비지니스 로직을 구현할 때 쓴다.`   

따라서 Chunk와는 다르게 메타테이블에 Read-Count, Write-Count 등의 메타 
정보가 남아 있지 않아 Tasklet을 사용할 때에는 직접 기록하거나 해야 한다.   

Tasklet의 execute 메소드의 return 타입은 RepeatStatus인데, 상수값을 받는다.   
RepeatStatus.FINISHED는 종료, RepeatStatus.CONTINUEABLE은 다시 실행된다. 
처리 건이 남아 있거나, 다시 로직이 실행되어야 하는 경우는 RepeatStatus.CONTINUABLE를 반환하면 
다시 샐행된다.   

```java
public interface Tasklet {
    /**
     * Given the current context in the form of a step contribution, do whatever
     * is necessary to process this unit inside a transaction. Implementations
     * return {@link RepeatStatus#FINISHED} if finished. If not they return
     * {@link RepeatStatus#CONTINUABLE}. On failure throws an exception.
     *
     * @param contribution mutable state to be passed back to update the current
     * step execution
     * @param chunkContext attributes shared between invocations but not between
     * restarts
     * @return an {@link RepeatStatus} indicating whether processing is
     * continuable. Returning {@code null} is interpreted as {@link RepeatStatus
     *
     * @throws Exception thrown if error occurs during execution.
     */
    @Nullable
    RepeatStatus execute(StepContribution contribution, ChunkContext chunkContex
}
```


### Chunk( Chunk-oriented Processing )   

Chunk oriented Processing은 트랜잭션 경계 내에서 Chunk 단위로 
데이터를 일고 생성하는 기법이다. 

> Chunk란 아이템이 트랜잭션에서 커밋되는 수를 말한다. 읽어온 데이터를 
지정된 Chunk 수에 맞게 트랜잭션을 진행한다.   

예를 들어 1천 개의 데이터를 업데이트해야 한다고 가정해보자. 이럴 경우 
위에서 말한 tasklet 방식이나 Chunk로 데이터를 지정하지 않은 경우 
천 개의 데이터에 변경을 한 번에 해야 한다. 이렇데 되면 천 개의 
데이터 중 한개의 데이터라도 업데이트를 실패하여 Exception 발생할 경우 
천 개의 데이터를 롤백해야 한다. 또한 트랜잭션 시간을 길게 가져감으로써 
데이터베이스로부터 읽어온 데이터들이 lock이 걸리게 된다. 
이러한 문제를 해결하기 위해 Chunk oriented Processing을 이용해야 한다.   
Chunk를 지정하게 되면 한건에 실패에 대한 Chunk 부터 뒤에까지만 영향을 
받게 된다. 실패한 Chunk 앞에 영역은 영향을 받지 않는다. 또한, Chunk 만큼만 
트랜잭션 시간을 가져가기 때문에 트랜잭션 시간을 짧게 가져갈수 있다.   

아래 코드는 Chunk oriented processing flow 컨셉을 나타내는 자바 소스 코드이다.    

```java
 List items = new Arraylist();
for(int i = 0; i < commitInterval; i++){
    Object item = itemReader.read()  //reader에서 데이터 읽어오기
    Object processedItem = itemProcessor.process(item); //process로 비지니스로직처리
    items.add(processedItem); //list에 target 데이터 사빕
}
itemWriter.write(items); // 청크만큼 데이터 저장
```

즉, 하나의 item이 itemReader를 통해 읽히고, Chunk 단위로 묶인 item들이 한번에 ItemWriter로 전달 되어 쓰이게 된다.   

> 처리 매커니즘 : Item 읽기(ItemReader) -> 처리/변환(ItemProcessor) -> 쓰기(ItemWriter) 




- - - 


## 1-2 Batch VS Quartz ?  

Spring Batch와 Spring Quartz가 비슷하다고 생각할 수 있지만 둘의 역할은 완전히 다르다.   

`Quartz는 스케줄러의 역할이지 Batch 와 같이 대용량 데이터 배치 처리에 대한 기능을 
지원하지 않는다.   
반대로 Batch 역시 Quartz의 다양한 스케줄 기능을 지원하지 않아서 보통 Quartz + Batch를 조합해서 
사용한다.`   







- - -
Referrence 

<https://jojoldu.tistory.com/324>   
<https://www.egovframe.go.kr/wiki/doku.php?id=egovframework:rte2:brte:batch_core:step>   

{% highlight ruby linenos %}
{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

