---
layout: post
title: "[Java] Annotation "
subtitle: "@retention, @target, @documented, 어노테이션 프로세서"    
comments: true
categories : Java
date: 2021-02-02
background: '/img/posts/mac.png'
---

## 목표

자바의 어노테이션에 대해 학습하세요.   

## 학습할 것 

- 어노테이션 정의하는 방법   
- @retention   
- @target   
- @documented   
- 어노테이션 프로세서   

- - -

## 1. 어노테이션    

클래스나 메소드 등의 선언시에 @를 사용하는 것을 말한다. 자바 5 부터 새롭게 추가된 요소이며, 
    어노테이션의 용도는 다양한 목적이 있지만 메타 데이터의 비중이 가장 크다.    

> 메타 데이터(meta-data) : 데이터를 위한 데이터를 의미하며, 풀어 이야기 하면 한 데이터에 
                           대한 설명을 의미하는 데이터( 자신의 정보를 담고 있는 데이터 )    

또한, 어노테이션은 주석이라는 뜻을 가지고 있다.    
기본적으로 우리가 아는 주석은 // 또는 /* */ 이렇게 생겼는데, 
어노테이션과 일반적인 주석은 뭐가 다른걸까?     

`단어의 의미인 주석과는 비슷하지만 다른 역할로써 사용되는데 메서드, 클래스 등에 의미를 
단순히 컴파일러에게 알려주기 위한 표식이 아닌 컴파일타임 이나 런타임에 해석될 수 있다.`    

- - - 

## 2. 자바 어노테이션 종류   

자바에서 기본적으로 제공하는 어노테이션 종류를 알아보자.   

#### 2-1) @Override     

선언한 메서드가 오버라이드 되었다는 것을 나타낸다. 만약 부모 클래스 또는 인터페이스에서 
해당 메서드를 찾을 수 없다면 컴파일 에러를 발생 시킨다.     

`해당 어노테이션을 생략할수는 있지만, 권장하지 않는다.`      
부모 클래스가 수정되었을때 자식클래스에서 오버라이딩 해서 사용하고 있는 메서드에도 
컴파일러가 에러를 보여준다.   
오버라이딩 어노테이션을 생략했을 경우 위험한 코드가 될 수 있다.   

#### 2-2) @Deprecated   

해당 메서드가 더 이상 사용되지 않음을 표시한다. 만약 사용할 경우 컴파일 경고를 발생 시킨다.    

#### 2-3) @SuppressWarnings   

선언한 곳의 컴파일 경고를 무시하도록 한다.    

#### 2-4) @SafeVarargs    

자바 7부터 지원하며, 제너릭 같은 가변인자의 매개변수를 사용할 때의 경고를 
무시한다.   

#### 2-5) @FuncionalInterface   

자바8부터 지원하며, 함수형 인터페이스를 지정하는 어노테이션이다.   
만약 메서드가 존재하지 않거나, 1개 이상의 메서드(default 메서드 제외)가 존재할 경우 
컴파일 오류를 발생 시킨다.    

- - - 

## 3. 메타 어노테이션의 종류   

메타 어노테이션의 종류를 알아보자   

#### 3-1) @Retention    

얼마나 오랫동안 어노테이션 정보가 유지되는지 설정할 수 있다.   

- SOURCE : 어노테이션 정보가 컴파일시 사라짐, 바이트코드에서는 존재하지 않음.   

> ex) @Override, @SuppressWarnings   

- CLASS : 클래스 파일에 존재하고 컴파일러에 의해 사용가능, 가상머신(런타임)에서는 사라짐.   

- RUNTIME : 실행시 어노테이션 정보가 가상 머신에 의해서 참조 가능. 자바 리플렉션에 의해 사용   



#### 3-2) @Target    

어노테이션이 적용할 위치를 선택한다.   

종류는 다음과 같다.   

- ElementType.PACKAGE : 패키지 선언   
- ElementType.TYPE : 타입 선언  
- ElementType.ANNOTATION_TYPE : 어노테이션 타입 선언   
- ElementType.CONSTRUCTOR : 생성자 선언   
- ElementType.FIELD : 멤버 변수 선언  
- ElementType.LOCAL_VARIABLE : 지역 변수 선언   
- ElementType.METHOD : 메서드 선언   
- ElementType.PARAMETER : 전달인자 선언   
- ElementType.TYPE_PARAMETER : 전달인자 타입 선언   
- ElementType.TYPE_USE : 타입 선언   


#### 3-3) @Documented   

해당 어노테이션을 Javadoc 에 포함시킨다.   

#### 3-4) @Inherited   

어노테이션의 상속을 가능하게 한다.   

#### 3-5) @Repeatable   

자바8 부터 지원하며, 연속적으로 어노테이션을 선언할 수 있게 해준다.   





- - - 

**Reference**    

<https://blog.naver.com/hsm622/222218251749>   
<https://wisdom-and-record.tistory.com/52>    
<https://github.com/whiteship/live-study/issues/11>      

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

