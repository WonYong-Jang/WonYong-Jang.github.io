---
layout: post
title: "[JPA] Querydsl을 JPA와 함께 사용하기"
subtitle: "Querydsl 환경 설정 / Querydsl 소개와 사용이유"
comments: true
categories : JPA
date: 2022-04-30
background: '/img/posts/mac.png'
---   

## Querydsl 소개   

Querydsl은 HQL(Hibernate Query Language) 쿼리를 타입에 안전하게 생성 및 
관리할 수 있게 해주는 프레임워크다.   
즉, Querydsl은 자바 코드 기반으로 쿼리를 작성하게 해주며, 
    그렇기 때문에 동적 쿼리가 가능해진다.   

- - -    

## Querydsl 설정과 검증   

Querydsl을 사용하기 위해 gradle에 아래와 같이 설정을 추가한다.    

설정시 중요한 점은 스프링 부트 버전에 따라 Querydsl 설정 방법이 조금 다르다.
`이 글에서는 스프링부트 2.6 이상을 사용할 것이고, 스프링 부트 2.6 이상 사용시 
Querydsl 5.0을 사용해야 한다.`   

아래와 같이 querydsl-jpa, querydsl-apt를 추가하고 버전을 명시해야 한다.    

```gradle
buildscript {
    ext {
        queryDslVersion = "5.0.0"
    }
}

plugins {
    id 'org.springframework.boot' version '2.6.7'
    id 'io.spring.dependency-management' version '1.0.11.RELEASE'
    //querydsl 추가
    id "com.ewerk.gradle.plugins.querydsl" version "1.0.10"
    id 'java'
}

group = 'study'
version = '0.0.1-SNAPSHOT'
sourceCompatibility = '1.8'

configurations {
    compileOnly {
        extendsFrom annotationProcessor
    }
}

repositories {
    mavenCentral()
}

dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-data-jpa'
    implementation 'org.springframework.boot:spring-boot-starter-web'
    compileOnly 'org.projectlombok:lombok'
    runtimeOnly 'com.h2database:h2'
    //querydsl 추가
    implementation "com.querydsl:querydsl-jpa:${queryDslVersion}"
    annotationProcessor "com.querydsl:querydsl-apt:${queryDslVersion}"

    annotationProcessor 'org.projectlombok:lombok'
    testImplementation 'org.springframework.boot:spring-boot-starter-test'
}

test {
    useJUnitPlatform()
}

//querydsl 추가 시작
def querydslDir = "$buildDir/generated/querydsl"
querydsl {
    jpa = true
    querydslSourcesDir = querydslDir
}
sourceSets {
    main.java.srcDir querydslDir
}
compileQuerydsl {
    options.annotationProcessorPath = configurations.querydsl
}
configurations {
    compileOnly {
        extendsFrom annotationProcessor
    }
    querydsl.extendsFrom compileClasspath
}
//querydsl 추가 끝
```

위에 querydsl 설정을 추가한 후 정상적으로 작동하는지 검증을 해보자.   

검증을위해 Hello 라는 엔티티 파일을 생성한다.   

```java
@Entity
@Getter @Setter
public class Hello {

    @Id @GeneratedValue
    private Long id;
}
```

`그 후 아래와 같이 gradle -> tasks -> other -> compileQuerydsl을 클릭하게 되면, 
    빌드가 되면서 QHello 파일이 생기게 된다.`   

> 또한 터미널에서 ./gradlew compileQuerydsl을 입력해도 동일하며 gradle 전체 빌드를 하게 되더라도 
compileQuerydsl이 같이 실행되기 때문에 동일한 결과를 얻을 수 있다.   

> ./gradlew clean을 하게 되면 build 하위 파일이 모두 제거 된다.   

<img width="1500" alt="스크린샷 2022-04-30 오후 2 49 23" src="https://user-images.githubusercontent.com/26623547/166093432-76efde31-885c-4198-a8c0-09f80f57704a.png">     

`querydsl 폴더를 아래와 같이 설정했기 때문에 generated/querydsl 폴더가 
소스 폴더로 잡힌 것을 볼 수 있고, 그 하위에 QHello가 생긴 것을 확인할 수 있다.`   

```gradle
//querydsl 추가 시작
def querydslDir = "$buildDir/generated/querydsl"
```


<img width="1400" alt="스크린샷 2022-04-30 오후 2 49 44" src="https://user-images.githubusercontent.com/26623547/166093364-bb34ab42-2d24-463c-9356-a44dc85a1a3c.png">      

> 참고로 generated된 Q파일들은 개인 설정마다 
달라질 수 있기 때문에 git에서 관리하면 안된다.    

마지막으로 테스트 코드를 통해 querydsl을 검증해보자.  

```java
package study.querydsl;

import com.querydsl.jpa.impl.JPAQueryFactory;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;
import study.querydsl.entity.Hello;
import study.querydsl.entity.QHello;

import javax.persistence.EntityManager;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Transactional // JPA는 반드시 트랜잭션이 필요하며, 테스트에서 진행시 모든 로직이 실행되고 나서 롤백된다.   
// @Commit 롤백되지 않기를 원하면 커밋 어노테이션을 추가한다.   
class QuerydslApplicationTests {

    @Autowired
    // @PersistenceContext를 사용하는 것과 같다.   
    EntityManager em; // JPA를 사용하기위한 엔티티 매니저 

    @Test
    void contextLoads() {
        Hello hello = new Hello();
        em.persist(hello);

        // Querydsl 사용하기
        JPAQueryFactory query = new JPAQueryFactory(em);
        QHello qHello = QHello.hello;

        Hello result = query.selectFrom(qHello)
                .fetchOne();

        assertThat(result).isEqualTo(hello);
        assertThat(result.getId()).isEqualTo(hello.getId());
    }
}
```

또한, JPA와 로깅 관련 설정을 application.yml에 추가한다.   

```yml
spring:
  datasource:
    url: jdbc:h2:tcp://localhost/~/querydsl
    username: sa
    password:
    driver-class-name: org.h2.Driver

  jpa:
    hibernate:
      ddl-auto: create
    properties:
      hibernate:
#        show_sql: true   # system print out으로 쿼리 출력 
        format_sql: true

logging.level:
  org.hibernate.SQL: debug  # 로깅으로 쿼리 출력 
# org.hibernate.type: trace # 쿼리에 있는 파라미터도 같이 보여준다.   
```  


- - - 

## 정리   

JPA를 사용하다 보면 기본 기능으로 해결되지 않는 경우에는 네이티브 쿼리를 사용하게 된다.   
네이티브 쿼리는 문자열을 이어 붙이기 때문에 오타가 발생하기 쉽고 가독성이 
떨어지는 단점이 있다.   

Querydsl을 사용하면 자동 완성과 같은 IDE의 도움을 받을 수 있고, 컴파일 시점에 
타입이나 문법 오류를 확인할 수 있다.   
또한 동적 쿼리도 쉽게 사용할 수  있어서 편리하다.  



- - -
Referrence

<https://www.inflearn.com/course/Querydsl-%EC%8B%A4%EC%A0%84/lecture/30114?tab=curriculum&volume=1.00>   
<https://madplay.github.io/post/introduction-to-querydsl>   

{% highlight ruby linenos %}
{% endhighlight %}

{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

