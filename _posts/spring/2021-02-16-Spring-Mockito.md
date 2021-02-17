---
layout: post
title: "[Spring] Spring Mockito"
subtitle: "유닛 테스트를 위한 Java Mocking framework"
comments: true
categories : Spring
date: 2021-02-16
background: '/img/posts/spring.png'
---

# Mockito 란? 

`Mockito란 Mock을 지원하는 프레임워크이며, Mock 객체를 쉽게 만들고 
관리하고 검증할 수 있는방법을 제공한다.   
Mock이란 진짜 객체와 비슷하게 동작하지만 프로그래머가 직접 그 객체의 행동을 
관리하는 객체이다.`    


- - - 

이제부터 예제를 하나씩 살펴 보자.   

## 1. mock()   

mock() 메소드는 mock 객체를 만들어서 반환한다. 예를 들어 아래와 같이 
커스텀 클래스를 하나 만들었다고 가정하자.   


```java
@Getter
@Setter
public class Person {

    private String name;
    private int age;
}
```

이제 mock() 메소드를 사용해 보자.   

```java
import static org.mockito.Mockito.mock;;

class PersonTest {
    
    @Test
    void example() {
        Person p = mock(Person.class);
        assertNotNull(p);
    }
}
```

위 처럼 mock()을 사용하면 손쉽게 mock 객체를 생성해낼 수 있다.   

- - - 

## 2. @Mock   

`mock() 메소드 외에도 mock 객체를 만들기 위해 @Mock 어노테이션을 
선언`하는 방법도 있다. 이 방법은 다음처럼 사용한다.   


```java
class PersonTest {

    @Mock Person p;

    @Test
    void example() {
        MockitoAnnotations.openMocks(this);
        assertNotNull(p);
    }
}
```

기존에 사용하던 MockitoAnnotations.initMocks(this)는 deprecated 되어 
openMocks를 사용하면 된다.   

- - - 

## 3. when()   

`특정 목 객체를 만들었다면 이 객체로부터 특정 조건을 지정할 수 있다. 
이때 사용하는 것이 when() 메소드이다.`      

```java
class PersonTest {

    @Test
    void example() {
        Person p = mock(Person.class);
        when(p.getName()).thenReturn("mike");
        when(p.getAge()).thenReturn(20);
        assertEquals("mike", p.getName());
        assertEquals(20,p.getAge());
    }
}
```

위 코드에서처럼 지정 메소드에 대해 반환해줄 값을 설정 할 수 있다.   
아래와 같이 더 복잡한 경우를 생각해보자. 다음과 같은 
getList()메소드가 아직 구현 전이거나 어떤 로직인지 확인이 안될 경우에도 
이 메소드를 이용해서 테스트를 할 수 있다.

```java
@Getter
@Setter
public class Person {

    private String name;
    private int age;

    public List<String> getList(String name, int age){
        // to do  ...
        return null;
    }
}
```

아래처럼 파라미터에 ArgumentMatchers를 이용한 anyString 과 
anyInt를 이용하여 어떤 string, int가 와도 메소드를 실행 할 수 있도록 
설정 했다. 그 후에 예상하는 결과값을 직접 생성해서 getList() 메소드가 
실제로 동작하는 것처럼 해서 테스트 할 수 있게 된다.   


```java
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;

Person p = mock(Person.class);
        when(p.getList(anyString(), anyInt()))
                .thenReturn(new ArrayList<>(Arrays.asList("a","b")));

List<String> result = p.getList("mike", 1);
System.out.println(result); // 출력 : [a, b]   
```

아래와 같이 특정 값을 넣어야 한다면 eq() 메소드를 활용 가능하다.   

```java
when(p.getList(eq("mike"), anyInt()))
```

- - - 

## 4. doThrow()   

만약 예외를 던지고 싶으면 doThrow() 메소드를 활용 가능하다. 

