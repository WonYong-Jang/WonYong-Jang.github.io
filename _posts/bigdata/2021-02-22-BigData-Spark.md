---
layout: post
title: "[Spark] 아파치 스파크(spark) 시작하기 "
subtitle: "Driver, Executor, Task, Cluster Manager/ RDD / Hadoop"    
comments: true
categories : BigData
date: 2021-02-22
background: '/img/posts/mac.png'
---

아파치 스파크를 한마디로 정의하자면 '빅데이터 처리를 위한 오픈소스 분산 처리 플랫폼' 또는 
'빅데이터 분산 처리 엔진' 정도료 표현할 수 있다.    

빅데이터 개념이 등장했을 당시, 빅데이터는 하둡(Hadoop)이라고 할 정도로 
하둡 에코시스템이 시장을 지배했다.    
하둡은 HDFS(Hadoop Distributed File System)라고 불리는, 분산형 파일 시스템을 
기반으로 만들어졌다. 데이터 처리 시, HDFS와 맵리듀스 라고 불리는 
대형 데이터셋 병렬 처리 방식에 의해 동작한다.   

문제는 하둡의 HDFS가 DISK I/O를 기반으로 동작한다는 것에 있었다.    
실시간성 데이터에 대한 니즈(NEEDS)가 급격하게 증가하면서, 하둡으로 
처리하기에는 속도 측면에서 부적합한 상황이 발생하였다.    

이 때 등장한 것이 아파치 스파크이다.   
최근에는 경쟁 관계를 넘어서, 
    하둡+스파크 라는 둘의 연계가 하나의 큰 흐름으로 자리 잡았다.   

<img width="770" alt="스크린샷 2021-02-22 오후 11 41 28" src="https://user-images.githubusercontent.com/26623547/108723470-a2e61100-7567-11eb-938e-bb6388ac35d7.png">   

- - - 

# Spark 란?   

현재 빅데이터 분석기술 중에서 가장 주목 받는 기술은 아파치 스파크(spark)이다.   
`스파크는 인메모리(In-Memory) 기반으로 동작하기 때문에, 반복적인 처리가 필요한 작업에서 
속도가 최소 100배 이상 빠르며, 머신`   

`스파크는 스칼라로 작성되어 자바 보다 간결한 코드로 같은 작업을 표현할 수 있다. 또한 JVM에서 동작하기 
때문에 기존에 사용하던 자바 라이브러리를 모두 사용할 수 있다.`   

`스파크는 매우 큰 집합을 대상으로 빠르게 처리 작업을 수행하는 한편, 단독으로 또는 
다른 분산 컴퓨팅 툴과 조율해 여러 컴퓨터로 데이터 처리 작업을 분산할 수 있는 
데이터 처리 프레임워크이다.`   

또한, 다양한 방식으로 배포가 가능하며 Java, Scala, Python, R 프로그래밍 언어를 위한 
네이티브 바인딩을 제공하고 SQL, 스트리밍 데이터, 머신러닝, 그래프 프로세싱을 지원한다.   


- - - 

## Spark 구조    

`스파크는 마스터-슬래이브 구조로 실행 되며, 
    작업을 관장하는 드라이버(driver)와 실제 작업이 동작하는 익스큐터(executor)로 구성된다.`       

`드라이버는 스파크 컨텍스트 객체를 생성하여 클러스터 매니저와 통신하면서 클러스터의 자원 관리를 
지원하고, 애플리케이션 라이프 사이클을 관리한다.`        

<img width="600" alt="스크린샷 2021-02-22 오후 10 36 59" src="https://user-images.githubusercontent.com/26623547/108715646-7ed20200-755e-11eb-830a-4371d800fc96.png">   

스파크 실행 프로그램으로 드라이버와 익스큐터 프로세스로 실행되는 프로그램을 말한다. 클러스터 매니저가 
스파크 애플리케이션의 리소스를 효율적으로 배분하게 된다.   

