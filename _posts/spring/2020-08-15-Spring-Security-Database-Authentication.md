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
    private String email;  // user를 찾을 때 email을 이용하여 찾는다.  
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
전달받아 Spring Security에 User 정보를 전달한다!`         

```java
public class UserPrincipal implements UserDetails {

    private User user;

    public UserPrincipal(User user) {
        this.user = user;
    }

    public static UserPrincipal create(User user) {
        return new UserPrincipal(user);
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        List<GrantedAuthority> authorities = new ArrayList<>();

        GrantedAuthority grantedAuthority = new SimpleGrantedAuthority(this.user.getRole());
        authorities.add(grantedAuthority);

        return authorities;
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
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return user.getActive().equals("1");
    }
}
```

> 3-2 UserPrincipalDetailService   

`UserPrincipalDetailService로 UserDetailService를 implements 한다. UserRepository(UserDao)를 생성자로 
주입받아, User정보를 DB에서 가져온다.`   

`DB에서 가져온 User 정보는 UserPrincipal 클래스로 변경해 Spring Security로 전달한다. UserPrincipal은 Spring Security의 
UserDetails를 implements 하였으므로, 이제 Srping Security는 User 클래스를 사용해 
Authentication을 사용 할수 있게 되었다.`   

```java
@RequiredArgsConstructor
@Service
public class UserPrincipalDetailsService implements UserDetailsService {

    private final IUserDao iUserDao;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {

        User user = iUserDao.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email"));

        return UserPrincipal.create(user);
    }
}
```

### 4. Configure Database Provider   

`이제 SecurityConfig 클래스를 생성해 database Authentication을 사용할 수 있도록 변경하자.`   
`database authentication을 사용하기위해 DaoAuthenticationProvider를 정의하고 configure 메서드에 authenticationProvider에 
전달한다.`   

> SecurityConfig   

```java
@Configuration
@RequiredArgsConstructor
@EnableWebSecurity // Spring Security 활성화
public class SecurityConfig extends WebSecurityConfigurerAdapter {

    private final UserPrincipalDetailsService userPrincipalDetailsService;

    @Override
    protected void configure(AuthenticationManagerBuilder auth) throws Exception {
        auth.authenticationProvider(authenticationProvider());
    }

    @Bean
    DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider daoAuthenticationProvider = new DaoAuthenticationProvider();
        daoAuthenticationProvider.setPasswordEncoder(passwordEncoder());
        daoAuthenticationProvider.setUserDetailsService(this.userPrincipalDetailsService);

        return  daoAuthenticationProvider;
    }

    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http
                .authorizeRequests()
                .antMatchers("/").permitAll()
                .antMatchers("/api/v1/login").hasRole("ADMIN") // 각 url에 접근 가능한지 
                .antMatchers("/api/v1/login1").hasRole("MANAGER") // 확인하기 위해 설정 
                .and()
                .httpBasic(); // 기본 로그인 창 제공 
    }

    // Custom Security Config에서 사용할 password encoder를 BCryptPasswordEncoder로 정의
    @Bean
    PasswordEncoder passwordEncoder(){
        return new BCryptPasswordEncoder();
    }
}
```

### 5. DB Data 저장

아래와 같이 JUnit를 이용하여 Test 계정을 생성하였고 ROLE 권한을 가진 계정과 
MANAGER 권한을 가진 계정을 각각 저장한다. 

```java
@SpringBootTest
@RunWith(SpringRunner.class)
public class IUserDaoTest {

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private IUserDao iUserDao;

    @Test
    public void saveTestUser() {

        String testEmail = "test@naver.com";

        // Role 작명규칙은 반드시 prefix로 ROLE_  을 명시해야 함!
        iUserDao.save(User.builder()
                .username("WonYong")
                .email(testEmail)
                .password(passwordEncoder.encode("test"))
                .role("ROLE_ADMIN")
                .active("1")
                .build());

        User user = iUserDao.findByEmail(testEmail).orElseThrow(() -> new UsernameNotFoundException("not find"));
        // MANAGER 도 동일하게 생성하기 

        assertThat(user.getEmail()).isEqualTo(testEmail);
    }
}
```

### 6. RestController 

```java
@RequiredArgsConstructor
@RestController
public class LoginApiController {

    @GetMapping("/api/v1/login") // Admin만 접속 가능 
    public String login() {

        return "Success ADMIN";
    }

    @GetMapping("/api/v1/login2") // Manager만 접속 가능 
    public String login2() {

        return "Success MANAGER";
    }
}
```
- - -

### 7. Test

`/api/v1/login접속 했을 경우 httpBasic() 설정한 로그인 창이 보이며 
email과 password를 입력했을 경우 로그인이 성공한다. (ADMIN 권한)`   

<img width="800" alt="스크린샷 2020-08-16 오후 2 08 19" src="https://user-images.githubusercontent.com/26623547/90327166-c71ad100-dfcb-11ea-983b-18a43fc7f50d.png">   


<img width="500" alt="스크린샷 2020-08-16 오후 2 17 52" src="https://user-images.githubusercontent.com/26623547/90327167-ca15c180-dfcb-11ea-944a-f62aef5985ec.png">

`반면 login2 화면은 Manager 권한만 접근가능하므로 ADMIN권한으로 접근시도 할경우 403 에러가 발생한다.`      

<img width="500" alt="스크린샷 2020-08-16 오후 2 18 00" src="https://user-images.githubusercontent.com/26623547/90327168-cda94880-dfcb-11ea-8849-6dc7d1547334.png">

- - -
Referrence 

[https://velog.io/@minholee_93/Spring-Security-Database-Authentication-Spring-Boot-6](https://velog.io/@minholee_93/Spring-Security-Database-Authentication-Spring-Boot-6)        
[https://www.youtube.com/playlist?list=PLVApX3evDwJ1d0lKKHssPQvzv2Ao3e__Q/](https://www.youtube.com/playlist?list=PLVApX3evDwJ1d0lKKHssPQvzv2Ao3e__Q/)   

{% highlight ruby linenos %}
{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

