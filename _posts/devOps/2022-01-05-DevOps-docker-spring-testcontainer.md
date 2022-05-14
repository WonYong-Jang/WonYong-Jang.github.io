---
layout: post
title: "[Docker] Spring testcontainer와 Spock를 이용한 독립 테스트환경 구축"
subtitle: "멱등성있는 integration test 환경 구축"    
comments: true
categories : DevOps
date: 2022-05-14
background: '/img/posts/mac.png'
---

테스트 환경은 프로젝트 설정을 할 때 가장 중요한 부분 중 하나이다.   

가장 어렵고 귀찮은 작업이기도 하지만 처음 한번만 고생하면 추후 테스트 
작성시에 걱정 없이 아주 깔끔한 테스트 코드를 짤 수 있게 된다.   
하지만 그만큼 프로젝트 환경 설정에서 가장 많은 시간을 들이게 되고, 
    많은 시행착오를 겪는 구간 중 하나라고 볼 수 있다.   

테스트 환경을 만드는 과정에서 신경써야 할 부분은 다양하겠지만 그 중에서도 
특히나 `주의해야 할 부분 중 하나는 바로 멱등성이다.`   
멱등성을 간과한 경우에는 예상치 못한 상황에서 다른 테스트 혹은 외부 모듈로 
인해 테스트가 간헐적으로 실패할 수 있으며, 이 경우 실패 구간을 찾기 
매우 어렵다는 특징을 가지고 있기 때문이다.   

`여기서 멱등성(idempotent)이란 연산을 여러번 적용하더라도 
결과가 바뀌지 않는 성질을 뜻한다.`   

`쉽게 말해서 다른 환경에서 
여러 번 함수를 실행하더라도 늘 같은 결과가 나와야 한다는 것이다.`      

자신의 로컬 환경에서 잘 실행되던 테스트가 누군가의 환경이나 CI에서 
깨진다면, 테스트를 신뢰할 수 없게되고 테스트 코드를 작성하는 것에 대해 
극심한 피로감을 겪을 것이다.   

하나의 예로 DB를 테스트할 때, 여러가지 방법이 있을 수 있다.   

## 1. DB를 테스트하는 여러가지 방법   

##### 1) 로컬에서 운영환경과 동일한 DB 사용하기    

운영환경에서 사용하는 동일 스펙의 DB를 개발환경의 데이터베이스로 
셋업하여 사용하는 방법이다.     
이 방법은 운영환경과 유사한 환경에서 테스트할 수 있지만 동시에 
여러 테스트가 이루어지거나 테스트가 끝났음에도 테스트용 데이터가 
남아 있는 문제들로 인하여 멱등성 관리가 매우 어렵다.   

##### 2) 인메모리 DB 사용하기   

위에서 공용으로 테스트 DB를 사용함에 따라 문제점이 있기 때문에 
인 메모리 DB인 H2를 사용하여 테스트하는 방법이 있을 수 있다.    
이 방법은 메모리를 이용하기 때문에 동작이 빠르고, 공용으로 사용하는게 
아니기 때문에 위의 문제점을 해결할수 있다.   
하지만 실제 운영환경과 다르기 때문에 각 DB마다 지원하는 부분이 달라서 
멱등성이 깨질 수 있다.    

> DB마다 격리레벨, 전파레벨이 다르기 때문에 문제가 발생할 수 있다.   
> Spring은 DB에서 지원하는 기본 설정을 동일하게 따라간다.   

<img width="445" alt="스크린샷 2022-05-14 오후 5 24 56" src="https://user-images.githubusercontent.com/26623547/168417697-1af0143f-fc1d-4ee8-b0c3-c50264ce8b51.png">   

##### 3) Docker 활용하기     

운영환경과 동일한 스펙의 도커 이미지를 구성하여 
로컬에서 컨테이너를 실행해서 테스트 가능하다.     
하지만, 여기서 문제점은 도커 스크립트를 따로 관리해야 하며 
테스트를 진행할때마다 도커 컨테이너를 실행하고, 테스트가 끝나면 
이를 종료 및 테스트 데이터를 정리해줘야 한다.   

즉 테스트를 위해서 관리 포인트가 늘어나게 되는 단점이 있다.   

마지막 방법인 Testcontainers를 살펴보자.   

 - - -

## 2. Testcontainers    

사실 동작 원리는 Docker Compose와 다를 바 없지만 docker-compose와 같은 
외부 설정 파일 없이 Java 언어만으로 docker container를 활용한 
테스트 환경을 설정할 수 있다.   

