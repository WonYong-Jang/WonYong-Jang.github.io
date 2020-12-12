---
layout: post
title: "[Spring] Junit5을 이용한 테스트 코드 작성"
subtitle: "단위 테스트를 위한 MockMvc, WebMvcTest, assertj"
comments: true
categories : Spring
date: 2020-06-09
background: '/img/posts/spring.png'
---

## 테스트 코드 소개 

시작 전에 TDD와 단위 테스트는 다른 이야기 이다. TDD는 테스트가 주도하는 개발을 이야기하며 
테스트 코드를 먼저 작성하는 것부터 시작한다.

반면 `단위 테스트는 TDD의 첫 번째 단계인 기능 단위의 테스트 코드를 작성` 하는 것을 이야기 한다.   
단위 테스트는 TDD와 달리 테스트 코드를 꼭 먼저 작성해야 하는 것도 아니고, 리팩토링도 포함되지 않는다.

### 테스트 코드 작성 장점 

- 단위 테스트는 개발단계 초기에 문제 발견에 도움을 준다.
- 단위 테스트는 기능에 대한 불확실성을 감소시킬 수 있으며, 단위 테스트 자체가 문서로 
사용 될수 있다. 
- 테스트 코드를 작성하지 않고 개발한다면 아래와 같은 작업을 반복하게 된다.    

`코드 작성 후 Tomcat 실행 -> Postman 같은 테스트 도구로 http 요청 확인 -> 결과를 sysout으로 확인`

- 개발자가 만든 기능을 안전하게 보호해 준다.

`B라는 기능을 새로 추가 하여 오픈했더니 기존에 잘되던 A기능이 문제가 생기는 경우가 많다. A B 기능 모두 테스트 코드를 작성 
했다면 오픈 전에 문제를 확인 가능하다.`   

- - - 

## JUnit 5   

2.2 이상 버전의 스프링 부트 프로젝트를 만든다면 기본적으로 JUnit5 의존성 추가 된다.   

#### 기본 어노테이션 

    - @Test
    - @BeforeAll / @AfterAll
    - @BeforeEach / @AfterEach
    - @Disabled : 해당 테스트코드 무시하고 전체 실행 할때 


```java
class StudyTest {

    @Test
    void create() {
        Study study = new Study();
        assertNotNull(study);
        System.out.println("create");
    }

    @Test
    void create1() {
        System.out.println("create1");
    }

    // 모든 테스트 메소드 실행 전 한번만 작동 하는 어노테이션
    // 반드시 static 을 붙여야 하며 리턴 타입은 void
    @BeforeAll
    static void beforeAll() {
        System.out.println("before all");
    }

    // 모든 테스트 메소드 실행 전 한번만 작동 하는 어노테이션
    @AfterAll
    static void afterAll() {
        System.out.println("after all");
    }

    // 각각 테스트 메소드를 실행하기 전에 작동하는 어노테이션
    @BeforeEach
    void beforeEach() {
        System.out.println("before Each");
    }

    // 각각 테스트 메소드를 실행한 후에 작동하는 어노테이션
    @AfterEach
    void afterEach() {
        System.out.println("after Each");
    }
}
```

결과값은 아래와 같다. 


```
before all

before Each
create
after Each


before Each
create1
after Each

after all
```

- - -

#### 테스트 이름 표기하기 

- @DisplayNameGeneration

    - Method와 Class 래퍼런스를 사용해서 테스트 이름을 표기하는 설정
    - 기본 구현체로 ReplaceUnderscores 제공

```java
@DisplayNameGeneration(DisplayNameGenerator.ReplaceUnderscores.class)
class StudyTest {

    @Test
    void create_new_study() {
    }

// 실행 결과에 create new study 로 표기됨 ( 언더바 제거된 이름) 
```

- @DisplayName

    - 어떤 테스트인지 테스트 이름을 보다 쉽게 표현할 수 있는 방법을 제공하는 어노테이션  
    - 위의 방법보다 우선순위가 높고 한글, 영어, 이모티콘등도 사용 가능하다. 

```java
    @Test
    @DisplayName("스터디 만들기")
    void create_new_study() {
    }
```

- - -

### Assertion 

org.junit.jupiter.api.Assertion

- assertEquals(expected, actual) 
    - 실제 값이 기대한 값과 같은지 확인 

```java

// study 오브젝트 처음 상태가 DFAFT인지 확인 하고 있고
// 아래와 같이 같지 않다면 메세지를 출력해 줄 수도 있다. 

Study study = new Study();
assertEquals(StudyStatus.DRAFT, study.getStudyStatus(),
                () -> "스터디를 처음 만들면 상태가 DRAFT 여야 함" );   
```


- assertNotNull(actual) 
    - 값이 null이 아닌지 확인    


- assertTrue(boolean)   
    - 다음 조건이 참(true)인지 확인   


- assertAll
    - 모든 확인 구문 확인  
    - 다수의 assertion이 false일 경우 맨 위의 assertion만 실패 했다고 console에 표기됨   
    - assertAll로 묶어 주게 되면 실패한 assertion 모두 확인 가능   

```java
assertAll(
        () -> assertEquals(StudyStatus.START, study.getStudyStatus(),
                    () -> "스터디를 처음 만들면 상태가 DRAFT 여야 함" ),

        () -> assertEquals(StudyStatus.END, study.getStudyStatus(),
                    () ->"스터디를 처음 만들면 상태가 DRAFT 여야 함")
        );
```


- assertThrows(expectedType, executable)   
    - 원하는 예외가 정상적으로 발생하는지 확인    

```java
IllegalArgumentException exception =
        assertThrows(IllegalArgumentException.class , () -> new Study(-10));
        System.out.println(exception.getMessage());
```


- assertTimeout(duration, executable) 
    - 특정 시간 안에 실행이 완료되는지 확인   


```java
// 100 mills 안에 들어오는지 확인
assertTimeout(Duration.ofMillis(100), () -> {
            Thread.sleep(300); // 100 mills 보다 크기때문에 false
        });
```


- - -

### 조건에 따라 테스트 실행 

특정한 자바 버전, 환경변수에 따라 실행 하거나 실행하지 않아야 하는 경우가 
있다면 아래와 같이 해결 가능하다. 


- - - 


##### assertThat

`assertj라는 테스트 검증 라이브러리의 검증 메소드이다. 검증하고 싶은 대상을 메소드 인자로 받는다.`   
isEqualTo와 같이 메소드를 이어서 사용 가능   

Junit의 기본 assertThat이 아닌 assertj의 assertThat을 사용한다. assertj 역시 Junit에서 자동으로 
라이브러리 등록을 해주며, Junit과 비교하여 assertj의 장점은 다음과 같다.   

> Junit의 assertThat을 쓰게 되면 is()와 같이 CoreMatchers 라이브러리가 추가로 필요하다.   
> 자동완성이 좀 더 확실하게 지원된다.   

##### isEqualTo

비교 메소드이며, assertThat에 있는값과 비교해서 같을 때만 성공이다.   

- - -
Referrence 

[https://www.inflearn.com/course/the-java-application-test](https://www.inflearn.com/course/the-java-application-test)   

{% highlight ruby linenos %}
{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

