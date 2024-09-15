---
layout: post
title: "[DB] Mysql 커버링 인덱스로 성능 최적화 하기"
subtitle: "Covering Index / 쿼리 실행 순서 / Clustered, Non Clustered Index"
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

`일반적으로 인덱스를 이용해 조회되는 쿼리에서 가장 큰 성능 저하를 일으키는 부분은 
인덱스를 검색하고 대상이 되는 row의 나머지 컬럼값을 데이터 블록에서 읽을 때이다.`      

> 페이징 쿼리와 무관하게 인덱스를 탔음에도 느린 쿼리의 경우 이 select 절 항목 때문이다.   


##### ORDER By   

order by 의 경우 select 보다 나중에 처리 된다.  
그래서 전체 컬럼을 모두 포함한 무거운 데이터를 정렬해야 한다.   

하지만 `커버링 인덱스는 모든 쿼리가 인덱스를 활용하게 된다.`      

<img width="200" alt="스크린샷 2024-09-08 오후 3 54 58" src="https://github.com/user-attachments/assets/61d5449a-f55e-4fe2-a1fe-45025982425c">   

커버링 인덱스를 사용한 쿼리는 모든 과정에서 인덱스만을 활용해서 데이터를 
완성한다.   
그래서 인덱스와 데이터 블록을 비교하면서 데이터를 완성할 필요가 없다.   

- - - 

## 2. Non-clustered Index와 Clustered index      

DB에서 인덱스의 구조는 크게 Clustered와 Non Clustered로 나뉜다.   

<img width="700" alt="스크린샷 2024-09-15 오후 8 25 44" src="https://github.com/user-attachments/assets/59600660-a417-4cdb-9e92-4461db10bb7a">    

Clustered 와 Non Clustered를 통한 탐색은 위와 같이 진행되며, 
          2가지를 확인해야 한다.   

- `Non Clustered Key (일반적인 인덱스) 에는 인덱스 컬럼의 값들과 Clustered Key(PK)의 값이 포함되어 있다.`      
- `Clustered Key 만이 실제 테이블의 row 위치를 알고 있다.`   

<img width="700" alt="스크린샷 2024-09-15 오후 8 22 24" src="https://github.com/user-attachments/assets/9a934e31-3624-434b-bbc1-ba1839206a19">   

`MySQL에서는 Non Clustered Key에 Clustered Key가 항상 포함되어 있다.`     
이유는 Non Clustered Key에는 데이터 블록의 위치가 없기 때문이다.   

즉, 인덱스 조건에 부합한 where 조건이 있더라도 select 에 인덱스의 포함된 컬럼 외에 다른 컬럼 값이 
필요할 때는 Non Clustered Key에 있는 Clustered Key 값으로 데이터 블록을 찾는 과정이 필요하다.   

> 다만 pk를 사용할 경우 인덱스 탐색 시간이 없어지기 때문에 향상된 데이터 파일 접근이 가능하다.   

`커버링 인덱스는 여기서 실제 데이터 접근의 행위 없이 인덱스에 있는 컬럼 값들로만 쿼리를 완성하는 것을 이야기 한다.`   


- - - 

## 3. WHERE + GROUP BY   

where, group by 를 사용할 때 커버링 인덱스가 언제 적용되는지 살펴보자.      

> index: a, b, c 인 경우   

- `group by 절에 명시된 컬럼이 인덱스 컬럼의 순서와 같아야 한다.`     
    - 아래 모든 케이스는 인덱스 적용이 안된다.      
    - group by b
    - group by b, a
    - group by a, c, b   
    
- `인덱스 컬럼 중 뒤에 있는 컬럼이 group by 절에 명시되지 않아도 인덱스는 사용할 수 있다.`     
    - 아래 모든 케이스는 인덱스 적용이 된다.       
    - group by a
    - group by a, b
    - group by a, b, c   

