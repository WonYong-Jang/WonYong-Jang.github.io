---
layout: post
title: "[Scala] 컬렉션 API"
subtitle: "Traversable, Seq, List, map, flatMap, takeWhile, take ,groupBy"    
comments: true
categories : Scala
date: 2021-04-23
background: '/img/posts/mac.png'
---

## 스칼라 컬렉션 API    

스칼라 컬렉션은 변경 불가능한 것과 변경 가능한 것으로 구분한다.   

- scala.collection.immutable : 변경 불가능

### 가변적인 클래스    

불변의 타입을 가진 컬렉션은 요소를 추가, 변경, 삭제가 불가능하지만 
가변적인 컬렉션을 사용하여 처리할 수 있다.   

불변 타입의 컬렉션과 대응되는 가변 컬렉션은 아래와 같다.   


<img width="522" alt="스크린샷 2021-04-23 오후 11 48 30" src="https://user-images.githubusercontent.com/26623547/115888985-7dee1b80-a48e-11eb-80b6-4455fad7a20e.png">   

`가변 컬렉션을 생성할때는 풀패키지명을 포함해서 생성해야 하며 
필요시에 다시 불변의 리스트로 전환할 수 있다.`      

```scala   
val list: mutable.Buffer[Int] = collection.mutable.Buffer(1)
list.append(2)
list += 3   // ArrayBuffer(1, 2, 3)   

val immutableList: Seq[Int] = list.toList // 불변 List로 변환    
```




- - - 


#### map   

```scala 
val a = List(1,2,3)
a.map(_ + 1) // List(2,3,4)
```

#### flatMap   

```scala 
val words = List("the", "quick")    
words.map(_.toList)  // List(List(t, h, e), List(q, u, i, c, k))   

words.flatMap(_.toList) // List(t, h, e, q, u, i, c, k)   
```

```scala
val fruits = Seq("apple", "banana")
fruits.flatMap(_.toUpperCase) // List(A, P, P, L, E, B, A, N, A, N, A)   
```

`map과 flatMap의 차이 중에 아래 내용은 중요하니 잘 확인하자.`   
`map은 타입을 감싼 타입을 그대로 내보내기 때문에 None도 내보내지만, 
    flatMap은 감싼 타입을 벗겨내기 때문에 None은 없어진다.`   

```scala  
def toInt(s: String): Option[Int] = {
    try {
      Some(Integer.parseInt(s.trim))
    } catch {
      case e: Exception => None
    }
  }
```

```scala   
scala> val strings = Seq("1", "2", "foo", "3", "bar")
strings: Seq[java.lang.String] = List(1, 2, foo, 3, bar)

scala> strings.map(toInt)
res0: Seq[Option[Int]] = List(Some(1), Some(2), None, Some(3), None)

scala> strings.flatMap(toInt)
res1: Seq[Int] = List(1, 2, 3)

scala> strings.flatMap(toInt).sum
res2: Int = 6
```

이 중요한 특성을 이용해서 예외처리를 하여 결과값을 연속적으로 사용하는게 가능해진다.   

이 특성을 이용하여 Map을 사용할 때도 적용 할 수 있다.   

```scala 
val scalaMap = Map(1 -> "one", 2 -> "two", 3 -> "three")
val list = (1 to scalaMap.size).map(scalaMap.get)
// Vector(Some(one), Some(two), Some(three))
```

```scala 
val scalaMap = Map(1 -> "one", 2 -> "two", 3 -> "three")
val list = (1 to scalaMap.size).flatMap(scalaMap.get)   
// Vector(one, two, three)   
```


- - - 

**Reference**    

<https://blog.baesangwoo.dev/posts/scala-learning-scala-chapter7-1/>   
<https://hamait.tistory.com/606>    

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

