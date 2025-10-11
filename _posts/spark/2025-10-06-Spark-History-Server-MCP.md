---
layout: post
title: "[Spark] AI 기반 디버깅 및 최적화를 위한 Apache Spark History Server 용 MCP 연동"
subtitle: "MCP Server for Apache Spark History Server with AI / Claude CLI / Check if it can be applied to our work" 
comments: true
categories : Spark
date: 2025-10-06
background: '/img/posts/mac.png'
---

현재 데이터 파이프라인은 갈수록 대규모화 되고 있으며, 이를 처리하는 핵심 기술로 Apache Spark가 널리 사용되고 있다.   
하지만 Spark의 대규모 분산 처리 구조는 복잡한 구성과 성능 이슈 해결 측면에서 많은 시간과 전문 지식을 요구한다.   
특히, Spark에서 ETL 파이프라인 실패나 지연 시 그 원인을 파악하려면 로그, Spark History Server UI, 모니터링 툴 등 다양한 인터페이스를 오가며 수동으로 진단해야 한다.   

Spark의 ETL 작업이 실패할 경우 보통 아래와 같은 트러블 슈팅 과정을 거치게 된다.   

- Spark History Server UI 접속    
- Jobs, Stages, Tasks 탭 전환하며 분석   
- Driver와 각 Executor 로그 확인    
- 메모리/CPU 등의 메트릭 패턴은 별도의 모니터링 도구(Grafana 등)에서 확인   
- Stack Overflow, AI 툴 등을 통한 검색    
- 해결책 도출 및 적용    

하지만 위 과정을 통해서 AWS가 지적한 3가지의 문제는 아래와 같다.   

- `Complex connectivity and configuration options to a variety of resources with Spark`     
    - Spark는 다양한 리소스와 연결되어 있으며, 그로 인해 설정이 최적화되지 않거나 올바르게 구성되지 않았을 때 실패의 근본 원인을 찾기가 어렵다.    

- `Spark's in-memory processing model and distributed partitioning of datasets across its workers`   
    - 인메모리 처리와 분산처리를 진행하기에 각 워커의 리소스가 파편화되어 병목 구간을 쉽게 확인하기 어렵다.    

- `Lazy evaluation of Spark transformations`   
    - 실행 계획이 복잡하고 로그 상의 연관성이 명확하지 않아 디버깅에 시간과 노력이 많이 든다.   

> 디버깅하는데 정보들이 파편화되어 있어서 분석 효율이 저하되며, Spark는 분산처리를 하기 때문에 
동일한 문제에 대해서 재현이 어렵고 병목 구간에 대해 쉽게 확인하기 어렵다.    
> Spark History Server는 문제 해결을 위한 거의 모든 정보를 제공하지만, 
    어떤 정보가 문제 해결에 필요한지는 알려주지 않기 때문에 엔지니어의 경험과 직관에 크게 의존하게 된다.   

