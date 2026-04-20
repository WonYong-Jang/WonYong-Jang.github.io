---
layout: post
title: "[Airflow] "
subtitle: "Astro CLI"
comments: true
categories : Airflow
date: 2026-03-18
background: '/img/posts/mac.png'
---

## 1. Astro CLI 를 이용하여 환경 구성하기   

Astro CLI는 Astronomer 에서 만든 CLI로, Airflow를 로컬에서 쉽게 띄우고 
DAG를 테스트할 수 있는 도구 이다.      

```shell
# brew install astro does not support --without-podman and will install Podman   
$ brew tap astronomer/tap
$ brew install astronomer/tap/astro --without-podman

$ brew install astro
$ astro version
```

처음 Astro CLI를 이용하여 환경을 구성하게 되면 Astro CLI에 기본 설정된 
astro runtime이 지원하는 가장 최신 버전으로 프로젝트가 생성된다.  
하지만 특정 버전의 Airflow로 프로젝트 생성이 필요하다면 아래와 같이 진행하면 된다.   

```shell
$ astro dev init --airflow-version 3.1.1

# 또는 아래와 같이 astro runtime 버전 지정이 가능하다.   
# release note 에서 지원하는 airflow 버전을 확인하여 runtime version을 사용하면 된다.   
# https://www.astronomer.io/docs/astro/runtime-release-notes

$ astro dev init --runtime-version 4.1.0

```

그 이후 아래와 같이 실행 및 중지가 가능하다.   

```shell
$ astro dev start   
$ astro dev stop   
$ astro dev restart  

# 신규로 생성된 파일에 대해서 기본적으로 5분마다 생성되므로 테스트를 진행할 때 해당 명령으로 빠르게 신규 파일 UI에 반영  
$ astro dev run dags reserialize   
```

또한, DAG 단위 테스트를 하여 개발한 코드가 정상 동작하는지 
빠르게 확인할 수 있다.   

```shell
# DAG를 구문 분석하여 기본 syntax나 import 오류가 없는지, Airflow UI에서 성공적으로 렌더링할 수 있는지 확인  
$ astro dev parse

# tests 디렉토리 안에 있는 모든 테스트를 진행   
$ astro dev pytest
```

이제 astro dev start 를 이용하여 컨테이너를 실행하면 airflow 와 
관련된 컨테이너가 5개 실행된다.   

- scheduler   
    - scheduler, local executor, worker process 가 수행되는 container   
- postgres  
    - Meta DB를 제공하는 PostgreSQL 이 수행되는 Container   
- triggerer
    - Async Sensor를 위한 Async Event Loop가 수행되는 Container   
- api-server
    - API Server/Web UI가 수행되는 container   
- dag-processor   
    - DAG 파일을 Parsing/Serialization 적용하는 dag processor 수행되는 container    

`이제 Astro project 내 주요 서브 디렉토리와 환경 파일에 대해서 이해해 보자.`   

아래 디렉토리 구조에서 dags는 DAG Python 파일들을 위치 시키는 디렉토리이며, include는 Astro에서 DAG Python 파일 이외에 
custom 모듈들을 import하기 위해 지정한 디렉토리이다.   

```
.
├── dags/
├── include/
├── plugins/
├── tests/
├── Dockerfile
├── requirements.txt
├── packages.txt
├── airflow_settings.yaml
└── docker-compose.override.yml
```

`여기서 중요한 것은 dags, include, plugins 디렉토리를 각 Airflow 컨테이너에 bind mount 해서 동일 파일을 공유하도록 설정되어 있다.`   
`즉, scheduler, api server, dag processor 컨테이너가 동일한 dags 파일들을 가지고 있으며 scheduler 컨테이너 내에 dags 파일을 수정하면 다른 컨테이너에 
존재하는 dags 파일도 동일하게 변경된다.`   


- - -
Referrence 

<https://www.astronomer.io/docs/astro/cli/install-cli>   
<https://medium.com/@kade.ryu/2024%EB%85%84-%EA%B0%80%EC%9E%A5-%EC%89%BD%EA%B2%8C-airflow-%EB%A1%9C%EC%BB%AC-%ED%99%98%EA%B2%BD-%EC%85%8B%EC%97%85%ED%95%98%EB%8A%94-%EB%B0%A9%EB%B2%95-5612cb2d56aa>    


{% highlight ruby linenos %}
{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

