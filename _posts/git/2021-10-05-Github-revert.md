---
layout: post
title: "[Git] Revert를 사용하여 커밋 되돌리기"
subtitle: "reset과 revert비교 / 협업을 위해 revert 사용하기 / Conflict 해결 "
comments: true
categories : Git
date: 2021-10-05
background: '/img/posts/mac.png'
---

[이전글](https://wonyong-jang.github.io/git/2021/10/04/Github-reset.html) 에서 
reset에 대해서 살펴보았다.   
커밋을 되돌릴 때 reset을 사용할 수도 있지만 remote repository에 이미 
push한 내용을 변경하려면 force push를 해야만 한다.   
협업할 때 force push를 사용하게 되면, 다른 동료가 엄청난 conflict가 
발생할 수 있어서 사용을 지양해야 한다.    
이럴 때 사용할 수 있는 명령어가 바로 특정 커밋의 내용을 되돌리는 
revert이다.    

이 글에서는 git revert를 사용하는 방법에 대해서 알아보자.   

- - - 

## Reset VS Revert     

아래 그림을 보면 A라는 커밋 버전이 있고 그 후 B라는 커밋이 있을 때, 
    B라는 커밋에서 버그를 발견했다고 가정해보자.      

이 상황에서 B의 작업 내용을 취소하고 싶을 때 reset과 revert를 
각각 어떻게 사용해야 할까?      

<img width="800" alt="스크린샷 2021-10-14 오후 10 30 06" src="https://user-images.githubusercontent.com/26623547/137327348-5d7588fd-80c2-4db0-873c-ded4ede58fcb.png">       

reset의 경우는 그 이전 커밋인 A로 되돌아 가게 되면, B 커밋은
delete 효과가 날 것이다. 즉, master는 커밋 A를 가르키기 때문에
working directory는 A의 스냅샷이 적용될 것이다.

`여기서 협업을 할 때 큰 문제가 있다. B라는 커밋이 완전히 사라지기 때문에
버그를 발견했다라는 히스토리 조차 남게 되지 않는 것이다.`

그럼 revert를 사용했을 때 어떻게 될까?   

`revert는 B라는 커밋의 변경사항을 제거하여 새로운 커밋 C를 만들어 낸다.`   
`즉, revert를 사용하여 버그가 있는 커밋 B의 변경사항을 
삭제 했다는 목표를 달성했고, 협업을 위하여 
버그를 수정했다라는 커밋 히스토리도 유지할 수 있게 되었다.`   

<img width="800" alt="스크린샷 2021-10-14 오후 10 42 47" src="https://user-images.githubusercontent.com/26623547/137329643-59cbe256-363e-43eb-ae5a-c5221d9018ec.png">   

- - - 

## revert 충돌 해결     

revert는 취소하고 싶은 커밋만 명시하게 되면, 명시한 커밋의 변경사항을 
제외한 새로운 커밋을 생성한다.      
`하지만, 명시한 커밋 내용 중에 최근에 동일한 내용을 
변경한 커밋이 존재하게 되면 충돌을 발생시킨다.`                 
[3-way-merge](https://wonyong-jang.github.io/git/2021/02/05/Github-Merge.html) 기법을 이용하여 
비교 후 자동 merge가 불가능 할 경우 충돌을 발생시켜 사용자가 직접 해결 하도록 한다.      

예를 들면 아래와 같은 예시를 들 수 있다.   
A, B, C, D 순서로 커밋이 진행 되었고, B 커밋에 처음 버그가 발견되었다.   
그 후에 버그가 발견됨을 알지 못하고 C 커밋이 진행되었고, 
    B 커밋의 버그가 발견된 동일한 라인에 D 커밋의 변경사항이 
    추가 되었다.   
즉, D 커밋을 하고 나서야 B 커밋에 버그가 있음을 발견하였고, B 커밋을 
revert 했을 때 충돌이 발생하게 된다.   

<img width="500" alt="스크린샷 2021-10-17 오후 11 24 06" src="https://user-images.githubusercontent.com/26623547/137631681-eea42b14-1975-4abf-88fe-733f2a60443f.png">    

B 커밋을 revert 하는 경우를 다시 한번 생각해보면 
  우리가 원하고자 하는 것은 B 커밋의 
변경사항을 제거 하는 것이다.    
또한, B 커밋의 변경사항을 제거하고 B 커밋 이후의 변경사항들 병합하여 
새로운 커밋을 생성하는 것이다.   

우선 B 커밋의 변경사항을 제거하기 위해서는 B 커밋을 
Base로 해서 그 이전 커밋인 A와 비교해야 할 것이다. 
또한, B의 변경사항을 제외하여 가장 최신 커밋인 D에 병합해야 하기 
때문에 D 커밋과도 비교를 해야한다.    
즉, 위의 경우 A, B, D 3개의 커밋을 비교하여 3-way-merge를 진행하게 된다.   

충돌이 발생하게 되면 충돌 파일을 수정하고 난 후 아래와 같이 
명령어를 진행하면 된다.   

```shell
$ git add 수정 파일 
$ git revert --continue // 충돌 해결 

$ git revert --abort // 충돌 이전으로 되돌아 가기 
```



- - - 

Refererence  

<https://opentutorials.org/module/4032/24531>   

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

