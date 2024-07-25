---
layout: post
title: "[AWS] VPC 와 Subnet 이해하기"
subtitle: "VPC, Subnet, VPC 방화벽(Network ACL, Security Group) / IAM"
comments: true
categories : AWS
date: 2022-07-10
background: '/img/posts/mac.png'
---

## 1. VPC(Virtual Private Cloud)     

`VPC는 사용자가 정의하는 AWS 계정 사용자 전용 가상의 네트워크이다.`      
사용자는 자기가 원하는대로 IP 주소 범위 선택, 서브넷 생성, 라우팅 테이블 및 네트워크 게이트웨이 구성 등 
가상 네트워크 환경을 구성해 VPC를 생성할 수 있다.   

전체적인 VPC 모델 지도이다.   

<img width="968" alt="스크린샷 2022-12-14 오전 1 08 23" src="https://user-images.githubusercontent.com/26623547/207384426-add53b58-36f6-4286-86c0-b035ea931fd3.png">    

- - - 

## 2. Subnet    

`서브넷은 VPC의 IP 주소를 나누어 리소스가 배치되는 물리적인 주소 범위를 뜻한다.`       

VPC가 논리적인 범위를 의미한다면, 서브넷은 VPC안에서 실제로 리소스가 생성될 수 있는 네트워크 영역이라고 
생각하면 된다.   

`하나의 VPC에 N개의 서브넷을 가질 수 있으며 하나의 AZ에만 생성이 가능하다.`   
아래 그림처럼, 여러 AZ에 걸쳐서 서브넷을 생성할 수 없다는 말이다.   

<img width="700" alt="스크린샷 2022-12-11 오후 6 51 37" src="https://user-images.githubusercontent.com/26623547/206896999-ccb69cdb-5f30-4c2f-9386-ac1d28261fe0.png">    
 

- - - 

## 3. VPC 방화벽   

이번엔 VPC의 트래픽을 통제하고 제어하는 서비스들을 살펴보자.   

<img width="515" alt="스크린샷 2022-12-14 오전 12 31 20" src="https://user-images.githubusercontent.com/26623547/207375983-a821e501-74b5-445c-b990-2b4fd18d7341.png">   

Security Group과 Network ACL이며, 간단하게 살펴보면 `Network ACL은 서브넷 상자 위에 위치해 있는데, 
         바로 서브넷에 오가는 트래픽을 제어하는 역할을 한다.`      

`Security Group은 서브넷 상자 안에 위치해 있는데, 인스턴스의 트래픽을 제어하는 역할을 한다. 다만, 왼쪽과 
오른쪽 Security Group 모양이 다른데, 이는 다수의 인스턴스가 하나의 Security Group을 쓰거나, 각자의 Security Group을 
쓸 수 있음을 의미한다.`     


### 3-1) Network ACL   

`Network ACL이란, Access Control List의 약어로써 접근 제어 리스트를 말한다.`      

AWS의 각 VPC 단위로 접근 제어 목록을 만들 수 있고, VPC로 접근하는 트래픽들에 대한 방화벽을 구성하는 보안계층이다.   
`즉, Subnet을 오고 가는 모든 트래픽을 제어하는 역할을 한다.`   

기본 설정으로는 모든 인바운드 및 아웃바운드 트래픽을 허용하지만, 사용자 지정 ACL의 경우 새 규칙을 추가하기 전까지 
모든 트래픽을 거부하게 되어 있다.   

만들어진 Network ACL은 여러개의 서브넷에 적용할 수 있지만, 하나의 서브넷은 한 개의 ACL만 적용할 수 있다.   
단, VPC는 여러개의 ACL을 적용가능하며 최대 200개까지 허용된다.   
Network ACL에는 Sequence Number로 구분되어 있는 규칙들이 정의되어 있고, 
        낮은 번호부터 우선적으로 적용된다.   

아래와 같이 Stateless 특징을 가진다.   
`상태를 저장하지 않아 한 번 인바운드를 통과하는 트래픽은 아웃바운드의 규칙을 적용 받는다.`   
`또한, 상태를 저장하지 않아 한 번 아웃바운드를 통과하는 트래픽은 인바운드 규칙을 적용 받는다.`   


## 3-2) Security Group 

`Security Group은 인스턴스에 대한 인바운드(외부 -> 인스턴스)와 아웃바운드(인스턴스 -> 외부) 트래픽을 제어하는 가상 방화벽 역할을 한다.`   

VPC의 각 인스턴스당 최대 5개 Security Group에 할당할 수 있으며, 인스턴스 수준에서 작동하기 때문에 VPC에 있는 
각 서브넷의 인스턴스들을 서로 다른 Security Group에 할당하는 것이 가능하다.   

