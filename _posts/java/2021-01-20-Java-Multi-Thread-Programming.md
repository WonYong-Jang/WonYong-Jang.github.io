---
layout: post
title: "[Java] 멀티쓰레드 프로그래밍 "
subtitle: "Thread 클래스, Runnable인터페이스, Main 쓰레드, 동기화, 데드락"
comments: true
categories : Java
date: 2021-01-20
background: '/img/posts/mac.png'
---

## 목표

자바의 멀티쓰레드 프로그래밍에 대해 학습하세요.    

## 학습할 것 

- Thread 클래스와 Runnable 인터페이스   
- 쓰레드의 상태   
- 쓰레드의 우선순위    
- Main 쓰레드    
- 동기화     
- 데드락     

- - -

## 1. Thread 클래스와 Runnable 인터페이스   

먼저 프로세스와 쓰레드에 대해 알아보자   

### 1-1) Process    

우리가 사용하는 프로그램은 하나의 process이다.    
프로그램이 운영체제에 의해 메모리 공간을 할당 받아 실행 중인 것을 
말한다.     
현재 우리가 사용하는 OS들(윈도우, 리눅스, 맥OS..)은 모두 **멀티태스킹(multi-tasking)**을 지원한다. 이는 여러 개의 프로세스를 
동시에 실행할 수 있다는 것이다. 내가 음악을 들으면서 인텔리제이를 실행할 수 있는 것은 모두 OS가 
멀티태스킹을 지원하기 때문이다.   
`프로세스는 프로그램에 사용되는 데이터와 메모리 등의 자원(resources) 그리고 쓰레드로 구성이 된다.`      

### 1-2) Thread   

경량 프로세스라고 불리며 가장 작은 실행 단위이다.      
`프로세스 내에서 resources를 이용하여 실제로 작업을 수행하는 주체를 의미한다.`        
모든 프로세스에는 1개 이상의 쓰레드가 존재하여 작업을 수행한다. 자바 프로그램을 
시작할 때 사용하는 main 메서드 또한 쓰레드이다.   
`두개 이상의 쓰레드를 가지는 프로세스를 멀티 쓰레드 프로세스라고 한다.`    
우리가 카카오톡으로 상대가 전송한 파일을 다운로드 하면서 동시에 채팅을 할 수 있는 것은 
해당 프로그램이 멀티쓰레드로 작성되어 있기 때문이다.   

멀티쓰레딩을 사용하면, CPU의 사용률이 향샹되고, 자원을 보다 효율적으로 사용할 수 있으며, 
사용자에 대한 응답성이 향상되고, 작업이 분리되어 코드가 간결해진다. 단 멀티쓰레딩으로 일어날 수 
있는 문제들(동기화, 교착상태 등)을 잘 고려하여 신중히 프로그래밍 했을 때, 이런 장점들을 
누릴 수 있다.   


쓰레드를 생성하는 방법은 크게 두 가지 방법이 있다.   

1. Runnable 인터페이스를 구현하는 방법   
2. Thread 클래스를 상속 받는 방법      

`Runnable과 Thread 모두 java.lang 패키지에 포함되어 있으며, Thread를 
상속받으면, 다른 클래스를 상속받을 수 없기 때문에 인터페이스를 구현하는 
방법이 일반적이다.   

하지만, Runnable은 FunctionalInterface 이므로 run()메소드 하나만 존재하기 때문에 
그 외에 메소드를 오버라이딩해서 확장할 필요가 있을 경우에는 Thread를 상속 받아서 사용 한다.`      

Runnable은 오로지 run() 메서드만 구현되어 있는 함수형 인터페이스이다.    

```java
@FunctionalInterface
public interface Runnable {
    public abstract void run();
}
```

아래는 Thread 클래스 이며, 이 클래스를 상속받아 run() 메서드를 
오버라이딩해 수행할 작업을 작성할 수 있다.   

```java
public class Thread implements Runnable {
    // (생략)   
@Override
    public void run() {
        if (target != null) {
            target.run();
        }
    }
    // (생략)   
```

`쓰레드를 구현한다는 것은 위 둘 중 어떤 방법이든 하나 선택해서, run 메서드의 
몸통을 채우는 것, 즉 실행할 코드를 적는다는 것이다.`   

아래 예제는 두 가지 방법을 이용해서 쓰레드를 구현하고 동작시키는 예제이다.   

```java
public class Test {

    public static void main(String[] args) {

        // 상속받은 Thread
        ThreadByInheritance threadByInheritance = new ThreadByInheritance();

        // 인터페이스 구현한 Thread
        Runnable r = new ThreadByInterface();
        Thread threadByInterface = new Thread(r); // 생성자 : Thread(Runnable target)
        // 아래로 축약 가능
        //Thread threadByInterface = new Thread(new ThreadByInterface());

        threadByInheritance.start();
        threadByInterface.start();
    }
}

public class ThreadByInheritance extends Thread{
    @Override
    public void run() {
        for(int i=0; i< 500; i++) {
            System.out.print("0");
        }
    }
}

public class ThreadByInterface implements Runnable{
    @Override
    public void run() {
        for(int i=0; i< 500; i++) {
            System.out.print("1");
        }
    }
}
```

