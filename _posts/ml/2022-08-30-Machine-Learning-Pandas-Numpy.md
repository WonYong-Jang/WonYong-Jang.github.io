---
layout: post
title: "[Machine Learning] ML 구현하기 위한 넘파이와 판다스 실습"
subtitle: "Indexing(slicing, fancy, boolean) / Reshape / DataFrame, Series / apply lambda / 판다스 결손 데이터 처리" 
comments: true
categories : ML
date: 2022-08-30
background: '/img/posts/mac.png'
---

## 1. 관련 패키지 설치    

머신러닝에 사용할 패키지를 설치하고, import 해보자.   

```
$ pip install scikit-learn==1.0.2
$ conda install -c anaconda py-xgboost
$ conda install -c conda-forge lightgbm

import sklearn
import xgboost
import lightgbm
import pandas as pd   
import numpy as np
import matplotlib.pyplot as plt
%matplotlib inline
```

- - -    

## 2. Numpy   

Numpy는 파이썬 머신러닝을 구성하는 핵심 기반으로 반드시 이해가 필요하다.  
머신러닝에서 반드시 사용하는 핵심 개념만 살펴보자.   

#### 2-1) ndarray 생성 및 차원   

Numpy 모듈의 array() 함수로 생성이 가능하며, 
      인자로 주로 파이썬 list 또는 ndarray 입력한다.   
아래와 같이 import해서 사용가능하며, 대용량 데이터를 사용할 때 
[1,2,3]와 같이 `파이썬의 list 보다 ndarray를 생성해서 사용하는게 성능에서 유리하다.`       

```
list1 = [1,2,3] // 파이썬의 list    
array3 = np.array(list1)    
print(type(array3))
output: <class 'numpy.ndarray'>    

array1 = np.array([1,2,3])
array2 = np.array([[1,2,3],[2,3,4]])     

array2.shape
output: (2,3)  // 행, 열 

array2.ndim
output: 2     // 2 차원   

array1.shape
output: (3,)
```

위처럼 ndarray의 shape는 ndarray.shape 속성으로 알 수 있고, 
    차원은 ndarray.ndim 속성으로 알 수 있다.   

`여기서 주의할 점은 1차원은 무조건 맨 뒤에 ,(콤마)가 들어가 있음을 
기억하자.`    

#### 2-2) ndarray 타입(type)   

ndarray내에 데이터값은 숫자 값, 문자열 값, 불 값 등 모두 가능하다.  
`단, ndarray내의 데이터 타입은 그 연산의 특성상 같은 데이터 타입만 가능하다.`   

> 즉, 한 개의 ndarray 객체에 int와 float가 함께 있을 수 없다.  

```
//ndarray내에 다른 타입이 들어오면, 큰 쪽으로 자동 형변환을 해준다.    
array1 = np.array([1,2,'test'])
print(array1, array1.dtype)   
output: ['1' '2' 'test'] <U21   
```

`대용량 데이터 다룰 시 메모리 절약을 위해서 형변환을 특히 고려해 주어야한다.`    

`타입을 변경할 수 있는데, astype()에 인자로 입력한다.`   

```
array1.astype(np.int32)

array1.dtype
output: dtype('int64')
```

`ndarray.dtype으로 데이터 타입을 확인 가능하다.`      


#### 2-3) ndarray를 편리하게 생성하기   

특정 크기와 차원을 가진 ndarray를 연속값이나 0또는 1로 초기화 생성해야 
할 경우 arrage(), zeros(), ones()를 이용해 
쉽게 ndarray를 생성할 수 있다.   

> 주로 테스트 용으로 데이터를 만들거나 데이터를 일괄적으로 초기화해야 
할 경우에 사용 된다.   

```
np.arange(5) // array([0, 1, 2, 3, 4])
np.zeros((3,2), dtype='int32')
// array([[0, 0],
       [0, 0],
       [0, 0]], dtype=int32)

np.ones((3,2))   // default float 64
// array([[1., 1.],
       [1., 1.],
       [1., 1.]])
```

#### 2-4) 차원의 크기를 변경하는 reshape   

