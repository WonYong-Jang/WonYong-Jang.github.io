---
layout: post
title: "[Java] Stream "
subtitle: "generate, iterate, Filtering, Mapping, Sorting, Calculating, Reduction, Collecting, Mathing"    
comments: true
categories : Java
date: 2021-02-05
background: '/img/posts/mac.png'
---


# Java Stream   

자바 8에서 추가한 Stream은 람다를 활용할 수 있는 기술 중 하나이다. 자바 8 이전에는 배열 
또는 컬렉션 인스턴스를 다루는 방법은 for 또는 foreach 문을 돌면서 요소 
하나씩 꺼내서 다루는 방법이었습니다. 간단한 경우라면 상관없지만 로직이 
복잡해질수록 코드의 양이 많아져 여러 로직이 섞이게 되고, 메소드를 
나눌 경우 루프를 여러 번 도는 경우가 발생한다.   

`스트림은 데이터의 흐름이다. 배열 또는 컬렉션 인스턴스에 함수 여러 개를 조합해서 
원하는 결과를 필터링하고 가공된 결과를 얻을 수 있다. 또한 람다를 이용해서 코드의 
양을 줄이고 간결하게 표현할 수 있다. 즉 배열과 컬렉션을 함수형으로 처리할 수 있다.`   

또 하나의 장점은 간단하게 병렬처리(multi-threading)가 가능하다는 점이다. 즉, 쓰레드를 
이용해 많은 요소들을 빠르게 처리할 수 있다.   

스트림에 대한 내용은 크게 세 가지로 나눌 수 있다.   

1. 생성하기 : 스트림 인스턴스 생성   
2. 가공하기 : 필터링(filtering) 및 맵핑(mapping) 등 원하는 결과를 만들어가는 중간 작업   
3. 결과 만들기 : 최종적으로 결과를 만들어내는 작업   

- - -

## 생성하기   

보통 배열과 컬렉션을 이용해서 스트림을 만들지만 이 외에도 다양한 방법으로 
스트립을 만들 수 있다.   

#### 1. 배열 스트림   

스트림을 이용하기 위해서는 먼저 생성을 해야 한다. 스트림은 배열 또는 컬렉션 
인스턴스를 이용해서 생성 할 수 있다. 배열은 다음과 같이 `Arrays.stream 메소드를 
사용한다.`        

```java
String[] arr = new String[]{"a", "b", "c"};   
Stream<String> stream = Arrays.stream(arr);   
Stream<String> streamOfArrayPart = Arrays.stream(arr, 1, 3); // 1 ~ 2 요소 [b, c]   
```

#### 2. 컬렉션 스트림   

컬렉션 타입(Collection, List, Set)의 경우 인터페이스에 추가된 디폴트 메소드 stream 을 
이용해서 스트림을 만들 수 있다.   

```java
public interface Collection<E> extends Iterable<E> {
  default Stream<E> stream() {
    return StreamSupport.stream(spliterator(), false);
  } 
  // ...
}
```

그러면 다음과 같이 생성할 수 있다.   

```java
List<String> list = Arrays.asList("a","b","c");
Stream<String> stream = list.stream();
Stream<String> parallelStream = list.parallelStream(); // 병렬 처리 스트림  
```

#### 3. 비어 있는 스트림   

비어있는 스트림(empty streams)도 생성할 수 있다. 빈 스트림은 요소가 없을 때 
null 대신 사용할수 있다.   

```java
// Stream.empty()   
Stream<String> stream = list == null || list.isEmpty() ? Stream.empty() : list.stream();
```

#### 4. Stream.builder()    

빌더(Builder)를 사용하면 스트림에 직접적으로 원하는 값을 넣을 수 있다. 마지막에 
build메소드로 스트림을 리턴한다.   

```java
Stream<String> builderStream = 
  Stream.<String>builder()
    .add("Eric").add("Elena").add("Java")
    .build(); // [Eric, Elena, Java]
```

#### 5. Stream.generate()     

generate 메소드를 이용하면 Supplier에 해당하는 람다로 값을 넣을 수 있다.    
Supplier는 인자는 없고 리턴값만 있는 함수형 인터페이스다. 람다에서 리턴하는 
값이 들어간다.   

