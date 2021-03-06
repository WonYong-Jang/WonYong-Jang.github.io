---
layout: post
title: "[WEB] 보안취약점 OWASP TOP 10"
subtitle: "보안 취약점 분석툴 Burp Suite, Fiddler와 보안 취약점"
comments: true
categories : Web
date: 2020-03-31
background: '/img/posts/mac.png'
---

<h2 class="section-heading">The Open Web Application Security Project </h2>
<p>4년마다 한 번씩 취약점 Top 10 을 발표하는 OWASP를 알아보고 보안취약툴인 Burp suite에
대해 알아보자</p>
<h2 class="section-heading">1) 인젝션(Injection)</h2>

<p><u>웹 애플리케이션의 허점을 악용해 애플리케이션의 개발자가 예상하지 못했던 SQL 문장이 
실행되게 함으로써 데이터베이스를 비정상적으로 조작하는 공격!</u></p>

<p>SQL 인젝션은 웹 애플리케이션 사용자 입력값에 필터링이 제대로 적용돼 있지 않을 때 발생한다. 
공격자가 조작된 SQL 질의문을 삽입해 웹서버 데이터베이스 정보를 열람하고 정보를 유출, 조작하는 공격이다. 
<b>대표적으로 DB를 공격해서 정보를 탈취하는 방식이 있다. 예를 들면 관리자 id, pw을 입력해야 
해당 웹사이트 DB 접속해 정보를 볼수 있지만, SQL 인젝션은 관리자 비밀번호를 제대로 입력하지 않고,
해커가 임의로 여러 문자를 조합을 이용해 DB를 조회한다.</b>
</p>

<pre>
대표적으로 쿼리 결과를 무조건 true로 만들수 있는 쿼리 
or 1=1--
or 1=1# (mysql인 경우)
위 처럼 비밀번호를 몰라도 무조건 참으로 만들면 로그인 가능할수 있다.
</pre>


<h2 class="section-heading">2) 인증 및 세션관리 취약점</h2>

<p>인증과 세션 관리와 관련된 애플리케이션 기능이 정확하게 구현되어 있지 않아서, 공격자가 패스워드, 
키 또는 세션 토큰을 해킹하거나 다른 구현 취약점을 공격하여 다른 사용자 계정을 일시적으로 또는
영구적으로 탈취하는 것을 허용한다.</p>

<h2 class="section-heading">3) Cross-Site Scripting(크로스 사이트 스크립팅 XSS ) </h2>

<p><u>JavaScript 처럼 클라이언트 측에서 실행되는 언어로 작성된 악성 스크립트 코드를 웹페이지,
 웹 게시판 또는 이메일에 포함시켜 사용자에게 전달하면 해당 웹 페이지나 이메일을 사용자가 클릭하거나
 읽을 경우 악성 스크립트 코드가 웹 브라우저에서 실행된다.</u></p>

<p>공격자는 XSS 취약점이 존재하는 웹 페이지를 이용해 자신이 만든 악의적인 스크립트를 
일반 사용자의 컴퓨터에 전달해 실행시킬 수 있다. 이런 방법을 통해 사용자 쿠키를 훔쳐내
해당 사용자 권한으로 로그인하거나 브라우저를 제어 할수 있게 되고, 악의적인 사이트로 
 사용자를 리다이렉트 할수도 있다.</p>

<p>XSS 취약점은 주로 에러 메시지 출력 부분이나 게시판 또는 사용자의 정보를 입력해 
다시 보여주는 부분 등이 주로 취약한 부분이 될수 있다. 사용자 에러페이지, URL 파라미터, 
 Form 인수값, 쿠키, DB 쿼리가 취약점이 될수 있다.</p>

<pre>이를 막기 위해 사용자가 입력한 문자열에 <, > & 등을 문자변환함수나 메소드를 이용하여
& lt;  & gt,  & amp, & quot 로 치환해야 한다. </pre>

<h2 class="section-heading">4) 취약한 접근 제어 (Broken Access Control) </h2>
<p>사용자 접근 제어가 제대로 인증되지 않을 경우에 발생하는 취약점이다. UI 에서
보여지는 특정기능을 수행하기 전에, 기능 접근 제한 권한을 검증해야 하지만 적절하게
미수행될 경우 , 공격자는 비인가된 기능에 접근을 시도 한다.</p>

<h2 class="section-heading">5) 보안설정오류(Security Misconfiguration ) </h2>
<p>안정적인 보안은 응용 프로그램, 프레임 워크, 서버 플랫폼 등과 함께 구성된다.
 어플리케이션, 프레임워크, 서버, DB 서버 플랫폼 등에 보안을 적절하게 설정하고,
  최적화된 값을 유지하고 소프트웨어는 최신의 업데이트 상태로 유지해야 한다.</p>

