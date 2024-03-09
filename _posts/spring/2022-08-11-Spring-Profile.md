---
layout: post
title: "[Spring] application profile 환경 별 설정 분리"
subtitle: "Spring boot 2.4 이전과 이후 profile 설정 방법 비교하기 / 환경 별 profile 설정 / properties, yaml  파일 형식 / System Properties와 Project Properties" 
comments: true
categories : Spring
date: 2022-08-11
background: '/img/posts/spring.png'
---

`Spring Profile는 어플리케이션 설정을 특정 환경에서만 적용되게 하거나, 
       환경 별(local, develop, production 등)로 다르게 적용 할 때 사용 한다.`    

Spring boot 2.4 버전이 릴리즈 되면서 application.properties, application.yml 파일 
로드 방식에 변화가 있었다.   

> Spring boot는 어플리케이션이 실행될 때 자동으로 application.properties 또는 application.yml을 찾는다.   
> application.properties와 application.yml을 동시에 사용하지 않도록 주의하자.   
> 같이 존재할 경우 properties가 항상 나중에 로드되어 yaml에 정의한 profile 설정을 
덮어 쓸 수 있기 때문이다.   


Spring boot 2.4 이전 버전의 profile 방식과 2.4 이후 profile 작성 
방법에 대해서 살펴보자.  

- - -   

## 1. Spring boot 2.4 이전 profile 

먼저 Spring boot 2.4 이전 profile 설정 방법을 알아보자.   

`참고로 YAML은 하나의 profile에 (---) 구분자로 구분을 하면, 논리적으로 구분이 되어
파일을 나누어서 사용하는 효과를 볼 수 있다.`    

##### application.yml     

```yml
# default
spring:
    profiles:
        active: local
---
spring:
    profiles: local
# ...
---
spring:
    profiles: dev
# ...
---
spring:
    profiles: prod
# ...
```


또한, 여러 profile을 포함시키기 위해 include를 이용하여 아래와 같이 설정 할 수 있었다.   

##### application.yml   

```yaml
# default
spring:
    profiles:
        active: local
---
spring:
    profiles: local
        include:   
        - common
# ... 
```

- - - 

## 2. Spring boot 2.4 이후 profile

아래 사진과 같이 Spring boot 2.4부터는 spring.profiles은 deprecated 되었다.   

<img width="700" alt="스크린샷 2022-08-11 오후 11 48 10" src="https://user-images.githubusercontent.com/26623547/184162231-6ff1a3ac-a589-4661-ab1f-25bcd49201f9.png">    

`이전에 spring.profiles로 사용하는 것이 아닌 spring.config.active.on-profile로 
더 직관적으로 알아 볼 수 있도록 변경되었다.`       

##### application.yml   

```yml
spring:
  profiles:
    active: local # 기본적으로 활성화할 profile을 local로 설정 

---
spring:
  config:
    activate:
      on-profile: local
# ... 
---
spring:
  config:
    activate:
      on-profile: prod
# ...       

```

`또한, 아래와 같이 spring.profiles.group 을 이용해서 여러 profile들을 
한꺼번에 그룹지어 하나의 profile로 만들 수 있다.`        

> include 대신 group을 사용한다.   

`spring.profiles.active=prod로 실행하게 되면 prod와 common 두개의 profile들을 
한번에 실행할 수 있다.`    

##### application.yml    

```yml
# default
spring:
  profiles:
    active: local # default
    group:
      local:  # local, common profile을 그룹지어 함께 어플리케이션 구동    
        - common
      prod:   # prod, common profile을 그룹지어 함께 어플리케이션 구동  
        - common   

---
spring:
  config:
    activate:
      on-profile: common   # application-common.yml 과 동일한 역할

---
spring:
  config:
    activate:
      on-profile: local

---
spring:
  config:
    activate:
      on-profile: prod
```

`인텔리제이에서 profile 값을 주기 위해서는 아래와 같이 줄 수 있고 자바로 
실행할 때 VM arguments로 java -jar -Dspring.profiles.active=local app.jar 로 
줄 수도 있다.`   

