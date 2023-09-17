---
layout: post
title: "[Spark] How to override a spark dependency in cluster mode(AWS EMR) "   
subtitle: "라이브러리 버전 충돌이 발생할 때 shadowJar를 사용하여 package relocate"    
comments: true
categories : Spark
date: 2021-07-08
background: '/img/posts/mac.png'
---

Amazon EMR에서 실행되는 Spark 개발을 진행하면서 로컬에서는 정상적으로 나왔던 결과값이 
실제 클러스터로 배포를 했을 때 문제가 되었던 부분을 공유하고자 한다.   

아래와 같이 Example이라는 클래스를 이용하여 deserialize를 할때만 
필드 맵핑이 적용되도록 JsonAlias 어노테이션을 사용했었다.    

```scala
import com.fasterxml.jackson.annotation.JsonAlias

case class Example
(
  @JsonAlias(Array("example_id"))
  id: String
)
```

json 필드 중에 example_id 가 deserialize를 했을 때 Example 클래스의 
id와 맵핑이 정상적으로 되는 것을 확인하고 
실제 클러스터에도 배포를 진행 했다.   

하지만 실제 클러스터에서 결과값은 null로 리턴되면서 정상적으로 맵핑이 되지 않았다.   

jsonAlias 어노테이션은 jackson 2.9부터 제공되었고, 
spark 프로젝트 gradle에서 사용중인 jackson 버전은 2.9 보다 상위 버전을 
사용해서 문제될게 없었다. 

