---
layout: post
title: "[DB] MongoDB Index 설계 전략"
subtitle: "인덱스 설계와 성능 향상 방법 / 쿼리 상태 점검(currentOp) 및 종료(killOp)"
comments: true
categories : Database
date: 2021-04-06
background: '/img/posts/mac.png'
---

## Index는 왜 중요한가    

인터넷에는 셀 수 없이 많은 정보들이 있다. 하지만, 우리가 구글에서 원하는 정보를 찾을 때는 
어떤가? 검색어 몇 번 입력하면 꽤 높은 확률로 필요한 정보를 빠르게 얻을 수 있다.    
무엇이 이를 가능하게 하는 걸까?   

인터넷이 없던 시절로 잠깐 돌아가 보면 책에서 원하는 정보를 빠르게 얻기 위해서는 
맨 뒷 장을 펼쳐보면 ㄱㄴㄷ 순의 단어들이 나열되어 있는 '색인'이 있다.   
인터넷 검색보다는 한참 느리지만, 수백장의 페이지에서 원하는 정보를 빠르게 
얻어 내기에는 꽤 빠른 검색 방법이었다.   

`우리말로 색인은 영어로 index이다.` 데이터베이스의 인덱스는 그저 원하는 
정보를 빨리 찾을 수 있도록 돕는 색인의 역할을 한다. 책의 색인에서 ㄱㄴㄷ를 
따라 검색을 했듯이 인덱스도 순서가 있는 무언가로 정렬되어 있다.    
작은 숫자에서 큰 숫자로, 혹은 알파벳 순서대로, 정방향으로, 역방향으로 말이다.   

그렇다면 인덱스가 없는 데이터베이스를 상상해 보자. 정렬되지 않은 채 
마구잡이로 작성된, 색인마저 없는 책은 어떨까?   
우리가 할 수 있는 일은 원하는 단어를 찾을 때까지 첫 장부터 한 단어씩 
찾는 것이다. 만약 맨 마지막 페이지에 찾고자 하는 단어가 있다면 얼마나 
오랫동안 찾고 있어야 할까?   

MongoDB의 인덱스를 잘 작성하는 법을 이야기하기 전에 꼭 기억해야 할 것이 있다. 
그것은 바로 항상 상상하라는 것이다. 내가 가진 수많은 데이터를 효과적으로 
검색하려면 어떤 키들을 어떤 순서로 정렬해두어야 할지를 언제나 고민해야 한다.    

- - - 

## 기본 전략    

영어 단어장을 만들고 있다고 가정해보자. 나중에 찾고자 하는 영단어를 
쉽게 검색하기 위해 색인을 만들어야 한다. 고민 끝에 '동사'와 '명사'로 
나누어 색인을 만들기로 했다. 총 1,000자의 단어 중 동사가 300자, 명사가 700자 였다.   
'teacher'를 검색하기 위해 700자의 명사를 처음부터 하나씩 찾기 시작한다.   

