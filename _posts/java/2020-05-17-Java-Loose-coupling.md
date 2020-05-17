---
layout: post
title: "[Java] Loose coupling을 위한 방법"
subtitle: "다형성와 디자인 패턴(Factory 패턴)를 이용하여 결합도 낮추기"
comments: true
categories : Java
date: 2020-05-17
background: '/img/posts/mac.png'
---

## 결합도(Coupling)이 높은 프로그램

`결합도란 하나의 클래스가 다른 클래스와 얼마나 많이 연결되어 있는지를 나타내는 표현이다.`   
스프링 DI가 결합도를 낮추기 위한 기법중 하나이며, 프로그램 수정을 할때 클래스를 100개 수정하는 시스템 보다 1개 수정하는 
시스템이 결합도가 낮다고 할수 있다.    
결합도가 높은 프로그램은 유지보수가 어렵다.    

- - -

### 실습 

> 아래와 같이 Sumsung, Lg TV class 가 각각 존재 하며, TVUser class 유저가 존재할 때,
> TV를 교체할때 전체 수정을 해야 하는 문제점 존재 !

<img width="450" alt="스크린샷 2020-05-17 오후 5 12 04" src="https://user-images.githubusercontent.com/26623547/82139278-aa9eb980-9861-11ea-8f8f-f1601861e94c.png">


<img width="450" alt="스크린샷 2020-05-17 오후 5 12 21" src="https://user-images.githubusercontent.com/26623547/82139290-b5594e80-9861-11ea-92a3-1d2388b9e286.png">


<img width="500" alt="스크린샷 2020-05-17 오후 5 12 29" src="https://user-images.githubusercontent.com/26623547/82139294-b8543f00-9861-11ea-99b1-905f6c08504c.png">

<br>

#### 1. 다형성 이용하기

`객체지향 언어의 핵심 개념인 다형성을 이용하여 coupling을 낮춰보자`   

아래와 같이 TVUser클래스는 TV 인터페이스 타입의 변수로 SamsungTV 객체를 참조하고 있다.


<img width="800" alt="스크린샷 2020-05-17 오후 5 37 22" src="https://user-images.githubusercontent.com/26623547/82139751-23ebdb80-9865-11ea-961d-aab3dc38e02e.png">
<img width="768" alt="스크린샷 2020-05-17 오후 5 41 36" src="https://user-images.githubusercontent.com/26623547/82139830-b55b4d80-9865-11ea-9afa-c1a19a55de60.png">
<br><br>   
    
#### 2. 디자인 패턴 이용하기 (Factory 패턴)

앞에서 다형성을 이용한 방법은 메소드를 호출할 때 인터페이스를 이용함으로써 
좀 더 쉽게 TV를 교체할수 있지만 **이 방법 역시 TV를 변경하고자 할 때, TV 클래스 
객체를 생성하는 소스를 수정해야만 한다.**

TV를 교체할 때, 클라이언트 소스를 수정하지 않고 TV를 교체할 수 있다면 유지보수는 더욱 편해질 것이다.    

`Factory 패턴은 클라이언트에서 사용할 객체 생성을 캡슐화하여 TVUser와 TV사이를 느슨한 결합 상태로 만들어 준다.`

> Factory 메소드 패턴은 객체 생성을 대신 수행해 주는 공장 ! 

<img width="400" alt="스크린샷 2020-05-17 오후 5 57 35" src="https://user-images.githubusercontent.com/26623547/82140085-33205880-9868-11ea-9906-b15288b84db4.png">


<img width="400" alt="스크린샷 2020-05-17 오후 5 59 11" src="https://user-images.githubusercontent.com/26623547/82140087-361b4900-9868-11ea-8d3c-758471ca3862.png">

`위의 소스는 프로그램을 실행할 때 Arguments 통해서 받을 배열0번째 인자에 삼성 또는 LG 문자를 전달 해주고 
BeanFactory 클래스에서 매개 변수로 받은 beanName에 해당하는 객체를 대신 생성하여 리턴해 준다.`

> TVUser 클래스에서 마우스 오른쪽 버튼을 클릭하고 Run As -> Run Configurations -> Arguments 탭에 lg 혹은 samsung 입력하고 Run


<img width="600" alt="스크린샷 2020-05-17 오후 6 17 00" src="https://user-images.githubusercontent.com/26623547/82140600-e5f1b600-986a-11ea-8555-bb11c6c307fe.png">

**클라이언트에 해당하는 TVUser는 자신이 필요한 객체를 직접 생성하지 않는다. TVUser는 단지 객체가 필요하다는 것을 BeanFactory에 요청했을 뿐이고, 
    BeanFactory가 클라이언트가 사용할 TV객체를 적절하게 생성해서 넘겨줌으로써 소스 수정을 하지 않는다!**

- - -

**Reference**

[https://backback.tistory.com/72](https://backback.tistory.com/72)

{% highlight ruby linenos %}


{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

