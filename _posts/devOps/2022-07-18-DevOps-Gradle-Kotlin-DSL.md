---
layout: post
title: "[Gradle] Kotlin DSL 를 이용하여 Gradle 설정하기"
subtitle: "멀티 모듈 프로젝트에서 Kotlin DSL / 특정 모듈에서 shadowJar "        
comments: true
categories : DevOps
date: 2022-07-18
background: '/img/posts/mac.png'
---

최근 구글이 Android의 새로운 빌드 언어로 Kotlin DSL을 채택했다. 
그래서 이번글에서는 Kotlin DSL에 대해 살펴보고 
여러 상황에서 사용하는 다양한 예제를 살펴보자.  



- - - 

## 1. Kotlin DSL 란?   

먼저, DSL 이란 Domain Specific Language 의 약어로 특정 분야에 
최적화된 프로그래밍 언어를 뜻한다.   

`Kotlin DSL은 코틀린의 언어적인 특징으로 가독성이 좋고 
간략한 코드를 사용하여 Gradle 스크립팅을 하는 것을 목적으로 하는 DSL 이다.`   

Kotlin DSL로 사용했을 때 장점은 아래와 같다.   

- 컴파일 타임에 에러 확인   
- 코드 탐색 및 자동 완성   
- 구문 강조   
- IDE의 지원으로 향상된 편집환경   

반면 단점도 존재한다.   

- Java8 이상부터 동작   
- 빌드 캐시가 Invalidation 되거나 클린 빌드시 Groovy DSL 보다 느리다.  
- 새로운 라이브러리 버전 Inspection 기능 미지원   


- - - 

## 2. Kotlin DSL 사용하기    

### 2-1) 플러그인   

```kotlin
plugins {
    java
    jacoco
}
```

### 2-2) settings.gradle.kts 

멀티 모듈 프로젝트를 구성할 때 아래 파일을 이용하여 구성해준다.   

```kotlin
rootProject.name = "application"
include(":service-app")
include(":service-batch")
```

위에서 ":" 는 절대 경로를 의미하며, root project에서 시작하게 된다.   
제외했을 경우 settings.gradle.kts 기준으로 상대 경로로 지정된다.    

- - - 

## 3. buildSrc 로 버전관리   

`buildSrc는 빌드 로직을 포함할 수 있는 Gradle 프로젝트 루트 디렉토리이다.`      
`buildSrc와 Kotlin DSL을 사용해서 매우 적은 구성으로 
커스텀 빌드 코드를 작성하고 전체 프로젝트에서 이 로직을 공유할 수 있다.`     

##### buildSrc/build.gradle.kts 생성

```kotlin
plugins {
    `kotlin-dsl` // kotlin dsl 설정
}

repositories {
    mavenCentral()
}

dependencies {
    
}
```

Gradle을 실행하면 buildSrc라는 디렉토리가 존재하는지 검사한다.   
존재한다면 자동으로 buildSrc/build.gradle.kts 코드를 컴파일하고 테스트한 뒤 
빌드 스크립트의 클래스 패스에 집어 넣는다.   



- - - 

**Reference**    

<https://docs.gradle.org/current/userguide/migrating_from_groovy_to_kotlin_dsl.html#migrating_groovy_kotlin>    
<https://blog.imqa.io/kotlin-dsl/>   
<https://docs.gradle.org/current/userguide/kotlin_dsl.html>   


{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