무엇이 문제일까? 색인이 너무 큰 범위로 만들어졌다. 이를 데이터베이스 용어로 
'Selectivity'가 떨어진다고 이야기한다. 효과적인 인덱스 작성 전략을 위해 
'반드시 고려해야 하는 것이 바로 이 'Selectivity'를 높이는 것이다. 보다 
정확하게 검색 할 수 있도록 좁은 범위를 갖는 색인을 만들어야 한다.`      

`또한, '읽기'와 '쓰기'(CUD) 중 어떤 작업을 주로 하는 가도 잘 파악해야 한다.`       
내가 만든 단어장은 아직 미완성이어서 계속 새로운 단어를 추가하고 있다.   
이미 색인을 만들어두었기 때문에 매번 알파벳 순서로 추가 할 위치를 찾고 
그 사이에 새로운 단어를 추가하는 작업을 해야 한다.    
따라서 쓰기 작업이 읽기 작업에 비해 많은 데이터베이스는 인덱스를 복잡하게 
설정하면 오히려 나쁜 성능을 내는 경우가 있다.   

`마지막으로 사용 할 수 있는 메모리 크기를 고려해야 한다. 인덱스는 실제 데이터와 
별개의 메모리 공간에 저장을 하게 된다.` 따라서 인덱스를 많이 만들다 보면 
그만큼 많은 메모리를 사용하게 된다. 데이터베이스가 정상적으로 동작하기 
위해서는 그 외에도 작업 셋(working set)이라는 데이터 구조도 메모리를 점유하게 
된다. 따라서 메모리가 부족하여 문제가 발생하지 않도록 항상 주의를 
기울여야 한다.   

또한, MongoDD는 내부적으로 B-Tree(Balanced Tree) 알고리즘을 이용하여 인덱스를 구성한다. 

정리를 해보면 아래와 같다.   

- `가급적 촘촘하게 인덱스를 작성해서 selectivity를 높여야 한다.`   
- `쓰기 작업(CUD)이 많은 데이터셋은 인덱스를 복잡하게 설계하지 않는다.`   
- `메모리를 충분히 확보하고 항상 관찰해야 한다.`   


- - - 

## 그보다 중요한 건 테스트이다.   

기본 전략을 숙지하면 보다 나은 방식으로 작성 할 수 있지만, 항상 원하는대로 
동작하는 것은 아니다. 이후에 설명하겠지만, 인덱스에는 여러 종류가 있고 
각각의 상황에 적합한 것들이 있다.    
MongoDB는 쿼리를 수행 할 때 어떤 방식으로 검색을 할 지 스스로 계획을 세우고, 
    옳은 방식으로 인덱스를 활용한다. 그러므로 적합하지 않은 인덱스가 
    지정되었을 때는 스스로 그것을 사용하지 않기도 한다.    
이와 같은 불필요한 인덱스는 제거를 해주어야 한다.   

이를 위해 MongoDB는 현재 수행 중인 쿼리가 어떤 계획을 세우는지, 어떤 인덱스를 
사용하는지, 얼마나 오랜 시간 검색을 수행하는지 등을 보여주는 방법들을 제공한다.   
좋은 인덱스 전략을 세우는 가장 중요한 요소는 반복적인 테스트이다.   
데이터베이스를 조회하는 여러 쿼리들이 어떤 인덱스를 사용 할 때 가장 좋은 
효과를 내는지 테스트를 통해서 가장 정확하게 알아낼 수 있다.   

`인덱스 검사를 위해 주로 사용하는 메서드는 hint()와 explain()이 있다.`   
이런 메서드를 이용해서 최적의 인덱스 전략을 세우는 방법은 뒤에 다시 
설명하겠다.   

- - - 

## Single-Key Index (단일 인덱스)

`쿼리에서 단 하나의 key만을 이용한다면 단일 키 인덱스를 사용해야 한다.`   

```ruby
db.products.createIndex({ category: 1 })
```

생성한 인덱스를 확인하기 위해서 아래와 같이 조회 할 수 있다.    

```ruby
db.products.getIndexes() // 인덱스 확인

