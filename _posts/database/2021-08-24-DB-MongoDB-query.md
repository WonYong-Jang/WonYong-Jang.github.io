---
layout: post
title: "[DB] MongoDB Query 명령어"
subtitle: "database, collection, document / eq, ne, in, nin, elemMatch"
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
db.tickets.find({"tags": {"$in":["parent_1", "parent_2"] } })
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
db.tickets.find({"status":"closed", "$ne":{"requesterId": null} })
```

#### 1-1-3) Array   

`$elemMatch 연산자는 Embedded Documents 배열을 쿼리할때 사용된다.`    

```
// commnets 배열 중 id가 1인 document 조회   
db.tickets.find({"comments":{"$elemMatch": {"commentId": 1}} })
```


#### 1-1-4) Evaluation   

아래와 같이 $where 연산자를 통하여 javascript expression을 사용할 수 있다.   

```
// comments가 비어있는 document 조회   
db.tickets.find({"$where": "this.comments.length == 0"})
```


- - -   

**Reference**

<https://velopert.com/479>    

{% highlight ruby linenos %}


{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