#### 스파크 클러스터    

`클러스터라고 하면 일반적으로 여러 대의 서버가 마치 한 대의 서버처럼 동작하는 
것을 의미한다. 스파크 역시 클러스터 환경에서 동작하며, 대량의 데이터를 여러 
서버로 나누어 병렬로 처리한다.`    

따라서 항상 클러스터 환경에서 동작하는 프로그램을 작성할 때는 
데이터가 여러 서버에 나눠져 병렬로 처리되고 있다는 사실을 기억하고 있어야 한다.   

#### 드라이버(Driver)   

`스파크에서는 잡을 실행하는 프로그램, 즉 메인 함수를 가지고 있는 프로그램을 가리켜 
드라이버라고 한다. 더 정확하게 표현하자면 드라이버란 스파크컨텍스트를 
생성하고 그 인스턴스를 포함하고 있는 프로그램을 의미한다.`   

드라이버 프로그램은 자신을 실행한 서버에서 동작하면서 스파크 컨텍스트를 
생성해 클러스터의 각 워커 노드들에게 작업을 지시하고 결과를 
취합하는 역할을 수행한다.    

#### 스파크 컨텍스트   

`스파크 컨텍스트는 스파크 어플리케이션과 클러스터의 연결을 관리하는 객체로서 
모든 스파크 어플리케이션은 반드시 스파크 컨텍스트를 생성해야 한다.`    
RDD를 비롯해 스파크에서 사용하는 주요 객체는 스파크 컨텍스트를 이용해 
생성할 수 있다.   

```scala
val conf = new SparkConf().setMaster("local[*]").setAppName("RDDSample")   
val sc = new SparkContext(conf)   
```

`스파크 컨텍스트를 생성할 때는 스파크 동작에 필요한 여러 설정 정보를 지정할 수 있다. 
이 가운데 클러스터 마스터 정보와 어플리케이션 이름은 반드시 지정해야 하는 
필수 정보이다.`      

> 마스터 정보는 스파크가 동작할 클러스터의 마스터 서버를 의미하는 것으로 
로컬 모드에서는 local 또는 local[3], local[*] 같이 사용된다.   

> local[3]은 3개의 스레드를 의미하고 local[*] 은 가용한 스레드의 갯수를 의미한다.

#### 익스큐터(Executor)    

태스크 실행을 담당하는 에이전트로 실제 작업을 진행하는 프로세스이다. 
태스크 단위로 작업을 실행하고 결과를 드라이버에 알려준다.    
익스큐터가 동작 중 오류가 발생하면 다시 재작업을 진행한다.   

#### 태스크(Task)   

익스큐터에서 실행되는 실제 작업이다. 익스큐터의 캐쉬를 공유하여 작업의 
속도를 높일 수 있다.   

- - - 

## RDD, DataFrame, DataSet   

스파크 어플리케이션을 구현 방법은 스파크 v1에서 발표한 RDD를 이용하는 방법과 
스파크 v2에서 RDD의 단점으로 개선하여 발표한 DataFrame과 DataSet을 
이용하는 방법 두가지가 있다.   


<img width="800" alt="스크린샷 2021-02-23 오후 7 19 53" src="https://user-images.githubusercontent.com/26623547/108830928-06764a00-760d-11eb-9ff8-8ce22aea1f59.png">     


스파크가 사용하는 기본 데이터 모델로써 RDD를 잘 이해하고 다루는 것은
스파크 어플리케이션을 작성하고 이해하는 데 기본이라 할 수 있다.    

먼저 RDD에 대해 알아보자.    

- - - 
    
## RDD(Resilient Distributed Datasets)    

`RDD는 문자 그대로 해석하면 회복력을 가진 분산 데이터 집합 정도가 될 것이다.`   