db.products.totalIndexSize() // 인덱스 사이즈 확인 
```

카테고리 필드를 키로 인덱스를 만든다. `여기서 1은 오름차순, -1은 내림차순을 의미한다.`     
카테고리 별로 오름차순이 되어 있기 때문에 색인 처럼 빠르게 원하는 
카테고리를 찾아 낼 수 있고, 정렬이 되어 있기 때문에 
범위로 검색하는 것도 수월 하다.   

일렬로 나열되어 있기 때문에 찾는 순서는 중요하지 않다. 왼쪽에서 오른쪽으로 읽든, 
    오른쪽에서 왼쪽으로 읽든 어차피 동일하기 때문이다. 즉, 단일 인덱스에서 
    오름차순으로 정의 된 인덱스의 컬렉션을 내림차순으로 검색해도 동일한 성능을 낸다.  

> 하나의 쿼리에서 단일 인덱스를 두 개 사용하면, 쿼리 옵티마이저가 그 중 
제일 효율적인 인덱스를 선택한다. 하지만 그 결과가 항상 최선인 것은 아니다.    



- - - 

## Compound Index (복합 인덱스)

복합 인덱스(Compund Index)는 검색어에 여러 키가 사용된다면 이 인덱스 타입으로 
정의해야 한다.   

```ruby
db.students.createIndex({ userid: 1, score: -1 })
```   

`컴파운드 인덱스가 여러 키를 지정 할 수 있다고 해서 각각 다른 쿼리에 각각의 키로 
검색 할 수 있다고 생각하면 안된다.`         
컴파운드 인덱스를 제대로 이해하기 위해서는 이 부분을 주의 깊게 살피고 이해해야 
한다. 위의 쿼리에서 학생 컬렉션의 인덱스로 userid와 score가 별개의 데이터 
구조를 가지고 있는 것은 아니다. 마치 단일 인덱스처럼 일렬로 
나열 된 userid 배열에서 각 아이템에 score를 담고 있는 것으로 생각 할 수 있다.   

<img width="730" alt="스크린샷 2021-04-06 오후 10 27 08" src="https://user-images.githubusercontent.com/26623547/113718357-853fc600-9727-11eb-9930-28644855d1f1.png">

이 그림에서처럼 두 인덱스가 함께 저장되어 있으며, 첫번째 userid는 원하는 대로 
오름차순의 순서대로 예쁘게 정렬되어 있지만 score는 그렇지 않다.   
하지만 자세히 들여다보면 `동일한 userid들끼리는 그 안에서 score가 내림 차순으로 
다시 정렬되어 있는 것을 볼 수 있다.`       

상상해보자. 키로 score를 지정해서 검색을 하면 좋은 효과를 볼 수 있을까?   
`그림처럼 score는 동일한 userid 안에서만 정렬이 되어 있으므로 단독으로 검색을 할 때에는 
효율이 좋을 수가 없다.` 그런 경우에는 score를 위한 인덱스를 따로 만들어주는 것이 
성능에 이점이 있다.   

`컴파운드 인덱스의 핵심은 여기에 있다. 컴파운드 인덱스로 지정한 각각의 필드는 
그 순서대로 쿼리문에 나타나야 한다. userid 만을 이용해서 검색하는 것은 
옳은 방법이다. 그리고 userid와 함께 score를 조합해서 검색하는 것도 옳은 
방법이다. 하지만 score만 단독으로 검색하는 것은 옳지 않은 방법이다.`       

- - - 

## 정렬도 인덱스 순서가 중요하다.   

`쿼리를 할 때의 순서와 마찬가지로 정렬을 할 때에도 순서는 중요하다.`   
만약 {a : 1, b : 1} 의 형태로 정의된 인덱스가 있다면 
검색을 할 때에도 그 순서가 지켜져야 한다.    

```ruby
db.collection.createIndex({ a: 1, b: 1 })

// 성능이 좋습니다
db.collection.find().sort({ a: 1, b: 1 })
// 성능이 좋지 않습니다
db.collection.find().sort({ b: 1, a: 1 })
```

한편 오름차순 1과 내림차순 -1의 정렬 순서도 세심하게 설정해야 한다.    

```ruby
db.collection.createIndex({ a: 1, b: -1 })

// 성능이 좋습니다
db.collection.find().sort({ a: 1, b: -1 })
db.collection.find().sort({ a: -1, b: 1 })
// 성능이 좋지 않습니다
db.collection.find().sort({ a: 1, b: 1 })
db.collection.find().sort({ a: -1, b: -1 })
```

위의 차이도 상상을 하며 이해하면 좋다. 단일 인덱스가 오름차순, 내림차순의 
구분 없이 좋은 인덱스 효과를 낼 수 있었던 것은 일렬로 나열된 데이터 구조 
덕분이었다. 마찬가지로 컴파운드 인덱스 역시 구성하는 키들의 방향은 서로 
다르더라도 데이터 구조는 일렬로 나열되어 있다. 따라서 각 키의 방향 조합만 
제대로 유지해주면 단 한번의 스캔으로 검색이 가능하기 때문에 
인덱스의 효과를 누릴 수가 있다.   

- - - 

## 인덱스 Prefix   

MongoDB의 인덱스 관련 메뉴얼을 읽다 보면 자주 나오는 용어 중에 Index Prefix'라는 
말이 있다. 영어와 한글의 차이로 인해 바로 와닿지 않는 용어들이 종종 있는데 
바로 이런 용어야 말로 그렇다.    
어떻게 번역해야 이 개념을 잘 설명할 수 있을까? 선행 인덱스? 앞쪽 인덱스? 일단 
아래 예제 코드로 살펴보자.   

```ruby
db.collection.createIndex({ x: 1, y: 1, z: 1 })

