---
layout: post
title: "[Java] Stream groupingBy Collector"
subtitle: "groupingBy를 이용한 다양한 예제"   
comments: true
categories : Java
date: 2021-02-06
background: '/img/posts/mac.png'
---

# Steam GroupingBy Collectors   

Stream의 groupingBy 콜렉터를 이용한 여러가지 예제를 살펴보자. 
여기서 다루는 내용을 이해하려면 Java 8 기능에 대한 기본 지식이 필요하다. 
[Java 8 Stream 소개](https://www.baeldung.com/java-8-streams-introduction) 및 
[Java 8 Collectors 안내서](https://www.baeldung.com/java-8-collectors)를 
살펴 볼 수 있다.   

- - - 

## 코드 설정 예   

groupingBy() 여러 예제를 위해 아래와 같이 클래스를 정의한다.   

```java
public class BlogPost {
    String title; 
    String author;
    BlogPostType type; // Blog 타입 
    int likes; // 좋아요 수 
    Tag tag;  // 태그 
}
```

```java
enum BlogPostType {
    NEWS,
    REVIEW,
    GUIDE
}
```

BlogPostType과 author 조합으로 그룹화 하는데 사용될 Tuple 클래스도 정의 한다.   

```java
class Tuple {
    BlogPostType type;
    String author;
}
```   

그룹화를 응용하기 위해 Tag 클래스도 생성 했다.   

```java
public class Tag {

    String id;
    int count;
    int total;
}
```

#### 단일 열로 간단한 그룹화   

게시물 목록에서 BlogPostType 기준으로 그룹화하려면 
아래와 같이 가능하다. 같은 Type이라면 같은 그룹으로 묶인다.   

```java
Map<BlogPostType, List<BlogPost>> collect = 
                list.stream().collect(groupingBy(BlogPost::getType));
```

#### 리턴 된 맵 값 유형 수정   

위의 예제와는 동일하지만 리턴된 맵의 값 유형을 수정이 가능하다. 

```java
Map<BlogPostType, Set<BlogPost>> collect = 
                list.stream().collect(groupingBy(BlogPost::getType, toSet()));
```

#### 여러 필드로 그룹화   

SQL과 마찬가지로 여러 필드 기준으로 그룹화가 가능하다.   
아래 예제와 같이 author 와 type 기준으로 그룹화 한다면
첫 번째 그룹화인 author 기준으로 그룹화한 결과값으로 
type으로 한번더 그룹화 한다.   

```
select author, type
from table
group by author, type;
```

```java
Map<String, Map<BlogPostType, List<BlogPost>>> collect = list.stream()
                .collect(groupingBy(BlogPost::getAuthor, groupingBy(BlogPost::getType)));
```

#### 그룹화 된 결과에서 평균 얻기     

type을 기준으로 그룹화 할때 포스터에 있는 like 갯수의 평균을 알고싶다면
 아래와 같이 사용 가능하다.   

```java
Map<BlogPostType, Double> collect = list.stream()
                .collect(groupingBy(BlogPost::getType, averagingInt(BlogPost::getLikes)));
```

#### 그룹화 된 결과에서 합계 얻기   

위와 동일하되 그룹별 like 갯수 총 합을 계산하려면 아래와 같이 사용 가능하다.   

```java
Map<BlogPostType, Integer> collect = list.stream()
                .collect(groupingBy(BlogPost::getType, summingInt(BlogPost::getLikes)));
```

#### 그룹화 된 결과에서 최대 또는 최소 얻기   

type 기준으로 그룹화 하되, 최대 like 수를 가진 BlogPost를 얻기 위해서는 
아래와 같이 가능하다.   

```java
Map<BlogPostType, Optional<BlogPost>> collect = list.stream()
                .collect(groupingBy(BlogPost::getType, maxBy(Comparator.comparingInt(BlogPost::getLikes))));
```

마찬가지로 minBy 를 이용하여 최소값을 얻을 수도 있다.    

#### 그룹화 결과 다른 객체로 리턴   

아래 예시는 author로 그룹화를 진행하고 mapping을 이용하여 원하는 Map의 값을 
리턴하게 한다.     

```java
Map<String, List<Tag>> collect = list.stream()
                .collect(groupingBy(BlogPost::getAuthor, mapping(BlogPost::getTag, toList())));
```


- - - 

**Reference**    

<https://futurecreator.github.io/2018/08/26/java-8-streams/>   
<https://recordsoflife.tistory.com/55>   


{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

