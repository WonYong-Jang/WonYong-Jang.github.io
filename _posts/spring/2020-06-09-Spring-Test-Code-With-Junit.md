---
layout: post
title: "[Spring] Junit5을 이용한 테스트 코드 작성"
subtitle: "단위 테스트를 위한 Mockito ,Mock, assertj"
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

#### 1. 생명 주기

`개별 테스트의 독립성을 보장하고, 테스트 사이의 상호관계에서 발생하는 부작용을 방지하기 위해, 
 JUnit는 테스트 메스드의 실행 전 각각 새로운 인스턴스를 생성한다.`   
이를 통해 개별 테스트 메서드는 완전히 독립적인 객체 환경에서 동작하며, 이를 메서드 단위 생명주기라 한다.   
 
`만약 모든 테스트 메서드를 동일한 인스턴스 환경에서 동작시키고 싶다면, @TestInstance를 
사용하면 된다.`   

- @TestInstance(Lifecycle.PER_CLASS) 를 선언한 클래스를 클래스 단위 생명주기를 가진다.   



- - -

#### 2. 기본 어노테이션 

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

#### 3. 테스트 이름 표기하기 

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

#### 4. Assertion 

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

#### 5. @Order 메소드 별로 순서 지정 

`Junit5에는 테스트 코드 실행 순서는 명확하게 정해져 있지 않다.(정확히는 순서는 있지만 
        그것이 명시적으로 정해져 있지 않다.)`   

아래와 같이 테스트 별로 순서가 정해져야 하는 경우는 
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)를 사용하고 @Order를 이용하여 
순서를 명시적으로 지정할 수 있다.   

```java
// 메소드 마다 개별적으로 테스트 하여 테스트 별로 의존성을 줄이는게 좋은 테스트 방법 이지만
// 메소드 마다 각각 인스턴스를 생성해야 하므로 하나의 인스턴스를 이용하여 테스트해야 하는 경우에는 
// 테스트 생명주기를 클래스 단위로 설정 할 수 있다.
@TestInstance(TestInstance.Lifecycle.PER_CLASS) // 테스트 생명 주기를 클래스 단위로 설정
@TestMethodOrder(MethodOrderer.OrderAnnotation.class) // 메소드 마다 순서를 정할 수 있음
@DisplayName("Github API 테스트")
class GithubApiTest {

    private GithubApi api;


    @Test
    @Order(1) // 숫자가 적을 수록 우선순위가 높다
    @DisplayName("Github API 객체 생성 테스트")
    void createInstance() throws IOException {

        api = new GithubApi();
        assertNotNull(api);

    }

    @Test
    @Order(2)
    @DisplayName("ISSUE객체를 받아온다.")
    void setIssue() {

        List<GHIssue> issues = api.getIssues();

        assertThat(issues.size()).isGreaterThan(0);
    }
}
```

#### 6. @Nested를 이용한 중첩 구성 

@Nested를 사용하면 중첩된 구조로 테스트를 구성할 수 있다. 기존에는 JUnit과 다른 도구를 
함께 사용해야 중첩 구조를 가진 테스트를 구성할 수 있었는데 이제 Jupiter API 만으로 
중첩 구조 테스트를 작성할 수 있다.   




- - - 

#### 7. 조건에 따라 테스트 실행 

특정한 자바 버전, 환경변수에 따라 실행 하거나 실행하지 않아야 하는 경우가 
있다면 아래와 같이 해결 가능하다. 


- - - 


#### 8. assertThat

`assertj라는 테스트 검증 라이브러리의 검증 메소드이다. 검증하고 싶은 대상을 메소드 인자로 받는다.`   
isEqualTo와 같이 메소드를 이어서 사용 가능   

Junit의 기본 assertThat이 아닌 assertj의 assertThat을 사용한다. assertj 역시 Junit에서 자동으로 
라이브러리 등록을 해주며, Junit과 비교하여 assertj의 장점은 다음과 같다.   

> Junit의 assertThat을 쓰게 되면 is()와 같이 CoreMatchers 라이브러리가 추가로 필요하다.   
> 자동완성이 좀 더 확실하게 지원된다.   

- - - 
- - - 

## Mockito

`mockito는 실제 객체와 비슷하게 동작하도록 하여 검증할 수 있는 방법을 제공해주는 라이브러리이다.`   

spring-boot-starter-test 모듈에 기본적으로 포함되어 있으며, 이 모듈을 사용하지 
않을 경우 mockito-core, mockito-junit-jupiter 모듈을 추가하면 된다.   

