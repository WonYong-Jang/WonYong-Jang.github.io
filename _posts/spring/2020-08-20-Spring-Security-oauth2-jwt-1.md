---
layout: post
title: "[Spring] Spring Security + OAuth2 + JWT 를 이용한 소셜로그인 1"
subtitle: "Spring Boot에서 Oauth2 + JWT 이용한 Google 로그인"
comments: true
categories : Spring
date: 2020-08-20
background: '/img/posts/spring.png'
---

## 1. Intro

`스프링 시큐리티는 강력한 인증과 인가 기능을 가진 프레임워크이다. 인터셉터나 
필터를 이용해 구현하는 것보다 시큐리티를 이용하는 것을 권장한다.`      

> 또한 많은 서비스에서 로그인 기능을 id/password 방식보다는 구글,페이스북, 네이버 
로그인과 같은 소셜 로그인 기능을 사용한다. OAuth를 이용 했을 경우 
로그인 시 보안, 비밀번호 찾기, 비밀번호 변경, 회원가입 시 이메일 혹은 전화번호 인증,
 회원정보 변경 등을 맡기면 되니 서비스 개발에 집중이 가능하다!

> 이 글은 맨 아래 Referrence를 참고하였으며, Spring boot와 MongoDB 기반으로 진행 하였다.  

- - -

## 2. Project Structure  

<img width="700" alt="스크린샷 2020-08-18 오후 8 36 01" src="https://user-images.githubusercontent.com/26623547/90641302-0b2c0100-e26c-11ea-93c1-c0b8601c2f5d.png">

- 위는 전체 클래스이며, 주요 클래스 먼저 확인 후 전체 Flow를 확인 해보자.

## 3. Dependency

```gradle
compile 'org.springframework.boot:spring-boot-starter-oauth2-client'
compile group: 'io.jsonwebtoken', name: 'jjwt', version: '0.9.1'
```

- - - 

## 4. 구글 서비스 등록 

[https://console.cloud.google.com](https://console.cloud.google.com) 접속하여 구글 서비스를 등록한다.    
`여기서 승인된 리다이렉션 URL은 서비스에서 파라미터로 인증 정보를 주었을 때 
인증이 성공하면 구글에서 리다이렉트할 URL을 말한다.`    
`스프링 부트 2 버전의 시큐리티에서는 기본적으로 {도메인}/login/oauth2/code/{소셜서비스코드}로 
리다이렉트 URL을 지원하고 있다. 따라서 사용자가 별도로 리다이렉트 URL을 
지원하는 Controller를 만들 필요가 없다! 시큐리티에서 이미 구현해 놓은 
상태이다.`   

<img width="700" alt="스크린샷 2020-08-23 오후 3 02 34" src="https://user-images.githubusercontent.com/26623547/90972190-dcef3f80-e551-11ea-950f-7d87eabe6e37.png">   


> ex) http://localhost:8080/login/oauth2/code/google   
> 서버에 배포 하게되면 localhost 외에 추가로 주소를 추가해야한다.   

#### 4-1. application-auth.properties

`위 과정에서 확인한 Client ID 와 Secret key를 application-auth.properties에 등록 후 
.gitignore에 등록한다.`   

> application.properties

```properties
spring.profiles.include=auth   // application-auth.properties 포함
```

> application-auth.properties

```
spring.security.oauth2.client.registration.google.client-id={직접 작성}
spring.security.oauth2.client.registration.google.client-secret={직접 작성}
spring.security.oauth2.client.registration.google.scope=email,profile
# spring.security.oauth2.client.registration.google.redirectUri={baseUrl}/login/oauth2/code/google
```

- `scope는 로그인 성공 후 제 도메인에서 구글에 요청할 사용자 정보이다. email, profile을 선언했으므로 
이제 제 도메인에서 google 사용자의 email과 profile 정보를 사용할 수 있다.`   

- redirectUri는 사용자가 구글에서 Authentication을 성공 후 authorization code를 전달할 제 도메인의 endPoint 이다. 

- Spring Security에서는 google의 default redirectUri로 /login/oauth2/code/google 를 제공하기 때문에 주석처리 하였고 
네이버 같이 default로 제공해주지 않는다면 반드시 전부 명시해 주어야 한다.   



## 5. JWT Configuration

> application-auth.properties

```
app.auth.tokenSecurity={직접 작성}
app.auth.tokenExpirationMsec=864000000
app.oauth2.authorizedRedirectUris[0]=http://localhost:3000/oauth2/redirect
```

<img width="800" alt="스크린샷 2020-08-23 오후 3 02 16" src="https://user-images.githubusercontent.com/26623547/90972192-dfea3000-e551-11ea-9953-a0915099debe.png">     


