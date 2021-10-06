---
layout: post
title: "[Git] Merge(3-way merge) 이해하기 "
subtitle: "Merge / Squash and Merge "
comments: true
categories : Git
date: 2021-02-05
background: '/img/posts/mac.png'
---

다른 형상관리툴들과는 달리 git은 branch를 생성할 때 파일을 복사하는 것이 아니라 파일의 스냅샷만 가지고 
생성하기 때문에 자원의 부담없이 branch를 만들어 사용할 수 있다. 이러한 장점 때문에 git으로 작업을 할 때에는 다양한 
용도의 branch를 만들어 사용하는데, Git에서 한 브랜치에서 다른 브랜치로 합치는 방법으로는 크게 두 가지가 있다.       
하나는 Merge이고 다른 하나는 Rebase이며 
다른 사람과 협업을 할 때 git을 이용하여 형상관리를 함에 있어서 branch 간의 merge 또는 rebase의 
사용법과 차이점을 알고있는 것이 협업을 할 때 매우 도움이 된다.   

이 글에서는 Git Merge(3-way merge)를 중점으로 다룰 예정이다. 
다음 글에서는 Rebase를 소개하고 차이점에 대해서 살펴 보려고 한다.   

아래 예시를 보면서 사용법을 확인해보면서 이해해보자.     

여러 명이 공동으로 작업하는 repository를 clone 받아 작업을 한다고 생각해보자.   
master라는 공동의 브랜치가 존재하고 나는 my-branch라는 이름의 브랜치를 만들어서 
코드 작업을 한다.   

<img width="600" alt="스크린샷 2021-02-05 오전 12 14 30" src="https://user-images.githubusercontent.com/26623547/106913465-5b7a1b00-6747-11eb-963a-923ab98bc609.png">   


```shell   
$ git branch my-branch
$ git checkout my-branch
```

위 처럼 my-branch 에서 작업을 다 끝내고 master 브랜치에 merge를 하려고 했는데, 내가 merge하기 전에 
누군가가 master 브랜치에 다른 작업을 한 후 commit하고 push했다. 그렇다면 
다음과 같은 모양이 될 것이다.   

<img width="649" alt="스크린샷 2021-09-19 오후 7 39 35" src="https://user-images.githubusercontent.com/26623547/133924477-e1247a69-2936-4ee1-afb2-3ca2f9943fee.png">   

위의 예제를 가지고 우리에게 익숙한 Merge에 대해서 먼저 알아보고 Rebase에 
대해서도 살펴보자.   

- - -    

# 1. Merge     

위에서 my-branch 브랜치를 생성하고 작업이 끝난 다음 master에 merge를 진행할 때까지, 
    master에 어떠한 변경도 없다면 fast-forward merge가 진행되어 커밋 로그에 깔끔한 그래프를 그려줄 것이다.   

`서로 다른 상태를 병합하는 것이 아니고 master를 my-branch 위치로 이동만 해도 되는 상태이기 때문에 
별도의 merge를 위한 커밋이 발생하지 않는다.`       

하지만 협업을 하다보면 다른 동료가 먼저 master에 merge를 진행하여 변경이 일어난 경우는 
fast-forward로 merge 될 수 없다.   

그럼 master 브랜치에서도 몇개의 commit이 더 발생한 경우의 merge 전략은 다음과 같다.   

`Merge 브랜치에서 사용하는 전략은 각 브랜치의 마지막 커밋 두 개와 공통 조상의 
총 3개의 커밋을 이용하는 3-way merge를 수행하여 새로운 커밋을 만들어내는 것이다.`   

`가령, 다음 그림에서 보이는 feature와 master의 마지막 커밋은 각각 f2와 
m2, 그리고 공통 조상(base)은 b이다. 따라서, 이 세 커밋으로 새로운 
커밋을 만들게 될 것이다.`            

<img width="600" alt="스크린샷 2021-09-20 오후 4 08 48" src="https://user-images.githubusercontent.com/26623547/133967099-fb9c6c30-2d6b-4296-aa7c-07d6095d06bd.png">   

그럼 이제 처음 예시를 가지고 git merge를 해보면 다음과 같다.    

<img width="600" alt="스크린샷 2021-09-12 오후 6 08 09" src="https://user-images.githubusercontent.com/26623547/132981921-48e2abb4-43ea-496d-9aa1-6ea9621fb058.png">    

아래 명령어를 통해 merge를
진행하게 되면 하나의 브랜치와 다른 브랜치의 변경 이력 전체를 합친다.
commit a, b, c를 refer하는 m이 생성되고, m을 통해 a + b + c가 master에 추가 된다.
m은 2개의 parent를 가진다.   

```shell
$ git checkout master
$ git merge my-branch
$ git push origin master
```

<img width="500" alt="스크린샷 2021-09-19 오후 7 35 52" src="https://user-images.githubusercontent.com/26623547/133924388-396d76e0-a267-407b-b567-85aa23d384da.png">


