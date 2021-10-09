---
layout: post
title: "[Git] Merge(3-way merge) 이해하기 "
subtitle: "Merge 전략 / Merge의 종류(--ff, --no-ff, --ff-only, --squash)"
comments: true
categories : Git
date: 2021-02-05
background: '/img/posts/mac.png'
---

다른 형상 관리툴들과는 달리 git은 branch를 생성할 때 파일을 복사하는 것이 아니라 파일의 스냅샷만 가지고 
생성하기 때문에 자원의 부담없이 branch를 만들어 사용할 수 있다. 이러한 장점 때문에 git으로 작업을 할 때에는 다양한 
용도의 branch를 만들어 사용하는데, Git에서 한 브랜치에서 다른 브랜치로 합치는 방법으로는 크게 두 가지가 있다.       
하나는 Merge이고 다른 하나는 Rebase이며 
다른 사람과 협업을 할 때 git을 이용하여 형상관리를 함에 있어서 branch 간의 
병합을 진행할 때 merge 또는 rebase의 
사용법과 차이점을 알고있는 것이 협업을 할 때 매우 도움이 된다.    

`여러가지 Merge 전략이 존재하는 이유는 그 만큼 Merge를 할 때 커밋 히스토리를 
어떤 방식으로 남길 것이냐를 선택할 수 있는 것이 중요 하다고 말할수 있다.`    
커밋(Commit)이란 Git을 구성하는 중요한 요소 중 하나이며, 
    `원칙적으로 하나의 커밋은 의미있는 하나의 변경사항을 의미한다.`    
즉, 커밋 메시지만 보고도 어떤 사항이 어떤 이유로 변경되었는지 쉽게 
파악할 수 있어야 한다는 것이다.   

이 커밋들이 모여서 시간 순으로 정렬된 것을 Commit History라고 부른다. 커밋 히스토리가 
굉장히 중요하다고 하는 이유는 여러가지가 있겠지만 대표적인 두가지는 다음과 같다.   

- 버그가 발생했을 경우    
예를 들면, 배송 모듈에서 버그가 발견되었을 경우, 개발자들은 배송 관련 코드 부터 뜯어보기 
시작할 것이다. 하지만 대부분의 프로그램은 내부적으로 수많은 모듈 간의 디펜던시가 
얽혀 있는 경우가 많기 때문에 그걸 짧은 시간안에 전부 파악하고 버그의 원인을 
찾아서 수정한다는 것은 쉬운 일이 아니다. 이때 잘 정리된 히스토리가 있다면 
이번 배송 관련하여 수정된 커밋만 찾아서 어떤 코드가 수정되었는지 
빠르게 확인할 수 있다.     

- 레거시 코드를 수정해야 할 때    
레거시 코드를 수정해야 할 때 가장 힘든 점은 이걸 건드렸을 때 
다른 부분에 문제가 없을 것이란 보장이 없기 때문이다. 이 때 
가장 의지할 것은 당시의 개발자가 어떤 의도로 코드를 
고쳤는지 기록해 놓은 커밋 히스토리 밖에 없기 때문에 
커밋 히스토리를 잘 관리하는 것이 중요하다.  

`그래서 개발자들이 의미 있는 단위의 커밋, 의미 있는 커밋 메시지를 
강조하는 것이고 여기에 더해 적절한 머지 전략을 사용하여 
가독성을 높이고 의미있는 커밋 히스토리를 유지하려고 하는 것이다.`       

이 글에서는 Git Merge(3-way merge)와 Merge의 종류에 대해 중점으로 다룰 예정이다.     
다음 글에서는 Rebase를 소개하고 차이점에 대해서 살펴 보려고 한다.   

- - -    

# 1. Merge     

Merge는 우리가 알고 있는 일반적인 Merge 전략이다. Merge의 장점은 
기존 개발자들에게 익숙한 개념이라는 것과 머지된 브랜치가 삭제되어 
사라졌다고 해도 히스토리 그래프 상에서는 그대로 다른 가지로 표기 되기 
때문에 `어떤 브랜치에서 어떤 커밋이 진행되어 어떻게 머지 되었는지에 대한 
자세한 정보를 얻을 수 있다.`   

