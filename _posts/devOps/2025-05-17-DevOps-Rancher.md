---
layout: post
title: "[DevOps] Rancher 를 이용하여 kubernetes 관리하기"
subtitle: "Rancher Desktop 를 이용한 실습"
comments: true
categories : DevOps
date: 2025-05-17
background: '/img/posts/mac.png'
---

## 1. Rancher 란?   

Rancher는 컨테이너 워크로드를 보다 쉽게 관리할 수 있도록 도와주는 멀티 
클러스터 관리 플랫폼이다.   

2.x 버전 이후부터 사실상 표준이 된 kubernetes 만 지원하고 있다.  

`랜처는 노드를 직접 계산하여 쿠버네티스를 설치하거나 기존에 설치되어 있는 
쿠버네티스 클러스터를 불러올 수도 있으며 모든 클러스터에 대해 
인증 및 역할 기반 엑세스 제어를 중앙 집중화하여 글로벌 관리자가 한곳에서 
클러스터 접근을 제어할 수 있다.`   

- - - 

## 2. Rancher Desktop 을 사용하여 로컬 테스트   

[Rancher Desktop](https://docs.rancherdesktop.io/)은 로컬의 Kubernetes와 Container를 관리할 수 있는 플랫폼을 제공한다.   

> Minikube와 비슷한 것 같지만 Virtual Machine 툴을 별도로 설치할 필요가 없고 GUI도 
갖추고 있어 설치 및 사용하기가 좀더 편한 것 같다.   

<img src="/img/posts/dev-ops/스크린샷 2025-05-17 오후 2.03.12.png" width="800" height="800">   

설치 후 Preferences 에 들어가 보면 Virtual Machine 설정에서 CPU 와 Memory 등을 조절할 수 있다. 

그 후 Docker 를 실행해주고 실행중인 Container 들을 확인해보면 Kubernetes cluster 관리를 
위한 컨테이너들이 실행되어 있는 것을 확인할 수 있다.  

특별히 Kubernetes cluster를 로컬에서 구성하여 사용할 필요가 없다면 Preference > Kubernetes 탭에 
들어가 Enable Kubernets 체크박스를 해제한 뒤 Apply 를 해주면 Service들이 재시작되어 적용된다.   

<img src="/img/posts/dev-ops/스크린샷 2025-05-17 오후 2.17.41.png" width="800" height="800">

- - -
Referrence 

<https://docs.rancherdesktop.io/>   


{% highlight ruby linenos %}
{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

