---
layout: post
title: "[Spark] Join 최적화"   
subtitle: "shuffle join, broadcast join"             
comments: true   
categories : Spark   
date: 2024-04-20   
background: '/img/posts/mac.png'   
---

## 1. 스파크의 조인 수행 방식    

스파크는 조인 시 크게 두 가지 방식으로 조인을 진행한다.    

### 1-1) Shuffle join    

전체 노드간 네트워크 통신을 유발하는 shuffle join 방식이다.   
조인 키로 두 데이터 세트를 섞고 동일한 키를 가진 데이터를 동일한 노드로 
이동시킨다.   

<img width="800" alt="스크린샷 2024-04-20 오후 12 07 16" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/d74f5266-77f9-458c-82af-c809caf63137">    

### 1-2) Broadcast join   

`작은 데이터 세트를 broadcast 변수로 driver에서 생성하여 
클러스터의 각 executor 별로 복제해 놓고 join 하는 방식이다.`   

따라서, broadcast 되는 대상 테이블이 크다면 driver의 메모리가 부족하여 
비정상 종료 될 수 있다.   

`driver에서 broadcast 변수로 생성하여 각 executor로 전송할 때 
네트워크 비용이 발생하지만, 그 이후 join을 진행할 때는 네트워크를 통한 
데이터 이동이 없기 때문에 join 속도가 매우 빠르다.`      


<img width="800" alt="스크린샷 2024-04-20 오후 12 12 54" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/73480133-18b3-437d-860b-af30c5200daa">

- - - 

## 2. 조인 전략    

### 2-1) Sort Merge Join   

sort merge join 은 조인 작업 전에 조인 키를 기준으로 정렬되며, 조인 키를 
기반으로 두 데이터 세트를 병합한다.   

<img width="800" alt="스크린샷 2024-04-20 오후 12 32 28" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/df897b0b-d54c-40d7-a974-1b8d491cc2ad">   

<img width="800" alt="스크린샷 2024-04-20 오후 12 32 48" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/f4e469cc-08c6-4eb4-92df-04994aae2aa4">  

### 2-2) Hash Join   

해시 조인은 더 작은 테이블의 조인 키를 기반으로 해시 테이블을 생성한 다음 
해시된 조인 키 값과 일치하도록 더 큰 테이블을 반복하면서 수행한다.      


### 2-3) Broadcast Hash Join    

위에서 설명한 broadcast 변수를 생성하여 각 executor로 복제해 놓고, 해시 조인을 실행하는 
방식이다.    

<img width="800" alt="스크린샷 2024-04-21 오후 3 38 11" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/055eb343-b4f2-457d-8441-58d874a3c1b2">



- - - 

**Reference**   

<https://mjs1995.tistory.com/227#article-1-1--%EC%A0%84%EC%B2%B4-%EB%85%B8%EB%93%9C%EA%B0%84-%ED%86%B5%EC%8B%A0%EC%9D%84-%EC%9C%A0%EB%B0%9C-%EC%85%94%ED%94%8C-%EC%A1%B0%EC%9D%B8(shuffle-join)>    

<https://jaemunbro.medium.com/apache-spark-%EC%A1%B0%EC%9D%B8-join-%EC%B5%9C%EC%A0%81%ED%99%94-c9e54d20ae06>   

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

