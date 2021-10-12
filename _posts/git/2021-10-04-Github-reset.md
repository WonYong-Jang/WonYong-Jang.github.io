---
layout: post
title: "[Git] Reset 명확히 알고 사용하기 "
subtitle: "HEAD의 이해 / Reset vs Checkout / git reset --hard, --mixed, --soft / Revert"
comments: true
categories : Git
date: 2021-09-21
background: '/img/posts/mac.png'
---


## git HEAD     

먼저 git HEAD라는 용어가 자주 등장하기 때문에 HEAD를 이해해보자.    

`git HEAD란 현재 작업하고 있는 working directory가 어떤 버전을 기반으로 해서 
수정되고 있는지를 보여준다.`           
`아래 그림으로 보면, 우리가 작업하고 있는 코드는 master가 가르키고 있는 C라는 버전이 만들어진 
시점에 working directory의 시냅샷을 기반으로 수정되고 있다.`           

<img width="300" alt="스크린샷 2021-10-06 오전 8 42 27" src="https://user-images.githubusercontent.com/26623547/136117702-8eaba91e-17c1-4aed-a077-d6254a477e38.png">    

그렇다면 HEAD를 옮긴다는 것은 무엇을 의미할까?    

<img width="300" alt="스크린샷 2021-10-06 오전 8 49 48" src="https://user-images.githubusercontent.com/26623547/136118989-ee4f5f9b-06dd-45a4-a247-ac381fcc0ef6.png">

위처럼 HEAD가 B를 가르키도록 옮기게 되면, B가 만들어진 시점의 스냅샷을 
현재 working directory로 변경하게 된다.     

- - -    

## Reset VS Checkout   

reset에 대해 알아보기 전에 비슷한 듯 다른 기능인 git checkout과 비교함으로서 
각각의 기능에 대해서 더 잘 이해해 보자.      

두 기능을 간략하게 정리해 보면 아래와 같다.    

- `git reset : 브랜치가 가르키는 버전을 바꾼다.`       
- `git checkout : HEAD가 가르키는 것(브랜치나 버전)을 바꾼다.`          

그럼 아래 그림에서 공통점과 차이점에 대해서 살펴보자.    

<img width="900" alt="스크린샷 2021-10-11 오후 10 50 49" src="https://user-images.githubusercontent.com/26623547/136801682-240fed53-c649-4627-a3e5-9aa922fe465d.png">   

우선 `checkout을 살펴보면, HEAD를 직접적으로 바꾼다.` 

`반대로 reset은 HEAD가 브랜치를 가르키고 있을때, 그 브랜치가 가르키고 있는 버전을 
바꾼다. 결국에는 브랜치를 바꾸는 효과이다.`   
`만약 HEAD가 아무것도 가르키지 않을때는 checkout과 동일하게 HEAD를 직접 바꾼다.`   



- - - 

Refererence  

<https://opentutorials.org/module/4032/24531>   

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

