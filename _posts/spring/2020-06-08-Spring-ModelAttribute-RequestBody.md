---
layout: post
title: "[Spring] @RequestBody와 @ModelAttribute"
subtitle: "@RequestBody / @ModelAttribute 와 setter / 생성자 유무에 따른 바인딩 실패"
comments: true
categories : Spring
date: 2020-06-07
background: '/img/posts/spring.png'
---


@RequestBody와 @ModelAttribute는 클라이언트 측에서 보낸 값을 오브젝트 형태로 매핑해줘서 
사용할 수 있도록 제공하는 공통점이 있다.   
하지만, 두 에노테이션은 큰 차이가 있기 때문에 특징 및 차이점에 
대해서 살펴보자.   

- - -

## 1. ModelAttribute     

`@ModelAttribute는 사용자가 요청시 전달하는 값을 오브젝트 형태로 바인딩(매핑)해주는 어노테이션이다.`      
`/check?name=kaven&age=1 같은 query string 형태 혹은 요청 본문에 삽입되어 있는 
form 형태의 데이터를 처리한다.`     

아래 코드와 같이 InputDto라는 클래스 안에 address 값을 매핑하기 위해 setter를 추가했다.    
`@ModelAttribute 사용시 주의할 점은 기본 생성자가 존재할 때는 반드시 setter가 있어야 바인딩이 된다.`   

```java
@Getter @Setter
public class InputDto {
    private String address;    
}
```

`단, 기본 생성자가 아닌 파라미터를 가진 생성자가 존재한다면 setter 없이 바인딩이 가능하다.`   
스프링 내부 구현체 중 ModelAttributeMethodProcessor 클래스의 constructAttribute 메서드에 해답이 있다.   

```java
protected Object constructAttribute(Constructor<?> ctor, String attributeName, MethodParameter parameter, WebDataBinderFactory binderFactory, NativeWebRequest webRequest) throws Exception {

    // 파라미터 개수 0인 기본생성자가 확인되면, 인스턴스를 생성하고 setter 메서드를 통한 바인딩을 시도한다.    
    if (ctor.getParameterCount() == 0) {
        // A single default constructor -> clearly a standard JavaBeans arrangement.
        return BeanUtils.instantiateClass(ctor);
    }

    // 그렇지 않는 경우 필드에 맞는 파라미터를 가진 생성자를 찾아 바인딩을 시도한다.   
    // A single data class constructor -> resolve constructor arguments from request parameters.
    String[] paramNames = BeanUtils.getParameterNames(ctor);
    Class<?>[] paramTypes = ctor.getParameterTypes();
    Object[] args = new Object[paramTypes.length];
    WebDataBinder binder = binderFactory.createBinder(webRequest, null, attributeName);
    String fieldDefaultPrefix = binder.getFieldDefaultPrefix();
    String fieldMarkerPrefix = binder.getFieldMarkerPrefix();
    boolean bindingFailure = false;
    Set<String> failedParams = new HashSet<>(4);

//...
```

즉, 아래와 같이 setter 없이 사용 가능하다.  

```java
@Getter
@AllArgsConstructor
public class InputDto {
    private String address;
}
```

그 이후 아래와 같이 address 값을 바인딩하여 우리가 원하는 객체(inputDto)로 변환해 준다.   


```java
@PostMapping("/search")
public ModelAndView postDirection(@ModelAttribute InputDto inputDto)  {

    ModelAndView modelAndView = new ModelAndView();
    modelAndView.setViewName("output");
    modelAndView.addObject("outputFormList",
            pharmacyRecommendationService.recommendPharmacyList(inputDto.getAddress()));

    return modelAndView;
}
```



```hbs
<form action="/search" method = "post">
       <input type="text" name="address">
       <div>
         <button type="submit">Search</button>
       </div>
</form>
```    

`쿼리 스트링 또는 form 형태로 데이터를 받기 때문에, 
    application/json 형식으로 받지 못한다.`   

아래와 같이 form테스트를 진행할 때 application/x-www-form-urlencoded 형식으로 
content type을 지정해야 정상적으로 전송된다.      


```java
mockMvc.perform(post("/search")
       .contentType(MediaType.APPLICATION_FORM_URLENCODED)
       .content("address="+address))
       .andExpect(status().isOk())
```


추가적으로 만약 아래와 같은 경우를 살펴보자.   

```java
@Getter @Setter
public class InputDto() {
  private String name;
  private String address;

  public RequestDto(String name) {
    this.name = name;
  }
}
```

위와 같은 경우에는 name을 받는 생성자를 통해 객체를 생성하고, setAddress를 통해 address 값을 바인딩하게 된다.   

`결론은 적절한 생성자를 먼저 찾고 그 뒤에 바인딩되지 않는 값을 setter를 통해 바인딩해주는 순서로 
@ModelAttribute는 동작한다.`    

- - - 

## 2. @RequestBody   

@ModelAttribute와 값을 바인딩한다는 관점에서는 동일하지만 이는 `HTTP Message Body(요청 본문)를 읽는 다는점에서 
다르다.`        

> Json 또는 XML를 HttpMessageConverter를 통해 파싱되어 객체로 변환   

대체로 Json을 통해 Rest api로 어플리케이션을 구성하게 된다면 가장 많이 쓰게 될 것이다.        

```java
@PostMapping("/search")
public String postDirection(@RequestBody InputDto inputDto)  {

    // ...
    return "success";
}
```

@RequestBody 내부 코드를 살펴보면, 여러 MessageConverter 중 
MappingJackson2HttpMessageConverter를 사용함을 확인할 수 있다.   

메서드를 타고 들어가다 보면 내부적으로 ObjectMapper를 통해 Json 값을 
자바 객체로 역직렬화 하는 것을 알 수 있다.    

`역직렬화란 리플렉션을 통해 객체를 구성하는 매커니즘이며, 리플렉션은 무조건 기본 생성자가 필요하다.`   

> Spring Data JPA 에서 Entity에서 기본 생성자가 필요한 이유도 동적으로 객체 생성 시 리플렉션을 활용하기 때문이다.   


`따라서, @RequestBody에 사용하려는 dto가 기본 생성자를 정의하지 않으면 데이터 바인딩에 
실패한다.`    


- - -
Referrence 

<https://minchul-son.tistory.com/546>    

{% highlight ruby linenos %}
{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}
