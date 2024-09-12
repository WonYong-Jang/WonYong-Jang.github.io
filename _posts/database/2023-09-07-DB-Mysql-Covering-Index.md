---
layout: post
title: "[DB] Mysql 커버링 인덱스로 성능 최적화 하기"
subtitle: "Covering Index / 쿼리 실행 순서"
comments: true
categories : Database
date: 2023-09-07
background: '/img/posts/mac.png'
---   

일반적으로 인덱스를 설계한다고 하면 where 절에 대한 인덱스 설계를 
이야기하지만 사실 where 뿐만 아니라 쿼리 전체에 대해 인덱스 설계가 
필요하다.   

`인덱스 커버링(Covering Index 혹은 Covered Index) 는 쿼리를 
충족시키는데 필요한 모든 데이터를 갖고 있는 인덱스를 말한다.`   

> 좀 더 쉽게 말하면 select, where, order by, group by 등에 
사용되는 모든 컬럼이 인덱스의 구성요소인 경우를 말한다.   

- - - 

## 1. 커버링 인덱스 기본 지식   


`먼저, 커버링 인덱스가 적용되면 아래와 같이 Explain 결과(실행 계획)의 
Extra 필드에 Using Index 가 표기 된다.`    

<img width="734" alt="스크린샷 2024-09-08 오후 3 38 21" src="https://github.com/user-attachments/assets/93b9ae30-23d1-485a-ae84-c2b4916b1ab7">   

커버링 인덱스는 원하는 데이터를 인덱스에서만 추출할 수 있는 인덱스를 말한다.   
B-Tree 스캔만으로 원하는 데이터를 가져올 수 있으며, `컬럼을 읽기 위해 
실제 데이터 블록에 접근할 필요가 전혀 없다.`   

아래 그림은 SQL이 실행되는 순서이다. FROM ~ JOIN 부터 HAVING 까지는 
인덱스를 활용할 수 있지만 SELECT ~ LIMIT 부분에는 실제 데이터 블록을 
조회해야 한다.   

<img width="200" alt="스크린샷 2024-09-08 오후 3 54 55" src="https://github.com/user-attachments/assets/387da037-043c-43e4-b41d-c2cf6ee43683">   

##### SELECT   

`단계를 보면 SELECT가 먼저 조회되기 때문에 아무래도 LIMIT 부분에서 부하가 걸릴 수 밖에 없다.`      
`즉, LIMIT 처리가 되면 필요 없을 수 있는 데이터까지 전부 포함한 전체 데이터의 
전체 컬럼을 인덱스와 비교해가면서 읽어서 로드해야 한다.`      

##### ORDER By   

order by 의 경우 select 보다 나중에 처리 된다.  
그래서 전체 컬럼을 모두 포함한 무거운 데이터를 정렬해야 한다.   

하지만 `커버링 인덱스는 모든 쿼리가 인덱스를 활용하게 된다.`      

<img width="200" alt="스크린샷 2024-09-08 오후 3 54 58" src="https://github.com/user-attachments/assets/61d5449a-f55e-4fe2-a1fe-45025982425c">   

커버링 인덱스를 사용한 쿼리는 모든 과정에서 인덱스만을 활용해서 데이터를 
완성한다.   
그래서 인덱스와 데이터 블록을 비교하면서 데이터를 완성할 필요가 없다.   

- - - 


## 2. Non-clustered Key와 Clustered Key   



- - -   

## 3. 커버링 인덱스 단점   

`커버링 인덱스의 단점으로는 후속 쿼리가 필요하다는 것이다.`     
하지만 pk 로 where in 쿼리를 사용하기 때문에 일반적으로 
큰 문제가 되지 않는다.   

`또한 인덱스가 많이 필요하게 된다.`   
쿼리의 모든 항목이 인덱스에 포함되어 있어야 하기 때문에 
너무 많은 인덱스 추가는 메모리 낭비가 심해지고 
insert, update, delete 성능이 느려질 수 있다.   




- - -
Referrence

<https://tecoble.techcourse.co.kr/post/2021-10-12-covering-index/>   
<https://jaehoney.tistory.com/216>   
<https://jojoldu.tistory.com/243>  
<https://jojoldu.tistory.com/529>   
<https://jojoldu.tistory.com/476>   

{% highlight ruby linenos %}
{% endhighlight %}

{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

