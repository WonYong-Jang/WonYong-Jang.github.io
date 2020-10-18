---
layout: post
title: "[Java] Stack And Heap"
subtitle: "Java 의 Stack 과 Heap 메모리 관리"
comments: true
categories : Java
date: 2020-03-14
background: '/img/posts/spring.png'
---

# Java 의 Stack 과 Heap

- Java에서 메모리 관리는 어떻게 이루어지는지와 Stack과 Heap 영역의 역할에 대해 알아보자.   

<img width="775" alt="스크린샷 2020-10-18 오후 9 52 50" src="https://user-images.githubusercontent.com/26623547/96368028-59864f00-118c-11eb-9e5c-68beebf55a2c.png">   


### 1) Stack    
 
- `Heap 영역에 생성된 Object 타입의 데이터의 참조값이 할당된다.`    

- 원시타입(primitive types)의 데이터들이 할당됨    
    > 이때 원시타입(byte, short, int, long, double, float, boolean, char)의 데이터들의 참조값이 아닌 실제 값을 stack에 저장!  
    
- 각 Thread는 자신만의 stack을 가진다 (각 스레드에서 다른 스레드의 stack 접근 불가!!)
- Stack 영역에 있는 변수들은 visibility를 가진다.
    > 변수 scope 에 대한 개념이다. 전역변수가 아닌 지역변수가 foo() 라는 함수내에서 Stack에 할당 된 경우, 해당 지역 변수는 
    다른 함수에서 접근할수 없다.

- main() 함수 종료 되는 순간 stack 에 모든 데이터 pop

```java
public class Main {
    public static void main(String[] args) {
        int argument = 4;
        argument = someOperation(argument);
    }

    private static int someOperation(int param){
        int tmp = param * 3;
        int result = tmp / 2;
        return result;
    }
}
```

<img width="600" alt="스크린샷 2020-10-18 오후 10 09 12" src="https://user-images.githubusercontent.com/26623547/96368436-c69ae400-118e-11eb-8a2f-73c50c2a3115.png">

<img width="600" alt="스크린샷 2020-10-18 오후 10 12 33" src="https://user-images.githubusercontent.com/26623547/96368531-3315e300-118f-11eb-8860-e64d7b84f5b1.png">

함수가 종료되어 지역변수들이 모두 pop되고, 함수를 호출했던 시점으로 돌아가면 스택의 상태는 아래와 같이 변한다.   

<img width="600" alt="스크린샷 2020-10-18 오후 10 13 04" src="https://user-images.githubusercontent.com/26623547/96368536-390bc400-118f-11eb-9a4d-97ae0ea00639.png">

- - -

### 2) Heap   

- `주로 긴 생명주기를 가진 데이터( 모든 데이터 중 stack에 있는 데이터를 제외한
부분이라고 생각해도 될 정도 )`   

- 모든 Object 타입(Integer, String, ArrayList..) 은 heap영역에 생성된다.   

- 몇개의 스레드가 존대하든 상관없이 하나의 heap 영역만 존재한다.    

- Heap 영역에 있는 오브젝트들을 가르키는 레퍼런스 변수가 stack 에 올라간다.   

- - - 

#### 2-1) Heap 예제 

```java
public class Main {
    public static void main(String[] args) {
        int port = 4000;
        String host = "localhost";
    }
}
```

위의 예제를 그림으로 확인해보자.    

<img width="600" alt="스크린샷 2020-10-18 오후 10 22 57" src="https://user-images.githubusercontent.com/26623547/96368757-bdab1200-1190-11eb-94b6-bd2acc16593e.png">   

String Object를 상속받아 구현되어 있으므로 String은 heap 영역에 할당되고 Stack에 host라는 이름으로 
생성된 변수는 heap에 있는 localhost라는 스트링을 레퍼런스 하게된다. 그림으로 표현하면 아래와 같다.   

<img width="600" alt="스크린샷 2020-10-18 오후 10 24 31" src="https://user-images.githubusercontent.com/26623547/96368761-c13e9900-1190-11eb-89d3-e3538daba2e4.png">   

<p><u>Heap 영역에 있는 데이터는 함수 내부에서 파라미터로 받아서 변경하고 
함수 호출이 종료된 시점에 변경 내역이 반영되는 것을 확인!</u></p>

- - -

#### 2-2) Heap 예제 

<img width="700" alt="스크린샷 2020-03-14 오후 5 40 42" src="https://user-images.githubusercontent.com/26623547/76678423-335b6800-661b-11ea-9ba7-5160b6d9cc7e.png">
<img width="700" alt="스크린샷 2020-03-14 오후 5 41 30" src="https://user-images.githubusercontent.com/26623547/76678442-5c7bf880-661b-11ea-9e07-afe0dbf47717.png">
<img width="700" alt="스크린샷 2020-03-14 오후 5 41 49" src="https://user-images.githubusercontent.com/26623547/76678447-6d2c6e80-661b-11ea-9369-1e6f3c064cd4.png">
<img width="700" alt="스크린샷 2020-03-14 오후 5 50 46" src="https://user-images.githubusercontent.com/26623547/76678594-b03b1180-661c-11ea-92df-a3548179459a.png">
<img width="700" alt="스크린샷 2020-03-14 오후 5 51 06" src="https://user-images.githubusercontent.com/26623547/76678606-c9dc5900-661c-11ea-91bc-683bb74619d9.png">
<img width="700" alt="스크린샷 2020-03-14 오후 5 55 13" src="https://user-images.githubusercontent.com/26623547/76678708-5c7cf800-661d-11ea-9d06-4a2548b9c5b6.png">
<img width="700" alt="스크린샷 2020-03-14 오후 5 55 54" src="https://user-images.githubusercontent.com/26623547/76678712-64d53300-661d-11ea-85a2-d5279c5e1017.png">
<img width="700" alt="스크린샷 2020-03-14 오후 5 56 31" src="https://user-images.githubusercontent.com/26623547/76678716-69015080-661d-11ea-8bdb-76e3d0c57a53.png">
<img width="700" alt="스크린샷 2020-03-14 오후 5 57 17" src="https://user-images.githubusercontent.com/26623547/76678718-6c94d780-661d-11ea-9fbd-c769480ed88c.png">

<br/><br/>

- - -

**Reference**

[https://yaboong.github.io/java/2018/05/26/java-memory-management/](https://yaboong.github.io/java/2018/05/26/java-memory-management/)    


{% highlight ruby linenos %}


{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