그렇다면 여기서 3-way merge는 정확하게 어떤 과정일까?    
마지막 커밋 두개만 비교해서 2-way merge를 하면 안되는 걸까?   
먼저, 3-way merge에 대해 이해해보자.   

### 1-1) 3-way merge    

비교를 위해 필요한 3개의 커밋을 다시 정리하면 필요한 것은 
다음 세 가지 커밋이다.   

1. 내 브랜치 커밋   
2. 남의 브랜치 커밋   
3. 두 브랜치의 공통 조상이 되는 커밋   

이제 3-way merge가 효율적인 이유를 알아보자.   

우선, 공통 조상이 되는 커밋을 Base라고 가정하고, 변경된 부분이 a, b, c, d라고 
가정해보자.   
다음 표에 비교할 두 브랜치와 공통 조상 Base를 표에 기록해보자.   

<img width="700" alt="스크린샷 2021-09-19 오후 8 50 21" src="https://user-images.githubusercontent.com/26623547/133926500-e58059b8-29a2-4174-968e-a215c6cffb25.png">   

내 브랜치(My)와 남의 브랜치 (Other)에서 변경된 내역은 각각 아래의 표에 적힌 것과 같다.    

<img width="700" alt="스크린샷 2021-09-19 오후 8 50 39" src="https://user-images.githubusercontent.com/26623547/133926503-8521332e-575e-4640-9187-781e33e66df8.png">   

첫 번째 a를 살펴보면 내 브랜치에서는 a부분에 대해 변경 사항이 없이 그대로 
a이며, 다른 사람은 a'로 변경했다.   
두 번째 b에서는 양쪽 다 변경되지 않았으며, c는 둘 다 서로 다른 내용으로 
변경했다.   
마지막 d 부분은 내 브랜치에서만 변경했다.   

이때, base가 되는 공통 조상 커밋이 없고 나와 다른 사람의 브랜치만 비교하여 
Merge를 한다고 해보자.   

<img width="700" alt="스크린샷 2021-09-19 오후 8 50 44" src="https://user-images.githubusercontent.com/26623547/133926508-cb622b7b-c450-465e-9d50-2c918bb39cc8.png">   

양쪽에서 동일하게 관찰되는 b부분을 제외하고는 a가 원래 a였는지 a'였는지 
확실하게 정하기가 어렵다. `따라서 충돌이 난 것인지의 여부도 
알 수가 없다.`      

`하지만 base 커밋을 함께 비교하여 3-way merge를 수행하면 다음 표와 같이 
merge 커밋의 상태를 보다 명확하게 결정할 수 있게 된다.`       


<img width="700" alt="스크린샷 2021-09-19 오후 8 50 50" src="https://user-images.githubusercontent.com/26623547/133926511-e68926da-893a-4ddf-b576-b660ac8d31d2.png">   

`다시 정리하면, git은 merge를 할 때 각 브랜치의 마지막 커밋 두 개, 브랜치의 
공통 조상 커밋 총 3개의 커밋을 비교하여 
새로운 커밋을 만들어 병합을 수행한다.`   


- - - 

# 2. Squash and Merge   

<img width="600" alt="스크린샷 2021-02-05 오전 12 22 38" src="https://user-images.githubusercontent.com/26623547/106914383-4fdb2400-6748-11eb-9dba-03be94660772.png">   

commit a + b + c를 합쳐서 새로운 commit, abc를 만들어지고 master에 추가된다.   
abc는 1개의 parent를 가진다.
`feature 브랜치의 commit history를 합쳐서 깔끔하게 만들기 위해 사용한다.`    

```shell   
$ git checkout master
$ git merge --squash my-branch   
$ git commit -m "message"
```

<img width="600" alt="스크린샷 2021-09-19 오후 7 17 34" src="https://user-images.githubusercontent.com/26623547/133923887-dda62e49-7038-4b4c-8855-0b9daea8fa0b.png">     


[다음 글](https://wonyong-jang.github.io/git/2021/02/05/Github-Rebase.html)에서는 
브랜치 병합 방법 중 하나인 Rebase에 대해서 살펴볼 예정이다.      


- - - 

Refererence  

<https://velog.io/@godori/Git-Rebase>   
<https://flyingsquirrel.medium.com/git-rebase-%ED%95%98%EB%8A%94-%EB%B0%A9%EB%B2%95-ce6816fa859d>    
<https://im-developer.tistory.com/182>     
<https://wormwlrm.github.io/2020/09/03/Git-rebase-with-interactive-option.html?fbclid=IwAR0AHUnsFJXXVnckeX79Sl5cJ-WDevprKuNWva5anEMAjgO-NtZYbIFNuic>    
<https://git-scm.com/book/ko/v2/Git-%EB%B8%8C%EB%9E%9C%EC%B9%98-Rebase-%ED%95%98%EA%B8%B0>    

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