{ x: 1 } // OK
{ x: 1, y: 1 } // OK
{ x: 1, y: 1, z: 1 } // OK
```

`정의 된 인덱스의 앞 쪽부터 포함하는 부분집합의 인덱스들을 인덱스 Prefix라고 말한다.`   
다시 한번 상상을 해보자. 위의 살펴본 컴파운드 인덱스 그림을 다시 보면, 
    첫 번째 인덱스는 단일 인덱스처럼 일렬로 나열되어 있다. 두 번째 인덱스는 
    동일한 첫 번째 인덱스들 안에서 일렬로 나열되어 있다. 세 번째 인덱스는 
    동일한 두 번째 인덱스들 안에서 일렬로 나열되어 있다.   
    첫 번째 인덱스부터 순서대로 그룹지어진 전체 인덱스의 부분 집합은 이런 구조로 인해 
    인덱스의 성능을 최대로 발휘 할 수 있게 된다.    
    바로 이런 인덱스들을 인덱스 Prefix라고 한다.    

<img width="789" alt="스크린샷 2021-04-06 오후 10 41 07" src="https://user-images.githubusercontent.com/26623547/113720550-bde09f00-9729-11eb-9c48-e72df12c4765.png">   

이렇게 쿼리의 정렬 조건에는 인덱스 Prefix를 사용해야 한다.   

- - - 

## 정렬 조건이 prefix가 아니라면?   

그렇다면 prefix가 아닌 정렬 조건이 사용 될 수 있을까?   
가능은하지만, 단 한가지 조건이 충족되어야 한다.    
`정렬 조건이 prefix가 아닌 경우 검색 조건이 Equality 상태여야 한다.`   
또, 애매한 단어가 나왔지만 이것 역시 이해하기 어렵지 않다.   

쿼리의 검색조건과 정렬 조건을 하나의 인덱스 Prefix처럼 일렬로 나열해보자. 
이 상황에서 검색 조건의 키들은 특정값과 = 상태여야 한다. 동일 비교가 아닌 
다른 비교 상태라면 이 조건을 만족하지 못한다.   

아래는 인덱스를 올바르게 사용하는 예제들이다.   

<img width="768" alt="스크린샷 2021-04-06 오후 10 52 22" src="https://user-images.githubusercontent.com/26623547/113721778-c84f6880-972a-11eb-9d34-a16d0813b542.png">

반면, 아래 쿼리들은 검색 조건이 Index Prefix도 아니고, equality 상태 역시 
만족하지 못하기 때문에 인덱스가 효과적으로 적용되지 않는다.   

<img width="766" alt="스크린샷 2021-04-06 오후 10 52 26" src="https://user-images.githubusercontent.com/26623547/113721791-cab1c280-972a-11eb-9122-f083fb390df1.png">

- - - 

## 인덱스 교차(Intersection)   

`마지막으로 소개할 인덱스는 MongoDB 2.6부터 제공하는 인덱스 교차이다.`    
`이 용어는 인덱스의 종류가 아니라 인덱스의 작동 방식을 지칭한다.`   

지금까지 알아본 '단일 인덱스'와 '컴파운드 인덱스'를 하나의 컬렉션 내에서 
별개로 지정하더라도 쿼리가 구동 될 때에는 내부에서 교집합처럼 동작하여 
성능을 높힌다.   

```ruby
{ qty: 1 }
{ item: 1 }
```

단일 인덱스가 별개로 두 개를 정의했지만,    

```ruby
db.orders.find({ item: 'abc123', qty: { $gt: 15 }})
```

`위의 쿼리는 인덱스 교차가 적용되어 인덱스가 활용된다. 다만, 인덱스 교차는 
명시적으로 선언해서 사용하는 것이 아니기 때문에 반드시 정상 동작하는지를 
explain()메서드를 통해 확인해야 한다.`   

> 만약 인덱스 교차가 동작하고 있다면 결과 문서에 AND_SORTED나 AND_HASH 스테이지가 
발견 될 것이다.   

그럼 컴파운드 인덱스와 인덱스 교차, 둘 중 무엇을 써야 할까? 각각의 
방식에는 조건과 한계가 존재 한다.   

`컴파운드 인덱스는 지금까지 살펴보았듯이 정렬을 할 때 선언하는 키의 순서와 
각 키의 정렬 방향이 중요하다. 또한, 정렬 순서는 
인덱스 Prefix 규칙을 따라야 한다.`      

`반면 인덱스 교차는 그런 문제에서 자유롭다. 하지만, 쿼리의 검색 조건에 
사용한 인덱스와 별개로 선언된 인덱스를 정렬 조건으로 사용 할 수 없다. 그리고 
대체로 컴파운드 인덱스에 비해 성능이 느리다.`   

다음과 같이 단일 인덱스들과 컴파운드 인덱스가 따로 정의되어 있는 예제를 보자.

```ruby
{ qty: 1 }
{ status: 1, ord_date: -1 }
{ status: 1 }
{ ord_date: -1 }
```

이 상황에서 아래의 쿼리는 인덱스 교차가 불가능 하다.   

```ruby
db.orders.find({ qty: { $gt: 10 }}).sort({ status: 1 })
```

`그 이유는 검색 조건의 qty는 정렬조건의 status와 별개의 인덱스로 작성되었기 때문이다.`   
하지만 아래의 쿼리는 컴파운드 인덱스와 교차되어 정상 동작한다.   

```ruby   
db.orders.find({ qty: { $gt: 10 }, status: "A" }).sort({ ord_date: -1 })
```

또 다른 예제를 살펴보자.   

```ruby
db.orders.createIndex({ status: 1, ord_date: -1 })
```

위와 같이 컴파운드 인덱스가 정의 되어 있을 때, 다음 쿼리는 인덱스의 효과를 
누릴 수가 있다.   

```ruby
db.orders.find({ status: { $in: ["A", "P" ] }})
db.orders.find(
   {
     ord_date: { $gt: new Date("2014-02-01") },
     status: { $in:[ "P", "A" ] }
   }
)
```

하지만 아래의 쿼리는 선행 인덱스가 정의되어야 한다는 규칙에 위배되기 
때문에 인덱스가 동작하지 않는다.   

```ruby
db.orders.find({ ord_date: { $gt: new Date("2014-02-01") }})
db.orders.find({}).sort({ ord_date: 1 })
```

그러나 만약 인덱스가 아래와 같이 정의되어 있다면, 인덱스 교차가 발동되어 
모든 쿼리가 인덱스의 효과를 얻어 성능이 향샹된다.   

```ruby 
{ status: 1 }
{ ord_date: -1 }
```

- - - 

## 쿼리 상태 점검 

인덱스를 생성 하고 쿼리를 통해 성능 향상이 있는지 확인해 볼 때 
쿼리를 실행했는데도 도무지 끝날 생각을 안할 때가 있다.    
이 때, MongoDB 내부에서는 어떤 작업을 하고 있는지 알아 보자.   

더 자세한 내용은 [공식문서](https://docs.mongodb.com/manual/reference/method/db.currentOp/) 를 참고하자.   

쿼리를 실행 후 다른 창을 하나 더 띄워서 아래와 같이 입력해보자.   

```ruby   
db.currentOp()
```

결과는 아래와 같고 분석에 중요한 키만 살펴보자.   

- opid : operation ID    
- active : menas the query is 'in progress' state.   
- secs_running : query's duration, in seconds.   
- ns : a collection name against you perform the query.   
- query : the query body.   


```
{
"inprog" : [
{
    "desc" : "conn8003244",
    "threadId" : "0x5e7e56c0",
    "connectionId" : 8003244,
    "opid" : 891016392,
    "active" : true,
    "secs_running" : 3,
    "microsecs_running" : NumberLong(3575970),
    "op" : "query",
    "ns" : "quickblox_production.custom_data",
    "query" : {
        "$query" : {
            "start" : {
                "$lte" : ISODate("2017-11-15T13:57:55Z")
             },
            "application_id" : 53894,
            "class_name" : "Broadcast"
        },
        "$orderby" : {
            "start" : -1
        }
    },
    "planSummary": ...,
    "client" : "10.0.0.87:46290",
    "numYields" : 5601,
    "locks" : ...,
    "waitingForLock" : false,
    "lockStats" : ...
    }
  ]
}
```

또는, 아래와 같이 쿼리를 줄 수 있고 3초 이상 나온 것을 찾는 예제이다.   


```ruby
db.currentOp({“secs_running”: {$gte: 3}})
```

위의 opid를 이용하여 실행중인 operation을 종료 시킬 수 있다.

```ruby  
db.killOp(<opid of the query to kill>)   
```




- - - 

## 인덱스 성능 향상시키기   

앞서 최고의 인덱스 전략은 반복 테스트라고 말했다. 이론적으로 타당하더라도 실제로 
포함하고 있는 데이터들의 성격으로 인해, 인덱스는 바르게 사용되기도 하고 
문제를 일으키기도 한다. 자신의 설계가 맞는지 여부를 지속적으로 
점검하고 개선해야 한다.   

### $indexStats   

`인덱스의 사용 통계를 살펴보기 위해서 다음과 같은 쿼리를 던질 수 있다.`   

```ruby
db.orders.createIndex({ item: 1, quantity: 1 })
db.orders.createIndex({ type: 1, item: 1 })

