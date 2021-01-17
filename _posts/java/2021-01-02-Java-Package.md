---
layout: post
title: "[Java] 패키지 "
subtitle: "package, 필트 인 패키지 , import, FQCN, 계층 구조인 클래스로더"
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

#### 빌트 인 패키지(Built-in Package)   

자바는 개발자들이 사용할 수 있도록 많은 패키지 및 클래스를 제공한다.     

<img width="300" alt="스크린샷 2021-01-03 오후 10 42 56" src="https://user-images.githubusercontent.com/26623547/103480031-2a8b8b00-4e15-11eb-9895-af87acc3460a.png">   

패키지 중 java.lang은 자주 사용하는 패키지이지만 
한번도 import하여 사용한적이 없다.    
`즉, 자바에서 java.lang 패키지는 아주 기본적인 것들이기 때문에 import로 불러오지 
않아도 자바가 알아서 java.lang의 클래스를 불러온다.`   

그외에도 아래와 같은 패키지를 제공한다.   

- java.io  
- java.util  
- java.applet  
- java.awt  
- java.net  

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

JVM은 프로그램을 실행할 때 Class Loader가 .class 파일들을 메모리에 적재시켜 주는 
역할을 한다. `클래스패스를 통해 클래스 로더에게 어떤 클래스파일들을 
메모리에 적재시킬지 알려주는 것이다.`        

#### 3가지 클래스 로더와 3가지 원칙   

<img width="401" alt="스크린샷 2021-01-03 오후 9 26 09" src="https://user-images.githubusercontent.com/26623547/103478499-869ce200-4e0a-11eb-8ec4-3bcb896c1292.png">   

자바의 클래스 로더는 계층 구조이며, 3가지의 서로 다른 클래스로더로 구성되어 있다.   

##### Bootstrap Class loader   

기본 클래스로더 중 최상위 클래스 로더로써, 
rt.jar에 있는 JVM을 실행시키기 위한 핵심 클래스들을 로딩한다.    
String 클래스나, Object 클래스를 사용할 수 있었던 이유가 바로, 
BootStrap Class loader 가 자동으로 메모리에 적재해 주기 때문이다.   

> java 9 부터는 rt.jar, tools.jar 등 기본적으로 제공되던 jar 파일이 없어지고 
그 안에 있던 내용들은 모듈 시스템에 맞게 lib 폴더 안에 저장된다.

##### Extension Class loader   

Bootstrap Class loader의 자식클래스로써, 
jre/lib/ext 폴더나 java.ext.dirs 환경 변수로 지정된 폴더에 있는 클래스 파일을 로딩한다.   

> 자바 9 부터는 Platform Class loader로 이름 변경   

##### System Class loader   

$CLASSPATH에 설정된 경로를 탐색하여 그곳에 있는 클래스들을 로딩하는 역할을 한다. 
개발자가 작성한 .class 파일을 로딩한다.  


#### 클래스로더 동작

자바 클래스 로더는 3가지 원칙에 의해 동작한다.   

1) 위임 원칙(Delegation) :  클래스로딩 작업을 상위 클래스 로더에 위임한다.      

- 3가지 기본 클래스로더의 윗 방향으로 클래스 로딩을 위임하는 것을 말한다.      

- 어떠한 클래스를 로딩할때 System Class loader에서 부터 시작해서 자신이 
직접 로딩하지 않고 Bootstrap Class loader까지 위임한 후 차례로 내려 오면서 찾으면 반환하고 
없으면 자식 클래스 로더로 이동하여 찾는다.    

- 모두 찾지 못하면 ClassNotFoundException이 발생한다.   

2) 가시 범위 원칙(Visibility) : 하위 클래스로더는 상위 클래스로더가 로딩한 클래스를 볼 수 있지만, 
    상위 클래스 로더는 하위 클래스로더가 로딩한 클래스를 볼 수 없다.    

만약 개발자가 만든 클래스를 로딩하는 System Class loader가 Bootstrap Class loader에 의해 로딩된 
String.class를 볼 수 없다면 애플리케이션은 String.class를 사용할 수 없을 것이다. 
따라서 하위에서는 상위를 볼 수 있어야 애플리케이션이 제대로 동작할 수 있다.   

3) 유일성 원칙(Uniqueness) : 하위 클래스로더는 상위 클래스로더가 로딩한 클래스를 다시 로딩하지 않게 해서 
로딩된 클래스의 유일성을 보장한다.   


- - - 

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
$~ java Test
dynamic method dispatch call!
```

하지만, 환경변수를 사용하게 되면 운영체제를 변경하면 클래스 패스가 사라지기 때문에 
이식성면에서 불리할 수 있다.   

> 최근에는 운영체제 상의 환경변수로 클래스패스를 설정하는 것은 지양하고 
IDE나 빌드도구를 통해서 클래스패스를 설정한다.   




#### 3-2. java runtime 에 -classpath 옵션 사용   

java 명령 또는 javac 명령 실행 시 옵션으로 클래스패스를 지정할 수 있다. 
또한, CLASSPATH 환경 변수 설정 후 실행 하였는데 -classpath 옵션이 우선순위가 높은 것을
볼 수 있다.   

> 단축 옵션인 -cp 옵션도 동일한 기능을 한다.   

> classpath 옵션은 java, javac 모두 사용 가능하다!   

```
$~ java -cp /Users/jang-won-yong/dev/workspace/Dispatch/src Test
dynamic method dispatch call!
```

- - - 

**Reference**    

[https://homoefficio.github.io/2018/10/13/Java-%ED%81%B4%EB%9E%98%EC%8A%A4%EB%A1%9C%EB%8D%94-%ED%9B%91%EC%96%B4%EB%B3%B4%EA%B8%B0/](https://homoefficio.github.io/2018/10/13/Java-%ED%81%B4%EB%9E%98%EC%8A%A4%EB%A1%9C%EB%8D%94-%ED%9B%91%EC%96%B4%EB%B3%B4%EA%B8%B0/)      
[https://github.com/whiteship/live-study/issues/7](https://github.com/whiteship/live-study/issues/7)             

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

