---
layout: post
title: "[Web] SpringBoot와 Handlebars로 화면 만들기"
subtitle: "템플릿 엔진으로 화면 구성하기 / 부트스트랩과 jQuery"
comments: true
categories : Web
date: 2022-04-23
background: '/img/posts/mac.png'
---

Handlebars는 흔히 사용하는 Freemarker, Velocity와 같은 서버 템플릿 엔진이다.   
JSP는 서버 템플릿 역할만 하지 않기 때문에 JSP와 완전히 똑같은 역할을 한다고 볼 수는 없지만, 
    `순수하게 JSP를 View 용으로만 사용할때 똑같은 역할이라고 이해하면 된다.`    

결국 URL 요청시, 파라미터와 상태에 맞춰 적절한 HTML 화면을 생성해 전달하는 역할을 
하는것으로 보면 된다.   

> JSP, Freemarker, Velocity가 몇년동안 업데이트가 안되고 있어 사실상 SpringBoot에선 권장하지 
않는 템플릿 엔진이다.   

현재까지도 꾸준하게 업데이트 되고 있는 템플릿 엔진은 Thymeleaf, Handlebars이며 이 중 하나를 
선택하면 된다.   

Spring 진영에선 Thymeleaf를 밀고 있지만 개인적으로는 Handlebars를 추천한다.   

그 이유는 문법이 다른 템플릿 엔진보다 간단하고, 
    로직 코드를 사용할 수 없어 View의 역할과 서버의 역할을 명확하게 제한할 수 있다.   

템플릿에는 로직을 넣지 않는 것이 일반적이다. 로직을 넣으면 템플릿의 가독성이 떨어지고, 
    템플릿에서 오류가 발생했을 때 디버깅이 어렵다. 따라서 템플릿에 로직을 넣더라도 
    간단한 분기문, 배열, 반복문 정도만 사용하는 것이 좋다.   

또한, Handlebars.js와 Handlebars.java 2가지가 다 있어, 하나의 문법으로 
클라이언트 템플릿/서버 템플릿을 모두 사용할 수 있다.   

## 1. Handlebars 연동   

##### 의존성 추가 

```gradle   
implementation 'pl.allegro.tech.boot:handlebars-spring-boot-starter:0.3.4'
```

또한, IntelliJ에서 아래와 같이 Handlebars 플러그인을 설치하면 문법체크 등과 같이 
많은 지원을 받을 수 있다.   

<img width="900" alt="스크린샷 2022-04-21 오후 10 28 28" src="https://user-images.githubusercontent.com/26623547/164468443-b3675341-290b-4cac-ab40-fa3a935c4b6c.png">   


##### 메인 페이지 생성   

실제로 사용할 Handlebars 파일을 생성한다.   
`다른 서버 템플릿 스타터 패키지와 마찬가지로 Handlebars도 기본 경로는 
src/main/resources/templates가 된다.`    
`src/main/resources/templates에 main.hbs 파일을 생성한다.`   

```hbs
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Title</title>
</head>
<body>
<div>
    <div>
        <h2>Pharmacy Recommendation</h2>
    </div>
</div>
</body>
</html>
```

그 후 URL 요청시 main.hbs 파일이 호출할 수 있도록 Controller를 만든다.   

```java
@Controller
public class FormController {

    @GetMapping("/")
    public String main() {
        return "main";
    }
}
```

`handlebars-spring-boot-starter 덕분에 컨트롤러에서 문자열을 반환할 때 앞의 
path와 뒤의 파일 확장자는 자동으로 지정된다.`   

> prefix: src/main/resources/templates, suffix: .hbs     

즉 위에서 main을 반환하니, src/main/resources/templates/main.hbs로 전환되어 
View Resolver가 처리하게 된다.   

> ViewResolver는 URL 요청의 결과를 전달할 타입과 값을 지정하는 관리자 격으로 보면 된다.    

- - - 

## 2. 부트스트랩과 jQuery 연동    

CSS 개발시간을 최소화 하기 위해 오픈소스인 부트스트랩을 활용해보자.   



`부트스트랩, jQuery 등 프론트엔드 라이브러리를 사용할 수 있는 방법은 
크게 2가지가 있다.`   

하나는 외부 CDN을 사용하는 것이고, 다른 하나는 직접 라이브러리를 받아서 
사용하는 방법이다.   