여기서 회복력이 있다는 말은 데이터를 처리하는 과정에서 일부 문제가 발생하더라도 스스로 복구할 수 있다는 의미이다.   
단, 복구의 의미는 스파크 어플리케이션이 정상적으로 동작하고 있는 상황을 가정한 것으로 작업 수행 
도중 서버나 네트워크, 자원 할당 등에 일시적/부분적 문제가 발생했을 때 RDD의 
작업 히스토리를 이용한 재시도를 수행함으로써 복구를 수행할 수 있다는 뜻이다.   

따라서, 어플리케이션 코드 자체에 버그가 있거나 드라이버 프로그램이 오류로 
종료되어 스파크 어플리케이션과 서버 프로세스 간 연결이 끊어지는 등의 
영구적 장애 상황은 RDD에서 말하는 복구 대상이 아니라는 점을 알고 있어야 한다.   

위에서 언급한 것처럼 `데이터에 문제가 생겨도 원래 상태로 복구가 가능한 것은 
RDD는 불변성을 띠기 때문이다.`    

스파크는 데이터의 일부가 유실되면 어딘가에 백업해둔 데이터를 다시 불러오는 것이 
아니고 데이터를 다시 만들어내는 방식으로 복구를 수행한다. 한번 만들어진 RDD는 
어떤 경우에도 그 내용이 변경되지 않기 때문에 같은 방법으로 만든 
RDD는 항상 같은 데이터를 갖게 된다.    
따라서, RDD를 만드는 방법만 기억하고 있으면 언제든 똑같은 데이터를 다시 만들어 낼 수 있게 된다.   


`또한, RDD 데이터는 클러스터를 구성하는 여러 서버에 나누어 저장한다. 스파크는 이렇게 분할 된 
데이터를 파티션이라는 단위로 관리한다.`     



<img width="800" alt="스크린샷 2021-02-23 오후 11 13 07" src="https://user-images.githubusercontent.com/26623547/108856037-fa01e980-762c-11eb-8a63-c6523557f1b6.png">    

`RDD는 트랜스포메이션(transformation), 액션(action) 두가지 타입의 연산을 가지고 있다.`    
트랜스포메이션은 필터링 같은 작업으로 RDD에서 새로운 RDD를 반환한다.    
액션은 RDD로 작업을 처리하여 결과를 반환한다. 스파크는 지연처리(lazy evalution)를 지원하여 
트랜스포메이션을 호출할 때는 작업을 처리하지 않고, 액션을 호출하는 시점에 작업을 
처리하여 효율성을 제공한다.   

`이러한 동작 방식의 차이로 인한 가장 큰 장점은 실행 계획의 최적화가 가능하다는 점이다. 
사용자가 입력한 변환 연산들을 즉시 수행하지 않고 모아뒀다가 한번에 
실행함으로써 불필요한 네트워크 통신 비용을 줄일 수 있기 때문이다.`        

RDD는 액션이 실행될 때마다 새로운 연산을 처리한다. 작업의 처리 결과를 
재사용하고 싶으면 persist()메소드를 사용하여 결과를 메모리에 유지하도록 할 수 있다.   


### 1. RDD 생성     

위에서 스파크 컨텍스트를 만들었다면 이제 RDD를 생성할 수 있다.    
스파크는 크게 두 종류의 RDD 생성 방법을 제공한다.   

`첫번째 방법은 드라이버 프로그램의 컬렉션 객체를 이용하는 것이다.`      

```scala
val rdd1 = sc.parallelize(List("a", "b", "c"))
```

문자열을 포함한 컬렉션 객체를 생성하고 스파크 컨텍스트의 
parallelize() 메서드를 이용해 RDD를 생성했다.   

parallelize() 메서드는 생성될 RDD의 파티션 수를 지정하는 옵션을 가지고 있다.   

```scala
val rdd1 = sc.parallelize(1 to 1000, 10) // 10개 파티션 지정 
```

위의 예제는 1 부터 1000까지의 숫자를 담은 컬렉션 객체를 생성했고 파티션 크기를 10으로 
주었다. 만약 RDD에 포함된 전체 요소의 크기보다 파티션의 수가 더 크다면 
생성된 파티션 중 일부는 요소를 하나도 포함하지 않는 빈 파티션이 된다.   

