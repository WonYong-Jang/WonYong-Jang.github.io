---
layout: post
title: "[Kotlin] Kotest를 이용하여 Mockk 테스트 하기"     
subtitle: "mockk, spyk, relaxed mock, mockkObject, coroutine, capturing, fixture"    
comments: true
categories : Kotlin
date: 2023-04-20
background: '/img/posts/mac.png'
---   

[이전글](https://wonyong-jang.github.io/kotlin/2023/04/18/Kotlin-Kotest.html)에서 kotest의 
test style과 assertion에 대해 살펴봤다.     
이번글에서는 kotest에서 mockk를 사용하여 
모킹 후 테스트 하는 방법을 자세히 살펴보자.    

- - - 

## 1. Mockk   

mocking 처리를 위해서 기존에는 Mockito를 주로 이용했지만, 코틀린에서는 
Mockk를 사용하는 것이 권장된다.   

```gradle
dependencies {
    testImplementation("io.mockk:mockk:{$MOCKK_VERSION}")
}
```

아래 예제를 확인해보자.   

```kotlin
interface PredictInterface {
    fun predict(memberId: Long): Order
}
```

```kotlin
data class Order(
    val orderId: Long
)

```

```kotlin
class PredictService(
    private val predictInterface: PredictInterface
) {
    fun predict(memberId: Long): Order {
        return predictInterface.predict(memberId)
    }
}
```

PredictService에는 고객이 고객센터로 문의하는 시점에, 기존에 주문 했던 주문 정보들 중 
어떠한 주문에 대해서 문의 할지 미리 예측하는 서비스를 가지고 있다.   

PredictInterface는 외부 api를 통해 제공된다고 가정하고, 다른 팀에서 아직 개발 중이라면 
우리는 이를 모킹을 통하여 테스트를 진행해야 할 것이다.   

아래와 같이 모킹을 하여 외부 api에 대해 예상 결과값을 지정(stub)하여 테스트를 할 수 있다.  

```kotlin
internal class MainKtTest : BehaviorSpec({

    // mock 객체 생성
    val predictInterface = mockk<PredictInterface>()
    val predictService = PredictService(predictInterface)

    Given("테스트에 필요한 값 준비") {
        val memberId = 1L

        val resultOrderId = 3L
        val resultOrder = Order(resultOrderId)

        When("1번 회원이 문의 했을 경우 예상 문의 주문건을 반환한다.") {

            // 외부 api에 대해 결과 값을 지정(stub)
            every { predictInterface.predict(memberId) } returns resultOrder

            // predict 실행
            val order = predictService.predict(memberId)

            Then("결과값 검증") {
                order.orderId shouldBe resultOrderId
                verify(exactly = 1) { predictInterface.predict(memberId) } // predict 메소드가 1번 호출 되었는지 확인 
            }
        }
    }
})
```

위와 같이 `every, verify 등 다양한 모킹 및 검증 함수를 제공`한다.  

#### 1-1) every   

Mock 객체를 생성 후 객체가 어떻게 동작할지 여러가지로 정의할 수 있다.   

```kotlin
every { predictInterface.predict() } returns resultOrder // 주문 정보 리턴   
every { predictInterface.predict() } throws Exception()  // Exception 발생   
every { predictInterface.predict() } just Runs           // Unit 함수 실행  
```

임의의 인자 값과 일치하도록 설정하려면 any()를 사용한다.   

```kotlin
every { predictInterface.predict(any()) } returns resultOrder
```

#### 1-2) verify   

verify는 메서드가 테스트 안에서 정상적으로 호출 되었는지를 검증할 때 사용하는 키워드 이다.   

```kotlin
verify(atLeast = 3) { predictInterface.predict() }
verify(atMost = 2) { predictInterface.predict() }
verify(exactly = 1) { predictInterface.predict() }
verify(exactly = 0) { predictInterface.predict() }
```


- - - 

## 2. Relaxed Mock 테스트    

every {...} 를 통해 매번 mock 처리를 하는 것은 번거로울 수 있다.   
mock 대상이 많거나 특별히 확인할 내용이 없다면 더욱 그럴 수 있다. 이러한 경우에 
relaxed mock을 이용하는 것이 좋다.   

`relaxed = true 옵션을 주게 되면 primitive 값들은 모두 0, false, "" 를 
반환하게 된다.`    
`또한 참조타입의 경우에는 chained mocks로 다시 relaxed mock 객체를 반환한다.`   

```kotlin
Given("테스트에 필요한 값 준비") {
    val memberId = 1L
    val resultOrder = mockk<Order>(relaxed = true)

    When("1번 회원이 문의 했을 경우 예상 문의 주문건을 반환한다.") {

        every { predictInterface.predict(memberId) } returns resultOrder

        val order = predictService.predict(memberId)

        Then("결과값 검증") {
            verify(timeout = 1) { predictInterface.predict(memberId) }
            order.orderId shouldBe resultOrder.orderId
        }
    }
}
```

## 3. 인자 캡처(capturing)   

`capturing은 mock 또는 spy 객체에 대해서 함수에 들어가는 파라미터 값을 가져와서 
검증하기 위해 사용하는 방법이다.`    
mockk에서는 slot과 capture 키워드를 이용하여 검증이 가능하다.   


```kotlin
Given("테스트에 필요한 값 준비") {
    val memberId = 1L
    val argumentSlot = slot<Long>() // capture 준비   
    val resultOrder = mockk<Order>(relaxed = true)

    When("1번 회원이 문의 했을 경우 예상 문의 주문건을 반환한다.") {

        // predict 파라미터를 캡처    
        every { predictInterface.predict(capture(argumentSlot)) } returns resultOrder

        val order = predictService.predict(memberId)

        Then("결과값 검증") {
            // 캡처 된 파라미터 가져오기   
            argumentSlot.captured shouldBe memberId
        }
    }
}
```

- - - 

**Reference**     

<https://www.baeldung.com/kotlin/mockk>   
<https://www.devkuma.com/docs/kotlin/kotlin-mockk-%EC%82%AC%EC%9A%A9%EB%B2%95/>    
<https://kapentaz.github.io/test/Kotlin%EC%97%90%EC%84%9C-mock-%ED%85%8C%EC%8A%A4%ED%8A%B8-%ED%95%98%EA%B8%B0/#>    

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

