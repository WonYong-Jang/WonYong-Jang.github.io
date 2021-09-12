---
layout: post
title: "[Java] 멀티쓰레드 프로그래밍 "
subtitle: "Thread 클래스, Runnable인터페이스, Main 쓰레드, 동기화, 데드락, Concurrency과 Parallelism, Thread Pool, ExecutorService"
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

Thread class, Runnable Interface 는 멀티 쓰레드를 사용할 수 있도록 
해준다.   
이 둘을 알아보기 전에 먼저 프로세스와 쓰레드에 대해 알아보자.    

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

멀티쓰레딩을 사용하면, CPU를 효율적으로 사용 할 수 있으며, 
사용자에 대한 응답성이 향상된다. 단 멀티쓰레딩으로 일어날 수 
있는 문제들(동기화, 교착상태 등)을 잘 고려하여 신중히 프로그래밍 했을 때, 이런 장점들을 
누릴 수 있다.   


쓰레드를 생성하는 방법은 크게 두 가지 방법이 있다.   

1. Runnable 인터페이스를 구현하는 방법   
2. Thread 클래스를 상속 받는 방법      

`Runnable과 Thread 모두 java.lang 패키지에 포함되어 있으며, Thread를 
상속받으면, 다른 클래스를 상속받을 수 없기 때문에 인터페이스를 구현하는 
방법이 일반적이다.`       

하지만, `Runnable은 FunctionalInterface 이므로 run()메소드 하나만 존재하기 때문에 
그 외에 메소드를 오버라이딩해서 확장할 필요가 있을 경우에는 Thread를 상속 받아서 사용 한다.`      

Runnable은 오로지 run() 메서드만 구현되어 있는 함수형 인터페이스이다.    
아래와 같은 Runnable 인터페이스를 이용하여 구현 후 사용하는 방법이 있다.   

```java
@FunctionalInterface
public interface Runnable {
    public abstract void run();
}
```

또는, 아래와 같이 Thread 클래스를 상속받아 run() 메서드를 
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

        ///// 상속받은 Thread
        ThreadByInheritance threadByInheritance = new ThreadByInheritance();



        ///// 인터페이스 구현한 Thread
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

Runnable 인터페이스의 경우 아래와 같이 인터페이스를 
구현한 익명 클래스로 표현이 가능하다.   

```java
Thread thread = new Thread(new Runnable() {
            @Override
            public void run() {
                for(int i=0; i< 500; i++) {
                    System.out.print("0");
                }     
            }
        });

// 함수형 인터페이스 람다식으로 변경 가능   
Thread thread = new Thread(() -> {
            for(int i=0; i< 500; i++) {
                System.out.print("0");
            }
        });
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
동시에 실행되는 것 같은 효과(Concurrent)를 볼 수 있다.   

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

```java
thread1.run();
thread2.run();   