<img width="800" alt="스크린샷 2021-10-09 오후 8 41 27" src="https://user-images.githubusercontent.com/26623547/136656567-d05ed4e8-f990-44c8-b0aa-36319e893def.png">   

반면에 단점은 너무 자세하게 히스토리가 남기 때문에 브랜치의 개수가 
많아지거나 머지 횟수가 잦아질수록 히스토리 그래프의 
가독성이 떨어진다는 것이다.   

또한 원칙적으로 커밋은 의미있는 변경 사항의 최소 단위라고는 하지만 
사실 실무에서 일을 하다보면 오타 수정과 같은 자잘한 커밋을 하는 경우도 
많다. 사실 이런 자잘한 커밋의 경우 별로 정보성이 없기 때문에 이런 커밋들이 
많아지면 오히려 히스토리의 가독성을 저해하는 원인이 된다.   

<img width="800" alt="스크린샷 2021-10-09 오후 8 41 33" src="https://user-images.githubusercontent.com/26623547/136656568-a7566b6f-7bc6-4f50-aaf0-255dd89e7f73.png">

위 그림에서 볼 수 있듯이 `Merge가 수행되었을 때 생기는 Merge commit은 
어느 순간에 어떤 브랜치의 변경사항이 머지되었다라는 소중한 
정보를 주는 커밋`이지만 개발이 진행되고 있는 브랜치가 많아진 
상황에서는 이 Merge commit들과 해당 브랜치에서 발생한 커밋들이 전부 
기록되기 때문에 그래프가 너무 복잡해져서 오히려 히스토리를 
추적하기가 힘들 수 있다.   

이제 예시를 통해서 Merge 사용법을 살펴보자.   

아래와 같이 my-branch 브랜치를 생성하고 작업이 끝난 다음 master에 merge를 진행할 때까지, 
    master에 어떠한 변경도 없다면 fast-forward merge가 진행되어 커밋 로그에 깔끔한 그래프를 그려줄 것이다.   

<img width="721" alt="스크린샷 2021-10-09 오후 2 20 06" src="https://user-images.githubusercontent.com/26623547/136645167-097ce66e-2c52-4f79-b2dd-f355cc9d4f61.png">     

`즉, 서로 다른 상태를 병합하는 것이 아니고 master를 my-branch 위치로 이동만 해도 되는 상태이기 때문에 
별도의 merge를 위한 커밋이 발생하지 않는다.`     
`다시말해 master 브랜치에 my-branch 브랜치를 Merge할 때 my-branch가 master 
이후 커밋을 가르키고 있으면 그저 master를 my-branch와 동일한 커밋을 
가르키도록 이동 시킬 뿐이다.`     
`이런 Merge 방식을 Fast forward라고 부른다.`      

하지만 협업을 하다보면 다른 동료가 먼저 master에 merge를 진행하여 변경이 일어난 경우는 
fast-forward로 merge 될 수 없다.   

그럼 master 브랜치에서도 몇개의 commit이 더 발생한 경우의 merge 전략은 다음과 같다.   

`Merge 브랜치에서 사용하는 전략은 각 브랜치의 마지막 커밋 두 개와 공통 조상의 
총 3개의 커밋을 이용하는 3-way merge를 수행하여 새로운 커밋을 만들어내는 것이다.`   

`가령, 다음 그림에서 보이는 feature와 master의 마지막 커밋은 각각 f2와 
m2, 그리고 공통 조상(base)은 b이다. 따라서, 이 세 커밋으로 새로운 
커밋을 만들게 될 것이다.`           

<img width="600" alt="스크린샷 2021-10-09 오후 2 54 13" src="https://user-images.githubusercontent.com/26623547/136645982-1ee2d385-d743-45b2-ae7c-335e72727568.png">    

위 예시를 가지고 git merge를 해보면 다음과 같다.   

```shell   
$ git checkout master
$ git merge my-branch
$ git log --all --oneline --graph    

*   e758248 (HEAD -> master) Merge branch 'my-branch'
|\
| * 6519246 (my-branch) f2
| * 3eea72e f1
* | dbfd4e9 m2
* | 1d1825a m1
|/
* 48641e5 base
```

`위 결과를 살펴보면 하나의 브랜치와 다른 브랜치의 모든 변경 이력을 
합치는 방식으로 최종적으로 Merge commit이 새로 생성되고 2개의 부모를 가지게 
된다.`        