<h2 class="section-heading">6) 민감 데이터 노출 (Sensitive Data Exposure) </h2>
<p>많은 웹 애플리케이션들이 신용카드, 개인 식별 정보 및 인증 정보와 같은 중요한 데이터를 제대로 
보호하지 않는다 공격자는 신용카드 사기, 신분 도용 또는 다른 범죄를 수행하는 등 약하게 보호된
데이터를 훔치거나 변경한다. 중요 데이터가 저장 또는 전송중이거나 브라우저와 교환하는 경우
특별히 주의 및 암호화와 같은 보호 조치를 취해야 한다.</p>

<h2 class="section-heading">7) Insufficient Attack Protection (불충분한 공격 보호) </h2>
<p>대부분의 응용 프로그램과 API는 자동이나 수동 공격을 감지, 회피 및 대응 할수 있는 능력이 없다. 
이를 보완하고 완벽한 공격 방어를 위해서는 자동 탐지, 로깅 및 시도에 대한 응답이 필요하다.
 또한, 애플리케이션 소유자는 공격으로부터 보호할 수 있도록 신속한 패치 배포가 요구 된다.</p>

<h2 class="section-heading">8) Cross-Site Request Forgery (크로스 사이트 요청 변조 CSRF) </h2>
<p><u>CSRF 로그인된 사용자가 자신의
의지와는 무관하게 공격자가 의도한 행위(수정, 삭제, 등록, 송금 등)하게 만드는 공격이다. XSS 공격과 
매우 유사하며 XSS 공격의 발전된 형태라고 보기도 한다. 하지만 XSS 공격은 악성 스크립트가 클라이언트에서
 생행되는데 반해, CSRF공격은 사용자가 악성 스크립트를 서버에 요청한다는 차이가 있다.</u></p>

<p>사용자가 로그인 요청을 할때 웹브라우저에 의해 쿠키가 전달되는데 CSRF공격으로 쿠키를 얻어낼수 있고
 단순히 쿠키 이외에 토큰(랜덤값)이 없으면 공격에 취약할수 있다</p>

<img width="900" alt="스크린샷 2020-03-31 오후 10 07 03" src="https://user-images.githubusercontent.com/26623547/78029725-0689ad80-739c-11ea-98c9-7cffe54eb284.png">
<img width="791" alt="스크린샷 2020-04-23 오후 10 42 18" src="https://user-images.githubusercontent.com/26623547/80105879-1c158000-85b4-11ea-9c67-3b509735570d.png">
<br/><br/>

<h2 class="section-heading">9) 알려진 취약점이 있는 컴포넌트 사용 </h2>
<p>취약한 컴포넌트를 악용으로 공격으로, 심각한 데이터 손실이 생기고 서버가 장악된다. 
알려진 취약점이 있는 컴포넌트를 사용하는 어플리케이션과 API는 어플리케이션을 악화시킬 뿐만 아니라,
     다양한 공격에 영향을 줄 수 있다.</p>
<h2 class="section-heading">10) 보호되지 않은 API  </h2>
<p>클라이언트와 API 사이의 통신이 보호되고 있는지 확인해봐야하고 API 에 강력한 인증방식이
 모든 인증정보, 키 및 토큰을 보호하고 있는지 확인해야 한다.</p> 

<br/>
<h2 class="section-heading">Burp Suite, Fiddler </h2>

<p><b>웹 프록시 서버를 사용시 클라이언트와 서버간 통신을 주고 받을때 전달 되는 패킷을 중간에
 가로채어 확인 및 조작 할수 있게 해주는 툴</b></p>
<p>프록시란 대리인이라는 사전적 의미를 가지고 있듯이, 프록시 서버를 이용하면 최종 목적지에 
프록시 서버를 통해 간접적으로 접근 가능하다. 클라이언트가 하나의 웹 사이트에 접속하기 전에 
프록시 서버라는 곳을 거치는데 프록시 서버에서 클라이언트와 웹 서버 간의 요청/응답 패킷을 
살펴 볼 수 있다.</p>

<p>클라이언트 -> 프록시 서버 -> 웹 서버</p>

<h3>Fiddler 설치 과정( mac )</h3>

<pre>
1. Mono framework 다운로드 및 설치(Stable channel)
http://www.mono-project.com/download/#download-mac

2. 터미널 창에 입력
다운받은 버전이 6.8.0
</pre>
```
/Library/Frameworks/Mono.framework/Versions/<Mono Version>/bin/mozroots --import --sync
```
<pre>
https://www.telerik.com/download/fiddler/fiddler-osx-beta 에서 Fiddler-mac.zip 다운로드,
Fiddler-mac.zip 압축 해제 후 터미널로 경로로 이동 

4. 터미널에 mono --arch=32 Fiddler.exe 입력 

</pre>


<p>Reference</p>
<a href="https://m.blog.naver.com/PostView.nhn?blogId=pentamkt&logNo=221130373787&proxyReferer=https%3A%2F%2Fwww.google.com%2F">https://m.blog.naver.com/PostView.nhn?blogId=pentamkt&logNo=221130373787&proxyReferer=https%3A%2F%2Fwww.google.com%2F</a><br/>
<a href="http://blog.naver.com/pentamkt/221034887148">http://blog.naver.com/pentamkt/221034887148</a>
<br/><br/>


{% highlight ruby linenos %}
{% endhighlight %}

{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

