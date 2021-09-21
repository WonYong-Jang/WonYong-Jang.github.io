---
layout: post
title: "[Git] Upstream, Downstream, Origin "
subtitle: "협업을 위한 remote repository와 upstream 이해하기 / fork repository sync"
comments: true
categories : Git
date: 2021-09-21
background: '/img/posts/mac.png'
---

보통 협업을 진행하면 일반적으로 프로젝트를 내 repository로 fork를 하여 
개발을 진행하고, origin에 push 후 PR 진행 하곤 한다.    
이때 upstream과 origin이라는 용어를 보며, 비슷한 개념이겠지 하면서 
넘겼는데 모호하게 알고 있던 부분을 정리하고자 한다.   

upstream과 downstream이 무엇이며, 어떤 차이가 있는지와 
origin과 upstream에 대해 각각 알아보고 차이점에 대해 살펴보자.   

## Upstream, Downstream의 일반적인 개념     

사전적인 의미를 파악해보면, upstream은 상류, downstream이 하류이다.   
물이 상류에서 하류로 흐르듯이 pull 하는 주최가 downstream, 당하는 쪽이 upstream이다.   

<img width="700" alt="스크린샷 2021-09-21 오후 7 48 14" src="https://user-images.githubusercontent.com/26623547/134158005-a2070484-f68b-4ba5-a5fb-ecba804e48e9.png">   

`upstream과 downstream은 두 레포간의 관계에 따라 정의되는 상대적인 개념이다.`    
어떠한 repository가 절대적으로 upstream이거나 downstream이 아니라는 소리다.   

예를 들어 나의 repository가 myRepo이고 다른 repository가 otherRepo라 하자.   
내가 otherRepo로 부터 pull from 해오고 push to 한다면 나의 myRepo가 
downstream, otherRepo가 upstream으로 정의된다.    

- - - 

## Upstream과 Origin    

> 어떤 때는 remote origin이라고 하고, 어떤 때는 remote upstream이라고 하고..    
> 원격 저장소가 remote인건 알겠는데 그럼 origin은 뭐고 upstream은 뭐지?   

위에서 Upstream과 Downstream의 차이에 대해 살펴봤다. 그렇다면 
Upstream과 Origin은 어떤 차이가 있는지 살펴보자.    

이는 깃허브 fork 맥락에서 이해되어야 한다. 보통 Github에서 
오픈소스 프로젝트에 기여한다거나, 협업을 진행할 때 fork를 이용하게 된다.      
fork는 다른 사람의 repository를 내 소유의 repository로 복사하는 것이다. 따라서, 
    원래 소유자의 remote repository와 내가 fork한 remote repository 사이에도 
    upstream과 downstream이라는 관계가 형성된다.   
    `그래서 보통 원래 소유자의 remote를 말할 때 upstream, 내가 fork한 
    remote를 말할 때 origin이라는 용어를 사용하곤 한다.`        

`내가 다른 사람의 repository를 fork해왔을 때에 upstream은 일반적으로 
오리지널 repo(다른 사람의 repo)를 의미한다. 즉, 내가 OtherRepo를 
fork해왔다고 할 때에 이 OtherRepo가 upstream을 
지칭하는 것이다.`   
`한편 origin은 내 포크 repository를 의미한다.`


- - - 

## Fork repository sync   

그럼 fork 한 repository를 최신으로 동기화 하는 방법에 대해 살펴보자.   

이를 위해서는 먼저 원본 repository를 remote repository로 추가해야 한다.   
Fork 해온 repository에서 remote repository를 확인 하면 아래와 같이 나올 것이다.   

```
$ git remote -v
origin  https://github.com/YOUR_USERNAME/YOUR_FORK.git (fetch)
origin  https://github.com/YOUR_USERNAME/YOUR_FORK.git (push)  
```

여기에 동기화해오고 싶은 원본 repository를 upstream이라는 이름으로 추가한다.   

```
$ git remote add upstream https://github.com/ORIGINAL_OWNER/ORIGINAL_REPOSITORY.git   
```

upstream repository가 제대로 추가 되었는지 확인한다.   

```
$ git remote -v
origin    https://github.com/YOUR_USERNAME/YOUR_FORK.git (fetch)
origin    https://github.com/YOUR_USERNAME/YOUR_FORK.git (push)
upstream  https://github.com/ORIGINAL_OWNER/ORIGINAL_REPOSITORY.git (fetch)
upstream  https://github.com/ORIGINAL_OWNER/ORIGINAL_REPOSITORY.git (push)
```

이제 upstream repository로 부터 최신 업데이트를 가져올 차례이다.   
git의 fetch 명령어를 통해 upstream repository의 내용을 불러온다.   

```
$ git fetch upstream
remote: Counting objects: 75, done.
remote: Compressing objects: 100% (53/53), done.
remote: Total 62 (delta 27), reused 44 (delta 9)
Unpacking objects: 100% (62/62), done.
From https://github.com/ORIGINAL_OWNER/ORIGINAL_REPOSITORY
 * [new branch]      master     -> upstream/master
```

그 후 upstream repository의 master branch(혹은 원하는 branch)로 부터 
나의 local branch로 merge 한다.   

```
$ git checkout master
Switched to branch 'master'

$ git merge upstream/master
```

이 과정까지는 local repository에서 일어난 것이므로 push를 통해 
remote origin repository에도 적용시켜 주면 완료된다.   

```
$ git push origin master
```


- - - 

Refererence  

<https://aktiasolutions.com/upstream-kanban-business-agility/>   
<https://developer-alle.tistory.com/315>    
<https://json.postype.com/post/210431>   

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

