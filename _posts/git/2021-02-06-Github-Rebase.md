---
layout: post
title: "[Git] Rebase와 Conflict 해결 방법 "
subtitle: "Rebase / rebase interactive"
comments: true
categories : Git
date: 2021-02-05
background: '/img/posts/mac.png'
---

[이전글](https://wonyong-jang.github.io/git/2021/02/05/Github-Merge.html)에서는 
브랜치를 병합하는 방법 중 Merge와 Squash Merge 방법에 대해서 살펴보았다.      

이번 글에서는 Rebase를 이용하여 브랜치를 병합하고 충돌시 해결 방법에 대해서 살펴보자.   
또한, rebase interactive를 이용하여 여러가지 상황에서 커밋을 조작하는 방법에 대해서도 
살펴볼 예정이다.   

- - -     

# 1. Rebase 동작방식   

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
feature와 master에 대한 공통 조상인 base를 master로 변경한다.   
```


Rebase의 기본 전략은 다음과 같다.    

`먼저 Rebase 하려는 브랜치 커밋들의 변경사항을 Patch라는 것으로 만든 다음에 
임시저장소에 저장해 둔다. 그리고 이를 master 브랜치에 하나씩 적용시켜 
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

`마지막으로 master 브랜치를 새로 리베이스된 커밋 앞으로 fast-forward merge하여 완료 한다.`   

<img width="641" alt="스크린샷 2021-10-06 오후 10 43 45" src="https://user-images.githubusercontent.com/26623547/136214803-1082f14d-c638-474b-83b2-4453ff5b39cf.png">    

```
$ git checkout master   
$ git merge feature   //  master에 병합할 브랜치    

// merge 취소할 경우   
$ git merge --abort   
```

- - - 

# 2 Rebase 실습    

위에서 Rebase의 동작 방법에 대해서 살펴보았고 실제로 Rebase를 
이용하여 브랜치 병합을 실습해보자.    

실습을 위해 아래와 같이 커밋을 진행하였다.   
master 브랜치와 rb 브랜치가 f7dae54 커밋(base)을 기준으로 
각각 커밋이 이어져있다   

```shell
* 86b7c45 (master) R2
* cf20c3d R1
| * 45196ef (HEAD -> rb) R2
| * 1cd73ab R1
|/
* f7dae54 base
```

git log는 아래 명령어를 이용하여 확인했다.   

```shell
git log --all --oneline --graph
```

`현재 HEAD가 rb 브랜치이고, rb브랜치를 master에 rebase 해보자.`       

```shell   
$ git rebase master   
```

rebase 후에는 아래와 같이 커밋 히스토리가 보기 좋게 나열된 것을 
확인할 수 있다.   

```shell   
* e51a8db (HEAD -> rb) R2
* 72ceec0 R1
* 86b7c45 (master) R2
* cf20c3d R1
* f7dae54 base
```

마지막으로 master는 rb 브랜치의 포함 관계 이기 때문에 fast-forward를 한다.   

```shell
$ git checkout master
$ git merge rb 

Updating 86b7c45..e51a8db
Fast-forward
 rb.txt | 2 ++
 1 file changed, 2 insertions(+)
 create mode 100644 rb.txt
```

Output    

```shell
* e51a8db (HEAD -> master, rb) R2
* 72ceec0 R1
* 86b7c45 R2
* cf20c3d R1
* f7dae54 base
```

- - -    


# 3 Rebase Conflict 실습  

rebase를 이용하여 브랜치를 병합하는 과정 중 conflict가 발생했을 때 
해결방법에 대해서 살펴보자.    

실습을 위해 아래와 같은 커밋 히스토리를 만들고 master, rb 브랜치에 
동일한 파일의 동일한 라인을 수정하여 병합을 할때 충돌이 
발생하도록 하였다.    

```shell
$ git log --all --graph --oneline   

* 1434603 (HEAD -> rb) R3
* 2b7a179 R2
* 86ebb13 R1
| * a958a8f (master) M1
|/
* 48641e5 base
```    

rb 브랜치를 master 브랜치에 rebase 해보자.   
위에서 설명한 것처럼 공통 조상 base를 기준으로 해서 
R1, R2, R3 까지의 변경사항을 각각 patch로 만들고 
임시저장한다.    
그 후에 순차적으로 patch를 master와 병합을 진행하게 되는데 
아래를 보면 R1을 병합하는데 충돌이 발생한 것을 볼 수 있다.    

```shell
Auto-merging common.xml
CONFLICT (content): Merge conflict in common.xml
error: could not apply 86ebb13... R1
Resolve all conflicts manually, mark them as resolved with
"git add/rm <conflicted_files>", then run "git rebase --continue".
You can instead skip this commit: run "git rebase --skip".
To abort and get back to the state before "git rebase", run "git rebase --abort".
Could not apply 86ebb13... R1
```

`conflict 해결방법은 위 언급된 것처럼 충돌 파일을 수정하고 git add 후에 
git rebase --continue를 진행하면 된다.`   
`만약 rebase 전으로 되돌리고 싶다면 git rebase --abort 를 사용하면 된다.`    

conflict를 해결하고 git log를 확인하면 R1이 master의 최신 커밋뒤에 
병합된 것을 확인할 수 있다.    

```shell
* 15a6c70 (HEAD) R1
* a958a8f (master) M1
| * 1434603 (rb) R3
| * 2b7a179 R2
| * 86ebb13 R1
|/
* 48641e5 base
```   

그 이후도 conflict가 있다면 위의 과정을 동일하게 
진행하면 된다. 아래와 같이 R2를 병합하는 과정에서도 
conflict가 발생했기 때문에 동일하게 해결한다.    

```shell
CONFLICT (content): Merge conflict in common.xml
error: could not apply 2b7a179... R2
Resolve all conflicts manually, mark them as resolved with
"git add/rm <conflicted_files>", then run "git rebase --continue".
You can instead skip this commit: run "git rebase --skip".
To abort and get back to the state before "git rebase", run "git rebase --abort".
Could not apply 2b7a179... R2
```

Output   

```shell
* cf26ae4 (HEAD -> rb) R3
* b9f04c0 R2
* 15a6c70 R1
* a958a8f (master) M1
* 48641e5 base
```

- - - 

# 4 Rebase interactive 

Rebase를 위처럼 두 브랜치를 병합하는데 사용할 수도 있지만, 
    `단일 브랜치 내에서 rebase를 사용하여 커밋 히스토리를 정리할 수도 있다.`      
`즉, rebase를 이용하면 작업 도중 커밋 히스토리를 수정해야 하는 상황에서 
유용하게 사용할 수 있다.`       
구체적으로 예를 들자면 아래와 같은 경우가 있을 수 있다.   

- 작업할 때는 몰랐는데, 알고보니 과거의 커밋 메시지 하나에 오타가 들어가 있네?   
- 테스트 용도로 작업한 커밋들이 딸려 들어갔네?   
- 성격이 비슷한 커밋이 두 개로 분리되어 있는데, 이걸 합칠 수는 없을까?   

이런 상황에서 사용할 수 있는 것이 바로 git rebase 명령어이다.   
`git rebase --interactive(또는 -i)`를 이용하여 위의 상황에 대해 커밋 히스토리를 
수정해보자.   

## 4-1) 준비 사항   

rebase에 대해서 실습을 해보기 전에 미리 다섯 개의 커밋을 아래와 같이 만들었다.   


```shell
f954bfd (HEAD -> master) git rebase test fifth commit
e05da57 git rebase test fourth commit
adafa47 git rebase test third commit
96220ce git rebase test second commit
75ac2c6 git rebase test first commit
```

우선 git rebase -i의 사용법은 터미널에서 다음과 같이 입력하는 것으로부터 시작한다.   

```shell  
$ git rebase -i ${수정할 커밋의 직전 커밋}    

# 커밋 해시를 이용한 방법
$ git rebase -i 96220ce

# HEAD를 이용한 방법
$ git rebase -i HEAD~3
```

`위와 같이 세 번째 커밋을 수정하고 싶다면 두 번째(96220ce) 커밋을 넣으면 된다. 이 때 
커밋 해시를 넣는 방법도 가능하고, HEAD를 기준으로 입력할 수도 있다.`   

이렇게 입력하게 되면, 터미널에서 아래와 같이 출력되는 vim 에디터를 볼 수 있다.   

```shell
pick adafa47 git rebase test third commit
pick e05da57 git rebase test fourth commit
pick f954bfd git rebase test fifth commit

# Rebase 96220ce..f954bfd onto 96220ce (3 commands)
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

### 4-2) pick    

`pick 또는 p는 해당 커밋을 수정하지 않고 그냥 사용하겠다 라는 명령어이다. 
디폴트로 실행되는 명령어이므로 vim에서 내용을 편집하지 않고 종료한다면 아무런 변경 사항 없이 
리베이스가 종료된다.`     

`이런 특성을 가진 pick을 이용해서 커밋 순서를 재정렬하거나, 아예 커밋을 
삭제하는 용도로 사용할 수 있다.`    

```shell
pick e05da57 git rebase test fourth commit
pick adafa47 git rebase test third commit
pick f954bfd git rebase test fifth commit

# Rebase 96220ce..f954bfd onto 96220ce (3 commands)
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

### 4-3) reword   

`reword 또는 r는 커밋 메시지를 수정하기 위한 명령어이다.`   

네 번째 커밋의 커밋 메시지를 변경해보자. reword 명령어를 입력한 후, vim 저장 후 
종료해보자.    

```shell
pick 60d9ce3 git rebase test third commit
reword a879658 git rebase test fourth commit
pick 81cbb19 git rebase test fifth commit

# Rebase 96220ce..81cbb19 onto 96220ce (3 commands)
#
# Commands:
```   

그럼 아래와 같이 커밋 메시지를 vim에서 수정할 수 있게 된다. 
reword로 인한 수정 이라는 문구를 추가 후 저장한다.   

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

#### 4-4) edit      

`edit 또는 e는 커밋의 명령어 뿐만 아니라 작업 내용도 수정할 수 있게 하는 
명령어이다. 아래 예제에서는 커밋 메시지와 작업 내용을 수정하고, 그와 
동시에 하나의 커밋을 두개로 분리하거나 커밋을 끼워넣는 과정도 
실습해보자.`       

```shell
pick 60d9ce3 git rebase test third commit
edit 9ed604e git rebase test fourth commit(reword로 인한 수정)
pick 8fced6f git rebase test fifth commit

# Rebase 96220ce..8fced6f onto 96220ce (3 commands)
#
# Commands:
```

이전 예시에서 사용한 커밋을 예시로 수정해보도록 하자.    
명령어 edit을 이용해보면 아래와 같다.      

<img width="738" alt="스크린샷 2021-10-09 오후 9 53 36" src="https://user-images.githubusercontent.com/26623547/136658634-1ec4cdd1-db3a-495f-bbab-595b75337280.png">   
   

`수정하고자 하는 커밋에 edit으로 변경 후 vim을  
저장하게 되면 해당 커밋으로 HEAD가 옮겨진 것을 확인할 수 있다.`    
위의 예시에는 fourth commit으로 이동하였고, 파일을 변경하거나 
커밋 메시지 수정이 가능하다.   
커밋 메시지를 변경하기 위해 아래와 같이 입력한다.   

```
$ git commit --amend   
```

<img width="700" alt="스크린샷 2021-10-09 오후 9 55 55" src="https://user-images.githubusercontent.com/26623547/136658688-94e55571-9a0d-448d-9c68-22bbf5bb3dc6.png">   

위에서 실습했던 reword 명령어와 마찬가지로, 커밋 메시지를 
수정할 수 있는 창이 뜬다. 동일한 방식으로 커밋 메시지를 수정하면 된다.   

또한, 현재 네 번째 커밋에서 작업중인데, 현재 커밋과 
다섯번째 커밋 사이에 추가적인 작업을 하여 커밋을 추가할 수도 있다.       
다른 파일을 수정 후 git add 와 git commit -m message 명령어를 이용해 
새로운 커밋을 추가하면 새 작업이 네 번째 
커밋 뒤에 추가된 것을 확인 할 수 있다.   

`이제 네 번째 커밋에서는 할 일이 끝났으니, git rebase --continue로 
진행 중인 리베이스 과정을 종료해보자.`   
네 번째 커밋과 다섯 번째 커밋 사이에 새로운 커밋이 
추가된 것을 확인 할 수 있다.   

<img width="600" alt="스크린샷 2021-10-09 오후 10 00 58" src="https://user-images.githubusercontent.com/26623547/136658832-dc27de21-93a0-4bfe-ac46-9aefb586bf0d.png">   

#### 4-5) squash, fixup    

`squash 와 s, fixup과 f는 해당 커밋을 이전 커밋과 합치는 명령어이다.`   
`두 명령어의 차이점은 squash는 각 커밋들의 메시지가 합쳐지는 
반면, fixup은 이전의 커밋 메시지만 남기는 차이점이 있다.`      

아래는 squash를 이용해 위에서 만들었던 두 커밋을 합쳐보도록 하자.   

<img width="588" alt="스크린샷 2021-10-09 오후 10 02 24" src="https://user-images.githubusercontent.com/26623547/136658869-484d11c1-3864-49d0-b5a8-41fa75a9482e.png">   

위와 같이 squash 명령어를 사용하게 되면 squash 명령어를 작성한 커밋은 
위의 커밋(이전 커밋)으로 합쳐지게 된다.   
위의 사진은 4와 1/2번째 커밋에 squash명령어를 적용하여 네번째 커밋에 머지했다.  

<img width="700" alt="스크린샷 2021-10-09 오후 10 03 49" src="https://user-images.githubusercontent.com/26623547/136658899-4c7ac42b-13e2-4372-a025-cb71e7e9a8b8.png">   

네 번째 커밋과 4와 1/2번째 커밋의 메시지를 확인 할 수 있고 필요에 따라 커밋 메시지를 
수정할 수도 있다.   
저장을 하게되면 두 커밋이 합쳐진 것을 확인 할 수 있다.    

fixup은 squash와 동일하게 해당 커밋을 이전 커밋과 합치는 명령이지만 
커밋 메시지는 합치지 않는다. 결과적으로 이전 커밋의 메시지만 남게 된다.    
그 점만 빼면 squash와 동일하므로 예제는 생략하도록 한다.   

#### 4-6) drop, exec   

drop 명령어는 커밋 히스토리에서 커밋을 삭제한다. drop으로 변경 후 저장하면, 
     해당 커밋이 drop되는 것을 확인 가능하다.   

exec 명령어를 이용하면, 각각의 커밋이 적용된 후 실행할 shell 명령어를 지정할 수 있다.   

현업에서 사용하는 경우는 많지 않을 것 같아 예시는 생략한다.     


- - - 

## Merge vs Rebase   

이제까지 두 가지 방법의 브랜치 머지 전략을 살펴보았다. Merge를 사용할 지, 
    Rebase를 사용할 지는 프로젝트의 히스토리를 어떤 것으로 생각하냐에 따라 
    달라진다.   

`먼저 Merge의 경우 히스토리란 작업한 내용의 사실을 기록한 것이다. Merge로 
브랜치를 병합하게 되면 커밋 내역의 Merge commit이 추가로 남게 된다. 따라서 
Merge를 사용하면 브랜치가 생기고 병합되는 모든 작업 내용을 그대로 기록하게 된다.`      

`Rebase의 경우는 브랜치를 병합할 때 이런 Merge commit을 남기지 않으므로, 마치 
다른 브랜치는 없었던 것처럼 프로젝트의 작업 내용이 하나의 흐름으로 유지된다.`       
`즉, 해당 브랜치가 어느 시점에 머지되었는지는 알 수 없다.`     
그래서 리베이스를 사용하는 경우 tag 기능을 사용하여 해당 
브랜치가 머지된 시점에 태그를 달아주는 방법도 있다.   

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

<https://opentutorials.org/course/2708/15553>    
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

