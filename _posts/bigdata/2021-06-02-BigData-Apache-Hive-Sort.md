---
layout: post
title: "[Hive] Apache hive 정렬"
subtitle: "order by, sort by, distribute by, cluster by"       
comments: true
categories : BigData
date: 2021-06-02
background: '/img/posts/mac.png'
---

# 하이브 정렬     

Hive에서 제공하는 기능중에서 일반 SQL 에서는 볼 수 없는 기능들 중, 리듀서에 보내는 
데이터를 분류할 수 있는 3가지가 있다.   

- Sort by   
- Distribute by   
- Cluster by   

우리가 SQL에서 자주 보던 order by 와 함께 
하이브 정렬은 order by, sort by, distribute by, cluster by 총 네가지 종류가 있다.   

아래 그림을 보면서 이해해보자.    
[링크](https://velog.io/@crescent702/Hive-Sort-by-Distribute-by-Cluster-by-%ED%99%9C%EC%9A%A9%EB%8F%84-b1jw1gmzcc)를 참고하였다.    

<img width="700" alt="스크린샷 2021-06-03 오후 5 27 37" src="https://user-images.githubusercontent.com/26623547/120613414-31383000-c491-11eb-88a2-3c9b103b8bc5.png">   

- - - 

## ORDER BY    

<img width="754" alt="스크린샷 2021-06-03 오후 5 35 02" src="https://user-images.githubusercontent.com/26623547/120614546-4eb9c980-c492-11eb-8f3d-9912619db6e0.png">   
`모든 데이터를 정렬하여 하나의 파일로 생성한다. 데이터가 클 경우 시간이 
오래 걸리고, Out of Memory 오류가 발생할 수 있다. 데이터가 작을 때 사용 하는 것이 
좋고 데이터가 클 경우 limit 옵션을 이용하여 처리 개수를 제한 하는 것이 좋다.`    

즉, Map-Reduce가 끝난 뒤 최종적으로 모인 하나의 리듀서에서 정렬을 하기 때문에 
정확히 정렬된 결과를 받을 수 있다.   

```
-- 테이블 풀 스캔 같은 성능에 영향을 미치는 쿼리는 nonstrict 모드에서만 동작한다. 기본 값은 nonstrict이다.    
set hive.mapred.mode=nonstrict;

SELECT *
  FROM tbl
 ORDER BY id;

-- strict 모드 일때는 LIMIT 가 있어야만 처리 가능 
set hive.mapred.mode=strict;

SELECT *
  FROM tbl
 ORDER BY id
 LIMIT 100;
```

- - - 

## SORT BY     


order by 와 비슷해 보일 수 있으나, order by의 경우에는 전체 결과를 
하나의 리듀서가 정렬을 하게 되는 반면, sort by의 경우에는 
각 리듀서에서 정렬을 하게 된다.   

`리듀서 별로 입력된 데이터를 정렬하여 출력한다. 리듀서 개수 만큼 생성되는 파일의 결과가 정렬되어 출력된다.`     

그로인해, 리듀서 갯수가 여러개 이기 때문에 성능에 이점을 볼 수 있다. 하지만, 
    각 리듀서에서만 정렬이 이루어지기 때문에 정확히 정렬된 결과물은 보장하지 
    않는다.   

아래는 리듀서 2개를 이용하여 sort by 를 사용한 결과이다.   

<img width="700" alt="스크린샷 2021-06-03 오후 5 45 58" src="https://user-images.githubusercontent.com/26623547/120616293-11563b80-c494-11eb-802c-fc0535a555cc.png">   

<img width="700" alt="스크린샷 2021-06-03 오후 5 46 05" src="https://user-images.githubusercontent.com/26623547/120616313-14e9c280-c494-11eb-9bd8-c3ef5ad03f1a.png">   

<img width="700" alt="스크린샷 2021-06-03 오후 5 46 11" src="https://user-images.githubusercontent.com/26623547/120616330-174c1c80-c494-11eb-8900-2db39eea4aa4.png">   



```
set mapred.reduce.tasks=2;
SELECT *
  FROM tbl
  SORT BY id;
```

단, 아래와 같이 리듀서를 1개만 사용한다면 ORDER BY와 결과가 동일하게 나온다.   
즉, 리듀서 수를 여러개 사용한다면 order by보다 속도가 빠르지만, 최종 데이터가 
모두 정렬되지 않아 정렬 용도로 사용은 불가능하다.    

> SET mapred.reduce.tasks=1    


- - - 

## DISTRIBUTE BY     

<img width="790" alt="스크린샷 2021-06-03 오후 5 43 06" src="https://user-images.githubusercontent.com/26623547/120615372-2f6f6c00-c493-11eb-9d6c-a7c849d0c034.png">    

`위 그림 처럼 column의 값을 기준으로 distribute by 를 리듀서 별로 같은 값이 들어가게 되며, 
리듀서로 전달 할 때 정렬하여 전달하지는 않는다.`     

> SQL의 GROUP BY와 비슷하게 접근하면 이해가 쉽다.    

아래는 Role을 기준으로 distribute by를 사용한 예시이다.   

```
select * 
    from tbl
distribute by Role
```

<img width="700" alt="스크린샷 2021-06-03 오후 5 56 14" src="https://user-images.githubusercontent.com/26623547/120617404-08199e80-c495-11eb-9636-2fc30b1dba54.png">   

<img width="700" alt="스크린샷 2021-06-03 오후 5 56 19" src="https://user-images.githubusercontent.com/26623547/120617476-19fb4180-c495-11eb-87cb-61b3ad12ae1e.png">   


보통은 아래처럼 sort by와 함께 사용하거나 cluster by를 사용한다.

```
SELECT col1, col2 FROM t1 DISTRIBUTE BY col1 SORT BY col1 ASC, col2 DESC
```


##### 특징    

- 리듀서(파일)별로 같은 column의 값만 가지도록 분류할 수 있다.   
- 생년월일 처럼 다양한 값으로 분류하게 되면 작은 용량의 파일이 여러개 생기게 된다.   

##### 장점   

- 생성되는 리듀서(파일)의 갯수를 기준에 따라 지정할 수 있다.   
- 하둡에 저장된 파일을 열어보면 같은 column의 데이터들이 모여있다.     

##### 단점   

- 기준을 명확하게 세우지 않으면 리듀서 별 데이터량의 편차가 심하다.    


- - - 

## CLUSTER BY     

`sort by 와 DISTRIBUTE by를 동시에 수행한다.`      
같은 값을 가지는 row는 
같은 리듀서에 전달되고, 리듀서 처리 결과를 정렬하여 출력한다.   

1. Distribute by로 기준 column을 두어 여러개의 reducer로 데이터를 나누어 보낸다.    
2. 여러개의 reducer에서 각각 sort by를 시행한다.     



- - - 

**Reference**   

<https://m.blog.naver.com/jevida/222050932485>   
<https://wikidocs.net/23560>    
<https://velog.io/@crescent702/Hive-Sort-by-Distribute-by-Cluster-by-%ED%99%9C%EC%9A%A9%EB%8F%84-b1jw1gmzcc>    

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}
