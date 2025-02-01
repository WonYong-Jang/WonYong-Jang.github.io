---
layout: post
title: "[Spark] Join Strategies 과 Shuffle"   
subtitle: "shuffle join, broadcast join / shuffle sort merge join, broadcast hash join / join hint"             
comments: true   
categories : Spark   
date: 2024-04-20   
background: '/img/posts/mac.png'   
---

이번글에서는 Spark에서 제공하는 여러 조인 전략 및 Hint와 
어떤 전략으로 join을 선택하는지 등을 살펴보자.   

- - - 

## 1. 스파크에서 제공하는 조인 종류     

스파크에서 조인은 아래와 같은 조인 종류를 제공한다.   

##### 1-1) inner join(내부 조인)

왼쪽과 오른쪽 데이터셋에 키가 있는 로우를 유지   

##### 1-2) outer join(외부 조인)   

왼쪽이나 오른쪽 데이터셋에 키가 있는 로우를 유지   

##### 1-3) left outer join(왼쪽 외부 조인)   

왼쪽 데이터셋에 키가 있는 로우를 유지   

##### 1-4) right outer join(오른쪽 외부 조인)   

오른쪽 데이터셋에 키가 있는 로우를 유지   

##### 1-5) left semi join   

왼쪽 데이터셋의 키가 오른쪽 데이터셋에 있는 경우에는 키가 일치하는 왼쪽 데이터셋만 유지    

##### 1-6 left anti join   

왼쪽 데이터셋의 키가 오른쪽 데이터셋에 없는 경우에는 키가 일치하지 않는 왼쪽 데이터셋만 유지    
중복된 데이터를 제거한 나머지 데이터만 남겨서 연산을 할 때 유용하다.   

##### 1-7) natural join   

두 데이터셋에서 동일한 이름을 가진 컬럼을 암시적으로 결합하는 조인   

##### 1-8) cross join / cartesian join   

왼쪽 데이터셋의 모든 로우와 오른쪽 데이터셋의 모든 로우를 조합   

- - - 

## 2. 스파크의 일반적인 조인 수행 방식    

일반적으로 join은 동일한 키의 데이터가 동일한 파티션 내에 있어야 하므로 비용이 비싼 작업이다.    
조인할 키의 데이터가 동일한 파티션에 있지 않다면 셔플이 필요하고, 이를 통해 동일한 
키의 데이터는 동일한 파티션에 위치하게 된다.   

`즉, 조인의 비용은 키의 개수와 올바른 파티션으로 위치하기 위해 움직이는 규모에 비례해서 커진다.`        

스파크는 조인 시 크게 두 가지 방식으로 조인을 진행한다.    

> 더 세부적인 조인 방식은 아래에서 설명할 예정이다.   

### 2-1) Shuffle join    

전체 노드간 네트워크 통신을 유발하는 shuffle join 방식이다.   
조인 키로 두 데이터 세트를 섞고 동일한 키를 가진 데이터를 동일한 노드로 
이동시킨다.   

<img width="400" alt="스크린샷 2024-04-29 오후 3 16 31" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/e556fbc5-8cea-4f54-93bd-21c8be36f18f">    

### 2-2) Broadcast join   

`작은 데이터 세트를 broadcast 변수로 driver에서 생성하여 
클러스터의 각 executor 별로 복제해 놓고 join 하는 방식이다.`   

따라서, broadcast 되는 대상 테이블이 크다면 비정상 종료가 될 수 있다.     

아래와 같이 기본 설정값을 증설하면 해결될 수 있지만,  
    할당 받은 driver의 메모리 등이 부족하다면 동일하게 
    문제가 발생할 수 있기 때문에 클러스터의 리소스를 고려하여 
    증설하여야 한다.   

```
spark.sql.broadcastTimeout=600 # default: 300초(5분)
spark.sql.autoBroadcastJoinThreshold=100MB  # default: 10MB
```

`driver에서 broadcast 변수로 생성하여 각 executor로 전송할 때 
네트워크 비용이 발생하지만, 그 이후 join을 진행할 때는 네트워크를 통한 
데이터 이동이 없기 때문에 join 속도가 매우 빠르다.`      

<img width="310" alt="스크린샷 2024-04-29 오후 3 16 37" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/268f4f1e-2a99-45f0-8126-1cb9f8924331">   

> 하둡에서는 map-side join이라고도 부른다.   

- - - 

## 3. 일반적인 조인 전략    

일반적으로 사용되는 nested loop join, merge join, hash join을 먼저 살펴보고 
spark 에서 사용되는 조인 전략에 대해서 살펴보자.     

### 3-1) Nested Loop Join    

아주 무식하면서 심플한 방법이며, 아래 그림과 같이 왼쪽 테이블과 오른쪽 테이블을 
조인한다고 생각해보자.   

<img width="500" alt="스크린샷 2024-04-30 오후 3 57 58" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/5a8f6d8d-a8ca-4565-9fb4-54c020bdd88e">    

