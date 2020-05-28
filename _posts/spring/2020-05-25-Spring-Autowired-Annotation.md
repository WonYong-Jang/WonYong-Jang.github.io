---
layout: post
title: "[Spring] @Autowired를 이용한 DI"
subtitle: "Autowired, Qualifier 어노테이션"
comments: true
categories : Spring
date: 2020-05-25
background: '/img/posts/spring.png'
---

## Autowired란? 

`어노테이션을 부여하면 IoC컨테이너 안에 존재하는 Bean을 자동으로 주입해주게 된다.`   

- - -

### XML설정파일-> Autowired 어노테이션 변경

**XML설정파일에서 Property로 설정했던 Bean 제거**   
[예제소스 링크](https://wonyong-jang.github.io/spring/2020/05/18/Spring-Dependency-Injection.html)   
> setter를 이용하여 exam 객체를 주입했던 부분 주석처리 
<img width="466" alt="스크린샷 2020-05-25 오후 11 42 03" src="https://user-images.githubusercontent.com/26623547/82823109-eda40100-9ee1-11ea-9900-62d886ee34ff.png">   

> GridExamConsole.java 에서 setter에 Autowired 삽입   
<img width="287" alt="스크린샷 2020-05-25 오후 11 49 21" src="https://user-images.githubusercontent.com/26623547/82823434-85a1ea80-9ee2-11ea-931a-bb7d210028da.png">   

> 반드시 아래 XML 설정에 추가  

```
<context:annotation-config/>   <!-- context 네임스페이스 추가 후 사용 할 것 -->
```

`annotation-config 설정은 Application Context안에 이미 등록된 빈들의 어노테이션을 활성화를 위해 사용된다. (그것들이 XML로 등록되었는지 
         패키지스캐닝을 통해 등록되었는지는 중요하지 않다.)`    
**Application Context에의해 생성되어 저장된 Bean의 내부를 살펴보면서 @Autowired, @Qualifier 등의 어노테이션을 해석할 거라는 뜻**   

- - -

### Autowired 어노테이션 모호성 

`Autowired는 타입을 찾아 DI하는데 만약 동일한 타입을 가진 빈 객체가
 존재 한다면 어떤 빈 객체를 주입해야 할지 알 수 없어서 IoC 컨테이너를 초기화하는 
 과정에서 익셉션을 발생 시킨다.`   

> 동일한 타입의 bean 존재 
<img width="613" alt="스크린샷 2020-05-26 오후 10 11 02" src="https://user-images.githubusercontent.com/26623547/82904724-d1659a00-9f9d-11ea-9ab8-8b46ef619fec.png">   

> 변수명과 id를 맵핑시켜서 해결할 수 있지만 변수명을 자꾸 변경하는 것보다 Qualifier 권장   
<img width="292" alt="스크린샷 2020-05-26 오후 9 46 10" src="https://user-images.githubusercontent.com/26623547/82902378-55b61e00-9f9a-11ea-81af-292a8dc9a645.png">

> Qualifier 어노테이션을 이용하여 동일한 타입에 대하여 맵핑하여 해결  
<img width="282" alt="스크린샷 2020-05-26 오후 9 26 15" src="https://user-images.githubusercontent.com/26623547/82900829-0ff85600-9f98-11ea-9df1-2e0818dd06ef.png">

#### Autowired 의존 객체 찾는 순서!!

`1. 처음은 무조건 타입이 같은 빈 객체를 검색한다. 한개면 그 빈 객체를 사용한다. Qualifier가 명시되어 있을 경우, 
    Qualifier와 같은 값을 갖는 빈 객체여야 한다.`   
`2. 타입이 같은 빈 객체가 두 개 이상 존재하면, Qualifier로 지정한 빈 객체를 찾는다. 존재하면, 그 객체를 사용한다.`   
`3. 타입이 같은 빈 객체가 두 개 이상 존재하고 Qualifier가 없을 경우, 이름이 같은 빈 객체를 찾는다. 존재하면, 그 
객체를 사용한다.`   

> 스프링 버전 3.2.3 까지는 동일 타입의 빈 2개 이상 있을 경우는 무조건 에러 발생!

- - -

### Autowired DI 3가지 방법

Autowired 어노테이션은 의존하는 객체를 자동으로 삽입해주며 필드, 생성자, 메서드 세 곳에 
적용이 가능하다.   

##### 1. Field Injection

기본생성자를 생성하면서 Injection이 된다.   
`주의할 점은 기본생성자를 통해서 Injection되기 때문에 기본생성자가 없고 
오버로딩 생성자만 존재한다면 에러가 발생한다!`   

<img width="330" alt="스크린샷 2020-05-26 오후 10 46 17" src="https://user-images.githubusercontent.com/26623547/82911017-53f25780-9fa6-11ea-9034-548286b0530d.png">   

##### 2. Construction Injection

오버로딩 생성자를 생성하면서 Injection이 된다.   
`Qualifier를 파라미터에 써주는 이유는 파라미터가 여러개가 나올수 있기 때문에 
생성자 위에 선언해주면 에러가 발생한다.`   

<img width="450" alt="스크린샷 2020-05-26 오후 11 09 23" src="https://user-images.githubusercontent.com/26623547/82911033-5a80cf00-9fa6-11ea-8ee8-e5ad99c47f20.png">   

##### 3. Setter Injection

Setter 메소드를 통해서 Injection이 된다. 

<img width="295" alt="스크린샷 2020-05-26 오후 11 11 24" src="https://user-images.githubusercontent.com/26623547/82911325-b64b5800-9fa6-11ea-8122-39681169078d.png">

---

##### Option

**주의 : Autowired에 일치하는 타입이 없거나 Qualifier에 지정한 값이 IoC 컨테이너에 존재하지 않으면 컨테이너 생성 익셉션 에러 발생한다. 이를 위해 옵션이 존재하며, 
required 값을 true나 false 로 줄 수 있다.(default 는 true)**
```
// DI에 필요한 객체가 무조건 bean에 등록되어있어야 한다.
@Autowired(required = true)

// bean등록이 안되어 있어도 오류가 나지않고 인스턴스를 만들어준다.
@Autowired(required = false)
```

---

Reference   

[http://www.newlecture.com](http://www.newlecture.com)   


{% highlight ruby linenos %}
{% endhighlight %}

{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