Output   

```
11111111111111111111100001000001111111111111000010000000000000000000000111100000111
00101111111111111000000000000000000000001111111100000000000000000000000000000011111
1111111111111110000111111111111111...
```   

Runnable을 구현한 경우에는 Runnable 인터페이스를 구현한 클래스의 인스턴스를 생성한 후, 
Thread 객체의 생성자로 해당 인스턴스를 넘겨주면 된다.   

Thread클래스를 상속받아 구현한 경우에는 해당 객체를 생성하고 start()를 실행하면 된다.

`두 쓰레드 결과를 보면 0과 1이 뒤섞여 있는 것을 학인할 수 있다. 각 쓰레드가 
번갈아가면서 수행된 것이다.`   

쓰레드는 OS의 스케줄링에 따라 작업 시간을 할당 받고 다른 쓰레드와 번갈아가면서 
작업을 수행한다. 아주 빠른속도로 작업을 번갈아가면서 수행하기 때문에 마치 
동시에 실행되는 것 같은 효과를 볼 수 있다.   

##### run() 과 start() 메소드 차이점   

쓰레드를 실행 시킬 때 thread.start() 와 같이 run()이 아닌 start()를 호출했다는게 
의문이 든다.    
start() 메소드는 새로운 쓰레드가 작업을 실행하는데 필요한 호출스택(공간)을 새로 생성한 다음 
run()을 호출해서 그 안(스택)에 run()이 저장되는 것이다.   
`즉, 쓰레드를 사용하기 위해 start()를 실행시키는 순간 쓰레드만의 독립적인 작업 공간인 
호출스택(call stack)이 만들어지는 것이다. 그 후에 호출 스택안에 각 실행하고자 하는 예를 들면 run()과 
같은 메소드들이 저장되는 것이다.`  

그러나, run()으로 쓰레드를 실행시킨다면 ?    

run()을 호출하는 것은 원래 main()의 호출스택(call stack)을 하나만 이용하는 것이다.   
즉, 새로운 쓰레드를 이용하는 것이 아닌 main 쓰레드의 호출 스택을 그대로 이용하는 것이다. 멀티 쓰레딩이 
아닌 하나의 쓰레드를 사용하는 것과 같다.    

아래는 각각 main 메소드에서 run 메소드를 호출했을 때와 main 메소드에서 start 메소드를 
호출했을 때를 그림으로 나타낸 예제이다.    

<img width="676" alt="스크린샷 2021-01-23 오후 10 20 56" src="https://user-images.githubusercontent.com/26623547/105579384-984e2580-5dc9-11eb-9597-35c5f1b5d6bf.png">     

한가지 주의할 점은 하나의 쓰레드에 대해 start()가 한번만 호출될 수 있다. 하나의 쓰레드 객체에 대해 start() 메소드를 두 번 이상 호출
하면 실행시에 IllegalThreadStartException이 발생한다.   

```java
public class Test {
    public static void main(String[] args) {
        Runnable r = new 
    }
}
```


호출 스택(call stack)에 있는 내용들이 모두 수행하고 나면 쓰레드는 호출스택 공간과 함께 
메모리 상에서 소멸된다.   

- - - 

## 2. 쓰레드의 상태    

멀티쓰레드 프로그래밍을 잘하기 위해서는 정교한 스케줄링을 통해 자원과 시간을 
여러 쓰레드가 낭비 없이 잘 사용하도록 해야 한다. 이를 위해서는 쓰레드의 상태와 관련 메서드를 
잘 알아야 한다.    

#### 쓰레드의 상태    

- NEW : 쓰레드가 생성되고 아직 start()가 호출되지 않은 상태   
- RUNNABLE : 실행 중 또는 실행 가능한 상태   
- BLOCKED : 동기화 블럭에 의해서 일시정지된 상태(lock이 풀릴때 까지 기다리는 상태)   
- WAITING, TIMED_WAITING : 쓰레드의 작업이 종료되지는 않았지만 실행가능하지 않은(unrunnable) 일시정지 상태    
- TIMED_WAITING : 일시정지시간이 지정된 경우를 의미   
- TERMINATED : 쓰레드의 작업이 종료된 상태   

아래 그림은 쓰레드의 생성부터 소멸까지의 모든 과정을 그린 것이다.   

<img width="731" alt="스크린샷 2021-01-26 오후 10 29 30" src="https://user-images.githubusercontent.com/26623547/105851281-33433b80-6026-11eb-8153-0b68ec421c78.png">    

1. 쓰레드를 생성하고 start()를 호출하면 바로 실행되는 것이 아니라 실행 대기열에 저장되어 자신의 차례가 
될 때까지 기다려야 한다. (실행 대기열은 큐와 같은 자료구조로 먼저 실행 대기열에 들어온 쓰레드가 먼저 실행된다.)   