ACL과 유사하지만 별개로 동작하는 규칙들을 정의할 수 있다.   
기본 Security Group의 인바운드 트래픽 정책은 All Deny이기 때문에, 각 규칙은 Allow 항목들을 추가해주는 
WhiteList 방식이다.   
반면, 기본 아웃바운드 트래픽 정책은 All Allow 상태이고, 규칙은 Deny 할 항목을 추가해주는 BlackList 방식이다.   

아래와 같이 Stateful 특징을 가진다.   
`상태를 저장하여 한 번 인바운드를 통과하는 트래픽은 아웃바운드의 규칙을 적용받지 않고 허용한다.`   
`또한, 상태를 저장하여 한 번 아웃바운드를 통과하는 트래픽은 인바운드 규칙 적용을 받지 않고 허용한다.`   

> 인바운드를 통해 허용된 트래픽은 보안그룹에서 기억하고 있다가, 트래픽이 빠져 나갈 때 이 트래픽은 
문제 없다는 걸 기억하기 때문에 아웃바운드 규칙과 관계 없이 허용한다.  


- - - 

## 4. IAM(Identity and Access Management)    

<img width="600" alt="스크린샷 2024-07-24 오후 11 30 42" src="https://github.com/user-attachments/assets/4d0332ef-a540-4722-9ffb-28e27c3c0178">    

`AWS Identity and Access Management 는 AWS 리소스에 대한 액세스를 안전하게 
제어할 수 있는 웹 서비스이다.`    

IAM은 AWS 클라우드 인프라 안에서 신분과 접근을 관리하기 위한 서비스이며, 
    크게 `User, Group, Role, Policy`로 구성되어 있다.   

먼저 `IAM 정책(Policy) 은 권한을 부여`하는 방법이다.   
`하나 이상의 AWS 리소스에 대한 어떤 작업을 수행할 수 있는지 허용 규칙을 
JSON 형식으로 작성된다.`   

> IAM 정책(policy)는 IAM user, role, group에게 부여할 수 있다.   

IAM 사용자는 실제 사용자 단 한명을 의미한다.   
하지만 AWS 계정을 처음 만들었을 때 만든 루트 계정이랑 완전 다르다는 
점을 알아야 한다.   
왜냐하면 루트 계정은 모든 권한을 갖고 있고, IAM 사용자는 단지 루트 계정에 
의해 만들어졌을 뿐이다.   

> AWS에서는 루트 계정을 직접 사용하지 말고, 어드민 권한(AdministratorAccess)을 
부여한 IAM 사용자를 따로 만들어서 사용하는 것을 권장하고 있다.   

IAM 그룹은 다수의 IAM 사용자를 모아놓은 개념이다.   
그룹이 필요한 이유는 IAM 사용자마다 매번 정책을 직접 연결해줘야 하는 번거로움과 
관리 포인트를 줄일 수 있기 때문이다.    
예를 들어 developers 라는 그룹에 s3와 cloudwatch에 read only 정책을 연결한다면, 
    이 그룹에 속한 IAM 사용자에게 자동으로 이 정책이 적용되는 것이다.   

마지막으로 가장 중요한 IAM 역할(role)에 대해 알아보자.   

IAM Role의 큰 특징은 IAM 사용자나 IAM 그룹에는 연결되지 않는다는 점이다.   
대신 신뢰할 수 있는 IAM 사용자나 어플리케이션 또는 AWS 서비스(ex. ec2)가 역할을 
맡을 수 있다.   

여기서 신뢰할 수 있다는 말은 신분이 증명되었다는 것으로, 
    ec2 같은 aws 서비스는 이미 내 aws 계정 안에서 실행되고 있어서 
    신뢰할 수 있다고 볼 수 있다.    




- - -   

**Reference**

<https://inpa.tistory.com/entry/AWS-%F0%9F%93%9A-VPC-%EA%B0%9C%EB%85%90-%EC%82%AC%EC%9A%A9-%EB%B3%B4%EC%95%88-%EC%84%A4%EC%A0%95-Security-Group-NACL>    
<https://inpa.tistory.com/entry/AWS-%F0%9F%93%9A-VPC-%EC%82%AC%EC%9A%A9-%EC%84%9C%EB%B8%8C%EB%84%B7-%EC%9D%B8%ED%84%B0%EB%84%B7-%EA%B2%8C%EC%9D%B4%ED%8A%B8%EC%9B%A8%EC%9D%B4-NAT-%EB%B3%B4%EC%95%88%EA%B7%B8%EB%A3%B9-NACL-Bastion-Host>    

{% highlight ruby linenos %}


{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