`두번째 방법은 파일이나 데이터베이스 같은 외부 데이터를 읽어서 새로운 RDD를 
생성하는 방법이다.`      

```scala
val rdd1 = sc.textFile("<spark_home_dir>/README.md")    
```

이때 파일 각 한줄은 한개의 RDD 구성요소가 된다. 

### 2. RDD 기본 액션   

`RDD의 연산은 트랜스포메이션과 액션 연산으로 나눌 수 있으며, 
    두 연산을 구분하는 기준은 연산의 수행 결과가 RDD인지 아닌지를 확인해보면 
    구분이 가능하다.`    

#### 2-1) collect    

₩collect는 RDD의 모든 원소를 모아서 배열로 돌려준다. 반환 타입이 RDD가 아닌 배열이므로 
연산은 액션에 속하는 연산이다.`      

collect 연산을 수행하면 RDD에 있는 모든 요소들이 collect 연산을 호출한 서버의 
메모리에 수집된다. 따라서 전체 데이터를 모두 담을 수 있을 정도의 
충분한 메모리 공간이 확보돼 있는 상태에서만 사용해야 한다.    

```scala
val rdd1 = sc.parallelize(1 to 5)
val result = rdd1.collect
println(result.mkString(", "))
// print : 1, 2, 3, 4, 5
```

mkString은 리스트에 담긴 요소를 하나의 문자열로 표현하는 메서드이다.   

#### 2-2) count    

count는 RDD를 구성하는 전체 요소의 개수를 반환한다.   

```scala
val rdd1 = sc.parallelize(1 to 5)
val result = rdd1.count
println(result) // 5   
```

- - - 

### 3. RDD 트랜스포메이션    

트랜스포메이션은 기존 RDD를 이용해 새로운 RDD를 생성하는 연산이다. 이러한 연산에는 
각 요소의 타입을 문자열에서 숫자로 바꾸거나 불필요한 요소를 제외하거나 기존 요소의 
값에 특정 값을 더하는 등의 작업이 모두 포함된다.   

#### 3-1) map    

map은 스파크를 이용한 데이터 처리 작업에서 흔히 사용되는 대표적인 연산 중 하나이다.     
아래 예제는 1부터 5까지의 수로 구성된 RDD의 각 요소에 1을 더하는 함수를 적용해서 
2부터 6까지의 숫자로 구성된 새로운 RDD를 생성하는 예제이다.   

```scala
val rdd = sc.parallelize(1 to 5).map(_ + 1)
println(rdd.collect.mkString(", "))
// 2, 3, 4 ,5 ,6
```

```scala
def map[U: ClassTag](f: T => U): RDD[U]
```    

`T 타입을 U 타입으로 변환하는 함수 f를 이용해서 RDD[T] 타입의 RDD를 RDD[U] 타입으로 
변환하는 메서드 라는 의미이다.`    


#### 3-2) flatMap    

아래 예제를 보면 fruits는 모두 3개의 단어가 포함되어 있고, ' , ' 기준으로 분리하여 
과일 리스트를 생성하려고 한다.    

```scala
val fruits = List("apple,orange", "grape,apple,mango", "blueberry,tomato,orange")
val rdd1 = sc.parallelize(fruits); // 단어 3개를 가진 List   
```

map을 이용해서 분리를 한다면 아래와 같을 것이다.     
우리는 이런 결과 말고 과일 리스트만 배열로 얻기를 원한 때 flatMap을 사용할 수 있다.    

```scala
val rdd2 = rdd1.map(_.split(","))    
println(rdd2.collect.map(_.mkString("{",", ", "}")).mkString("{",", ", "}"))    
// [{apple, orange}, {grape, apple, mango}, {blueberry, tomato, orange}]      
```

위의 경우 'apple,orange' 라는 문자열이 apple과 orange 포함한 배열로 변환되는데 
배열에 포함된 요소를 모두 밖으로 끄집어 내는 작업이 필요하다.   
`flatMap() 연산은 하나의 입력값에 대응하는 반환값이 여러 개 일 때 유용하게 
사용 할 수 있다.`     

```scala
val fruits = List("apple,orange", "grape,apple,mango", "blueberry,tomato,orange")
val rdd1 = sc.parallelize(fruits);
val rdd2 = rdd1.flatMap(_.split(","))
println(rdd2.collect.mkString(", "))   
// apple, orange, grape, apple, mango, blueberry, tomato, orange
```

#### 3-3) mapValues      

RDD의 요소가 키와 값의 쌍을 이루고 있는 경우 페어RDD(PairRDD)라는 용어를 
사용한다.    
`mapValues()는 RDD의 모든 요소들이 키와 값의 쌍을 이루고 있는 경우에만 
사용 가능한 메서드이며, 인자로 전달받은 함수를 값에 해당하는 요소에만 
적용하고 그 결과로 구성된 새로운 RDD를 생성한다.`    
즉, 키에 해당하는 부분은 그대로 두고 값에만 map() 연산을 적용한 
것과 같다.   

```scala 
val rdd = sc.parallelize(List("a", "b", "c")).map((_, 1))
val result = rdd.mapValues(i => i+1)
println(result.collect.mkString(", "))   
// (a,2), (b,2), (c,2)    
```

#### 3-4) flatMapValues   

마찬가지로 RDD의 구성요소가 키와 값의 쌍으로 구성된 경우에만 사용 할 수 있는 
메서드이다.    

```scala 
val rdd = sc.parallelize(Seq((1,"a,b"), (2,"a,c"), (1,"d,e")))
val result = rdd.flatMapValues(_.split(","))
println(result.collect.mkString("\t"))
// (1,a)	(1,b)	(2,a)	(2,c)	(1,d)	(1,e)   
```

- - - 

### 4. 그룹과 관련된 연산들    

#### 4-1) zip     

zip() 연산은 두 개의 서로 다른 RDD를 각 요소의 인덱스에 따라 하나의 (키, 값) 쌍으로 
묶어 준다.     

```scala   
val rdd1 = sc.parallelize(List("a", "b", "c"))
val rdd2 = sc.parallelize(List(1, 2, 3))
val result = rdd1.zip(rdd2)
println(result.collect.mkString(", "))
// (a,1), (b,2), (c,3)   
```

서로 크기가 다른 RDD 간에는 zip() 메서드를 사용할 수 없다.    

#### 4-2) groupBy   

groupBy()는 RDD의 요소를 일정한 기준에 따라 여러 개의 그룹으로 나누고 
이 그룹으로 구성된 새로운 RDD를 생성한다.

```scala 
val rdd = sc.parallelize(1 to 10)
val result = rdd.groupBy{
   case i: Int if(i % 2 == 0)  => "even"
   case _                      => "odd"
}
result.foreach {
   v => println(s"${v._1}, [${v._2.mkString(", ")}]")
}
// even, [2, 4, 6, 8, 10]
// odd, [1, 3, 5, 7, 9]
```

#### 4-3) groupByKey   

groupBy() 메서드가 요소의 키를 생성하는 작업과 그룹으로 분류하는 작업을 
동시에 수행한다면 `groupByKey()는 이미 RDD의 구성요소가 키와 값으로 쌍으로 
이루어진 경우에 사용 가능한 메서드이다.`    

```scala   
val rdd = sc.parallelize(List("a","b","c","c","b")).map((_,1))
val result = rdd.groupByKey

