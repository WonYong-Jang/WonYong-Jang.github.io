---
layout: post
title: "[Gradle] Gradle task 이해와 Gradle Wrapper 사용하기"
subtitle: "gradle wrapper /  up to date"    
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

## 2. Gradle task

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

### 2-1) task up-to-date    

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

### 2-2) task 기본 사용법   

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


- - - 

**Reference**    

<https://stackoverflow.com/questions/15137271/what-does-up-to-date-in-gradle-indicate>   
<https://m.blog.naver.com/PostView.naver?isHttpsRedirect=true&blogId=sharplee7&logNo=221413629068>   
<https://goateedev.tistory.com/133>    
<https://junilhwang.github.io/TIL/Gradle/GradleWrapper/#build-gradle-%E1%84%8C%E1%85%A1%E1%86%A8%E1%84%89%E1%85%A5%E1%86%BC>    

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

