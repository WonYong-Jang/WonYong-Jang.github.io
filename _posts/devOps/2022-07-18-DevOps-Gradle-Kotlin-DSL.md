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

Groovy DSL 과 Kotlin DSL을 비교했을 때, 
장단점은 아래와 같다.      

- 컴파일 타임에 에러 확인   
    - Groovy 는 동적 언어인 반면 Kotlin은 정적으로 타입이 지정 되기 때문에 런타임이 아닌 
    컴파일 타임에 빌드 스크립트 오류를 확인할 수 있다.   
    
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

플러그인이란 gradle task의 집합이며, Kotlin DSL에서는 아래와 같이 사용할 수 있다.     


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
// ./gradlew [모듈 명]:[task 명]   
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
            srcDir("src/main/java")
        }
    }
}
```

추가적으로 source 디렉토리를 gradle에서 처리 및 제외하기 위해서는 
아래와 같이 sourceset 디렉토리를 추가해주면 된다.   

```kotlin
sourceSets {
    main {
        java {
            srcDir("src/main/java2")
            exclude("**/consump/**")
            exclude("**/popStay/**")
        }
    }
}
```

### 2-5) Configuration    

`Configuration은 의존성 그룹으로 이해하면 되고, dependencies를 통해 의존성 그룹에 
라이브러리를 추가해주는 개념으로 이해하면 된다.`   

아래 코드를 실행해보면 configuration 확인이 가능하다.   

```
// build.gradle
for (config in configurations) {
    println config
}
```

Output   

```
> Configure project :
configuration ':annotationProcessor'
configuration ':apiElements'
configuration ':archives'
configuration ':compileClasspath'
configuration ':compileOnly'
configuration ':default'
configuration ':implementation'
configuration ':incrementalScalaAnalysisElements'
configuration ':incrementalScalaAnalysisFormain'
configuration ':incrementalScalaAnalysisFortest'
configuration ':runtimeClasspath'
configuration ':runtimeElements'
configuration ':runtimeOnly'
configuration ':scalaCompilerPlugins'
configuration ':testAnnotationProcessor'
configuration ':testCompileClasspath'
configuration ':testCompileOnly'
configuration ':testImplementation'
configuration ':testRuntimeClasspath'
configuration ':testRuntimeOnly'
configuration ':zinc'
```

`추가적으로 configuration을 선언하기 위해서는 아래와 같이 진행한다.`      

```groovy
configurations {
    provided
}

provided scope는 배포시에는 제외되고, 컴파일시에 들어가는 의존성을 provided에 지정한다.   


sourceSets {
    main { compileClasspath += configurations.provided }
}
```


### 2-6) buildscript  

`buildscript 는 gradle로 task를 수행할 때 사용되는 설정이며, buildscript 내에 
정의된 dependencies는 task를 사용할 때 사용되는 라이브러리이며 buildscript 밖에서 정의된 dependencies는 소스를 컴파일할 때 등에 사용된다.`     

`buildscript는 소스코드 컴파일과 같은 빌드 작업을 시작하기 전에 빌드 시스템 준비 단계에서 
제일 먼저 실행된다.`    


> 보통 springboot 버전 정보, maven repository 정보, dependency 모듈을 지정하여 스프링 부트 플러그인을 
사용할 수 있는 기본 바탕을 정의한다.    

```groovy
buildscript {
    dependencies {
        classpath "org.jetbrains.kotlin:kotlin-gradle-plugin:${kotlinVersion}"
        classpath "org.jetbrains.kotlin:kotlin-allopen:${kotlinVersion}"
        classpath "org.jetbrains.kotlin:kotlin-noarg:${kotlinVersion}"
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

<img width="231" alt="스크린샷 2024-03-03 오후 1 34 56" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/e8b6b945-d629-445b-b92b-e41f7944f2d0">   

`위와 같이 폴더를 구성하고 Versions, Dependencies 등의 파일을 생성하여 
여러 모듈에서 공통으로 버전 및 함수 등을 재사용할 수 있다.`         

```kotlin
object Versions {
    const val scala = "2.12.15"
    const val spark = "3.3.0"
}
```   

위와 같이 buildSrc 폴더 내에 코틀린 파일로 선언한 버전을 
서브 모듈에서 공통으로 사용할 수 있게 된다.   

```kotlin
dependencies {
    implementation("org.apache.spark:spark-sql_2.12:${Versions.spark}")
}
```

- - - 

## 4. dependency-management Plugin   

`아래에서 io.spring.dependency-management 플러그인에 의해 Spring Boot Dependency에 있는 
버전을 자동으로 가져와서 버전에 대한 생략이 가능해 진다.`         

```kotlin
plugins {

    // 해당 플러그인을 단독으로 적용하면 프로젝트는 아무런 변화가 없다. 대신 다른 플러그인이 적용되는 시점을 감지하고 그에 따라 반응한다.
    // 예를 들면, java 플러그인이 적용되면 실행 가능한 jar 빌드 작업이 자동으로 구성된다.   
    id("org.springframework.boot") version "2.7.8"

    // Spring Boot의 플러그인이 사용중인 Spring Boot 버전에서 Spring-boot-dependency bom을 자동으로 가져온다. 
    // 즉, Maven 과 같은 종속성 관리 기능을 제공하는 Gradle 플러그인이다.
    // 이는 의존성을 추가할 때 버전을 생략할 수 있다.   
    id("io.spring.dependency-management") version "1.1.4"
    id("kotlin")
}
```

터미널에 다음과 같이 명령어를 입력하면 관리되고 있는 내용과 버전 정보를 확인할 수 있다.   

```
gradlew dependencyManagement    

global - Default dependency management for all configurations    
    antlr:antlr 2.7.7    
    ch.qos.logback:logback-access 1.2.11
    io.lettuce:lettuce-core 6.1.10.RELEASE
    ...
```

`업무에서 spring dependency management에서 제공하고 있는 라이브리러 버전이 
신규로 추가한 라이브러리 내부 모듈 버전을 덮어써서 문제가 발생하였다.`      

> lettuce version 6.3.0.RELEASE 을 사용해야 했지만, spring dependency management 에서 6.1.0.RELEASE 으로 override 하였다.   

`따라서 아래와 같이 extra properties extension을 이용하여 버전 정보를 고정하였다.`   

```kotlin
allprojects {
    ext {
        set("lettuce.version", "6.3.0.RELEASE")
    }
}
```

[Version Properties](https://docs.spring.io/spring-boot/appendix/dependency-versions/properties.html#appendix.dependency-versions.properties)를
확인하여 관리되고 있는 library와 version property를 확인할 수 있다.


- - - 

**Reference**    

<https://docs.gradle.org/current/userguide/migrating_from_groovy_to_kotlin_dsl.html#migrating_groovy_kotlin>    
<https://blog.imqa.io/kotlin-dsl/>   
<https://docs.gradle.org/current/userguide/kotlin_dsl.html>   
<https://imperceptiblethoughts.com/shadow/custom-tasks/>   
<https://docs.gradle.org/current/dsl/org.gradle.api.tasks.SourceSet.html>   
<https://olivejua-develop.tistory.com/59>   

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