Mock 객체를 만드는 이유는 크게 `1) 협업하는 클래스의 완성 여부에 상관없이 
내가 만든 클래스를 테스트 할 수 있고 2) 내가 만든 클래스가 연관된 클래스와 
올바르게 협업하는 지 확인할 수 있기 때문에 사용한다. 또한, 연관된 
클래스가 인터페이스만 정의되어 있고 구현체가 아직 없는 경우 테스트를 할 때 
가짜로 구현한 Mock 객체를 전달하여 테스트가 가능하다.`      


### 1. Mock 객체 만들기    

Mock 객체를 만드는 방법은 아래 2가지 방법으로 테스트 진행할 수 있다. 

##### 1-1) Mockito.mock() 메소드

```java
@Test
  void createStudyService() {

     MemberService memberService = Mockito.mock(MemberService.class);
     assertNotNull(memberService);
}
```

##### 1-2) Mock 어노테이션    

`@Mock 어노테이션을 달기만 하면 되는데 @ExtendWith(MockitoExtension.class) 확장팩을 
추가한다.`    

```java
@ExtendWith(MockitoExtension.class)
class StudyServiceTest {
    @Mock
    MemberService memberService;
    @Test
    void createStudyService() {
        assertNotNull(memberService);
    }
}
```

또는 파라미터로 정의하는 것은 아래 방법으로 가능하다.    

```java
@ExtendWith(MockitoExtension.class)
class StudyServiceTest {

    @Test
    void createStudyService(@Mock MemberService memberService) {
        assertNotNull(memberService);
    }
}
```

- - - 

### 2. Mock 객체 Stubbing   

위에서 생성한 Mock의 메소드를 호출하면 아무런 행동도 하지 않는다. 
stub은 메소드의 행동을 원하는대로 미리 정해두는 것을 말한다.   
`Mock 객체를 when(), thenReturn(), thenThrow(), doThrow() 등으로 조작해서 특정 매개변수를 받는 경우 특정한 값을 리턴하거나 예외를 
던지도록 만들 수 있다.`   

```java
@ExtendWith(MockitoExtension.class)
class StudyServiceTest {

    @Mock MemberService memberService;

    @Test
    void createStudyService() {

        Member member = new Member();
        member.setId(1L);
        member.setEmail("wonyong@naver.com");

        // Stubbing
        // 매개변수 1로 받았을때 member 객체를 리턴 시켜 주는 걸로 정의한다.
        when(memberService.findById(1L)).thenReturn(Optional.of(member));

        // 매개변수 2로 받았을 때는 예외를 발생 시킨다.   
        when(memberService.findById(2L)).thenThrow(new RuntimeException());

        // 위에서 Stubbing 했기 때문에 매개변수 1을 검색해보면 member 객체를 리턴받는 것을 확인 할 수 있다.  
        Optional<Member> member1 = memberService.findById(1L);

        assertEquals("wonyong@naver.com", member1.get().getEmail());
    }
}
```

위에서 처럼 when(memberService.findById(1L)).thenReturn(Optional.of(member)); 로 
Stubbing을 해놓았기 때문에 구현체가 없더라도 매개변수로 1L이 들어왔을 때 
member객체를 찾아서 리턴하는 것처럼 테스트가 가능하다.   

매개변수로 1L이 아닌 다른 값으로 테스트 하는경우 에러를 발생시키고 
ArgumentMatchers.any를 이용하여 어떤 값이 들어오던지 간에 member 객체를 
리턴 시킬 수도 있다.    

```java
// Argument matchers 검색해 볼 것 
when(memberService.findById(any())).thenReturn(Optional.of(member));
```

아래는 void 메소드를 doThrow()로 테스트 하는 방법이다. 

```java
// memberService의 void 메소드인 validate에 2값이 들어왔을때는 예외를 발생시킨다.   
doThrow(new IllegalArgumentException()).when(memberService).validate(2L);

assertThrows(IllegalArgumentException.class,() -> {
           memberService.validate(2L);
        });
```

또한, 메소드가 동일한 매개변수로 여러번 호출될 때 각기 다르게 행동하도록 
조작할 수도 있다. 

```java
when(memberService.findById(1L))
                .thenReturn(Optional.of(member))   // 첫번째 실행 결과 
                .thenThrow(IllegalArgumentException.class) //두번째 실행 결과 
                .thenReturn(Optional.empty()); // 세번째 실행 결과   
```

- - -
Referrence 

[https://www.inflearn.com/course/the-java-application-test/](https://www.inflearn.com/course/the-java-application-test/)      
[https://awayday.github.io/2017-11-12/junit5-05/](https://awayday.github.io/2017-11-12/junit5-05/)     
[https://www.inflearn.com/course/the-java-application-test](https://www.inflearn.com/course/the-java-application-test)     

{% highlight ruby linenos %}
{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

