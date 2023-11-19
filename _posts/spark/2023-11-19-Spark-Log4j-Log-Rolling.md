---
layout: post
title: "[Spark] Log4j를 이용한 Log Rolling(RollingFileAppender)"   
subtitle: "Custom Log4j 사용하기  / Long Running Spark Streaming 에서 Log Rolling  "    
comments: true
categories : Spark
date: 2023-11-19
background: '/img/posts/mac.png'
---

이번 글에서는 Spark 에서 Custom Log4j를 사용하여 로깅하는 방법과  
Spark Streaming과 같이 24/7 을 수행하는 어플리케이션에서 log 를 
관리하는 방법에 대해 살펴보자.   

`spark streaming은 24/7을 수행하여서 매우 빠른 속도로 로그가 증가하기 때문에
적절한 로그 관리가 없다면, 어플리케이션은 디스크 부족으로 중단될 수 있다.`   

> EMR Cluster 에서 spark streaming을 실행하며 YARN 리소스 매니저를 사용하는 것을 전제로 
설명할 예정이다.   

- - -

## 1. How logging works in spark   

YARN 의 기본 단위는 container이며, 각 container는 자신의 디렉토리를 가지고 있다.   
driver와 executor 들은 자신만의 container를 가지고 있고, 로그가 저장된다.   

> custom log4j 파일을 사용하지 않는다면 default로  
master node에 /etc/spark/conf/log4j.properties 를 사용할 것이다.   

```
# Set everything to be logged to the console
log4j.rootCategory=INFO,console
log4j.appender.console=org.apache.log4j.ConsoleAppender
log4j.appender.console.target=System.err
log4j.appender.console.layout=org.apache.log4j.PatternLayout
```

`YARN container log 디렉토리는 일반적으로 spark.yarn.app.container.log.dir 에 위치해 있고,  
     stderr과 stdout 파일을 가지고 있다.`   


- - - 

## 2. Managing Spark logs   

`일반적으로 디스크 공간을 관리하기 위한 방법은 아래와 같이 RollingFileAppender 사용과 
적절한 로그 레벨을 관리하는 것이다.`      

spark 로그를 WARN 레벨 이상만 쓰도록 하였고, RollingFileAppender를 사용하여 
100MB가 되면 새로운 파일로 로그를 작성하여 최대 10개까지만 유지하도록 하였다.   
즉, 10개 파일을 넘기게 되면 가장 오래된 파일을 삭제한다.  

이렇게 로그를 유지하게 되면, 노드의 디스크 사용량을 적절하게 유지하여 어플리케이션의 
중단을 막을 수 있다.  

또한, production 환경에서 logpusher 등을 통해 주기적으로 s3에 로그를 동기화하는데, 
    log를 rolling 하여 주기적으로 동기화하게 되면 
    노드가 비정상적으로 다운되었을 때 로그 손실을 막을 수 있다.   


```
log4j.appender.RollingAppender=org.apache.log4j.RollingFileAppender
log4j.appender.RollingAppender.File=${spark.yarn.app.container.log.dir}/spark.log
log4j.appender.RollingAppender.MaxFileSize=100MB
log4j.appender.RollingAppender.MaxBackupIndex=10
log4j.appender.RollingAppender.layout=org.apache.log4j.PatternLayout
log4j.appender.RollingAppender.layout.ConversionPattern=[%p] %d %c - %m%n
log4j.logger.org.apache.spark=WARN, RollingAppender
```

`추가적으로 spark event log는 default로 true로 활성화 되어 있으며, 이는 빠르게 
로그를 증가 시키므로 불필요하다면 false로 설정하는 것이 권장된다.`      

> spark.eventLog.enabled=false   


- - - 

## 3. Overriding default spark loggings settings   

`default spark settings은 spark-submit 에 의해 override 된다.`   
따라서 아래와 같이 custom log4j-prod.properties를 지정해 주어서 driver와 executor에서 
사용할 수 있도록 한다.      

```
spark-submit 
//...

// 어플리케이션과 함께 spark 클러스터에 upload 되기 위한 파일들을 지정해준다.   
--files s3://file/log4j-prod.properties    


--conf "spark.driver.extraJavaOptions=-Dlog4j.configuration=log4j-prod.properties" 
--conf "spark.executor.extraJavaOptions=-Dlog4j.configuration=log4j-prod.properties"
```  

`여기서 주의할 점은 spark-submit을 사용할 때, Spark cluster classpath가 app의 classpath보다 우선시 한다는 것이다.`  

`fat jar의 파일이 cluster settings를 override하지 못하기 때문에 위와 같이 추가로 files 옵션을 사용하였다.`   
`--files 옵션은 클러스터의 각 노드에 해당 파일을 전달해주며, executor의 working directory에 위치 시켜준다.`   




- - - 

**Reference**   

<https://medium.com/@faberlow/logging-in-a-spark-streaming-application-d34b753df930>   
<https://issues.apache.org/jira/browse/SPARK-10881>   
<https://stackoverflow.com/questions/24571922/apache-spark-stderr-and-stdout>   
<https://stackoverflow.com/questions/28840438/how-to-override-sparks-log4j-properties-per-driver>   

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

