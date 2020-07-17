---
layout: post
title: "[Spring] Java Quartz Scheduler"
subtitle: "Spring Boot에서 Cron을 이용한 스케줄러 구현"
comments: true
categories : Spring
date: 2020-07-04
background: '/img/posts/spring.png'
---

## Quartz Scheduler 

`Quartz 라이브러리는 일반적으로 스케줄러를 구성하기 위해서 사용한다. 서버를 운영하기 위해서는 
간혹 주기적으로 매일, 매주, 매월 등 주기적으로 특정한 프로그램을 실행할 필요가 있다. 이 작업은 
운영체제의 기능을 이용해서 작업할 수도 있지만, 스프링과 Quartz 라이브러리를 이용하면 간단히 처리 
할수 있다.`    

먼저 Quartz의 구성 요소를 보자.   

### Job 

`Quartz API 에서 단 하나의 메서드 execute(JobExecutionContext context)를 가진 Job 인터페이스를 제공한다.`   
Quartz를 사용하는 개발자는 수행해야 하는 실제 작업을 이 메서드에서 구현하면 된다. 
매개변수인 JobExecutionContext는 Scheduler, Trigger, JobDetail 등을 포함하여 Job 인스턴스에 대한 정보를 제공하는 
객체이다.   

### JobDetail

`Job을 실행시키기 위한 정보를 담고 있는 객체이다. Job의 이름, 그룹, JobDataMap 속성 등을 지정할 수 있다. Trigger가 Job을 수행할 때 
이 정보를 기반으로 스케줄링 한다.`   

### JobDataMap 

`JobDataMap은 Job 인스턴스가 execute 실행할 때 사용할 수 있게 원하는 정보를 담을 수 있는 객체 이다. JobDetail을 생성할 때 
JobDataMap도 같이 세팅해 주면 된다.`   

### Trigger  

`Trigger는 Job을 실행 시킬 스케줄링 조건(반복 횟수, 시작 시간) 등을 담고 있고 Scheduler는 이 정보를 기반으로 Job을 
수행시킨다.`   

`N Trigger = 1 Job`   

반드시 하나의 Trigger는 반드시 하나의 Job을 지정할 수 있다. 

SimpleTrigger 특정시간에 Job을 수행할 때 사용되며 반복횟수와 실행 간격등을 지정할 수 있다.    
CronTrigger 는 cron 표현시기으로 Trigger를 정의하는 방식이다.   



아래는 spring boot 기준으로 기본 설정 방법이다.  

#### 1. pom.xml에 Dependency 설정 

```
implementation 'org.springframework.boot:spring-boot-starter-quartz'   
```
<br>
#### 2. Job 코드 작성

`Quartz Scheduler는 기능을 수행하는 단위인 Job과 스케줄에 대한 정보를 가진 Trigger를 스케줄러에 걸어 
실행하는 구조이다. 먼저 스케줄에 따라 동작할 Job 클래스를 작성한다.`   

```java
public class ScraperJob implements Job {

    @Override
    public void execute(JobExecutionContext context) throws JobExecutionException {
        System.out.println(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
    }
}
```

Job 인터페이스를 implements하여 구현하게 된다.
Quartz를 사용하는 개발자는 수행해야 하는 실제 작업을 이 메서드에서 
구현하면 된다. 위에서는 테스트를 위해서 sout를 출력해본다.   

#### 3. 스케줄러 코드 작성

아래는 스케줄에 따라 위에서 작성한 Job을 수행하는 코드를 Quartz 라이브러리를 사용해 개발할 차례다.   

```java
@Component
public class ScraperScheduler {
    private SchedulerFactory schedulerFactory;
    private Scheduler scheduler;

    @PostConstruct
    public void start() throws SchedulerException {

        schedulerFactory = new StdSchedulerFactory();
        scheduler = schedulerFactory.getScheduler();
        scheduler.start();

        //jobDetail 생성( Job 지정하고 실행하기 위한 상세 정보 )
        JobDetail job = JobBuilder.newJob(ScraperJob.class).withIdentity("testJob").build();

        //trigger 생성
        Trigger trigger = TriggerBuilder.newTrigger().
                withSchedule(CronScheduleBuilder.cronSchedule("15 * * * * ?")).build();
//        startAt과 endAt을 사용해 job 스케쥴의 시작, 종료 시간도 지정할 수 있다.
//        Trigger trigger = TriggerBuilder.newTrigger().startAt(startDateTime).endAt(EndDateTime)
//                .withSchedule(CronScheduleBuilder.cronSchedule("*/1 * * * *")).build();

        scheduler.scheduleJob(job, trigger);
    }
```

- Spring bean으로 등록하기 위해 클래스에 @Component로 작성했고, 실제 스케줄러를 구현한 start()메소드에 
@postConstruct를 추가했다. 

- @postConstruct는 해당 클래스가 인스턴스화 되자마자 자동으로 동작하게 하는 메소드에 선언해 주는 
어노테이션이다. 즉, 위 클래스가 인스턴스화(생성자가 실행된 후) 되자 마자 start() 메소드가 동작한다.   

- 스케줄러를 통한 배치 잡 자체가 사용자의 동작없이 자동으로 수행하게 하기 위한 로직이기 때문에 
어딘가에서 메소드를 호출 해 실행하기 보다는 이런식으로 자동으로 로직이 수행되도록 구현하는 것이 좋다.   

