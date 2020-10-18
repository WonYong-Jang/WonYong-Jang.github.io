---
layout: post
title: "[Algorithm] Sort"
subtitle: "Selection, Insertion, Bubble, Quick, Merge, Heap, Counting Sort"
comments: true
categories : Algorithm
date: 2020-03-19
background: '/img/posts/mac.png'
---

## Selection Sort

`이름에 맞게 해당 위치에 맞는 자료를 선택하여 위치를 교환하는 방식이다.`    

배열이 어떻게 되어있던지 간에 전체 비교를 진행하므로 시간복잡도는 O(N^2)이다.   

두개의 for문 종료 후 반드시 교환 연산이 이루어지므로 최선,최악 의미가 없다.
<p>같은 값의 인덱스끼리도 교환 연산이 발생 할수 있다.</p>
<img width="650" alt="스크린샷 2020-03-19 오후 10 24 17" src="https://user-images.githubusercontent.com/26623547/77075003-07821d00-6a35-11ea-827a-a26df077eef7.png">

## Insertion Sort   

`자료 배열의 모든 요소를 앞에서부터 차례대로 이미 정렬된 배열 부분과 비교하여,
자신의 위치를 찾아 삽입한다.`   

<p>target 이전 인덱스의 배열은 이미 정렬되어 있고 그 배열에 target 숫자의 위치를 삽입한다!</p>
<p>이미 정렬되어 있는 경우라면 while을 거치지 않으므로 비교 횟수를 줄일수 있다 O(N)</p>
<p>선택, 버블 정렬보다 성능은 좋지만 평균 O(N^2) 시간 복잡도</p>
<img width="650" alt="스크린샷 2020-03-19 오후 10 39 13" src="https://user-images.githubusercontent.com/26623547/77075014-0bae3a80-6a35-11ea-8c90-7ef01343b6b1.png">


## Bubble Sort

`인접한 두수를 비교해서 큰 수를 뒤로 보내는 정렬, 느리지만 코드가 단순하다.`    

<p>한번 순회를 마칠때마다 비교대상이 하나씩 줄어든다! (맨 뒤 부터 큰수가 정렬된다)</p>
<p>이미 정렬되어 있을 때 자리 교환이 일어나지 않으므로 시간을 줄일 수 있지만 전체를 다 확인 하므로 평균 
O(N^2) 시간 복잡도를 가진다.</p>
<img width="650" alt="스크린샷 2020-03-19 오후 10 57 16" src="https://user-images.githubusercontent.com/26623547/77075031-110b8500-6a35-11ea-8c77-4b1c192a2a08.png">

## Merge Sort

<p><u>분할 정복 알고리즘 중 하나이며 O(NlogN) 안정정렬에 속한다.</u></p>
<p>1) Divide(분할) : 해결하고자 하는 문제를 작은 크기의 동일한 문제로 분할한다.</p>
<p>2) Conquer(정복): 각각의 문제를 해결한다.</p>
<p>3) Merge(합병) : 작은 문제의 해를 합하여 원래의 문제에 대한 해를 구한다.</p>
<img width="650" alt="스크린샷 2020-03-19 오후 11 15 24" src="https://user-images.githubusercontent.com/26623547/77076807-af004f00-6a37-11ea-9a69-5d20ec175e66.png">
<br/><br/>
<h3>Merge Sort 응용</h3>     
<p><u>- 백준 Counting Inversions, 달리기</u></p>

<pre>
- 문제 설명
배열 A는 1,2,3,...n 의 수가 무작위 순서로 들어 있다. 이 수들에서 두개의 무작위 수를 생각했을 때, 그 순서 대비 크기가 역전되어 있는 두 수의 쌍이 몇개가 되는 지를 구하시오.
예를 들어, A={2,3,6,4,1,7}일 때, 크기가 역전된 쌍은, (2,1), (3,1), (6,4), (6,1), (4,1)

따라서 Number of inversions = 5
</pre>

<img width="600" alt="스크린샷 2020-03-23 오후 9 01 57" src="https://user-images.githubusercontent.com/26623547/77314743-96e74300-6d49-11ea-943a-9ad1ce7c1316.png">