CDN을 통한 방법이란 아래와 같다.   

<img width="892" alt="스크린샷 2022-04-23 오후 4 46 21" src="https://user-images.githubusercontent.com/26623547/164885499-d98ac2a3-77db-4644-8f36-dc6a93f95146.png">   

외부 서버를 통해 라이브러리를 받는 방식을 얘기한다.   
본인의 프로젝트에서 직접 다운받아 사용할 필요도 없고, 
    사용방법도 HTML/JSP/Handlebars에 코드만 한줄 추가하면 되니 굉장히 
    간단하다.   

하지만 이 방법은 실제 서비스에서는 잘 사용하지 않는다.   
`결국은 외부 서비스에 우리 서비스가 의존하게 되버려서, CDN을 서비스하는 곳에 
문제가 생기면 덩달아 같이 문제가 생기기 때문이다.`   

그래서 여기서 필요한 2개의 프론트엔드 라이브러리를 직접 다운받자.  

##### 2-1) 부트스트랩   

[부트스트랩](https://getbootstrap.com/) 에서 우측 상단의 Download를 클릭해서 다운받고 해당 폴더 안에 파일을 찾아 
아래와 같이 진행한다.   

- dist 폴더 아래에 있는 css 폴더에서 bootstrap.min.css를 src/main/resources/static/css/lib로 복사한다.   
- 마찬가지로 dist 폴더 아래에 있는 bootstrap.min.js를 src/main/resources/static/js/lib로 복사한다.   

##### 2-2) jQuery   

또한, [jQuery](https://jquery.com/download/) 에서 Download the compressed, production jQuery 3.6.0을 파일로 저장한다.   
그 후 해당 파일을 jquery-3.6.0.min.js를 jquery.min.js로 이름을 변경하고 src/main/resources/static/js/lib로 복사한다.  



<img width="500" alt="스크린샷 2022-04-24 오후 2 22 52" src="https://user-images.githubusercontent.com/26623547/164957912-a925f8bd-1f1c-419c-91b0-4104d5910f13.png">   

##### 2-3) main.hbs   

모든 작업이 끝나면 main.hbs파일에 아래와 같이 라이브러리를 추가한다.   

```hbs
<!DOCTYPE HTML>
<html>
<head>

    <!--부트스트랩 css 추가-->
    <link rel="stylesheet" href="/css/lib/bootstrap.min.css">
</head>
<body>
    ...

    <!--부트스트랩 js, jquery 추가-->
    <script src="/js/lib/jquery.min.js"></script>
    <script src="/js/lib/bootstrap.min.js"></script>
</body>
</html>
```

위에서 css와 js 호출 주소를 보면 "/" 로 바로 시작하는 것을 볼수 있다.      
`SpringBoot는 기본적으로 src/main/resources/static은 URL에서 "/" 로 지정된다.`   

`또한 여기서 주의깊게 살펴봐야할 부분은 css와 js의 선언 위치가 다르다는 점이다.`   
css는 head에, js는 body 최하단에 두었다.   
`이렇게 하는 이유는 페이지 로딩속도를 높이기 위함이다.`   

`HTML은 최상단에서부터 코드가 실행되기 때문에 head가 다 실행되고 나서야 body가 실행된다.`   
즉, head가 다 불러지지 않으면 사용자 쪽에선 백지 화면만 노출된다.   
`특히 js의 용량이 크면 클수록 body 부분의 실행이 늦어지기 때문에 
js는 body 하단에 두어 화면이 다 그려진 뒤에 호출하는 것이 좋다.`   

`반면 css는 화면을 그리는 역할을 하기 때문에 head에서 불러오는 것이 좋다.`  

> 추가로 부트스트랩의 경우 jquery가 꼭 있어야 하기 때문에 부트스트랩보다 먼저 호출되도록 코드를 작성했다.   
> 보통 위와 같은 상황을 부트스트랩이 jquery에 의존한다라고 한다.   



- - -
Referrence 

<http://bootstrapk.com/getting-started/>   
<http://jknack.github.io/handlebars.java/reuse.html>   
<https://mvnrepository.com/artifact/pl.allegro.tech.boot/handlebars-spring-boot-starter>   
<https://jojoldu.tistory.com/255?category=635883>   

{% highlight ruby linenos %}
{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

