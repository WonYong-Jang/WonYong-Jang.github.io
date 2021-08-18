---
layout: post
title: "[DB] MongoDB with Spring Data Repository Query"
subtitle: "Spring data repository의 mongoDB 사용시 주의사항"
comments: true
categories : Database
date: 2021-08-17
background: '/img/posts/mac.png'
---

Spring Data Repository는 영구적인 저장소(RDBMS, NoSQL)에 데이터를 
저장, 수정, 업데이트와 같은 복잡한 코드를 개발자를 
대신해 자동 생성함으로써, 많은 개발 시간을 절약하게 해준다.    

이 포스팅에서는 MongoRepository에 대해 알아보고, @Query 어노테이션을 
사용하여 쿼리 작성 방법과 주의사항에 대해 알아 볼 예정이다.   

간략적으로 설명하면, Repository<T, ID>라는 인터페이스를 확장하는 
인터페이스를 정의(개발자가 정의하는 인터페이스)하고, 이 인터페이스를 
Spring에 설정하면 Spring이 자동으로 해당 인터페이스의 Proxy 인스턴스를 
생성한다.   
그리고 Proxy Instance는 개발자가 정의한 인터페이스를 바탕으로 
쿼리에 대한 코드가 자동생성됨으로, 개발자는 전통적인 
방법의 serviceImpl과 같은 구현 클래스를 작성할 필요가 없다.   

단지, Repository<T, ID> 인터페이스를 확장하는 인터페이스를 
정의하고 그 인터페이스에 쿼리에 필요한 메소드를 정의만 하면 된다.    

- - - 

## Using @query Annotation   

위의 설명 처럼 Repository를 확장하여 제공해주는 키워드 만으로 
쿼리를 만들다 보면 쿼리가 길어져서 가독성이 떨어지는 경우도 
있고 복잡한 쿼리의 경우 직접 쿼리를 작성하는 것이 간편한 경우도 있다.   
이러한 경우에 @query 어노테이션을 사용할 수 있으며 MongoDB Json 쿼리를 
직접 작성할 수 있다.    

기본 예제는 아래와 같다.   
`여기서 0은 첫번째 파라미터를 가르키며,
? 는 JDBC상에서 PreparedStatement에서 사용한 것과 동일하다고 생각하면 된다.`    


```java
@Query("{'name' : ?0}")
Employee findEmployeeByName(String empName);
```   

기본적으로, document의 모든 값들을 가져오지만, 만약에 결과값 중에 일부를 
무시하고 싶다면 아래와 같이 필터 옵션을 줄 수 있다.   

```java
@Query(value = "{'name' : ?0}", fields = "{'description' : 0}")
Employee findEmployeeByName(String empName);
```

쿼리에서 정렬을 추가하고 싶다면 아래와 같이 가능하다.   

```java
@Query("{salary : {$lt : ?0, $gt : ?1}}")
List findEmployeeBySalaryRangeAndSort(double maxSalary, double minSalary, Sort sort);
```

그 외에 아래는 다른 예제들이다.   

```java
@Query("{name : {$ne : ?0}}")
List findByNameNotEqual(String countryName);

@Query("{'name' : null}")
List findEmployeeByNameIsNull();

@Query("{'name' : {$ne : null}}")
List findEmployeeByNameIsNotNull();

```

- - - 


## MongoRepository Between 사용시 주의사항      

얼마전에 회사에서 JDBC를 이용하여 mysql을 사용하던 소스를 MongoDB로 마이그레이션을 
진행한 적이 있다.   
JDBC에서 between을 사용하여 두 날짜 사이의 조건을 만족하는 값들을 
가져오는 쿼리가 있었고 JPA에서 사용하는 방식과 
동일하게 MongoRepository에서도 아래와 같이 마이그레이션을 
진행 했다.    

```java
@Repository
public interface SampleRepository extends MongoRepository<Sample, Long> {
    findByCreatedAtBetween(Date from, Date to);
}    
```   

테스트 중에 기존 쿼리와 결과값이 다르게 나오는 것을 확인 했다.   
`결과적으로는 MongoRepository에서 사용하는 Between 키워드를 사용 했을 때 
두 경계값을 포함하지 않는 것(exclusive)을 확인 했다.`    

기존 SQL에서 사용하는 between은 두 경계값이 포함(inclusive)하였다.     

아래는 MongoDB [공식문서](https://docs.spring.io/spring-data/mongodb/docs/1.2.0.RELEASE/reference/html/mongo.repositories.html)에서 
query method에서 지원하는 키워드이다.   

<img width="1400" alt="스크린샷 2021-08-17 오전 8 23 29" src="https://user-images.githubusercontent.com/26623547/129641379-97e5188a-2dc6-4222-92fb-a45bc955d132.png">     

위에서 보는 것처럼 Between 키워드는 exclusive한 것을 확인 할 수 있다.   

이를 해결하기 위해 
GreaterThanEqual, LessThanEqual를 사용하여 변경할 수도 있고 @Query를 
사용하여 직접 쿼리를 작성하여 해결 할 수 있다.   


```java
@Repository
public interface SampleRepository extends MongoRepository<Sample, Long> {

    @query("{'createdAt': {'$gte': ?0, '$lte': ?1 } }")
    findByCreatedAtBetween(Date from, Date to);
}

- - -   

**Reference**

<https://www.devglan.com/spring-boot/spring-data-mongodb-queries>   
<https://docs.spring.io/spring-data/mongodb/docs/1.2.0.RELEASE/reference/html/mongo.repositories.html>    
<https://m.blog.naver.com/PostView.naver?isHttpsRedirect=true&blogId=willygwu2003&logNo=130173163977>   

{% highlight ruby linenos %}


{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