```java
public static<T> Stream<T> generate(Supplier<T> s) { ... }   
```

이 때 생성되는 스트림은 크기가 정해져있지 않고 무한(infinite)하기 때문에 
특정 사이즈로 최대 크기를 제한 해야한다.   

```java
Stream<String> generated = Stream.generate(() -> "a").limit(5);
// [a, a, a, a, a]
```

5개의 "a"이 들어간 스트림이 생성된다.   

#### 6. Stream.iterate()   

iterate 메소드를 이용하면 초기값과 해당 값을 다루는 람다를 이용해서 스트림에 
들어갈 요소를 만든다.   
다음 예제에서는 5가 초기값이고 값이 3씩 증가하는 값들이 들어가게 된다. 즉 요소가 
다음 요소의 인풋으로 들어간다. 이 방법도 스트림의 사이즈가 무한하기 때문에 
특정 사이즈로 제한해야 한다.   

```java
Stream<Integer> iteratedStream = Stream.iterate(5, n -> n + 3).limit(5);
// [5, 8, 11, 14, 17]    
```

#### 7. 기본 타입형 스트림   

물론 제네릭을 사용하면 리스트나 배열을 이용해서 기본타입(int, long, double) 스트림을 
생성할 수 있다. 하지만 제네릭을 사용하지 않고 직접적으로 해당 타입의 스트림을 다룰 수도 
있다. range 와 rangeClosed 는 범위의 차이이다. 두 번째 인자는 
종료지점이 포함되드냐 안되느냐의 차이 이다.   

```java
IntStream intStream = IntStream.range(1,5);
LongStream longStream = LongStream.rangeClosed(1,5);
```

제너릭을 사용하지 않기 때문에 불필요한 오토박싱(auto-boxing)이 일어나지 
않는다. 필요한 경우 boxed메소드를 이용해서 박싱(boxing)할 수 있다.   

```java
Stream<Integer> stream = IntStream.range(1,5).boxed();   

List<Integer> list = new ArrayList<>();
stream.forEach(list::add);
System.out.println(list); // [1, 2, 3, 4]   
```

> boxed() 메서드는 int, long, double 요소를 Integer, Long, Double 요소로 박싱해서 
Stream을 생성한다. Stream은 객체 요소를 처리하는 스트림이기 때문에 Integer, Long, Double을 다룰 수 있다.   

자바 8의 Random 클래스는 난수를 가지고 세 가지 타입의 스트림(IntStrea, LongStream, DoubleStream)을 
만들어 낼 수 있다. 쉽게 난수 스트림을 생성해서 여러가지 후속 작업을 취할 수 있어 유용하다.   

```java
DoubleStream doubles = new Random().doubles(3); // 난수 3개 생성   
```


#### 8. 문자열 스트링   

스트림을 이용해서 스트림을 생성할수도 있다. 다음은 스트링의 각 문자(char)를 
IntStream으로 변환한 에제이다. char는 문자이지만 본질적으로는 숫자이기 때문에 
가능하다.   

```java
IntStream intStream = "ABCD".chars();
// [65, 66, 67, 68]   
```

다음은 정규표현식(RegEx)을 이용해서 문자열을 자르고, 각 요소들로 스트림을 
만든 예제이다.   

```java
Stream<String> stringStream = Pattern.compile(", ").splitAsStream("AA, BB, CC");   
// [AA, BB, CC]
```   
   
#### 9. 파일 스트림   

자바의 File 클래스의 lines 메소드는 해당 파일의 각 라인을 스트링 타입의 
스트림으로 만들어준다.   

```java
Stream<String> fileStream = Files.lines(Paths.get("file.txt"), StandardCharsets.UTF_8);   
```

#### 10. 병렬 스트림 Parallel Stream   

스트림 생성 시 사용하는 stream 대신 parallelStream 메소드를 사용해서 
병렬 스트림을 쉽게 생성할 수 있다. 


#### 11. 스트림 연결하기   

`Stream.concat` 메소드를 이용해 두 개의 스트림을 연결해서 새로운 스트림을 
만들어 낼 수 있다.   

```java
Stream<String> stream1 = Stream.of("a", "b");
Stream<String> stream2 = Stream.of("c", "d");
Stream<String> resultStream = Stream.concat(stream1, stream2);
// [a, b, c, d]
```