result.collect.foreach {
   v => println(s"${v._1}, [${v._2.mkString(",")}]")
}
// a, [1]
// b, [1,1]
// c, [1,1]
```
- - -    

### 5. 집합과 관련된 연산들    

#### 5-1) distinct    

distinct()는 RDD의 원소에서 중복을 제외한 요소로만 구성된 
새로운 RDD를 생성하는 메서드이다.    

```scala
val rdd = sc.parallelize(List(1,2,3,1,2,3,1,2,3))
val result = rdd.distinct()
println(result.collect.mkString(", "))
// 1, 2, 3    
```

#### 5-2) cartesian    

cartesian()은 두 RDD 요소의 카테시안곱을 구하고 그 결과를 요소로 하는 
새로운 RDD을 생성하는 메서드이다.    

```scala    
val rdd1 = sc.parallelize(List(1,2,3))
val rdd2 = sc.parallelize(List("a","b","c"))
val result = rdd1.cartesian(rdd2)
println(result.collect.mkString(", ")) 
// (1,a), (1,b), (1,c), (2,a), (2,b), (2,c), (3,a), (3,b), (3,c)    
```

#### 5-3) union    

`아래와 같이 rdd1, rdd2을 합쳐서 새로운 RDD를 생성하는 메서드이다.`       

```scala 
val rdd1 = sc.parallelize(List("a","b","c"))
val rdd2 = sc.parallelize(List("d","e","f"))
val result = rdd1.union(rdd2)
println(result.collect.mkString(", "))   
// a, b, c, d, e, f    
```   

#### 5-4) join   

join()은 RDD의 구성요소가 키와 값의 쌍으로 구성된 경우에 사용할 수 있는 
메서드이다. `같은 키를 가지고 있는 요소를 모아서 그룹을 형성하고, 
    이 결과로 구성된 새로운 RDD를 생성하는 메서드이다.`    

join() 메서드의 수행 결과로 생성된 RDD는 튜플 타입의 요소를 가지며, 
    Tuple(키, Tuple(첫번째 RDD, 두번째 RDD)) 형태로 구성된다.    

```scala   
val rdd1 = sc.parallelize(List("a","b","c","d","e")).map((_, 1))
val rdd2 = sc.parallelize(List("b","c")).map((_,2))
val result = rdd1.join(rdd2)
println(result.collect.mkString("\n"))
// (b,(1,2))
// (c,(1,2))
```

#### 5-5) leftOuterJoin, rightOuterJoin   

RDD의 구성요소가 키와 값의 쌍으로 구성된 경우에 사용 할 수 있는 
메서드이며, sql 사용하는것과 비슷하게 
왼쪽 외부조인과 오른쪽 외부 조인을 수행한다.    

```scala 
val rdd1 = sc.parallelize(List("a","b","c")).map((_, 1))
val rdd2 = sc.parallelize(List("b","c")).map((_,2))
val result1 = rdd1.leftOuterJoin(rdd2)
val result2 = rdd1.rightOuterJoin(rdd2)
println("Left: " + result1.collect.mkString("\n"))
println("Right: "+ result2.collect.mkString("\n"))

// Left: (a,(1,None))
// (b,(1,Some(2)))
// (c,(1,Some(2)))

// Right: (b,(Some(1),2))
// (c,(Some(1),2))
```

#### 5-6) subtractByKey   

RRD의 구성 요소가 키와 값의 쌍으로 구성된 경우에 사용할 수 있는 
메서드이다.    
`rdd1의 요소 중에서 rdd2에 같은 키가 존재하는 요소를 제외한 
나머지로 구성된 새로운 RDD를 생성한다.`   

```scala 
val rdd1 = sc.parallelize(List("c","b")).map((_, 1))
val rdd2 = sc.parallelize(List("b","a")).map((_,2))
val result = rdd1.subtractByKey(rdd2)
println(result.collect.mkString("\n"))   
// (c,1)
```    






- - - 

**Reference**    

<https://wikidocs.net/book/2350>     
<https://artist-developer.tistory.com/7>    
<https://subscription.packtpub.com/book/big_data_and_business_intelligence/9781787126497/7/ch07lvl1sec46/rdd-partitioning>    

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

