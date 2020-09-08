---
layout: post
title: "[DB] 커서 기반, 오프셋 기반 페이지네이션"
subtitle: "Cursor-based Pagination / Offset-based Pagination"
comments: true
categories : Database
date: 2020-09-06
background: '/img/posts/mac.png'
---

## 페이지네이션(Pagination)

`한정된 네트워크 자원을 효율적으로 활용하기 위해 특정한 정렬 기준에 따라 데이터를 분할하여 가져오는 것`      

즉, 데이터베이스에 만개의 데이터가 있을 때, 한번에 만 개를 전달하는 대신 0번 부터 
49번까지 50개씩 전달하는 것을 의미한다. 여기서 다음 요청이 들어오면 50번부터 99번까지, 또 다음 
요청이 들어오면 100번부터 149번까지 돌려준다. 이렇게 함으로써 네트워크의 낭비를 막고, 빠른 응답을 
기대할 수 있게 된다. 

Pagination은 아래와 같은 두가지 방식으로 처리가 가능하다. 

`1. 오프셋 기반 페이지네이션(Offset-based Pagination)`   
    - DB의 offset쿼리를 사용하여 '페이지' 단위로 구분하여 요청/응답    

`2. 커서 기반 페이지네이션(Cursor-based Pagination)`   
    - Cursor 개념을 사용하여 사용자에게 응답해준 마지막 데이터 기준으로 다음 n개 요청/응답   

- - -

### 1. Offset-based Pagination   

`MySQL 에서라면 간단하게 OFFSET 쿼리와 LIMIT 쿼리에 콤마를 붙여 '건너 뛸' row 숫자를 지정하여 페이지네이션을 구현한다.    
즉, 페이지 단위로 구분한다.`          

- 예제 1

> SELECT id FROM products ORDER BY id DESC LIMIT 20, 40   

LIMIT 절 앞에 붙은 숫자가 바로 **건너 뛸 갯수(offset)** 이다!    
(20개 데이터 다음부터 40개 가져오기)   

예를 들어, 1부터 시작하여 매기는 page 매개변수, 리스트의 쿼리 단위는 take 매개변수를 통해 전달된다고 
할 때 이를 통해 쿼리 스트링을 만든다고 하면 아래와 같다. 

```java
// page : 1부터 시작하는 페이지
// take : 한번에 불러올 row 수
const query = "SELECT id FROM products ORDER BY id DESC LIMIT " + (take *(page-1)) + ", " + take;
```
<br> 

- 예제 2

<img width="600" alt="스크린샷 2020-09-08 오후 8 50 51" src="https://user-images.githubusercontent.com/26623547/92473067-36739180-f215-11ea-95d3-0021e932ecee.png">

<img width="600" alt="스크린샷 2020-09-08 오후 8 51 03" src="https://user-images.githubusercontent.com/26623547/92473085-3a071880-f215-11ea-8738-aed9dac2b59f.png">   


이렇게 사용하면 가장 쉽고 편리한 방식인데 두가지 문제가 있다.   


#### 문제 1) 페이지 요청사이 데이터 변화가 있는 경우 중복 데이터 발생 

`전통적인 페이지네이션은 오랜 기간 잘 작동해왔다. 문제는 페이스북이나 인스타그램과 같은 
잦은 수정, 생성, 삭제가 반복되는데 SNS 서비스가 등작하면서 더 이상 효율적으로 작동하지 
못하게 되었다.`   

예를 들어, 1페이지에서 20개의 row를 불러와서 유저에게 1페이지를 띄워주었다. 고객이 1페이지의 
상품들을 보고 있는 사이, 상품 운영팀에서 5개의 상품을 새로 올렸다면?      

**유저가 1페이지 상품을 다 둘러보고 2페이지를 눌렀을때 1페이지에서 보았던 상품 20개중 마지막 5개를 
다시 2페이지에서 만나게 된다.**  

`반대로 5개 상품을 삭제했다면 2페이지로 넘어갔을때 고객은 5개의 상품을 보지 못하게된다!`   

#### 문제 2) 대부분의 RDBMS에서 OFFSET 쿼리의 퍼포먼스 이슈 

극단적으로 10억번째 페이지에 있는 값을 찾고 싶다면 OFFSET 또는 skip에 매우 큰 숫자가 들어가게 된다.   
`즉, 정렬기준(order by)에 대해 해당 row가 몇 번째 순서인지 알지 못하므로 OFFSET 값을 지정하여 쿼리를 한다고 했을 때 
지정된 OFFSET까지 모두 만들어 놓은 후 지정된 갯수를 순회하여 자르는 방식이다. 때문에 퍼포먼스는 이에 비례하여 떨어지게 되어 있다.`    

자세한 내용은 아래 글을 참조하자.   

