---
layout: post
title: "[helm] chart & ArgoCD"
subtitle: single-source, multi-source / umbrella char, vendored tgz / app-of-apps, sync-wave
comments: true
categories: DevOps
date: 2026-01-23
background: /img/posts/mac.png
---

Kubernetes에 어플리케이션을 배포하다 보면 결국 두 가지 도구를 만나게 된다.    
Helm(패키징, 템플릿)과 ArgoCD(GitOps 배포) 이며, 이 글에서는 두 도구를 왜 사용해야 하는지와 기존에 사용하던 Raw Manifest 를 사용했을 때 어떤 차이가 있는지 확인해보려고 한다.

> Raw Manifest는 템플릿 엔진을 거치지 않은 순수한 Kubernetes YAML 파일을 의미한다.   


- - - 

## 1. 왜 이 도구가 필요한가

먼저 최근에 업무를 진행하면서 관련하여 고민했던 포인트를 살펴보자.    

기존 구조는 하나의 디렉토리 내에 모든 Raw Manifest 를 모아 두고, 이를 ArgoCD 의 단일 Application으로 배포하는 형태였다.   
리소스가 단순하고 종류가 적을 때는 이 방식이 가장 가볍고 직관적이다.   

다만 Airflow는 예외였다. 포함하는 리소스가 워낙 많고 설정이 복잡해서, raw manifest로 사용하게 되면 관리가 어렵다. 그래서 Airflow만 별도 helm chart로 구성하고, ArgoCD에도 Airflow 전용 Application 으로 분리해 배포하는 구조를 사용했다.   

이 상태에서 Airflow 메트릭 수집용 vmagent를 새로 추가해야 하는 상황이 생겼고, 선택지는 아래와 같다.  

- (A) 분리 - vmagent도 별도 helm chart로 구성하고 ArgoCD에 새 Application 추가하는 구조
- (B) 통합 - 기존의 단일 raw manifest 디렉토리에 그냥 추가해서 하나의 Application으로 함께 관리하는 구조

어느 쪽이 옳다고 단정하기 전에 `새 컴포넌트를 별도 Application으로 분리할지, 기존 묶음에 합칠지를 가르는 판단 기준부터 세울 필요가 있었다.`  
그리고 그 기준을 적용하기 위해, vmagent를 helm chart 와 신규 ArgoCD Application으로 관리할 때와 기존 Raw Manifest와 함께 관리할 때의 장단점을 구체적으로 비교해 볼 필요가 있었다.

`(A) 의 경우는 vmagent 가 우리 전용 리소스가 아닌 잘 관리되는 공식 helm chart 가 존재하기 때문에 Raw 로 작성하는 코드를 줄일 수 있는 장점이 있지만, ArgoCD에 새로운 Application으로 추가되어 관리되는 것에 대한 부담이 있었다.`    

(A)의 분리했을 때의 장점

`(B) 의 경우는 기존 ArgoCD 의 Application 내에 리소스만 추가되는 형식이기 때문에 단순한 구조이지만, 하나의 Application 내에 여러 리소스 들이 한번에 관리되기 때문에 각 컴포넌트 별 명확한 역할 구분이나 개별 컴포넌트 별 rollback 등에 대한 어려움이 존재한다.`    
이 경우도 모든 Raw Manifest 들로만 관리하기 보다는 helm chart 를 사용하는 구조를 고려 했다. 


  


- - -
Reference 



{% highlight ruby linenos %}
{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

