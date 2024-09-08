---
layout: post
title: "[DB] Mysql 인덱스 이해하기"
subtitle: "B-Tree 인덱스 구조 / 다중 컬럼 인덱스 / UNIQUE INDEX / index condition pushdown / 실행계획 / 주의사항"
comments: true
categories : Database
date: 2023-09-06
background: '/img/posts/mac.png'
---   

## 1. 인덱스란?    

인덱스는 결국 지정한 컬럼들을 기준으로 메모리 영역에 일종의 목차를 
생성하는 것이다.   
insert, update, delete 의 성능을 희생하고 대신 select 의 성능을 향상 시킨다.   

> 테이블의 인덱스 색인 정보를 갱신하는 추가적인 비용 소요   

`여기서 update, delete 행위가 느린 것이지 update, delete를 하기 위해 
해당 데이터를 조회하는 것은 인덱스가 있으면 빠르게 조회가 된다.`   

> 인덱스가 없는 컬럼을 조건으로 update, delete를 하게 되면 굉장히 느려 
많은 양의 데이터를 삭제 해야 하는 상황에선 인덱스로 지정된 
컬럼을 기준으로 진행하는 것을 추천한다.   

<img width="800" alt="스크린샷 2024-09-07 오후 1 12 35" src="https://github.com/user-attachments/assets/32bb531d-8599-48df-8b74-fd003cb8d484">   

(B-Tree 인덱스 구조)  

- 인덱스 탐색은 Root -> Branch -> Leaf -> 디스크 저장소 순으로 진행된다.   
    - 예를 들어 Branch(페이지 번호 2)는 dept-no가 d001이면서 emp-no가 10017 ~ 10024까지인 Leaf의 부모로 있다.   
    - `즉, dept-no=d001 이면서 emp-no=10018 을 조회하면 페이지 번호 4인 Leaf를 찾아 데이터 파일의 주소를 불러와 반환하는 과정을 하게 된다.`      

- `다중 컬럼 인덱스의 두번째 컬럼은 첫 번째 컬럼에 의존해서 정렬되어 있다.`   
    - 즉, 두번째 컬럼의 정렬은 첫번째 컬럼이 똑같은 열에서만 의미가 있다. 
    - 만약 3번째, 4번째 인덱스 컬럼도 있다면 두번째 컬럼과 마찬가지로 3번째 컬럼은 
    2번째 컬럼에 의존하고, 4번째 컬럼은 3번째 컬럼에 의존하는 관계가 된다.   

- 디스크에서 읽는 것은 메모리에 읽는 것보다 성능이 훨씬 떨어진다.   
    - `결국 인덱스 성능을 향상시킨다는 것은 디스크 저장소에 얼마나 덜 접근하게 만드느냐, 인덱스 Root에서 Leaf 까지 
    오고가는 횟수를 얼마나 줄이느냐에 달려있다.`    

- 인덱스의 갯수는 3~5개 정도가 적당하다.   
    - 너무 많은 인덱스는 새로운 Row를 등록할때마다 인덱스를 추가해야 하고, 수정/삭제시마다 인덱스 수정이 필요하여 
    성능상 이슈가 있다.   
    - 인덱스 역시 공간을 차지한다. 많은 인덱스들은 그만큼 많은 공간을 차지한다.    
    - 특히 많은 인덱스들로 인해 옵티마이저가 잘못된 인덱스를 선택할 확률이 높다.    

- - - 

## 2. 인덱스 키 값의 크기   

InnoDB (MySQL)은 디스크에 데이터를 저장하는 가장 기본 단위를 페이지라고 하며, 
       `인덱스 역시 페이지 단위로 관리` 된다.   

> 페이지는 16KB 로 크기가 고정되어 있다.   

만약 본인이 설정한 인덱스 키의 크기가 16 Byte라고 하고, 자식노드(Branch, Leaf)의 주소가 
담긴 크기가 12 Byte 정도로 잡으면 16*1024 / (16+12) = 585 로 인해 
하나의 페이지에는 585개가 저장될 수 있다.    

여기서 인덱스 키가 32 Byte로 커지면 어떻게 될까?   

16*1024 / (32+12) = 372 로 되어 372개만 한 페이지에 저장할 수 있게 된다.   

`조회 결과로 500개의 row를 읽을 때 16Byte일 때는 1개의 페이지에서 다 조회가 되지만, 
    32Byte 일 때는 2개의 페이지를 읽어야 하므로 이는 성능 저하가 발생하게 된다.`   

> 인덱스의 키는 길면 길수록 성능상 이슈가 있을 수 있다.   