reshape()는 ndarray를 특정 차원 및 형태로 변환한다. 변환 형태를 함수 인자로 
부여하면 된다.    
`reshape(-1,5)와 같이 인자에 -1을 부여하면 -1에 해당하는 axis의 크기는 
가변적이되 -1이 아닌 인자값(여기서는 5)에 해당하는 axis 크기는 인자값으로 
고정하여 ndarray의 shape를 변환한다.`    

```
array1 = np.arange(10)
array1.reshape(2,5)       // 2차원으로 reshape
// array([[0, 1, 2, 3, 4],
       [5, 6, 7, 8, 9]])

array1.reshape(-1,5)      // 위와 동일한 결과값   
```

reshape()는 reshape(-1,1), reshape(-1)과 같은 형식으로 변환이 요구되는 경우가 
많다. `주로 머신러닝 API의 인자로 1차원 ndarray를 명확하게 2차원 ndarray로 
변환하여 입력하기를 원하거나, 또는 반대의 경우가 있을 경우 reshape()를 
이용하여 ndarray의 형태를 변환시켜 주는데 사용된다.`     

```
array1 = np.arange(5)
array1.reshape(-1,1)     // 2차원으로 reshape    
// array([[0],
       [1],
       [2],
       [3],
       [4]])   


array1 = np.array([[0],
                   [1],
                   [2],
                   [3],
                   [4]])
array1.reshape(-1,)      // 1차원으로 reshape
// array([0, 1, 2, 3, 4])
```   

#### 2-5) indexing (slicing, fancy, boolean)  

ndarray는 axis를 기준으로 0부터 시작하는 위치 인덱스값을 가지고 있다.  
아래 여러 인덱싱 방법에 대해서 살펴보자.   


- 특정 위치의 단일값 추출: 해당 인덱스 값을 []에 명시하여 단일 값을 추출할 수 있다. 
마이너스가 인덱스로 사용되면 맨 뒤에서 부터 위치를 지정한다.    

- 슬라이싱(Slicing): 연속된 인덱스상의 ndarray를 추출하는 방식이다. : 기호 사이에 시작 인덱스와 
                     종료 인덱스를 표시하면 시작 인덱스에서 종료인덱스 -1 위치에 있는 ndarray를 반환한다.    

- 팬시 인덱싱(Fancy Indexing) : 일정한 인덱싱 집합을 리스트 또는 ndarray 형태로 지정해 해당 위치에 있는 ndarray를 반환한다.   

- 불린 인덱싱(Boolean Indexing) : 특정 조건에 해당하는지 여부인 True/False 값 인덱싱 집합을 기반으로 True에 해당하는 인덱스 위치에 있는 ndarray를 반환한다.   

```
// 1차원 
array1 = np.array([0,1,2])
array1[1]   // 단일값 추출 1
array1[-1]  // 2
array1[-2]  // 1

array1[:]   // 배열 전체 슬라이스 인덱싱   
array1[:2]  // array([0, 1])
array1[1:2] // array([1])

// 2차원 
array1 = np.array([[1,2,3],[4,5,6],[7,8,9]])
array1[0,0]  //  1
array1[0,1]  //  2
array1[1,1]  //  5

array1[: , :] // 전체 
array1[0:2, 0:2]
// output : array([[1, 2],
                  [4, 5]])

array1[:, 0]
// output: array([1, 4, 7])
```

다음으로 팬시 인덱스와 불린 인덱싱을 살펴보자.         

```
// 팬시 인덱싱 

array1 = np.array([10,11,12,13,14,15])
array1[[0,2,5]]  // 팬시 인덱싱으로 인덱스 집합을 지정하여 추출
// output: array([10, 12, 15])

array2d[ [0,1] , 2] // 2차원일 경우 
array2d[ [0,1], 0:2]
array2d[ [0,1] ]


// 불린 인덱싱 

ndarray값이 13 보다 큰 ndarray를 추출하고자 한다면?   
array1[array1 > 13]
// output: array([14, 15])   
```

#### 2-6) sort, argsort      

