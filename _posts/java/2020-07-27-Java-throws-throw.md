---
layout: post
title: "[Java] throws와 throw의 차이"
subtitle: "Exception을 발생시키는 throw와 throws"
comments: true
categories : Java
date: 2020-07-27
background: '/img/posts/mac.png'
---

## throws와 throw의 차이 

throws와 throw 둘 다 Exception을 발생시킨다는 것에는 차이가 없다. 하지만 둘 사이의 차이점은 아래와 같다 

#### throws 

`현재 메서드에서 자신을 호출한 상위 메서드로 Exception을 발생 시킨다.`   
즉, throws 키워드는 사용하는 메서드를 호출한 상위 메서드에서 이러한 에러 처리에 대한 책임을 맡게 되는 것이다.   

> 예외를 전가시키는 것( 예외를 자신이 처리하지 않고, 자신을 호출하는 메소드에게 책임을 전가하는 것)   


#### throw

`억지로 에러를 발생시키고자 할 때 사용되기도 하고 현재 메소드의 에러를 처리한 후에 
상위 메소드에 에러 정보를 줌으로써 상위 메서드에서도 에러가 발생한 것을 감지할 수 있다.`      
즉, throw는 개발자가 exception을 강제로 발생시켜 메서드 내에서 예외처리를 수행하는 것이다. 


- - -

##### 예제 1


<img width="845" alt="스크린샷 2020-07-27 오후 10 47 07" src="https://user-images.githubusercontent.com/26623547/88549540-6139ca00-d05b-11ea-82e8-e93a095b56a9.png">

- 실행순서

1. main의 try문에서 onAction() 메서드 호출
2. onAction()의 for문 내에서 try-catch문으로 i==6일 때 Check6Exception()을 발생(throw 사용)   
3. catch문을 통해 예외처리 및 exception 정보를 현재 메서드로 전달할 수 있다.(throw e)
4. throws 키워드를 통해 3.에서 전달한 exception 정보를 main()으로 전달하여 main()의 catch()문 수행   
5. finally() 수행 

`다시 보면 throw를 통해 발생한 exception을 catch에서 발견한 경우 더이상의 exception에 대한 정보는 존재하지 않는다. 
하지만 catch문에서 다시 throw를 통한 인위적인 exception을 발생시켰고, 이를 onAction() 메서드가 받아서 상위 메서드인 
main()으로 전달하게 된다. 따라서 catch문의 마지막에 exception을 추가로 발생시킨 경우 onAction()에 throws 키워드를 사용하지 않으면 
컴파일 에러가 발생한다.`   

- - -

**Reference**

[https://jhkim2017.wordpress.com/2017/04/24/java-throws%EC%99%80-throw%EC%9D%98-%EC%B0%A8%EC%9D%B4/](https://jhkim2017.wordpress.com/2017/04/24/java-throws%EC%99%80-throw%EC%9D%98-%EC%B0%A8%EC%9D%B4/)    

{% highlight ruby linenos %}


{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

