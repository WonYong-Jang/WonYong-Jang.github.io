---
layout: post
title: "[DB] MongoDB 커넥션"
subtitle: ""
comments: true
categories : Database
date: 2021-09-17
background: '/img/posts/mac.png'
---

## 1. MongoDB 커넥션 관리    

`MongoDB 드라이버는 커넥션 풀을 명시적으로 설정하지 않아도 커넥션 풀을 사용하고 
기본 값이 MaxPoolSize 100, MinPoolSize 0이다.`   

웹 어플리케이션에서 동시적으로 많은 트래픽이 몰리는 상황에서는 사용하지 
않는 커넥션을 계속 점유하는 문제가 발생할 수 있다.   

이 문제는 `MaxConnIdleTime`을 추가 설정함으로써 해결할 수 있다.   

```
clientOptions := options.Client().ApplyURI("mongodb://localhost:27017")
clientOptions.SetMaxPoolSize(100)
clientOptions.SetMinPoolSize(10)
clientOptions.SetMaxConnIdleTime(10 * time.Second)
```

위와 같이 설정하면 최초에는 커넥션을 10개를 생성하고 최대 100개까지 
늘어나며, `사용하지 않고 대기하고 있는 커넥션 즉 유후 커넥션은 10초가 
지나면 종료한다.`   

`여기서 주의해야 할 점은 MongoDB 드라이버의 유휴 커넥션을 종료 시키는 시점이다.   
드라이버 내부에서 유휴 시간을 지속적으로 확인하여 종료 시키는 것이 
아니라, 커넥션을 사용하는 시점(collection.InsertOne, collection.Find 등)에 
커넥션 풀의 커넥션을 꺼내 확인 후 종료시킨다는 것이다.`       

즉, 이것은 엄밀하게 커넥션이 최대 유휴 시간이 지나도 종료되지 않을 수 
있음을 의미한다.   


- - -   

**Reference**

<https://www.popit.kr/mongodb-golang-%EB%93%9C%EB%9D%BC%EC%9D%B4%EB%B2%84%EC%9D%98-%EC%BB%A8%ED%85%8D%EC%8A%A4%ED%8A%B8%EC%99%80-%EC%BB%A4%EB%84%A5%EC%85%98/>     

{% highlight ruby linenos %}


{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

