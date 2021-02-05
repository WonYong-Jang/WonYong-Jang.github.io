---
layout: post
title: "[Git] Merge 이해하기 "
subtitle: "Merge / Squash and Merge / Rebase and Merge "
comments: true
categories : Git
date: 2021-02-05
background: '/img/posts/mac.png'
---

다른 사람과 협업을 할 때 git을 이용하여 형상관리를 함에 있어서 branch 간의 merge 또는 rebase의 
차이점을 알고있는 것이 매우 도움이 된다.    

아래 예시를 보면서 차이점을 확인해 보면 된다.  

여러 명이 공동으로 작업하는 repository를 clone 받아 작업을 한다고 생각해보자.   
master라는 공동의 브랜치가 존재하고 나는 my-branch라는 이름의 브랜치를 만들어서 
코드 작업을 한다.   

<img width="700" alt="스크린샷 2021-02-05 오전 12 14 30" src="https://user-images.githubusercontent.com/26623547/106913465-5b7a1b00-6747-11eb-963a-923ab98bc609.png">   


```
$ git branch my-branch
$ git checkout my-branch
```

위 처럼 my-branch 에서 작업을 다 끝내고 master 브랜치에 merge를 하려고 했는데, 내가 merge하기 전에 
누군가가 master 브랜치에 다른 작업을 한 후 commit하고 push했다. 그렇다면 
이런 모양이 될 것이다.   

<img width="700" alt="스크린샷 2021-02-05 오전 12 17 36" src="https://user-images.githubusercontent.com/26623547/106913915-da6f5380-6747-11eb-8a14-79c8143b91d1.png">   

**이 경우 my-branch를 master에 병합하는 방법에는 다음과 같은 것들이 있다.**   

## Merge   

하나의 브랜치와 다른 브랜치의 변경 이력 전체를 합치는 방법이다.   
commit a, b, c를 refer하는 m이 생성되고, m을 통해 a + b + c가 master에 추가 된다.   
m은 2개의 parent를 가진다.   

```
$ git checkout master     
$ git merge my-branch    
$ git push origin master   
```

<img width="488" alt="스크린샷 2021-02-05 오전 12 31 55" src="https://user-images.githubusercontent.com/26623547/106915764-c0367500-6749-11eb-9ffa-36bc49954712.png">   

<img width="700" alt="스크린샷 2021-02-05 오전 12 41 40" src="https://user-images.githubusercontent.com/26623547/106918064-376d0880-674c-11eb-82b0-58e2f468c605.png">   

- - - 

## Squash and Merge   

<img width="700" alt="스크린샷 2021-02-05 오전 12 22 38" src="https://user-images.githubusercontent.com/26623547/106914383-4fdb2400-6748-11eb-9dba-03be94660772.png">   

commit a + b + c를 합쳐서 새로운 commit, abc를 만들어지고 master에 추가된다.   
abc는 1개의 parent를 가진다.
`feature 브랜치의 commit history를 합쳐서 깔끔하게 만들기 위해 사용한다.`    

```
$ git checkout master
$ git merge --squash my-branch   
$ git commit -m "message"
```


<img width="400" alt="스크린샷 2021-02-05 오전 12 50 39" src="https://user-images.githubusercontent.com/26623547/106918175-4fdd2300-674c-11eb-9db6-bca8d08f115c.png">   

<img width="700" alt="스크린샷 2021-02-05 오전 12 50 18" src="https://user-images.githubusercontent.com/26623547/106918097-3dfb8000-674c-11eb-81da-eb04ee942ef4.png">
- - - 

## Rebase and Merge   

<img width="700" alt="스크린샷 2021-02-05 오전 12 22 47" src="https://user-images.githubusercontent.com/26623547/106914395-523d7e00-6748-11eb-8a95-786223859f34.png">   





- - - 

Refererence  

<https://im-developer.tistory.com/182>   

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

