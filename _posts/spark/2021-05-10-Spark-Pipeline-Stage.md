---
layout: post
title: "[Spark] Pipeline and Stage "
subtitle: "Stage skip 되는 경우 / 셔플에 의한 stage 분리 / 셔플 발생시 write, read"    
comments: true
categories : Spark
date: 2021-05-10
background: '/img/posts/mac.png'
---

이번 글에서는 파이프라인과 stage에 대해서 살펴보자.  

## 1. Pipeline 과 Stage

아래 예제처럼 text 파일을 읽어서, 각 함수를 수행하는 코드를 작성했을 때 
어떻게 동작하는 지 살펴보자.   

```scala
val myRDD = sc.textFile("spark.txt")
val myRDD2 = myRDD.map(line => line.toUpperCase())
val myRDD3 = myRDD2.filter(line => line.contains("SPARK"))
myRDD3.take(2)    
```

위 코드는 txt 파일을 읽어서, 한줄마다 하나의 element로 처리하게 된다.   
`셔플에 의한 파티션 변화가 없기 때문에 하나의 stage로 묶이게 되며, 
    하나의 파이프라인으로 실행된다.`      

동일한 stage에서 하나의 element마다 파이프라인이 한번에 실행된다.    
아래 그림으로 이해해보자.   

<img width="1200" alt="스크린샷 2023-02-04 오후 8 53 18" src="https://user-images.githubusercontent.com/26623547/216766266-bd0883e3-9a04-4b98-a56f-430e462dba1d.png">   

<img width="1200" alt="스크린샷 2023-02-04 오후 8 53 33" src="https://user-images.githubusercontent.com/26623547/216766273-dfea8852-a16d-434a-9e2c-c79846680bc0.png">   

<img width="1200" alt="스크린샷 2023-02-04 오후 8 59 51" src="https://user-images.githubusercontent.com/26623547/216766470-0b1adb8b-e12f-45a5-98bc-a0a8fe22745b.png">   

<img width="1200" alt="스크린샷 2023-02-04 오후 9 00 23" src="https://user-images.githubusercontent.com/26623547/216766512-af97cd3a-f3b7-4b80-b369-bf13af92d2f3.png">



<img width="1200" alt="스크린샷 2023-02-04 오후 8 54 16" src="https://user-images.githubusercontent.com/26623547/216766305-937502f0-fa89-467c-b1e1-981a855ac609.png">

<img width="1200" alt="스크린샷 2023-02-04 오후 8 54 52" src="https://user-images.githubusercontent.com/26623547/216766317-a8da79c1-ec37-4a91-a5f0-cce23ac2399a.png">

<img width="1200" alt="스크린샷 2023-02-04 오후 8 55 11" src="https://user-images.githubusercontent.com/26623547/216766326-08000de5-3cc6-4fb8-8abc-62a32bef4bd6.png">

`위 처럼 하나의 element마다 파이프라인이 실행되는 것을 확인할 수 있으며, 
    take 함수를 통해 조건인 2개를 찾게 될 때까지 실행된다.`       

아래 예제를 통해 더 자세히 살펴보자.   
실행 순서를 확인하기 위해 쓰레드를 1개만 설정하여 spark shell을 실행한다.   

```
$ ./bin/spark-shell --master local[1]   
```

```scala
val data = sc.parallelize(1 to 10)
val data1 = data.map{x => println("map1_" + x); x}
val data2 = data1.map{x => println("map2_" + x); x}
val data3 = data2.map{x => println("map3_" + x); x}   
data3.getNumPartitions // 1

val data4 = data3.repartition(10)   
val data5 = data4.map{x => println("map5_" + x); x}
data5.toDebugString  // 각 stage 확인, 출력에서 들여쓰기가 다르다면 다른 stage로 구분된다.    

// (10) MapPartitionsRDD[8] at map at <console>:25 []
//  |   MapPartitionsRDD[7] at repartition at <console>:25 []
//  |   CoalescedRDD[6] at repartition at <console>:25 []
//  |   ShuffledRDD[5] at repartition at <console>:25 []
//  +-(1) MapPartitionsRDD[4] at repartition at <console>:25 []
//     |  MapPartitionsRDD[3] at map at <console>:25 []
//     |  MapPartitionsRDD[2] at map at <console>:25 []
//     |  MapPartitionsRDD[1] at map at <console>:25 []
//     |  ParallelCollectionRDD[0] at parallelize at <console>:24 []

data5.count // action 실행 
```

