---
layout: post
title: "[AWS] Event Bridge"
subtitle: "Event bridge dead letter queue, CloudWatch Log group, Monitoring"
comments: true
categories : AWS
date: 2023-10-22
background: '/img/posts/mac.png'
---

이번 글에서는 AWS Event Bridge를 사용할 때 데이터 loss가 발생할 수 있는 
부분과 이에 따라 모니터링 및 Event Bridge에서 사용할 수 있는 
재처리 방법(Dead Letter Queue)에 대해 살펴볼 예정이다.     

현재 업무에서 사용하고 있는 파이프라인 flow는 아래와 같다.    

3rd(Zendesk) -> Event Bridge -> Kinesis -> Spark Streaming(EMR Cluster)   

위 파이프라인으로 운영 중 데이터 볼륨이 크게 증가했고, 이때 Event Bridge에서 
Kinesis로 데이터 전달 시 loss가 발생했다.   

이러한 문제가 발생한 경우 확인 할 수 있는 모니터링 방법과 데이터 처리 실패시 재처리 할 수 있는 구조에 대해 
자세히 살펴보자.   


- - - 

## 1. Event Bridge 란?   

`Amazon EventBridge는 다양한 소스의 데이터와 어플리케이션을 연결하는데 
사용할 수 있는 서버리스 이벤트 버스 서비스이다.`      
즉, 이벤트 소스의 실시간 이벤트 스트림을 원하는 대상으로 전송하는 역할을 한다.   


- - - 

## 2. Event Bridge Monitoring Metrics   

Event Bridge는 자체적으로 대상(Kinesis)에 성공적으로 전달하지 못할 시 
이벤트 전송을 재시도 한다.   
대상에 대한 재시도 정책 설정에서 시도 시간 및 재시도 횟수를 설정할 수 있으며, 
    기본적으로 이벤트 전송을 24시간 동안 185회까지 재시도 한다.   

`하지만 데이터 수가 평소보다 대량으로 증가했을 때, Event Bridge의 모니터링 지표에
Failedinvocations 가 증가했음을 확인했다.`   

`FailedInvocations 지표가 증가했다는 것은 해당 기간 Event Bridge가 이벤트를
대상(Kinesis) 전달 했으나 호출에 실패 했음을 의미한다.`    

- - - 

## 3. Dead Letter Queue   

위에서 Failedinvocations 지표가 증가했기 때문에, 실패한 이벤트들에 대해서 재처리를 진행해주어야 한다.  

`Event Brige에서 DLQ(Dead Letter Queue)를 적용해 줄 수 있고, 이 때 실패한 데이터에 대해서 
해당 queue로 보내지게 되어, 지속적으로 대상을 호출하는 것을 시도 한다.`   

> 현재 업무에서는 AWS SQS를 사용하여 Dead Letter Queue를 구성하였다.   

자세한 내용은 [공식문서](https://docs.aws.amazon.com/ko_kr/eventbridge/latest/userguide/eb-rule-dlq.html) 를 
참고하자.   

- - - 

## 4. CloudWatch Log Group   

재처리(Dead Letter Queue) 적용 이후에도 데이터 loss 문제가 발생했고, Event Bridge 에 실제 데이터가 
있는지 트래킹이 필요했다.   

`관련하여 실제 3rd 파트너에서 발생한 이벤트가 이벤트 버스로 수신되지 않았음을 판단하기 위해서는 
Event Bridge로 수신된 이벤트를 확인해야 하는데, 이때 추가적인 로깅 활성화를 진행할 수 있다.`     

[문서](https://docs.aws.amazon.com/ko_kr/eventbridge/latest/userguide/eb-logging-monitoring.html)에서 Event Bridge 규칙의 대상으로 사용할 CloudWatch Log Group 생성하는 가이드 참고하자.    

CloudWatch Log Group을 대상으로 지정하게 되면, Event Bridge로 수신되는 이벤트들이 CloudWatch Log Group에 
로깅되며 이를 통해 수신 된 이벤트 로그들을 검사 할 수 있다.   

- - -   

**Reference**

<https://docs.aws.amazon.com/ko_kr/eventbridge/latest/userguide/eb-monitoring.html>   
<https://docs.aws.amazon.com/ko_kr/eventbridge/latest/userguide/eb-rule-dlq.html>    
<https://docs.aws.amazon.com/ko_kr/eventbridge/latest/userguide/eb-logging-monitoring.html>   

{% highlight ruby linenos %}


{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