- - - 

## 가공하기 

전체 요소 중에서 다음과 같은 API를 이용해서 내가 원하는 것만 뽑아낼 수 있다. 
이러한 가공 단계를 중간 작업이라고 하는데, 이러한 작업은 스트림을 
리턴하기 때문에 여러 작업을 이어 붙여서 작성 가능하다.    

```java
List<String> names = Arrays.asList("Eric", "Elena", "Java");
```

아래 나오는 예제 코드는 위와 같은 리스트를 대상으로 한다.   

#### 1. Filtering   

`필터(filter)는 스트림 내 요소들을 하나씩 평가해서 걸러내는 작업이다. 인자로 
받는 Predicate는 boolean을 리턴하는 함수형 인터페이스로 평가식이 들어가게 된다.`   

```java
// Returns a stream consisting of the elements of this stream that match
// the given predicate
Stream<T> filter(Predicate<? super T> predicate);
```

아래 예제를 보자 

```java
Stream<String> stream = names
                .stream()
                .filter(name -> name.contains("a"));
```

스트림의 각 요소에 대해서 평가식을 실행하게 되고 a 가 들어간 스트림이 
리턴된다.   

#### 2. Mapping   

`맵(map)은 스트림 내 요소들을 하나씩 특정 값으로 변환해 준다. 이 때 값을 
변환하기 위한 람다를 인자로 받는다.`   

```java
<R> Stream<R> map(Function<? super T, ? extends R> mapper);
```

스트림에 들어가 있는 값이 input이 되어서 특정 로직을 거친 후 output이 되어(리턴 되는)
     새로운 스트림에 담기게 된다. 이러한 작업을 맵핑(mapping)이라고 한다.   

아래 예제를 보자. 스트림 내 String의 toUpperCase 메소드를 실행해서 대문자로 
변환한 값들이 담긴 스트림을 리턴한다.   

```java
Stream<String> stream = names
                .stream()
                .map(String::toUpperCase);
// [ERIC, ELENA, JAVA]
```

#### 3. flatMap   

map 이외에도 조금 더 복잡한 flatMap 메소드가 있다.   

```java
<R> Stream<R> flatMap(Function<? super T, ? extends Stream<? extends R>> mapper);  
```

인자로 mapper를 받고 있는데, 리턴 타입이 Stream이다. 즉, 새로운 스트림을 생성해서 
리턴하는 람다를 넘겨야한다.    
`flatMap 은 중첨 구조를 한 단계 제거하고 단일 컬렉션으로 만들어 주는 역할을 한다. 
이러한 작업을 플래트닝(flattening)이라고 한다.`   

다음과 같은 중첩된 리스트가 있다.   

```java
List<List<String>> list = 
Arrays.asList(Arrays.asList("a"), Arrays.asList("b"));
// [[a], [b]]
```

이를 flatMap을 사용해서 중첩 구조를 제거한 후 작업을 할 수 있다.   

```java
List<String> flatList = 
  list.stream()
  .flatMap(Collection::stream)
  .collect(Collectors.toList());
// [a, b]
```

#### 4. Sorting   

정렬의 방법은 다른 정렬과 마찬가지로 Comparator를 이용한다.   

```java
Stream<T> sorted();
Stream<T> sorted(Comparator<? super T> comparator);
```   

```java
List<String> lang = 
  Arrays.asList("Java", "Scala", "Groovy", "Python", "Go", "Swift");

lang.stream()
  .sorted()
  .collect(Collectors.toList());
// [Go, Groovy, Java, Python, Scala, Swift]

lang.stream()
  .sorted(Comparator.reverseOrder())
  .collect(Collectors.toList());
// [Swift, Scala, Python, Java, Groovy, Go]
```

Comparator의 compare 메소드는 두 인자를 비교해서 값을 리턴한다.   

```java
int compare(T o1, T o2)   
```

기본적으로 Comparator 사용법과 동일하다. 아래는 이를 이용해서 문자열 길이를 
기준으로 정렬 해보는 예제이다. 



