---
layout: post
title: "[Jekyll] 댓글 기능 추가하기(Disqus)"
subtitle: "블로그 댓글 기능 추가할수 있는 disqus"
comments: true
categories : ETC
date: 2020-02-22
background: '/img/posts/mac.png'
---

## Disqus 란?    

간편하게 블로그 댓글 기능을 추가할수 있는 API    


Disqus 회원 가입 후 Jekyll 에 <code class="language-plaintext highlighter-rouge">Disqus</code> 를
추가 할 것이기 때문에 <code class="language-plaintext highlighter-rouge">I want to install Disqus on my site</code>
를 선택합니다.    


<img width="400" alt="스크린샷 2020-02-23 오후 2 22 45" src="https://user-images.githubusercontent.com/26623547/75104101-50b69b00-5648-11ea-8906-15ae8a6f8a8f.png">    


그 후 Website Name 에는 Jekyll Github Blog 주소를 입력하면 됩니다.    
ex) WonYong-Jang.github.io

## Disqus 를 Jekyll 적용하기     


`Jekyll _config.yml 에 아래와 같이 추가`   

```
    ...
    comments:
        // default가 false로 설정되어있을 수 있습니다.
        // disqus로 바꿔주세요.
        provider: disqus
    disqus:
        shortname: zcx6263 // zcx6263 에 본인의 것을 쓰시면 됩니다. 
```

<img width="550" alt="스크린샷 2020-02-23 오후 2 33 31" src="https://user-images.githubusercontent.com/26623547/75104474-b0af4080-564c-11ea-8262-6cd9dc273480.png">    

`comments 부분을 바꾸셨으면 위의 사진에서 Universal Embed Code의 소스를 
_include 폴더 안에 disqus.html 라는 이름의 파일로 만들어 줍니다.`     


## 댓글 기능 추가하기    


## Post 별로 댓글 기능 추가하기   

아래와 같이 댓글 기능을 추가하고자 하는 post의 상단 부분에 comment: true 를 추가 한다.     

```
 ---
 ...
 comments: true
 ...
 ---
```

그 후 맨 아래 부분에는 이 코드를 추가해 주시면 됩니다.    

<img width="250" alt="스크린샷 2020-02-23 오후 3 32 27" src="https://user-images.githubusercontent.com/26623547/75104895-bbb89f80-5651-11ea-8b05-56aa7b9b21f5.png">    

## 전체 post에 댓글 기능 추가하기    

post 의 footer를 담다하는 html 파일에 아래의 코드를 추가해주시면 됩니다.   


<img width="400" alt="스크린샷 2020-02-23 오후 3 35 16" src="https://user-images.githubusercontent.com/26623547/75104920-2c5fbc00-5652-11ea-92b2-c1b213d3979e.png">    



<a href="https://infiduk.github.io/2019/10/28/disqus.html">참고링크</a>

- - -

{% highlight ruby linenos %}
{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}








