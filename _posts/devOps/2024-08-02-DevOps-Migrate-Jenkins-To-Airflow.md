---
layout: post
title: "[DevOps] Jenkins Batch to Airflow"
subtitle: "젠킨스 배치의 문제점 / 젠킨스 배치를 airflow와 쿠버네티스(k8s) Job 으로 전환"
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


하지만 젠킨스를 배치 실행을 위해 사용했을 때 복잡한 워크플로우 처리가 어렵고, 
    대규모 배치작업 또는 분산처리에 한계가 있다.    

##### 복잡한 워크플로우 관리의 한계   

Jenkins는 기본적으로 순차적으로 작업을 실행하는데 최적화되어 있다.   
`하지만 복잡한 워크플로우를 처리해야 할 때, 특히 작업 간에 
의존 관계가 많거나 병렬 처리가 필요한 경우에 한계가 있다.`     

<img width="740" alt="스크린샷 2024-08-03 오후 9 44 11" src="https://github.com/user-attachments/assets/bd3db8d1-2729-4d8a-b2cf-0ff8424b9434">   


##### 분산 처리의 어려움   

`Jenkins는 기본적으로 Leader Follower 아키텍처를 사용하지만, 이 구조는 
확장성이 제한적이며, 특히 대규모 데이터 처리나 복잡한 분산 작업을 효율적으로 
처리하는데 어려움이 있다.`    

> 작업에 대해 동적으로 리소스를 할당하고, 여러 작업을 병렬로 수행한 후 결과를 
취합하는 경우는 추가적인 설정과 복잡한 스크립트 작업이 필요하다.   


또한, security, reliability, less maintenace 관점에서 단점은 아래와 같다.   

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
    > 복구 될 때 까지 Jenkins 의 웹 인터페이스에 접근도 불가능해진다.    

- Follower 노드가 다운되고 다시 실행이 되었을 때 Leader 노드에 자동으로 연결이 안되어 직접 설정해주거나, 다운된 노드에 대해서 제거해주는 
작업 등이 필요하다.  
    > 해당 노드를 찾아서 젠킨스에서 직접 연결해주거나 제거하는 작업   
- 물론, 이 작업을 자동으로 진행할 수 있지만 복잡한 설정을 통해서 진행해야 한다.     
    > 복잡한 설정을 통해 다시 실행된 노드가 자동으로 연결하도록 했지만 다운된(젠킨스에서 offline 으로 표기된) 노드에 대해서는 
    아직까지 직접 제거해주고 있다.   

##### less maintenance   

`ec2 노드의 ami를 주기적으로 업데이트 해줘야 하기 때문에 유지보수 비용이 지속적으로 발생한다.`   

- - - 

## 2. Airflow와 Kubernetes Job를 이용하여 전환   

위에서 언급한 문제들을 해결하기 위해 airflow와 kubernetes job으로 전환을 고려하였다.      
[airflow](https://wonyong-jang.github.io/devops/2024/07/25/BigData-Apache-Airflow.html) 를 사용하면 
복잡한 워크플로우 관리와 대규모 배치작업을 효율적으로 진행할 수 있다.   
또한, 기존 Spring Batch를 Kubernetes 환경에서 실행 할 수 있도록 
[kubernetes job](https://kubernetes.io/ko/docs/concepts/workloads/controllers/job/)를 고려했다.   

> 현재 회사 플랫폼 팀에서 airflow와 쿠버네티스 환경은 제공해주고 있기 때문에 
이를 활용하였고, airflow를 통해 스케줄링 및 배치 작업이 트리거 되면 k8s job으로  
실행하여 기존 Spring Batch를 실행할 수 있도록 전환했다.   

k8s job에 대해서 더 자세히 살펴보자.   

`job은 하나 이상의 파드를 지정하고 지정된 수의 파드를 성공적으로 
실행하도록 하는 설정이며, 특정 배치 처럼 한번 실행하고 종료되는 성격의 작업에 
사용될 수 있다.`    

즉, 어플리케이션이 실행되고 실행이 완료되면 파드의 할 일이 끝난 것으로 
간주하고 파드를 종료시킨다.    

만약 어플리케이션이 실행되고 있는 중에 파드가 죽거나 완료되지 않았다면, 
    파드를 다시 스케줄링하여 재실행하게 구성할 수 있다.   

### 2-1) Job 설정 옵션   

##### backoffLimit   

백오프 정책이라고 하며 잡에 연계된 실패 파드가 있다면 지정된 수만큼 
재시도를 한다.   


> default: 6 이며 실패할 때마다 10초, 20초, 40초.. delay를 두며 재시도를 한다.   

##### completions  

잡이 완료될 때까지 실행 종료해야 하는 파드의 수   

> default: 1    

##### parallelism   

잡을 실행할 때 병렬로 실행되는 파드 수   

> default: 1

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