- SchedulerFactory를 선언한 후, Scheduler를 .getScheduler() 메소드를 통해 지정해준다. 그 뒤, 
    해당 스케줄러를 .start() 해주는 것으로 스케줄러를 시작하겠다는 명령을 내리게 된다.   

- `이제 아까 작성한 job을 지정해 줄 차례다. identity는 해당 job을 구분하는 고유 명을 지정해주면 된다. 간혹 같은 job로직이라도 서로 다른 
스케줄로 동작하게 할 경우가 있기 때문에 각각의 job은 고유한 identity를 가져야 한다.`   

- `그 후 trigger를 작성한다. trigger는 TriggerBuilder 클래스를 사용해 구현하게 되는데, 스케줄러를 
수행할 스케줄 정보를 담고 있다. 이때, Cron 문법을 사용해 스케줄을 지정하는 방법이 주로 사용된다. 주석 친 
부분 처럼 startAt이나 endAt을 사용해 스케줄을 시작할 시간, 종료 일시를 지정해 줄 수도 있다. 위 코드에서 
넣어준 cron인 15 * * * * ? 는 매 분 15초에 동작하라는 의미이다.`

    > 다수의 Trigger는 하나의 job을 공유하여 지정할 수 있지만, 하나의 Trigger는 반드시 하나의 Job을 지정해야 한다!   

- 마지막으로 스케줄에 job과 trigger를 연결해 주면 끝난다. 물론 job과 trigger를 여러 개 만들어 각각 
scheduler에 지정해 주면 여러 개의 job 스케줄이 동시에 작동하게 된다.   


#### 4. 스케줄러 실행 

스케줄러를 호출해 실행하는 방법 역시 개발자가 구현하기 나름이겠지만, 배치 스케줄에 대한 시작, 종료 
정보와 동작주기 등을 이미 스케줄러 클래스에 다 지정해 주기 때문에 보통 서버 시작과 동시에 
호출해서 사용하게 된다.
아래와 같이 Spring boot에서는 아래와 같이 main 메소드가 있는 곳에서 서버 시작과 동시에 동작하게 구현됬다.   

```java
@SpringBootApplication
public class Application {

    @Autowired
    private ScraperScheduler scheduler; // 스케줄러 

    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}
```

#### 5. Cron Trigger 

Quartz에서 사용하는 트리거의 종류 Cron Trigger와Simple Trigger 가 있다. 
여기서는 Cron Trigger에 대해서 정리한다.   

**1) Cron 표현식(Expression)**

`Cron 표현식은 7개의 표현식으로 구성된 문자열이다. 각 단위는 공백으로 구분된다.`    
0 0 8 ? * SUN *  와 같이 표현되는데, 해당 표현식은 매주 일요일 8시를 의미한다. 요일은 SUN, MON, TUE, 
WED, THU, FRI 그리고 SAT 등으로 표현가능하지만, 숫자로도 가능하다. SUN 1 이고 SAT 이 7 이다.   

> 초 분 시 일 월 요일 연도 의 순서로 표현된다.    

**2) Always**    

`항상을 표현할 때는 와일드카드(*)로 표현한다.`   
0 0 8 ? SUN * 에서 5번째 * 표현은 매월을 의미한다. 제일 * 는 매 해를 의미한다.

**3) On**    

`특정 숫자를 입력하면 그 숫자에 맞는 값이 설정된다.`   
0 0 8 ? * SUN * 에서 제일 앞에 0은 0초를 의미한다. 만약, 0초와 30초에 Cron이 실행되도록 설정하려면 
0,30 0 8 ? * SUN * 이렇게 콤마(,)를 통해서 표현가능하다!   

**4) Between**   

`값의 범위를 나타낼 때는 하이폰 (-) 으로 표현할 수 있다.`   
월요일 부터 수요일은 MON-WED 로 표현하면 된다. 8시부터 11는 8-11 의 형태로 표현 한다.   

**5) QuestionMark**   

`물음표(?) 문자는 설정값 없음을 의미한다. 일, 요일 필드에서만 허용 된다.`   
0 0 8 ? * SUN * 에서는 매주 일요일이라는 요일 필드 값을 설정하였다. 매주 일요일이라는 가정을 
정하였기 때문에, 몇일이라는 표현은 필요 없다. 그러므로 ? 로 표현해야 한다. 매일 1일로 표현가능하며 
방금위에서 SUN 이라고 표현되었던 필드는 물음표(?)로 표시해야 한다.   

**6) /** 

슬래쉬(/) 문자는 값의 증가 표현을 의미한다.
분 필드에 0/5를 사용한다면 0분 부터 시작하여 매5분마다 를 의미한다. 이것을 콤마(,)로 표현하면 
0,5,10,15,20,25,30,35,40,45,50,55 와 같다.   



- - -
Referrence 

[https://www.leafcats.com/93](https://www.leafcats.com/93)         
[https://brunch.co.kr/@springboot/53](https://brunch.co.kr/@springboot/53)
[https://kouzie.github.io/spring/Spring-Boot-%EC%8A%A4%ED%94%84%EB%A7%81-%EB%B6%80%ED%8A%B8-Quartz/#quartz](https://kouzie.github.io/spring/Spring-Boot-%EC%8A%A4%ED%94%84%EB%A7%81-%EB%B6%80%ED%8A%B8-Quartz/#quartz)


{% highlight ruby linenos %}
{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