```java
class PersonTest {

    @Test
    void example() {
        Person p = mock(Person.class);

        doThrow(IllegalArgumentException.class).when(p).setName("mike");

        assertThrows(IllegalArgumentException.class, () ->{
            p.setName("mike");
        });
    }
}
```

- - - 

## 5. doNothing()   

void로 선언된 메서드에 when()을 사용하여 테스트 하고 싶은 경우는 doNoting()을 
사용한다.   

```java
    @Test
    void example() {
        Person p = mock(Person.class);

        doNothing().when(p).setName("mike");
        p.setName("mike");
        verify(p).setName("mike");
    }
```

verify() 메소드는 다음에서 설명한다.   

## 6. verify()   

verify()는 해당 구문이 호출 되었는지를 체크한다. 단순히 호출 뿐만 아니라 
횟수나 타임아웃 시간까지 지정해서 체크해 볼 수 있다.   

```java
class PersonTest {

    @Test
    void example() {
        Person p = mock(Person.class);

        p.setName("mike");
        // n번 호출했는지 호출
        verify(p, times(1)).setName(anyString()); // success
        // 호출 안했는지 체크
        verify(p, never()).getName(); // success
        verify(p, never()).setName(eq("kaven")); // success
        verify(p, never()).setName(eq("mike")); // fail

        // 최소한 1번 이상 호출했는지 체크
        verify(p, atLeastOnce()).setName(anyString()); // success
        // 2번 이하 호출 했는지 체크
        verify(p, atMost(2)).setName(anyString()); // success
        // 2번 이상 호출 했는지 체크
        verify(p, atLeast(2)).setName(anyString()); // fail
        // 지정된 시간(mills)안으로 메소드를 호출 했는지 체크
        verify(p, timeout(100)).setName(anyString()); // success
        // 지정된 시간(mills)안으로 1번이상 메소드를 호출 했는지 체크
        verify(p, timeout(100).atLeast(1)).setName(anyString()); // success
    }
}
```


- - - 

## 7. @InjectMocks   

만약 클래스 내부에 '다른 클래스'를 포함하는 경우엔 어떻게 테스트 해야 할까?    
그리고 이 '다른 클래스'로 로직을 점검해야 한다면 외부에서 주입할 수 있도록 
Setter 메서드나 생성자를 구현해야 할까?   

`mockito에서는 이런 경우등을 위해 @InjectMocks 어노테이션을 제공한다. @InjectMocks 
어노테이션은 @Mock이나 @Spy 어노테이션이 붙은 목 객체를 자신의 멤버 클래스와 
일치하면 주입시킨다.`        

예를 들어 다음과 같은 클래스들이 있다고 가정해보자.  

```java
public class AuthService{
    private AuthDao dao;
    // some code...
    public boolean isLogin(String id){
        boolean isLogin = dao.isLogin(id);
        if( isLogin ){
            // some code...
        }
        return isLogin;
    }
}
public class AuthDao {
    public boolean isLogin(String id){ //some code ... }
}
```

테스트 해보고 싶은 것은 AuthService의 isLogin() 메서드입니다. AuthDao.isLogin() 
    반환값에 따라서 추가 작업을 더 하고 있다. 따라서 이 메서드를 테스트 
    해보고 싶다면 AuthDao의 값도 조작해야 하는 상황이다.   
    다음 코드는 해당 상황을 mockito로 처리한 것이다.   





- - - 

## 8. @Spy   

`위에서 잠시 언급했지만 @Spy로 선언된 목 객체는 목 메서드(stub)를 별도로 
만들지 않는다면 실제 메서드가 호출된다. 또한 spy()로도 같은 효과를 낸다.`       

```java
Person p = spy(Person.class);
or
Person p = spy(new Person());
or
@Spy Person p;

```

- - -
Referrence 

<https://jdm.kr/blog/222>   
<https://www.crocus.co.kr/1556>   

{% highlight ruby linenos %}
{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

