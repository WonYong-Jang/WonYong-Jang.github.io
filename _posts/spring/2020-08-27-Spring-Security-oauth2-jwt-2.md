---
layout: post
title: "[Spring] Spring Security + OAuth2 + JWT 를 이용한 소셜로그인 2"
subtitle: "Spring Boot에서 Oauth2 + JWT 이용한 Google 로그인"
comments: true
categories : Spring
date: 2020-08-27
background: '/img/posts/spring.png'
---

## 1. Security Configuration    

```java
@Configuration
@RequiredArgsConstructor
@EnableWebSecurity           // Spring Security 활성화
@EnableGlobalMethodSecurity( // SecurityMethod 활성화
        securedEnabled = true,
        jsr250Enabled = true,
        prePostEnabled = true
)
public class SecurityConfig extends WebSecurityConfigurerAdapter {

    private final CustomUserDetailsService customUserDetailsService;

    private final CustomOAuth2UserService customOAuth2UserService;

    private final OAuth2AuthenticationSuccessHandler oAuth2AuthenticationSuccessHandler;

    private final OAuth2AuthenticationFailureHandler oAuth2AuthenticationFailureHandler;

    private final HttpCookieOAuth2AuthorizationRequestRepository httpCookieOAuth2AuthorizationRequestRepository;

    @Bean
    public TokenAuthenticationFilter tokenAuthenticationFilter() {
        return new TokenAuthenticationFilter();
    }

    /*
          By default, Spring OAuth2 uses HttpSessionOAuth2AuthorizationRequestRepository to save
          the authorization request. But, since our service is stateless, we can't save it in
          the session. We'll save the request in a Base64 encoded cookie instead.
        */
    @Bean
    public HttpCookieOAuth2AuthorizationRequestRepository cookieAuthorizationRequestRepository() {
        return new HttpCookieOAuth2AuthorizationRequestRepository();
    }

    // Authorization에 사용할 userDetailService와 password Encoder를 정의한다.
    @Override
    public void configure(AuthenticationManagerBuilder authenticationManagerBuilder) throws Exception {
        authenticationManagerBuilder
                .userDetailsService(customUserDetailsService)
                .passwordEncoder(passwordEncoder());
    }

    // Custom Security Config에서 사용할 password encoder를 BCryptPasswordEncoder로 정의
    @Bean
    PasswordEncoder passwordEncoder(){
        return new BCryptPasswordEncoder();
    }

    // AuthenticationManager 외부에서 사용하기 위해서, AuthenticationManagerBean을 이용하여
    // SpringSecurity 밖으로 Authentication을 빼 내야 한다. ( @Bean 설정 해야함 )
    // 단순히 @Autowired 사용하면 에러
    @Bean(BeanIds.AUTHENTICATION_MANAGER)
    @Override
    public AuthenticationManager authenticationManagerBean() throws Exception {
        return super.authenticationManagerBean();
    }

    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http
                .cors() // cors 허용
                    .and()
                .sessionManagement() // session Creation Policy를 stateless 정의하여 session 사용 안함
                    .sessionCreationPolicy(SessionCreationPolicy.STATELESS) // 토큰 사용하기 위해
                    .and()
                .csrf()       // csrf 사용 안함
                    .disable()
                .formLogin()
                    .disable()
                .httpBasic()
                    .disable()
                .authorizeRequests()
                .antMatchers("/").permitAll()
                .antMatchers("/api/v1/**").hasAnyRole(Role.GUEST.name() ,Role.USER.name(), Role.ADMIN.name())
                .antMatchers("/auth/**", "/oauth2/**").permitAll()
                .anyRequest().authenticated()
                .and()
                .oauth2Login()
                    .authorizationEndpoint()
                        .baseUri("/oauth2/authorization") // client 에서 처음 로그인 시도 URI
                        .authorizationRequestRepository(cookieAuthorizationRequestRepository())
                        .and()
                    .userInfoEndpoint()
                        .userService(customOAuth2UserService)
                        .and()
                    .successHandler(oAuth2AuthenticationSuccessHandler)
                    .failureHandler(oAuth2AuthenticationFailureHandler);

        // Add our custom Token based authentication filter
        // UsernamePasswordAuthenticationFilter 앞에 custom 필터 추가!
        http.addFilterBefore(tokenAuthenticationFilter(), UsernamePasswordAuthenticationFilter.class);
    }
}
```

##### 1-1 @EnableGlobalMethodSecurity 

`Spring Security는 Override된 configure(HttpSecurity http)에서 AntMatcher를 이용해 Role을 
확인할 수 있다. 하지만 관리 대상과 요구사항이 많아지면 Role만으로는 문제 해결이 용이하지 않다.`   

특정 메서드에 권한 처리를 하는 MethodSecurity 설정 기능 제공한다. 
 각 설정값 true로 변경하면 사용가능 ( default값은 false)     

MethodSecurity는 WebSecurity와는 별개로 동작하기 때문에 추가 설정이 필요   

> 1) securedEnable : @Secured 사용하여 인가처리하는 옵션   

> 2) prePostEnable : @PreAuthorize, @PostAuthorize 사용하여 인가처리 옵션   

> 3) jsr250Enabled : @RolesAllowed 사용하여 인가처리 옵션 

##### 1-2 CustomUserDetailService

인증시 사용할 custom User Service이다. 자세한 내용은 [이 글](https://wonyong-jang.github.io/spring/2020/08/15/Spring-Security-Database-Authentication.html)을 참고하면 된다.     

##### 1-3 TokenAuthenticationFilter  

`로그인시 JWT Token을 확인해 인가된 사용자 유무를 판별하고 내부 process를 수행한다.`    
자세한 내용은 [이 글](https://wonyong-jang.github.io/spring/2020/08/17/Spring-Security-JWT.html)을 참고하면 된다.    
`여기서는 인가된 사용자를 확인할 때 DB를 조회하지 않고 JWT 토큰에 저장된 값들로만 확인 할수 있도록 하였다.`   

##### 1-4 HttpCookieOAuth2AuthorizationReqeustRepository 

Spring OAuth2는 기본적으로 HttpSessionOAuth2AuthorizationRequestRepository를 사용해 
Authorization Request를 저장한다.

`우리는 JWT를 사용하므로, Session에 이를 저장할 필요가 없다. 따라서 custom으로 구현한 
HttpCookieOAuth2AuthorizationRequestRepository를 사용해 Authorization Reqeust를 Based64 encoded cookie에 
저장한다.`   

- - - 

## 2. OAuth2 Login Process

- login process 는 먼저 client 에서 http://localhost:8080/oauth2/authorize/{provider}?redirect_uri={로그인 인증 후 JWT 보낼 uri}로 request 하면서 
시작된다.   

- 이 때 위의 provider는 google/naver와 같은 oauth provider가 된다. 


<img width="700" alt="스크린샷 2020-08-29 오후 4 12 23" src="https://user-images.githubusercontent.com/26623547/91631155-82068e00-ea12-11ea-836d-b26450582b63.png">   

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