[stackoverflow](https://stackoverflow.com/questions/38495683/what-is-the-solution-for-spark-cluster-libs-version-is-lower-than-my-projects-d)를 
참고하여 도움을 받았고 같은 문제임을 확인했다.     

`Spark UI에서 system classpath를 확인해보니 jackson 2.6 버전을 
제공하고 있었고 2.9버전보다 하위 버전을 사용하기 때문에 
문제가 되는 것을 확인했다.`        

gradle에서 [shadowJar](https://imperceptiblethoughts.com/shadow/) 플러그인을 사용하고 있었기 때문에 
gradle에서 작성한 라이브러리 버전이 모두 override 될 것이라고 
알고 있었지만, 위의 경우처럼 spark 클러스터내에서 classpath로 제공되어 
버전이 충돌되는 경우는 해결되지 않는 것 같다.   

> 참고로 maven의 경우는 shadowJar 대신에 shade 플러그인이 제공된다.   

shadowJar 플러그인에서 relocate 기능을 사용하여 해결하였으며, 
          먼저 shadowJar에 대해서 살펴보자.   

- - -    

## shadowJar의 relocate 사용하기


[shadowJar](https://imperceptiblethoughts.com/shadow/)은 
그래들 플러그인이며 주요 목적은 2가지이다.   

`첫번째는 실행 가능한 통일된 하나의 jar 파일을 만든다는 점과 
2번째는 각 서브 프로젝트에서 중복되는 의존성 버전을 하나로 
통일할 수 있다는 점이다.`    

싱글 프로젝트가 아닌 멀티 모듈 프로젝트에서 shadow jar는 유용하다.   
아래와 같이 A 프로젝트는 B,C 프로젝트를 의존한다고 해보자.   

```
// A setting.gradle 
rootProject.name = 'A'

include 'B'
include 'C'
```

위와 같이 A 의 build.gradle이 작성되어 있으면 build가 실행될 때 
의존하고 있는 B와 C의 build가 실행된다.   
그 결과 만들어진 B와 C의 jar파일들이 A가 build를 돌 때 포함이 된다.   
실제로 A의 jar를 압축해제하면 B와 C가 jar로 들어가 있다.    

이 때 발생하고 있는 문제점은 A, B, C이 모두 사용하는 의존성의 
버전이 다를 수 있다.    

`즉, shadowJar는 B와 C의 jar를 압축해제하여 A, B, C의 통일된 
하나의 Jar를 만든다.`      
`이 과정에서 shadowJar는 동일한 의존성의 버전을 통일하는 작업을 한다.`   


```
plugins {
   id 'java'
   id 'com.github.johnrengelman.shadow' version "2.0.1"
}

dependencies {
    implementation 'com.fasterxml.jackson.core:jackson-core:2.9.4'
    implementation 'com.fasterxml.jackson.core:jackson-databind:2.9.4'
}

shadowJar {
    // shading these two packages as they clash with spark executor env
    // Relocating a Package   
    relocate 'com.fasterxml.jackson', 'shadow.com.fasterxml.jackson'
    zip64 = true
}
```   

위와 같이 기존에 사용하던 shadowJar 플러그인에 [relocate](https://imperceptiblethoughts.com/shadow/configuration/relocation/)를 추가하였다.   
문제가 되었던 com.fasterxml.jackson 패키지를 shadow.com.fasterxml.jackson 패키지로 
relocate 하였다.   

공식문서에서는 아래와 같이 설명하고 있다.   

`Shadow is capable of scanning a project's classes and 
relocating specific dependencies to a new location.`          
`This is often required when one of the dependencies is susceptible to 
breaking changes in versions or to classpath pollution in a downstream project.`        

`Shadow uses the ASM library to modify class byte code to replace 
the package name and any import statements for a class.`      

새로운 패키지로 relocate 한다는 의미는 
버전 충돌을 피하기 위해 문제가 되는 패키지를 모두 
새 패키지로 이동하여 우리가 원하는 버전을 적용시킴을 의미한다.   

아래와 같이 shadowJar로 패키징하여 변화된 패키지를 확인해보자.   

```
$ ./gradlew clean build shadowJar
```

빌드를 하면 
build/libs에 2개 파일이 생성된다.  

- xxx-version.jar : 원래 내 프로젝트   
- xxx-version-all.jar : 라이브러리가 포함된 프로젝트   

생성된 xxx-version-all.jar 파일을 열어보면 
모든 라이브러리가 함께 들어 있는 것을 
볼 수 있다.      

다음과 같은 com.fasterxml.jackson 패지키에 포함된 파일을 확인 할 수 있다.   

```
$ jar -tf build/libs/shadowJarTest-1.0-SNAPSHOT-all.jar | grep com.fasterxml.jackson
shadow/com/fasterxml/jackson/
shadow/com/fasterxml/jackson/databind/
shadow/com/fasterxml/jackson/databind/AbstractTypeResolver.class
shadow/com/fasterxml/jackson/databind/AnnotationIntrospector$ReferenceProperty$Type.class
shadow/com/fasterxml/jackson/databind/AnnotationIntrospector$ReferenceProperty.class
shadow/com/fasterxml/jackson/databind/AnnotationIntrospector.class
shadow/com/fasterxml/jackson/databind/BeanDescription.class
shadow/com/fasterxml/jackson/databind/BeanProperty$Bogus.class
shadow/com/fasterxml/jackson/databind/BeanProperty$Std.class
shadow/com/fasterxml/jackson/databind/BeanProperty.class
shadow/com/fasterxml/jackson/databind/DatabindContext.class
shadow/com/fasterxml/jackson/core/
shadow/com/fasterxml/jackson/core/Base64Variant.class
shadow/com/fasterxml/jackson/core/Base64Variants.class
shadow/com/fasterxml/jackson/core/FormatFeature.class
shadow/com/fasterxml/jackson/core/FormatSchema.class
shadow/com/fasterxml/jackson/annotation/
shadow/com/fasterxml/jackson/annotation/JacksonAnnotation.class
shadow/com/fasterxml/jackson/annotation/JacksonAnnotationValue.class
shadow/com/fasterxml/jackson/annotation/JacksonAnnotationsInside.class
shadow/com/fasterxml/jackson/annotation/JacksonInject$Value.class
shadow/com/fasterxml/jackson/annotation/JacksonInject.class
...
```

위와 같이 com.fasterxml.jackson을 가진 모든 클래스들이 shadow.com.fasterxml.jackson으로 
relocate되었기 때문에 dependency 충돌을 해결할 수 있다.   


- - - 

**Reference**     

<https://hadoopsters.com/2019/05/08/how-to-override-a-spark-dependency-in-client-or-cluster-mode/>    
<https://blog.leocat.kr/notes/2017/10/11/gradle-shadowjar-make-fat-jar>    
<https://stackoverflow.com/questions/38495683/what-is-the-solution-for-spark-cluster-libs-version-is-lower-than-my-projects-d>   
<https://medium.com/@ruijiang/using-gradle-shadow-plugin-to-resolve-java-version-conflict-183bd6ea4228>   
<https://guswns1659.github.io/newtech/Gradle)-Wiki/>    

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

