---
layout: post
title: "[DevOps] Jenkins Batch to Airflow"
subtitle: "젠킨스 배치를 airflow와 쿠버네티스(k8s) Job 으로 전환"
comments: true
categories : DevOps
date: 2024-08-02
background: '/img/posts/mac.png'
---

현재 업무에서 젠킨스를 이용하여 여러 배치를 통해 데이터 처리 및 비지니스가 
이루어지고 있다.   
Jenkins는 원래 목적이 CI/CD(Continuous Integration/Continuous Delivery) 툴로 제공되고 있기 때문에 배치를 사용할 때 
여러 문제점이 있음을 확인했고, 이를 airflow와 k8s의 job으로 전환하고자 한다.   

- - - 

## 1. Jenkins?   

Jenkins는 Java 진영의 대표적인 CI/CD 툴로 대부분의 
경우 빌드, 테스트 및 배포 자동화의 경우 사용된다.   
하지만 Spring Batch를 실행할 때도 Jenkins를 이용하는 경우가 많다.   

<img width="772" alt="스크린샷 2024-08-02 오후 3 38 38" src="https://github.com/user-attachments/assets/b742f3c9-13e7-4092-8692-118df31c27e9">   

Jenkins를 배치에서 사용할때 장점으로는 대시보드를 통해 로그 및 이력관리 등을 
바로 확인할 수 있다. 또한, 이메일, 슬랙 등과 같이 통합 환경이 잘 구축되어 있다.   

하지만 젠킨스를 배치 실행을 위해 사용했을 때 
security, reliability, less maintenace 관점에서 단점은 아래와 같다.   

##### security    

현재 업무에서 젠킨스는 Leader 노드와 여러 Follower 노드로 구성되어 있으며, aws ec2 머신 위에서 실행되고 있다.    

> ec2는 aws s3, documentDB 와 같이 완전 관리형 서비스가 아니기 때문에 사용자가 직접 AMI(Amazon Machine Image) 
    를 주기적으로 업그레이드 해야 한다.     

`최신 AMI로 업그레이드를 해주지 않으면 보안 취약점에 노출`되기 때문에 주기적으로 ec2의 AMI 업그레이드를 해주어야 한다.   

##### reliability

`젠킨스는 빌드 파이프라인이 주 목적이기 때문에, 중요한 비지니스를 
배치로 사용하는 경우 안정성에 문제가 있을 수 있다.`   

주로 DR 테스트가 이루어질 때 여러 문제가 발생함을 확인했다.    

- DR 상황의 경우 Leader 노드가 다운 되면 다른 노드가 Leader로 선정되어 다시 정상화 될 때 까지 모든 배치가 중단된다.   
- Follower 노드가 다운되고 다시 실행이 되었을 때 Leader 노드에 자동으로 연결이 안되어 직접 설정해주거나, 다운된 노드에 대해서 제거해주는 
작업 등이 필요하다.  
    > 해당 노드를 찾아서 젠킨스에서 직접 연결해주거나 제거하는 작업   
- 물론, 이 작업을 자동으로 진행할 수 있지만 복잡한 설정을 통해서 진행해야 한다.     
    > 복잡한 설정을 통해 다시 실행된 노드가 자동으로 연결하도록 했지만 다운된(젠킨스에서 offline 으로 표기된) 노드에 대해서는 
    아직까지 직접 제거해주고 있다.   

##### less maintenance   

`ec2 노드의 ami를 주기적으로 업데이트 해줘야 하기 때문에 유지보수 비용이 지속적으로 발생한다.`   

- - - 

## 2. Airflow on Kubernetes   



- - -
Referrence 


<https://engineering.linecorp.com/ko/blog/data-engineering-with-airflow-k8s-2>   
<https://deview.kr/2020/sessions/341>   
<https://jojoldu.tistory.com/489>   
<https://www.bucketplace.com/post/2021-04-13-%EB%B2%84%ED%82%B7%ED%94%8C%EB%A0%88%EC%9D%B4%EC%8A%A4-airflow-%EB%8F%84%EC%9E%85%EA%B8%B0/>   

{% highlight ruby linenos %}
{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

