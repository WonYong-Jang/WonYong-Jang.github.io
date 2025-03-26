---
layout: post
title: "[Flink] Apache Flink 를 Kotlin으로 구현하기"
subtitle: "flink를 이용하여 kafka consume, s3 sink" 
comments: true
categories : BigData
date: 2025-03-19
background: '/img/posts/mac.png'
---

이번 글에서는 Flink를 코틀린 언어로 구현할 때 필요한 설정 및 클래스들을 
살펴보자.   
또한, Flink에서 여러 Job들을 실행시키기 위한 프로젝트 구조를 
구성해보고 kafka를 데이터소스로 하여 consume 후 sink 하는 예제도 살펴보자.  

- - - 

## 1. Execution Environment  

Flink에서 Execution Environment는 Flink Application을 개발할 때 가장 먼저 획득하는 인스턴스의 
클래스이다.   

`스트리밍 프로그램이 실행되는 컨텍스트는 StreamExecutionEnvironment 이다.`   

아래와 같이 WordCount 예제를 살펴보면, StreamExecutionEnvironment.getExecutionEnvironment() 코드를 살펴볼 수 있다.  
Flink Application이 독립적으로 실행(IDE에서 실행되거나 클러스터에 
        제출하지 않고 바로 실행)되면 LocalStreamEnvironment Conext를, 
      Flink Cluster에서 실행되면 RemoteStreamEnvironment Context를 반환한다.  

`그 후 최종적으로 Flink Job을 제출하는 것은 env.execute()로 실행된다.`     


```kotlin
import org.apache.flink.api.common.functions.FlatMapFunction
import org.apache.flink.api.common.typeinfo.TypeHint
import org.apache.flink.api.common.typeinfo.TypeInformation
import org.apache.flink.api.java.tuple.Tuple2
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment
import org.apache.flink.util.Collector

internal class WordCounterJob {
    private val words = """
            The quick brown fox jumps over the lazy dog.
            The quick blue fox jumps over the lazy dog.
            The quick brown cat jumps over the lazy dog.
            The quick blue cat jumps over the lazy dog.
        """.trimIndent()

    fun execute(args: Array<String>) {
        val env = StreamExecutionEnvironment.getExecutionEnvironment()

        val source = env.fromElements(words).name("in-memory-source")
        val counts = source
            .flatMap(object : FlatMapFunction<String, Tuple2<String, Int>> {
                override fun flatMap(value: String, out: Collector<Tuple2<String, Int>>) {
                    val tokens = value.lowercase().split("\\W+".toRegex())
                    for (token in tokens) {
                        if (token.isNotEmpty()) {
                            out.collect(Tuple2(token, 1))
                        }
                    }
                }
            })
            .returns(TypeInformation.of(object : TypeHint<Tuple2<String, Int>>() {}))
            .name("tokenizer")
            .keyBy { it.f0 }
            .sum(1)
            .name("counter")
        counts.print().name("print-sink")

        env.execute("JeremyWordCount")
    }
}
```

- - - 

## 2. FlinkJob Interface   


```kotlin
import org.apache.flink.api.common.restartstrategy.RestartStrategies
import org.apache.flink.core.execution.CheckpointingMode
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment
import kotlin.reflect.KClass

interface FlinkJob {
    fun run(env: StreamExecutionEnvironment)

    fun enableCheckpoint(env: StreamExecutionEnvironment, clazz: KClass<out FlinkJob>) {
        
        env.enableCheckpointing(60_000, CheckpointingMode.EXACTLY_ONCE)
        env.checkpointConfig.enableUnalignedCheckpoints()
    }


    fun setRestartStrategy(env: StreamExecutionEnvironment, attempts: Int = 5, delay: Long = 10_000) { 
        env.restartStrategy = RestartStrategies.fixedDelayRestart(attempts, delay)
    }
}
```


- - - 

## s3 sink 

데이터를 최종적으로 s3에 parquet 파일로 s3에 sink 해보자.   

Fink 에서 Bulk(or Batch) 단위로 데이터 쓰기가 가능하다.   
Flink 는 Batch 모드 또는 Stream 모드로 동작하는데 `Flink가 Batch 모드로 
동작하는 경우, 모든 실행이 완료되는 시점에 Parquet File 에 write가 한번에 진행된다.`    
`반면, Stream 모드인 경우에는 시간 주기로 혹은 Checkpoint(or savepoint) 생성 시점에 write가 가능하다.`      




- - -

<https://flink.apache.org/>   
<https://monsters-dev.tistory.com/69>  


{% highlight ruby linenos %}
{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}







