---
layout: post
title: "[Scala] 테스트 코드 작성하기"
subtitle: "scalatest 셋팅 / 단위 테스트를 하기 위한 구조 / singleton object mock 테스트"    
comments: true
categories : Scala
date: 2023-09-25
background: '/img/posts/mac.png'
---

이번 글에서는 scala 를 사용하면서 
테스트 코드를 작성하기 위한 환경을 구성해보고, 
    mocking을 이용한 단위 테스트를 작성해보자.   

- - - 


## 1. scala test 환경 구성   

scalatest 의존성을 추가하고 기본적인 단위 테스트를 진행해보자.   

```gradle
testImplementation group: 'org.scalatest', name: 'scalatest_2.11', version: '2.1.3'
```

아래와 같이 NameService 클래스를 생성 후 테스트를 위한 
NameServiceTest 클래스를 생성한다.   


```scala
class NameService(name: String) {

  def printName(): String = {
    name
  }
}
```

```scala  
import org.scalatest.FunSpec
class NameServiceTest extends FunSpec {

  describe("NameServiceTest") {
    val service = new NameService("kaven")

    assert("kaven" == service.printName())
  }
}
```

- - - 

## 2. mock 을 이용한 단위 테스트   

scala에서 mock 테스트를 하기 위한 방법은 ScalaMock, EasyMock, JMock, Mockito 등을 이용 할 수 있으며, 
    자세한 내용은 [공식문서](https://www.scalatest.org/user_guide/testing_with_mock_objects#scalamock)를 참고하자.   

아래는 mockito를 이용한 단위테스트 예시이다.   

```gradle
testImplementation group: 'org.scalatestplus', name: 'mockito-3-4_2.11', version: '3.2.9.0'
```

이번에는 NameService에서 ConfigService를 파라미터로 받아서 이름을 
출력하는 예이다.  

> 여기서 ConfigFactory는 외부에 있는 property를 읽어 올 수 있는 
클래스이며 아래 의존성을 추가 후 load 하여 사용할 수 있다.   

```gradle
implementation group: 'com.typesafe', name: 'config', version: '1.0.2'
```

`따라서 단위 테스트 진행을 할 경우 외부 의존성을 mocking해야 하며,
     아래와 같이 가능하다.`      

```scala
class ConfigService {

  def getConfig(): String = {
    val config: Config = ConfigFactory.load()
    config.getString("domain")
  }
}


class NameService(config: ConfigService) {

  def printName(): String = {
    config.getConfig()
  }
}
```


```scala
import org.mockito.Mockito.when
import org.scalatest.FunSpec
import org.scalatest.mock.MockitoSugar

class NameServiceTest extends FunSpec with MockitoSugar {

  describe("NameServiceTest") {

    val configService = mock[ConfigService]

    when(configService.getConfig()).thenReturn("kaven")

    val service = new NameService(configService)

    assert("kaven" === service.printName())
  }
}

```

- - - 

## 3. singleton object 테스트 코드   

아래와 같이 singleton object를 사용하여 mocking 테스트가 가능할까?

```scala
trait ConfigSupport {
  val config: Config = ConfigFactory.load()
}

object NameService extends ConfigSupport {

  def printName(): String = {
    config.getString("domain")
  }
}
```

또는 ConfigSupport가 object로 구성되어 아래와 같이 외부 dependency가 
있는 메서드를 mocking 테스트가 가능할까?   

`scala 에서 많은 singleton object 를 생성하여 아래와 같이 코드를 작성한다면 
외부 의존성(외부 api, 라이브러리 등)을 mocking 하지 못하여 
단위테스트가 불가능해질 것이다.`   

> scala object는 생성자를 가질 수 없다.    

```scala
object ConfigSupport {
  val config: Config = ConfigFactory.load()
}

object NameService {

  def printName(): String = {
    ConfigSupport.config.getString("domain")
  }
}
```   

따라서 object 를 사용할 때 단위 테스트가 가능한 구조로 작성 해야 한다.   

`아래와 같이 class 를 통해 로직들을 분리 함으로써 mocking이 가능해진다.`   

```scala
trait ConfigSupport {
  val config: Config = ConfigFactory.load()
}

class NameServiceLogic(config: Config) {

  def printName(): String = {
    config.getString("domain")
  }
}

object NameService extends ConfigSupport {

  val logic = new NameServiceLogic(config)
  def printName(): String = logic.printName()
}
```

`class로 로직을 분리했기 때문에 외부 의존성인 Config 클래스를 mocking 및 stubbing이 
가능해진 것을 확인 할 수 있다.`   

```scala
import com.typesafe.config.{Config, ConfigFactory}
import org.mockito.Mockito.when
import org.scalatest.FunSpec
import org.scalatest.mock.MockitoSugar

class NameServiceTest extends FunSpec with MockitoSugar {

  describe("NameServiceTest") {

    val config = mock[Config]

    when(config.getString("domain")).thenReturn("kaven")

    val service = new NameServiceLogic(config)

    assert("kaven" === service.printName())
  }
}
```

`또한, singleton object를 사용할 때 trait 또는 class를 이용하여 companion object를 
만들어 파라미터로 사용하게 되면 mocking 하여 
테스트 하기 좋은 구조가 된다.`   

```scala
trait ConfigSupport {
  val config: Config = ConfigFactory.load()
}

object ConfigSupport extends ConfigSupport {

}

class NameService(configSupport: ConfigSupport) {

  def printName(): String = {
    configSupport.config.getString("domain")
  }
}
```

```scala
class NameServiceTest extends FunSpec with MockitoSugar {

  describe("NameServiceTest") {

    val configSupport = mock[ConfigSupport]
    val config = mock[Config]

    when(configSupport.config).thenReturn(config)
    when(config.getString("domain")).thenReturn("kaven")

    val service = new NameService(configSupport)

    assert("kaven" === service.printName())
  }
}
```

- - - 

**Reference**    

<https://www.scalatest.org/scaladoc/3.0.7/org/scalatest/FunSpec.html>   
<https://www.scalatest.org/>   

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