[Faster Pagination in Mysql – Why Order By With Limit and Offset is Slow?](https://www.eversql.com/faster-pagination-in-mysql-why-order-by-with-limit-and-offset-is-slow/)

- - -

### 2. Cursor based Pagination   

Offset 기반 페이지네이션은 우리가 원하는 데이터가 '몇 번째'에 있다는 데에 집중하고 있다면, 
`커서 기반 페이지네이션은 우리가 원하는 데이터가 '어떤 데이터의 다음'에 있다는데에 집중한다.`   

`즉, n개의 row를 skip 한 다음 10개 주세요가 아니라, 이 row 다음꺼부터 10개 주세요를 요청한다!`   

#### 케이스::id DESC 정렬시 

위의 오프셋 기반 페이지네이션의 1번 예제에서 ID 역순 정렬되어 있는 post 테이블에서 첫번째 리스트를 가져오는 방법은 동일하다.

1000개의 데이터가 Id 기준 DESC정렬되어 있다고 가정하고 
다음 리스트를 가져오려면 #996 아래에 있어야할 데이터 #995 ~ #991을 가져오면 된다.
아래 쿼리로 쓰면 된다.

```
SELECT id, title
  FROM `post`
  WHERE id < (Id Cursor : 996)
  ORDER BY id DESC
  LIMIT 5
```

`위처럼 중복되지 않는 고유의 id를 정렬하여 커서로 페이지네이션 한다면 문제 될것이 없지만 
중복될 수 있는 생성 날짜등으로 정렬하여 커서로 사용시 문제가 생길수 있다.`

#### 케이스 Create_date DESC, id ASC 정렬시    



<img width="655" alt="스크린샷 2020-09-08 오후 9 51 23" src="https://user-images.githubusercontent.com/26623547/92478677-750d4a00-f21d-11ea-90c8-e914139e38e8.png">   




- - - 

## 결론 

전통적인 페이지네이션 방식은 오랫동안 네트워크 낭비를 줄여주는 기능을 담당해왔다. 하지만 실시간성을 띄는 SNS 서비스의 등장으로 
리소스가 자주 수정/생성/삭제되는 상황이 늘어나자 중복 전송의 가능성이 켜졌다. 트위터는 커서 기반 페이지네이션을 통해 
실시간으로 변화하는 타임라인 상에서 리소스의 중복 전송을 효과적으로 막아냈다.   

1. 동일 레코드가 중복되어도 상관없고 데이터 양이 적고 수정이 거의 없는 리스트의 페이지네이션은 오프셋 기반으로 구현해도 좋다.   
2. 그외 거의 모든 리스트는 커서 기반 페이지네이션을 사용하는 것이 무조건적으로 좋다.   
3. 서버의 쿼리 퍼포먼스/ 클라이언트의 사용 편의를 위해서 커서는 사용할 값을 별도로 정의하고, 이 값을 활용한 
WHERE / LIMIT 으로 커서 기반 페이지네이션을 구현 할수 있다.   
4. 이렇게 구현하는 경우 각 정렬 방식 마다 cursor 값과 정렬할 필드, ASC/DESC를 지정함으로써 쿼리 생성을 깔끔하게 할 수 있다.   




**Reference**

[https://velog.io/@leejh3224/%ED%8E%98%EC%9D%B4%EC%A7%80%EB%84%A4%EC%9D%B4%EC%85%98-%EC%BB%A4%EC%84%9C%EA%B8%B0%EB%B0%98-%ED%8E%98%EC%9D%B4%EC%A7%80%EA%B8%B0%EB%B0%98](https://velog.io/@leejh3224/%ED%8E%98%EC%9D%B4%EC%A7%80%EB%84%A4%EC%9D%B4%EC%85%98-%EC%BB%A4%EC%84%9C%EA%B8%B0%EB%B0%98-%ED%8E%98%EC%9D%B4%EC%A7%80%EA%B8%B0%EB%B0%98)     

[https://velog.io/@minsangk/%EC%BB%A4%EC%84%9C-%EA%B8%B0%EB%B0%98-%ED%8E%98%EC%9D%B4%EC%A7%80%EB%84%A4%EC%9D%B4%EC%85%98-Cursor-based-Pagination-%EA%B5%AC%ED%98%84%ED%95%98%EA%B8%B0](https://velog.io/@minsangk/%EC%BB%A4%EC%84%9C-%EA%B8%B0%EB%B0%98-%ED%8E%98%EC%9D%B4%EC%A7%80%EB%84%A4%EC%9D%B4%EC%85%98-Cursor-based-Pagination-%EA%B5%AC%ED%98%84%ED%95%98%EA%B8%B0)   

[https://ksshlee.github.io/spring/spring%20boot/backend/pagination/](https://ksshlee.github.io/spring/spring%20boot/backend/pagination/)     

{% highlight ruby linenos %}


{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