왼쪽 테이블의 첫번째 row의 join key 값을 들고 오른쪽 테이블의 처음부터 마지막 row까지 
돌면서 동일한 key 값이 있으면 매칭한다.    
그 다음에는 왼쪽 테이블의 두번째 row의 key값을 들고 오른쪽 테이블을 전수조사하는 방식이다.   
이런식으로 하다보면 O(T1 * T2)만큼의 시간복잡도가 걸리는 비효율적인 방식이다.   


### 3-2) merge join   

매칭을 시작하기 전 양 테이블의 키 값을 기준으로 소팅을 한다.   
매칭 로직은 nested loop join과 동일하게 시작한다. 왼쪽 테이블의 A값을 들고 오른쪽 테이블의 
첫번째 row부터 살펴본다.   
매칭이 된다면 매칭을 시키고 다음 row로 넘어간다. 이를 반복하다가 다른 key 값이 
나오면 멈춘다.  
왜냐하면 이미 소팅이 되어 있기 때문에, 뒤에는 같은 key 값이 없을 것이기 때문이다.   
그럼 다음 key 값인 B를 들고 오른쪽 테이블의 처음부터가 아니라 아까 멈춘 곳부터 매칭을 시작한다.   

<img width="500" alt="스크린샷 2024-04-30 오후 4 00 56" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/c4664faa-e5d8-4e98-82cb-421f9069662c">   

결과적으로 O(T1logT1 + T2logT2) 시간복잡도 만큼의 시간이 걸린다고 볼 수 있다.   


### 3-3) Hash Join

hash join은 이름에서도 알 수 있듯이 hash function을 사용하며, 왼쪽 테이블의 모든 key 값을 
hash function을 통과시켜 hash 테이블에 배치한다.   
그 후 오른쪽 테이블의 모든 row를 매칭시킨다.   
hash function은 O(1)의 시간이 들 것이고, 결과적으로 O(T1+ T2) 만큼의 시간 복잡도가 걸릴 것이다.   

<img width="500" alt="스크린샷 2024-04-30 오후 4 05 50" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/c0f901c7-ad20-4262-a90b-bce4932fb982">      

- - -   

## 4. Spark 에서의 조인 전략    

이제 Spark 에서 주로 사용되는 join 전략에 대해 살펴보자.   

<img width="730" alt="스크린샷 2024-12-08 오후 6 24 10" src="https://github.com/user-attachments/assets/fdc7730b-ad36-4184-8aff-7027ee24bda6">   

위 사진을 보면, 등가조인과 비등가조인일 때로 우선 분리된다.   

`즉, spark에서 대용량 데이터를 이용하여 비등가 조인(like 검색, <, >, <=, >=)을 할 경우 
비효율적인 조인 방식을 사용하기 때문에 성능상 문제가 발생할 수 있다.`  

`위 사진과 같이 비등가 조인을 할 경우 성능이 느린 broadcast nested loop join, catesian join 등이 
실행될 수 있기 때문에 최대한 지양해야 한다.`    

그 후 조인 Hint가 있는지를 확인하여 조인이 결정된다.     

> 지정한 Hint는 모든 Join 타입에 지원하지 않을 수 있기 때문에 항상 적용되진 않는다.   

### 4-1) Shuffle Sort Merge Join   

두 테이블이 모두 큰 경우 사용 되며, 두 테이블 모두 조인 키 기반으로 repartition 이 
발생한다.    

> default shuffle partition은 200 이기 때문에 200개의 셔플 파티션을 사용한다.    

`spark 2.3 부터 shuffle hash join 보다 더 좋은 성능을 내는 
shuffle sort merge join 을 기본적으로 사용한다.`       

`Shuffle sort merge join은 과거에 
shuffle hash join 과 달리 memory가 아닌 disk를 이용할 수 있기 
때문에 OOM이 발생하지 않는다.`      

> Hashing 작업은 메모리가 요구되며 hash table을 유지해야 하기 때문에 
오버헤드가 발생할 가능성이 높다.   

이를 확인하기 위해 아래 옵션을 이용하여 off 시키고 shuffle hash join을 
테스트 해볼 수 있다.     

```
spark.conf.set("spark.sql.join.preferSortMergeJoin","false")
```

shuffle sort merge join 은 첫번째로 shuffle 과정을 진행한다.   
동일한 조인 키를 가지는 데이터셋을 동일한 executor로 이동시킨다.   
그 후 executor node에서 각 파티션을 조인키 기반으로 정렬 한다.  
마지막으로 조인키 기반으로 병합한다.   

`따라서 정렬이 적용되므로 조인 키들의 정렬이 가능한 데이터 타입이어야 한다.`   


<img width="700" alt="스크린샷 2024-04-20 오후 12 32 28" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/df897b0b-d54c-40d7-a974-1b8d491cc2ad">   

<img width="700" alt="스크린샷 2024-04-20 오후 12 32 48" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/f4e469cc-08c6-4eb4-92df-04994aae2aa4">  

