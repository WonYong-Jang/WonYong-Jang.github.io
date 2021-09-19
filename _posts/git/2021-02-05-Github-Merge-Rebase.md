---
layout: post
title: "[Git] Merge 와 Rebase 이해하기 "
subtitle: "Merge / Squash and Merge / Rebase and Merge / rebase interactive"
comments: true
categories : Git
date: 2021-02-05
background: '/img/posts/mac.png'
---

Git에서 한 브랜치에서 다른 브랜치로 합치는 방법으로는 두 가지가 있다.     
하나는 Merge이고 다른 하나는 Rebase이며 
다른 사람과 협업을 할 때 git을 이용하여 형상관리를 함에 있어서 branch 간의 merge 또는 rebase의 
차이점을 알고있는 것이 매우 도움이 된다.    

아래 예시를 보면서 차이점을 확인해 보면 된다.  

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
이런 모양이 될 것이다.   

<img width="649" alt="스크린샷 2021-09-19 오후 7 39 35" src="https://user-images.githubusercontent.com/26623547/133924477-e1247a69-2936-4ee1-afb2-3ca2f9943fee.png">   


**이 경우 my-branch를 master에 병합하는 방법에는 다음과 같은 것들이 있다.**   

# 1. Merge     

<img width="600" alt="스크린샷 2021-09-12 오후 6 08 09" src="https://user-images.githubusercontent.com/26623547/132981921-48e2abb4-43ea-496d-9aa1-6ea9621fb058.png">   

하나의 브랜치와 다른 브랜치의 변경 이력 전체를 합치는 방법이다.   
commit a, b, c를 refer하는 m이 생성되고, m을 통해 a + b + c가 master에 추가 된다.   
m은 2개의 parent를 가진다.   

```shell  
$ git checkout master     
$ git merge my-branch    
$ git push origin master   
```

<img width="500" alt="스크린샷 2021-09-19 오후 7 35 52" src="https://user-images.githubusercontent.com/26623547/133924388-396d76e0-a267-407b-b567-85aa23d384da.png">    

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

rebase와 merge를 이용하면 모든 commit들이 합쳐지지 않고 각각 master 브랜치에 추가할 수 있다.      

<img width="600" alt="스크린샷 2021-02-05 오전 12 22 47" src="https://user-images.githubusercontent.com/26623547/106914395-523d7e00-6748-11eb-8a95-786223859f34.png">    



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
위의 커밋으로 합쳐지게 된다.   
위의 사진은 4와 1/2번째 커밋에 squash명령어를 적용하여 네번째 커밋에 머지했다.  

<img width="500" alt="스크린샷 2021-09-16 오후 11 43 40" src="https://user-images.githubusercontent.com/26623547/133633369-995da9e0-d2da-4f21-be36-6197beb0477c.png">     

네 번째 커밋과 4와 1/2번째 커밋의 메시지를 확인 할 수 있고 필요에 따라 커밋 메시지를 
수정할 수도 있다.   
저장을 하게되면 두 커밋이 합쳐진 것을 확인 할 수 있다.   


`위와 같이 rebase의 reword, squash 등의 옵션을 적절하게 이용하면 여러 
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

<https://flyingsquirrel.medium.com/git-rebase-%ED%95%98%EB%8A%94-%EB%B0%A9%EB%B2%95-ce6816fa859d>    
<https://im-developer.tistory.com/182>     
<https://wormwlrm.github.io/2020/09/03/Git-rebase-with-interactive-option.html?fbclid=IwAR0AHUnsFJXXVnckeX79Sl5cJ-WDevprKuNWva5anEMAjgO-NtZYbIFNuic>    
<https://git-scm.com/book/ko/v2/Git-%EB%B8%8C%EB%9E%9C%EC%B9%98-Rebase-%ED%95%98%EA%B8%B0>    

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

