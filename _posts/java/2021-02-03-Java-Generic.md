---
layout: post
title: "[Java] 제네릭(Generic)과 와일드 카드(WildCard) 이해 "
subtitle: "공변(covariant), 불공변(invariant) / 한정적 와일드 카드(Bounded Wildcard), "    
comments: true
categories : Java
date: 2021-02-02
background: '/img/posts/mac.png'
---


이번 글에서는 공변과 불공변에 대해 살펴보고, 이후 제네릭과 와일드 카드에 
대해 알아보자.    

- - - 

## 1. 공변과 불공변    

제네릭과 와일드카드에 대해 이해하기 위해서 우리는 먼저 공변과 불공변에 대해 
알아야 한다.   
공변과 불공변은 각각 다음과 같다.   

```
- 공변(covariant): A가 B의 하위 타입일 때, T<A> 가 T<B>의 하위 타입이면 T는 공변    
- 불공변(invariant): A가 B의 하위 타입일 때, T<A>가 T<B>의 하위 타입이 아니면 T는 불공변   
```

`대표적으로 배열은 공변이며, 제네릭은 불공변`인데 이를 코드로 살펴보도록 하자.   
예를 들어 배열의 요소들을 출력하는 메서드가 있다고 하자.   
이때 우리가 변수의 선언 타입은 Integer로, 메서드의 파라미터 선언 타입은 
Object로 해두었다고 하자.   

```java
void genericTest() {
    Integer[] integers = new Integer[]{1, 2, 3};
    printArray(integers);
}

void printArray(Object[] arr) {
    for (Object e : arr) {
        System.out.println(e);
    }
}
```

위의 메서드는 정상적으로 실행 된다.   
`왜냐하면 배열은 공변이기 때문에 Integer가 Object의 하위 타입이므로 Integer[] 역시 
Object[]의 하위 타입이기 때문이다.`   

하지만 제네릭은 불공변이라서 제네릭을 사용하는 컬렉션을 보면 
다음의 코드는 컴파일 에러가 발생한다.   

```java
void genericTest() {
    List<Integer> list = Arrays.asList(1, 2, 3);
    printCollection(list);   // 컴파일 에러 발생
}


void printCollection(Collection<Object> c) {
    for (Object e : c) {
        System.out.println(e);
    }
}
```


Integer는 Object의 하위 타입이다.   
`하지만 제네릭은 불공변이므로 List<Integer>는 List<Object>의 하위 타입이 아니다.   
둘은 아무런 관계가 없다.`    
그래서 위의 코드를 실행하면 다음과 같은 컴파일 에러가 발생한다.      


```
java: incompatible types: java.util.List<java.lang.Integer> cannot be converted to java.util.Collection<java.lang.Object>
```

`이러한 제네릭의 불공변 때문에 와일드카드 (제네릭의 ?타입)가 등장할 수 밖에 
없는데, 제네릭부터 와일드 카드까지 살펴보도록 하자.`   

- - - 

## 2. 제네릭   


### 2-1) 제네릭 등장 이전   

제네릭은 JDK 1.5에 등장하였는데, 제네릭이 존재하기 전에 컬렉션의 요소를 
출력하는 메서드는 다음과 같이 구현할 수 있었다.   

```java
void printCollection(Collection c) {
    Iterator i = c.iterator();
    for (int k = 0; k < c.size(); k++) {
        System.out.println(i.next());
    }
}
```    

하지만 위와 같이 컬렉션의 요소들을 다루는 메서드들은 타입이 보장되지 
않기 때문에 문제가 발생하곤 했다.    
예를 들어 컬렉션이 갖는 요소들의 합을 구하는 메서드를 구현했다고 해보자.   

```java
int sum(Collection c) {
    int sum = 0;
    Iterator i = c.iterator();
    for (int k = 0; k < c.size(); k++) {
        sum += Integer.parseInt(i.next());
    }
    return sum;
}
```

문제는 위와 같은 메서드가 String 처럼 다른 타입을 갖는 컬렉션도 호출이 
가능하다는 점이다.   
`String 타입을 갖는 컬렉션은 컴파일 시점에 문제가 없다가 
런타임 시점에 메서드를 호출하면 에러가 발생하였다.`   
`따라서 자바 개발자들은 타입을 지정하여 컴파일 시점에 
안정성을 보장받을 수 있는 방법을 고안하였고, 그렇게 제네릭이 등장하게 되었다.`   

### 2-2) 제네릭 등장 이후    

제네릭이 등장하면서 컬렉션에 타입을 지정할 수 있게 되었고, 위의 
메서드를 다음과 같이 수정할 수 있게 되었다.   

```java
void sum(Collection<Integer> c) {
    int sum = 0;
    for (Integer e : c) {
        sum += e;
    }
    return sum;
}
```

이제는 다른 타입을 갖는 컬렉션이 위와 같은 메서드를 호출하려고 하면 
컴파일 에러를 통해 안정성을 보장 받을 수 있게 되었다.   

하지만 제네릭이 불공변이기 때문에 또 다른 문제가 발생하였는데,
printCollection처럼 모든 타입에서 공통적으로 사용되는 메서드를 
만들 방법이 없는 것이다.
`printCollection의 타입을 Integer에서 Object로 변경하여도 제네릭이 
불공변이기 때문에 Collection<Object>는 Collection<Integer>의 하위타입이 
아니므로 컴파일 에러가 발생하는 것이다.`      

이러한 상황은 오히려 제네릭이 등장하기 이전보다 실용성이 떨어졌기 때문에, 
    와일드카드라는 타입이 추가되었다.  


- - - 

## 3. 와일드 카드    

제네릭이 등장했지만 오히려 실용성이 떨어지는 상황들이 생기면서, `모든 타입을 
대신할 수 있는 와일드카드 타입<?>을 추가하였다.`   

`와일드카드는 정해지지 않은 unknown type이기 때문에 Collection<?>로 
선언함으로써 모든 타입에 대해 호출이 가능해졌다.   

그래서 제네릭의 활용성을 높일 수있게 되었는데, 여기서 
중요한 것은 와일드카드가 any type이 아닌 unknown type이라는 점이다.   

```java
void printCollection(Collection<?> c) {
    for (Object e : c) {
        System.out.println(e);
    }
}
```

와일드 카드로 선언된 타입은 unknown type이기 때문에 다음과 같은 
경우에 문제가 발생하였다.   

```java
void genericTest() {
    Collection<?> c = new ArrayList<String>();
    c.add(new Object()); // 컴파일 에러
}
```

컬렉션의 add로 값을 추가하려면 제네릭 타입인 E 또는 E의 자식을 
넣어줘야 한다.   
그런데 와일드카드는 unknown type이므로 Integer, String 또는 
개발자가 추가한 클래스까지 될 수 있기 때문에 범위가 무제한이다.   
와일드 카드의 경우 add로 넘겨주는 파라미터가 unknown 타입의 
자식이여야 하는데, 정해지지 않았으므로 어떠한 타입을 대표하는지 알 수 
없어서 자식 여부를 검사할 수 없는 것이다.   



결국 이러한 상황이 생기는 것은 와일드 카드가 any 타입이 아닌 unknown 타입이기 때문이다.    






- - - 

**Reference**    

<https://mangkyu.tistory.com/241>    

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

