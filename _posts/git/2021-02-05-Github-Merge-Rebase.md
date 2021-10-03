---
layout: post
title: "[Git] Merge(3-way merge) 와 Rebase 이해하기 "
subtitle: "Merge / Squash and Merge / Rebase and Merge / rebase interactive"
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

아래 예시를 보면서 사용법과 차이점에 대해 자세히 살펴보자.   

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


- - - 

# 3. Rebase and Merge   

`두 브랜치를 합치는 두 번째 방법인 Rebase는 Merge와는 다르게 이름 그대로 브랜치의 
공통 조상이 되는 base를 다른 브랜치의 커밋 지점으로 바꾸는 것이다.`    

우리가 rebase를 수행하여 얻고자 하는 목적은 master 브랜치의 마지막 커밋인 m2 이후에 
feature의 변경사항인 f1과 f2가 일어난 것처럼 보이게 하고 싶은 것이다.   

아래의 그림과 같다.   

<img width="700" alt="스크린샷 2021-09-19 오후 9 13 02" src="https://user-images.githubusercontent.com/26623547/133927057-539dd858-dc43-48a9-a1a1-982540963a04.png">     

`즉, feature의 base를 b가 아니라 m2로 재설정(Rebase)하는 것이다!`   

```
feature를 master에 rebase한다   
   = 
feature의 master에 대한 공통 조상인 base를 master로 변경한다.   
```


Rebase의 기본 전략은 다음과 같다.    

`먼저 Rebase 하려는 브랜치 커밋들의 변경사항을 Patch라는 것으로 만든 다음에 
어딘가에 저장해 둔다. 그리고 이를 master 브랜치에 하나씩 적용시켜 
새로운 커밋을 만드는 것이다.`        

feature를 master 브랜치로 rebase하는 명령어를 살펴보면 일련의 단계를 
거쳐 두 브랜치의 병합이 완료된다.   

```
$ git checkout feature   
$ git rebase master  
$ git checkout master   
$ git merge feature   
```   

#### Step 1     

feature 브랜치로 체크아웃한 상태이다. head는 feature를 가르키고 있다.   

```
$ git checkout feature   
```

<img width="500" alt="스크린샷 2021-09-19 오후 9 24 55" src="https://user-images.githubusercontent.com/26623547/133971282-f40b5404-d587-4d8a-824e-fe767c01360e.png">   

#### Step 2   

`master와 feature 공통조상이 되는 base 커밋부터 현재 브랜치까지의 변경사항을 모두 patch로 저장해 둔다.`   

```
$ git rebase master   
```

<img width="500" alt="스크린샷 2021-09-19 오후 9 25 05" src="https://user-images.githubusercontent.com/26623547/133971436-666ff03a-83a8-4e92-8fcc-4638a1e4f0eb.png">   

#### Step 3   

`head를 master로 변경한다.`   

<img width="500" alt="스크린샷 2021-09-19 오후 9 25 12" src="https://user-images.githubusercontent.com/26623547/133971560-9885c850-9662-4f84-b408-ec4b6dfdf6bd.png">   

#### Step 4   

`head가 현재 가르키고 있는 m2에 변경사항을 적용하여 새로운 커밋으로 생성한다.`   

<img width="600" alt="스크린샷 2021-09-19 오후 9 25 19" src="https://user-images.githubusercontent.com/26623547/133971699-5e20168a-d8d5-4bad-957f-0c6054a1e492.png">   
<img width="600" alt="스크린샷 2021-09-19 오후 9 25 27" src="https://user-images.githubusercontent.com/26623547/133971712-fd829b38-f2d9-45cf-9d06-a77d3678b724.png">   


#### Step 5   

`이제 feature가 f2'를 가르키도록 한다.`    

<img width="600" alt="스크린샷 2021-09-19 오후 9 25 33" src="https://user-images.githubusercontent.com/26623547/133972005-98643842-f1b7-41d3-a64c-b663ece406c2.png">    

> f1과 f2는 저장소 내에는 존재하지만, tag나 branch에서 가르킬 수 없는 dangling 상태가 되며, dangling 된 커밋은 
가비지 콜렉션의 대상이 된다.    

#### Step 6    

`마지막으로 master 브랜치를 새로 새로 리베이스된 커밋 앞으로 fast-forward merge하여 완료 한다.`   

<img width="600" alt="스크린샷 2021-09-19 오후 9 25 56" src="https://user-images.githubusercontent.com/26623547/133972188-80db7737-2aa4-4595-b034-6113df045703.png">   

