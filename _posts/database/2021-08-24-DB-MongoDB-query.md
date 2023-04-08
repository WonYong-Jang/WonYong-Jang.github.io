---
layout: post
title: "[DB] MongoDB Query 명령어"
subtitle: "database, collection, document / eq, ne, in, nin, elemMatch, regex"
comments: true
categories : Database
date: 2021-08-24
background: '/img/posts/mac.png'
---

## 1. Document 조회   

Document를 조회하는 여러가지 메소드에 대해 살펴보자.   

### 1-1) find   

```
// 모든 document 조회    
$ db.tickets.find()   
$ db.tickets.find().pretty()   // 깔끔하게 document 조회     

// status가 closed인 ticket 조회   
$ db.tickets.find({"status": "closed"})   
```

#### 1-1-1) Comparison   

위의 쿼리는 가장 기본적인 쿼리이며, 아래 그림처럼 비교 연산자를 
이용하여 조회를 해보자.   
더 자세한 내용은 [공식문서](https://www.mongodb.com/docs/v3.2/reference/operator/query/)를 
살펴보자.   

<img width="700" alt="스크린샷 2022-12-25 오후 9 03 39" src="https://user-images.githubusercontent.com/26623547/209467236-1f7134d0-524f-4979-a31d-180730cabcac.png">   

```
// ticketUpdatedAt이 2021-01-01 보다 크며 2021-01-10 보다 작은 document 조회(UTC 기준) 
db.tickets.find({"ticketUpdatedAt": {"$gt": ISODate("2021-01-01T00:00:00.000Z") ,"$lt": ISODate("2021-01-10T00:00:00.000Z")} })
```

```
// ticket의 status가 null이 아닌 document 조회   
db.tickets.find({"status": {"$ne": null} })

// 또는 값이 존재한다면 조회
db.tickets.find({"status": {"$exists": true} })
```

```
// 배열안에 값이 속한다면 조회 
db.tickets.find({"tags": {"$in":["111", "222"] } })
```

#### 1-1-2) Logical   

논리 연산자를 이용하여 조회하는 방법을 아래와 같이 확인해보자.   

<img width="700" alt="스크린샷 2022-12-25 오후 9 03 51" src="https://user-images.githubusercontent.com/26623547/209467697-3ab2efa6-f07c-49e6-8a47-9b7fb2d928ff.png">   

```
// ticket의 status가 closed이거나 solved인 document 조회  
db.tickets.find({"$or": [{"status": "closed"}, {"status": "solved"}] })
```

```
// ticket의 status가 closed이고, requesterId가 null이 아닌 document 조회   
db.tickets.find({"$and": [{"status": "closed"} , {"$ne": {"requesterId": null} }] })     

// 이렇게도 가능하다.  
db.tickets.find({"status":"closed", "requesterId":{"$ne": null} })
```

#### 1-1-3) Array   

`$elemMatch 연산자는 Embedded Documents 배열을 쿼리할때 사용된다.`    

```
// commnets 배열 중 id가 1인 document 조회   
db.tickets.find({"comments":{"$elemMatch": {"commentId": 1}} })
```

아래와 같이 `$all 연산자`를 이용하여 쿼리값을 만족하는 document를 찾을 수 있다.   

```
// ticket의 tags 배열에 모두 포함된 document 조회(and 조건)   
db.tickets.find({"tags": {"$all": ["111", "222"] } })
```

`$in 연산자는 아래와 같이 사용 가능하다.`   

```
// ticket의 tags 배열 속 값이 하나라도 속한 document 조회(or 조건)
db.tickets.find({"tags": {"$in": ["111", "222"] } })
```

또한, 아래와 같이도 배열을 조회할 수 있다.   

```
// userFields 배열중에 key값과 value값에 만족하는 document 조회
db.users.find({"userFields.key": "customer"}, {"userFields.value": "111"})   
```

`배열의 사이즈는 아래와 같이 구할 수 있다.`   

```
db.tickets.find({"tags": {"$size": 0}})
```


#### 1-1-4) Evaluation   

정규식 연산자를 통하여 document를 조회할 수 있다.   

```
{ <field>: { $regex: /pattern/, $options: '<options>' } }
{ <field>: { $regex: 'pattern', $options: '<options>' } }
{ <field>: { $regex: /pattern/<options> } }
{ <field>: /pattern/<options> }
```

<img width="700" alt="스크린샷 2022-12-27 오전 1 05 57" src="https://user-images.githubusercontent.com/26623547/209566263-f14f64af-5fa0-402a-a7f0-bb94cc1120bd.png">    

```
// description에 hello가 포함된 document가 조회  
db.tickets.find({"description": {"$regex": /hello/} })

// $regex를 작성하지 않고 바로 정규식을 쓸수도 있다.   
db.tickets.find({"description": /hello/})
```

#### 1-1-5) projection   

find() 메소드의 두번째 parameter인 projection에 대해 살펴보자.   
`projection이란 쿼리의 결과값에서 보여질 field를 정하는 것이다.`   

```
db.tickets.find({}, {"_id": true, "status": true, "ticketUpdatedAt": true})
```

- - -   

**Reference**

<https://velopert.com/479>    

{% highlight ruby linenos %}


{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

