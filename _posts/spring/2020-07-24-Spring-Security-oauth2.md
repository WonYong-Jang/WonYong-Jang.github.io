---
layout: post
title: "[Spring] Spring Security + OAuth2 를 이용한 소셜로그인"
subtitle: "Spring Boot에서 Oauth2 이용한 소셜 로그인"
comments: true
categories : Spring
date: 2020-07-24
background: '/img/posts/spring.png'
---

`스프링 시큐리티는 강력한 인증과 인가 기능을 가진 프레임워크이다. 인터셉터나 
필터를 이용해 구현하는 것보다 시큐리티를 이용하는 것을 권장한다.`      

> 또한 많은 서비스에서 로그인 기능을 id/password 방식보다는 구글,페이스북, 네이버 
로그인과 같은 소셜 로그인 기능을 사용한다. OAuth를 이용 했을 경우 
로그인 시 보안, 비밀번호 찾기, 비밀번호 변경, 회원가입 시 이메일 혹은 전화번호 인증,
 회원정보 변경 등을 맡기면 되니 서비스 개발에 집중이 가능하다!

- - -

### Spring Boot 2.0의 OAuth 2.0 설정 방법 


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

[https://daddyprogrammer.org/post/1239/spring-oauth-authorizationserver/](https://daddyprogrammer.org/post/1239/spring-oauth-authorizationserver/)        
[https://jojoldu.tistory.com/](https://jojoldu.tistory.com/)    


{% highlight ruby linenos %}
{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