```java
lang.stream()
  .sorted(Comparator.comparingInt(String::length))
  .collect(Collectors.toList());
// [Go, Java, Scala, Swift, Groovy, Python]

lang.stream()
  .sorted((s1, s2) -> s2.length() - s1.length())
  .collect(Collectors.toList());
// [Groovy, Python, Scala, Swift, Java, Go]
```


#### 5. Iterating   

스트림 내 요소들 각각을 대상으로 특정 연산을 수행하는 메소드로는 peek 이 있다. 
peek은 그냥 확인 해본다는 단어 뜻처럼 특정 결과를 반환하지 않는 
함수형 인터페이스 Consumer를 인자로 받는다.   

```java
Stream<T> peek(Consumer<? super T> action);
```

따라서 스트림 내 요소들 각각에 특정 작업을 수행할 뿐 결과에 영향을 
미치지 않는다. 다음처럼 작업을 처리 하는 중간에 결과를 
확인해볼 때 사용할 수 있다. 

```java
int sum = IntStream.of(1, 3, 5, 7, 9)
  .peek(System.out::println)
  .sum();
```

- - -

## 결과 만들기    

가공한 스트림을 가지고 내가 사용할 결과값으로 만들어 내는 단계이다. 따라서 
스트림을 끝내는 최종 작업이다.    

#### 1. Calculating   

스트림 API 는 다양한 종료 작업을 제공한다. 최소, 최대, 합, 평균 등 기본형 타입으로 
결과를 만들어낼 수 있다.   

```java
long count = IntStream.of(1,2,3,4,5).count();
long sum = IntStream.of(1,2,3,4,5).sum();
```

만약 스트림이 비어 있는 경우 count 와 sum은 0을 출력하면 된다. 하지만 
평균, 최소, 최대의 경우에는 표현할 수가 없기 때문에 Optional을 이용해 
리턴한다.   

```java
OptionalInt min = IntStream.of(1, 3, 5, 7, 9).min();   
OptionalInt max = IntStream.of(1, 3, 5, 7, 9).max();   
```

`스트림에서 ifPresent 메소드를 이용해서 Optional을 처리할 수 있다.`   

```java
IntStream.of(1,2,3,4,5)
                .average()
                .ifPresent(System.out::println);
```

#### 2. Reduction   

스트림은 reduce라는 메소드를 이용하여 결과를 만들어 낼수 있다.    

reduce 메소드는 총 세 가지의 파라미터를 받을 수 있다.    

- accumulator : 각 요소를 처리하는 계산 로직, 각 요소가 올 때마다 중간 결과를 생성하는 로직   
- identity : 계산을 위한 초기값으로 스트림이 비어서 계산할 내용이 없더라도 이 값은 리턴    
- combiner : 병렬(parallel) 스트림에서 나눠 계산한 결과를 하나로 합치는 동작하는 로직   

```java
// 1개 (accumulator)
Optional<T> reduce(BinaryOperator<T> accumulator);

// 2개 (identity)
T reduce(T identity, BinaryOperator<T> accumulator);

// 3개 (combiner)
<U> U reduce(U identity,
  BiFunction<U, ? super T, U> accumulator,
  BinaryOperator<U> combiner);
```

먼저 인자가 하나만 있는 경우이다. 여기서 BinaryOperator는 같은 타입의 
인자 두 개를 받아 같은 타입의 결과를 반환하는 함수형 인터페이스이다. 
아래 예제에서 두 값을 더하는 람다를 넘겨주고 있다. 결과는 6(1 + 2 + 3) 이다.

```java
OptionalInt reduced = 
  IntStream.range(1, 4) // [1, 2, 3]
  .reduce((a, b) -> {
    return Integer.sum(a, b);
  });

// 아래처럼 간결하게 변환 가능 하다 
OptionalInt stream = IntStream
                .range(1,4)
                .reduce(Integer::sum);
```


이번엔 두 개의 인자를 받는 경우이다. 여기서 10은 초기값이고, 스트림 
내 값을 더해서 결과는 16(10 + 1 + 2 + 3)이 된다.    
여기서 람다는 메소드 참조(method reference)를 이용해서 넘길 수 있다.   

```java
int stream = IntStream
                .range(1,4)
                .reduce(10, Integer::sum); // method reference  
```

마지막으로 세 개의 인자를 받는 경우이다. Combiner가 하는 역할을 설명만 
봤을 때는 이해가 안될수 있다. 아래 코드를 보자.   