<img width="600" alt="스크린샷 2020-03-23 오후 9 02 07" src="https://user-images.githubusercontent.com/26623547/77314759-9c448d80-6d49-11ea-801a-a5f1036119ac.png">

## Quick Sort    

<p><u>재귀를 이용한 분할 정복 알고리즘</u></p>
<p>다른 NlogN 정렬알고리즘 보다 속다가 빠르다(pivot을 적절하게 선택했을 때)</p>
이유는 불필요한 데이터의 이동을 줄이고 먼 거리의 데이터를 교환 할 뿐아니라, 한번 결정된
기준은 추후 연산에서 제외되는 성질을 가지고 있기 때문이다.

<p>추가 메모리 공간을 필요로 하지 않는다 ! </p>

<p>일반적인 퀵소트 시간 복잡도는 O(N^2)이 나올수 있다.</p>
ex) 5,4,3,2,1 데이터를 정렬 할때 !
<p><u>pivot 개선을 통해서 O(NlogN) 가능하다 (아래 소스에서 설명)</u></p>
<img width="630" alt="스크린샷 2020-03-22 오후 9 54 04" src="https://user-images.githubusercontent.com/26623547/77249925-de0cff80-6c87-11ea-9eb5-4d296fa8494f.png">

<img width="630" alt="스크린샷 2020-03-22 오후 9 55 10" src="https://user-images.githubusercontent.com/26623547/77249928-e06f5980-6c87-11ea-8c7e-e16ae5ae4f7a.png">

<img width="630" alt="스크린샷 2020-03-22 오후 9 55 19" src="https://user-images.githubusercontent.com/26623547/77249934-e6fdd100-6c87-11ea-89de-c4ac8eb6df85.png">

## Heap Sort   

<img width="620" alt="스크린샷 2020-03-22 오후 10 07 13" src="https://user-images.githubusercontent.com/26623547/77250235-e1a18600-6c89-11ea-8152-a3f785552eae.png">

<img width="620" alt="스크린샷 2020-03-22 오후 10 09 14" src="https://user-images.githubusercontent.com/26623547/77250237-e36b4980-6c89-11ea-9c65-319353723377.png">

<img width="620" alt="스크린샷 2020-03-22 오후 10 09 55" src="https://user-images.githubusercontent.com/26623547/77250240-e5cda380-6c89-11ea-9124-f6310987e929.png">
<br/>

소스 준비 중 

## Counting Sort   

<p>정렬 알고리즘으로 O(n) 의 시간 복잡도를 가진다</p>
<p>A : 2, 0, 1, 1, 0, 2</p>
비교 연산 없이 각각 요소가 몇번 등장했는지 카운트 해준 후 차례대로 정렬하게
되면 O(n) 시간 복잡도로 다른 정렬 알고리즘에 비해 더 빠르게 정렬 가능하다!
<p><b>하지만, 배열의 최소값 최대값 차이가 위의 예시와 다르게 차이가 크면 클수록
비 효율적인 알고리즘! </b></p>

<p>입력값(숫자 크기)의 범위가 작을때 사용가능하다!</p>

<p>관련문제 : </p>
HackerRank Fraudulent Activity Notifications <br/>
- 각 숫자의 카운팅을 배열에 저장하게 되면 정렬되어 있는 인덱스를 얻을수 있고,
 중앙값을 얻기위해 배열의 누적합이 중앙값보다 클경우를 체크한다!

- - - 

## 안정 정렬과 불안정 정렬

- 안정 정렬(Stable) : 동일한 값에 대해 기존의 순서가 유지되는 정렬 방식   

    - Merge sort, Insertion sort, Bubble sort, Radix sort  

- 불안정 정렬(Not Stable) : 동일한 값에 대해 기존의 순서가 뒤바뀔 수 있는 정렬 방식   

    - Quick sort, Heap sort, Selection sort



- - - 

**Reference**   

[https://hsp1116.tistory.com/33](https://hsp1116.tistory.com/33)   




{% highlight ruby linenos %}


{% endhighlight %}

{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}