Output   

```
map1_1 0:>                                                          (0 + 0) / 1]
map2_1
map3_1
map1_2 0:>                                                          (0 + 1) / 1]
map2_2
map3_2
map1_3
map2_3
map3_3
map1_4
map2_4
map3_4
map1_5
map2_5
map3_5
map1_6
map2_6
map3_6
map1_7
map2_7
map3_7
map1_8
map2_8
map3_8
map1_9
map2_9
map3_9
map1_10
map2_10
map3_10
------------------------ stage 0
map5_10
map5_1
map5_2
map5_3
map5_4
map5_5
map5_6
map5_7
map5_8
map5_9
------------------------- stage 1
```

`위에서 repartiton에 의해서 파티션이 달라졌기 때문에 stage가 2개로 나뉜 것을
확인 할 수 있다.`   
`또한, 하나의 element는 stage 내에 있는 파이프라인을 한번에 실행한다.`          

아래 그림으로 정리해보면 `하나의 task는 stage내에서 하나의 파이프라인으로 
실행되며, 
    task 내에서 각 element 단위로 실행된다.`      

<img width="717" alt="스크린샷 2023-02-04 오후 9 27 07" src="https://user-images.githubusercontent.com/26623547/216767608-e2fe0319-38b4-49a2-91e5-f3177279cd4c.png">   

- - - 

## 2. Stage Skip   

위에서 실습한 내용에서 추가적으로 count action을 실행했을 때 
동일한 결과가 출력될까?   

결과를 확인해보자.   

```scala
data5.count   
```

Output

```
map5_10
map5_1
map5_2
map5_3
map5_4
map5_5
map5_6
map5_7
map5_8
map5_9
```

처음 count 함수를 호출했을 때와 다른 결과가 나타났다.  

`위에서 첫번째 stage가 생략된 이유는 셔플이 일어나게 되면, 
    셔플데이터를 저장해 놓고 그 데이터를 다음 stage에서 사용할 수 있도록 한다.`   

`따라서, 동일한 action이 발생했을 때 첫번째 stage에서 셔플이 발생한 데이터를 
저장해두었기 때문에 첫번째 stage가 skip 되었다.`        

<img width="1500" alt="스크린샷 2023-02-04 오후 9 42 36" src="https://user-images.githubusercontent.com/26623547/216768390-a84e6760-70f1-40cc-854b-3f71b78817a3.png">   

아래 처럼 count action을 한번 더 실행 했을 때는 stage skip 된 것을 확인할 수 있다.    


<img width="1500" alt="스크린샷 2023-02-04 오후 9 43 31" src="https://user-images.githubusercontent.com/26623547/216768399-afb7178c-dd96-400e-abe7-11710c42402d.png">


여기서 주의해야할 점은 디버깅 용으로 위처럼 로그를 추가해놓으면, 로그를 볼때 
혼란 스러울 수 있다는 점이다.     
셔플 데이터가 저장되었기 때문에 반드시 1번만 출력된다는 보장이 없다.   
왜냐하면 Spark는 장애가 발생하면 recomputation을 진행하기 때문에, 
    로그가 출력되는 경우와 미출력되는 경우가 상황에 따라 다르게 노출될 수 있다.     

- - - 

**Reference**    

<https://fastcampus.co.kr/data_online_spkhdp>    
<https://databricks.com/blog/2015/04/13/deep-dive-into-spark-sqls-catalyst-optimizer.html>   
<https://www.popit.kr/spark2-0-new-features1-dataset/>    

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

