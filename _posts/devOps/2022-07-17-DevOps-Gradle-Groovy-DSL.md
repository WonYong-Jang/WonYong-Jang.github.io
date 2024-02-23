---
layout: post
title: "[Gradle] Gradle task 이해와 Gradle Wrapper 사용하기(Groovy DSL)"
subtitle: "gradle wrapper / up to date / 빌드시 Plain jar 와 Executable jar"        
comments: true
categories : DevOps
date: 2022-07-17
background: '/img/posts/mac.png'
---

## 1. Gradle Wrapper란?   

Gradle 빌드에 권장되는 사용 방법은 Gradle Wrapper를 사용하는 것이다.   

Gradle에는 Wrapper라고 하는 운영체제에 맞춰서 Gradle Build를 수행하도록
하는 배치 스크립트가 있다.

`즉, Gradle Wrapper는 명시된 gradle 버전을 호출하고 명시된 버전의 gradle이 
없을 경우 자동으로 다운로드 및 설치하여 빌드해 해주는 스크립트이다.`    

> 결과적으로 수동 설치 프로세스를 수행하지 않고도 Gradle 프로젝트를 신속하게 시작할 수 있다.   

Java 프로젝트를 CI 환경에서 빌드할 때 CI 환경을 프로젝트 빌드 환경과 
매번 맞춰줄 필요가 없는 이유가 바로 Gradle Wrapper를 사용하기 때문이다.  

`환경에 종속되지 않고 프로젝트를 빌드할 수 있는데 이런 점이 Gradle이 
가진 강력한 특징중 하나이다.`   


```
// Window
$ gradlew [task]    

// Linux, OSX   
$ ./gradlew [task]   
```

`gradle build를 사용하면 로컬에 설치된 gradle과 java를 기준으로 build하고, 
    ./gradlew build를 실행하면 build.gradle파일에 정의한 내용을 
    기준으로 build되기 때문에 로컬 환경과 관계없이 프로젝트를 빌드할 수 있다.`      


Gradle 프로젝트를 생성하면 기본적으로 아래와 같은 gradle 폴더가 생기게 된다.   

```
.
├── build.gradle
├── settings.gradle
├── gradle
│   └── wrapper
│       ├── gradle-wrapper.jar
│       └── gradle-wrapper.properties
├── gradlew
└── gradlew.bat
```

Wrapper를 사용하는 프로젝트에는 위와 같은 Wrapper 파일들이 존재한다.   

##### gradle-wrapper.properties   

아래는 Wrapper 설정 파일이며, gradle, path, version, proxy 설정 등의 
정보를 저장할 수 있다.   
distributionUrl에 지정되어 있는 gradle 버전을 사용하여 빌드를 하게 된다.   

```
distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\://services.gradle.org/distributions/gradle-7.4.1-bin.zip
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
```


##### gradle-wrapper.jar   

명시된 Gradle 배포 버전을 포함하고 있는 Wrapper Jar파일이다.   

##### gradlew, gradlew.bat   

Wrapper를 빌드할 때 실행할 배치 스크립트이다.   

- - - 

## 2. Plain jar 와 Executable jar    

위에서 gradle build를 살펴봤었고, 그 결과물로 jar파일을 확인할 수 있다.   
참고로, `스프링 부트 2.5부터 gradle 빌드 시 jar파일이 2개가 생성`는데 이에 
대해서 살펴보자.    

별도의 설정을 하지 않았을 때는 아래와 같이 2개의 jar파일이 생성된다.   

```
프로젝트 이름-버전.jar
프로젝ㅌ 이름-버전-plain.jar
```

#### 2-1) Plain Archive   

plain이 붙은 jar파일을 plain archive라고 한다.   

> 여기서 archive는 jar이든 war이든 빌드 결과물을 의미한다.   

`plain archive는 어플리케이션 실행에 필요한 모든 의존성을 포함하지 않고, 
작성된 소스코드의 클래스 파일과 리소스 파일만 포함한다.`    

