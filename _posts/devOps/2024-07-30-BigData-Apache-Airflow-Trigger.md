---
layout: post
title: "[Airflow] 아파치 Airflow - Trigger "
subtitle: "Trigger DAG 이용하여 arguments 전달(dag_run) / "    
comments: true
categories : DevOps
date: 2024-07-30
background: '/img/posts/mac.png'
---

이번 글에서는 airflow 를 실행할 때 Trigger DAG 를 이용하여 
arguments를 전달하는 방법과 Trigger를 사용하여 다른 DAG를 호출하는 방법에 대해 살펴보자.   

- - - 

## 1. Trigger Dag 를 통한 arguments 전달        

Trigger DAG 버튼을 클릭하게 되면 아래와 같이 json 형식으로 arguments를 전달 할 수 있다.    

<img width="650" alt="스크린샷 2024-07-28 오후 10 16 02" src="https://github.com/user-attachments/assets/81a336a7-6288-4f7b-9d1f-5c99b189122a">   

위와 같이 path 라는 key 값을 받아 출력해보려고 한다.   

```python
templated_command = """
    echo "dag_run.conf : {% raw %}{{ dag_run.conf }}{% endraw %}"
    echo "dag_run.conf.path : {% raw %}{{ dag_run.conf.path }}{% endraw %}"
    """

dag = DAG(
        'trigger_dag_test',
        default_args=default_args,
        schedule_interval=None,
)

t1 = BashOperator(
    task_id='bash_templated',
    bash_command=templated_command,
    dag=dag,
)

t1
```

Output

```
{bash.py:169} INFO - Output:
{bash.py:173} INFO - dag_run.conf : {'path': '/dir/'}
{bash.py:173} INFO - dag_run.conf.path : /dir/
```

위 결과를 보면 arguments로 전달한 값들이 정상적으로 출력됨을 확인할 수 있다.   

위와 같이 코드를 작성하게 되면 path 의 값이 없는 경우는 task가 실패하기 때문에 
값이 없는 케이스의 경우 [default 값](https://jinja.palletsprojects.com/en/3.0.x/templates/#jinja-filters.default)을 작성해주기도 한다.    

```python
{% raw %}{{ dag_run.conf.path | d("invalid path")}}{% endraw %}

## or 

{% raw %}{{ dag_run.conf.path | default("invalid path")}}{% endraw %}
```

empty 값에 대해서도 default value를 전달 할 수 있는데, 이때 아래와 같이 두번째 parameter에 
true를 추가해 주어야 한다.   

```python
{% raw %}{{ "" | default("invalid path", true)}}{% endraw %}
# 값이 empty인 경우 false로 간주하는데, false 인 경우에도 default 값을 출력해주기 위해서는 두번째 파라미터에 true로 지정한다.   
```


- - - 

## 2. Trigger를 이용하여 다른 DAG 실행   

`Trigger를 사용하려면 TriggerDagRunOperator를 사용하여야 한다.`

더 자세한 내용은 [공식문서](https://airflow.apache.org/docs/apache-airflow/stable/_api/airflow/operators/trigger_dagrun/index.html)를 살펴보자.   



```python
from airflow.operators.trigger_dagrun import TriggerDagRunOperator

call_trigger = TriggerDagRunOperator(
        task_id='call_trigger',
        trigger_dag_id='standby_trigger', # trigger 할 dag_id 를 추가 (필수값)
        trigger_run_id=None, # 실행중인 run_id를 입력하면 해당 run_id를 실행한다. None이나 default값은 자동 할당이다.
        execution_date=None, # 실행 날짜를 지정한다.
        reset_dag_run=False, # 해당 dag에 dag_run이 있을 경우 초기화 하고 다시 시작함
        wait_for_completion=False, # DAG_run이 완료 될때 까지 기다린다.
        poke_interval=60, # wait_for_completion을 true로 했다면, Trigger가 작동했는지 확인하는 간격을 지정 할 수 있다. 값을 정해주지 않는다면 기본값은 60이다.
        allowed_states=["success"], # Trigger를 실행할 state를 작성한다.list로 작성해야하며 default는 success이다.
        failed_states=None, # Trigger를 실행하지 않을 상태를 기입한다. list로 작성한다.
    )
```   

- - - 

**Reference**    

<https://dydwnsekd.tistory.com/64>   

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