특히 compose를 활용할 때에 어려운 부분인 container와의 통신 또한 
언어 레벨에서 처리할 수 있다.   

따라서 container에 변경사항이 생기더라도 여러 곳을 변경할 필요 없이 
하나의 코드로 관리할 수 있다.   

`즉, 도커를 이용하여 테스트할 때 컨테이너를 직접 관리해야 하는 
번거로움을 해결해주고 운영환경과 유사한 테스트를 할 수 있다.`       

이제 직접 Testcontainers 라이브러리를 추가해서 테스트해보자.    

여기서 DB는 mariaDB를 이용하며, 테스트는 Spock를 이용하여 
작성할 것이기 때문에 아래와 같이 의존성을 추가해준다.   

```gradle
testImplementation 'org.testcontainers:spock:1.17.1'
testImplementation 'org.testcontainers:mariadb:1.17.1'
```   

그 이후 [공식문서](https://www.testcontainers.org/modules/databases/jdbc/)를 
참고하여 설정을 추가한다.   

> 테스트를 위한 test/resources/application-test.yml을 추가한다.   

`공식문서에 따르면 jdbc: 이후 tc:를 추가하면, host와 port, database name은 무시된다고 한다.`    
`tc: 를 추가 하면 testcontainers가 제공하는 드라이버가 알아서 처리해 주기 
때문에 host와 port, database name은 제외해도 된다.`    

또한 드라이버도 testcontainers가 제공하는 드라이버를 사용하도록 아래와 
같이 추가한다.   

```shell
spring:
  datasource:
    driver-class-name: org.testcontainers.jdbc.ContainerDatabaseDriver
    url: jdbc:tc:mariadb:///
    username: {db username}
    password: {db password}
```

테스트할 DB 컨테이너 정보를 applicaion-test.yml에 작성하였고, 
아래와 같이 테스트 코드를 작성하여 확인해보자.   

```groovy
@ActiveProfiles("test") // application-test.yml 를 사용 
@SpringBootTest
class PharmacyRepositoryTest extends Specification {

    // static으로 하지 않으면 테스트 할 때마다 새로운 컨테이너를 실행한다.      
    static MariaDBContainer mariaDBContainer = new MariaDBContainer()   
            .withDatabaseName("pharmacyRecommendation"); // Database Name 지정하기    

    def setupSpec() { // 테스트 실행시 컨테이너 시작  
        mariaDBContainer.start();
        println "JDBC URL : "+mariaDBContainer.getJdbcUrl()
    }

    def cleanupSpec() { // 테스트 종료시 컨테이너 종료   
        mariaDBContainer.stop();
    }

    def "testcontainers test"() {
        expect:
        assert true
    }
}

// 출력 => JDBC URL : jdbc:mariadb://localhost:51800/pharmacyRecommendation
// Port 는 랜덤 포트이며 실행할 때마다 충돌이 없는 랜덤한 포트로 실행시켜준다.   
```

`위처럼 작성하면 테스트할 때마다 직접 도커 컨테이너를 시작하고 종료하는 부분을 자동화 할 수 있다.`      

> 터미널에서 docker ps로 확인해보면, 테스트 코드 실행시 컨테이너가 실행되고 종료되는 것을 확인할 수 있다.   

위의 코드에서 직접 컨테이너 라이프 사이클을 관리하였는데, 이를 조금더 리팩토링해보면 
아래와 같다.   

```groovy
@Testcontainers // 컨테이너 라이프 사이클 관리
@ActiveProfiles("test") // application-test.yml 를 사용
@SpringBootTest
class PharmacyRepositoryTest extends Specification {

    @Autowired
    PharmacyRepository pharmacyRepository;

    // 테스트 마다 컨테이너를 생성 및 삭제 해주면 너무 느리기 때문에
    // 테스트 실행시 컨테이너를 공유 하면서 각 테스트 시작 전 데이터를 비워 준다.
    @Shared
    MariaDBContainer mariaDBContainer = new MariaDBContainer()
            .withDatabaseName("pharmacyRecommendation"); // Database 지정하기

    def setup() {
        pharmacyRepository.deleteAll();
    }
     def "testcontainers test"() {
        expect:
        assert true
    }
}
```






- - - 

**Reference**    

<https://loosie.tistory.com/793>   
<https://www.testcontainers.org/>   
<https://taes-k.github.io/2021/05/02/spring-test-container/>   
<https://www.inflearn.com/course/the-java-application-test/lecture/28588?tab=curriculum&volume=1.00>   

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

