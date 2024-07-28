---
layout: post
title: "[Airflow] 아파치 Airflow - Xcom "
subtitle: "Cross Communication / Task 간 데이터 공유(push, pull)"    
comments: true
categories : BigData
date: 2021-03-09
background: '/img/posts/mac.png'
---

## 1. Xcom (Cross Communication) 란?   

`Airflow DAG 내에 Task 간에 데이터 공유를 위해 사용되는 기술이다.`   

더 자세한 내용은 [공식문서](https://airflow.apache.org/docs/apache-airflow/stable/core-concepts/xcoms.html)를 
참고하자.   

> 예를 들면, Task1의 수행 중 내용이나 결과를 Task2에서 사용 또는 입력으로 주고 싶은 경우   
있을 수 있다.   

`주로 작은 규모의 데이터 공유를 위해 사용되며, Xcom 내용은 
메타 DB의 Xcom 테이블에 값이 저장된다.`   

> 대용량 데이터 공유를 위해서는 s3, hdfs 등의 외부 솔루션을 권장한다.   

- - - 

## 2. Xcom 사용 방법   

이제 Xcom을 사용하는 몇 가지 방법을 알아보고 예제를 통해 살펴보도록 하자.   

- PythonOperator return 값을 이용한 Xcom 사용    
- push-pull을 이용한 Xcom 사용   
- Jinja templates을 이용한 Xcom 사용   

### 2-1) PythonOperator return 값을 이용한 Xcom 사용    

PythonOperator에서 return을 하면 Airflow xcom에 자동으로 push 되기에 return하는 함수를 만들어 하나의 
task로 실행시켰다.    


```python
def return_xcom():
    return "xcom!"
    
return_xcom = PythonOperator(
    task_id = 'return_xcom',
    python_callable = return_xcom,
    dag = dag
)
```   

<img width="945" alt="스크린샷 2024-07-28 오후 4 26 15" src="https://github.com/user-attachments/assets/69e0c8e1-1c68-4168-ae24-6f6e2aed3282">    


### 2-1) push-pull 을 이용한 Xcom 사용   

`PythonOperator에서 return을 하는 방법 이외에도 아래와 같이 context['ti']를 
이용하여 xcom에 push, pull 하여 데이터를 주고 받는 것이 가능하다.`    

PythonOperator를 사용하는 경우 return과 push를 하나의 task에서 중복하여 
사용할 수 있으며, 해당 데이터를 전달 받는 곳에서 전달 받는 방식이 
다르다는 것을 코드로 확인해보자.   

```python
### task_instance 는 ti와 동일한 의미로 축약하여 사용할 수 있다.   

### 중요! 
### return으로 xcom을 사용하는 경우 xcom_pull(task_ids)를 사용해 데이터를 전달 받는다.   
### push 하는 경우에는 key-value 형식에 따라 데이터를 주고 받게 된다.   

from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.python_operator import PythonOperator

# ...

dag = DAG(
    'push_pull_xcom_test',
    default_args=default_args,
    description='My first tutorial bash DAG',
    schedule_interval= None
)

def return_xcom():
    return "xcom!"

def xcom_push_test(**context):
    xcom_value = "xcom_push_value"
    
    ## push 로 xcom을 사용하는 경우 key-value로 데이터를 전달 받을 수 있다.   
    context['task_instance'].xcom_push(key='xcom_push_value', value=xcom_value)

    ## return으로 xcom을 사용하는 경우 task_ids로 데이터를 전달 받을 수 있다.
    return "xcom_return_value"

def xcom_pull_test(**context):
    # return 으로 xcom 사용한 데이터 전달 받기 (task_ids)
    xcom_return = context["task_instance"].xcom_pull(task_ids='return_xcom')
    
    # push 로 xcom 사용한 데이터 전달 받기 (key-value)
    xcom_push_value = context['ti'].xcom_pull(key='xcom_push_value')
    
    # return 으로 xcom 사용한 데이터 전달 받기 (task_ids)
    xcom_push_return_value = context['ti'].xcom_pull(task_ids='xcom_push_task')

    print("xcom_return : {}".format(xcom_return)) 
    print("xcom_push_value : {}".format(xcom_push_value)) 
    print("xcom_push_return_value : {}".format(xcom_push_return_value))

return_xcom = PythonOperator(
    task_id = 'return_xcom',
    python_callable = return_xcom,
    dag = dag
)

xcom_push_task = PythonOperator(
    task_id = 'xcom_push_task',
    python_callable = xcom_push_test,
    dag = dag
)

xcom_pull_task = PythonOperator(
    task_id = 'xcom_pull_task',
    python_callable = xcom_pull_test,
    dag = dag
)

return_xcom >> xcom_push_task >> xcom_pull_task
```   

Output   

```
[2024-07-28 07:42:15,382] {logging_mixin.py:104} INFO - xcom_return : xcom!
[2024-07-28 07:42:15,384] {logging_mixin.py:104} INFO - xcom_push_value : xcom_push_value
[2024-07-28 07:42:15,385] {logging_mixin.py:104} INFO - xcom_push_return_value : xcom_return_value
```

위 결과를 확인해보면, return을 통해 xcom을 사용한 경우와 push를 통해 xcom을 사용한 경우 각각 데이터를 전달 받는 방법이 다른 것을 
확인할 수 있다.   


<img width="953" alt="스크린샷 2024-07-28 오후 4 50 04" src="https://github.com/user-attachments/assets/aad0b240-3d49-4af6-aebf-ed21ae458d5f">    




### 2-3) Jinja templates을 이용한 Xcom 사용    

마지막으로 jinja template를 이용하여 전달받는 방식이다.   
여기서는 BashOperator를 사용해 예제를 표현했지만 다른 Operator에서도 
동일하게 사용하는 것이 가능하다.  

아래 예시와 같이 jinja template을 사용하여 dag 실행시 값을 할당하여 사용한다.   

```
{{ dag_run }}
{{ ts }}
{{ ds }}
```

airflow 에서 더 많은 사용 예시는 [공식문서](https://airflow.apache.org/docs/apache-airflow/stable/templates-ref.html)를 
확인하자.    

```python
bash_xcom_push = BashOperator(
    task_id='bash_xcom_push',
    bash_command='echo "{% raw %}{{ ti.xcom_push(key="bash_xcom_push", value="bash_xcom_push_value") }}{% endraw %}"',
    dag=dag
)

bash_xcom_pull = BashOperator(
    task_id='bash_xcom_pull',
    bash_command='echo "{% raw %}{{ ti.xcom_pull(key="bash_xcom_push") }}{% endraw %}"',
    dag=dag
)

```


- - - 

**Reference**    

<https://blog.naver.com/gyrbsdl18/221561318823>   
<https://zzsza.github.io/data/2018/01/04/airflow-1/>   
<https://letzgorats.tistory.com/entry/Airflow-Python-Operator%EC%97%90%EC%84%9C-Xcom-%EC%82%AC%EC%9A%A9>   

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

