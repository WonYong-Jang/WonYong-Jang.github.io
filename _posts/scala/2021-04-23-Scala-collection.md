---
layout: post
title: "[Scala] collection API"
subtitle: "Traversable, Seq, List, Array, Vector, map, flatMap, takeWhile, take, groupBy"    
comments: true
categories : Scala
date: 2021-04-23
background: '/img/posts/mac.png'
---

# 스칼라 컬렉션(collection) API   

스칼라 컬렉션은 배열, 리스트, 맵, 집합, 트리와 같이 주어진 타입을 가지는 하나 또는 그 이상의 
값을 수집하는 데이터 구조를 제공한다.   

스칼라 컬렉션은 변경 불가능한 것과 변경 가능한 것으로 구분한다.

- scala.collection.immutable : 변경 불가능
- scala.collection.mutable : 변경 가능

<img width="700" alt="스크린샷 2021-04-25 오후 4 07 42" src="https://user-images.githubusercontent.com/26623547/115984140-80f92100-a5e0-11eb-8a88-38f67ea02f82.png">    


<img width="700" alt="스크린샷 2021-04-25 오후 4 07 48" src="https://user-images.githubusercontent.com/26623547/115984144-835b7b00-a5e0-11eb-951b-1fcacba6155b.png">      


- - - 


## 리스트( List, Seq, Vector)            

`자바와 비교해보면, 스칼라의 Seq는 자바의 List와 비슷하고, 스칼라의 List는 
자바의 LinkedList와 비슷하다.`   

#### 1) List     

스칼라의 List는 컴파일러에 의해 매우 최적화 되어 있으며 함수형 프로그램에 기본 데이터 타입이다.    
List는 immutable 컬렉션이기 때문에 mutable한 list를 사용하기 위해서는 ListBuffer를 사용할 수 있다.   

List 사용 예제를 보면서 이해해 보자.   
List는 LinkedList와 같이 단방향으로 구성되어 있으므로, head를 이용하여 
맨 처음 값을 구해올 수 있고, tail을 통해서 첫번째 요소를 제외한 나머지 List를 
구해올 수도 있다.   

```scala 
val list = List(12, 43, 99)
println(list.head) // 12 
println(list.tail) // List(43, 99)
```

아래와 같이 각 값에 대해 계산하고 결과를 목록에 추가하는 함수를 사용하여 List를 만들 수도 있다.   

```scala   
List.tabulate(repeat_times)(evaluation_function) // syntax   
```
```scala 
// creating  Lists  
val table5 = List.tabulate(10)(i => i*5)
// List(0, 5, 10, 15, 20, 25, 30, 35, 40, 45)
```

#### 2) Seq    

Scala Seq는 길이가 정해져 있고, 각 원소의 위치를 0부터 시작하는 고정된 인덱스로 지정할 수 있는 iterable의 일종이다.    

```scala 
val seq = Seq(1, 2, 3, 4, 5, 3)
println("Seq ends with (5,3): " + seq.endsWith(Seq(5, 3))) // true
println("Seq contains 4: " + seq.contains(4))              // true
println("Start index of 3: " + seq.indexOf(3))             // 2
println("Last index of 3: " + seq.lastIndexOf(3))          // 5
println("Reversed Seq" + seq.reverse)                      // List(3, 5, 4, 3, 2, 1)  
```

#### 3) Vector    

Scala Vector는 immutable data structure이며, 내부적으로 트리로 구성되어 있어 
랜덤 엑세스에 효율적이고 많은 데이터를 다룰 때 유용하다.   


3개의 Scala Collection(Seq, List, Vector)의 [performance 비교 글](https://danielasfregola.com/2015/06/15/which-immutable-scala-collection/)을 
참고해서 상황에 따라서 적절한 collection을 사용하자.   
[Adventures with Scala Collections](https://www.47deg.com/blog/adventures-with-scala-collections/#scala-collections-overview-1)도 참고하자.   


- - - 

## 가변적인 클래스    

불변의 타입을 가진 컬렉션은 요소를 추가, 변경, 삭제가 불가능하지만 
가변적인 컬렉션을 사용하여 처리할 수 있다.   

불변 타입의 컬렉션과 대응되는 가변 컬렉션은 아래와 같다.   


<img width="522" alt="스크린샷 2021-04-23 오후 11 48 30" src="https://user-images.githubusercontent.com/26623547/115888985-7dee1b80-a48e-11eb-80b6-4455fad7a20e.png">   

##### 새로운 가변 컬렉션 생성하기   

`가변 컬렉션을 생성할때는 풀패키지명을 포함해서 생성해야 하며 
필요시에 다시 불변의 리스트로 전환할 수 있다.`      

```scala   
val list: mutable.Buffer[Int] = collection.mutable.Buffer(1)
list.append(2)
list += 3   // ArrayBuffer(1, 2, 3)   

val immutableList: List[Int] = list.toList // 불변 List로 변환    
```

##### 불변 컬렉션 -> 가변 컬렉션   

`불변 컬렉션에서 가변 컬렉션으로 변환도 가능하다.`   

```scala 
val map = Map("a" -> 1, "b" -> 2)
val bufferMap = map.toBuffer // map -> buffer
println(bufferMap) // ArrayBuffer((a,1), (b,2))

bufferMap += ("c" -> 3)
println(bufferMap) // ArrayBuffer((a,1), (b,2), (c,3))

val map2 = bufferMap.toMap // buffer -> map
```

##### 컬렉션 빌더 사용하기   

Builder를 사용하면 추가(append) 연산만 가능하게 된다. 필요한 요소를 
추가한 후 result() 메서드를 호출하면 이를 최종 컬렉션 타입으로 반환해 준다.   

```scala   
val builder = collection.mutable.Seq.newBuilder[Int]
builder += 1
builder += 2
val result: mutable.Seq[Int] = builder.result()
```

### Array와 ArrayBuffer   

Array와 ArrayBuffer는 둘다 mutable 이다. 따라서 아래와 같이 변경이 가능하다.   

```scala 
a(i) = 'hello'   
```

`차이점은 ArrayBuffer는 사이즈 조정이 자동적이다 라는 점이다. ArrayBuffer에 
요소를 추가하면 자동적으로 늘어난다는 점이다.`   

그렇다면 Array에 추가한다면?   
`아래와 같이 새로 만들어진 Array가 생겨난다.`   

```scala    
val array = Array(1, 2, 3)
val array2 = array :+ 4   // 새로운 배열 생성 
array.foreach(print)      // 1 2 3
array2.foreach(print)     // 1 2 3 4
```

ArrayBuffer는 아래와 같이 사용 가능하다.   

```scala 
val buf = mutable.ArrayBuffer.empty[Int]
buf.append(1)
buf.append(10)
val array = buf.toArray
array.foreach(println) // 1 10 
```

- - - 

## Collection에서 제공하는 고차함수   

### map   

```scala 
val a = List(1,2,3)
a.map(_ + 1) // List(2,3,4)
```

### flatMap   

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

<https://www.includehelp.com/scala/list.aspx>   
<https://blog.baesangwoo.dev/posts/scala-learning-scala-chapter7-1/>   
<https://hamait.tistory.com/606>    
<https://stackoverflow.com/questions/10866639/difference-between-a-seq-and-a-list-in-scala>   

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