// Output
00000000000...0001111111111...111
```

아래는 각각 main 메소드에서 run 메소드를 호출했을 때와 main 메소드에서 start 메소드를 
호출했을 때를 그림으로 나타낸 예제이다.    

<img width="676" alt="스크린샷 2021-01-23 오후 10 20 56" src="https://user-images.githubusercontent.com/26623547/105579384-984e2580-5dc9-11eb-9597-35c5f1b5d6bf.png">     

한가지 주의할 점은 하나의 쓰레드에 대해 start()가 한번만 호출될 수 있다. 하나의 쓰레드 객체에 대해 start() 메소드를 두 번 이상 호출
하면 실행시에 IllegalThreadStartException이 발생한다.   


호출 스택(call stack)에 있는 내용들이 모두 수행하고 나면 쓰레드는 호출스택 공간과 함께 
메모리 상에서 소멸된다.   

- - - 

## 2. 쓰레드의 상태    

멀티쓰레드 프로그래밍을 잘하기 위해서는 정교한 스케줄링을 통해 자원과 시간을 
여러 쓰레드가 낭비 없이 잘 사용하도록 해야 한다. 이를 위해서는 쓰레드의 상태와 관련 메서드를 
잘 알아야 한다.    

getState()메서드를 통해 쓰레드의 상태를 확인할 수 있다.   

#### 쓰레드의 상태    

- NEW : 쓰레드가 생성되고 아직 start()가 호출되지 않은 상태   
- RUNNABLE : 실행 중 또는 실행 가능한 상태   
- BLOCKED : 동기화 블럭에 의해서 일시정지된 상태(lock이 풀릴때 까지 기다리는 상태)   
- WAITING : 쓰레드가 대기중인 상태   
- TIMED_WAITING : 특정 시간만큼 쓰레드가 대기중인 상태   
- TERMINATED : 쓰레드의 작업이 종료된 상태   

아래 그림은 쓰레드의 생성부터 소멸까지의 모든 과정을 그린 것이다.   

<img width="731" alt="스크린샷 2021-01-26 오후 10 29 30" src="https://user-images.githubusercontent.com/26623547/105851281-33433b80-6026-11eb-8153-0b68ec421c78.png">    

1. `쓰레드를 생성하고 start()를 호출하면 바로 실행되는 것이 아니라 실행 대기열에 저장되어 자신의 차례가 
될 때까지 기다려야 한다.` (실행 대기열은 큐와 같은 자료구조로 먼저 실행 대기열에 들어온 쓰레드가 먼저 실행된다.)     

2. 자기 차례가 되면 실행 상태가 된다.   

3. 할당된 실행시간이 다되거나 yield() 메소드를 만나면 다시 실행 대기상태가 되고 다음 쓰레드가 실행상태가 된다.   

4. 실행 중에 suspend(), sleep(), wait(), join(), I/O block에 의해 일시정지 상태가 될 수 있다.   
  (I/O block은 입출력 작업에서 발생하는 지연상태를 말한다. 사용자의 입력을 받는 경우를 예로 들 수 있다.)    

5. 지정된 일시정지시간이 다되거나, notify(), resume(), interrupt()가 호출되면 일시정지상태를 벗어나 다시 
실행 대기열에 저장되어 자신의 차례를 기다리게 된다.   

6. 실행을 모두 마치거나 stop()이 호출되면 쓰레드는 소멸된다.   

아래는 Thread 에서 제공하는 메소드를 종류 중 일부이다.   

##### sleep()   

지정된 시간동안 쓰레드를 일시정지시킨다. 지정한 시간이 지나고 나면, 
    자동적으로 다시 실행대기 상태가 된다.   

##### join()     

일정 시간 동안 특정 쓰레드가 작업하는 것을 기다리게 만드는 메서드이다. sleep과 
마찬가지로 try-catch 블록으로 예외처리를 해야 한다.    

##### interrupt()    

sleep()이나 join()에 의해 일시정지 상태인 쓰레드를 깨워서 실행 대기상태로 만든다.   
해당 쓰레드에서는 InterruptedException이 발생함으로써 일시정지 상태를 
벗어나게 된다.   

##### stop()     

쓰레드를 즉시 종료시킨다.   
안전상의 이유로 deprecated되었다. 이 메소드를 사용하면 안된다.   

##### yield()   

실행 중에 자신에게 주어진 실행시간을 다른 쓰레드에게 양보하고 자신은 실행대기 상태가 된다.   



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

## 3. 쓰레드의 우선순위   

자바에서 각 쓰레드는 우선순위(priority)에 관한 자신만의 필드를 가지고 있다. 
이러한 우선순위에 따라 특정 쓰레드가 더 많은 시간 동안 작업을 할 수 있도록 
설정한다.  

```java
Thread t1 = Thread.currentThread();
System.out.println("currentThread = " + t1);

Thread t2 = new Thread(new ThreadEx_1());
System.out.println("newThread = " + t2);

