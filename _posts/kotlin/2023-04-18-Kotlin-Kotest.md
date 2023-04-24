---
layout: post
title: "[Kotlin] Kotest 테스트 코드 작성하기"     
subtitle: "Isolation Modes, Assertion"    
comments: true
categories : Kotlin
date: 2023-04-18
background: '/img/posts/mac.png'
---   

스프링 기반 프로젝트에서 코틀린을 사용하더라도 아래와 같이 기존에 사용하던 
테스트 프레임워크인 Junit, AssertJ, Mockito 등은 동일하게 
사용할 수 있다.   

하지만 코틀린에서 Junit, AssertJ, Mockito를 사용해 테스트를 작성하는 경우의 
문제점에 대해 자세히 다루고, 코틀린 진영에서 많이 사용되는 테스트 도구인 
kotest 및 mockk 등에 대해 살펴보자.   

- - -     

## 1. Kotest 의존성 추가   

먼저 intellij 에서 제공하는 kotest 플러그인을 설치한다.   

의존성은 아래와 같이 추가한다.   

```gradle   
dependencies {
  .
  .
  testImplementation("io.kotest:kotest-runner-junit5:$kotestVersion")
  testImplementation("io.kotest:kotest-assertions-core:$kotestVersion")
}
```

- - -    

## 2. Test Style   

코틀린에서 DSL(Domain Specific Language) 스타일의 중괄호를 활용한 코드 스타일을 
제공한다.   


`하지만 기존에 사용하던 Junit과 AssertJ, Mockito를 사용하면 Mocking이나 
Assertion 과정에서 코틀린 DSL 을 활용할 수 없다.`   

비즈니스 로직을 코틀린 DSL을 이용해 작성하더라도 테스트에서 
예전 방식의 코드를 작성해야 하다 보니 코틀린에 익숙해질수록 
테스트 작성이 어색해지게 된다.   

