---
layout: post
title: "[Spring] UriComponentsBuilder와 RestTemplate 사용하기"
subtitle: "UriCompoentsBuilder와 RestTemplate 사용시 URL 인코딩 주의사항" 
comments: true
categories : Spring
date: 2021-02-17
background: '/img/posts/spring.png'
---

`URL 에는 사용할 수 있는 문자가 제한되어 있기 때문에 한글과 일부 특수문자, 
    공백 등의 문자들이 포함될 경우 반드시 인코딩을 해줘야 한다.`      

일반적으로 RestTemplate이나 브라우저 같은 클라이언트를 통할 경우 
자동으로 인코딩을 해주지만 몇몇 클라이언트에서 인코딩을 해주지 
않기 때문에 그때는 우리가 URL을 만들 때 인코딩을 미리 
해줘야 한다.    

POST 방식이라면 Content-Type 헤더에 charset을 직접 명시하던지 
HttpServletRequest.setCharacterEncoding()으로 문자셋을 
지정해주면 되고 GET 방식이라면 가장 기본적으로 아래와 같은 방법을 
사용할 수 있다.   

```java
StringBuilder uri = new StringBuilder("http://localhost:8080?param=");
uri.append(URLEncoder.encode("한글입니다만?", "UTF-8"));

System.out.println(uri.toString());

// Output
// http://localhost:8080?param=%ED%95%9C%EA%B8%80%EC%9E%85%EB%8B%88%EB%8B%A4%EB%A7%8C%3F   
```

그런데 위 방식은 뭔가 직관적이지 않고 queryString이 많아진다면 
코딩 실수도 많이 나올 것 같은 방식이다.   
`이를 위해 Spring에서는 UriComponentsBuilder 라는 모듈을 제공한다.`   
이를 사용할 경우 URL은 아래와 같이 생성하면 된다.   

```java
String uri2 = UriComponentsBuilder.fromHttpUrl("http://localhost:8080")
  .queryParam("param", "한글입니다만?")
  .toUriString();

System.out.println(uri2);
System.out.println(URLDecoder.decode(uri2, "UTF-8"));

// Output   
// http://localhost:8080?param=%ED%95%9C%EA%B8%80%EC%9E%85%EB%8B%88%EB%8B%A4%EB%A7%8C?
// http://localhost:8080?param=한글입니다만?   
```

이 방식은 코드가 더 직관적이라는 장점도 있지만 또 다른 장점은 
`인코딩 역시 자동으로 해준다는 점이다.`   
`위의 경우 "한글입니다만?"을 자동으로 UTF-8로 인코딩 해준다.`   

만약 인코딩 문자셋을 바꾸고 싶은 경우는 어떻게 해야 할까?   
위 코드에서 toUriString() 메소드 내부 구현을 보면, 내부적으로 
build().encode().toUriString()을 수행하고 encode()는 인자가 없을 경우 
UTF-8을 기본 문자셋으로 지정한다.     
이에 문자셋을 변경하고 싶다면 아래와 같이 풀어서 쓰면 된다.   

```java
String uri3 = UriComponentsBuilder.fromHttpUrl("http://localhost:8080")
                .queryParam("param", "한글입니다만?")
                .build()
                .encode(Charsets.toCharset("EUC-KR")) // 변경할 문자셋 입력  
                .toUriString();
```

`다만 RestTemplate 과 함께 사용할 경우 한가지 주의할 점이 있다.`   
`RestTemplate은 url을 지정할 때 URI 타입과 String 타입을 선택적으로 
적용할 수 있고, String타입일 때는 내부적으로 인코딩을 
수행하기 때문에 원치않게 인코딩이 중복으로 수행될 수 있다.`    
`그렇기 때문에 RestTemplate과 함께 사용한다면 인코딩 되지 않는 
String을 생성하던가 인코딩 완료된 URI를 생성해서 사용하면 된다.`     

인코딩 되지 않는 String을 생성한다면 아래와 같이 가능하다.   

> build 메소드에는 encode(false)를 호출한다. 즉, 인코딩을 해주지 않는다.   

```java
String uri4 = UriComponentsBuilder.fromHttpUrl("http://localhost:8080")
		.queryParam("param", "한글입니다만?")
		.build()  // 인코딩을 해주지 않는다.   
        .toUriString();

System.out.println(uri4);

// Output
// http://localhost:8080?param=한글입니다만?   
```

`위의 방식으로 해결할 수 있지만, RestTemplate은 내부적으로 charset을 ISO-8859-1 사용하기 때문에 
한글이 깨질 수 있으니 주의하자.`     
아래와 같이 RestTemplate 내부를 보면 Default charset이 ISO-8859-1인 것을 확인 할 수 있다.   
그렇기 때문이 restTemplate charset을 UTF-8로 변경하는게 추가로 필요하다.    

```java
public RestTemplate() {
    this.messageConverters.add(new ByteArrayHttpMessageConverter());
	this.messageConverters.add(new StringHttpMessageConverter());
...
}


public class StringHttpMessageConverter extends AbstractHttpMessageConverter<String> {

	private static final MediaType APPLICATION_PLUS_JSON = new MediaType("application", "*+json");

	/**
	 * The default charset used by the converter.
	 */
	public static final Charset DEFAULT_CHARSET = StandardCharsets.ISO_8859_1;
...
}
```

또는, `인코딩 완료된 URI 타입을 생성`한다면 아래와 같이 하면 된다.   

```java
URI uri5 = UriComponentsBuilder.fromHttpUrl("http://localhost:8080")
                .queryParam("param", "한글입니다만?")
                .build()
                .encode()
                .toUri();

System.out.println(uri5.toString());
System.out.println(URLDecoder.decode(uri5.toString(), "UTF-8"));

// Output
// http://localhost:8080?param=%ED%95%9C%EA%B8%80%EC%9E%85%EB%8B%88%EB%8B%A4%EB%A7%8C?
// http://localhost:8080?param=한글입니다만?
```

- - -
Referrence 

<https://findmypiece.tistory.com/176>   

{% highlight ruby linenos %}
{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

