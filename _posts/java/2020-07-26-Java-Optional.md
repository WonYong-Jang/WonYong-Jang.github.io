---
layout: post
title: "[Java] Optional 사용하여 NullPointException 처리"
subtitle: "java 8부터 지원하는 Optional 클래스"
comments: true
categories : Java
date: 2020-07-26
background: '/img/posts/mac.png'
---

## Optional이란?

개발을 할 때 가장 많이 발생하는 예외 중 하나가 바로 NPE(NullPointerException)이다. NPE를 
피하기 위해서는 null을 검사하는 로직을 추가해야 하는데, null 검사를 해야하는 변수가 많은 경우 
코드가 복잡해지고 로직이 상당히 번거롭다.

```java
List<String> names = getNames();
names.sort(); // names가 null이라면 NPE가 발생함
 
List<String> names = getNames();
// NPE를 방지하기 위해 null 검사를 해야함
if(names != null){
    names.sort();
}
```

`Java8부터 Optional<T> 클래스를 사용해 NPE를 방지할 수 있도록 도와준다. 
Optional<T>는 null이 올 수 있는 값을 감싸는 Wrapper 클래스로, NPE가 발생하지 않도록 
도와준다. Optional 클래스는 아래와 같은 value에 값을 저장하기 때문에 null이더라도 
바로 NPE가 발생하지 않으며, 클래스이기 때문에 각종 메소드를 제공해준다.`   

```java
public final class Optional<T> {
 
  // If non-null, the value; if null, indicates no value is present
  private final T value;   
  ...
}

```

- - -

## Optional 활용하기 


Optional은 Wrapper 클래스이기 때문에 빈 값이 올수도 있는데, 빈 객체는 아래와 같이 생성할 수 있다.   

```java
Optional<String> optional = Optional.empty();

System.out.println(optional); // Optional.empty
System.out.println(optional.isPresent()); // false
```

만약 어떤 데이터가 null이 올 수 있는 경우에는 해당 값을 Optional로 감싸서 
생성할 수 있다. 그리고 orElse 또는 orElseGet 메소드를 이용해서 값이 없는 경우라도 
안전하게 값을 가져올 수 있다.   

```java
// Optional의 value는 값이 있을 수도 있고 null 일 수도 있다.
// null 값이 들어온다면 Optional.empty이 들어가 있다.   
Optional<String> optional = Optional.ofNullable(user.getName()); 
String name = optional.orElse("anonymous"); // 값이 없다면 "anonymous" 를 리턴
```
- - -   

#### Optional 예시 1

기존에는 아래와 같이 null 검사를 한 후에 null일 경우에는 새로운 객체를 생성해주어야 했다. 
이러한 과정을 코드로 나타내면 다소 번잡해보이는데, Optional<T>와 람다를 이용하면 해당 과정을 
보다 간단하게 표현할 수 있다.   

```java
// Java8 이전
List<String> names = user.getNames();
List<String> tempNames = list != null ? list : new ArrayList<>();

// null인 경우 new ArrayList로 생성 
List<String> nameList = Optional.ofNullable(user.getList()).orElseGet(() -> new ArrayList<>());
```

#### Optional 예시 2

예를 들어 아래와 같은 우편번호를 꺼내는 null 검사 코드가 있다고 하자.   

```java
User user = getUser();
if (user != null) {
  Address address = user.getAddress();
  if (address != null) {
    String postCode = address.getPostCode();
    if (postCode != null) {
      return postCode;
    }
  }
}
return "우편번호 없음";
```

이러한 코드는 아래와 같이 Optional을 사용하면 아래와 같이 표현 가능하다.   

```java
// 위의 코드를 Optional로 펼쳐놓으면 아래와 같다.
Optional<UserVO> userVO = Optional.ofNullable(getUser());
Optional<Address> address = userVO.map(UserVO::getAddress);
Optional<String> postCode = address.map(Address::getPostCode);
String result = postCode.orElse("우편번호 없음");
 
// 그리고 위의 코드를 다음과 같이 축약해서 쓸 수 있다.
String result = userVO.map(UserVO::getAddress)
    .map(Address::getPostCode)
    .orElse("우편번호 없음");

```

#### Optional 예시 3 ( orElseThrow(..) )

예를 들어 아래와 같이 이름을 대문자로 변경하는 코드에서 NPE 처리를 해준다고 하자.   

