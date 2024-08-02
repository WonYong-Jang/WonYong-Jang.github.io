---
layout: post
title: "[Airflow] 아파치 Airflow - Dag run 이용하여 arguments 전달 "
subtitle: "Trigger Dag"    
comments: true
categories : BigData
date: 2021-03-11
background: '/img/posts/mac.png'
---

이번 글에서는 airflow 를 실행할 때 arguments를 전달하여 dag를 실행하는 
방법에 대해 살펴보자.    

- - - 

## 1. Trigger Dag    

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

**Reference**    

<https://dydwnsekd.tistory.com/64>   

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

