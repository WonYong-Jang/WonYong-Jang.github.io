---
layout: post
title: "[Scala] 테스트 코드 작성하기"
subtitle: "scalatest, scalacheck, mockito scala / 단위 테스트를 하기 위한 구조 / singleton object mock 테스트"    
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
testImplementation group: 'org.scalatest', name: 'scalatest_2.12', version: '3.2.17'
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

scalatest에는 여러가지 스타일로 테스트를 작성할 수 있도록 제공하며, 
아래는 [FunSpec 스타일](https://alvinalexander.com/scala/scalatest-bdd-examples-describe-given-when-then-assert/)로 
작성했다.  

[공식문서](https://www.scalatest.org/user_guide/selecting_a_style)에서 더 많은 테스트 style 을 살펴보자.   

```scala 
import org.scalatest.funspec.AnyFunSpec

class NameServiceTest extends AnyFunSpec with Matchers {

  describe("NameServiceTest") {
    it("The name should be kaven") {

      val service = new NameService("kaven")

      service.printName() shouldBe "kaven"
    }
  }
}
```  

`위에서 describe 키워드는 하나의 테스트 집합이며, it 메소드는 하나의 테스트이고 여러 
테스트로 정의 가능하다.`    

- - - 

## 2. scalatest 기본 사용 방법    

scalatet 테스트 하기 위해 제공하는 여러 기능들에 대해 살펴보자.   

### 2-1) BeforeAndAfter   

`각 테스트 시작 전, 후에 실행될 메서드를 before, after 키워드로 정의할 수 있으며, 
    BeforeAndAfter trait를 상속받으면 된다.`  

> BeforeAndAfterAll trait도 제공하므로 참고하자.  

```scala
class NameServiceTest extends FunSpec with BeforeAndAfter  {

  before {
    println("before")
  }

  after {
    println("after")
  }
}
```

### 2-2) Pending 또는 Ignore 상태로 표기

각 테스트를 `pending 상태로 표기`해 둘 수 있다.   

```scala
it("The name should be kaven") (pending)
```

또는 아래와 같이 `해당 테스트를 disable` 시켜 둘 수 있다.   

```scala
ignore("The name should be kaven") {
    // ...
}
```

### 2-3) Testing expected exceptions

`exception을 테스트 하기 위해서 intercept 메서드를 이용하여 검증할 수 있다.`   

```scala
val service = new NameService()
val thrown = intercept[Exception] {
    service.printName()
}

assert("error" === thrown.getMessage)
```

- - - 

## 3. mock 을 이용한 단위 테스트   

scala에서 mock 테스트를 하기 위한 방법은 ScalaMock, EasyMock, JMock, Mockito 등을 이용 할 수 있으며, 
    자세한 내용은 [공식문서](https://www.scalatest.org/user_guide/testing_with_mock_objects#scalamock)를 참고하자.   

여기서는 [mockito](https://github.com/mockito/mockito-scala)를 이용한 단위테스트를 살펴 볼 것이며, 의존성을 추가해주자.     

```gradle
testImplementation group: 'org.mockito', name: 'mockito-scala_2.12', version: '1.16.23'
```

아래 예시는 NameService에서 ConfigService를 파라미터로 받아서 이름을 
출력하는 예이다.  

> 여기서 ConfigFactory는 외부에 있는 property를 읽어 올 수 있는 
클래스이며 아래 의존성을 추가 후 load 하여 사용할 수 있다.   

```gradle
implementation group: 'com.typesafe', name: 'config', version: '1.0.2'
```   

NameService를 테스트 할 때, ConfigService 외부 의존성이 있음을 확인 할 수 있다.   

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

`따라서 단위 테스트 진행을 할 경우 외부 의존성을 mocking 해야 하며,
     아래와 같이 가능하다.`    

> MockitoSugar 를 상속받아서 mock 키워드를 사용한다.   

```scala
class NameServiceTest extends AnyFunSpec with MockitoSugar with GivenWhenThen {

  describe("NameServiceTest") {
    it("The name should be kaven") {

      Given("Given in FunSpec BDD Test")

      When("When in FunSpec BDD Test")
      val configService = mock[ConfigService]

      when(configService.getConfig()).thenReturn("kaven")

      val service = new NameService(configService)

      Then("Then in FunSpec BDD Test")
      assert("kaven" === service.printName())
    }
  }
}
```

`이때 GivenWhenThen trait를 상속받아 BDD 스타일로 테스트를 작성할 수 있다.`   

> Given, When, Then, And 키워드를 사용할 수 있다.   

- - - 

## 4. singleton object 테스트 코드   

아래와 같이 singleton object를 사용한 경우 테스트 코드를 작성해보자.   

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

`object를 mocking하기 위해 mockito-scala에서 제공하는 withOjbectMocked 를 
사용하면 된다.`    

`단, withObjectMocked 를 활성화하기 위해 src/test/resources/mockito-extensions/org.mockito.plugins.MockMaker 파일을 
생성 후 아래 내용을 추가해 줘야 한다.`      

```
mock-maker-inline
```

그 후 아래와 같이 테스트 코드를 작성할 수 있다.   


```scala
class NameServiceTest extends AnyFunSpec with MockitoSugar with Matchers {

  describe("NameServiceTest") {

    it("The name should be kaven") {

      withObjectMocked[ConfigSupport.type] {

        val config = mock[Config]

        when(ConfigSupport.config).thenReturn(config)
        when(config.getString(anyString())).thenReturn("kaven")

        NameService.printName() shouldBe "kaven"
      }
    }
  }
}
```

- - - 

## 5. 단위 테스트 가능한 구조      

아래 예제의 경우 단위 테스트가 가능할까?   

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

이러한 경우 단위테스트가 불가능하진 않지만, 아래와 같이 리플렉션을 직접 
이용하여 단위 테스트 하는 등의 방식으로 진행해야 한다.   

```scala
class NameServiceTest extends AnyFunSpec with MockitoSugar with Matchers {

  describe("NameServiceTest") {

    it("The name should be kaven") {

      val mockConfig = mock[Config]
      when(mockConfig.getString("domain")).thenReturn("kaven")

      val nameService = NameService

      // Use reflection to override the config field with the mock
      val configField = nameService.getClass.getDeclaredField("config")
      configField.setAccessible(true)
      configField.set(nameService, mockConfig)

      val result = nameService.printName()
      result shouldBe "kaven"
    }
  }
}
```

따라서 코드를 작성할 때 [Dependency Injection](https://di-in-scala.github.io/) 로 디자인 하게 되면 
서비스 간에 loose coupling 을 향상시킬 수 있고, 테스트하기 쉬운 코드로 관리할 수 있게 된다.     

`아래와 같이 class 를 통해 로직들을 분리 함으로써 mocking이 가능해진다.`   

```scala
trait ConfigSupport {
  val config: Config = ConfigFactory.load()
}

// Config 를 생성사 또는 메서드 파라미터로 전달함으로써 mocking 이 가능해진다.   
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
import org.scalatestplus.mockito.MockitoSugar.mock

class NameServiceTest extends FunSpec {

  describe("NameServiceTest") {

    it("The name should be kaven") {
      val config = mock[Config]

      when(config.getString("domain")).thenReturn("kaven")

      val service = new NameServiceLogic(config)

      assert("kaven" === service.printName())
    }
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
class NameServiceTest extends FunSpec {

  describe("NameServiceTest") {
    it("The name should be kaven") {
      val configSupport = mock[ConfigSupport]
      val config = mock[Config]

      when(configSupport.config).thenReturn(config)
      when(config.getString("domain")).thenReturn("kaven")

      val service = new NameService(configSupport)

      assert("kaven" === service.printName())
    }
  }
}
```  

- - - 

## 6. ScalaCheck 함께 사용하기   

`scalacheck와 scalatest 모두 scala에서 테스트를 위한 라이브러리이며, 
    scalacheck는 property based testing 이다.`  

아래 의존성을 추가하면 되며, 
    [링크](https://www.baeldung.com/scala/scalacheck)를 통해 
    자세한 내용 확인해보자.

```gradle
// https://mvnrepository.com/artifact/org.scalacheck/scalacheck
testImplementation group: 'org.scalacheck', name: 'scalacheck_2.11', version: '1.15.2'
```

`테스트 하기 위한 Input data를 직접 정의하지 않고, random test data를 generate 해준다.`      

테스트를 진행하기 위한 메서드를 아래와 같이 생성하였다.   

```scala
case class User(username: String, age: Int)

trait UserDao {
  def save(user: User): Boolean
}

class UserService(userDao: UserDao) {
  def createUser(username: String, age: Int): Boolean = {
    val user = User(username, age)
    userDao.save(user)
  }
}
```

`ScalaCheckPropertyChecks trait를 상속받은 후 forAll 사용하면, 여러 random input data를 
생성하여 검증해 준다.`   

```scala
import org.mockito.Mockito.{verify, when}
import org.scalacheck.Arbitrary.arbitrary
import org.scalatest.FunSpec
import org.scalatest.Matchers.{be, convertToAnyShouldWrapper}
import org.scalatestplus.mockito.MockitoSugar.mock
import org.scalatestplus.scalacheck.ScalaCheckPropertyChecks

class UserServiceTest extends FunSpec with ScalaCheckPropertyChecks  {

  describe("UserServiceTest") {
    it("User should be saved successfully") {

      val mockUserDao = mock[UserDao]
      val userService = new UserService(mockUserDao)

      forAll(arbitrary[String], arbitrary[Int]) { (username, age) =>
        when(mockUserDao.save(User(username, age))).thenReturn(true)
        
        userService.createUser(username, age) should be (true)

        verify(mockUserDao).save(User(username, age))
      }
    }
  }
}
```

`User를 직접 전달 할 수도 있으며, 아래와 같이 각 필드에 대해서 Gen 키워드를 통해서 
random하게 생성해준다.`   

더 자세한 사용방법은 [링크](https://www.baeldung.com/scala/scalacheck)를 참고하자.   

```scala
import org.scalacheck.{Arbitrary, Gen}

class UserServiceTest extends FunSpec with ScalaCheckPropertyChecks  {

  describe("UserServiceTest") {
    it("User should be saved successfully") {

      val mockUserDao = mock[UserDao]
      val userService = new UserService(mockUserDao)

      implicit val userArbitrary: Arbitrary[User] = Arbitrary(
        for {
          username <- Gen.alphaStr
          age <- Gen.choose(0, 100)
        } yield User(username, age)
      )

      forAll { user: User =>
        when(mockUserDao.save(user)).thenReturn(true)

        userService.createUser(user.username, user.age) should be (true)

        verify(mockUserDao).save(user)
      }
    }
  }
}
```

Output

```
generated user: User(,84)
generated user: User(IdCoJoac,19)
generated user: User(XeWYkqajuxeB,1)
generated user: User(s,4)
generated user: User(rIabCyVFEWoWKjcDCgtdsoeTkn,11)
generated user: User(RabkPHymk,48)
generated user: User(YkRtusKeJwJuoUSzMXhZk,6)
generated user: User(dCvDImrKBemzwgjvlFapenZaeFXmLdomYXcWUhvEVijRsZ,71)
generated user: User(HjhZeugzXuzKxlUmIamQpHdOyYaDMMMfNxmdPKcTgAvnD,18)
generated user: User(OLNVDZbaY,14)
```

- - - 

**Reference**    

<https://www.baeldung.com/scala/scalacheck>    
<https://www.scalatest.org/scaladoc/3.0.7/org/scalatest/FunSpec.html>   
<https://www.scalatest.org/>    
<https://alvinalexander.com/scala/scalatest-bdd-examples-describe-given-when-then-assert/>   

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

