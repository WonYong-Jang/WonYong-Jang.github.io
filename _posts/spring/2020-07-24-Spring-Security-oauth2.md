---
layout: post
title: "[Spring] Spring Security + OAuth2 를 이용한 소셜로그인"
subtitle: "Spring Boot에서 Oauth2 이용한 소셜 로그인"
comments: true
categories : Spring
date: 2020-07-24
background: '/img/posts/spring.png'
---

스프링 시큐리티는 강력한 인증과 인가 기능을 가진 프레임워크이다. 인터셉터나 
필터를 이용해 구현하는 것보다 시큐리티를 이용하는 것을 권장한다.   

## Spring Boot 2.0의 OAuth 2.0 설정 방법 




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