Spark UI에서 아래와 같이 확인할 수 있다.  

<img width="500" alt="스크린샷 2024-12-12 오전 9 14 48" src="https://github.com/user-attachments/assets/6f4bf60b-71ff-4642-8c45-d8604ff55304" />



### 4-2) Broadcast Hash Join    

`위에서 설명한 broadcast 변수를 driver에서 생성하여 각 executor로 복제해 놓고, 해시 조인을 실행하는 방식이다.`       

<img width="700" alt="스크린샷 2024-04-21 오후 3 38 11" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/055eb343-b4f2-457d-8441-58d874a3c1b2">   

```
// default: 10MB
// -1로 설정하게 되면 broadcast는 비활성화 된다.
spark.conf.set("spark.sql.autoBroadcastJoinThreshold", [your threshold in Bytes])
```

> 사용자가 hint를 지정하거나, 지정하지 지정하지 않았더라도 한쪽 테이블 사이즈가 위 설정보다 
작으면 실행될 수 있다.    

위 설정과 같이 default로 10MB 이하의 데이터 셋이 broadcast 변수로 생성되며, 
    Spark 엔진 또는 [Adaptive Query Exectuion](https://wonyong-jang.github.io/spark/2024/04/15/Spark-Adaptive-Query-Execution.html)에 의해 
    Broadcast Hash join이 실행되지만 그렇지 못한 경우는 직접 명시를 해주어야 한다.   

```python
import org.apache.spark.sql.functions.broadcast

# broadcast hint를 명시 
val joinDF = bigDF.join(broadcast(smallDF), "joinKey")
```



### 4-3) Partial Manual Broadcast Hash Join     

소수의 키에 데이터가 크게 몰려 있어서 메모리에 올릴 수 없는 경우, 
    몰려 있는 키만 빼고 일반 키들만으로 braodcast join을 하는 방법도 
    고려해 볼 수 있다.   
각 키 별로 필터링하여 broadcast join과 일반적인 join을 나눠서 수행하고 union으로 
합치는 방법이다.   
이 방법은 다루기 힘든 심하게 skewed 된 데이터를 다룰 때 고려해 볼 수 있을 것이다.   

### 4-4) Broadcast Nested Loop Join

Broadcast hash 조인과 유사하게 작은 데이터 셋이 전체 워커 노드로 전달 되지만, 
hash 기반 조인이 아닌, nested loop join이 진행된다.   

데이터 셋이 크다면 굉장히 비효율적인 방식이다.  

- `right outer join 에서 왼쪽 테이블이 브로드캐스트된다.`      
- `left outer, left semi, left anti join 에서 오른쪽 테이블이 브로드캐스트 된다.`      

<img width="352" alt="스크린샷 2024-12-12 오전 8 55 34" src="https://github.com/user-attachments/assets/0e75bb3c-0b34-4514-bd91-7d3347d59edc" />


### 4-5) Cartesian Product Join    

Join 키가 존재하지 않는 경우, Cartesian Join이 선택된다.

<img width="285" alt="스크린샷 2024-12-12 오전 9 01 35" src="https://github.com/user-attachments/assets/7acbf53e-b43e-4326-9952-97b2e16a5516" />   

- - -   

## Conclusion   

조인 타입에 의해 제공하는 조인 전략은 아래 표에서 확인해보자.   

<img width="650" alt="스크린샷 2024-12-12 오전 9 04 53" src="https://github.com/user-attachments/assets/f5609cb4-13aa-4101-967f-b1be840a04fb" />     

Spark는 내부적으로 가장 적절한 Join 알고리즘을 선택하지만 
그렇지 않은 경우는 개발자가 Hint를 주어서 조인 전략을 변경할 수 있다.  
하지만 조인과 데이터 특성을 이해하지 못한다면 
OOM 등의 문제를 발생시킬 수 있기 때문에 데이터에 대한 이해와 Spark에서 
제공하는 조인 전략에 대해 이해하고 있어야 한다.   





- - - 

**Reference**   

<https://mjs1995.tistory.com/227#article-1-1--%EC%A0%84%EC%B2%B4-%EB%85%B8%EB%93%9C%EA%B0%84-%ED%86%B5%EC%8B%A0%EC%9D%84-%EC%9C%A0%EB%B0%9C-%EC%85%94%ED%94%8C-%EC%A1%B0%EC%9D%B8(shuffle-join)>    
<https://jaemunbro.medium.com/apache-spark-%EC%A1%B0%EC%9D%B8-join-%EC%B5%9C%EC%A0%81%ED%99%94-c9e54d20ae06>   
<https://angel-jinsu.tistory.com/33>    
<https://velog.io/@kimhaggie/spark-join%EC%9D%98-%EC%A2%85%EB%A5%98>    
<https://bertwagner.com/posts/visualizing-nested-loops-joins-and-understanding-their-implications/>    

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