[kotest](https://kotest.io/)나 [mockk](https://mockk.io/)와 같은 
도구들을 사용하면 아래처럼 코틀린 DSL이나 Infix를 사용해 
코틀린 스타일의 테스트 코드를 작성할 수 있다.   

<img width="832" alt="스크린샷 2023-04-20 오후 10 51 24" src="https://user-images.githubusercontent.com/26623547/233387527-85c087a7-9c6c-41fa-8aa2-f315bf7a55c8.png">   


kotest에는 테스트 레이아웃이 10개 있는데, 이 중에 하나를 상속받아 진행하면 된다.  
여러 테스트 프레임워크에서 영향을 받아 만든어진 것도 있고, 코틀린만을 
위해 만들어진 것도 있다.   

[Tesing Styles](https://kotest.io/docs/framework/testing-styles.html#free-spec)를 
참고해보자.   

어떤 스타일을 고르던 기능적 차이는 없다. 취향에 따라, 팀 또는 개인의 
스타일에 따라 고르면 된다.  

FreeSpec으로 진행하려면 아래와 같다.    

```kotlin
internal class HumanTest : FreeSpec() {

}
```

- - -   

## 3. 전후 처리   

Junit에서 사용하던 @BeforeEach, @BeforeAll, @AfterEach 등과 같은 전후처리를 
위한 기본 어노테이션을 사용하지 않고 각 Spec의 
SpecFunctionCallbacks 인터페이스에 의해 override를 하여 구현 할 수 있다.   

```kotlin
interface SpecFunctionCallbacks {
   
   fun beforeSpec(spec: Spec) {}
   fun afterSpec(spec: Spec) {}
   // 테스트 케이스가 실행되기 전에 매번 호출된다.    
   fun beforeTest(testCase: TestCase) {}
   // 테스트 케이스가 실행된 후 매번 호출 된다.    
   fun afterTest(testCase: TestCase, result: TestResult) {}
   fun beforeContainer(testCase: TestCase) {}
   fun afterContainer(testCase: TestCase, result: TestResult) {}
   fun beforeEach(testCase: TestCase) {}
   fun afterEach(testCase: TestCase, result: TestResult) {}
   fun beforeAny(testCase: TestCase) {}
   fun afterAny(testCase: TestCase, result: TestResult) {}
}
```

- - - 

## 4. Isolation Modes   

kotest에서는 테스트 간 격리 레벨에 대해 디폴트로 SingleInstance를 
설정하고 있으며 이 경우 Mocking 등의 이유로 테스트 간 충돌이 발생하 수 있다.  

`따라서 테스트 간 격리를 위해 IsolationMode라는 enum값으로 제공하며, 
SingleInstance, InstancePerLeaf, InstancePerTest 값이 있다.`      

isolationMode에 값을 할당하거나, fun isolationMode()을 오버라이드 하여 
설정할 수 있다.   

```kotlin
internal class MainKtTest : StringSpec({
    isolationMode = IsolationMode.SingleInstance
    // test 
})

internal class MainKtTest : StringSpec(){
    override fun isolationMode() = IsolationMode.SingleInstance
    // test
}
```

#### 4-1) SingleInstance    

`기본 격리 모드는 SingleInstance`으로 Spec클래스 하나의 인스턴스가 생성된 다음 
모든 테스트가 완료될 때까지 각 테스트 케이스가 차례로 실행되는 방식이다.  

아래 예시를 통해서 각 모드마다 결과값을 비교해보자.   

```kotlin
internal class MainKtTest : BehaviorSpec({
    isolationMode = IsolationMode.InstancePerLeaf

    Given("given") {

        println("1")
        When("When1") {

            println("2")
            Then("Then1") {

                println("3")
            }
        }

        When("When2") {

            println("4")
            Then("Then2") {

                println("5")
            }
        }
    }
})
```

Output   

```
1
2
3
4
5
```

#### 4-2) InstancePerTest   

IsolationMode.InstancePerTest모드는 문맥이나 테스트 블록이 실행될 때마다 
테스트 케이스의 새 인스턴스를 만든다.   


Output   

```
1
1
2
1
2
3
1
4
1
4
5
```

#### 4-3) InstancePerLeaf   

IsolationMode.InstancePerLeaf는 하위 테스트만 새 인스턴스가 생성된다.     


```   
1
2
3
1
4
5
```

- - - 

## 5. Assertion    

kotest는 아주 풍부한 assertion을 제공하는데, 자세한 내용은 
[링크](https://kotest.io/docs/assertions/assertions.html)를 참고하자.   

자주 사용되는 assertion의 예시는 아래와 같다.   

```kotlin
internal class MainKtTest : StringSpec({

    val name = "kaven"
    val age = 30
    val tags = listOf<String>("aa", "bb", "cc")

    "일치 하는지" {
        name shouldBe "kaven"
    }

    "불일치 하는지" {
        name shouldNotBe  "mike"
    }

    "해당 문자열로 시작하는지" {
        name shouldStartWith "ka"
    }

    "해당 문자열을 포함하는지" {
        name shouldContain "ven"
    }

    "리스트에서 해당 리스트의 값들이 모두 포함되는지" {
        tags shouldContainAll listOf("aa", "bb")
    }

    "대소문자 무시하고 일치하는지" {
        name shouldBeEqualIgnoringCase "KAVEN"
    }

    "보다 크거나 같은지" {
        age shouldBeGreaterThanOrEqualTo 29
    }

    "문자열 길이가 같은지" {
        name shouldHaveSameLengthAs "abcde"
    }

    "문자열 길이" {
        name shouldHaveLength 5
    }

    "Chaining" {
        name.shouldStartWith("k")
            .shouldHaveLength(5)
            .shouldContainIgnoringCase("KAVEN")
    }
})
```     

Exception 발생하는지도 체크 가능하다.     

```kotlin
"ArithmeticException Exception 발생하는지" {
    val exception = shouldThrow<ArithmeticException> {
        1 / 0
    }

    exception.message shouldStartWith "/ by zero"
}

"어떤 Exception이든 발생하는지" {
    val exception = shouldThrowAny {
        1 / 0
    }

    exception.message shouldStartWith("/ by zero")
}
```   

아래처럼 test가 실패했을 때 더 자세한 단서를 남길 수 있다.   

```kotlin
"실패 케이스에 대해 힌트를 남길 수 있다." {

    withClue("이름은 kaven 이다.") {
        name shouldBe "mike"
    }
}
```

또는 아래와 같이 힌트를 남길 수도 있다.   

```kotlin
"실패 케이스에 대해 힌트를 남길 수 있다." {

    {"이름은 $name 이다."}.asClue {
        name shouldBe "mike"
    }
}
```

Output

```
이름은 kaven 이다.
expected:<"mike"> but was:<"kaven">
Expected :"mike"
Actual   :"kaven"
<Click to see difference>
```   


- - - 

**Reference**     

<https://techblog.woowahan.com/5825/>    
<https://www.youtube.com/watch?v=PqA6zbhBVZc>   
<https://jaehhh.tistory.com/118>     
<https://beomseok95.tistory.com/368>   

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