그렇다면 여기서 3-way merge는 정확하게 어떤 과정일까?    
마지막 커밋 두개만 비교해서 2-way merge를 하면 안되는 걸까?   
먼저, 3-way merge에 대해 이해해보자.   

- - - 

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

# 2. Merge의 종류    

Merge는 여러 옵션이 존재하며, 각 옵션은 다음과 같다.   
ff는 Fast-Forward의 약자이며, 이 글에서는 squash를 이용한 merge에 대해서 
자세히 살펴볼 예정이다.   

```
1) --ff  
$ git merge {병합할 브랜치 명}    
merge를 진행할 때 아무 옵션을 주지 않는 경우이며, 위에서 살펴보았던 Merge 방법과 
동일하다.   
현 브랜치와 병합할 브랜치가 Fast-forward 관계이면 Fast-forward 병합을 진행하며, 
 그렇지 않은 경우는 Merge 커밋을 생성하여 3 way-merge를 진행한다.   


2) --no-ff   
$ git merge --no-ff {병합할 브랜치 명}
현재 브랜치와 병합 대상의 관계가 Fast-forward관계 여부와 상관없이 
Merge 커밋을 생성하여 병합한다.     


3) --ff-only   
$ git merge --ff-only {병합할 브랜치 명}   
현재 브랜치와 병합 대상의 관계가 Fast-forward인 경우에만 병합을 진행한다. 
Merge 커밋 생성되지 않는다.   


4) --squash
$ git merge --squash {병합할 브랜치 명}     
```

### Squash and merge   

`Squash는 여러 개의 커밋을 하나로 합치는 기능을 말한다. 즉, 
    이 기능은 머지할 브랜치의 커밋을 전부 하나의 커밋으로 
    합친 뒤 타겟 브랜치에 커밋하는 방식으로 머지를 진행한다.`    

`Squash and merge 전략은 머지된 브랜치의 자잘한 커밋 사항이 남지 않기 
때문에 머지가 되었다라는 사실 자체에만 집중한 기록이 남게되고, 
    그로 인해 변경 사항을 읽기가 한결 수월해진다.`   

`단점으로는 일반적은 머지 커밋보다는 아무래도 정보력이 떨어진다는 
것이다. 일반 머지는 해당 브랜치에서 누가 어떤 커밋을 통해 
어떤 라인을 수정했는지 까지 알려주지만 Squash and merge 전략은 
머지 대상 브랜치의 모든 커밋을 하나로 통합해버리기 때문에 
그 정도의 자세한 정보는 알 수가 없다.`   

아래 예제를 살펴보자.   

<img width="706" alt="스크린샷 2021-10-09 오후 9 00 07" src="https://user-images.githubusercontent.com/26623547/136657024-f83d4bab-aedf-4ab2-9ebe-2f61ff2f6975.png">   

commit a, b, c를 합쳐서 새로운 commit, abc를 만들고 master에 추가된다.    
abc 커밋은 1개의 parent를 가진다.    
`feature 브랜치의 commit history를 합쳐서 깔끔하게 만들기 위해 사용한다.`    

```shell   
$ git checkout master
$ git merge --squash my-branch   
$ git commit -m "message"
```



[다음 글](https://wonyong-jang.github.io/git/2021/02/05/Github-Rebase.html)에서는 
브랜치 병합 방법 중 하나인 Rebase에 대해서 살펴볼 예정이다.      


- - - 

Refererence  

<https://velog.io/@godori/Git-Rebase>   
<https://flyingsquirrel.medium.com/git-rebase-%ED%95%98%EB%8A%94-%EB%B0%A9%EB%B2%95-ce6816fa859d>    
<https://im-developer.tistory.com/182>     
<https://wormwlrm.github.io/2020/09/03/Git-rebase-with-interactive-option.html?fbclid=IwAR0AHUnsFJXXVnckeX79Sl5cJ-WDevprKuNWva5anEMAjgO-NtZYbIFNuic>    
<https://git-scm.com/book/ko/v2/Git-%EB%B8%8C%EB%9E%9C%EC%B9%98-Rebase-%ED%95%98%EA%B8%B0>    
<https://evan-moon.github.io/2019/08/30/commit-history-merge-strategy/>   

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