- TOKEN SECRET : JWT Token 을 hash 할 때 사용하는 secret key이다. 

- EXPIRATION MSEC : JWT Token의 유효기간을 설정한다. 유효기간이 만료된 TOKEN으로 
접근시 재발급 process를 거치게된다.   

- authorizedRedirectURis : 생성된 JWT Token을 response 할 uri를 입력한다. 여기서는 
localhost:3000으로 실행되는 react App으로 전달하였고 배열형식으로 여러개를 정의 할 수 있다. 
이곳에 정의된 redirectUri외에는 JWT Token을 전달 받을 수 없다.  

- - -


## 6. Binding AppProperties   

> AppProperties.java (JWT Configuration을 binding하는 POJO 클래스 생성)   

`@ConfigurationProperties(prefix = "app") 을 선언함으로써, application-auth.prop
Configuration을 POJO 클래스로 binding 할 수 있다.`

```java
@Getter
@ConfigurationProperties(prefix = "app")
public class AppProperties {

    private final Auth auth = new Auth();
    private final OAuth2 oauth2 = new OAuth2();

    @Getter
    @Setter
    public static final class Auth {
        private String tokenSecret;
        private long tokenExpirationMsec;
    }

    @Getter
    @Setter
    public static final class OAuth2 {
        private List<String> authorizedRedirectUris = new ArrayList<>();

    }
}
```

> gradle 추가 

```gradle
// ConfigurationProperties 사용
annotationProcessor "org.springframework.boot:spring-boot-configuration-processor"
```
- - - 

## 7. Enable AppProperties

위에서 작성한 AppProperties.java를 project에서 사용할 수 있도록 @EnableConfigurationProperties를 main application에 선언한다.   

```java
@SpringBootApplication
@EnableConfigurationProperties(AppProperties.class)
public class SpringSocialApplication {

	public static void main(String[] args) {
		SpringApplication.run(SpringSocialApplication.class, args);
	}
}
```
- - - 

## 8. Enable Cors

`CORS(Cross-Origin Resource Sharing)는 동일한 출처가 아니여도 
다른 출처에서의 자원을 요청하여 쓸 수 있게 허용하는 구조를 뜻한다.`   

보통 보안상의 이슈때문에 동일한 출처를 기본적으로 웹에서는 준수하기 때문에 
최초 자원을 요청한 출처 말고 다른 스크립트를 통해 자원을 요청하는 것은 금지된다.   

> Origin : 도메인이나 포트버호가 다른 서버 
> Origin 간에 프로토콜, 프토, 호스트가 같아야 동일 Origin   

- **CORS 동작 과정**  
1. pre-flight : 실제 요청하려는 경로와 같은 URL에 대해 OPTIONS로 요청을 날려보고 요청가능한지 확인  
2. 실제 요청 

```java
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    private final long MAX_AGE_SECS = 3600;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**") // CORS를 적용할 URL 패턴 /**은 와일드 카드를 의미   
        .allowedOrigins("*")       // 자원을 공유를 허락할 Origin을 지정 
        .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS") // 요청 허용 메소드 
        .allowedHeaders("*") // 요청 허용하는 헤더 
        .allowCredentials(true) // 쿠키 허용 
        .maxAge(MAX_AGE_SECS);
    }
}
```

- - -

## 9. User

```java
@Getter
@Setter
@Document
public class User {

    @Id
    private String id;

    private String username;
    private String email;
    private String imageUrl;

    @JsonIgnore            
    private String password;

    private AuthProvider provider;

    private Boolean emailVerified = false;

    private String providerId;
}
```

- AuthProvider는 google/naver등의 oauth provider를 의미한다. 

```java
public enum AuthProvider {
    google
    naver
}
```

- oauth provider 별로 로그인 후 전달해 주는 data가 다르기 때문에 로그인 시 provider를 
확인해서 각각 process를 거치게 된다.   


## 10. User Dao(Repository)   

```java
public interface IUserDao extends MongoRepository<User, String> {

    Optional<User> findByEmail(String email);
    User findByUsername(String username);
    Boolean existsByEmail(String email);
}
```


- - -
Referrence 

- [https://velog.io/@minholee_93/Spring-Security-JWT-Security-Spring-Boot-10](https://velog.io/@minholee_93/Spring-Security-JWT-Security-Spring-Boot-10)   
- [https://www.youtube.com/playlist?list=PLVApX3evDwJ1d0lKKHssPQvzv2Ao3e__Q](https://www.youtube.com/playlist?list=PLVApX3evDwJ1d0lKKHssPQvzv2Ao3e__Q)   
- [https://www.callicoder.com/spring-boot-security-oauth2-social-login-part-1/](https://www.callicoder.com/spring-boot-security-oauth2-social-login-part-1/)

{% highlight ruby linenos %}
{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

