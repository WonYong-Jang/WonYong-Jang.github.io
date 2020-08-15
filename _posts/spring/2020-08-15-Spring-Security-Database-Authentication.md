---
layout: post
title: "[Spring] Spring Security Database Authentication"
subtitle: "UserDetails와 UserDetailsService 이용한 유저 인증 및 저장"
comments: true
categories : Spring
date: 2020-08-15
background: '/img/posts/spring.png'
---

## Database Authentication   

<img width="750" alt="스크린샷 2020-08-15 오후 3 45 27" src="https://user-images.githubusercontent.com/26623547/90307174-f3bce300-df0e-11ea-8b1c-b389875f780f.png">   

1) User 데이터를 저장할 User 클래스를 생성한다.   
2) User를 Database에 저장한다.   
3) 생성한 User 클래스를 Spring Security의 내장 class와 연결한다. 이때 UserDetails와 UserDetailsService Interface를 사용한다.     
4) Security Configuration에 Database Auth를 정의한다.   

`Spring Security에는 default User가 정의되어있으므로 사용자가 직접 정의한 User를 
사용하기 위해선 Interface를 사용해 연결해야 한다!`   

<img width="750" alt="스크린샷 2020-08-15 오후 3 52 21" src="https://user-images.githubusercontent.com/26623547/90307251-5910d400-df0f-11ea-92bd-7326cf1da66c.png">    

- AppUserPrincipal / User / AppUserRepository는 사용자가 정의한 클래스이다.   
- UserDetails 클래스는 Spring Security에서 User 클래스 역할을 수행한다.   
- UserDetailsService 클래스는 Spring Security에서 UserRepository 역할을 수행한다.   

- - -

### 1. User   

아래와 같이 User 클래스를 생성한다. ( MongoDB 사용 )    
Authentication을 사용하기 위해 User 필드값에 permission과 role 모두 정의 해야 하지만 
간단한 실습을 위해 한개의 Role만 가질 수 있도록 하였다.   

```java
@Getter
@NoArgsConstructor
@Document
public class User {

    @Id
    private String id;

    private String username;
    private String password;
    private String email;
    private String active; // 1: active, 0: inactive
    private String role;

    @Builder
    public User(String username, String password, String email, String active, String role) {
        this.username = username;
        this.password = password;
        this.email = email;
        this.active = active;
        this.role = role;
    }
}
```
   
### 2. User Dao (또는 Repository)   
   

```java
public interface IUserDao extends MongoRepository<User, String> {
    Optional<User> findByEmail(String email);
}
```   
   
### 3. Integrate with Spring Security   

> 위에서 생성한 User 클래스를 Spring Security와 연결한다. 이를 
위해서 UserDetails와 UserDetailsService를 Implements 해야한다.   

<img width="750" alt="스크린샷 2020-08-15 오후 4 58 05" src="https://user-images.githubusercontent.com/26623547/90308215-a5144680-df18-11ea-8119-a462eb0877cf.png">     

> 3-1 UserPrincipal   

`UserPrincipal 클래스를 생성하여 UserDetails를 implements 한다. User를 생성자로 
전달받아 Spring Security에 User 정보를 전달한다.!`         

```java
@RequiredArgsConstructor
public class UserPrincipal implements UserDetails {

    private final User user;

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        List<GrantedAuthority> list = new ArrayList<>();

        GrantedAuthority grantedAuthority = new SimpleGrantedAuthority(this.user.getRole());
        list.add(grantedAuthority);

        return list;
    }

    @Override
    public String getPassword() {
        return this.user.getPassword();
    }

    @Override
    public String getUsername() {
        return this.user.getUsername();
    }

    @Override
    public boolean isAccountNonExpired() {
        return false;
    }

    @Override
    public boolean isAccountNonLocked() {
        return false;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return false;
    }

    @Override
    public boolean isEnabled() {
        return user.getActive().equals("1");
    }
}
```

- - -
Referrence 

[https://velog.io/@minholee_93/Spring-Security-Database-Authentication-Spring-Boot-6](https://velog.io/@minholee_93/Spring-Security-Database-Authentication-Spring-Boot-6)        
[https://www.youtube.com/playlist?list=PLVApX3evDwJ1d0lKKHssPQvzv2Ao3e__Q/](https://www.youtube.com/playlist?list=PLVApX3evDwJ1d0lKKHssPQvzv2Ao3e__Q/)   

{% highlight ruby linenos %}
{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

