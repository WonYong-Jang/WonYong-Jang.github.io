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
간혹 주기적으로 매일, 매주, 매월 등ㄹ 주기적으로 특정한 프로그램을 실행할 필요가 있다. 이 작업은 
운영체제의 기능을 이용해서 작업할 수도 있지만, 스프링과 Quartz 라이브러리를 이용하면 간단히 처리 
할수 있다.`    

아래는 spring boot 기준으로 기본 설정 방법이다.   


##### 1. pom.xml에 Dependency 설정 

```
compile group: 'org.quartz-scheduler', name: 'quartz'
compile group: 'org.quartz-scheduler', name: 'quartz-jobs'
```

##### 2. Job 코드 작성

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

quartz.Job 인터페이스를 implements하여 구현하게 된다.
해당 인터페이스의 execute 메소드를 작성하여 한다. 위에서는 테스트를 위해서 sout를 출력해본다.   

##### 3. 스케줄러 코드 작성

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

        //job 지정
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

- quartz.SchedulerFactory를 선언한 후, quartz.Scheduler를 .getScheduler() 메소드를 통해 지정해준다. 그 뒤, 
    해당 스케줄러를 .start() 해주는 것으로 스케줄러를 시작하겠다는 명령을 내리게 된다.   

- `이제 아까 작성한 job을 지정해 줄 차례다. identity는 해당 job을 구분하는 고유 명을 지정해주면 된다. 간혹 같은 job로직이라도 서로 다른 
스케줄로 동작하게 할 경우가 있기 때문에 각각의 job은 고유한 identity를 가져야 한다.`   

- `그 후 trigger를 작성한다. trigger는 TriggerBuilder 클래스를 사용해 구현하게 되는데, 스케줄러를 
수행할 스케줄 정보를 담고 있다. 이때, Cron 문법을 사용해 스케줄을 지정하는 방법이 주로 사용된다. 주석 친 
부분 처럼 startAt이나 endAt을 사용해 스케줄을 시작할 시간, 종료 일시를 지정해 줄 수도 있다. 위 코드에서 
넣어준 cron인 15 * * * * ? 는 매 분 15초에 동작하라는 의미이다.`

- 마지막으로 스케줄에 job과 trigger를 연결해 주면 끝난다. 물론 job과 trigger를 여러 개 만들어 각각 
scheduler에 지정해 주면 여러 개의 job 스케줄이 동시에 작동하게 된다.   


##### 4. 스케줄러 실행 

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



- - -
Referrence 

[https://www.leafcats.com/93](https://www.leafcats.com/93)         


{% highlight ruby linenos %}
{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