// Output   
currentThread = Thread[main,5,main]
newThread = Thread[Thread-0,5,main]
```  

위의 결과의 대괄호 안에 내용을 살펴보면, 첫번째가 쓰레드 이름이고, 
    두번째는 해당 쓰레드의 우선순위, 세번째가 쓰레드가 속한 쓰레드 그룹의 
    이름이다.   

쓰레드의 우선순위를 알아보기 전에 
먼저 동시성과 병렬성을 이해해 보자.    

#### 동시성(Concurrency) or 병렬성(Parallelism)

<img width="733" alt="스크린샷 2021-09-10 오전 11 11 28" src="https://user-images.githubusercontent.com/26623547/132788032-f276edcf-fe2b-4b1f-a9a6-dbb63e49eb53.png">   

쓰레드에서 말하는 동시성에 대해서 명확하게 이해할 필요가 있는데,     
`동시성이란 코어 1개가
여러개의 쓰레드의 작업 테이블을 왔다 갔다 하면서(Context Switch) 작업을 하는 것이다.`         
`각 쓰레드들이 병렬적으로 실행되는 것처럼 보이지만 사실은 번갈아가면서 조금씩 
실행되고 있는 것이다. 즉, 동시에 실행되는 것처럼 보이는 것이다.`      

`병렬성이란 멀티 코어에서 멀티 쓰레드를 동작시켜서 각 코어들이 동시에 
실행되는 것을 말한다.`   

<img width="700" alt="스크린샷 2021-01-28 오후 7 13 50" src="https://user-images.githubusercontent.com/26623547/106123511-593f1c00-619d-11eb-8ed2-6ea50a649a16.png">   

멀티코어에서도 동시성은 사용 가능하다.   

> 아래와 같이 동시성, 병렬성 처리를 혼용해서 다중 작업 효율을 극대화 할 수도 있다.   
> 주의할 점은 어떤 작업은 이런 동시적 처리 방식 활용이 완전히 불가능 
할 수도 있다.    

<img width="774" alt="스크린샷 2021-09-10 오전 11 29 33" src="https://user-images.githubusercontent.com/26623547/132790269-3cf5eb0f-7254-441d-98f9-28e26e2a63cd.png">   
 

그럼 core1개가 쓰레드를 처리할 때 우선순위를 어떻게 지정할까?      

```java
// 10이 제일 높고 1이 제일 낮음
thread.setPriority(10);
thread2.setPriority(1);
thread.start();
thread2.start();
```

getPriority() 와 setPriority() 메소드를 통해 쓰레드의 우선순위를 반환하거나 변경 할 수 있다.   
쓰레드의 우선순위가 가질수 있는 범위는 1부터 10까지이며, 숫자가 높을 수록 우선순위 또한 
높아진다. 하지만 쓰레드의 우선순위는 비례적인 절댓값이 아닌 어디까지나 상대적인 값일 뿐이다.   
우선순위가 10인 쓰레드가 우선순위가 1인 쓰레드보다 10배 더 빨리 수행되는 것이 아니다. 단지 
우선순위가 10인 쓰레드는 우선순위가 1인 쓰레드 보다 좀 더 많이 실행 큐에 포함되어, 
    좀더 많은 작업 시간을 할당받을 뿐이다.   

위 우선 순위는 자바 스레드 스케줄링하는 방식이며, 스레드 스케줄링은 
크게 2가지 방식을 이용하게 된다.   

- 우선순위 : 우선순위가 높은 스레드가 실행 상태를 더 많이 가지도록 
스케줄링 하는 것을 말한다.   

- 순환 할당 : 순환 할당이라 함은, 각자 시간 할당량을 정해서 하나의 쓰레드를 
정해진 시간만큼 실행하고 다시 다른 쓰레드를 실행하는 것을 말하는데, 이런 
순환 할당 방식은 JVM이 정하기 때문에 코드로 제어할 수는 없다.  

- - -

## 4. Main 쓰레드   

자바는 실행 환경인 JVM에서 돌아가게 된다. 이것이 하나의 프로세스이고 자바를 실행하기 위해 
우리가 실행하는 main() 메소드가 메인 쓰레드이다.    

`메인 쓰레드는 프로그램이 시작하면 가장 먼저 실행되는 쓰레드이며, 모든 쓰레드는 
메인 쓰레드로부터 생성된다. 다른 쓰레드를 생성해서 실행하지 않으면, 메인 쓰레드가 
종료되는 순간 프로그램도 종료된다.   
하지만 여러 쓰레드를 실행하면, 메인 쓰레드가 종료되어도 다른 쓰레드가 작업을 
마칠 때까지 프로그램이 종료되지 않는다.`   

<img width="602" alt="스크린샷 2021-09-09 오전 8 32 39" src="https://user-images.githubusercontent.com/26623547/132599016-84050f04-8a54-42cd-966c-c04e83ca0807.png">   

위와 같이 main 쓰레드가 끝나도 Thread1, Thread2가 끝나야 프로세스가 종료되게 된다.   
`쓰레드는 사용자 쓰레드(user thead)와 데몬 쓰레드(daemon thread)로 구분되는데, 
    실행 중인 사용자 쓰레드가 하나도 없을 때 프로그램이 종료 된다.`    
`하지만 데몬 쓰레드 에서는 예외`다. 아래에서 살펴보자.     

<img width="657" alt="스크린샷 2021-09-10 오전 10 43 33" src="https://user-images.githubusercontent.com/26623547/132785390-c8ff01e7-5f50-4d3a-8638-68fc06ace20b.png">   

#### Daemon Thread   

- Main 쓰레드의 작업을 돕는 보조적인 역할을 하는 쓰레드이다.   

- Main 쓰레드가 종료되면 데몬 쓰레드는 강제적으로 자동 종료가 된다. (어디까지나 Main 
        쓰레드의 보조 역할을 수행하기 때문에, Main 쓰레드가 없어지면 의미가 없어지기 때문이다.)   

- 데몬 쓰레드는 일반 쓰레드와 작성방법과 실행 방법이 같다. 단 쓰레드를 생성한 다음 setDaemon(true)를 호출 하기만 하면 된다. 
또, 데몬 쓰레드가 생성한 쓰레드는 자동적으로 데몬 쓰레드가 된다.   

- 주로 가비지 컬렉터, (워드 등의)자동저장, 화면 자동갱신 등에 사용된다.   

예를 들어 보면 크롬이라는 메인 메서드가 실행 되면서, 유투브의 백그라운드 영상 재생을 
코드로 표현해 보자.   

```java
public static void main(String[] args) {
        Thread thread = new Thread(new Runnable() {
            @Override
            public void run() {
                for(int i = 0; i < 100; i++){
                    System.out.println("유튜브 영상 실행중");
                    try {
                        Thread.sleep(500);
                    } catch (InterruptedException e) {
                        e.printStackTrace();
                    }
                }
            }
        });
        thread.setDaemon(true); // 데몬 쓰레드 설정
        thread.start();
        System.out.println("데몬 쓰레드 여부 : " + thread.isDaemon()); // 데몬 쓰레드인지 사용자 쓰레드인지 확인
        System.out.println("메인 메소드 종료");
    }
