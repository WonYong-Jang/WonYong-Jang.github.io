---
layout: post
title: "[Algorithm] Tree"
subtitle: "트리, 이진트리, 트리순회, 수식트리"
comments: true
categories : Algorithm
date: 2020-04-01
background: '/img/posts/mac.png'
---

# Tree 

`트리란 연결 리스트와 유사한 자료구조지만 연결 리스트가 단순히 다음 노드를 가르키는 선형이라면 
트리는 각 노드가 여러개의 노드를 가르키는 비선형이다.`     
`트리 구조는 그래프의 한 종류로 1개 이상의 노드로 구성되며 사이클이 없는 그래프로 
임의의 두 노드간에 하나의 경로만이 존재한다.`     

- 트리의 root는 부모를 가지지 않고 최대 하나의 root 노드가 있을수 있다.   
- edge는 부모와 자식을 잊는 연결 선이다. 자식이 없는 노드를 leaf 노드라고 부르고 자식이
하나라도 있는 노드는 internal 노드라 한다.   
- 노드의 차수 `degree`는 특정 노드의 자식 수라고 부르며 트리의 모든 노드 중에
가장 높은 차수를 트리의 차수라고 한다.     
- 자식의 노드에 대하여 상위노드를 부모라고 하고, 동일한 부모를 가진 자식노드를 형제(Sibling), 
 특정 노드의 부모노드의 집합을 조상(Ancestors)이라 한다. 또한, 반대로 특정 노드의 부속 트리의 모든 노드집합을 자손(descendant)이라 한다.   
- 노드의 `depth`는 root에서 해당 노드까지 경로의 길이이다.   
- 노드의 `height`는 해당 노드에서 가장 깊은 노드까지 경로의 길이( 하나의 노드를 가진 트리의 높이는 0)    
- 노드의 크기는 자신을 포함한 descendant 들의 수를 말한다.   
- 노드의 `level`은 루트 노드 아래로 한단계식 레벨을 가지며 루트가 레벨 1 이 된다.
- 모든 노드들이 자식을 하나만 가질 때 이를 skew 트리(편향 트리)라고 부른다 (left skew, right skew) 

- - - 

## 이진 트리    

<img width="560" alt="스크린샷 2020-04-01 오후 10 03 05" src="https://user-images.githubusercontent.com/26623547/78140196-972bc080-7464-11ea-9381-5270b6404e4c.png">

<p><u>모든 노드들이 둘 이하의 자식을 가질 때 이진 트리라고 한다.</u></p>

#### 1) >포화 이진 트리(Full Binary Tree)   

마지막 레벨까지 모든 노드가 있는 이진 트리 

#### 2) 완전 이진 트리(Complete Binary Tree)     

노드를 삽입할 때 왼쪽부터 차례대로 추가하는 이진 트리 

#### 3) 이진 탐색 트리(Binary Search Tree)     

각 부모노드의 값은 왼쪽 서브트리 값보다 크고 오른쪽 서브트리보다 작다.    

> ==> 98. Validate Binary Search Tree ( 이진탐색 트리 확인 방법은 Inorder 순회로 줄 세워 봐서 값이 오름차순 정렬되어 있으면 Valid !)    

### 이진트리 특징   

- 높이가 h인 포화 이진 트리(full binary tree)는 2^h-1 개의 노드를 가진다.

- 노드가 N개인 포화(full) 혹은 완전(complete) 이진트리의 높이는 O(logN)이다.   

- 노드가 N개인 이진트리의 높이는 최악의 경우 O(N)이 될 수 있다. 

- - - 

<h2 class="section-heading">트리 순회</h2>
<p>트리는 선형이 아닌 비선형이기 때문에 모든 노드들을 거쳐가기 위한 방법이 필요하다.</p>

<p><b>전위순회( Pre-order )</b></p>
<img width="500" alt="스크린샷 2020-04-01 오후 10 10 51" src="https://user-images.githubusercontent.com/26623547/78141102-f807c880-7465-11ea-8a21-4877ccfa19db.png">
<p><b>중위순회( In-order )</b></p>
<img width="500" alt="스크린샷 2020-04-01 오후 10 11 58" src="https://user-images.githubusercontent.com/26623547/78141112-fa6a2280-7465-11ea-9402-2fd939000bc2.png">
<p><b>후위순회( Post-order )</b></p>
<img width="500" alt="스크린샷 2020-04-01 오후 10 12 38" src="https://user-images.githubusercontent.com/26623547/78141130-ffc76d00-7465-11ea-92be-448812a3471c.png">

<p><b>레벨순회( Level-order )</b></p>
<img width="500" alt="스크린샷 2020-04-01 오후 10 15 52" src="https://user-images.githubusercontent.com/26623547/78141451-77959780-7466-11ea-9811-501ca0017813.png">
<h2 class="section-heading">수식 트리</h2>
<p><b>포스팅 준비중 </b></p>


{% highlight ruby linenos %}


{% endhighlight %}

<p>Reference</p>

<p><a href="https://3dmpengines.tistory.com/423">https://3dmpengines.tistory.com/423</a></p>
<p><a href="https://blog.naver.com/muramura12/220704218849">https://blog.naver.com/muramura12/220704218849</a></p>

{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}