- np.sort(ndarray): 인자로 들어온 원 행렬은 그대로 유지한 채 원 행렬의 정렬된 행렬은 반환   
- ndarray.sort(): 원 행렬 자체를 정렬한 형태로 변환하며 반환 값은 None   

모두 기본적으로 오름차순으로 정렬하며, 내림차순으로 정렬하기 위해서는 [::-1]을 
적용한다.   

> np.sort()[::-1] 과 같이 사용   

```
// 2차원 배열에서 axis 기반의 sort()
array1 = np.array([[8,12],
                   [7,1]])
np.sort(array1, axis=0) // 행 기준 sort
// output: array([[ 7,  1],
                  [8, 12]])

np.sort(array1, axis=1) // 열 기준 sort 
// output: array([[ 8, 12],
                  [1,  7]])
```    

다음으로는 argsort 하는 방법이며, argsort의 반환값은 정렬된 값에 매핑된 
인덱스 값이 리턴된다. 
argsort는 추후 key value 맵핑할 때 효율적으로 사용할 수 있다.   

```
array1 = np.array([3,1,9,5])
result = np.argsort(array1)
// array([1, 0, 3, 2])
```

- - - 

## 3. Pandas   

판다스는 파이썬 데이터 처리를 위해 존재하는 가장 인기 있는 라이브러리이며, 
    특히 2차원 데이터를 효과적으로 가공, 처리할 수 있도록 제공한다.   

```
df = pd.read_csv('train.csv')   

display(df.head()) // 상위 부터 출력
display(df.tail()) // 하위 부터 출력   

// 옵션 변경 
pd.set_option('display.max_rows', 1000)      // 행이 많아서 생략될 경우 max 옵션 변경 
pd.set_option('display.max_colwidth', 100)   // 컬럼 길이가 길어서 생략될 경우 max 옵션 변경   
pd.set_option('display.max_columns',100)     // 컬럼이 많아서 생략될 때 max 옵션 변경
```

#### 3-1) DataFrame의 생성 및 기본 API     

직접 DataFrame을 생성해보고 기본 API를 확인해보자.   

```
df = pd.DataFrame(dict1) // DataFrame으로 변환    

print("columns:", df.colums) // 데이터 프레임의 컬럼들 확인   
print("columns:", df.index)  // 데이터 프레임의 인덱스 확인

df.info()  // DataFrame내의 컬럼명, 데이터 타입, Null건수, 데이터 건수 정보를 제공한다.   

df.describe() // 데이터값들의 평균, 표준편차, 4분위 분포도를 제공(단 숫자형 컬럼들에 대해서만 제공)   


// 동일한 개별 데이터 값이 몇건이 있는지 정보를 제공한다.
df['Pclass'].value_counts()
// Null 값을 포함하여 건수를 계산할지 옵션을 줄 수 있다.   
df['Embarked'].value_counts(dropna=False) // default로 true이며, false로 하게 되면 null 값 포함 계산을 해준다.   

df[['Embarked', 'Pclass']].value_counts()
```

#### 3-2) DataFrame과 리스트, 딕셔너리, 넘파이 ndarray 상호 변환    

- 리스트(list)를 DataFrame으로 변환   

    ```
    df = pd.DataFrame(list, columns=['name','age'])
    // 위와 같이 DataFrame생성 인자로 리스트 객체와 매핑되는 컬럼명들을 입력  

    // 인덱스도 명시적으로 변경 가능
    df = pd.DataFrame(list1, columns=['name','age'], index=['one','two'])
    ```

- ndarray를 DataFrame으로 변환   

    ```
    df = pd.DataFrame(array1, columns=['name', 'age'])
    ```

- 딕셔너리(dict)를 DataFrame으로 변환   

    ```
    dict = {'col1':[1, 11], 'col2':[2, 22], 'col3':[3,33]}
    df = pd.DataFrame(dict)
    // 위와 같이 딕셔너리의 키(key)로 컬럼명을 값(value)를 리스트 형식으로 입력   
    ```

- DataFrame을 ndarray로 변환   

    ```
    df.values
    ```