// Output    
유튜브 영상 실행중
데몬 쓰레드 여부 : true
메인 메소드 종료
```

`메인메서드 종료가 되면서 유투브 영상 실행중이라는 코드 하나를 출력하고 
종료되고 만다.`    
`반면에, deamon 쓰레드 설정을 false로 하면 메인 쓰레드가 종료되어도 
사용자 쓰레드가 모두 종료된 후에 프로그램이 종료된 것을 확인 할 수 있다.`   

```java
thread.setDaemon(false); // 데몬 쓰레드 설정  

// Output
메인 메소드 종료
유튜브 영상 실행중
데몬 쓰레드 여부 : false  
유튜브 영상 실행중
유튜브 영상 실행중
유튜브 영상 실행중    x 100
```



- - - 

## 5. 동기화(Synchronize)    

`여러 개의 쓰레드가 한 개의 리소스를 사용하려고 할 때 사용 하려는 쓰레드를 
제외한 나머지들을 접근하지 못하게 막는 것이다.`        
이것을 쓰레드에 안전하다고 한다(**Thread-safe**)   

자바에서 동기화 하는 방법은 3가지로 분류 된다. 여기서는 
synchronized키워드만 알아보자.   

- Synchronized 키워드 
- Atomic 클래스 
- Volatile 키워드   

#### Synchronized 키워드   

자바의 예약어 중 하나이며, 변수명이나 클래스명으로 사용이 불가능하다.   
`동기화를 하려면 다른 쓰레드가 간섭해서는 안되는 부분을 임계영역(critical section)으로 설정해 주어야 한다. 
임계 영역 설정은 synchronized 키워드를 사용한다.`    

여기서 임계영역은 멀티 쓰레드에서 단 하나의 쓰레드만 실행 할 수 있는 코드 영역을 말한다.   


```java
// 메서드 전체를 임계영역으로 설정
public synchronized void method1 () {
    ......
}

