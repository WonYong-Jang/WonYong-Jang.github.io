---
layout: post
title: "[Jekyll] robots.txt 소개와 작성법"
subtitle: "크롤링하기전 주의사항"
comments: true
categories : Jekyll
date: 2020-05-25
background: '/img/posts/mac.png'
---

## robots.txt   

`robots.txt 파일이란 웹 크롤러와 같은 로봇들의 행동을 관리 하는 것을 말한다. 우리느 이 로봇들을 관리해서 
원하는 페이지를 노출이 되게 혹은 노출이 안되도록 다룰 수 있다.    
파일은 항상 사이트의 최상위인 Root(/)에 위치해야 하며 https://wonyong-jang.github.io/robots.txt 을 호출 했을때 
파일 내용이 보여져야 한다!`

```
- User-agent:웹사이트 관리자가 어떤 종류의 로봇이 크롤링을 하는지 알수 있게 돕는다.   

- Disallow: 어떤 웹 페이지 URL을 크롤링 하지 않아야 하는지 알려준다.   

- Allow: 모든 검색엔진이 이 명령을 인식하지는 않지만 특정 웹페이지나 디렉토리에 접근하라는 명령이다.   

- Crawl-delay:다음방문까지의 디레이(초) / 서버를 과도하게 사용하지 못하도록 대기하라는 명령   

```

- - -

### robots.txt 규칙 예제 

- 네이버 검색로봇만 수집 허용한다. 

```
User-agent: Yeti
Allow: /
```

- 모든 검색엔진의 로봇에 대하여 수집 허용한다.  

```
User-agent: *
Allow: /
```


- 사이트의 루트 페이지만 수집 허용으로 설정한다.  

```
User-agent: *
Disallow: /
Allow: /$
```

- 관리자 페이지, 개인 정보 페이지와 같이 검색로봇 방문을 허용하면 안 되는 웹 페이지는 
수집 비허용으로 설정하면된다. 아래 예제는 네이버 검색 로봇에게 /prvate로 시작하는 모든 페이지 수집하면 
안된다고 알려준다.   

```
User-agent: Yeti
Disallow: /private*/
```

- - -

### 주의 사항    

robots.txt파일에 있는 정보를 통해 크롤링을 할수 있는 크롤러 또는 봇과 특정 
URL을 크롤링 해도 되는지 확인이 가능하다. 위에서 언급했듯이 disallow한 URL에 
대해서 크롤링한 정보를 다른 용도로 사용하다가 법적 처벌을 받을 수 있으니 
조심해서 크롤링 해야 한다.   




- - -

{% highlight ruby linenos %}
{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}







