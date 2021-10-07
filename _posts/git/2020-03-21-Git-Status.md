---
layout: post
title: "[Git] Git 상태 확인 하기 ( git status )"
subtitle: "Git 영역(staging area, local, remote repository) 및 상태 (Committed, Modified, Staged)"
comments: true
categories : Git
date: 2020-03-21
background: '/img/posts/mac.png'   
---    

Git은 파일들의 버전을 관리하는 분산 버전 관리 도구인 만큼 각각의 파일들이 
어떤 상태인지를 여러가지로 분류한다. 처음 Git을 사용하게 되면 
이러한 상태들을 이해하는 것은 어렵고, Git의 여러 영역과 추적 여부, 수정 여부에 
따라 복합적으로 여러가지 상태를 가지기 때문에 각각을 확실히 이해하는 것이 
중요하다.    

- - -   

## 1. Git에서 다섯가지 영역       

Git 프로젝트 디렉터리에는 .git(이하 git 디렉터리)를 포함하여 프로젝트를 구성하는
수많은 파일들이 존재한다.   
`Git 디렉터리(.git)는 Git 프로젝트에서 작업한 수많은 정보들과
여러 버전들에 대한 실제 데이터들을 저장하는 데이터베이스`이며, 그외 데이터들은
Git 디렉터리에서 특정 버전(특정 시점)의 데이터들을 Checkout한 것이다.    

이때 우리는 Checkout하여 가져온 버전의 파일들로 프로젝트 작업을 수행하며,
이 Checkout한 파일들이 존재하는 곳을 워킹트리 또는 워킹 디렉터리라고 한다.    
물리적으로는 Git 디렉터리나 워킹트리 모두 Git 프로젝트 디렉터리 안에 존재하지만
개념적으로 영역(단계)를 나눈 것이다.

<img width="963" alt="스크린샷 2021-10-07 오후 10 35 21" src="https://user-images.githubusercontent.com/26623547/136396204-20ee8047-7ba7-40d4-8a39-b5d460644e2d.png">   

`1. 워킹 디렉터리 : 프로젝트를 진행하는 실제 작업공간으로 개발한 소스 및 
자원이 존재하며 이곳에서 파일을 수정 및 추가 한다.`      

`2. Staging Area : index라고도 부르며, 워킹 디렉터리에서 작업한 내역을 Git 디렉터리로 커밋하기 위해
커밋 대상 목록으로 담아두는 장바구니 목록 같은 영역이다.`    

`3. Local Repository : 내 PC에 파일이 저장되는 개인 전용 저장소이다.`        

`4. Remote repository : 파일이 원격 저장소 전용 서버에서 관리되며 여러 사람이 함께 공유하기 위한 저장소이다.`   

`5. Stash : 아직 마무리하지 않은 작업을 잠시 저장할 수 있는 스택과 유사한 공간이다. 이를 통해 
아직 완료 하지 않은 작업을 commit 하지 않고 나중에 다시 꺼내와 마무리할 수 있다.`          

- - -   

## 2. Git 프로젝트에서 파일의 여러가지 상태    

### 2-1) Untracked 와 Tracked 상태    

워킹 디렉터리에 있는 여러가지 파일들은 Git의 추적 관리 여부에 따라 각각 크게
두가지 상태로 나눌 수 있다.     
`Untracked 와 Tracked 상태인데 뜻 그대로 Tracked 는 Git이 해당 파일을 추적
및 관리하는 상태이며, Untracked는 반대로 아직 Git이 해당 파일을 추적 및
관리하지 않는 상태를 말한다.`      

`이는 워킹 데렉터리에 존재하는 파일이라고 해서 모두 Git이 관리하는 파일은
아니라는 말이기도 하다.  따라서 Untracked 파일은 수정이 되거나 삭제가 되어도
Git은 전혀 신경쓰지 않으며, 해당 파일을 어떤 이유로 잃어 버려도 복구가 불가능하다.`     
대신 이러한 추적관리 시스템을 이용하면 Tracked 상태가 아닌 불필요한 파일들을 커밋하게
되는 실수를 방지할 수 있다.     

Tracked 상태인 파일은 최소한 한번은 git add 명령을 통해 Staging Area 에 포함되거나
 Commit을 통해 Git 디렉터리에 저장된 파일이다.     

위의 내용을 정리해보면,    