// 특정한 영역을 임계영역으로 설정
synchronized(객체의 참조변수) {
    ......
}
```

먼저 메서드의 타입 앞에 synchronized 키워드를 붙여서 메서드 전체를 임계 영역으로 설정할 수 있다.    
쓰레드는 synchronized 키워드가 붙은 메서드가 호출된 시점부터 해당 메서드가 포함된 
객체의 lock(자물쇠)을 얻어 작업을 수행하다가 메서드가 종료되면 lock을 반환한다.     

두 번째로 메서드 내의 코드 일부를 블록으로 감싸고 블록 앞에 synchronized(참조 변수)를 붙이는 방법이 있다. 이때 
참조 변수는 락을 걸고자 하는 객체를 참조하는 것이어야 한다. 이 영역으로 들어가면서 부터 쓰레드는 
지정된 객체의 lock을 얻게 되고 블록을 벗어나면 lock을 반납한다.    


#### lock   

lock은 일종의 자물쇠 개념이다. `모든 객체는 lock을 하나씩 가지고 있다. 해당 객체의 
lock을 가지고 있는 쓰레드만 임계 영역의 코드를 수행할 수 있다. 한 객체의 lock은 
하나 밖에 없기 때문에 다른 쓰레드들은 lock을 얻을 때까지 기다리게 된다.`       

임계 영역은 멀티쓰레드 프로그램의 성능을 좌우하기 때문에 가능하면 메서드 전체에 lock을 거는 것보다 
synchronized 블록으로 임계영역을 최소화하는 것이 좋다.   

동기화하지 않아서 문제가 발생하는 경우는 아래 예제외 같다.   

```java
public class Test{

    public static void main(String[] args) {

        Runnable r = new ThreadByInterface();
        new Thread(r).start();
        new Thread(r).start();
    }
}

public class Account {

    private int balance; //  잔고

    public void withdraw(int money) {
        // 잔고가 출금액보다 클때만 출금을 실시하므로 잔고가 음수가 되는 일은 없어야함
        if(balance >= money) {

            try {
                // 문제 상황을 만들기 위해 고의로 쓰레드를 일시정지
                Thread.sleep(1000);
            } catch(InterruptedException e) {}

            balance -= money;
        }
    }

    public int getBalance() {
        return balance;
    }

    public Account(int balance) {
        this.balance = balance;
    }
}

public class ThreadByInterface implements Runnable{

    Account account = new Account(1000); // 초기 잔고 : 1000

    @Override
    public void run() {

        while(account.getBalance() > 0) {
            int money = (int) (Math.random() * 3 + 1) * 100;
            account.withdraw(money); // 100, 200, 300 랜덤 출금
            System.out.println(Thread.currentThread().getName() + "님 "+money+ " 출금됨. / balance : " + account.getBalance());
        }

    }
}
```

Output

```
Thread-0님 300 출금됨. / balance : 900
Thread-1님 100 출금됨. / balance : 900
Thread-1님 200 출금됨. / balance : 700
Thread-0님 100 출금됨. / balance : 700
Thread-0님 300 출금됨. / balance : 100
Thread-1님 300 출금됨. / balance : 100
Thread-0님 100 출금됨. / balance : 0
Thread-1님 100 출금됨. / balance : -100
```

`분명 잔고는 음수가 되지 않도록 설계했는데 음수가 나왔다. 왜냐하면 쓰레드 하나가 if문을 통과하면서 balance를 검사하고 순서를 
넘겼는데, 그 사이에 다른 쓰레드가 출금을 실시해서 실제 balance가 if문을 통과할 때 검사 했던 
balance보다 적어지게 된다.    
하지만 이미 if문을 통과했기 때문에 출금은 이루어지게 되고 음수가 나오는 것이다. 이 문제를 
해결하려면 출금하는 로직에 동기화를 해서 한 쓰레드가 출금 로직을 실행하고 있으면 다른 
쓰레드가 출금 블록에 들어오지 못하도록 막아줘야 한다.`    

아래 코드로 변경하게 되면 실행해도 음수가 나오지 않는다.   


```java
public class Account {

