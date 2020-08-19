---
layout: post
title: "[Spring] Spring Security + OAuth2 + JWT 를 이용한 소셜로그인 1"
subtitle: "Spring Boot에서 Oauth2 + JWT 이용한 Google 로그인"
comments: true
categories : Spring
date: 2020-08-19
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

```properties
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


### SecurityConfig.java

```java
@RequiredArgsConstructor
@EnableWebSecurity // Spring Security 설정들을 활성화 시켜준다.
public class SecurityConfig extends WebSecurityConfigurerAdapter {

    private final CustomOAuth2UserService customOAuth2UserService;

    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http
                .csrf().disable()
                .headers().frameOptions().disable()
                .and()
                .authorizeRequests() // URL 별 권한 관리를 설정하는 옵션의 시작점
                .antMatchers("/"
                        , "/css/**"
                        , "/images/**"
                        , "/js/**"
                        , "/h2-console/**"
                ).permitAll() // 모든 사용자들에게 전체 권한 부여
                .antMatchers("/api/v1/**").hasRole(Role.USER.name()) // 권한 가진 사용자만 허용
                .anyRequest().authenticated() // 그외에 URL은 모두 로그인한 사용자만 허용
                .and()
                .logout()
                .logoutSuccessUrl("/") // 로그 아웃 성공시 redirect
                .and()
                .oauth2Login()
                .userInfoEndpoint()
                .userService(customOAuth2UserService); // 소셜 로그인 성공 시 후속 조치
    }
}
```

- @EnableWebSecurity   

> Spring Security 설정들을 활성화시켜 준다.  
> WebSecurityConfigurerAdapter 클래스를 상속받아서 configure 메서드를 Override 해야 한다.   

- authorizeRequests

> URL 별 권한 관리를 설정하는 옵션의 시작점이며, authorizeRequests가 선언 되어야만 
antMatchers 옵션을 사용할 수 있다.   

- antMatchers

> 권한 관리 대상을 지정하는 옵션이며 URL, HTTP 메소드별로 관리가 가능하다.   
> / 등 지정된 URL들은 permitAll() 옵션을 통해 전체 열람 권한을 주었다.   
> /api/v1/ 주소를 가진 API는 USER 권한을 가진 사람만 가능하도록 했다. 
> permitAll() 모든 사용자 접근 가능, hasRole() 특정 권한 가진 사용자만 접근 가능   

- anyReqeust   

> 설정된 값들 이외 나머지 URL 들을 나타낸다. 여기서는 authenticated()을 추가하여 
나머지 URL들은 모두 인증된 사용자들에게만 허용 했다. 인증된 사용자 즉, 로그인한 사용자들을 
이야기 한다.   

- logout().logoutSuccessUrl("/")

> 로그아웃 기능에 대한 여러 설정의 진입점이다. 로그아웃 성공시 / 주소로 이동한다.   

- oauth2Login

> OAuth2 로그인 기능에 대한 여러 설정의 진입점이다.   

- userInfoEndpoint

> OAuth2 로그인 성공 이후 사용자 정보를 가져올 때의 설정들을 담당한다.   

- userService

> 소셜 로그인 성공 시 후속 조치를 진행할 userService 인터페이스의 구현체를 등록한다.   
리소스 서버(즉, 소셜 서비스들)에서 사용자 정보를 가져온 상태에서 추가로 진행하고자 하는 기능을 
명시할 수 있다.   



#### CustomOAuth2UserService.java

```java
@RequiredArgsConstructor
@Service
public class CustomOAuth2UserService implements OAuth2UserService<OAuth2UserRequest, OAuth2User> {

    private final UserRepository userRepository;
    private final HttpSession httpSession;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2UserService delegate = new DefaultOAuth2UserService();
        OAuth2User oAuth2User = delegate.loadUser(userRequest);

        String registrationId = userRequest.getClientRegistration().getRegistrationId();
        String userNameAttributeName = userRequest.getClientRegistration().getProviderDetails()
                .getUserInfoEndpoint().getUserNameAttributeName();

        OAuthAttributes attributes = OAuthAttributes
                .of(registrationId, userNameAttributeName, oAuth2User.getAttributes());

        User user = saveOrUpdate(attributes);

        httpSession.setAttribute("user", new SessionUser(user));

        return new DefaultOAuth2User(Collections.singleton(new SimpleGrantedAuthority(user.getRoleKey()))
            , attributes.getAttributes()
            , attributes.getNameAttributeKey());
    }

    private User saveOrUpdate(OAuthAttributes attributes) {
        User user = userRepository.findByEmail(attributes.getEmail())
                .map(entity -> entity.update(attributes.getName(), attributes.getPicture()))
                .orElse(attributes.toEntity());
        
        return userRepository.save(user);
    }
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