2. 자기 차례가 되면 실행 상태가 된다.   

3. 할당된 실행시간이 다되거나 yield() 메소드를 만나면 다시 실행 대기상태가 되고 다음 쓰레드가 실행상태가 된다.   

4. 실행 중에 suspend(), sleep(), wati(), join(), I/O block에 의해 일시정지 상태가 될 수 있다.   
  (I/O block은 입출력 작업에서 발생하는 지연상태를 말한다. 사용자의 입력을 받는 경우를 예로 들 수 있다.)    

5. 지정된 일시정지시간이 다되거나, notify(), resume(), interrupt()가 호출되면 일시정지상태를 벗어나 다시 
실행 대기열에 저장되어 자신의 차례를 기다리게 된다.   

6. 실행을 모두 마치거나 stop()이 호출되면 쓰레드는 소멸된다.   



#### I/O Blocking   

`사용자가 입력을 받을 때는 사용자 입력이 들어오기 전까지 해당 쓰레드가 일시정지 상태가 된다. 
이를 I/O Blocking이라고 한다.`   

한 쓰레드 내에서 사용자 입력을 받는 작업과 이와 관련 없는 작업 두 가지 코드를 
작성하면, 사용자 입력을 기다리는 동안 다른 작업 또한 중지되기 때문에 CPU의 
사용 효율이 떨어진다.   

이 경우 사용자 입력을 받는 쓰레드와, 이와 관련 없는 다른 작업을 하는 쓰레드를 
분리해주면 더욱 효율적으로 CPU를 사용할 수 있다.   

**Single Thread의 경우**

<img width="798" alt="스크린샷 2021-01-23 오후 7 28 59" src="https://user-images.githubusercontent.com/26623547/105575825-d5a6b900-5db1-11eb-8dcd-e38288a74ada.png">   

Output

```
input : abc
10
9
8
7
6
5
4
3
2
1
```

위 처럼 input을 모두 받은 후에 카운트 다운이 시작된다.      


**Multi Thread의 경우**    

```java
public class Test {

    public static void main(String[] args) {

        Thread thread = new Thread(new ThreadByInterface());
        thread.start();

        String input = JOptionPane.showInputDialog("input : ");
        System.out.println("input : "+ input);

    }
}


public class ThreadByInterface implements Runnable{
    @Override
    public void run() {

        for(int i = 10; i > 0; i--) {
            System.out.println(i);

            try {
                Thread.sleep(1000);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
    }
}
```

Output   

```
10
9
8
7
6
5
4
input : abc
3
2
1
```

카운트 다운을 실행하는 쓰레드를 먼저 실행했기 때문에 메인 쓰레드에서 사용자 입력을 받더라도, 
    카운트 다운 작업이 계속 가능하다.   

- - - 

## 2. 쓰레드의 상태   

- - -

## 3. 쓰레드의 우선순위   



- - -

## 4. Main 쓰레드   

자바는 실행 환경인 JVM에서 돌아가게 된다. 이것이 하나의 프로세스이고 자바를 실행하기 위해 
우리가 실행하는 main() 메소드가 메인 쓰레드이다.    

`메인 쓰레드는 프로그램이 시작하면 가장 먼저 실행되는 쓰레드이며, 모든 쓰레드는 
메인 쓰레드로부터 생성된다. 다른 쓰레드를 생성해서 실행하지 않으면, 메인 쓰레드가 
종료되는 순간 프로그램도 종료된다.   
하지만 여러 쓰레드를 실행하면, 메인 쓰레드가 종료되어도 다른 쓰레드가 작업을 
마칠 때까지 프로그램이 종료되지 않는다.`   

#### Daemon Thread   

- Main 쓰레드의 작업을 돕는 보조적인 역할을 하는 쓰레드이다.   

- Main 쓰레드가 종료되면 데몬 쓰레드는 강제적으로 자동 종료가 된다. (어디까지나 Main 
        쓰레드의 보조 역할을 수행하기 때문에, Main 쓰레드가 없어지면 의미가 없어지기 때문이다.)   

##### Daemon Thread 를 만든 이유 ?   


- - - 

## 5. 동기화(Synchronize)    

`여러 개의 쓰레드가 한 개의 리소스를 사용하려고 할 때 사용 하려는 쓰레드를 
제외한 나머지들을 접근하지 못하게 막는 것이다.`        
이것을 쓰레드에 안전하다고 한다(**Thread-safe**)   

자바에서 동기화 하는 방법은 3가지로 분류 된다.   

- Synchronized 키워드 
- Atomic 클래스 
- Volatile 키워드   

#### 5-1) Synchronized 키워드   

자바의 예약어 중 하나이며, 변수명이나 클래스명으로 사용이 불가능하다.   


- - - 

**Reference**    

<https://sujl95.tistory.com/63>   
<https://wisdom-and-record.tistory.com/48>   
<https://github.com/whiteship/live-study/issues/10>     
<https://parkadd.tistory.com/48>   

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