    private int balance; //  잔고

    public void withdraw(int money) {
        synchronized (this) { // 임계영역 설정 
        if (balance >= money) {
            try {
                // 문제 상황을 만들기 위해 고의로 쓰레드를 일시정지
                Thread.sleep(1000);
            } catch (InterruptedException e) {
            }

            balance -= money;
        }
    }
    }

    public int getBalance() {
        return balance;
    }

    public Account(int balance) {
        this.balance = balance;
    }
}
```

- - - 

## 6. 데드락(교착상태, Deadlock)   

`Deadlock(교착상태)란, 둘 이상의 쓰레드가 lock을 획득하기 위해 대기하는데, 
    이 lock을 잡고 있는 쓰레드들도 똑같이 다른 lock을 기다리면서 
    서로 block 상태에 놓이는 것을 말한다.`    
Deadlock은 다수의 쓰레드가 같은 lock을 동시에, 다른 명령에 의해 
획득하려 할 때 발생할 수 있다.   

데드락은 한 시스템 내에서 다음의 네 가지 조건이 동시에 성립할 때 발생한다. 
아래 네 가지 조건 중 하나라도 성립하지 않도록 만든다면 교착 상태를 해결할 수 있다.   

1) 상호 배제(Mutual exclusion)   

자원은 한 번에 한 프로세스(쓰레드)만이 사용할 수 있어야 한다.   

2) 점유 대기(Hold and wait)   

최소한 하나의 자원을 점유하고 있으면서 다른 프로세스에 할당되어 사용하고 있는 자원을 
추가로 점유하기 위해 대기하는 프로세스가 있어야 한다.   

3) 비선점(No preemption)   

다른 프로세스에 할당된 자원은 사용이 끝날 때까지 강제로 빼앗을 수 없어야 한다.   

4) 순환 대기 (Circular wait)      

자원을 요구하는 방향이 원을 이루면 양보를 하지 않기 때문에 교착상태가 발생한다.   


- - -   

## 7. Thread pool   

개발을 하다보면 스레드 풀에 대해서 들어본적이 있을 것이다.    
그럼 스레드풀이 왜 필요한지에 대해서 알아보자.   

위에서 예제로 다뤘던 내용 중에 문제점은 스레드를 생성하는데 
드는 비용이 많다는 것이다. 스레드 생성과 스케줄링으로 인해 
CPU가 바빠지고, 메모리 사용량이 늘어난다.   
결국에는 스레드를 생성하고 죽이는 과정 자체가 컴퓨터의 cpu 그리고 
어플리케이션 자체에 무리를 준다는 것이다. 그렇기 때문에 
이런 생각을 하게 된다.   
`스레드를 미리 생성해 놓고 각자 일을 부여시켜주면 되지 않을까?`   

그렇게 되면 아래와 같은 장점이 생기게 된다.   

- 할일보다 스레드가 부족하다고 스레드를 더 생성하지 않는다.   
- 스레드가 일이 끝난다고, 종료하는게 아니라 queue에 들어간 다른 작업을 할당 받는다.   

ExecutorService를 이용하여 예제코드를 작성해 보면 아래와 같다.   

```java
 public static void main(String[] args) throws Exception{
            ExecutorService executorService = Executors.newFixedThreadPool(4); 
              // 스레드개수 4개

            for(int i=0; i<10; i++){
                Runnable runnable = new Runnable() {
                    @Override
                    public void run() {
                        // 스레드 총 개수 및 작업 스레드 이름 출력
                        ThreadPoolExecutor threadPoolExecutor = (ThreadPoolExecutor) executorService;
                        int poolSize = threadPoolExecutor.getPoolSize();  // poolSize 총 스레드 개수
                        String threadName = Thread.currentThread().getName();
                        System.out.println("[총 스레드 개수 : " + poolSize + "] 작업 스레드 이름 : " + threadName);

                    }
                };
                executorService.submit(runnable);

                Thread.sleep(10);
            }
            executorService.shutdown();
        }