`워킹 디렉터리에 있지만 git add 나 commit 하지 않은 파일은 Untracked 상태,
 git add 나 commit 했던 적이 있는 파일들은 Tracked 상태이다.`    
`Tracked 상태인 파일들은 Git이 저장 및 관리하며, Untracked 파일은 Git이 신경 쓰지 않는다.`    

### 2-2) Unmodified와 Modified 상태   

Untracked와 Tracked가 추적관리 여부 관점에서 바라본 상태였다면, 
 파일 변경 여부에 따라 Modified(변경 발생), Unmodified(변경 없음) 상태로 나눌 수 있다.    

`변경 발생 기준 파일이 Staged 또는 Commit 된 시점 이후로 변경 되었는가 이다.`    

Staged 는 git add 명령어를 통해 Staging Area에 내역을 추가한 상태이며,
 git commit 명령을 통해 commit 한 경우 committed 상태이다.    

`Git이 관리하지 않는 상태인 Untracked 파일은 두 가지 변경 상태(Modified, Unmodified)를 갖지 
않으며, 이말은 곧 Unmodified 또는 Modified 상태인 파일은 곧 Tracked 상태인 것 이다.`     

<img width="816" alt="스크린샷 2020-03-21 오후 5 06 44" src="https://user-images.githubusercontent.com/26623547/77222431-5f846500-6b96-11ea-80b5-c737de8c75ff.png">      

- - -   

## 3. 실습해보기   

실습을 하기 위해 개인 프로젝트를 git clone하였다.   
git status 명령어로 확인해보면, 현재 master 브랜치로 체크아웃 되어 있으며,
커밋 내역이 없다는 내용을 확인할 수 있다.    

<img width="450" alt="스크린샷 2020-03-21 오후 6 53 54" src="https://user-images.githubusercontent.com/26623547/77224058-5e0e6900-6ba5-11ea-95c2-b5f47136d291.png">   

파일을 만든 직후 git status를 하니 Untracked files 목록에 생기는 것을 확인 할수 있다. 또한,
git add 나 git commit을 하지 않았기에 Untracked 상태미여, Git이 추적관리 하고 있지 않은 것이다.    

<img width="450" alt="스크린샷 2020-03-21 오후 6 58 44" src="https://user-images.githubusercontent.com/26623547/77224186-6ca95000-6ba6-11ea-87a6-f9a211501e58.png">    

git add 명령으로 Stage Area에 만든 파일의 내역을 등록하면 아래와 같은 상태가 된다.    

<img width="450" alt="스크린샷 2020-03-21 오후 7 00 01" src="https://user-images.githubusercontent.com/26623547/77224183-687d3280-6ba6-11ea-8c51-d4dbb16b85ca.png">    

다음으로 git commit 명령을 실행하면 파일은 Tracked 이면서, 커밋된 이후로 수정된
적이 없었으므로 Unmodified 이고, Committed 상태이다.     

<img width="450" alt="스크린샷 2020-03-21 오후 7 10 33" src="https://user-images.githubusercontent.com/26623547/77224312-b21a4d00-6ba7-11ea-946d-430a9d25dd2f.png">   

이번에는 commit 이후 파일을 수정한다면 아래와 같다.    

`Changes not staged for commit 은 변경은 일어났지만 커밋을 위해 Staged 되지
않은 (git add 하지 않은) 파일을 의미한다.`    
`즉, Tracked 상태이면서 Modified 상태이지만 Staged가 아닌 상태를 말한다.`    

<img width="450" alt="스크린샷 2020-03-21 오후 7 18 02" src="https://user-images.githubusercontent.com/26623547/77224496-9d3eb900-6ba9-11ea-81a7-0062705f97c0.png">   

git add 후 git status 상태를 확인하면 Changes to be committed 목록에 있으면서
modified라고 되어 있다. 즉, Staged 상태이면서 Modified 상태라는 것이다.     

<img width="450" alt="스크린샷 2020-03-21 오후 7 24 20" src="https://user-images.githubusercontent.com/26623547/77224499-a2036d00-6ba9-11ea-8f0c-35582ebd9547.png">

- - - 

Reference     

<https://querix.com/go/beginner/Content/05_workbench/01_ls/04_how_to/10_repo/git/00_intro.htm>   
<https://dololak.tistory.com/304>    

{% highlight ruby linenos %}


{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

