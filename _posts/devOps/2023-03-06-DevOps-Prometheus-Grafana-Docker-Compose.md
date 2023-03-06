---
layout: post
title: "[Prometheus] Grafana 와 Docker Compose를 이용한 모니터링 환경 구축하기"
subtitle: "Spring boot 어플리케이션 연동하기 / Spring actuator"
comments: true
categories : DevOps
date: 2023-03-06
background: '/img/posts/mac.png'
---

이 글에서는 Prometheus, Grafana를 Docker Compose로 설치하고 
Spring actuator를 사용하여 Spring boot 어플리케이션의 여러 메트릭을 
수집 및 모니터링 할 수 있는 환경을 구축해 보려고 한다.   

<img width="700" alt="스크린샷 2023-03-05 오후 5 48 59" src="https://user-images.githubusercontent.com/26623547/222950971-1d9bbe50-15ef-4a00-8657-fba7a678b6fb.png">   

전체 소스코드는 [링크](https://github.com/WonYong-Jang/Prometheus-Grafana-Docker)를 참고하자.   

- - - 

## 1. Docker 설정    

### 1-1) Prometheus     

`Prometheus는 메트릭을 수집 및 저장하며, 이를 통해 모니터링하거나 alert 를 제공해주는 
오픈소스이다.`       

> 일반적인 다른 모니터링 도구는 서버에 클라이언트를 설치하고 클라이언트가 메트릭 
데이터를 수집해서 서버로 보내는 방식으로 동작하는데, Prometheus는 반대로 직접 
주기적으로 pull 해오는 방식으로 동작한다.   

Prometheus를 Docker로 설치하기 위한 파일 및 디렉토리를 구성해 보도록 하자.   

```
mkdir Prometheus-Grafana-Docker
cd Prometheus-Grafana-Docker
```

그 후 Docker를 실행하기 위해 docker-compose.yml 파일을 생성한다.   

##### docker-compose.yml   

```yaml
version: '3.8'  # 파일 규격 버전
services:       # 이 항목 밑에 실행하려는 컨테이너 들을 정의
  prometheus:
    image: prom/prometheus
    container_name: prometheus
    volumes:
      - ./prometheus/config:/etc/prometheus
      - ./prometheus/volume:/prometheus
    ports:
      - "9090:9090"  # 접근 포트 설정 (컨테이너 외부:컨테이너 내부)
    command:         # web.enalbe-lifecycle은 api 재시작없이 설정파일들을 reload 할 수 있게 해줌
      - '--web.enable-lifecycle'
      - '--config.file=/etc/prometheus/prometheus.yml'
    restart: always
    networks:
      - promnet

networks:
  promnet:
    driver: bridge
```

위는 [Prometheus 도커 이미지](https://hub.docker.com/r/prom/prometheus)를 
정의했고, `저장 디렉토리는 ./prometheus/volume으로 지정하였고 설정 디렉토리는 
./prometheus/config로 지정하였다.`      

`그 후 Prometheus 관련 설정 파일이 위치할 디렉토리를 생성 후 prometheus.yml 과 
rule.yml을 생성한다.`       

##### Prometheus-Grafana-Docker/prometheus/config/prometheus.yml   

```yaml
global:
  scrape_interval: 15s     # 15초 마다 Metric을 Pulling / scrap target의 기본 interval을 15초로 변경 / default = 1m
  scrape_timeout: 15s      # scrap request 가 timeout 나는 길이 / default = 10s
  evaluation_interval: 2m  # rule 을 얼마나 빈번하게 검증하는지 / default = 1m

  external_labels:
    monitor: 'codelab-monitor'        # 기본적으로 붙여줄 라벨
  query_log_file: query_log_file.log  # prometheus의 쿼리 로그들을 기록, 없으면 기록안함

# 규칙을 로딩하고 'evaluation_interval' 설정에 따라 정기적으로 평가한다.
rule_files:
  - "rule.yml"  # 파일 위치는 prometheus.yml 이 있는 곳과 동일 위치

# 매트릭을 수집할 엔드포인드로 여기선 Prometheus 서버 자신을 가리킨다.
scrape_configs:
  # 이 설정에서 수집한 타임시리즈에 `job=<job_name>`으로 잡의 이름을 설정한다.
  # metrics_path의 기본 경로는 '/metrics'이고 scheme의 기본값은 `http`다
  - job_name: 'spring-actuator-prometheus' # job_name 은 모든 scrap 내에서 고유해야함
    scrape_interval: 10s      # global에서 default 값을 정의해주었기 떄문에 안써도됨
    scrape_timeout: 10s       # global에서 default 값을 정의해주었기 떄문에 안써도됨
    metrics_path: '/actuator/prometheus'     # 옵션 - prometheus가 metrics를 얻기위해 참조하는 URI를 변경할 수 있음 | default = /metrics
    honor_labels: false       # 옵션 - 라벨 충동이 있을경우 라벨을 변경할지설정(false일 경우 라벨 안바뀜) | default = false
    honor_timestamps: false   # 옵션 - honor_labels이 참일 경우, metrics timestamp가 노출됨(true일 경우) | default = false
    scheme: 'http'            # 옵션 - request를 보낼 scheme 설정 | default = http

    # 실제 scrap 하는 타겟에 관한 설정
    static_configs:
      - targets: ['host.docker.internal:80']
```   

`위 설정에서 실제 scrap 하는 타겟을 host.docker.internal:port 로 지정하였다.`       

더 자세한 내용은 [Collect Docker metrics with Prometheus](https://docs.docker.com/config/daemon/prometheus/)를 
참고하자.   

##### Prometheus-Grafana-Docker/prometheus/config/rule.yml   

```yaml
groups:
- name: example # 파일 내에서 unique 해야함
  rules:

  # Alert for any instance that is unreachable for >5 minutes.
  - alert: InstanceDown
    expr: up == 0
    for: 5m
    labels:
      severity: page
    annotations:
      summary: "Instance {% raw %}{{ $labels.instance }}{% endraw %}down"
      description: "{% raw %}{{ $labels.instance }}{% endraw %} of job {% raw %}{{ $labels.job }}{% endraw %} has been down for more than 5 minutes."

  # Alert for any instance that has a median request latency >1s.
  - alert: APIHighRequestLatency
    expr: api_http_request_latencies_second{quantile="0.5"} > 1
    for: 10m
    annotations:
      summary: "High request latency on {% raw %}{{ $labels.instance }}{% endraw %}"
      description: "{% raw %}{{ $labels.instance }}{% endraw %} has a median request latency above 1s (current value: {% raw %}{{ $value }}{% endraw %}s)"
```

최종 파일을 다 생성하면 아래와 같은 구조가 된다.   

```
.
├── docker-compose.yml
└── prometheus
    └── config
        ├── prometheus.yml
        └── rule.yml
```


### 1-2) Grafana    

Grafana는 데이터 시각화, 모니터링 및 분석을 위한 오픈소스 플랫폼이다.   

위에서 docker-compose.yml에서 grafana 설정 내용을 추가한다.   

```yaml
grafana:
  image: grafana/grafana
  container_name: grafana
  ports:
    - "3000:3000"  # 접근 포트 설정 (컨테이너 외부:컨테이너 내부)
  volumes:
    - ./grafana/volume:/var/lib/grafana
  restart: always
  networks:
    - promnet  
```

위에서 [grafana 도커 이미지](https://hub.docker.com/r/grafana/grafana)를 추가하였고, 
저장 디렉토리는 ./grafana/volume으로 지정하였다.   

이제 docker compose를 이용하여 이미지를 생성하고 컨테이너를 한번에 실행해보자.   

```
$ docker-compose up -d   
```

실행한 후에는 아래와 같은 volume 디렉토리가 생기는 것을 볼 수 있다.   

```
.
├── docker-compose.yml
├── grafana
│   └── volume
│       ├── grafana.db
│       ├── grafana.db-journal
│       └── plugins
└── prometheus
    ├── config
    │   ├── prometheus.yml
    │   ├── query_log_file.log
    │   └── rule.yml
    └── volume
        └── data
            ├── chunks_head
            ├── lock
            ├── queries.active
            └── wal
                └── 00000000
```

- - - 

## 2. 접속 실행   

Prometheus와 Grafana는 아래 경로로 접속 가능하다.   

- Prometheus
    - http://localhost:9090
- Grafana
    - http://localhost:3000
    - 기본 계정 ID/PW: admin/admin



- - - 

## 3. Spring Boot 연동    

모니터링 환경을 구축할 Spring boot 어플리케이션을 생성하고 아래 설정을 추가하자.   

### 3-1) 의존성 추가    

```gradle
dependencies {  
    ...
    implementation 'org.springframework.boot:spring-boot-starter-web'
    implementation 'org.springframework.boot:spring-boot-starter-actuator'
    implementation 'io.micrometer:micrometer-registry-prometheus'
    ...  
}
```

Spring boot actuator는 Spring boot의 서브 프로젝트이다.    
`Spring boot 어플리케이션에서 Spring boot actuator를 활성화하면, 어플리케이션을
모니터링하고 관리할 수 있는 엔드포인트에 접속이 가능해진다.`    

micrometer-registry-prometheus는 prometheus가 읽을 수 있는 metrics를 제공하는 역할을 한다.   

### 3-2) Actuator 설정   

`Actuator는 application.yml 내 management.endpoints.web.exposure.include 라는 옵션으로
/actuator 페이지를 통해 노출할 엔드포인트를 설정할 수 있다.`        


```yaml
management:
  endpoints:
    web:
      exposure:
        include: prometheus # prometheus, health 와 같이 추가할 수 있다.   
```

Spring actuator가 제공하는 다양한 엔드포인트는 [링크](https://docs.spring.io/spring-boot/docs/current/reference/html/actuator.html#actuator.endpoints)를 
참고하자.   

이를 설정하고 Spring boot를 실행하면 아래와 같은 로그를 확인할 수 있다.   

```
INFO 1 --- [           main] o.s.b.a.e.web.EndpointLinksResolver      : Exposing 1 endpoint(s) beneath base path '/actuator'
```

해당 주소로 들어가면, 아래와 같은 json response가 반환되는 것을 확인할 수 있다.   

```
{
  "_links": {
    "self": {
      "href": "http://localhost/actuator",
      "templated": false
    },
    "prometheus": {
      "href": "http://localhost/actuator/prometheus",
      "templated": false
    }
  }
}
```

`위에서 link 내에 management.endpoints.web.exposure.include에 정의한 항목이 보이게 되고, 
    /actuator/prometheus url로 접근할 수 있다.`      

> /actuator/prometheus에 접속해보면, system cpu, jvm threads daemon threads 등 prometheus가 
수집해갈 메트릭 정보를 확인할 수 있다.   

> ex) http://localhost:8080/actuator/prometheus   

- - - 

## 4. 모니터링 환경 구성하기   

스프링 부트 어플리케이션과 Grafana, Prometheus를 모두 실행 후 
본격적으로 모니터링 환경을 구축해보자.   

### 4-1) Prometheus 서버   

`http://localhost:9090으로 접속하여 Status -> Configuration`을 확인해보면 
우리가 작성했던 설정을 확인할 수 있다.  

또한, `Status -> Targets 를 확인해보면, 연결된 Application 상태를 확인`할 수 있다.   

<img width="1000" alt="스크린샷 2023-03-05 오후 5 58 34" src="https://user-images.githubusercontent.com/26623547/222951313-d1f764e1-dc4f-4cac-8fa2-c4d31c5399eb.png">    

아래와 같이 메인화면에서 Expression을 통해 검색을 할 수 도 있다.   

<img width="1428" alt="스크린샷 2023-03-05 오후 6 19 37" src="https://user-images.githubusercontent.com/26623547/222952200-addb6e6f-0f43-43c8-b49f-594d9ed92003.png">   

### 4-2) Grafana 서버   

이제는 prometheus에서 수집한 metric을 grafana로 시각화 하는 방법에 대해 살펴보자.   

prometheus의 웹 페이지에서 쿼리를 실행해 원하는 metric을 그래프로 시각화 할 수도 있다.  
하지만 매번 모니터링을 위해 수동으로 쿼리를 실행하는 것은 비효율적이고 
기본적으로 제공하는 대시보드 또한 간단하게 그래프를 볼 수 있는 정도이다.   

prometheus가 제공하는 것만으로는 시각화하는데 한계가 있기 때문에 보통 별도의 
시각화 도구를 이용해서 metric들을 모니터링한다.   

http://localhost:3000/ 접속하여 DATA SOURCES 아이콘을 클릭한다.   

<img width="500" alt="스크린샷 2023-03-05 오후 6 26 32" src="https://user-images.githubusercontent.com/26623547/222952480-323e4f5e-407f-4f59-9484-d1e70d6e3f4d.png">   

추가할 Data Source에서 Promethues를 클릭한다.    

<img width="500" alt="스크린샷 2023-03-05 오후 6 26 42" src="https://user-images.githubusercontent.com/26623547/222952484-ade2811a-69c9-4ec1-b26e-2e60061ef2e4.png">   

Promethues의 Data Source 소스를 추가 화면이 나오면, Name과 URL을 입력한다.   
Name에는 원하는 이름을 입력하고, `URL에는 "http://host.docker.internal:9090/"를 입력한다.`   

<img width="500" alt="스크린샷 2023-03-05 오후 6 26 52" src="https://user-images.githubusercontent.com/26623547/222952490-bbb3fcde-a914-406c-9561-0b6a1855fe96.png">    

Save Test 버튼을 클릭하여 저장한다.   

이제 대시보드를 설정할 차례이다.   
대시보드는 우리가 직접 구성할 수도 있지만, 잘 설정된 대시보드를 
사용할 수도 있다.   

그 외에 대시보는 [링크](https://grafana.com/grafana/dashboards/)에서 검색하여 적용할 수 있다.   

[JVM(Micrometer)](https://grafana.com/grafana/dashboards/11378-justai-system-monitor/)라는 
대시보드를 적용해보자.     

`Dashboards -> New -> Import 접속하여, Import via grafana.com 에 "https://grafana.com/grafana/dashboards/11378-justai-system-monitor/"  
를 입력하고 Load 를 클릭한다.`    

추가한 대시보드를 확인하면 아래와 같이 확인할 수 있다.   

<img width="1400" alt="스크린샷 2023-03-06 오후 11 21 41" src="https://user-images.githubusercontent.com/26623547/223136614-002b3c56-97f8-46d4-adb3-1be47148608e.png">    

- - -
Referrence 

<https://jongmin92.github.io/2019/12/04/Spring/prometheus/>   
<https://www.devkuma.com/docs/prometheus/spring-boot/>   
<https://grafana.com/tutorials/>    
<https://prometheus.io/docs/prometheus/latest/configuration/configuration/>   
<https://www.devkuma.com/docs/prometheus/docker-compose-install/>   
<https://velog.io/@windsekirun/Spring-Boot-Actuator-Micrometer%EB%A1%9C-Prometheus-%EC%97%B0%EB%8F%99%ED%95%98%EA%B8%B0>     

{% highlight ruby linenos %}
{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

