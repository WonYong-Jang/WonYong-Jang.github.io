---
layout: post
title: "[Java] 상속 "
subtitle: "super, 다이나믹 메소드 디스패치, 추상클래스, final 키워드, Object 클래스"
comments: true
categories : Java
date: 2020-12-21
background: '/img/posts/mac.png'
---

## 목표

자바의 상속에 대해 학습하세요.   

## 학습할 것 

- 자바 상속의 특징
- super 키워드
- 메소드 오버라이딩
- 다이나믹 메소드 디스패치(Dynamic Method Dispatch)   
- 추상 클래스    
- final 키워드    
- Object 클래스   

- - -

## 1. 자바의 상속( extends ) 

현실 세계에서 부모님이 자식들에게 재산을 물려주는 것과 비슷하다. 차이라고 하면 
자식(클래스)이 상속받고 싶은 부모(클래스)를 선택해서 물려받는다. 이때 상속받는 
클래스를 자식 클래스, 하위클래스 또는 서브 클래스라고 부른다. 상속을 해주는 
클래스를 부모 클래스, 상위 클래스 또는 슈퍼 클래스라고 한다.   

#### 1-1) 상속의 대상    

자식 클래스가 부모 클래스로부터 상속을 받게 되면 부모 클래스의 필드와 메서드를 물려받게 된다. 
`단, 접근 제어자가 private을 갖는 필드나 메소드는 상속이 불가하고, 패키지가 다를 경우 접근제어자가 
default인 경우도 상속이 불가하다.`   

#### 1-2) 상속의 특징   

`자바에서는 자식 클래스가 여러 부모로부터 다중 상속을 받는 것은 불가능하다.`    
1개의 부모 클래스로부터 단일 상속만 허용된다. 하지만 부모 클래스는 여러개의 자식 클래스에게 
상속이 가능하다.   

- - - 

## 2-1. super() 키워드    

this() 키워드는 자기 자신의 생성자를 호출하는 키워드라면 super() 는 자신의 부모 클래스의 생성자를 
호출하는 키워드이다.    
바로 윗 단계의 부모 클래스 뿐 아니라 부모의 부모 또 부모의 부모 클래스의 생성자를 모두 호출한다.   

아래와 같이 예제를 보자.   
School -> Teacher -> Student 순으로 상속을 주고 받는다. Teacher 클래스는 School에게 상속받고 Student 클래스는 
Teacher클래스에게 상속받으므로 Student 클래스틑 School 클래스의 자원 역시 사용 할 수 있는 자식 클래스이다.   

```java
public class Student extends Teacher
public class Teacher extends School
public class School
```

```java
public class School{
    public School() {
        System.out.println("school");
    }
}

public class Teacher extends School {
    public Teacher() {
        System.out.println("teacher");
    }
}

public class Student extends Teacher {

    public Student() {
        super(); // 
        System.out.println("student");
    }
}
```

super() 로 인해서 Student의 브모클래스의 생성자인 Teacher클래스의 생성자가 호출된다. 그렇지만 super는 조상의 
조상클래스까지 확인하는 키워드라 Teacher클래스가 상속받는 클래스가 있는지 확인한다. School 클래스까지 확인하고 
더이상 상속받는 클래스가 없으므로 School 클래스의 생성자부터 실행하고 Teacher 클래스 생성자를 실행 후 
Student 클래스로 돌아온다. 
결과는 아래와 같이 출력된다. 

```
// 호출 결과 
school
teacher
student
```


## 2-2. super 키워드 

this 가 자기자신의 멤버필드를 사용할 때 객체를 생성하지 않고 접근할 수 있는 키워드 였다면 
super는 자신의 부모의 멤버필드에 접근하는 키워드이다. 


## 3. 메소드 오버라이딩   

상속을 받으면 부모클래스의 멤버 변수 뿐 아니라 메소드도 가져오는데 이때 메소드를 재정의 하는 것이다.   
메소드 오버라이딩 조건은 아래와 같다.   

- 호출하고자 하는 메소드는 부모 클래스에 존재해야 한다.   
- 메소드 명은 동일해야 한다.   
- 매개변수와 타입이 같아야 한다.   
- 반환 타입도 같아야 한다.   
- 접근제어자는 부모클래스에 정의된 것 보다 넓거나 같아야 한다.   



- - - 

**Reference**

[https://commin.tistory.com/101](https://commin.tistory.com/101)   
[https://blog.naver.com/heartflow89/220960019390](https://blog.naver.com/heartflow89/220960019390)     
[https://github.com/whiteship/live-study/issues/6](https://github.com/whiteship/live-study/issues/3)        

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