- - - 

## 3. 인덱스 컬럼 기준   

`먼저 중요한 것은 1개의 컬럼만 인덱스를 걸어야 한다면, 
    해당 컬럼은 카디널리티(Cardinality)가 가장 높은 것을 잡아야 한다는 것이다.`      

> Cardinality란 해당 컬럼의 중복된 수치를 나타낸다.    
> 예를 들어 성별, 학년 등은 Cardinality가 낮다고 얘기한다.   
> 반대로 유저의 id 등은 Cardinality가 높다고 얘기한다.   

`인덱스로 최대한 효율을 뽑아내려면, 해당 인덱스로 많은 부분을 걸러내야 하기 때문이다.`   

만약 성별을 인덱스로 잡는다면, 남/녀 중 하나를 선택하기 때문에 인덱스를 통해 50% 밖에 
걸러내지 못한다.   

하지만 유저의 id 같은 경우엔 인덱스를 통해 데이터의 대부분을 걸러내기 때문에 빠르게 검색이 가능하다.   

`즉, 인덱스를 설계할 때 컬럼은 조회시 자주 사용되며, 고유한 값 위주로 설계하는 것이 좋다.(PK, Join 시 사용되는 컬럼)`      
`또한 인덱스의 키의 크기는 되도록 작게 설계해야하며, update가 빈번하지 않는 컬럼을 
인덱스로 잡는 것이 좋다.`      

### 3-1) 여러 컬럼으로 인덱스 구성시 기준   

그럼 여러 컬럼으로 인덱스를 잡는다면 어떤 순서로 인덱스를 구성해야 할까?    

`아래와 같이 Cardinality가 높은 순에서 낮은 순(중복도가 낮은 순에서 높은 순)으로 생성해야 
성능이 뛰어 나다.`  

```
-- 다중 컬럼 인덱스   
CREATE INDEX IDX_USER ON user(user_id, is_bonus);

-- 인덱스 조회
SHOW INDEX FROM 테이블 이름    
```

아래는 중복 값을 허용하지 않는 인덱스를 생성할 수 있다.   

```
CREATE UNIQUE INDEX 인덱스 이름 ON 테이블이름(필드 이름1, 필드 이름2, ...)    
```

### 3-2) 여러 컬럼으로 인덱스시 조건 누락  

아래 테이블을 예시로 살펴보자.   

```sql
-- 단일 컬럼 인덱스  
CREATE TABLE table1(
    id INT(11) NOT NULL auto_increment,
    name VARCHAR(50) NOT NULL,
    address VARCHAR(100) NOT NULL,
    PRIMARY KEY('uid'),
    key idx_name(name),
    key idx_address(address)
)

-- 다중 컬럼 인덱스 
CREATE TABLE table2(
    id INT(11) NOT NULL auto_increment,
    name VARCHAR(50) NOT NULL,
    address VARCHAR(100) NOT NULL,
    PRIMARY KEY('uid'),
    key idx_name(name, address)    
)
```

```sql
SELECT * FROM table1 WHERE name='홍길동' AND address='경기도';
```

먼저 table1의 경우에 각 컬럼(name), (address)에 인덱스가 걸려 있기 때문에 mysql은 
name 컬럼과 address 컬럼을 보고 둘 중에 어떤 컬럼의 수가 더 빠르게 검색되는지 판단 후 
빠른 쪽을 먼저 검색하고 그 다음 다른 컬럼을 검색하게 된다.   

table2의 경우 바로 원하는 값을 찾는데 그 이유는 인덱스를 저장할 때 name과 address를 같이 
저장하기 때문이다.   
즉, name과 address의 값을 같이 색인하고 검색에서도 '홍길동경기도' 로 검색을 시도하게 된다.   
이렇게 사용할 경우 table1보다 table2의 경우가 더 빠른 검색을 할 수 있다.   

그렇지만 다중 컬럼 인덱스를 아래와 같이 사용하면 인덱스를 타지 않는다.   

```sql
SELECT * FROM table2 WHERE address='경기도';
```

`이 경우에는 다중 컬럼 인덱스로 설정되어 있던 name이 함께 검색이 되지 않으므로 인덱스의 효과를 볼 수가 없다.`   

하지만 조건 값을 name='홍길동' 으로 준다면 B-Tree 자료구조 탐색으로 인해 name 컬럼은 인덱스가 
적용된다.      
예를 들어 인덱스가 (name, address, age) 순일 때 where name = ? and address = ? 는 인덱스가 적용되지만 
where name = ? and age = ? 에서 age 컬럼은 인덱스 적용이 되지 않는다.   

