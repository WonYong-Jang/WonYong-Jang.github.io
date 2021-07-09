---
layout: post
title: "[Spark] How to override a spark dependency in cluster mode(AWS EMR)"   
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

기본적으로 gradle 빌드를 하면 내가 만들 코드만 컴파일하여 build/libs 경로에 
jar 파일로 패키징된다. 개발이 끝나고 IDE를 벗어나 커맨드로 동작시키려면 
dependency로 걸어서 사용하던 라이브러리 파일들은 내가 손수 찾아서 클래스패스에 
넣어줘야 한다.   

클래스패스 잡고 하는거 다 귀찮으면, 내 jar 파일에 모든 라이브러리를 넣어주는 
[shadowJar](https://imperceptiblethoughts.com/shadow/) 플러그인이 있다.   

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

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