- DataFrame을 리스트로 변환  
    
    ```
    // DataFrame 객체의 values 속성을 이용하여 먼저 ndarray로 변환 후 tolist()를 이용하여 list로 변환   
    df.values.tolist()
    ```

- DataFrame을 딕셔너리로 변환   
   
    ```
    df.to_dict()
    df.to_dict('list')
    ```

#### 3-3) DataFrame의 컬럼 데이터 세트 생성과 수정   

DataFrame을 사용하면 Row, 컬럼을 수정 하는 등의 작업을 너무나 쉽게 할 수 있다.   

```
df['new_col'] = 0 // new_col 컬럼이 추가되고 0으로 모두 셋팅한다.   

// 데이터 삭제 
reuslt_df = df.drop(['age'], axis=1) // age라는 컬럼 삭제 

// inplace=True는 원본 DataFrame를 제거하며 반환 데이터는 None을 반환하기 때문에 주의  
// inplace=False 디폴트이며, 원본데이터는 그대로 두고 변경된 데이터를 반환해준다.  
df.drop(['age'], axis=1, inplace=True)
```

#### 3-4) DataFrame Index 및 필터링   

`판다스의 Index 객체는 RDBMS의 PK(Primary Key)와 유사하게 DataFrame(2차원), Series(1차원)의 
레코드를 고유하게 식별하는 객체이다.`       

`DataFrame/Series 객체는 Index 객체를 포함하지만 객체에 연산 함수를 
적용할 때 Index는 연산에서 제외된다. 오직 Index는 오직 식별용으로만 사용된다.`    


```
df.index         // 인덱스 범위 확인 
df.index.values  // 전체 인덱스 확인 
df.df.index[:5]
df.index.values[:5]
df.index[6]
```

`DataFrame에서 명칭, 위치 기반 인덱싱으로 자주 
사용하는 loc[], iloc[], boolean 인덱싱 살펴보자.`   

- 명칭 기반 인덱싱은 컬럼의 명칭을 기반으로 위치를 지정하는 방식이다. "컬럼명" 과 
같이 명칭으로 열 위치를 지정하는 방식(행 위치는 index를 이용)   

- 위치 기반 인덱싱은 0을 출발점으로 하는 가로축, 세로축 좌표 기반의 행과 열 위치를 
기반으로 데이터를 지정한다. (따라서 행, 열 위치값으로 정수가 입력된다. Index를 이용하지 
        않는다는 점을 주의하자)    

```
// 명칭기반 인덱싱 loc[]
// 0이라는 index는 행의 위치가 아니므로 인덱스를 문자로 지정했을 경우 
// 문자로 넣어주어야 한다.   
loc[0, 'PassenserId']      
loc['one', 'PassenserId']    

// 위치 기반 인덱싱 iloc[]    
iloc[0, 1]  
// 맨 마지막 컬럼 데이터를 가져올 때
df.iloc[:, -1]
// 맨 마지막 컬럼을 제외한 모든 데이터
df.iloc[:, :-1]


// 불린 인덱싱(boolean indexing)   
df[df['age']> 60]

// 조건에 맞는 행을 먼저 필터하고 Name, Age 컬럼 추출 
df[df['Age'] > 60 ][['Name', 'Age']]

// 개별 조건은 ()로 감싸주어야 한다.
df[ (df['Age'] > 60) & ( df['Pclass']==1 )]

// 조건식을 따로 만들어서 필터도 가능
cond1 = df['Age'] > 60
cond2 = df['Pclass'] == 1
df[ cond1 & cond2]
```

#### 3-5) DataFrame의 정렬 - sort_values()

`DataFrame의 sort_values() 메소드는 by 인자로 정렬하고자 하는 
컬럼값을 입력 받아서 해당 컬럼값으로 DataFrame을 정렬한다.`       
오름 차순 정렬이 기본이며 ascending=True로 설정되며, 내림차순 정렬시 
acending=False로 설정한다.   

```
df = df.sort_values(by=['Name'], ascending=True)
```

#### 3-6) DataFrame의 집합 연산 수행 - Aggregation      

```
df.count() // 전체 컬럼 별 건수
df[['Age' ,'Fare']].mean()  // 평균 
df[['Age' ,'Fare']].sum()   // 합
df[['Age' ,'Fare']].count() // 갯수 
```