output : 
[총 스레드 개수 : 1] 작업 스레드 이름 : pool-1-thread-1
[총 스레드 개수 : 2] 작업 스레드 이름 : pool-1-thread-2
[총 스레드 개수 : 3] 작업 스레드 이름 : pool-1-thread-3
[총 스레드 개수 : 4] 작업 스레드 이름 : pool-1-thread-4
[총 스레드 개수 : 4] 작업 스레드 이름 : pool-1-thread-1
[총 스레드 개수 : 4] 작업 스레드 이름 : pool-1-thread-2
[총 스레드 개수 : 4] 작업 스레드 이름 : pool-1-thread-3
[총 스레드 개수 : 4] 작업 스레드 이름 : pool-1-thread-4
[총 스레드 개수 : 4] 작업 스레드 이름 : pool-1-thread-1
[총 스레드 개수 : 4] 작업 스레드 이름 : pool-1-thread-2
```

`실제로 스레드 개수가 4개로만 고정되어 있으며, 더이상 늘리지도 줄이지도 않는다.`      
스레드 풀을 선언하는 방법이 여러가지가 있는데, 
    앞 선 코드는 스레드의 총 개수만 설정해두었지만, 직접 
    생성자를 호출하게 되면 세부적으로 설정할 수 있다.   

```java
 // 1번 방법
ExecutorService ex = new ThreadPoolExecutor(
    3, //코어 스레드 개수
    100,// 최대 스레드 개수
    120L,// 스레드 놀고 있는 시간
    TimeUnit.SECONDS,//시간 단위
    new SynchronousQueue<>()  // 작업큐
);
 // 2번 방법
public static ExecutorService newFixedThreadPool(int nThreads) {
        return new ThreadPoolExecutor(nThreads, nThreads,
                                      0L, TimeUnit.MILLISECONDS,
                                      new LinkedBlockingQueue<Runnable>());
}
```   

`1번 방법은 여러가지를 설정해 줄 수 있지만 그와 다르게 newFixedThreadPool 메서드는 
스레드 개수와 최대 스레드 개수는 동일하며, 스레드의 대기시간은 없는 것으로 
자동 default 된다.`   


- - -

## 8. 자바 동시성 프로그래밍의 진화   

멀티 스레딩을 지원하는 API는 시간이 흐름에 따라 지속적으로 발전하였다. 
위에서 다룬 Runnable과 Thread는 멀티스레딩을 지원하기 위해 
가장 처음 만들어진 API이고 사용하기도 불편하기 때문에 지금은 거의 
사용하지 않는다.    
지금은 ExecutorService, Callable, CompletableFuture 등을 주로 사용하거나 
Stream을 내부적으로 사용가능한 parallel Stream을 주로 사용한다.   

- 처음    
    - Runnable, Thread   

- Java 5    
    - Executorservice : 스레드 실행과 태스크 제출을 분리   
    - Callable : Runnable의 발전된 형태. 제네릭 지원, 결과 리턴 가능, 예외 던지기 가능   
    - Future : 비동기 결과값을 담기위한 객체   
- Java 7   
    - java.util.concurrent.RecursiveTask 추가 : 포크/조인 구현 지원   
- Java 8  
    - CompletableFuture : Future를 조합하는 기능을 추가하면서 동시성 강화   
    - Stream : 내부적으로 병렬처리 가능  
- Java 9   
    - 리액티브 프로그래밍을 위한 API 지원 : 발행-구독 프로토콜(java.util.concurrent.Flow) 등    






- - - 

**Reference**    

<https://catch-me-java.tistory.com/47>   
<https://sujl95.tistory.com/63>   
<https://wisdom-and-record.tistory.com/48>   
<https://github.com/whiteship/live-study/issues/10>     
<https://parkadd.tistory.com/48>   

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