코드를 실행해보면 이상하게 마지막 인자인 combiner는 실행되지 않는다.   

```java
Integer reducedStream = Stream.of(1,2,3)
                .reduce(10,            // identity
                        Integer::sum,  // accumulator  
                        (a,b) -> {
                            System.out.println("combine was called");
                            return a+b;
                        });
```

Combiner는 병렬 처리 시 각자 다른 쓰레드에서 실행한 결과를 마지막 
합치는 단계이다. 따라서 병렬 스트림에서만 동작한다.   

```java
Integer reducedStream = Arrays.asList(1, 2, 3)
                .parallelStream()
                .reduce(10,
                        (a,b) -> {
                            System.out.println("identity: " + a + " " + b);
                            return a + b;
                        },
                        (a,b) -> {
                            System.out.println("combine : "+ a + " " + b);
                            System.out.println("combine was called");
                            return a+b;
                        });

System.out.println(reducedStream); // 36   
```

결과는 다음과 같이 36이 나온다. 먼저 accumulator는 총 세 번 동작한다. 초기값 10에 
각 스트림 값을 더한 세 개의 값(10+1=11, 10+2=12, 10+3=13)을 계산한다. 
Combiner는 identity와 accumulator를 가지고 여러 쓰레드에서 나눠 계산한 결과를 
합치는 역할이다. 

Output

```
identity: 10 2
identity: 10 3
identity: 10 1
combine : 12 13
combine was called
combine : 11 25
combine was called
36
```

병렬 스트림이 무조건 시쿼셜보다 좋은 것은 아니다. 오히려 
간단한 경우에는 이렇게 부가적인 처리가 필요하기 때문에 오히려 
느릴 수도 있다.   

#### 3. Collecting   

collect 메소드는 또 다른 종료 작업이다. Collector 타입의 인자를 받아서 처리를 하는데 
자주 사용하는 작업은 Collectors 객체에서 제공하고 있다.   

아래 예제에서는 다음과 같은 간단한 리스트를 사용한다. Product 객체는 
수량(amount)와 이름(name)을 가지고 있다.

```java
List<Product> products =
                Arrays.asList(new Product(23, "potatoes"),
                        new Product(14, "orange"),
                        new Product(13, "lemon"),
                        new Product(23, "bread"),
                        new Product(13, "sugar"));
```

##### 3-1) Collectors.toList()   

`스트림에서 작업한 결과를 담은 리스트로 반환한다. 다음 예제에서는 map 으로 
각 요소의 이름을 가져온 후 Collectors.toList 를 이용해서 리스트로 결과를 
가져온다.`    

```java
List<String> collectorCollection =
  productList.stream()
    .map(Product::getName)
    .collect(Collectors.toList());
// [potatoes, orange, lemon, bread, sugar]
```

##### 3-2) Collectors.joining()   

스트림에서 작업한 결과를 하나의 스트링으로 이어 붙일 수 있다.   

```java
String listToString = 
 productList.stream()
  .map(Product::getName)
  .collect(Collectors.joining());
// potatoesorangelemonbreadsugar
```

Collectors.joining 은 세 개의 인자를 받을 수 있다. 이를 이용하면 간단하게 
스트링을 조합할 수 있다.   

- delimiter : 각 요소 중간에 들어가 요소를 구분시켜주는 구분자
- prefix : 결과 맨 앞에 붙는 문자   
- suffix: 결과 맨 뒤에 붙는 문자   

```java
String list = products.stream()
                .map(Product::getName)
                .collect(Collectors.joining(", ", "[", "]"));   
              //  [potatoes, orange, lemon, bread, sugar]
```

##### 3-3) Collectors.averageingInt()   

숫자 값의 평균을 낸다.   

```java
Double averageAmount = 
 productList.stream()
  .collect(Collectors.averagingInt(Product::getAmount));
// 17.2

```

##### 3-4) Collectors.summingInt()   

숫자 값의 합을 낸다.   

```java
Integer summingAmount = 
 productList.stream()
  .collect(Collectors.summingInt(Product::getAmount));
// 86
```

IntStream으로 바꿔주는 mapToInt 메소드를 사용해서 좀 더 간단하게 표현 할 수 있다.   

