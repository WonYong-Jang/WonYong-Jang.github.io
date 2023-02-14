---
layout: post
title: "[Machine Learning] Spark ML 데이터 전처리"
subtitle: "Label Encoding(StringIndexer, IndexToString) / OneHotEncoder " 
comments: true
categories : ML
date: 2023-02-15
background: '/img/posts/mac.png'
---

이번글에서는 [사이킷런에서 제공하는 데이터 전처리](https://wonyong-jang.github.io/ml/2022/09/15/Machine-Learning-Sklearn-Pre-Processing.html)와 
비교하여 Spark ML에서 제공하는 데이터 전처리 방법에 대해서 살펴보자.   

- - -

## 1. 레이블 인코딩(Label Encoding)   

`사이킷런에서 제공하는 Label Encoding은 
Spark ML에서는 StringIndexer 클래스로 제공한다.`   

아래 예시로 실습해보자.   

```scala
import spark.implicits._
val data = List((0,"a"),(1,"b"),(2,"c"), (3,"a"),(4,"b"))
val df = spark.sparkContext.parallelize(data).toDF("id", "category")
df.show()
```

Output

```
+---+--------+
| id|category|
+---+--------+
|  0|       a|
|  1|       b|
|  2|       c|
|  3|       a|
|  4|       b|
+---+--------+
```


위의 category 컬럼을 인코딩은 아래와 같이 할 수 있다.   



- - - 

## 2. 원 핫 인코딩(OneHotEncoder)   

`사이킷런에서 제공하는 원 핫 인코딩은 
Spark ML에서는 OneHotEncoder 클래스로 제공한다.`    

OneHotEncoder는 숫자형의 값만 원 핫 인코딩 할 수 있으므로 문자형을 원 핫 
인코딩하려면 먼저 숫자형으로 Label Encoding 되어 있어야 한다.    

- - -
Referrence 

<https://www.inflearn.com/course/%ED%8C%8C%EC%9D%B4%EC%8D%AC-%EB%A8%B8%EC%8B%A0%EB%9F%AC%EB%8B%9D-%EC%99%84%EB%B2%BD%EA%B0%80%EC%9D%B4%EB%93%9C/unit/25200>    

{% highlight ruby linenos %}
{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