```
$ git checkout master   
$ git merge feature   //  master에 병합할 브랜치    

// merge 취소할 경우   
$ git merge --abort   
```


- - - 

`또한 rebase를 이용하면 작업 도중 커밋 히스토리를 수정해야 하는 상황에서 
유용하게 사용할 수 있다.`       
구체적으로 예를 들자면 아래와 같은 경우가 있을 수 있다.   

- 작업할 때는 몰랐는데, 알고보니 과거의 커밋 메시지 하나에 오타가 들어가 있네?   
- 테스트 용도로 작업한 커밋들이 딸려 들어갔네?   
- 성격이 비슷한 커밋이 두 개로 분리되어 있는데, 이걸 합칠 수는 없을까?   

이런 상황에서 사용할 수 있는 것이 바로 git rebase 명령어이다.   
git rebase --interactive(또는 -i)를 이용하여 위의 상황에 대해 커밋 히스토리를 
수정해보자.   

### 3-1) 준비 사항   

rebase에 대해서 실습을 해보기 전에 미리 다섯 개의 커밋을 아래와 같이 만들었다.   

<img width="400" alt="스크린샷 2021-09-12 오후 6 45 26" src="https://user-images.githubusercontent.com/26623547/132983593-7b4c5be7-58bf-4c1c-abd3-21d9f20e824d.png">      

우선 git rebase -i의 사용법은 터미널에서 다음과 같이 입력하는 것으로부터 시작한다.   

```shell  
$ git rebase -i ${수정할 커밋의 직전 커밋}    

# 커밋 해시를 이용한 방법
$ git rebase -i 9d9cde8

# HEAD를 이용한 방법
$ git rebase -i HEAD~3
```

`위와 같이 세 번째 커밋을 수정하고 싶다면 두 번째 커밋을 넣으면 된다. 이 때 
커밋 해시를 넣는 방법도 가능하고, HEAD를 기준으로 입력할 수도 있다.`   

이렇게 입력하게 되면, 터미널에서 아래와 같이 출력되는 vim 에디터를 볼 수 있다.   

```shell
pick 4d9fafb git rebase test third commit
pick cd15e35 git rebase test fourth commit
pick e57d956 git rebase test fifth commit

# Rebase 9e34411..e57d956 onto 9e34411 (3 commands)
#
# Commands:
# p, pick <commit> = use commit
# r, reword <commit> = use commit, but edit the commit message
# e, edit <commit> = use commit, but stop for amending
# s, squash <commit> = use commit, but meld into previous commit
# f, fixup <commit> = like "squash", but discard this commit's log message
# x, exec <command> = run command (the rest of the line) using shell
# b, break = stop here (continue rebase later with 'git rebase --continue')
# d, drop <commit> = remove commit
# l, label <label> = label current HEAD with a name
# t, reset <label> = reset HEAD to a label
# m, merge [-C <commit> | -c <commit>] <label> [# <oneline>]
# .       create a merge commit using the original merge commit's
# .       message (or the oneline, if no original merge commit was
# .       specified). Use -c <commit> to reword the commit message.
#
# These lines can be re-ordered; they are executed from top to bottom.
#
# If you remove a line here THAT COMMIT WILL BE LOST.
#
# However, if you remove everything, the rebase will be aborted.
```   

`위의 내용을 살펴보면, 일반적인 로그 메시지가 아래에서부터 위로 출력되는 것에 
반해, 여기에서는 위에서부터 아래로 커밋 순서가 출력되는 것을 
확인 할 수 있다.`      
그리고 각 라인은 `명령어 커밋해시 커밋메시지` 순서대로 구성되어 있다.   

그럼 지금부터 각 명령어들이 어떤 역할을 하고 어떻게 사용하는지에 
대해 살펴보자.     

### 3-2) pick    

`pick 또는 p는 해당 커밋을 수정하지 않고 그냥 사용하겠다 라는 명령어이다. 
디폴트로 실행되는 명령어이므로 vim에서 내용을 편집하지 않고 종료한다면 아무런 변경 사항 없이 
리베이스가 종료된다.`     

`이런 특성을 가진 pick을 이용해서 커밋 순서를 재정렬하거나, 아예 커밋을 
삭제하는 용도로 사용할 수 있다.`    

```shell
pick cd15e35 git rebase test fourth commit
pick 4d9fafb git rebase test third commit
pick e57d956 git rebase test fifth commit

# Rebase 9e34411..e57d956 onto 9e34411 (3 commands)
#
# Commands:
```

