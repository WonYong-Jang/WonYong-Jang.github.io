---
layout: post
title: "[Git] Reset 명확히 알고 사용하기 "
subtitle: "HEAD의 이해 / Reset vs Checkout / git reset --hard, --mixed, --soft "
comments: true
categories : Git
date: 2021-10-04
background: '/img/posts/mac.png'
---

Git을 사용하여 작업을 하다 보면 커밋한 내용을 되돌려야할 때가 있다. 
혼자서 작업하거나 로컬에서 작업 중일 때는 reset 명령어로 브랜치를 특정 커밋으로 
완전히 되돌려 버릴 수 있다.    
또한, revert를 사용하여 커밋을 되돌리는 것도 가능하며, 이번 글에서는 
reset 사용법과 여러 옵션을 사용했을 때 차이점에 대해서 알아볼 예정이다.   

## 1. git HEAD     

git reset을 설명할 때 HEAD라는 용어가 자주 등장하기 때문에 
먼저 HEAD를 이해해보자.    

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

## 2. reset VS checkout   

reset에 대해 알아보기 전에 비슷한 듯 다른 기능인 git checkout과 비교함으로서 
각각의 기능에 대해서 더 잘 이해해 보자.      

두 기능을 간략하게 정리해 보면 아래와 같다.    

- `git reset : 브랜치가 가르키는 버전을 바꾼다.`       
- `git checkout : HEAD가 가르키는 것(브랜치나 버전)을 바꾼다.`          

그럼 다음 그림에서 공통점과 차이점에 대해서 살펴보자.    

<img width="900" alt="스크린샷 2021-10-11 오후 10 50 49" src="https://user-images.githubusercontent.com/26623547/136801682-240fed53-c649-4627-a3e5-9aa922fe465d.png">    

위 그림에서 git reset B 와 git checkout B는 각각 어떤 의미일까?      

<img width="800" alt="스크린샷 2021-10-13 오후 10 05 11" src="https://user-images.githubusercontent.com/26623547/137143105-1622a7cd-3d28-42f1-b6b4-2f4bd9ff746a.png">   

checkout과 reset의 공통점에 대해서 살펴보면,
    둘 다 working directory는 버전 B을 가르킨다.

하지만 둘 사이에는 큰 차이점이 있다.   

우선 `checkout을 살펴보면, HEAD를 직접적으로 바꾼다.`   
`즉, HEAD를 바꿨을 뿐 master가 가르키는 버전은 그대로이다.`      
> 참고로 HEAD가 브랜치를 바라보지 않고 버전(commit)을 직접 가르키고 있다면 여러 복잡성과 
위험성이 존재하기 때문에, git에서 브랜치로부터 Detatched 된 상태라는 경고 메시지를 보여주게 된다.    


`반대로 reset은 HEAD가 브랜치를 가르키고 있을때, 그 브랜치가 가르키고 있는 버전을 
바꾼다.`          
`즉, master가 가르키고 있는 버전을 바꿨다.`      
만약 HEAD가 아무것도 가르키지 않을때는 checkout과 동일하게 HEAD를 직접 바꾼다.    
또한, master 버전이 B로 이동했기 때문에 버전 C는 delete 효과가 있다.   

`reset 후 git log --all을 통해서 확인을 해보면 버전 C가 완전히 
삭제된 것처럼 보이지만, 버전 C라는 커밋 ID를 알고 있거나 
    git reflog를 통해서 C의 커밋 ID를 확인하여 다시 복원도 
가능하다.`       

- - - 

## 3. git reset 옵션(hard, mixed, soft)

위에서 reset은 HEAD가 브랜치를 가르키고 있을 때, 그 브랜치가 가르키고 있는 
버전(commit)을 변경하는 작업이라고 설명했다.    

`이때 옵션을 --hard, --mixed, --soft 중 무엇으로 주느냐에 따라서 
stage, working directory의 상태가 달라진다.`         
여기서는 이 옵션들의 미묘한 차이에 대해서 살펴보자.   


<img width="800" alt="스크린샷 2021-10-13 오후 11 00 12" src="https://user-images.githubusercontent.com/26623547/137148164-7ba74084-99e5-46ae-86ee-2f32c91fb7a4.png">    

위 그림은 각각 옵션에 따라서 git의 어느 영역까지 reset을 할건지를 
보여주는 그림이다.    

<img width="800" alt="스크린샷 2021-10-13 오후 11 29 46" src="https://user-images.githubusercontent.com/26623547/137153630-660b904d-4b86-4a9b-b52f-d206a3393e68.png">   

조금 더 구체적인 그림을 살펴보면, 변경사항이 1부터 3까지 있고 
    그에 따른 버전(commit)이 A, B, C로 이어져 있다.   
    여기서 reset을 이용하여 버전 B로 변경한다고 했을 때, 각 옵션에 따라서 
    차이점을 알아보자.   
   
그림에서 보는 것처럼 reset을 할 때 hard 옵션을 주게되면, staging area, working 
directory의 작업까지 모두 reset을 하게 된다. 즉, 작업 하던 내용이 남아 있다면 모두 
사라지게 되니 주의해서 사용해야 한다.   
`이전 버전으로 돌아갈때 사용할 수도 있지만, 
    git reset --hard HEAD를 사용하여 현재 작업하고 있는 내용을 모두 
지우고 현재 가르키고 있는 버전의 스냅샷부터 다시 작업할때도 사용 가능하다.`     


mixed 옵션(default)의 경우는 옵션을 주지 않고 reset을 하는 것과 동일하며, staging area는 reset을 
하며 working directory의 작업은 남겨둔다.    
현재 작업하고 있는 내용은 유지하며, 이전 버전으로 돌아가서 다시 작업 후 
commit을 진행할 때 유용하다.   

soft 옵션은 staging area, working directory의 작업은 남겨두고 reset을 
한다.    


reset에 대해서 살펴봤고 다음 글에서는 revert를 살펴보고 
둘의 차이점에 대해서 살펴보자.   

- - - 

Refererence  

<https://opentutorials.org/module/4032/24531>   

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

