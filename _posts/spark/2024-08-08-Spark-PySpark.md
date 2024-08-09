---
layout: post
title: "[Spark] PySpark 설정과 주요기능"   
subtitle: ""             
comments: true   
categories : Spark   
date: 2024-08-08     
background: '/img/posts/mac.png'   
---

jupyterlab을 통해 pyspark를 실행시키는 방법을 살펴보자.    

- - - 

## 1. 설치   

```
brew install apache-spark
brew install jupyterlab   
```

pyspark를 실행할 때 아래 2개의 환경변수를 .bashrc 또는 .zshrc에 넣어주면 
pyspark를 실행하면 jupyterlab을 실행하게 된다.   

```
export PYSPARK_DRIVER_PYTHON=jupyter
export PYSPARK_DRIVER_PYTHON_OPTS='notebook'
```

pyspark를 실행하면 즉시 jupyterlab이 실행된다.   

```
pyspark
```

- - - 

**Reference**   



{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

