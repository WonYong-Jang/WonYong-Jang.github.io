---
layout: post
title: "[Spark] Data Skew 해결을 위한 Salting 기법"   
subtitle: "Data skewness"             
comments: true   
categories : Spark   
date: 2024-04-10   
background: '/img/posts/mac.png'   
---


데이터 엔지니어링 과정에서 join, group by 와 같은 shuffle이 발생하는 
연산을 사용할 때, 특정 key에 데이터가 집중되는 경우가 발생할 수 있다.    

`즉, Data Skew는 데이터가 파티션들 간에 고르게 분산되지 않은 상황을 말한다.`   

이런 현상을 데이터 skew라고 하며, skew가 발생하게 되면 분산처리 성능에 
큰 영향을 끼치므로 반드시 해결해야 하는 문제 중 하나이다.   

Salting은 데이터 skew에 대한 대응책으로 자주 쓰이는 데이터 엔지니어링 기법 중 하나이다.    
Spark 3.0 부터는 [Adaptive Query Execution](https://wonyong-jang.github.io/spark/2024/04/15/Spark-Adaptive-Query-Execution.html)을 
제공하면서 설정만으로 skew 문제를 해결할 수 있게 되었지만, 해당 설정만으로 해결되지 않는 케이스에는 
해당 기법과 함께 사용이 필요할 수 있다.   

- - - 

## 1. Data Skew 예시   

Data Skew가 발생한 예시를 살펴보자.  

서울에서 전국 달리기 대회를 개최했고, 총 190 여명의 선수가 참가했으며 
다음과 같은 선수 데이터가 만들어 졌다.   

##### runner 테이블    

<img width="600" alt="Image" src="https://github.com/user-attachments/assets/7ef802ec-844d-48ce-976f-ab96d0a346cb" />    

아무래도 서울에서 개최된 경기이다보니, 서울 근처에서 가장 많이들 참가했다.   
지역별 참가자 수는 다음과 같다.   

##### city 테이블   

<img width="340" alt="Image" src="https://github.com/user-attachments/assets/67dcbc51-a9eb-4fd2-86e0-836a9c1917d7" />  

데이터 분석을 위해, 여기에 각 지역의 평균 연령 데이터를 join 한다고 가정해보자.   

<img width="311" alt="Image" src="https://github.com/user-attachments/assets/8e4238d3-96a7-418d-b1a7-74bad596bf14" />  

우선 salting 없이 그냥 join하려면 다음과 같이 하면 된다.   

```python
joined_df = runner.join(city, on='city', how='left')
```

> data skew는 join할 때 유니크 키가 아닌 키로 조인할 경우 skew 현상이 더 두드러지게 나타난다.    

위에서 선수 데이터와 광역단체 데이터는 각각 runner, city 의 
spark DataFrame으로 정의되어 있다고 가정하자.   
아래 spark UI를 통해 데이터 분산 처리 내역을 확인해보면, 
    Data Skew가 발생하고 있음을 확인할 수 있다.   

`특정 2개의 파티션에만 데이터가 skew 되었고, 데이터 사이즈가 커질 수록 
다른 파티션은 이미 작업이 완료 되었지만 특정 2개의 파티션만 작업이 늦게 끝나게 되어 
전체 성능에 영향을 끼칠 것이다.`     

<img width="959" alt="Image" src="https://github.com/user-attachments/assets/0563c069-731e-4a9b-9caf-8887ff826c41" />   

이렇게 되는 이유는 선수들이 서울과 경기도에 몰려있고, city를 key로 join 할 경우 
서울이나 경기도를 처리하는 join 파티션에 이 데이터들이 
전부 몰려가기 때문이다.   

- - - 

## 2. Salting Join - 기본   

요리를 할 때 소금을 뿌림으로써 재료의 맛과 향을 더해줄 수 있다. spark의 salting 기법도 
요리에서 소금을 뿌리는 것과 비슷하게 데이터가 더 잘 처리될 수 있도록 도와주는 역할을 한다.   


이제 salting 기법을 이용해 Data Skew 를 해결해보자.   

```python
salt_size = 10

runner_2 = runner.withColumn("salt", lit(rand() * salt_size).cast("int"))

city_2 = city.withColumn("salt", explode(array([lit(i) for i in range(salt_size)])))

joined_2 = runner_2.join(city_2, on=['city', 'salt'], how='left')
```


- 소금 크기(salt_size)라는 변수를 정의 한다.    
- runner 데이터에 소금(salt) 컬럼을 추가한다. 이 열의 값은 0과 9 사이의 랜덤 정수값이다.   
- city 데이터에 소금(salt) 컬럼을 추가한다. 이 열의 값은 0에서 9까지 모든 정수 값이다. 즉, 
    기존 데이터의 1개 행을 10개 행으로 복제하고, 각각 값이 0 ~ 9인 소금 열을 추가해준다. 이 과정에서 
    0 ~ 9 값을 가지는 array를 생성 후 explode를 이용하여 각 요소를 개별 행(row)으로 추가해주었다.   
- `소금(salt) 컬럼이 추가된 두 개 데이터를 join 하는데, key 로는 city, salt 둘 다 사용한다.`  


salt 컬럼이 추가된 선수 데이터 프레임은 아래와 같다.   

<img width="650" alt="Image" src="https://github.com/user-attachments/assets/e9ad7ecd-c317-4f15-a5e5-e58a235b7001" />   

salt 컬림이 추가된 지역 데이터 프레임은 아래와 같으며, `각 행이 10개씩 복제되어 
데이터 크기가 10배로 커졌다.`     

<img width="500" alt="Image" src="https://github.com/user-attachments/assets/9c012949-f7e4-4690-990b-76f8d73d217e" />   

spark UI를 통해 join 과정을 살펴보면, Data Skew 가 상당히 완화된 것을 확인할 수 있다.   

<img width="960" alt="Image" src="https://github.com/user-attachments/assets/bb5df2a4-c0b1-4ad4-a20c-31b4feb5c78c" />   


salting을 한마디로 말하면, 새로운 join key를 추가하여 데이터를 더 잘개 쪼개주는 것이다.    
`그 새로운 join key가 소위 소금(salt)이며, 데이터를 얼마나 잘게 더 쪼갤지를 결정하는 것이 
소금의 크기(salt_size)이다.`   

하지만 salting은 마냥 좋기만 한 것은 아니다, `데이터가 쏠리는 파티션들이 줄어드는 대신, 
    한쪽의 데이터가 소금의 크기 만큼 복제되어야 하기 때문에 그만큼의 네트워크 및 
    메모리 추가를 일으킨다.`   
`이 때문에, salt_size를 적정한 수준으로 결정할 필요가 있다.`   

- - - 

## 3. Salting Join - 심화   

앞에서, 적절한 salt size를 설정함으로써 salting은 꽤 효과적으로 
동작할 수 있음을 확인했다.   
다만, 실무에서 이 적절한 소금 크기를 결정하는 것이 만만치 않은 경우도 있다.   
예를 들어, 복제되어야 하는 쪽의 데이터가 매우 클 경우 아무리 작은 
소금 크기라도 부담스로울 수 있다.   

이럴 때는 `소금 크기를 데이터에 맞춰 동적으로 설정함으로써 데이터 
복제 부하를 최소화 할 수도 있다.`      
이런 과정까지를 포함한 심화된 버전의 코드는 다음과 같다.   


```

```

- 하나의 join key에 모여드는 데이터 크기(aggregation_limit)를 정한다. 여기서는 
하나의 key 당 10명의 선수만 모여들게 하겠다는 의미가 된다.   
- 지역별 선수 숫자를 계산하여 runner_count에 담는다.   
- 지역별 선수 숫자에 따른 소금 크기를 계산해주는 함수를 정의한다. 이 함수는 
기본적으로 선수 숫자를 aggregation_limit으로 나눈다.


최종 join 결과에서 각 지역마다 적절한 소금 크기가 사용된 것을 확인할 수 있다.   

<img width="815" alt="Image" src="https://github.com/user-attachments/assets/c4019656-4848-491b-81f2-345a301c09b5" />   




- - - 

**Reference**   

<https://mesh.dev/20220130-dev-notes-008-salting-method-and-examples/>    
<https://gyuhoonk.github.io/spark-salting>     
<https://suminii.tistory.com/entry/Spark%EC%97%90%EC%84%9C-Data-Skew-%ED%95%B4%EA%B2%B0%ED%95%98%EA%B8%B0-%EB%8D%B0%EC%9D%B4%ED%84%B0%EA%B0%80-Even%ED%95%98%EA%B2%8C-%EB%B6%84%EC%82%B0%EB%90%98%EC%A7%80-%EC%95%8A%EC%95%98%EC%96%B4%EC%9A%94>   
<https://medium.com/@suffyan.asad1/handling-data-skew-in-apache-spark-techniques-tips-and-tricks-to-improve-performance-e2934b00b021>     

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