`이렇게 생성된 jar파일을 plain jar, standard jar, thin jar`라고 한다.   

모든 의존성이 존재하는게 아니기 때문에 plain jar는 "java -jar" 명령어로 
실행 시 에러가 발생한다.   

build.gradle 파일에 아래와 같이 설정을 추가하면 plain jar 생성을 제외한다.   

```
jar {
    enabled = false
}
```

#### 2-2) Executable Archive   

반면 plain 키워드가 없는 jar파일을 executable archive 라고 하며, 
    어플리케이션 실행에 필요한 모든 의존성을 함께 빌드한다.   

`이렇게 생성된 executable jar는 fat jar라고도 한다.`    

모든 의존성을 포함하기 때문에 java -jar 명령어를 통해 실행 가능하다.   

- - -    

## 3. Gradle task

`Gradle의 task는 Gradle 프로젝트의 작업 단위이다.`    
task는 다른 task가 먼저 선행되어야 실행되는 것과 같은 의존성을 
가지기도 하며, 실행 시 콘솔상에서 gradle {task 명} 로 실행을 하면 된다.     
`이러한 task는 groovy언어로 작성되며 Gradle 내부에 미리 만들어져 있는 내장 task들과
build.gradle 파일에 사용자가 정의한 사용자 정의 task 두 종류가 존재한다.`   

gradle task는 아래와 같이 확인 가능하다.    


``` 
$ ./gradlew tasks --all

> Task :tasks

------------------------------------------------------------
Tasks runnable from root project 'demo'
------------------------------------------------------------

Application tasks
-----------------
bootRun - Runs this project as a Spring Boot application.

Build tasks
-----------
assemble - Assembles the outputs of this project.
bootBuildImage - Builds an OCI image of the application using the output of the bootJar task
bootJar - Assembles an executable jar archive containing the main classes and their dependencies.
bootJarMainClassName - Resolves the name of the application's main class for the bootJar task.
bootRunMainClassName - Resolves the name of the application's main class for the bootRun task.
build - Assembles and tests this project.
buildDependents - Assembles and tests this project and all projects that depend on it.
buildNeeded - Assembles and tests this project and all projects it depends on.
classes - Assembles main classes.
clean - Deletes the build directory.

// ...
```   

### 3-1) task up-to-date    

task는 함수와 같이 input과 output이 있으며, input과 output을 확인함으로써 
해당 task가 최신인지를 확인한다.   

따라서 input과 output 변화가 없다면, up to date를 표기해줌으로써 
해당 태스크를 실행하지 않는다.   
`따라서, gradle build를 처음 실행했을 때보다 두번째 실행했을 때 
빌드 속도가 향상되는 것은 이 때문이다.`   

```
> Task :compileJava UP-TO-DATE
Resolving global dependency management for project 'demo'
Excluding []
Excluding []
Caching disabled for task ':compileJava' because:
  Build cache is disabled
Skipping task ':compileJava' as it is up-to-date.
:compileJava (Thread[Execution worker for ':',5,main]) completed. Took 0.524 secs.
:compileGroovy (Thread[Execution worker for ':',5,main]) started.

> Task :compileGroovy NO-SOURCE
Skipping task ':compileGroovy' as it has no source files and no previous output files.
:compileGroovy (Thread[Execution worker for ':',5,main]) completed. Took 0.0 secs.
:processResources (Thread[Execution worker for ':',5,main]) started.

> Task :processResources UP-TO-DATE
// ...
```

### 3-2) task 기본 사용법   

task를 사용하기 위해 아래와 같이 사용가능하다.   

```
task {task 명} {
    // 내용   
}

task hello {
    println "hello"
}
```

실행은 아래와 같이 task 명을 입력하여 실행하면 된다.   

```
$ ./gradlew hello

hello
```


### 3-3) 변수 사용    

build.gradle에서 변수를 사용하는 방식에 대해서 살펴보자.   

