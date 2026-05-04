---
layout: post
title: "[Spark] Spark History Server MCP 와 AI Agent를 이용한 분석 자동화"
subtitle: "LangGraph, RAG" 
comments: true
categories : Spark
date: 2026-04-30
background: '/img/posts/mac.png'
---

[이전글](https://wonyong-jang.github.io/spark/2025/10/06/Spark-History-Server-MCP.html)에서 Spark History Server와 MCP 연동을 통해 
AI 와 연동했을 때 업무에 도움이 될 수 있는지에 대한 PoC를 진행했었다.   

PoC 를 진행하면서 긍정적인 부분은 MCP가 실제 Spark History Server를 바라보고 있기 때문에 
어플리케이션이 실행되면서 생성된 EventLog를 분석하고 그에 대한 병목지점과 솔루션을 
제안해 준다는 것이다.   
`즉, 현재 사용하고 있는 Spark 설정과 실행 계획 등을 직접 확인하고 답변을 해주기 때문에 
더욱 적절한 솔루션을 제안 받을 수 있다는 것이다.`      
`또한, 문제의 원인을 빠르게 찾을 수 있다는 장점이 있었다.`    
하나의 어플리케이션에서 굉장히 많은 spark stage가 구성되어 있는 잡에서 병목이 발생하게 되면, 
    Spark History Server UI 에 나열되어 있는 stage를 하나씩 클릭해 가며 병목 지점을 찾아야 한다.  
이 때, MCP 를 활용하게 되면 병목이 있는 stage 에 대해서 빠르게 분석하고 어떤 stage에서 병목이 어느정도 
발생하는지를 전달해 주게 되어 결과적으로 문제 원인을 빠르게 찾을 수 있다.  

이러한 장점들이 있기 때문에 Spark History Server MCP 를 서버로 구성해놓고 
팀원들이 Claude CLI 와 같은 Client를 통해서 MCP 서버를 바라보고 분석할 수 있는 구조로 사용하고 있다.  

여기서 더 나아가 AI Agent 를 이용하여 팀에서 실행되고 있는 모든 Spark 어플리케이션들을 
Daily로 분석하여 Slack 으로 레포트 해주는 시스템을 구성하고자 한다.  

- - - 

## 1. AI Agent 구성하기   

### 1-1) AI Agent의 Prompt 

좋은 답변을 얻으려면 구체적이고 명확한 프롬프트가 필수적이다. 단순히 "이 Spark 어플리케이션을 분석해줘" 라고 
요청하는 것과, 분석 관점과 출력 형식을 명시하는 것은 결과물의 품질에서 큰 차이를 만든다.   

### 1-2) 단순 반복 분석에서 지식 기반 분석으로    

구체적이고 명확한 프롬프트가 필수적이지만, 실무에서 얻은 방대한 Spark 튜닝 지식과 히스토리를 매번 프롬프트에 
무한정 추가하는 것은 불가능하다.   
토한 제한(Context Window)이 있을뿐더러 비효율적이기 때문이다.  
따라서 휘발되는 지식을 외부 메모리(Vector DB)로 구조화하여 AI 가 언제든 꺼내 쓸 수 있는 지식 베이스로 만들어야 한다.     

Vector DB를 연결하면 AI는 팀의 과거 분석 결과, 해결책, 그리고 고도화된 튜닝 지식을 모두 저장하고 학습한다.  
문제가 발생하면 단순히 로그만 보는 것이 아니라 과거 기록과 기술 지식을 검색(RAG)하여 더 정확한 해결책을 
제안할 수 있게 된다.  

```
[Spark History Server]
        ↓ MCP
[AI Agent (Claude)]  ←→  [Vector DB (RAG)]
        ↓                        ↑
   분석 & 레포트           과거 튜닝 사례
        ↓                  Spark 지식 문서
    [Slack]                팀 히스토리
```

Vector DB에 축적할 지식의 예시는 아래와 같다.   

- 과거 튜닝 사례   
    - 증상 (어떤 stage에서 어떤 지표가 비정상이었는지)
    - 원인 (Data Skew / GC / Disk Spill 등)   
    - 적용한 설정 변경 내용   
    - 결과(실행 시간, 리소스 변화)    
- Spark 공식 문서 및 팀 내부 가이드 문서    
    - 자주 사용하는 설정값과 권장 범위   
    - 패턴별 해결책 정리 문서   
- 일일 분석 레포트 누적본   
    - AI Agent가 생성한 레포트를 날짜별로 저장   

`이렇게 구성하면 AI는 단순히 오늘의 로그를 분석하는 것에서 벗어나, 팀이 과거에 비슷한 문제를 어떻게 해결했는지를 
참조하여 훨씬 정교한 답변을 제공할 수 있다.`       
예를 들어 특정 잡에서 Data Skew가 감지되었을 때 "파티션을 늘려보세요" 라는 일반적인 조언이 아니라, "특정 두 테이블들간의 
조인할 때 동일한 Skew 패턴이 발생한 사례가 있고, spark.sql.adaptive.skewJoin.SkewedPartitionThresholdInBytes=128m" 설정으로 
분할하도록 했을 때 Stage의 실행 시간이 38분에서 15분으로 감소한 사례가 있다." 처럼 근거 있는 
제안이 가능해진다.    



- - - 

## 3. 평가 기준

이 프로젝트의 성공 여부를 판단하기 위한 평가 기준으로 정확도를 측정한다.   
AI Agent가 레포트에서 지목한 어플리케이션의 병목 원인이 실제로 유효한지와 
제안한 솔루션이 실행시간 단축 또는 리소스 효율화에 도움이 되는지를 확인한다.   

초기에는 목표 수치에 미치지 못하더라도, Vector DB에 사례가 누적되면서 정확도가 점진적으로 향상되는 추세가 
나타나는 것 자체를 긍정적인 신호로 볼 수 있다. 반대로 사례가 쌓여도 정확도가 개선되지 않는다면 프롬프트 구조나 
Vector DB에 저장된 지식의 품질을 점검해야 한다는 신호로 읽을 수도 있다.   

- - -

Reference

<https://github.com/kubeflow/mcp-apache-spark-history-server>  
<https://www.blog-dreamus.com/post/spark-history-mcp-ai-agent%EB%A1%9C-spark-%EB%B6%84%EC%84%9D-%EC%9E%90%EB%8F%99%ED%99%94%ED%95%98%EA%B8%B0>  
<https://github.com/vgiri2015/ai-spark-mcp-server>   

{% highlight ruby linenos %}
{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}