db.orders.find({ type: "apparel"})
db.orders.find({ item: "abc" }).sort({ quantity: 1 })

db.orders.aggregate([{ $indexStats: {} }])
```

이에 대한 결과 문서는 아래와 같다.   

```ruby   
{
   "name" : "item_1_quantity_1",
   "key" : {
      "item" : 1,
      "quantity" : 1
   },
   "host" : "examplehost.local:27017",
   "accesses" : {
      "ops" : NumberLong(1),
      "since" : ISODate("2015-10-02T14:31:53.685Z")
   }
}
{
   "name" : "_id_",
   "key" : {
      "_id" : 1
   },
   "host" : "examplehost.local:27017",
   "accesses" : {
      "ops" : NumberLong(0),
      "since" : ISODate("2015-10-02T14:31:32.479Z")
   }
}
{
   "name" : "type_1_item_1",
   "key" : {
      "type" : 1,
      "item" : 1
   },
   "host" : "examplehost.local:27017",
   "accesses" : {
      "ops" : NumberLong(1),
      "since" : ISODate("2015-10-02T14:31:58.321Z")
   }
}
```

`id 키의 ops는 0이므로 전혀 사용되지 않았다. 하지만 item_1_quantity_1 키와 
type_1_item_1 키의 컴파운드 인덱스는 1번씩 사용된 것을 볼 수 있다.`   

### explain()   

이번에는 특정 쿼리가 어떻게 수행되는지 알아보자. explain() 메서드는 단어 뜻 그대로 
쿼리의 수행 내역을 설명해준다. 이 때 어떤 모드로 수행 할 것인지를 인자로 입력 할 수 있다.   

- executionStats 모드   

    - 인덱스 사용 여부 
    - 스캔한 문서들의 수 
    - 쿼리의 수행 시간    

- allPlansExecution 모드 

    - 쿼리 계획을 선택하는데 필요한 부분적인 실행 통계   
    - 쿼리 계획을 선택하게 된 이유   


`간단하게 인덱스 생성 전과 생성 후 쿼리의 시간을 확인하기 위해서는 
아래와 같이 확인 가능하다.`   

로컬에서 확인해볼때 764밀리 초로 0.764초 정도 나왔다.   

```ruby
db.product.find({score:"23"}).explain("executionStats").executionStats.executionTimeMillis   
// 764
```

아래와 같이 score에 대한 인덱스를 생성 한다.   

```ruby
db.product.createIndex({score:1})   
```

인덱스 생성 후, 실행 속도를 확인해보면 0이라는 값이 나왔다. 실습을 통해 인덱스로 
매우 빠른 검색이 가능하다는 것을 알 수 있다.   

```ruby
db.product.find({score:"56"}).explain("executionStats").executionStats.executionTimeMillis   
// 0
```

explain()에 대해 자세한 내용은 아래와 같다.

```ruby 
{
	"queryPlanner" : {
		"plannerVersion" : 1,
		"namespace" : "test.mycollection",
		"indexFilterSet" : false,
		"parsedQuery" : {

		},
		"winningPlan" : {
			"stage" : "COLLSCAN",
			"direction" : "forward"
		},
		"rejectedPlans" : [ ]
	},
	"executionStats" : {
		"executionSuccess" : true,
		"nReturned" : 2,
		"executionTimeMillis" : 4,
		"totalKeysExamined" : 0,
		"totalDocsExamined" : 2,
		"executionStages" : {
			"stage" : "COLLSCAN",
			"nReturned" : 2,
			"executionTimeMillisEstimate" : 0,
			"works" : 4,
			"advanced" : 2,
			"needTime" : 1,
			"needYield" : 0,
			"saveState" : 0,
			"restoreState" : 0,
			"isEOF" : 1,
			"invalidates" : 0,
			"direction" : "forward",
			"docsExamined" : 2
		}
	},
	"serverInfo" : {
		"host" : "Reidui-MacBookPro.local",
		"port" : 27017,
		"version" : "4.0.4",
		"gitVersion" : "f288a3bdf201007f3693c58e140056adf8b04839"
	},
	"ok" : 1
}
```

explain() 메서드가 반환하는 문서의 내용은 꽤 복잡하다. 확실하게 이해하기 위해서는 
MongoDB의 [공식문서](https://docs.mongodb.com/manual/reference/explain-results/) 메뉴얼을 읽어보는 것을 추천한다.      


### hint()    

작성한 쿼리의 인덱스를 테스트 하니 크게 효과가 없어 보인다면 어떻게 해야 할까?   
`다른 필드에 인덱스를 걸어보거나 혹은 아예 인덱스를 제거해서 테스트 해보고 싶을지도 모른다.`      
`이럴 때 사용할 수 있는 메서드가 hint()이다.`   

아래 예제는 find 쿼리에 zipcode 필드를 키로 하여 인덱스를 걸고, executionStats 모드의 결과를 받아온다.   

```ruby
db.people.find(
   { name: "John Doe", zipcode: { $gt: "63000" } }
).hint({ zipcode: 1 }).explain("executionStats")
```

`만약 인덱스가 없는 상태에서의 테스트가 필요하다면 다음과 같이 $natural 옵션을 
넣어서 테스트 할 수 있다.`   

```ruby 
db.people.find(
   { name: "John Doe", zipcode: { $gt: "63000" } }
).hint({ $natural: 1 })
```

- - - 


## index 사용 시 주의점    

`1. 상황에 따라 다르지만 일반적으로 컬렉션에 2~3개 이상의 인덱스를 가지지 않는 것이 좋다.`   

위에서 말한 것처럼 인덱스가 많을 수록 쓰기 작업은 시간이 더 오래걸린다. 그 이유는 
데이터 변경 될 시 인덱스의 순서도 재구성해야 하기 때문이다.   

`2. 인덱스 구축이 완료 될때까지 데이터베이스의 모든 read/write 작업은 중단하면서 
인덱스를 구축하게 된다.`    

특히, 데이터가 먼저 삽입되고 난 후에 인덱스를 구축하게 되는 경우는 
콜렉션에 대량의 데이터가 있다면 인덱스를 생성하는데 몇시간 ~ 몇일까지도 
걸릴 수 있다.   

따라서 [backgroud 옵션](https://docs.mongodb.com/manual/reference/method/db.collection.createIndex/)을 이용하여 인덱스를 구축하면서 
다른 작업들도 가능하게 한다.   

백그라운드에서 인덱스 구축하면, 다른 읽기/쓰기 요청 시 잠시 구축을 멈춘다. 
트래픽이 최소화 되는 시간에 인덱스를 구축하면 시간을 줄일 수 있다.   

하지만 포그라운드 인덱싱보다는 작업이 더 오래 걸리며, 버전에 따라 
옵션이 Deprecated 일 수도 있으므로 확인하고 사용하도록 하자.   

```ruby
db.collection.createIndex({'idx_field': 1}, {background: true})
```



- - -   

**Reference**

<https://nangkyeong.tistory.com/entry/MongoDB-in-Action%EC%9C%BC%EB%A1%9C-%EC%A0%95%EB%A6%AC%ED%95%B4%EB%B3%B4%EB%8A%94-MongoDB%EC%9D%98-%EC%9D%B8%EB%8D%B1%EC%8A%A4-%EA%B0%9C%EB%85%90>   
<https://blog.ull.im/engineering/2019/04/05/mongodb-indexing-strategy.html>   
<https://docs.mongodb.com/manual/core/index-compound/>   

{% highlight ruby linenos %}


{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

