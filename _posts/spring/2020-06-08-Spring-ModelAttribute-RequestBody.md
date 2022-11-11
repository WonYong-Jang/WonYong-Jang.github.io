---
layout: post
title: "[Spring] @RequestBody와 @ModelAttribute"
subtitle: "@RequestBody / @ModelAttribute 와 setter "
comments: true
categories : Spring
date: 2020-06-07
background: '/img/posts/spring.png'
---


## 1. ModelAttribute     

`@ModelAttribute는 사용자가 요청시 전달하는 값을 오브젝트 형태로 매핑해주는 어노테이션이다.`      
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
       <input type="text">
       <div>
         <button type="submit" class="btn btn-primary" id="btn-save">Search</button>
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





- - -
Referrence 

<https://minchul-son.tistory.com/546>    

{% highlight ruby linenos %}
{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}
