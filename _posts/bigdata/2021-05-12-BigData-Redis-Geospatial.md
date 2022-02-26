---
layout: post
title: "[Redis] Geospatial 자료구조"
subtitle: "위도, 경도 위치 정보를 저장하는 자료구조 / 현재 위치에서 가까운 정류장 찾기 "       
comments: true
categories : BigData
date: 2021-05-12
background: '/img/posts/mac.png'
---

이번 글에서는 redis에서 geospatial data를 저장하고 위치 정보를 
활용하는 방법에 대해서 살펴볼 예정이다.   
geospatial 자료구조를 이해하기 위해서는 [redis 개념과 
sorted set](https://wonyong-jang.github.io/bigdata/2021/05/04/BigData-Redis-Collection.html)을 이해하고 있어야 한다.    

> Geo는 Sorted Set Data Structure를 사용한다. 따라서 몇 가지 명령은 Sorted Set의 
명령을 그대로 사용할 수 있다.    

회사에서 위치 정보를 이용해서 현재 위치 기준으로 가장 가까운 정류장 
5개를 추출해서 고객에게 길안내 정보를 제공하는 서비스를 하려고 한다.   
처음에는 위도, 경도 정보를 가지고 있는 정류장 데이터를 레디스에 
가지고 있다가 현재 위치를 기준으로 직선거리를 모두 계산 후 
sort를 하려고 했다.    
정류장 데이터가 그리 많지 않았기 때문에 충분히 가능할 거라고 
생각했지만 레디스에서 geospatial 자료구조를 이용하면 
조금 더 빠르게 가까운 위치를 찾을 수 있어서 해당 자료구조를 
이용하려고 한다.   

> sort를 직접 하는 경우 O(NlogN)이고, geospatial을 이용하는 경우 O(N+logN) 이기 때문이다.   

명령어 마다 시간복잡도는 [링크](http://redisgate.kr/redis/command/georadius.php)를 
참고했다.   

- - - 

## Geospatial   

`Geo는 Redis 버전 3.2에 새로 도입된 기능으로, 
    도시의 경도(세로선/longitude)와 위도(가로선/latitude)를 이용하여 
    여러 위치 정보를 활용할 수 있다.`      
   
Redis Geo는 지구(Earth)가 완전한 구(sphere)라고 가정한다. 따라서 
최대의 경우 0.5% 정도 오차가 발생할 수 있다.       

또한 위도, 경도를 기준으로 거리를 계산하기 위해 [Haversine formula](https://en.wikipedia.org/wiki/Haversine_formula)를 사용한다.      

geospatial이란 지도상의 object들의 위치인 지리데이터를 의미한다.   
우리가 자주 사용하는 배달의 민족이나, 카카오 택시등의 서비스에서는 
이러한 geospatial 데이터를 활용해 서비스를 제공한다.   

<img width="500" alt="스크린샷 2022-02-01 오후 2 43 05" src="https://user-images.githubusercontent.com/26623547/151918649-39c95c6b-f1aa-493f-adac-6f011bdd5e56.png">   
 

Geospatial을 이용해서 아래와 같은 명령을 할 수 있다.   

- 경도/위도 입력 : GEOADD   
- 경도/위도 조회 : GEOPOS   
- 거리 조회 : GEODIST  
- 주변 지점 조회 : GEORADIUSBYMEMBER, GEORADIUS   
- 해시값 조회 : GEOHASH  
- 범위 조회 : ZRANGE   
- 삭제 : ZREM 
- 개수 조회 : ZCARD  

일반적으로 geospatial object를 저장하기 위해서는 longitude와 latitude의 
pair를 저장한다.     
이러한 데이터의 저장은 다른 데이터 저장소에서도 가능하지만, 
    redis를 사용하면 대규모 geospatial object 
    데이터의 저장 및 조회를 very low latency로 구현할 수 있다.   

- - - 

## Geohash   

`redis는 geospatial object의 데이터인 longitude와 latitude의 pair를 
저장할때 실제로는 geohash값을 저장한다.`    

Geohash는 52bits 정수로 부터 encoding된 11자리 문자열이다. 

<img width="880" alt="스크린샷 2022-02-01 오후 2 54 33" src="https://user-images.githubusercontent.com/26623547/151919616-2f9ae676-e34f-41a8-ba5c-1e6c04ce27bb.png">   

위의 그림에서 Union Coffee라는 까페가 있다고 가정해보자. 이 카페의 
경도와 위도를 -123/+12라고 할 경우 이는 Union Coffee의 지리정보인 
Geospatial data라고 할 수 있다.   
이러한 데이터를 redis는 Geohash를 사용해 c2672gnx8p0로 hash 했다.   

이제 이 hashed string은 Geopoints라는 key의 sorted set에 담겨지게 된다.    
sorte set은 data를 저장할 때 order의 기준을 정하기 위해 score 값을 
요구하기 때문에, redis가 geohash값을 확인해 score를 입력해준다.   

결과적으로 geopoints라는 sorted set에는 1558859838165330의 score를 가진 
Union Coffee라는 멤버가 담기게 되는 것이다. 이 때 이 멤버의 
실제 value는 hashed string인 c2672gnx8p0 이다.   

이제 사용자는 hashed string인 c2672gnx8p0을 활용해 역으로 
Union Coffee의 경도와 위도를 확인할 수 있다.   

- - - 

## Command Line    

redis-cli를 이용해서 위치정보를 사용해보자.    

### 1. geoadd    

위, 경도 데이터를 이용하여 여러 위치 정보를 테스트하기 위해 
아래 명령어를 통해 geopoints라는 `sorted set에 "Union Coffee"의 geospatial data를 
저장해보자.`         

```
127.0.0.1:6379> geoadd geopoints 127.075390 37.629591 "Union Coffee"
(integer) 1
127.0.0.1:6379> zrange geopoints 0 -1 withscores
1) "Union Coffee"
2) "4077566423366547"
```

`zrange로 sorted set에 담겨있는 "Union Coffee" score를 확인해보면, 
    redis가 값을 계산해 두었다.`      

> 시간복잡도 O(logN)이며, N은 Sorted Set에 저장된 멤버의 개수이다.   

### 2. geohash   

sorted set에 담겨있는 "Union Coffee"의 value값(geoHash)을 확인하기 위해선 
아래의 명령어를 입력한다.   

```
127.0.0.1:6379> geohash geopoints "Union Coffee"
1) "wydq5dm2r00"
```

위의 geohash 값은 "Union Coffee"의 geospatial data를 가지고 있음으로, 
    [http://geohash.org/](http://geohash.org/) url의 맨뒤에 geohash값을 
    입력하면 지도에서 "Union Coffee"의 위치를 찾을 수 있다.    

> url : geohash.org/wydq5dm2r00 <- url 맨뒤에다 geohash 값 입력   

<img width="700" alt="스크린샷 2022-02-01 오후 3 25 09" src="https://user-images.githubusercontent.com/26623547/151922110-e5e346f3-cc56-4341-8f41-bb1ab86cf9ec.png">     

위에서 중요한 점은 "wydq5dm2r00"인 geohash값은 precision 값을 가진다는 것이다.   

즉, 만약 위의 string에서 일부를 제거한다면 해당 location의 정밀도가 
떨어지게 된다. 예를 들어 뒤에 두자리수를 지워 "wydq5dm2r"로 
검색해보면 아래와 같이 정밀도가 떨어진 location을 확인할 수 있다.   

- 실제 위치 : 127.075390 / 37.629591
- "wydq5dm2r00" : 127.07538 / 37.62959
- "wydq5dm2r" : 127.0754 / 37.6296  

> 시간 복잡도 O(logN)   

### 3. geopos   

`경도, 위도를 조회하기 위해서는 아래와 같이 사용한다.`      

```
127.0.0.1:6379> geopos geopoints "Union Coffee"
1) 1) "127.0753893256187439"
   2) "37.62959205066435686"
```

> 시간 복잡도 O(logN)   

### 4. geodist    

`두 지역의 거리를 리턴한다. 단위는 m(meter), km(kilometer), mi(mile), ft(feet)이며, 
    기본단위는 meter이다.`   

```
127.0.0.1:6379> geodist geopoints CU "Union Coffee"
"68.3547"
127.0.0.1:6379> geodist geopoints CU "Union Coffee" mi
"0.0425"
127.0.0.1:6379> geodist geopoints CU "Union Coffee" km
"0.0684"
```

> 시간복잡도 O(logN)    

### 5. georadiusbymember   

`georadiusbymember 명령어를 사용하면, 특정 member의 radius 범위 내에 있는 
member들을 손쉽게 찾을 수 있다.`    

<img width="500" alt="스크린샷 2022-02-01 오후 3 40 17" src="https://user-images.githubusercontent.com/26623547/151923481-9b305a42-7926-42c6-bd3e-71375c0b791c.png">   

명령어는 아래와 같다. CU의 100m radius 내에 있는 모든 member를 찾아보자. 
`여기서 withdist는 거리를 / withcoord는 위, 경도를 / withhash는 해시값을 
리턴해준다.`           

```
127.0.0.1:6379> georadiusbymember geopoints CU 100 m withdist
1) 1) "CU"
   2) "0.0000"
2) 1) "Union Coffee"
   2) "68.3547"
```

`georadiusbymember 명령어를 사용하면 해당 위치에서 가장 먼곳에 위치한 
member나 가장 가까운 곳에 member도 찾을 수 있다.`    

아래와 같이 입력하면 가장 먼 곳의 member를 찾을 수 있다.    
해석하자면, CU의 100m radius 이내의 member를 찾고 이를 거리가 먼순부터 
정렬한뒤 1개의 member만 리턴하는 것이다.   

```
127.0.0.1:6379> georadiusbymember geopoints CU 100 m withdist count 1 desc
1) 1) "Union Coffee"
   2) "68.3547"
```

가장 가까운 지점을 찾기 위해서는 Count에는 2를 입력해야 한다. 기본적으로 
가장 가까운 거리는 자기 자신으로 리턴되기 때문이다.   

```
127.0.0.1:6379> georadiusbymember geopoints CU 100 m withdist count 2 asc
1) 1) "CU"
   2) "0.0000"
2) 1) "Union Coffee"
   2) "68.3547"
```

`만약 위에서 찾은 member들을 또다른 sorted set에 저장하기 위해서는 
아래와 같이 입력한다.`      
`이때는 withdist/withcoord/withhash 변수는 사용할 수 없다.`   
`또한, 저장된 member들의 score는 각 member들의 hash 값이다.`    

```
127.0.0.1:6379> georadiusbymember geopoints CU 100 m store c1
(integer) 2
127.0.0.1:6379> zrange c1 0 -1 withscores
1) "Union Coffee"
2) "4077566423366547"
3) "CU"
4) "4077566423793958"
```

만약 member의 score를 hash가 아닌 dist로 저장하고 싶은 경우에는 
아래와 같이 입력하면 된다.   

```
127.0.0.1:6379> georadiusbymember geopoints CU 100 m storedist c1
(integer) 2
127.0.0.1:6379> zrange c1 0 -1 withscores
1) "CU"
2) "0"
3) "Union Coffee"
4) "68.354701729162102"
```

> 시간 복잡도는 O(N+log(M))    

### 6. georadius   

`위에서 사용한 georadiusbymember와 사용방법은 동일하며, 기존 member가 아닌 
위 경도를 입력하는 것이 다르다.`    

```
127.0.0.1:6379> georadius geopoints 127 38 200 km
1) "Union Coffee"
2) "CU"
127.0.0.1:6379> georadius geopoints 127 38 200 km withcoord
1) 1) "Union Coffee"
   2) 1) "127.0753893256187439"
      2) "37.62959205066435686"
2) 1) "CU"
   2) 1) "127.07614034414291382"
      2) "37.62974666865508055"
127.0.0.1:6379> georadius geopoints 127 38 200 km withdist asc
1) 1) "CU"
   2) "41.7218"
2) 1) "Union Coffee"
   2) "41.7283"
```

> 시간 복잡도 O(N+log(M))

- - - 

## 정리   

위에서 여러 실습을 해본 것처럼 버스 정류장의 위, 경도 데이터를 미리 
sorted set에 저장해두고, 현재 위치인 위, 경도 데이터가 들어왔을 때 
아래 명령을 통해서 가장 가까운 5개 정류장을 확인 할 수 있었다.   

```
127.0.0.1:6379> georadius geopoints 127 38 200 km withdist withcoord asc count 5

1) 1) "CU"
   2) "41.7218"
   3) 1) "127.07614034414291382"
      2) "37.62974666865508055"
2) 1) "Union Coffee"
   2) "41.7283"
   3) 1) "127.0753893256187439"
      2) "37.62959205066435686"
...
```

해당 자료구조를 이용하면 여러 지리 데이터를 직접 구현없이 
빠른 성능으로 제공 가능할 것이다.   

위에서 살펴본 기능 외에도 6.2.0 부터 사용 가능한 
[GEOSEARCH와 GEOSEARCHSTORE](http://redisgate.kr/redis/command/geosearch.php)도 
있으니 참고해보자.    
[https://www.memurai.com/blog/geospatial-queries-in-redis](https://www.memurai.com/blog/geospatial-queries-in-redis) 도 
참고해보자.  

마지막으로 위의 내용을 자바로 작성하는 코드는 [링크](https://wonyong-jang.github.io/bigdata/2021/05/11/BigData-Redis-Spring-Data-Redis.html)를 
참고하자.   

- - - 

**Reference**   

<http://redisgate.kr/redis/command/georadius.php>    
<https://redis.io/commands/GEORADIUS>   
<https://luran.me/384>   
<https://redis.com/redis-best-practices/indexing-patterns/geospatial/>   
<https://minholee93.tistory.com/entry/Redis-Geo>   

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}
