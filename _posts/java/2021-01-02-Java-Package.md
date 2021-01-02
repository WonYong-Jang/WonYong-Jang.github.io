---
layout: post
title: "[Java] 패키지 "
subtitle: ""
comments: true
categories : Java
date: 2021-01-02
background: '/img/posts/mac.png'
---

## 목표

자바의 패키지에 대해 학습하세요.   

## 학습할 것 

- package 키워드   
- import 키워드   
- 클래스 패스   
- CLASSPATH 환경변수   
- classpath 옵션   

- - -

## 1. Package 란 ? 

- 패키지란 클래스나 인터페이스 등을 모은 단위이다. 관련 클래스를 그룹화 하고 
포함된 클래스의 네임스페이스를 정의하는 역할을 한다.   

- 소스에 가장 첫 줄에 있어야하고, 패키지 선언은 소스 하나에 하나만 있어야 한다.   

- 모든 클래스에는 정의된 클래스 이름과 패키지 이름이 있다. `이 둘을 합쳐야 
완전하게 한 클래스를 표현한다고 할 수 있으며 FQCN(Fully Qualified Class Name) 이라고 한다.`   

```java
String a = "Class Name";
java.lang.String b = "Full Package Class Name";   
```

- - - 

## 2. import 키워드    

import 키워드는 다른 패키지에 있는 클래스나 인터페이스 등을 참조할 때 사용한다.   

##### static import 

자바 클래스에서 static 메소드는 클래스에 대한 인스턴스 생성없이 
메소드를 사용할 수 있다. static 메소드를 static import를 사용해서 
클래스명 없이 바로 사용할 수 있다.   



- - - 

## 3. 클래스 패스(Classpath)

JVM이 프로그램을 실행할 때, 클래스 파일을 찾는데 기준이 되는 파일 경로를 
말한다.   
즉, `클래스를 찾기 위한 경로`    

`java 명령을 통해 클래스 파일을 실행할 때 클래스 파일을 찾는 기준이 되는 경로를 
클래스패스라고 하며 기본적으로는 java 명령을 실행하는 위치를 의미한다.`    

Classpath를 지정하기 위한 두 가지 방법이 있다.   

- CLASSPATH 환경변수 사용  
- java runtime에 -classpath(-cp) 옵션 사용  

#### 3-1. CLASSPATH 환경변수 사용   

컴퓨터 시스템 변수 설정을 통해 지정할 수 있다.   
JVM이 시작될 때 JVM의 클래스 로더는 이 환경 변수를 호출한다. 그래서 환경 변수에 
설정되어 있는 디렉토리가 호출되면 그 디렉토리에 있는 클래스들을 먼저 
JVM에 로드한다. 

```
$  ~ java Test
Error: Could not find or load main class Test
Caused by: java.lang.ClassNotFoundException: Test
// 다른 경로에서 Test.class 를 실행 시키는 경우 위처럼 클래스를 찾지 못한다.  
```

> 아래와 같이 클래스 패스를 정의해 준다.  

```
export CLASSPATH=.:/Users/jang-won-yong/dev/workspace/Dispatch/src

$ echo $CLASSPATH
.:/Users/jang-won-yong/dev/workspace/Dispatch/src

// 콤파(.)는 현재 위치한 디렉토리부터 찾는다.   
// 구분자인 콜론(:) 을 사용해 현재 위치(.)에 찾는 파일이 없다면 다음 경로에 있는 .class 파일을 찾는다.   
// 윈도우에선 구분자로 세미콜론, 맥에선 콜론을 사용한다.   
```

```
$ ~ java Test
dynamic method dispatch call!
```


#### 3-2. java runtime 에 -classpath 옵션 사용   

java 명령 실행 시 옵션으로 클래스패스를 지정할 수 있다. 
또한, CLASSPATH 환경 변수 설정 후 실행 하였는데 -classpath 옵션이 우선순위가 높은 것을
볼 수 있다.   

> 단축 옵션인 -cp 옵션도 동일한 기능을 한다.   

```
$  ~ java -cp /Users/jang-won-yong/dev/workspace/Dispatch/src Test
dynamic method dispatch call!
```

- - - 

**Reference**    

[https://github.com/whiteship/live-study/issues/7](https://github.com/whiteship/live-study/issues/7)             

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

