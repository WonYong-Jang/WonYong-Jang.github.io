---
layout: post
title: "[Spark] Streaming Graceful Shutdown "   
subtitle: "How to do graceful shutdown of spark streaming job"    
comments: true
categories : Spark
date: 2021-04-19
background: '/img/posts/mac.png'
---

스파크 스트리밍 어플리케이션은 기본적으로 장시간 실행된다. 스파크 
스트리밍을 종료할 때 어떻게 하면 진행 중인 Job의 메시지 손실 없이 
정상적으로 종료 할 수 있을까?    

`만약 실행중인 스파크 스트리밍 어플리케이션을 강제로 kill 한다면 
스파크 스트리밍 큐에서 진행 중인 job에 대한 데이터가 손실될 수 있다.`        

graceful 하게 종료하기 전에는 다음과 같이 어플리케이션을 종료하였는데 
데이터 손실이 있을 수 있기 때문에 권장하지 않는다.   

```
$ yarn application -kill [applicationId]
```

스파크 스트리밍을 graceful 하게 종료 할수 있는 몇가지 방법이 있다.    
`여기서 graceful 하게 종료한다는 의미는 어플리케이션이 shutdown signal을 받게 되면 
더이상 진행중인 데이터 프로세싱을 받지 않는다는 것을 의미하며 
현재까지 진행중인 모든 데이터까지는 처리하고 종료 한다는 것을 의미한다.`       


- - - 

## 1. stopGracefullyOnShutdown parameter   

첫번째 방법은 spark.streaming.stopGracefullyOnShutdown 파라미터를 
true로 주는 방법이다.( default 는 false이다 )    
개발자가 더이상 코드에서 직접 ssc.stop()을 호출할 필요가 없다.
대신 SIGTERM 신호를 driver에게 보낸다.   

```
sparkConf.set(“spark.streaming.stopGracefullyOnShutdown","true") 
```

여기서 SIGTERM이란 프로세서를 중지시키는 안전한 방법이다. 반대로 
SIGKILL 신호를 프로세스에게 보낸다면 그 프로세서는 바로 중단한다.   

stopGracefullyOnShutdown 파라미터를 true로 주는 방법은 
아래와 같은 순서로 진행된다.   

1. Spark UI를 이용하여 driver 프로세스가 실행중인 노드를 찾는다.    

2. Driver가 실행중인 서버를 찾아 AM의 pid를 찾는다.   

3. kill -SIGTERM [AM-PID] 명령어를 이용하여 프로세스에 SIGTERM 신호를 보낸다.   

Spark driver는 SIGTERM 신호를 받은 후에 다음과 같은 로그 메시지를 확인 할수 있다.   

```
17/02/02 01:31:35 ERROR yarn.ApplicationMaster: RECEIVED SIGNAL 15: SIGTERM

17/02/02 01:31:35 INFO streaming.StreamingContext: Invoking stop(stopGracefully=true) from shutdown hook

...

17/02/02 01:31:45 INFO streaming.StreamingContext: StreamingContext stopped successfully

17/02/02 01:31:45 INFO spark.SparkContext: Invoking stop() from shutdown hook

...

17/02/02 01:31:45 INFO spark.SparkContext: Successfully stopped SparkContext

...

17/02/02 01:31:45 INFO util.ShutdownHookManager: Shutdown hook called
```

- - - 

## 2. implement graceful shutdown   

현재 업무에서 AWS를 이용하여 스파크 스트리밍을 배포하여 운영하고 
있고 Kinesis, EMR, S3, DynamoDB 등을 같이 사용하고 있다.    
그래서 S3를 이용하여 checkpoint와 같이 마커 파일을 s3에 저장하고 
graceful shutdown을 직접 구현하였다.   


