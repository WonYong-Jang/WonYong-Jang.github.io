---
layout: post
title: "[Spark] AWS와 Kubeflow가 제시하는 AI 기반의 디버깅"
subtitle: "MCP Apache Spark History Server / Model Context Protocol" 
comments: true
categories : Spark
date: 2025-10-06
background: '/img/posts/mac.png'
---

현재 데이터 파이프라인은 갈수록 대규모화되고 있으며, 이를 처리하는 핵심 기술로 Apache Spark가 
널리 사용되고 있다.   
하지만 Spark의 대규모 분산 처리구조는 복잡한 구성과 성능 이슈 해결 측면에서 많은 시간과 전문 지식을 요구한다.   
특히, Spark에서 ETL 파이프라인 실패나 지연 시 그 원인을 파악하려면 로그, Spark History Server UI, 모니터링 툴 등 다양한 인터페이스를 오가며 수동으로 진단해야 한다.   

Spark의 ETL 작업이 실패할 경우 보통 아래와 같은 트러블 슈팅 과정을 거치게 된다.   

- Spark History Server UI 접속 
- Jobs 탭, Stages 탭, Tasks 탭 전환하며 분석   
- 각 Executor 로그 다운로드 및 검토   
- 메모리/CPU 그래프 패턴 분석   
- Stack Overflow, GPT 등을 통한 검색   
- 해결책 도출 및 적용   

하지만 위 과정을 통해서 AWS가 지적한 3가지의 문제는 아래와 같다.   

- `Complex connectivity and configuration options to a variety of resources with Spark`     
    - Spark는 다양한 리소스와 연결되어 있으며, 그로 인해 설정이 최적화되지 않거나 올바르게 구성되지 않았을 때 실패의 근본 원인을 찾기가 어렵다.    

- `Spark's in-memory processing model and distributed partitioning of datasets across its workers`   
    - 인메모리 처리와 분산처리를 진행하기에 각 워커의 리소스가 파편화되어 병목 구간을 쉽게 확인하기 어렵다.    

- `Lazy evaluation of Spark transformations`   
    - 실행 계획이 복잡하고 로그 상의 연관성이 명확하지 않아 디버깅에 시간과 노력이 많이 든다.   

이러한 한계를 해결하고자 AWS 에서는 Apache Spark History Server 데이터를 AI 기반으로 분석하고 디버깅할 수 있는 MCP 기능을 오픈소스로 
제공하기 시작했다.   
이 글에서는 Spark 디버깅의 자동화를 가능하게 해주는 MCP 서버에 대해 살펴보고, 실제 활용 사례와 배포 가이드를 소개한다.   

- - - 

## 1. 왜 MCP 가 필요할까?    

Model Context Protocal 는 Anthropic에서 발표한 프로토콜로 AI 와 외부 데이터 소스 및 도구들 간의 
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
- Claude Desktop   
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

> Claude Desktop, Amazon Q CLI, 로컬 테스트 환경 등에 적합하다.   

단점은 서버를 로컬에서 직접 실행해야 한다는 점이다. 


- - - 

## 2. Local Testing Guide   

#### 2-1) Prerequisites   

- Docker must be running (for Spark History Server)   
- Python 3.12+ with uv package manager   

#### 2-2) Setup environment   

```shell
mkdir spark-mcp-demo
cd spark-mcp-demo   

git clone https://github.com/kubeflow/mcp-apache-spark-history-server.git
cd mcp-apache-spark-history-server

# Install Python uv
curl -LsSf https://astral.sh/uv/install.sh | sh
# vi ./zshrc
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

그 후 로컬에서 spark history server를 실행하고 관련 데이터를 저장하기 위한 경로를 
추가해주고, spark 설정을 추가해주면 된다.   

```shell
# for spark history events dir    
mkdir -p /tmp/spark-events
chmod 755 /tmp/spark-events
```

```shell
# Spark History Server Config   
vi spark/conf/spark-defaults.conf

# Event Log 설정
spark.eventLog.enabled=true
spark.eventLog.dir=file:///tmp/spark-events

# History Server 설정
spark.history.fs.logDirectory=file:///tmp/spark-events
spark.history.ui.port=18080
```

마지막으로 mcp 서버의 config 파일을 작성해주자.   
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

#### 2-3) Check installation   

정상적으로 모두 설치가 되어 있는지 확인해보자.   

```shell
java --version
spark-shell --version
uv --version
task --version # Optional
node --version 
```

#### 2-4) Test spark-submit    

이제 test 할 spark 코드를 작성하여 spark-submit을 해보자.   

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
spark/bin/spark-submit test_normal.py   
```

#### 2-4) Claude Desktop   

[Claude Desktop](https://github.com/kubeflow/mcp-apache-spark-history-server/tree/main/examples/integrations/claude-desktop) 를 참고하여 
설정하면 된다. 

Claude Desktop의 경우 아래 json 파일에 설정을 추가해주어야 한다.   

```shell
# vi ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

#### 2-5) Claude CLI   

Claude Dekstop 외에도 CLI를 통해서 MCP를 연동할 수 있으며, config 파일은 
절대 경로로 입력해주자.   

```shell
claude mcp add spark-history -s user -- \
           uvx --from mcp-apache-spark-history-server spark-mcp \
           --config /Users/jang-won-yong/dev/spark-mcp-demo/mcp-apache-spark-history-server/config.yaml
```

위와 같이 mcp 서버를 등록하게 되면 ~/.claude.json 에 추가된 것을 확인할 수 있으며, 
    아래 명령을 통해 등록된 서버를 확인할 수 있다.   

```shell
# 등록 서버 목록 
claude mcp list

# 해당 서버 상세
claude mcp get spark-history
```

Claude에서 발생하는 로그는 아래 경로에서 확인할 수 있으며, 설정 과정에서 문제가 발생하면 
해당 에러로그를 살펴봐야 한다.  

```shell
# Claude log
cd ~/Library/Logs/Claude
```

#### 2-4) Start Testing   

```shell
# Setup and start testing
# in spark dir
# http://localhost:18080
$SPARK_HOME/sbin/start-history-server.sh

# task start-mcp-bg             # Start MCP Server
uvx --from mcp-apache-spark-history-server spark-mcp --verbose 2>&1 | tee spark_history.log 

# Optional: Opens MCP Inspector on http://localhost:6274 for interactive testing
# Requires Node.js: 22.7.5+ (Check https://github.com/modelcontextprotocol/inspector for latest requirements)
task start-inspector-bg       # Start MCP Inspector

# When done, run `task stop-all
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







