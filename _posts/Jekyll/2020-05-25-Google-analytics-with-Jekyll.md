---
layout: post
title: "[Jekyll] Github page와 google analytics 연동"
subtitle: "google analytics를 이용하여 방문자 및 웹 분석"
comments: true
categories : Jekyll
date: 2020-05-25
background: '/img/posts/03.jpg'
---

## Google analytics 연동하기 

`보통 블로그는 방문자 통계 기능을 제공하지만, github page는 제공하지 않기 때문에 
google analytics를 연동하여 통계를 확인 할 수 있다.`      

먼저 [google analytics 사이트](https://analytics.google.com/)에 접속하여 가입신청을 한다.

<img width="800" alt="스크린샷 2020-05-25 오후 9 14 44" src="https://user-images.githubusercontent.com/26623547/82813594-51253300-9ed0-11ea-8a50-03b16e3ae08a.png">   
<br>


- 아래와 같이 계정을 생성한다.   
<img width="800" alt="스크린샷 2020-05-25 오후 9 17 36" src="https://user-images.githubusercontent.com/26623547/82813639-64d09980-9ed0-11ea-9182-c4d86d4157f6.png">   
<br>

- 아래와 같이 약관에 동의한다.   
<img width="800" alt="스크린샷 2020-05-25 오후 9 19 26" src="https://user-images.githubusercontent.com/26623547/82813650-6c903e00-9ed0-11ea-8a1c-b31b1177f819.png">   
<br>

- 가입 완료 후 관리 항목 > 추적정보 > 추적 코드로 들어간다.   
- config.yml 파일에 추적 코드를 추가한다.  
ex) google_analytics:   UA-xxxx    

- 추적코드를 추가 및 git push 한 후 블로그 접속하게 되면 아래와 같이 확인이 가능하다.

<br>
<img width="800" alt="스크린샷 2020-05-25 오후 9 29 24" src="https://user-images.githubusercontent.com/26623547/82813662-72861f00-9ed0-11ea-9951-42105eb5fad6.png">   


- - -

{% highlight ruby linenos %}
{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}