`다중 컬럼 인덱스를 사용할 때는 인덱스로 설정해준 제일 왼쪽 컬럼이 where 절에 사용되어야 한다.`       

- - - 

## 4. Index Condition Pushdown   

먼저 Mysql(or MariaDB)에서 Index Condition Pushdown 옵션이 활성화 되어 있는지 확인해보자.   

```
show variables like 'optimizer_switch';

// 아래와 같이 확인 가능 
// ...index_condition_pushdown=on;... 
```

해당 옵션을 off 하기 위해서는 아래와 같이 진행할 수 있다.   

```
set optimizer_switch = 'index_condition_pushdown=off';
```   


- - -   

## 5. 인덱스 조회시 주의사항    

- `between, like, <, > 등 범위 조건은 해당 컬럼은 인덱스를 타지만, 그 뒤 인덱스 컬럼들은 인덱스가 사용되지 
않는다.`       
    - 즉, (name, age, address) 으로 인덱스가 잡혀 있는데 조회 쿼리를 where name=? and address=? and age > ? 등으로 잡으면 
    address 는 인덱스가 사용되지 않는다.    
    - 범위조건으로 사용하면 안된다고 기억하면 좀 더 쉽다.   

- 반대로 =, in 은 다음 컬럼도 인덱스를 사용한다.   
    - in 은 결국 = 를 여러번 실행시킨 것이기 때문이다.    
    - 단 in은 인자값으로 상수가 포함되면 문제 없지만, 서브쿼리를 넣게 되면 성능을 확인해 봐야 한다.   


- AND 연산자는 각 조건들이 읽어와야할 ROW 수를 줄이는 역할을 하지만, or 연산자는 비교해야할 ROW가 
더 늘어나기 때문에 풀 테이블 스캔이 발생할 확률이 높다.   
    - where 에서 or를 사용할 때는 주의가 필요하다.   

- 인덱스로 사용된 컬럼값 그대로 사용해야만 인덱스가 사용된다.   
    - 인덱스는 가공된 데이터를 저장하고 있지 않는다.   
    - where salary * 10 > 150000; 는 인덱스를 못타지만, where salary > 150000 / 10; 은 인덱스를 사용한다.   
    - 컬럼이 문자열인데 숫자로 조회하면 타입이 달라 인덱스가 사용되지 않는다. 정확한 타입을 사용해야만 한다.    

- null 값의 경우 is null 조건으로 인덱스 레인지 스캔 가능   

- - - 

## 6. 실행계획 분석   

explain 을 이용하여 실행계획을 확인할 때 `possible_keys, key, Extra 를 주목해서 봐야 한다.`   

`possible_keys는 사용 가능한 인덱스들의 목록이고, key는 그 중 mysql이 봤을 때 적합하다고 판단되어서 
실제로 사용하게 되는 인덱스이다.`   

`Extra는 조회를 할 때 내부적으로 어떤 절차를 밟게 되는지, 신경 써야 하는 부분이 어떤 것들이 있는지 알려준다.`   

### 6-1) Extra  

##### Using where   

<img width="746" alt="스크린샷 2024-09-07 오후 10 53 44" src="https://github.com/user-attachments/assets/fca9d4eb-a706-46c4-a65d-717eacb1745f">   

InnoDB 스토리지 엔진이 넘겨 준 데이터(인덱스를 사용해 걸러진 데이터) 중에서 MySQL (MariaDB) 엔진이 
한번 더 걸러야 되는 조건(필터링 혹은 체크 조건)이 있다면 Using Where가 된다.   

즉 Using where는 InnoDB 스토리지 엔진을 통해 테이블에서 행을 가져온 뒤, MySQL 엔진에서 
추가적인 체크 조건을 활용해서 행의 범위를 축소한 경우 표시된다.   


##### Using temporary   

임시 테이블을 생성하여 결과를 처리함을 나타낸다. 일반적으로 order by 와 group by 절에서 
정렬이나 그룹화를 수행할 때 발생할 수 있다.   

##### Using filesort   

파일 정렬을 사용하여 데이터를 정렬함을 나타낸다. 이는 인덱스를 사용하지 않고 정렬을 수행해야 할 때 
발생할 수 있다. 


- - -    


- - -
Referrence

<https://jojoldu.tistory.com/243>  
<https://jojoldu.tistory.com/529>   
<https://jojoldu.tistory.com/476>   

{% highlight ruby linenos %}
{% endhighlight %}

{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