[링크](https://medium.com/@manojkumardhakad/how-to-do-graceful-shutdown-of-spark-streaming-job-9c910770349c)를 참고하였으며 
진행 순서는 다음과 같다.    

- 스파크 스트리밍을 시작한 후 S3(checkpoint directory)에 현재 스파크 스트리밍을 
구분할 수 있는 이름을 가진 하나의 파일(마커)을 생성한다.    

    > 이름은 SparkContext에서 제공해주는 applicationId를 사용했다.    
    > 이 글에서는 S3에 마커를 저장했지만, 상황에 따라 hdfs, redis 등을 이용해도 된다.     

- 현재 진행중인 스파크 스트리밍의 Driver는 지속적으로 지정된 위치의 파일이 
존재하는지 확인한다.   

- `어플리케이션을 gracefully하게 종료하려면, S3에 저장한 파일을 삭제하면 된다. 그러면 
현재 처리 배치와 큐에 진행중인 배치까지 완료한 후에만 작업이 중지되므로 
데이터가 손실되지 않는다.`   

아래 코드를 살펴보자.   

```scala  
object GracefulShutdownExample {
  val s3Bucket = "s3-example"
  val shutdownPrefix = "flag/marker"
  var stopFlag = false
  def main(args: Array[String]) {
    val conf = new SparkConf().setAppName("SparkStreamingGracefulShutdown")
    val sparkConext = new SparkConext(conf)
    val appId = sparkConext.applicationId // 현재 실행중인 app id

    val ssc = new StreamingContext(conf, Seconds(5))
    val lines = ssc.socketTextStream("ljiang-spark-1.vpc.cloudera.com", 9999)
    lines.print()

    ssc.start()

    S3Util.createFlag(s3Bucket, shutdownPrefix/appId, "shutdown flag") // s3에 애플리케이션id를 저장   
    val checkIntervalMillis = 10000
    var isStopped = false

    // 주기적으로 s3 파일을 확인   
    while (! isStopped) {
      println("calling awaitTerminationOrTimeout")
      isStopped = ssc.awaitTerminationOrTimeout(checkIntervalMillis)
      if (isStopped)
        println("confirmed! The streaming context is stopped. Exiting application...")
      else
        println("Streaming App is still running. Timeout...")

      // s3에 shutdown 마커가 존재하는지 확인하며, 존재하지 않는다면 stopFlag = true 로 변경하여 스트리밍 종료를 진행   
      checkShutdownMarker(appId)    
      if (!isStopped && stopFlag) {    
        println("stopping ssc right now")        
        ssc.stop(sparkConext = true, stopGracefully = true) // Gracefully Shutdown   

        println("ssc is stopped!!!!!!!")  
      }
    }
  }

  def checkShutdownMarker(appId: String): Unit = {
    if (!stopFlag) {
      val shutdownMarkers = S3Util.getS3ObjectKey(s3Bucket, shutdownPrefix) // S3에서 해당 경로의 파일들을 모두 가져온다.   
      stopFlag = shutdownMarkers.exists(appId) // 현재 실행중인 스파크 스트리밍 어프리케이션을 appId로 확인    
    }

  }
}
```

scc.stop(true, true)에서 첫번째 true가 의미하는 것은 spark conext가 
중지 되는 것을 의미하며, 두번째 true가 의미하는 것은 graceful shutdown을 
의미한다.    

`주의할 점은 stop()은 Executor 내에서 처리하면 deadlock이 
발생시킬수 있으므로 Driver에서 처리 할수 있도록 하자.`    

- - - 

## 정리    

지금까지 스파크 스트리밍을 데이터 손실 없이 종료 하는 방법을 
알아 봤다. 만약 프로그램 수정이 필요하여 가장 최근 버전으로 
빌드된 jar파일로 변경해야 할 때는  스파크 스트리밍을 graceful하게 종료하고 
가장 최근에 빌드된 jar파일로 다시 시작을 하면된다.    

graceful하게 종료하여 데이터 손실을 막기는 했지만 
다운타임이 존재한다는 단점이 있기 때문에 무중단으로 
배포할 수 있는 방법이 있는지 알아봐야 할 것 같다.   



- - - 

**Reference**     

<http://why-not-learn-something.blogspot.com/2016/05/apache-spark-streaming-how-to-do.html>   
<https://www.linkedin.com/pulse/how-shutdown-spark-streaming-job-gracefully-lan-jiang/>   
<https://medium.com/@manojkumardhakad/how-to-do-graceful-shutdown-of-spark-streaming-job-9c910770349c>    
<https://github.com/lanjiang/streamingstopgraceful/blob/master/src/main/scala/com/cloudera/ps/GracefulShutdownExample.scala>   

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