- `반대로 인덱스 컬럼 중 앞에 있는 컬럼이 group by 절에 명시되지 않으면 인덱스를 사용할 수 없다.`     
    - group by b, c 는 인덱스 적용 안된다.    

- `인덱스에 없는 컬럼이 group by 절에 포함되어 있으면 인덱스가 적용되지 않는다.`      
    - group by a, b, c, d  


`여기서 where 조건과 group by 가 함께 사용되면 where 조건이 동등 비교일 경우 
group by 절에 해당 컬럼은 없어도 인덱스가 적용된다.`      

즉, 아래 2개의 쿼리는 모두 정상적으로 인덱스가 적용 된다.  

> index: a, b, c 인 경우   

```sql
-- 동등 비교인 경우   
WHERE a = 1 
GROUP BY b, c

WHERE a = 1 and b = 'b'
GROUP BY c


-- 동등 비교가 아닌 경우  
WHERE a like 'OFFSET%'
GROUP BY b, c
```

- - -   

## 4. WHERE + ORDER BY   

일반적으로 order by 의 인덱스 사용 방식은 group by와 유사하지만, 
    정렬 기준에서 차이가 있다.   

생성된 인덱스를 앞에서부터 읽을 수도 있고(Forward index scan), 뒤에서 부터 
읽을 수도 있다(Backward index scan)    

더 자세한 내용은 [링크](https://tech.kakao.com/posts/351)를 참고해보자.   

먼저 order by 에서 인덱스가 적용 안되는 경우는 다음과 같다.   

> index: a, b, c 인 경우    

- 인덱스 첫번째 컬럼인 a가 누락되어 사용 불가     
    - order by b, c   
       
- 인덱스에 포함된 b 컬럼이 a, c 사이에 미포함되어 사용 불가  
    - order by a, c   

- 인덱스 컬럼과 order by 컬럼간 순서 불일치로 사용 불가   
    - order by a, c, b      

- b 컬럼의 desc 로 인해서 사용 불가   
    - order by a, b, desc, c   

- 인덱스에 존재하지 않는 컬럼 d로 인해 사용 불가   
    - order by a, b, c, d  

반대로 인덱스가 적용 가능한 경우는 아래와 같다.    

```sql
WHERE a = 1
ORDER BY b, c

WHERE a = 1 and b = 'b'
ORDER BY c
```   

> 위 쿼리가 가능한 이유는 실제로 where a = 1 order by a, b, c 와 동일한 쿼리이기 때문이다.     

`위의 group by 와 마찬가지로 동등 비교가 아닌 경우 
아래와 같이 사용하면 order by 는 인덱스를 태우지 못한다.`           

> index: a, b, c 인 경우   

```sql
WHERE a like 'abc%'
ORDER BY b, c
```

실행계획을 살펴보면 a 컬럼만 인덱스를 타고 order by는 인덱스를 태우지 못했다.   

> like '%abc%' 는 인덱스를 태우지 못하지만 like 'abc%' 는 인덱스를 태울수 있다.   

<img width="700" alt="스크린샷 2024-09-15 오후 9 52 46" src="https://github.com/user-attachments/assets/3d18b0f8-5d1d-419b-a4bd-5bb995cd1ea8">   

이런 경우 아래와 같이 쿼리를 사용하는 것이 조금의 성능 향상을 할 수 있다.   

```sql
WHERE a like 'abc%'
ORDER BY a, b, c
```  

마지막으로 WHERE + GROUP BY + ORDER BY 를 살펴보면, 
    WHERE + ORDER BY 의 경우엔 WHERE 가 동등일 경우엔 ORDER BY가 나머지 인덱스 컬럼만 있어도 
    인덱스를 탈수 있었다.   

GROUP BY + ORDER BY 의 경우엔 둘다 인덱스 컬럼을 탈 수 있는 조건이어야만 한다.   


- - -   

## 5. 커버링 인덱스 단점   

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
<https://jojoldu.tistory.com/481?category=761883>   

{% highlight ruby linenos %}
{% endhighlight %}

{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