```groovy
task printTask(){
    // 시스템 환경변수를 가져와서 작업할 경우 
    println(System.getenv("REST_API_KEY"))

    // 시스템 내부에 저장된 것이 아니라, args로 넘겨주기 위한 용도로 사용된다.
    // 유저의 정보 및 api key값을 command line으로 넘길 때 사용된다.   
    println(System.getProperty("REST_API_KEY")) 

    println(project.getProperties().get("REST_API_KEY"))
}
```

### 3-4) processTestResources   

gradle wrapper를 이용하여 build를 진행하게되면, 전체 빌드 후 모든 테스트 코드를 
실행시키게 된다.    
이때, 테스트 코드를 실행할 때 전체 통합 테스트의 경우 스프링 컨테이너에 모든 빈을 
등록해 놓고 관련 빈을 주입하여 테스트를 진행하게 된다.     
이때, api key 값과 같은 args 를 주입해주어 정상적으로 통합 테스트를 진행할 수 있도록 
해주어야 한다.   

아래와 같이 -P 옵션으로 args를 전달해주고, 이를 processTestResources task에서 
전달 받아서, application.yml에 정상적으로 매핑 시켜줄 수 있다.   

```groovy
// $ ./gradlew clean build -PKAKAO_REST_API_KEY={api key 값} 명령어로 전체 테스트 및 빌드하여 jar 파일 생성
processTestResources {
	boolean hasProperty = project.hasProperty("KAKAO_REST_API_KEY")

	System.out.println("Set kakao rest api key: $hasProperty")

	filesMatching('**/application.yml') {
            expand(project.properties)
	}
}
```

expand(project.properties)만 하게되면 모든 설정 파일을 가져가게 된다.   
따라서, 필요한 설정 파일만 expand하기 위해 filesMatching로 원하는 
파일 포맷만 사용하도록 지정하였다.   

`빌드가 완료된 후 build/resources/test/application.yml 파일을 보면, 
    매핑된 값들로 채워져 있는 것을 볼 수 있다.`      

```
kakao:
  rest:
    api:
      key: 6bb0c3e199d...
```

- - - 

## 4. Gradle Plugin   

`Plugin이란 Gradle Task의 집합이다.`   

```groovy
plugins {
    id 'maven-publish'
    id 'com.github.johnrengelman.shadow' version '7.0.0'
}
```

위 두개의 plugin들을 적용시키고 아래와 같이 task를 확인해보면 
수행해서 사용할 수 있는 task의 목록을 보여준다.   

```
$ ./gradlew tasks --all

Publishing tasks
----------------
publish - Publishes all publications produced by this project.
publishToMavenLocal - Publishes all Maven publications produced by this project to the local Maven cache.

Shadow tasks
------------
knows - Do you know who knows?
shadowJar - Create a combined JAR of project and runtime dependencies
```

먼저 [maven-publish](https://docs.gradle.org/current/userguide/publishing_maven.html)의 사용 예시를 살펴보자.   
아래 코드는 maven repository에 artifact를 publish 할 수 있는 코드이다.   


```groovy
publishing {
    publications {
    }
}
```

```shell
# maven url로 publish  
$ ./gradlew publish  
# local repository에 publish   
$ ./gradlew publishToMavenLocal  

# 문제가 생기면 아래 명령어로 확인한다.   
$ ./gradlew publish --debug
$ ./gradlew publish --stacktrace
```


- - - 

**Reference**    

<https://stackoverflow.com/questions/15137271/what-does-up-to-date-in-gradle-indicate>   
<https://m.blog.naver.com/PostView.naver?isHttpsRedirect=true&blogId=sharplee7&logNo=221413629068>   
<https://goateedev.tistory.com/133>    
<https://junilhwang.github.io/TIL/Gradle/GradleWrapper/#build-gradle-%E1%84%8C%E1%85%A1%E1%86%A8%E1%84%89%E1%85%A5%E1%86%BC>    
<https://docs.gradle.org/current/userguide/publishing_maven.html>    

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