```java
String name = getName();
String result = "";
 
try {
  result = name.toUpperCase();
} catch (NullPointerException e) {
  throw new CustomUpperCaseException();
```

위의 코드는 다소 번잡하고 가독성이 떨어지는데 이를 Optional을 활용하면 아래와 같이 표현할 수 있다.   

```java
Optional<String> nameOpt = Optional.ofNullable(getName());
String result = nameOpt.orElseThrow(CustomUpperCaseExcpetion::new).toUpperCase();
```


- - -

#### Optional의 orElse 와 orElseGet 차이 

Optional API의 단말 연산에는 orElse와 orElseGet함수가 있다. 비슷해 보이는 두 함수는 
엄청난 차이가 있는데, 해당 내용을 요약하면 아래와 같다.   

`- orElse : null이든 아니든 항상 호출된다.`     
`- orElseGet : null일 때만 호출된다.`    

Optional에 값이 있으면 orElse()부분은 실행된 값이 무시되고 버려진다. 따라서 orElse() 는 새 객체 생성이나 
새로운 연산을 유발하지 않고 이미 생성되었거나 이미 계산된 값일 때만 사용해야 한다!   


```java
public void findUserEmail() {
    String userEmail = "email";
    String result1 = Optional.ofNullable(userEmail).orElse(getUserEmail());
    System.out.println(result1);
 
    userEmail = "email";
    String result2 = Optional.ofNullable(userEmail).orElseGet(this::getUserEmail);
    System.out.println(result2);
}
 
private String getUserEmail() {
    System.out.println("getUserEmail() Called");
    return "userEmail@gmail.com";
}
// 출력
//getUserEmail() Called
//email

//email
```

`출력 결과를 분석해보면 orElse의 경우 값이 null이든 아니든 호출되어야 하므로 
뒤의 연산이 진행되어야 하며, 출력 결과를 통해 해당 함수가 호출되었음을 볼 수 있다.    
하지만 orElseGet의 경우에는 null일 때만 해당 연산이 진행 되므로 userEmail이 null이 
아니기 때문에 getUserEmail()이 호출되지 않았음을 확인할 수 있다. 또한 위의 코드에서 orElse의 
경우는 getUserEmail()을 매개변수로 사용하고, orElseGet은 this::getUserEmail을 매개변수로 
사용하고 있다. 그 이유는 orElse는 값을 취하고 orElseGet은 Supplier를 취하기 때문이다.`   


#### orElse 와 orElseGet에 의한 장애   

orElse와 orElseGet은 명확하고 중요한 차이점을 가지고 있는데, 차이점을 정확히 
인식하지 못하면 장애가 발생할 수 있다. 예를 들어 userEmail을 Unique한 값으로 갖는 
시스템에서 아래와 같은 코드를 작성하였다고 하자.   

```java
public void findByUserEmail_Wrong(String userEmail) {
    // orElse에 의해 userEmail이 이미 존재해도 유저 생성 함수가 호출되어 에러 발생
    return userRepository.findByUserEmail(userEmail)
            .orElse(createUserWithEmail(userEmail));
}
 
public void findByUserEmailDetail(String userEmail) {
    User newUser = createUserWithEmail(userEmail);
    return userRepository.findByUserEmail(userEmail).orElse(newUser);
}
 
private String createUserWithEmail(String userEmail) {
    User newUser = new User();
    newUser.setUserEmail(userEmail);
    return userRepository.save(newUser);
}

```

`위의 예제에는 Optional의 orElse를 사용하고 있기 때문에, 입력으로 들어온 userEmail을 사용중인 User를 
발견하더라도 해당 userEmail을 갖는 사용자를 생성하게 된다.` 보다 직관적으로 이해하기 위해 findByUserEmail 코드를 
자세하게 풀어쓰면 findByUserEmailDetail과 같다. 하지만 DB에서는 userEmail이 Unique로 설정되어 있기 때문에 
오류가 발생하게 된다. `그렇기 때문에 위와 같은 경우에는 해당 코드를 orElseGet으로 수정해야 한다.` 실제 서비스에서 
위와 같은 오류를 범한다면 큰 시스템 장애로 돌아오게 된다. 그렇기 때문에 orElse 와 orElseGet의 차이점을 정확하게 
이해하고 사용하는 것이 중요하다.     


- - -

**Reference**

[https://mangkyu.tistory.com/70](https://mangkyu.tistory.com/70)    

{% highlight ruby linenos %}


{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