위처럼 세 번째 커밋과 네 번째 커밋의 순서를 변경하거나 해당 커밋이 
포함된 라인을 지운 후, vim을 저장 후 종료하게 되면 
해당 커밋이 변경되는 것을 확인 할 수 있다.   

다만 수정한 커밋 히스토리가 서로 의존성을 갖고 있는 경우 충돌이 발생할 수 
있기 때문에, 이를 위한 별도의 처리가 필요하다는 점 주의하자.  

`rebase의 경우 충돌 부분을 수정 한 후에는 commit이 아니라 rebase 명령에 --continue 옵션을 지정하여 
실행해야 한다.`    

```
$ git add {수정파일}
$ git rebase --continue
```

`rebase 충돌이 발생했을 때, 충돌이 발생하기 전 상태로 돌리고 싶다면 
아래와 같이 가능하다.`       

```shell
$ git rebase --abort 
```   

### 3-3) reword   

`reword 또는 r는 커밋 메시지를 수정하기 위한 명령어이다.`   

네 번째 커밋의 커밋 메시지를 변경해보자. reword 명령어를 입력한 후, vim 저장 후 
종료해보자.    

```shell
pick 4d9fafb git rebase test third commit
reword 8d0e9c0 git rebase test fourth commit
pick 4f89861 git rebase test fifth commit

# Rebase 9e34411..4f89861 onto 9e34411 (3 commands)
#
# Commands:
```   

그럼 아래와 같이 커밋 메시지를 vim에서 수정할 수 있게 된다. 
reword로 인한 수정 이라는 문구를 추가후 저장한다.   

```shell
git rebase test fourth commit(reword로 인한 수정)

# Please enter the commit message for your changes. Lines starting
# with '#' will be ignored, and an empty message aborts the commit.
#
# Date:      Sun Sep 12 18:35:43 2021 +0900
#
# interactive rebase in progress; onto 9e34411
```  

`git log --oneline에 대한 결과는 아래와 같다.`     
커밋 히스토리에도 수정된 커밋 메시지가 잘 나타나는 것을 확인할 수 있다.   

```
f821945 (HEAD -> master) git rebase test fifth commit
d656552 git rebase test fourth commit(reword로 인한 수정)
4d9fafb git rebase test third commit
9e34411 git rebase test second commit
c31962c git rebase test first commit
```

#### 3-4) edit      

`edit 또는 e는 커밋의 명령어 뿐만 아니라 작업 내용도 수정할 수 있게 하는 
명령어이다. 아래 예제에서는 커밋 메시지와 작업 내용을 수정하고, 그와 
동시에 하나의 커밋을 두개로 분리하거나 커밋을 끼워넣는 과정도 
실습해보자.`        

<img width="500" alt="스크린샷 2021-09-14 오후 11 23 36" src="https://user-images.githubusercontent.com/26623547/133276637-91a8ed9f-dd9e-4585-87b0-01fbc1756b33.png">   

이전 예시에서 사용한 커밋을 수정해보도록 하자. 명령어 edit을 이용해보면 
아래와 같다.   

<img width="500" alt="스크린샷 2021-09-14 오후 11 24 41" src="https://user-images.githubusercontent.com/26623547/133276655-0937e9e2-5cd3-4fa7-9db3-cfa96254d682.png">   
 

해당 커밋으로 HEAD가 옮겨진 것을 확인할 수 있다.    
커밋 메시지를 변경하기 위해 아래와 같이 입력한다.   

```
$ git commit --amend   
```

<img width="500" alt="스크린샷 2021-09-16 오후 11 17 42" src="https://user-images.githubusercontent.com/26623547/133630097-c94d312a-3186-42b8-9bc3-016085ab7446.png">   

위에서 실습했던 reword 명령어와 마찬가지로, 커밋 메시지를 
수정할 수 있는 창이 뜬다. 동일한 방식으로 커밋 메시지를 수정하면 된다.   

현재 네 번째 커밋에서 작업중인데, 현재 커밋과 
다섯번째 커밋 사이에 추가적인 작업을 해 보도록 하자.    
다른 파일을 수정 후 git add 와 git commit -m message 명령어를 이용해 
새로운 커밋을 추가하면 새 작업이 네 번째 
커밋 뒤에 추가된 것을 확인 할 수 있다.   

`이제 네 번째 커밋에서는 할 일이 끝났으니, git rebase --continue로 
진행 중인 리베이스 과정을 종료해보자.`   
네 번째 커밋과 다섯 번째 커밋 사이에 새로운 커밋이 
추가된 것을 확인 할 수 있다.   

<img width="500" alt="스크린샷 2021-09-16 오후 11 30 10" src="https://user-images.githubusercontent.com/26623547/133630768-e0d048d5-fc33-4958-ac0d-70be4dc10359.png">    


