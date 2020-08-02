---
layout: post
title: "[Git] SpringBoot 어플리케이션 heroku 배포"
subtitle: "git을 이용한 어플리케이션 서버 배포 "
comments: true
categories : Git
date: 2020-08-02
background: '/img/posts/mac.png'
---

## heroku 사용하여 배포하기 

- - -

`heroku는 웹사이트를 인터넷에 올릴 수 있도록 서버를 제공하는 사이트들 중 하나이다.`   
heroku 가입은 무료이며 현재 무료 버전 제약은 크게 2가지 이다.

- 30분간 방문이 없는 경우 사이트를 slep 시킨다. 사이트가 sleep된 상태에서 페이지 요청이 들어오는 경우 사이트가 다시 
깨어나지만 10~30초 정도 시간이 걸린다.   

- 한 계정당 한달의 550시간만 사용가능하다. 단, 계정에 신용카드 등록을 하는 경우 1000시간 사용가능하다. 신용카드에서 
돈이 나가진 않는다.   


#### heroku 회원 가입   

[https://www.heroku.com ](https://www.heroku.com ) 사이트를 접속하여 회원가입을 진행한다. 그 후 로그인을 진행 후 
대시보드에서 Create new app 을 만든다. 애플리케이션을 생성한다는 것은 
배포를 위해 heroku가 관리하는 인스턴스가 생성되었다고 이해하면 된다. 

<img width="500" alt="스크린샷 2020-08-02 오후 3 04 14" src="https://user-images.githubusercontent.com/26623547/89116681-e4cb3f00-d4d1-11ea-899e-2a7a442cc942.png">   

- - -

아래와 같이 heroku cli를 설치 하고 git을 이용하여 배포 해보자.   

#### heroku setup and login

```
// macOS 기준 설치 
$ brew tap heroku/brew && brew install heroku

$ heroku -v // 버전 확인 

$ heroku login // 로그인
```

- - -

#### heroku app create

```
// heroku app 이 생성되고 remote 저장소로 heroku가 추가된다.   
$ heroku create <저장소 이름>

$ git remove -v // remote 저장소 추가된 것 확인 
```

- - -

#### heroku push and open

`heroku git 저장소에 push를 하면 자동으로 빌드 후 웹 어플리케이션이 실행된다.`   

```
$ git push heroku master // master branch로 push 

$ git push heroku <branch-name>:master  // branch 이름으로 push

$ heroku open // url 열어서 확인 
```
- - -

#### heroku DB setup

아래는 spring boot 에 DB 설정 예이다.   

```
$ heroku config:set spring.data.mongodb.uri=<database_uri_here> // 추가 

$ heroku config:unset <VALUE> // config 삭제 

$ heroku config  // config 확인 
```
- - -

#### buildpacks 

`빌드팩은 데이터를 생성하거나, 소스코드를 컴파일하는 빌드 과정을 담당하는 
Heroku의 도구 세트이다. 아래는 chrome 을 사용하기 위하여 빌드팩을 추가하였다.`   

```
heroku buildpacks:add heroku/google-chrome
```

- - -

#### etc

```
$ heroku logout // 한번 로그인 되면 컴퓨터를 재시작해도 로그인이 지속되므로 해당 명령어로 로그아웃 

$ keroku ps // 사용량 보기

$ heroku logs --tail // 앱 로그 보기

$ heroku apps:rename <new name>  // heroku app name 변경 
```


- - - 
<p>Reference</p>

{% highlight ruby linenos %}


{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