```java
Integer num = products.stream()
                 .mapToInt(Product::getAmount)
                 .sum();
```

##### 3-5) Collectors.summarizingInt()   

만약 합계와 평균 모두 필요하다면 스트림을 두 번 생성해야 할까? 이런 정보를 
한번에 얻을 수 있는 방법으로는 summarizingInt 메소드가 있다.    


```java
IntSummaryStatistics statistics = 
 productList.stream()
  .collect(Collectors.summarizingInt(Product::getAmount));
```

Output   

```
IntSummaryStatistics {count=5, sum=86, min=13, average=17.200000, max=23}
```

- 개수 getCount()   
- 합계 getSum()   
- 평균 getAverage()   
- 최소 getMin()   
- 최대 getMax()   

이를 이용하면 collect 전에 이런 통계작업을 위한 map 을 호출할 필요가 없게 된다. 
위에서 살펴본 averaging, summing, summarizing 메소드는 각 기본 타입
(int, long, double)별로 제공된다.   

##### 3-6) Collectors.groupingBy()   

특정 조건으로 요소들을 그룹지을 수 있다. 수량을 기준으로 그룹핑해보겠다. 
여기서 받는 인자는 함수형 인터페이스 Function 이다.   

```java
Map<Integer, List<Product>> collectorMapOfLists =
 productList.stream()
  .collect(Collectors.groupingBy(Product::getAmount));
```

결과는 Map 타입으로 나오며, 같은 수량이면 리스트로 묶어서 보여준다.   

```
{23=[Product{amount=23, name='potatoes'}, 
     Product{amount=23, name='bread'}], 
 13=[Product{amount=13, name='lemon'}, 
     Product{amount=13, name='sugar'}], 
 14=[Product{amount=14, name='orange'}]}

```
   
##### 3-7) Collectors.partitioningBy()   

위의 groupingBy 함수형 인터페이스 Function 을 이용해서 특정 값을 기준으로 
스트림 내 요소들을 묶었다면, partitioningBy 은 함수형 인터페이스 Predicate를 받는다.   
Predicate는 인자를 받아서 boolean값을 리턴한다.    

```java
Map<Boolean, List<Product>> mapPartitioned = 
  productList.stream()
  .collect(Collectors.partitioningBy(el -> el.getAmount() > 15));   
```

따라서 평가를 하는 함수를 통해서 스트림 내 요소들을 true 와 false 두 가지로 
나눌 수 있다.   

```
{false=[Product{amount=14, name='orange'}, 
        Product{amount=13, name='lemon'}, 
        Product{amount=13, name='sugar'}], 
 true=[Product{amount=23, name='potatoes'}, 
       Product{amount=23, name='bread'}]}
```

#### 4. Matching   

매칭은 조건식 람다 Predicate를 받아서 해당 조건을 만족하는 요소가 있는지 
체크한 결과를 리턴한다. 다음과 같은 세가지 메소드가 있다.   

- 하나라도 조건을 만족하는 요소가 있는지(anyMatch)   
- 모두 조건을 만족하는지(allMatch)   
- 모두 조건을 만족하지 않는지(nonMatch)   


```java  
boolean anyMatch(Predicate<? super T> predicate);
boolean allMatch(Predicate<? super T> predicate);
boolean noneMatch(Predicate<? super T> predicate);
```

```java
List<String> names = Arrays.asList("Eric", "Elena", "Java");

boolean anyMathResult = names.stream().anyMatch(name -> name.contains("a"));
boolean allMathResult = names.stream().allMatch(name -> name.length() > 3);
boolean noneMatch = names.stream().noneMatch(name -> name.endsWith("s"));
// 모두 true
```


#### 5. Iterating   


foreach는 요소를 돌면서 실행되는 최종 작업니다. 보통 System.out.println 메소드를 넘겨서 
결과를 출력할 때 사용하곤 한다. 

```java
Stream<Integer> iteratedStream = Stream.iterate(5, n -> n + 3).limit(5);

iteratedStream.forEach(System.out::println);
```

Output   

```
5
8
11
14
17
```

- - - 

**Reference**    

<https://futurecreator.github.io/2018/08/26/java-8-streams/>   

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