#### 3-5) squash, fixup    

`squash 와 s, fixup과 f는 해당 커밋을 이전 커밋과 합치는 명령어이다.`   
`두 명령어의 차이점은 squash는 각 커밋들의 메시지가 합쳐지는 
반면, fixup은 이전의 커밋 메시지만 남기는 차이점이 있다.`      

아래는 squash를 이용해 위에서 만들었던 두 커밋을 합쳐보도록 하자.   

<img width="500" alt="스크린샷 2021-09-16 오후 11 42 15" src="https://user-images.githubusercontent.com/26623547/133633351-71717870-89b5-4b3b-8451-c2df1821b08d.png">     

위와 같이 squash 명령어를 사용하게 되면 squash 명령어를 작성한 커밋은 
위의 커밋(이전 커밋)으로 합쳐지게 된다.   
위의 사진은 4와 1/2번째 커밋에 squash명령어를 적용하여 네번째 커밋에 머지했다.  

<img width="500" alt="스크린샷 2021-09-16 오후 11 43 40" src="https://user-images.githubusercontent.com/26623547/133633369-995da9e0-d2da-4f21-be36-6197beb0477c.png">     

네 번째 커밋과 4와 1/2번째 커밋의 메시지를 확인 할 수 있고 필요에 따라 커밋 메시지를 
수정할 수도 있다.   
저장을 하게되면 두 커밋이 합쳐진 것을 확인 할 수 있다.    

fixup은 squash와 동일하게 해당 커밋을 이전 커밋과 합치는 명령이지만 
커밋 메시지는 합치지 않는다. 결과적으로 이전 커밋의 메시지만 남게 된다.    
그 점만 빼면 squash와 동일하므로 예제는 생략하도록 한다.   

#### 3-6) drop, exec   

drop 명령어는 커밋 히스토리에서 커밋을 삭제한다. drop으로 변경 후 저장하면, 
     해당 커밋이 drop되는 것을 확인 가능하다.   

exec 명령어를 이용하면, 각각의 커밋이 적용된 후 실행할 shell 명령어를 지정할 수 있다.   

현업에서 사용하는 경우는 많지 않을 것 같아 예시는 생략한다.     


- - - 

## Merge vs Rebase   

이제까지 두 가지 방법의 브랜치 병합 전략을 살펴보았다. Merge를 사용할 지, 
    Rebase를 사용할 지는 프로젝트의 히스토리를 어떤 것으로 생각하냐에 따라 
    달라진다.   

`먼저 Merge의 경우 히스토리란 작업한 내용의 사실을 기록한 것이다. Merge로 
브랜치를 병합하게 되면 커밋 내역의 Merge commit이 추가로 남게 된다. 따라서 
Merge를 사용하면 브랜치가 생기고 병합되는 모든 작업 내용을 그대로 기록하게 된다.`      

`Rebase의 경우는 브랜치를 병합할 때 이런 Merge commit을 남기지 않으므로, 마치 
다른 브랜치는 없었던 것처럼 프로젝트의 작업 내용이 하나의 흐름으로 유지된다.`       

브랜치를 합칠 때 Merge를 써야 하는지 Rebase를 써야 하는지에 대해서는 정답이 없다. 
프로젝트나 팀의 상황에 따라 다른 전략을 사용할 수 있다.   

<img width="757" alt="스크린샷 2021-09-19 오후 8 40 25" src="https://user-images.githubusercontent.com/26623547/133926169-9a06a8bc-0eed-4868-b9a4-77136eab19fe.png">    
  

`또한, 위와 같이 rebase의 reword, squash 등의 옵션을 적절하게 이용하면 여러 
commit을 남겼어도 꼭 필요한 commit만 남길 수 있어서 
master의 커밋 히스토리에 불필요한 커밋을 남기지 않고 
관리 할 수 있다.`     

`또한, rebase를 통해 이미 push 한 커밋을 수정할 수도 있지만 
주의할 점은 협업을 할 경우 이미 push 한 커밋을 수정했을 때  
반드시 동료와 커뮤니케이션이 필요하다는 점이다. push 한 커밋의 
일부를 수정 후 다른 동료가 해당 내용을 git pull로 당겨 받으면 
엄청난 conflict를 만날 수 있다.`    

즉 local에서 작업을 하고 push 하기전 commit들을 정리할 때 사용하는 것을 
권장하고, push 한 커밋을 수정해야 할 경우는 반드시 동료와 커뮤니케이션을 
하자.   







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