<img width="1000" alt="스크린샷 2022-08-11 오후 11 59 28" src="https://user-images.githubusercontent.com/26623547/184165138-75ea0666-4284-4438-b3e6-a271a06a8775.png">   

실제로 application을 실행할 때 spring.profiles.active 설정을 주어 
어떠한 profile를 활성화할 것인지 정해주어야 한다.   
해당 설정이 없을 시에는 위에서 정해준 default 값으로 profile이 실행된다

`참고로, 위의 YAML 파일에서 사용하는 구분자는 Spring boot 2.4 부터 
properties도 구분자(#---) 또는 (!---)를 이용하여 아래와 같이 사용가능하다.`     

##### application.properties   

``` 
test=value
#---
spring.config.activate.on-profile=dev
test=overridden-value
```

- - - 

## 3. 외부 데이터 사용하는 방법    

위에서 -D(System Properties) 옵션을 사용해서 profile 값을 주입해 주었는데 -P(Project Properties) 옵션과 
비교해보고 그 외에 여러 방법에 대해 살펴보자.   

### 3-1) System Properties    

`System Properties는 실행한 JVM 안에서 접근 가능한 외부 설정이며 
옵션(-D)를 통해서 key=value 형식을 주면 된다.`      

주로 JVM 의 gradle runtime environment 관점에서 사용한다.    

예를 들면 JVM 관점에서 메모리 할당량 등을 gradle build process에 
전달 할 수 있다.   

아래와 같이 실행 시점에 전달할 수도 있고, 코드 내부에서 
추가하는 것도 가능하다.   

```
./gradlew clean build -Dorg.gradle.jvmargs="-Xmx4g -ea"

or

System.setProperty("org.gradle.jvmargs", "-Xmx4g -ea")
```   


위와 같이 gradle 사용시 -D 옵션을 이용하여 변수를 사용하게 되었을 때, 
    args로 넘겨 아래와 같이 사용할 수 있게 된다.   


```java   
println(System.getProperty("org.gradle.jvmargs"))   
```

### 3-2) Project Properties   

`Project Properties는 -P 옵션을 이용하며, 주로 gradle build script 안에서 
사용한다.`        

예를 들면 build version이나 build type(debug/release) 등을 구분하기 위해서 
-P 옵션을 전달하여 gradle task 등에서 사용한다.   


```
./gradlew printTask -PBUILD_VERSION=1234   
```

아래와 같이 gradle 내에서 전달했던 변수를 사용할 수 있게 된다.   

```gradle
task printTask() {
    project.property('BUILD_VERSION')
}
```

### 3-3) OS 환경 변수   

OS 환경 변수(OS environment variables)는 해당 OS를 사용하는 
모든 프로그램에서 읽을 수 있는 설정 값이다.    

즉 해당 방식은 전역 변수 같은 효과가 있어 이 프로그램 뿐만 아니라 
다른 프로그램에서도 사용할 수 있다.   

```scala
println(System.getenv("JAVA_HOME"))
```

### 3-4) Command Line Arguments   

Command Line Arguments는 어플리케이션 실행 시점에 
외부 설정값을 main(args) 메서드의 args 파라미터로 전달하는 방법이다.   

```
java -jar app.jar aaa bbb   

// Output  
// [aaa, bbb]   
```

> Command Line Arguments는 공백으로 구분한다.  

또는 아래와 같이 인텔리제이에서 Program Arguments에 값을 전달 해도 된다.  

<img width="793" alt="스크린샷 2024-03-09 오후 2 44 39" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/4c82cc00-064c-4bd2-a170-156bd23ce3f3">   


그외에 사용 방법은 아래와 같다.   

```
// 공백을 연결하려면 아래와 같이 하나의 문자열로 묶어 줄 수 있다.  
"aaa bbb" => [aaa bbb]

key1=val1 key2=val2 => [key1=val2, key2=val2]    
```

- - -
Referrence 

<https://www.baeldung.com/spring-boot-yaml-vs-properties>   
<https://docs.spring.io/spring-boot/docs/current/reference/html/features.html#features.external-config.files>    
<https://data-make.tistory.com/722>   

{% highlight ruby linenos %}
{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