이러한 한계를 해결하고자 AWS 에서는 Apache Spark History Server 데이터를 AI 기반으로 분석하고 디버깅할 수 
있는 MCP 기능을 [오픈소스](https://github.com/kubeflow/mcp-apache-spark-history-server)로 제공하기 시작했다.   

`이 글에서는 Spark 디버깅의 자동화를 가능하게 해주는 MCP 서버에 대해 살펴보고, 
    이를 현재 업무에 적용이 가능한지와 적용했을 때의 어떤 이점이 있는지 확인할 예정이다.`       

- - - 

## 1. 적용 가능성과 적용시 이점      

먼저 아래와 같이 PoC 를 진행함으로서 실제 업무에 적용 가능성을 확인해보려고 한다.    

- 로컬에서 Spark History Server를 실행 및 여러 spark job을 제출한다.  
- Spark History Server를 바라보는 MCP 서버를 구성하고 이를 Claude CLI와 연동한다.  
- slow query, out of memory, data skew, shuffle 병목 등 여러 문제가 발생하는 job을 구성하여 제출 후 
Claude CLI를 통해 문제 분석 및 해결책을 도출한다.   
- 문제 분석 및 도출된 솔루션을 팀 내에서 리뷰를 진행하여 적용 가능성을 확인한다.  

적용 후 예상되는 이점은 아래와 같다.  

- `장애 복구 시간(Mean Time to Recovery) 단축`
    - Claude CLI에서 자연어로 원인 파악 및 해결책 도출    
        - "Jop spark-xxx 이 왜 OOM이 발생했냐?"   
        - "Stage 2에서 Task 간 실행 시간 편차가 큰 이유는?"   
        - "어제 같은 ETL Job과 비교해서 오늘 성능이 저하된 원인은?"   
- `주기적으로 ETL 성능 리포트 작성하여 확인 필요한 job에 대해서는 slack 알람 전송`      
    - 전일 대비 성능 저하된 Job   
    - 처리량에 비해 리소스 낭비가 심한 Job (확인 가능하다면 Cost Saving 가능)  
    - OOM, Data Skew 등 문제가 있는 Job   
    - 가장 느린 Job 상위 5개 선별   
- `팀 내부 지식베이스 구축`     
    - 자주 발생하는 문제 및 해결책을 바탕으로 팀 위키 작성   

> 위 PoC가 성공적으로 검증 되었다면 업무에 적용하기 위해 중앙 MCP 서버를 구성하고 모든 팀원이 
동일한 서버를 사용할 수 있도록 구성해야 할 것 같다.   

- - - 


## 2. 왜 MCP 가 필요할까?    

Model Context Protocol 는 Anthropic에서 발표한 프로토콜로 AI 와 외부 데이터 소스 및 도구들 간의 
원활한 통합을 가능하게 하는 개방형 프로토콜이다.    

<img src="/img/posts/spark/10-08/스크린샷 2025-10-06 오후 4.43.05.png">   

`기존 AI 만을 사용했을 때의 한계는 특정 시스템에 대한 기술정보 접근이 불가하여  
실제 운영 데이터가 아닌 일반적인 권장사항을 제공했다.`   

`MCP 활성화한 AI는 실제 운영 데이터 기반 인사이트를 제공이 가능하기 때문에 
일반적인 모범 사례가 아닌 실제 운영 데이터 기반으로 분석하여 최적화를 해줄 수 있게 된다.`     

> 예를 들어, 일반적으로 권장되는 Spark 설정(spark.sql.shuffle.partitions 변경 등)이 운영 환경에 따라 비효율적일 수 있는데, 
    MCP 기반 AI는 실제 Stage 별 Task 시간, Executor 메모리 사용량, Shuffle read/write 사이즈 등을 분석하여 최적의 옵션을 제안할 수 있다.    

즉, 기존처럼 UI를 탐색하지 않아도 자연어로 spark-abcd 잡이 왜 실패했는가? 라고 묻는 것만으로도 AI가 
로그, 실행 시간, 리소스 소비 내역 등을 종합 분석해 근본 원인을 알려준다.   
설정 변경 없이 기존 서버에 연결만 하면 되기 때문에 도입도 간단하다.  

MCP 는 다양한 AI 에이전트와 통합 가능하다.  

- Amazon Q Developer CLI
- Claude Desktop, CLI
- LlamaIndex
- Strands Agents
- LangGraph    

또한 MCP 서버는 다음과 같은 두 가지 프로토콜을 통해 통신한다.    

##### Streamable HTTP     

HTTP 프로토콜을 기반으로 MCP 서버를 실행하는 방식이다.   
웹 기반 배포에 가장 적합하며, 공식 문서에서도 사용을 권장한다.   

##### STDIO   

가장 기본적인 전송 방식으로, 로컬 MCP 서버를 실행할 때 사용된다.   
`서버와 클라이언트가 같은 시스템 내에서 표준 입출력(STDIO)를 통해 통신한다.`   

> Claude Desktop, Amazon Q CLI, 로컬 테스트 환경 등에 적합하며, 보통 서버를 로컬에서 직접 실행하게 된다.  

- - - 

## 3. Local Testing Guide   

#### 3-1) Prerequisites   

- Install Claude CLI or Desktop    
- Docker must be running (for Spark History Server)   
- Python 3.12+ with uv package manager   

#### 3-2) Setup environment   

```shell
mkdir spark-mcp-demo
cd spark-mcp-demo   

git clone https://github.com/kubeflow/mcp-apache-spark-history-server.git
cd mcp-apache-spark-history-server

# Install Python uv
curl -LsSf https://astral.sh/uv/install.sh | sh
# vi ./zshrc 환경 변수 추가  
export PATH=$HOME/.local/bin:$PATH

# Install node (for MCP Inspector)
brew install node

# Install Spark 3.5.5
# -f: fail on HTTP erros
# -L: redirect를 통해 자동으로 따라가서 진짜 아카이브를 받아온다.   
curl -fL -o spark-3.5.5-bin-hadoop3.tgz \ 
    https://dlcdn.apache.org/spark/spark-3.5.5/spark-3.5.5-bin-hadoop3.tgz   

tar -xzf spark-3.5.5-bin-hadoop3.tgz   
ln -s spark-3.5.5-bin-hadoop3 spark   
```  

spark 설치를 완료 한 후 spark history server 실행 및 spark-submit을 자유롭게 진행하기 
위해 아래와 같이 환경 변수를 줄 수도 있다.  

```shell
# Spark environment (.zshrc)  
export SPARK_HOME="$HOME/dev/spark-mcp-demo/spark"
export PATH="$SPARK_HOME/bin:$SPARK_HOME/sbin:$PATH"
```  

그 후 로컬에서 Spark History Server 의 데이터를 저장할 경로와 권한을 
추가해준다.     

```shell
# for spark history events dir    
mkdir -p /tmp/spark-events
chmod 755 /tmp/spark-events
```

spark 실행시 config 파일은 아래와 같이 추가해준다.   

```shell
# Spark History Server Config   
vi $SPARK_HOME/conf/spark-defaults.conf

# Event Log 설정
spark.eventLog.enabled=true
spark.eventLog.dir=file:///tmp/spark-events

# History Server 설정
spark.history.fs.logDirectory=file:///tmp/spark-events
spark.history.ui.port=18080
```

마지막으로 MCP 서버의 config 파일을 작성해주자.     
mcp-apache-spark-history-server 디렉토리 내에 config.yaml 을 수정하거나,  
파일이 없다면 새로운 파일로 생성해주면 된다.     

```shell
servers:
  local:
    default: true
    url: "http://localhost:18080"
mcp:
  transports:
    - stdio
  port: "18888"
  debug: true
  address: localhost
```

#### 3-3) Check installation   

정상적으로 모두 설치가 되어 있는지 확인해보자.   

```shell
java --version
spark-shell --version
uv --version
task --version # Optional  
node --version # Optional  
```

#### 3-4) Test spark-submit   

Spark History Server를 실행해보자.   

```shell
# in spark dir
# http://localhost:18080
$SPARK_HOME/sbin/start-history-server.sh
```

그 후 test 할 spark 코드를 작성하여 spark-submit을 해보자.   

```shell
vi test_normal.py
```

```python
from pyspark.sql import SparkSession
from pyspark.sql.functions import *

spark = SparkSession.builder \
    .appName("TestNormalJob") \
    .config("spark.eventLog.enabled", "true") \
    .config("spark.eventLog.dir", "file:///tmp/spark-events") \
    .getOrCreate()

# 간단한 데이터 처리
data = [(i, f"user_{i}", i * 10) for i in range(1000)]
df = spark.createDataFrame(data, ["id", "name", "value"])

result = df.groupBy("name").agg(
    avg("value").alias("avg_value"),
    count("*").alias("count")
)

print(f"처리 완료")
spark.stop()
```

환경변수를 지정했다면 spark-submit 명령어만 입력하여 파이썬 파일을 제출할 수 있다.    

```shell
$SPARK_HOME/bin/spark-submit test_normal.py   
```

#### 3-4) Claude Desktop   

[Claude Desktop](https://github.com/kubeflow/mcp-apache-spark-history-server/tree/main/examples/integrations/claude-desktop) 를 참고하여 
설정하면 되며, 아래와 같이 claude desktop 전용 설정 파일에 추가해주어야 한다.      

```shell
vi ~/Library/Application\ Support/Claude/claude_desktop_config.json

{
  "mcpServers": {
    "mcp-apache-spark-history-server": {
      "command": "/Users/jang-won-yong/.local/bin/uvx",
      "args": [
        "--from",
        "mcp-apache-spark-history-server",
        "spark-mcp",
        "--config",
        "/Users/jang-won-yong/dev/spark-mcp-demo/mcp-apache-spark-history-server/config.yaml"
      ],
      "env": {
        "SHS_MCP_TRANSPORT": "stdio",
        "SHS_MCP_DEBUG": "true"
      }
    }
  }
}
```

#### 3-5) Claude CLI   

Claude Dekstop 외에도 CLI를 통해서 MCP를 연동할 수 있으며, config 파일은 절대 경로로 입력해주자.   

```shell
claude mcp add spark-history -s user -- \
           uvx --from mcp-apache-spark-history-server spark-mcp \
           --config /Users/jang-won-yong/dev/spark-mcp-demo/mcp-apache-spark-history-server/config.yaml
```

위와 같이 MCP 서버를 등록하게 되면 ~/.claude.json 에 추가된 것을 확인할 수 있으며, 
    아래 명령을 통해 등록된 서버를 확인할 수 있다.   

```shell
# 등록 서버 목록 
claude mcp list

# 해당 서버 상세
claude mcp get spark-history

# 해당 서버 삭제
claude mcp remove spark-history
```

Claude에서 발생하는 로그는 아래 경로에서 확인할 수 있으며, 설정 과정에서 문제가 발생하면 
해당 에러로그를 살펴봐야 한다.  

```shell
# Claude log
cd ~/Library/Logs/Claude
```

- - -

## 4. Proof of Concept      

Claude CLI를 통해서 제출된 Spark 어플리케이션을 조회하여 MCP 연동이 
되었는지 확인해보고 여러 케이스에 대해서 문제 분석과 적절한 해결책을 도출해주는지 
확인해보자. 

> PoC는 로컬에서 진행하기 때문에 Spark의 Driver만을 사용한다.    


#### 4-1) 정상적인 Job   

먼저 Claude CLI 를 이용하여 Spark History Server에 제출된 어플리케이션들을 아래와 같이 조회할 수 있다.  

```
> Spark History Server에서 어플리케이션들을 조회해줘.

⏺ Spark History Server에서 애플리케이션 목록을 조회하겠습니다.
  ⎿  {
       "id": "local-1760161598647",
       "name": "TestNormalJob",
     … +17 lines (ctrl+o to expand)

⏺ Spark History Server에 등록된 애플리케이션 목록입니다:

  애플리케이션 정보

  Application ID: local-1760161598647이름: TestNormalJob사용자: jang-won-yongSpark 버전: 3.5.5

  실행 정보:
  - 시작 시간: 2025-10-11 05:46:37 (GMT)
  - 종료 시간: 2025-10-11 05:46:44 (GMT)
  - 실행 시간: 6.9초
  - 상태: 완료됨

  현재 1개의 완료된 애플리케이션이 조회되었습니다. 이 애플리케이션에 대해 더 자세한 정보(jobs,
  stages, executors 등)를 확인하시겠습니까?
```

> MCP 서버에서 제공하는 list_applications 를 이용하여 현재 어플리케이션들을 조회한 것을 확인할 수 있다.   

조회된 어플리케이션을 자세히 분석해달라는 요청을 하게 되면 여러 방면으로 분석 후 결과를 제공해주게 된다.  

#### 4-2) 처리량에 비해 리소스 낭비가 심한 Job   

`Spark에서 데이터 처리량에 비해서 cpu, memory 등의 리소스를 너무 과도하게 사용하게 될 경우 
비용 낭비로 이어질 수 있다.`     
따라서, 이런 경우를 재현해보고 MCP 서버를 통해 문제 분석과 적절한 리소스 설정을 
가이드 받아 보자.    

```shell
spark-submit \
    --master local[8] \
    --driver-memory 4g \
    --executor-memory 4g \
    --executor-cores 4 \
    test_inefficient_resources.py
```

재현 코드는 아래와 같다.  


```python
from pyspark.sql import SparkSession
from pyspark.sql.functions import col
import time

# 실제 처리량은 적지만 리소스는 과도하게 할당
spark = SparkSession.builder \
    .appName("Resource_Waste_Job") \
    .getOrCreate()


print("\n[데이터 로딩] 극소량 데이터 생성 중...")
tiny_data = [(i, f"data_{i}", i * 10) for i in range(50)]  # 단 50개 row!
df = spark.createDataFrame(tiny_data, ["id", "name", "amount"])

print(f"처리할 데이터: {df.count()} rows")
print(f"데이터 크기: 약 {len(str(tiny_data))} bytes")

print("\n[작업 1] 간단한 필터링...")
filtered = df.filter(col("amount") > 100)
result_count = filtered.count()
print(f"필터링 결과: {result_count} rows")

print("\n[작업 2] 간단한 집계...")
total = df.groupBy().sum("amount").collect()[0][0]
print(f"총합: {total}")

# 하지만 Job은 오래 실행되면서 리소스 점유
for i in range(60, 0, -10):
    print(f"  남은 시간: {i}초...")
    time.sleep(10)

print("Job 종료")
spark.stop()
```

- - -

Reference

<https://github.com/kubeflow/mcp-apache-spark-history-server>   
<https://blog.a-cloud.co.kr/2025/07/24/ai%EB%A1%9C-apache-spark-%EB%94%94%EB%B2%84%EA%B9%85-%EC%9E%90%EB%8F%99%ED%99%94%ED%95%98%EB%8A%94-mcp-%EC%84%9C%EB%B2%84-%EC%86%8C%EA%B0%9C/>   
<https://aws.amazon.com/ko/blogs/big-data/introducing-mcp-server-for-apache-spark-history-server-for-ai-powered-debugging-and-optimization/>
{% highlight ruby linenos %}
{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}