#### 3-7) DataFrame Group By


```
df.groupby(by='Pclass').head()

df.groupby(by='Pclass').count() // Pclass groupby 별 각 컬럼 갯수 

df.groupby(by='Pclass')[['Age', 'Fare']].count() 

df.groupby(by='Pclass')[['Age','Fare']].agg([max, min])

// 서로 다른 컬럼에 서로 다른 aggregation 메소드를 적용할 경우 agg() 내에 컬럼과 적용할 메소드를 Dict 형태로 입력   
agg_format = {'Age': 'max', 'SibSp': 'sum', 'Fare': 'mean' }
df.groupby('Pclass').agg(agg_format)

// 위의 dict을 사용했을때, 문제점은 dict 객체에 동일한 key를 가지게 되면, 마지막 key가 덮어쓰게 된다.   
// 이럴 때, 아래와 같이 사용 가능   
df.groupby(['Pclass']).agg(age_max=('Age', 'max'), age_mean=('Age','mean'), fare_mean=('Fare', 'mean'))
```

#### 3-8) 결손 데이터(Missing Data) 처리하기   

Missing Data를 처리하는 방법은 크게 2가지가 있다.   

- isna(): DataFrame의 isna() 메소드는 주어진 컬럼값들이 NaN인지 True/False 값을 반환한다. (NaN이면 True)   

- fillna(): Missing 데이터를 인자로 주어진 값으로 대체한다.   

```
df.isna().head(3)  // NaN 인지 확인 (NaN이면 True)

df.isna().sum() // 각 컬럼별 NaN 건수
// 주의할 점은 count() 대신 sum()을 이용하여 NaN을 개수를 구할 수 있다.    

df.fillna('C000') // NaN 만나면 C000으로 변경   

df['Age'].fillna(df['Age'].mean()) // NaN 만나면 age의 평균값으로 채워넣는다.   
```

`보통 머신러닝 API가 NaN값을 취급하지 않기 때문에 이러한 Missing Data를 
처리해야 하는데, 문자값은 특정 문자열을 채워넣어주는 방식을 
사용하며 숫자값은 데이터 특성에 따라 다르지만 보통 평균 값을 채워 넣는 방식을 
사용 한다.`    

#### 3-9) nuique와 replace   

```
// nuique
df['Survived'].nunique() // 컬럼에서 몇건의 고유값이 있는지 파악   


// replace 원본 값을 특정 값으로 대체
df['Sex'].replace('male', 'Man')

// 여러 값을 바꿀 때 
df['Sex'].replace({'male': 'Man', 'female': 'Woman'})

// NaN을 replace로 처리할 수 있다.
df['Cabin'] = df['Cabin'].replace(np.nan, 'C000')
```

#### 3-10) Pandas 람다식 적용   

`판다스는 apply 함수에 lambda 식을 결합해 DataFrame이나 Series의 레코드별로 
데이터를 가공하는 기능을 제공한다.`   

```
// 입력인자 x를 기반으로 한 계산식이며, 호출 시 계산 결과가 반환된다.   
// Name 컬럼에 있는 값들의 길이를 구해서 새로운 컬럼에 update
df['Name_len'] = df['Name'].apply(lambda x: len(x))

// 15살 이하면, child 그렇지 않으면 adult로 적용 
df['Child_Adult'] = df['Age'].apply(lambda x : 'Child' if x<= 15 else 'Adult')

// 다중 if 
df['Child_Adult'] = df['Age'].apply(lambda x : 'Child' if x<= 15 else ('Adult' if x <= 60 else 'Elderly'))
```

- - -
Referrence 

<https://www.kaggle.com/>    
<https://www.inflearn.com/course/%ED%8C%8C%EC%9D%B4%EC%8D%AC-%EB%A8%B8%EC%8B%A0%EB%9F%AC%EB%8B%9D-%EC%99%84%EB%B2%BD%EA%B0%80%EC%9D%B4%EB%93%9C/unit/117912?tab=curriculum>    


{% highlight ruby linenos %}
{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

