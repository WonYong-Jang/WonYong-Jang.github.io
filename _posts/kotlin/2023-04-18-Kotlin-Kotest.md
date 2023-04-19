---
layout: post
title: "[Kotlin] Kotest 테스트 코드 작성하기"     
subtitle: "Isolation Modes"    
comments: true
categories : Kotlin
date: 2023-04-18
background: '/img/posts/mac.png'
---

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

격리 모드(Isolation Modes)를 사용하면 테스트 엔젠이 테스트 케이스에 대한
인스턴스를 생성하는 방법을 제어할 수 있다.   

`IsolationMode라는 enum으로 제어할 수 있으며 SingleInstance, InstancePerLeaf, 
    InstancePerTest 값이 있다.`      

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

기본 격리 모드는 SingleInstance으로 Spec클래스 하나의 인스턴스가 생성된 다음 
모든 테스트가 완료될 때까지 각 테스트 케이스가 차례로 실행되는 방식이다.   

#### 4-2) InstancePerTest   



#### 4-3) InstancePerLeaf   



- - - 

**Reference**     

<https://jaehhh.tistory.com/118>     
<https://beomseok95.tistory.com/368>   

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

