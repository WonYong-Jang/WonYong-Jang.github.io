---
layout: post
title: "[Gradle] Kotlin DSL 를 이용하여 Gradle 설정하기"
subtitle: "멀티 모듈 프로젝트에서 Kotlin DSL / project, allprojects, subprojects / 특정 모듈에서 shadowJar "        
comments: true
categories : DevOps
date: 2022-07-18
background: '/img/posts/mac.png'
---

이번글에서는 멀티 모듈 프로젝트에서 Kotlin DSL 를 사용하는 방법을 살펴보자.   
또한, gradle에서 shadowJar를 이용하여 특정 모듈에서 jar 파일을 
생성하는 방법을 알아보자.   

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

`멀티 모듈 프로젝트를 구성할 때 아래와 같이 settings.gradle.kts 파일을 이용하여 
여러 모듈을 구성해준다.`      

<img width="315" alt="스크린샷 2024-02-24 오후 3 21 19" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/c35e8dd4-d012-4fd1-b24e-6a90b3600ce3">   


```kotlin
rootProject.name = "sparkShadow" // 루트 프로젝트 명   
include(":service-app") // 서브 프로젝트 선언   
include(":service-batch")
```

위에서 ":" 는 절대 경로를 의미하며, root project에서 시작하게 된다.      
제외했을 경우 settings.gradle.kts 기준으로 상대 경로로 지정된다.     

서브프로젝트 gradle build를 실행할 때는 아래와 같이 실행한다.   

```
$ ./gradlew :service-batch:build   
```

### 2-3) allprojects, subprojects, project   

멀티 모듈 프로젝트를 만들다 보면, 모든 모듈에 dependencies나 
task들이 적용되어야 하는 경우가 있다.   
이를 위해 프로젝트 수준의 build.gradle에서 모듈 수준의 build.gradle을 
제어해야 할 경우가 생긴다.   

`gradle에서는 allprojects, subprojects, project 메서드를 
제공 한다.`    

##### allprojects    

`프로젝트 수준의 build.gradle 뿐만 아니라 해당 프로젝트에 포함된 모든 모듈의 build.gradle을 제어 한다.`   

예를 들면 모든 프로젝트에 printProjectName이라는 task를 넣고 싶은 경우 프로젝트 

```kotlin
// 모든 프로젝트에 적용되어야 하는 부분
allprojects{
    group = "com.service"
    version = "0.0.1-SNAPSHOT"

    // task 생성
    task("printProjectName") {
        println("sparkShadow")
    }

    tasks.withType<Test> {
        useJUnitPlatform()
    }
}
```

##### subprojects      

`해당 프로젝트에 포함된 모든 모듈의 build.gradle을 제어 한다.`      
`즉, 프로젝트 수준의 build.gradle을 제외한 모든 모듈(서브 모듈)의 build.gradle을 제어한다.`       



##### project   

`특정 모듈만 제어하고 싶다면 project 를 사용하면 된다.`   
하지만 외부에서 제어하는 것보다 해당 모듈의 build.gradle에 직접 제어하는 것이 권장된다.   
외부에서 제어하는 것이 많아지면 모듈간 독립성이 보장되지 않기 때문이다.   


### 2-4) SourceSet   

`gradle build를 통해 빌드를 하게 되면 default로 프로젝트 하위의 src/main/java 
디렉토리의 파일이 target이 되어 빌드 된다.`    

아래 형태가 기본으로 제공되는 형태이다.   

> java plugin에 sourceSets이 등록되어 있고, main이라는 
entry name이 default로 등록되어 있다.   

```kotlin
sourceSets {
    main {
        java {
            srcDir 'src/main/java'
        }
    }
}
```

추가적으로 source 디렉토리를 gradle에서 처리 및 제외하기 위해서는 
아래와 같이 sourceset 디렉토리를 추가해주면 된다.   

```kotlin
`sourceSets {
    main {
        java {
            srcDir 'src/main/java2'
            exclude '**/consump/**'
            exclude '**/popStay/**'
        }
    }
}
```

- - - 

## 3. buildSrc 로 버전관리      

`buildSrc는 빌드 로직을 포함할 수 있는 gradle 루트 디렉토리이며, 
    gradle 단계에서 반드시 실행되고 먼저 컴파일 된다.`   

gradle은 루트 프로젝트에 위치한 buildSrc 디렉토리를 발견하면 
해당 디렉토리를 자동으로 컴파일하고 서브 프로젝트 빌드 스크립트 ClassPath에 
추가한다.   

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
<https://imperceptiblethoughts.com/shadow/custom-tasks/>   
<https://docs.gradle.org/current/dsl/org.gradle.api.tasks.SourceSet.html>   

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

