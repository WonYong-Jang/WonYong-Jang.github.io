---
layout: post
title: "[Java] 동적 웹 크롤링을 위한 셀레니움 1"
subtitle: "대용량 Web Scraping 하기 위한 준비(Headless) "
comments: true
categories : Java
date: 2020-07-01
background: '/img/posts/mac.png'
---

# 셀레니움

셀레니움이란 가상의 브라우저를 띄워서 이를 활용하여 테스트 자동화 및 크롤링 할수 있는 툴이다. WebDriver를 사용해서 
브라우저에서의 동작을 컨트롤 할수 있어 정적 Jsoup같은 정적 WebParsing으로 한계가 있을 때 사용된다.   


`Selenium 은 아래 그림과 같이 좌측 부터 Selenium Client Libary, JSON Wire Protocol, 
Browser Driver, Browser 총 4가지로 구성된다. Selenium을 사용하면 실제 브라우저를 
애플리케이션 코드 레벨에서 자유롭게 핸들링 할수 있게 되어 자동화된 테스팅 또는 
Web Scraping이 가능해 진다.`   

<img width="700" alt="스크린샷 2020-07-02 오후 8 48 30" src="https://user-images.githubusercontent.com/26623547/86355701-1029f680-bca6-11ea-9122-a16ae11c7cd2.png">   

아래는 Firefox Driver 사용하여 크롤링한 예이다.    

```java
WebDriver driver = new FirefoxDriver();
driver.get("https://www.google.com");
System.out.println(driver.getPageSource());
```

1. Selenium Client Libary는 Browser Driver에게 실제 Brower(Firefox)의 실행 명령을 한다.   

2. 이후 Selenium Client Libary는 Local Server로 떠 있는 Brower Driver에게 보낼 명령을 다음처럼 
JSON Wire Protocol 기반의 URL로 변환 후 전송한다.     ex) http://localhost:56081/{"url":"https://www.google.com"}   

3. 명령을 수신한 Browser Driver는 Selenium Script를 이요하여 실제 Browser에게 
최종 명령을 전달한다.  

4. 최종 명령을 전달 받은 Browser는 www.google.com 을 요청한 후 랜더링된 페이지 결과를 
Browser Driver를 통해 다시 Selenium Client Library에 전달 한다.   

5. 전달된 결과는 Selenium Client Library를 통해 코드 레벨에서 사용이 가능하다.   

- - -

### WebDriver를 사용하여 크롤링하기 

다양한 웹 드라이버가 존재하지만 Firefox와 Chrome을 많이 사용하므로 사용방법은 아래와 같다.   

- Firefox + gekodriver 구성  

```
https://www.mozilla.org/ko/firefox/new/   ==> Firefox 설치 
https://github.com/mozilla/geckodriver/releases  ==>  gekodriver 설치 후 아래와 같이 셋팅 

public void before() {
    System.setProperty("webdriver.gecko.driver", "{project-root}/drivers/geckodriver");
}
```

- ChromeDriver 구성 

```
// 크롬 버전을 확인후 아래에서 버전에 맞게 Driver 설치한다.   
https://sites.google.com/a/chromium.org/chromedriver/downloads
```


- - -

### 셀레니움 크롤링 키워드   

By 키워드로 사용할수 있는 항목은 아래와 같다.   

##### ID

```ruby
webElement.findElement(By.id("id"));
```

##### 클래스 이름

```ruby
webElement.findElement(By.ClassName("name"));

```
##### 태그 이름 

```ruby

<iframe src="..."></iframe>

webElement.FindElement(By.tagName("iframe"));

```

##### 이름   

```ruby

<input name = "cheese" type="text" />

webElement.findElement(By.name("name"));


```

##### 링크 텍스트 

```ruby

<a href="http://..">cheese</a>

webElement.findElement(By.linkText("cheese"));

```

##### 부분 링크 텍스트 

```ruby
<a href="http://..">search for cheese</a>

webElement.findElement(By.partialLinkText("cheese"));
```

##### CSS 선택자 

```ruby
<div id="food" class="dairy">milk</span>

webElement.findElement(By.cssSelector("#food.dairy")); //# is used to indicate id and . is used for classname.
```

##### XPATH 이용한 크롤링

`XPath는 XML 경로 표현식을 사용하여 웹 페이지의 요소를 찾는 구문 또는 언어이다. 즉, HTML DOM 구조를 
사용하여 웹 페이지에서 요소의 위치를 찾는데 사용된다.`       



```
/ : 절대경로를 나타냄(root node 부터 시작)   
// : 현재 Node로부터 문서상의 모든 Node 검색   
@ : 현재 노드의 속성 선택 
. : 현재 노드 선택    
.. : 현재 노드의 부모 노드 선택   
* : 매칭 되는 모든 노드 선택  
@* : 매칭되는 모든 속성 Node
//div[@name] : name 속성값을 가지는 div element들을 가져온다.    
//div[@*] : 속성값을 가지는 모든 div element들을 가져온다.    
//div|//p : 문서상의 모든 div 와 p elemente들을 가져온다.   
//@href : href속성이 있는 모든 태그 선택   
//a[@href='http://google.com'] : a 태그의 href 속성에 http://google.com 속성값을 가진 모든 태그 선택   
(//a)[3] : 문서의 세 번째 링크 선택
(//table)[last()] : 문서의 마지막 테이블 선택
(//a)[position() < 3] : 문서의 처음 두 링크 선택 
//table/tr/* 모든 테이블에서 모든 자식 tr 태그 선택   

```
- - - 

### 크롤러 개발 시 유의사항   

`개발함에 있어 크롤러에서는 다양한 Exception 처리 및 효율적인 알고리즘을 개발할 필요가 있다. 셀리니움을 이용하여 
대부분 사이트를 크롤링 할 수 있지만 메모리 및 CPU 사용량이 높기 때문이다.`

##### 일부 게시글마다 다르게 보여지는 CSS 위치   

똑같은 사이트의 게시판에 업로드된 이미지, url 을 가르키는 css 선택자가 
다를 수 있기 때문에 이런 경우는 만약 A 케이스가 안될 경우 B 케이스로 해바롸 라는 
Exception 처리를 잘 해두는 것이 좋다.   



- - -

**Reference**

[https://wkdtjsgur100.github.io/selenium-xpath/](https://wkdtjsgur100.github.io/selenium-xpath/)    
[https://www.popit.kr/web-scraping-by-selenium/](https://www.popit.kr/web-scraping-by-selenium/)

{% highlight ruby linenos %}


{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

