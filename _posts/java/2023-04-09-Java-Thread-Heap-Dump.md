---
layout: post
title: "[Java] Thread dump 분석하기"
subtitle: "스레드 상태, jstack 및 분석 툴 이용 / 덤프 파일을 이용하여 데드락 및 성능 분석"       
comments: true
categories : Java
date: 2023-04-09
background: '/img/posts/mac.png'
---

장애가 발생했을 때나 기대보다 웹 어플리케이션이 느리게 동작할 때, 
    우리는 스레드 덤프를 분석해 봐야 한다.   
이 글에서는 스레드 덤프를 획득하는 방법 부터 어떻게 스레드 덤프를 
분석해야 하는지 살펴볼 것이다.     

기본적인 스레드 관련 개념은 [링크](https://wonyong-jang.github.io/java/2021/01/20/Java-Multi-Thread-Programming.html)에서 
확인하자.   

- - - 

## 1. Thread dump 란    

웹 서버에서는 동시 사용자를 처리하기 위해 많은 수의 스레드를 사용한다.   
두 개 이상의 스레드가 같은 자원을 이용할 때는 필연적으로 스레드 간의 경합이 
발생하고 경우에 따라서는 데드락(Deadlock)이 발생할 수도 있다.  

스레드는 다른 스레드와 동시에 실행할 수 있다. 여러 스레드가 공유 자원을 
사용할 때 정합성을 보장하려면 스레드 동기화로 한 번에 하나의 
스레드만 공유 자원에 접근할 수 있게 해야 한다.   
`Java에서는 Monitor를 이용해 스레드를 동기화 하며, 
    모든 Java 객체는 하나의 Monitor를 가지고 있다.`      
`그리고 Monitor는 하나의 스레드만 소유할 수 있고 어떠한 스레드가 
소유한 Monitor를 다른 스레드가 획득하려면 해당 Monitor를 소유하고 있는 스레드가 
Monitor를 해제할 때까지 Wait Queue에서 대기하고 있어야 한다.`       

> 경합이란 어떤 스레드가 다른 스레드가 획득하고 있는 락(lock)이 해제되기를 
기다리는 상태를 말한다.   

스레드 경합 때문에 다양한 문제가 발생할 수 있으며, 이런 문제를 
분석하기 위해서는 스레드 덤프를 이용한다.   

`Thread dump란 프로세스에 속한 모든 thread들의 상태를 기록한 것이며, 
       발생된 문제들을 진단, 분석하고 jvm 성능 최적화하는데 필요한 
       정보를 보여준다.`   

Thread dump를 분석하려면 스레드의 상태를 알아야 한다. 스레드의 상태는 
java.lang.Thread 클래스 내부에 State 이름을 가진 enum으로 선언되어 있다.   

<img width="565" alt="스크린샷 2023-04-09 오후 2 35 40" src="https://user-images.githubusercontent.com/26623547/230756309-d15dcea1-51d7-4f48-8db4-5a206007c5e7.png">    

- NEW: 스레드가 생성되었지만 아직 실행되지 않은 상태   

- RUNNABLE: 현재 CPU를 점유하고 작업을 수행 중인 상태이며 운영체제의 자원 분배로 인해 WAITING 상태가 될 수도 있다.    

- BLOCKED: Monitor를 획득하기 위해 다른 스레드가 락을 해제하기를 기다리는 상태   

- WAITING: wait() 메서드, join() 메서드, park() 메서드 등을 이용해 대기하고 있는 상태   

- TIMED_WAITING: WAITING과 같지만, 정해진 시간만 대기   

- TERMINATED: 종료 상태   

- - - 

## 2. Thread dump 분석    

`가장 간단하게 Thread dump 를 할 수 있는 방법은 jstack 이라는 도구를 
사용할 수 있다.`  

`Thread dump는 획득할 당시의 스레드 상태만 알 수 있기 때문에 스레드 상태 변화를 
확인하려면 5초 정도의 간격으로 5~10회 정도 획득하는 것이 좋다.`      

> jstack은 JAVA_HOME/bin 디렉토리에 위치하고 있다.   

jstack을 사용하기 위해서는 먼저 프로세스의 pid를 확인해야 하며, jps로 확인 할 수 있다.   

```
// pid 획득   
$ jps -v     
// 아래와 같이 획득도 가능하다  
$ ps -ef | grep java


// 획득한 pid를 이용하여 treadump.txt로 덤프 내용 저장  
// -l 옵션을 주면 잠금 세부 사항도 확인할 수 있다.   
$ jstack -l [PID] > threadump.txt   
```

획득한 스레드 덤프에는 아래와 같은 정보들이 있다.  

<img width="700" alt="스크린샷 2023-04-09 오후 3 05 52" src="https://user-images.githubusercontent.com/26623547/230757382-10e0da25-d77a-477b-b4d7-3b821e2677ce.png">   

- Thread Name   
    - 스레드 이름이며, 이름을 변경하여 사용하는 경우 스레드 덤프에도 반영된다. 
    일반적으로 스레드 덤프를 해석하기 쉽게 의미 있는 이름으로 설정하는 것이 좋다.   

- ID
    - JVM 내 각 스레드에 할당된 고유 ID이다.  

- Thread Priority   
    - Java 스레드의 우선순위이다.   

- OS Thread Priority   
    - 자바의 스레드는 운영체제(OS)의 스레드와 매핑이 되는데, 매핑된 운영체제 스레드의 
    우선순위이다.   

- Java Level Thread ID   
    - JVM 내부(JNI 코드)에서 관리하는 Native Thread 구조체의 포인터 주소이다.   

- Native Thread ID   
    - 자바 스레드에 매핑된 OS 스레드의 ID이다.  
    - Window에서는 OS Level의 스레드 ID이며, Linux에서는 LWP(Light Weight Process)의 ID를 의미한다.   

- Thread State   
    - 스레드의 상태이다.  

- Last Known Java Stack Pointer   
    - 스레드의 현재 Stack Pointer(SP)의 주소를 의미한다.   

- Call Stack   
    - 현재 스레드가 수행되는 함수들의 호출 관계(콜 스택)를 표현한다.   


- - -

## 3. Thread dump 분석 툴   

Thread dump를 모두 로그로만 분석하기에는 어려움이 있기 때문에 
별도의 분석 툴을 이용하는 것이 좋다.   

간단하게 분석할 수 있는 방법은 [https://fastthread.io/](https://fastthread.io/)와 
같이 온라인으로 분석하는 것이다.   

위 사이트에 dump 파일을 업로드 하여 시각화 및 다양한 방법으로 분석을 
확인할 수 있다.   

<img width="1342" alt="스크린샷 2023-04-09 오후 3 59 46" src="https://user-images.githubusercontent.com/26623547/230759174-ec431081-035e-45cd-9b9b-2808e29d34e0.png">   


- - - 

## 4. 데드락 확인 및 분석   

데드락 상황을 재현하기 위해 아래와 같이 예제를 작성한다.   

```java
public class Main {
    public static void main(String[] args) {

        final String resource1 = "ratan jaiswal";
        final String resource2 = "vimal jaiswal";
        // t1 tries to lock resource1 then resource2
        Thread t1 = new Thread(() -> {
            synchronized (resource1) {
                System.out.println("Thread 1: locked resource 1");

                try {
                    Thread.sleep(100);
                } catch (Exception e) {
                }

                synchronized (resource2) {
                    System.out.println("Thread 1: locked resource 2");
                }
            }
        });

        // t2 tries to lock resource2 then resource1
        Thread t2 = new Thread(() -> {
            synchronized (resource2) {
                System.out.println("Thread 2: locked resource 2");

                try {
                    Thread.sleep(100);
                } catch (Exception e) {
                }

                synchronized (resource1) {
                    System.out.println("Thread 2: locked resource 1");
                }
            }
        });


        t1.start();
        t2.start();
    }
}
```

위 코드를 실행 후 dump 파일을 생성하고 분석해보면 아래와 같이 확인 가능하다.   

<img width="1000" alt="스크린샷 2023-04-09 오후 3 59 46" src="https://user-images.githubusercontent.com/26623547/230759666-160763fc-f7bc-4fed-abc4-a64b54b9e9ea.png">  

<img width="1000" alt="스크린샷 2023-04-09 오후 4 13 55" src="https://user-images.githubusercontent.com/26623547/230759742-faf4f3c9-9acc-4770-8215-60ea56430ee9.png">    

<img width="1000" alt="스크린샷 2023-04-09 오후 4 14 16" src="https://user-images.githubusercontent.com/26623547/230759672-a06ce1f3-ec2f-45aa-8d0d-3b787ad2f259.png">  

분석 결과에서 BLOCKED 상태의 스레드가 2개인 것에 집중해보자.   

`자세히 살펴보면, Thread-0은 e9100 락이 풀리기를 기다리고 있고, e9100이 끝나면 
90c8 을 실행할 것이다.`      

`Thread-1은 90c8 락이 풀리기를 기다리고 있고 90c8이 끝나면, e9100을 실행할 것이다.`       

즉, 두 개의 쓰레드에서 각자 작업을 완료하기 위해서 상대의 작업이 끝나기를 
서로 기다리는 상황이다.   



- - - 

## 글 마무리 

이번 글에서는 쓰레드 덤프 분석에 대해서 살펴봤다.   
업무를 하면서, 어플리케이션에서 문제가 발생하였을 때 로그만으로는 
어느 부분에서 어떤 문제가 발생하는지 확인이 어려운 경우가 있다.   
이때 덤프 분석을 통해 어느 부분에서 문제가 발생하고 있는지 
간단하게 확인할 수 있는 경우가 있기 때문에 덤프 분석에 대한 이해와 방법은 
반드시 필요하다고 생각 한다.   

또한, Thread dump 는 당시의 스레드의 스냅샷이므로 문제가 발생하였을 때 
덤프 파일을 획득하지 않으면 의미가 없다.  
현재 운영 중인 어플리케이션에서 Thread Busy가 짧게 피크를 치는 경우가 있다.    
짧게 Thread Busy가 튀기 때문에 덤프 파일 획득에 어려움이 있는데, 
    스크립트 등을 이용하여 정해진 임계치를 초과하면 자동으로 덤프파일을 
    생성해주는 방법도 고려해 볼 예정이다.   


- - - 

**Reference**   

<https://d2.naver.com/helloworld/10963>   
<https://sup2is.github.io/2020/10/29/thread-dump-and-heap-dump.html>   
<https://fastthread.io/>    

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}
