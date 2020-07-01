---
layout: post
title: "[Java] 동적 크롤링을 위한 셀레니움"
subtitle: ""
comments: true
categories : Java
date: 2020-07-01
background: '/img/posts/mac.png'
---

# 셀레니움


- - -

## WebDriver를 사용하여 크롤링하기 

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

**Reference**

[https://wkdtjsgur100.github.io/selenium-xpath/](https://wkdtjsgur100.github.io/selenium-xpath/)

{% highlight ruby linenos %}


{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

