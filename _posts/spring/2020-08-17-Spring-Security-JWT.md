---
layout: post
title: "[Spring] Spring Security JWT Authentication"
subtitle: "Spring boot에서 JWT를 이용한 Authentication과 Authorization"
comments: true
categories : Spring
date: 2020-08-17
background: '/img/posts/spring.png'
---

## JWT    

JWT의 개념은 [링크](https://wonyong-jang.github.io/web/2020/07/21/Web-API-JWT-OAuth.html)를 참고하면 된다.   
이번 글은 맨 아래 Referrence를 참조하였으며, Spring Boot에서 JWT를 사용해서 Authentication과 Authorization을 
수행하는 방법에 대해서 알아본다.   

[이전글](https://wonyong-jang.github.io/spring/2020/08/15/Spring-Security-Database-Authentication.html)을 먼저 실습하는 것을 추천한다.   

- - -

### 1. RestController   

`외부 domain인 client( ex) react )가 application server에 resource를 요청하기 위해 
application server는 cors를 enable 해야한다.`    
`cors를 enable 하지 않으면 기본적으로 application server는 외부 domain에 resource 접근을 허용하지 않는다!`   

> Rest API Controller

```java
@CrossOrigin                    // cors 허용
@RequiredArgsConstructor
@RestController
public class LoginApiController {

    @GetMapping("/api/v1/login") // admin 권한에게만 
    public String login() {

        return "Success ADMIN";
    }

    @GetMapping("/api/v1/login2") // manager 권한에게만 
    public String login2() {

        return "Success MANAGER";
    }
}
```

> JWT dependency

```gradle
implementation group: 'com.auth0', name: 'java-jwt', version: '3.1.0'
```   
---
   
### 2. Authentication   

> JwtProperties.java 

JWT Properties정보를 담고 있는 클래스를 생성한다. `JWT에서는 서명을 생성하기 위해 
비밀키를 필요로 하는데, 비밀키는 외부에 노출되면 안되므로 .gitignore로 생성해야 한다. 
이 글에서는 간단한 실습을 위해 클래스로 만든다.`   

```java
public class JwtProperties {
    public static final String SECRET = "apple";         // secret key 
    public static final int EXPIRATION_TIME = 864000000; // 10 days
    public static final String TOKEN_PREFIX = "Bearer ";
    public static final String HEADER_STRING = "Authorization";
}
```

- SECRET : JWT Token을 hash 할때 사용할 secret key  
- EXPIRATION TIME : JWT Token의 validation 기간   
- TOKEN PREFIX :JWT Token의 prefix는 Bearer( Bearer인증방식 )
- HEADERS STRING : JWT Token은 Authorization header로 전달

> LoginViewModel.java   

로그인 request dto를 생성한다.   

```java
@Getter
@Setter
public class LoginViewModel {

    private String email; // 본실습은 username -> email 변경하여 진행 
    private String password;
}
```

> JwtAuthenticationFilter.java (Authentication logic을 수행할 Filter)  



```java
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends UsernamePasswordAuthenticationFilter {

    private final AuthenticationManager authenticationManager;

    @Override
    public Authentication attemptAuthentication(HttpServletRequest request, HttpServletResponse response) throws AuthenticationException {

        LoginViewModel credentials = null;
        try {
            // ObjectMapper 라이브러리를 이용하여 JSON -> Object 변환 (readValue)
            // request body 데이터 확인 request.getInputStream()
            credentials = new ObjectMapper().readValue(request.getInputStream(), LoginViewModel.class);
        } catch(IOException e) {
            e.printStackTrace();
        }

        // Create login Token
        UsernamePasswordAuthenticationToken authenticationToken =
                new UsernamePasswordAuthenticationToken(
                        credentials.getEmail(),    // email 이용
                        credentials.getPassword(),
                        new ArrayList<>()
                );
        // Authentication User !
        Authentication auth = authenticationManager.authenticate(authenticationToken);

        return auth;
    }

    @Override
    protected void successfulAuthentication(HttpServletRequest request,
                                            HttpServletResponse response,
                                            FilterChain chain,
                                            Authentication authResult) throws IOException, ServletException {
        // Grab principal
        UserPrincipal principal = (UserPrincipal)authResult.getPrincipal();

        // Create JWT Token
        String token = JWT.create()
                .withSubject(principal.getEmail())  // email 이용
                .withExpiresAt(new Date(System.currentTimeMillis()+ JwtProperties.EXPIRATION_TIME))
                .sign(Algorithm.HMAC512(JwtProperties.SECRET.getBytes())); // signature
        // Add Token in response header
        response.addHeader(JwtProperties.HEADER_STRING, JwtProperties.TOKEN_PREFIX + token);
    }
}
```

**attempAuthentication 메소드( /login request 요청시 수행)**   
   
<img width="700" alt="스크린샷 2020-08-17 오후 4 48 23" src="https://user-images.githubusercontent.com/26623547/90371216-9315dd80-e0a9-11ea-957d-2d6d868bbb19.png">   

- request json body로 전달된 email/password를 LoginViewModel 클래스로 변환한다.   

- LoginViewModel의 필드에서 email/password를 가져와 UsernamePasswordAuthenticationToken을 생성한다.   

- UsernamePasswordAuthenticationToken은 사용자에게 전달하는 JWT Token이 아닌 Spring이 
Authentication logic에 사용할 Token 이다.   

- AuthenticationManager는 위의 token을 전달해 Authentication 객체를 생성한다.   

- Authentication 객체를 사용해 Spring Security가 인증을 수행하고, 인증이 정상적으로 완료되면 
Authentication 객체는 successfulAuthentication 메서드로 전달된다.   


**successfulAuthentication (로그인 성공시 수행되는 메서드)**   

<img width="700" alt="스크린샷 2020-08-17 오후 5 42 24" src="https://user-images.githubusercontent.com/26623547/90376270-256daf80-e0b1-11ea-8c69-3a25979ac207.png">   

- 전달된 Authentication 객체에서 UserPrincipal 객체를 가져온다. 

- UserPrincipal의 필드값을 Subject(email)로 하는 JWT Token을 생성한다.  

- 생성한 JWT Token은 response의 header에 전달한다.   

### 3. Authorization   

> JwtAuthorizationFilter.java (Authorization은 앞서 Authentication에서 획득한 JWT Token을 가지고 request를 
        요청할 때 수행된다.)   

```java
public class JwtAuthorizationFilter extends BasicAuthenticationFilter{

    private IUserDao iUserDao;

    public JwtAuthorizationFilter(AuthenticationManager authenticationManager, IUserDao iUserDao) {
        super(authenticationManager);
        this.iUserDao = iUserDao;
    }

    // endpoint every request hit with authorization
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain) throws IOException, ServletException {
        // Read the Authorization header, where the JWT Token should be
        String header = request.getHeader(JwtProperties.HEADER_STRING);

        // if header does not contain BEARER or is null delegate to Spring impl and exit
        if(header == null || !header.startsWith(JwtProperties.TOKEN_PREFIX)){
            chain.doFilter(request,response);
            return;
        }

        // If header is present, try grab user principal from database and perform authorization
        Authentication authentication = getUsernamePasswordAuthentication(request);
        SecurityContextHolder.getContext().setAuthentication(authentication);

        // Continue filter execution
        chain.doFilter(request, response);
    }

    private Authentication getUsernamePasswordAuthentication(HttpServletRequest request) {
        String token = request.getHeader(JwtProperties.HEADER_STRING);
        
        // parse the token and validate it(decode)
        if(token != null) {
            String email = JWT.require(Algorithm.HMAC512(JwtProperties.SECRET.getBytes()))
                    .build()
                    .verify(token.replace(JwtProperties.TOKEN_PREFIX,""))
                    .getSubject();

            if(email != null) {

                User user = iUserDao.findByEmail(email).orElseThrow(()-> new UsernameNotFoundException("not find"));
                UserPrincipal principal = new UserPrincipal(user);
                UsernamePasswordAuthenticationToken auth
                        = new UsernamePasswordAuthenticationToken(email, null, principal.getAuthorities());
                return auth;
            }
            return null;
        }
        return null;
    }
}
```

**doFilterInternal**

doFilterInternal 메서드는 authorization이 포함된 request에 대한 endpoint이다.   

<img width="700" alt="스크린샷 2020-08-17 오후 6 28 33" src="https://user-images.githubusercontent.com/26623547/90380994-bba4d400-e0b7-11ea-880e-6d17f2baf703.png">   

- request에서 Authorization Header를 획득한다. 

- Authorization Header가 null이 아니면, getUserPasswordAuthentication 메서드에 
header를 전달해 Authentication 객체를 return 받는다.   

- 전달 받은 Authentication 객체를 SecurityContextHolder에 저장한다.   

- Authorization이 정상적으로 수행되면, Spring의 나머지 FilterChain들을 수행 할 수 있도록 
doFilter(request, response)를 호출한다.   

**getUsernamePasswordAuthentication**   

getUsernamePasswordAuthentication 메서드는 전달받은 Authorization 헤더에서 
사용자 정보를 획득해 UsernamePasswordAuthenticationToken 객체를 생성       

<img width="700" alt="스크린샷 2020-08-18 오후 1 25 57" src="https://user-images.githubusercontent.com/26623547/90470745-340ea200-e157-11ea-8b11-0c5023dd4305.png">   

- Authorization Header에서 JWT Token을 얻는다. 

- JWT Token을 decode 하여 subject에서 username(email)을 획득한다.

- email으로 DB를 조회해 User객체를 생성한다.   

- User객체를 전달해 UserPrincipal 객체를 생성한다.

- email과 User의 authorites로 구성된 UserPasswordAuthenticationToken을 생성해 
Authentication 객체로 return 한다.   

### 4. Config 

> SecurityConfig.java

```java
@Configuration
@RequiredArgsConstructor
@EnableWebSecurity // Spring Security 활성화
public class SecurityConfig extends WebSecurityConfigurerAdapter {

    private final UserPrincipalDetailsService userPrincipalDetailsService;
    private final IUserDao iUserDao;

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
                .csrf().disable()
                .sessionManagement().sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                .and()
                .addFilter(new JwtAuthenticationFilter(authenticationManager()))
                .addFilter(new JwtAuthorizationFilter(authenticationManager(), this.iUserDao))
                .authorizeRequests()
                .antMatchers(HttpMethod.POST, "login").permitAll()
                .antMatchers("/api/v1/login").hasRole("ADMIN")    // admin 만 접근 가능 
                .antMatchers("/api/v1/login2").hasRole("MANAGER") // manager 만 접근 가능 
                .anyRequest().authenticated(); // 이외에 모든 request는 로그인한 사용자만 접근 가능 

    }

    // Custom Security Config에서 사용할 password encoder를 BCryptPasswordEncoder로 정의
    @Bean
    PasswordEncoder passwordEncoder(){
        return new BCryptPasswordEncoder();
    }
}
```

- `JwtAuthentication Filter와 JwtAuthorizationFilter를 위와 같은순서대로 선언한다 이때 반드시 
Authentication이 앞에 와야한다. (순서대로 진행 되기 때문에)`   

- csrf와 session은 JWT 기반 Security에서는 사용하지 않으므로 disable 처리한다.   

### 5. Test   

postman으로 API 테스트를 진행 하였다.   

> 5-1. Login (Authentication)

<img width="750" alt="스크린샷 2020-08-18 오후 1 53 25" src="https://user-images.githubusercontent.com/26623547/90471986-6d94dc80-e15a-11ea-8474-0db22c6fbd60.png">    

`위와 같이 /login으로 email/password와 함께 Post request 요청하면 200 ok 와 함께 
JWT Token이 return 되는 것을 확인 할수 있다.`

> 5-2. Authorization request   

<img width="750" alt="스크린샷 2020-08-18 오후 2 03 08" src="https://user-images.githubusercontent.com/26623547/90472533-b4cf9d00-e15b-11ea-8840-5d5b95c95ab7.png">   

`이후 획득한 JWT Token을 Authorization header에 담아 authorization request를 요청하면 
정상적으로 결과값을 return 하는 것을 확인 할수 있다!`   

- - -
Referrence 

- [https://velog.io/@minholee_93/Spring-Security-JWT-Security-Spring-Boot-10](https://velog.io/@minholee_93/Spring-Security-JWT-Security-Spring-Boot-10)        
- [https://www.youtube.com/playlist?list=PLVApX3evDwJ1d0lKKHssPQvzv2Ao3e__Q](https://www.youtube.com/playlist?list=PLVApX3evDwJ1d0lKKHssPQvzv2Ao3e__Q)     

{% highlight ruby linenos %}
{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

