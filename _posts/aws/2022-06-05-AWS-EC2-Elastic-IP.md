---
layout: post
title: "[AWS] EC2 인스턴스 생성 및 고정 IP를 이용한 클라우드 서비스 배포"
subtitle: "Elastic Compute Cloud / Elastic IP / Docker Compose를 이용하여 ec2에 애플리케이션 배포하기"
comments: true
categories : AWS
date: 2022-06-05
background: '/img/posts/mac.png'
---

이번 글에서는 AWS의 EC2를 생성하고 Docker Compose를 이용하여 
애플리케이션을 배포하는 과정을 다루려고 한다.   

AWS는 프리티어로 가입이 되어 있다고 가정하고 진행한다.   

## 1. AWS EC2 인스턴스 생성   

AWS 회원 가입을 하고 처음 화면에서 확인이 필요한 부분은 
`리전을 확인을 해야 한다.`   

여기서 리전이란?   

`AWS의 서비스가 구동될 지역을 말한다. AWS는 도시별로 클라우드 센터를 
지어 해당 센터에서 구축된 가상머신들을 사용할 수 있는데, 
    이를 리전이라고 한다.`   

> 서울 리전이 생기기 전까지는 국내 서비스들은 도쿄 리전을 사용했다. 한국과 
가장 가까운 지역이라 네트워크가 가장 빠르기 때문이다.   

`하지만 현재는 서울 리전이 존재하기 때문에 국내에서 서비스를 한다면 
무조건 서울 리전을 선택하면 된다.`      

AWS에서 로그인을 한 뒤 우측 상단에 보면 아래 사진과 같이 있다.  
서울로 설정이 되어 있지 않다면 서울로 변경해준다.   

<img width="400" alt="스크린샷 2022-06-05 오후 6 34 11" src="https://user-images.githubusercontent.com/26623547/172044440-460f3d34-8687-4dd2-b8a8-25cd4fe5810c.png">   

#### 1-1) 인스턴스 시작 

그 후 서비스 > EC2에 들어온 뒤 인스턴스 시작 버튼을 클릭한다.   

<img width="400" alt="스크린샷 2022-06-05 오후 6 37 08" src="https://user-images.githubusercontent.com/26623547/172044501-fb7d1f99-42a5-4e79-a38d-74fa526b3caf.png">   

#### 1-2) AMI 선택 

다음으로 AMI를 선택한다.   

`AMI는 EC2 인스턴스를 시작하는데 필요한 정보를 이미지로 만들어 둔 것을 의미한다.`   

`여기서는 Amazon Linux 2 AMI (HVM)을 선택한다.`   

<img width="700" alt="스크린샷 2022-06-05 오후 6 42 34" src="https://user-images.githubusercontent.com/26623547/172044724-7d47d6e1-02ac-4d48-a4ba-3702ad7abdd0.png">   
  

#### 1-3) 인스턴스 유형 선택      

다음으로 인스턴스 유형을 선택한다.      
`여기서는 프리티어에서 사용 가능한 t2.micro 유형을 선택하도록 하자.`   

<img width="700" alt="스크린샷 2022-06-05 오후 6 42 51" src="https://user-images.githubusercontent.com/26623547/172044691-8e619c4a-7961-40be-8ce6-4bf3384de77c.png">   

#### 1-4) 태그 추가   

다음은 태그 추가 부분이다. 

태그는 해당 인스턴스를 표현하는 여러 이름으로 사용될 수 있는데, 
    EC2의 이름을 붙인다고 생각하면 된다.   

<img width="750" alt="스크린샷 2022-06-05 오후 7 05 32" src="https://user-images.githubusercontent.com/26623547/172045430-f7833dd9-75de-4c61-bd38-e4c867f47737.png">    

#### 1-5) 키 페어 생성    

`키 페어는 EC2 서버에 SSH 접속을 하기 위해 필수라서 생성해야 한다.`   

`새 키 페어 생성을 눌러 원하는 이름을 적고 생성한다.`   
아래 그림처럼 설정 후 생성하면 pharmacy-recommendation.pem 파일이 다운되며, 
    ssh 환경에 접속하기 위해서는 해당 키 파일이 존재하는 위치로 가서 
    ssh 명령어를 실행하면 된다.   

> 한번 다운받은 후에는 재 다운 받을 수 없기 때문에 안전한 곳에 저장해준다.   

`인스턴스는 지정된 pem 키(비밀키)와 매칭되는 공개키를 가지고 있어, 해당 pem 키 외에는 
접근을 허용하지 않는다.`        

<img width="650" alt="스크린샷 2022-06-05 오후 7 02 26" src="https://user-images.githubusercontent.com/26623547/172045308-4e90b123-b2d7-4edd-9dd8-a61e37598985.png">   

<img width="650" alt="스크린샷 2022-06-05 오후 7 02 13" src="https://user-images.githubusercontent.com/26623547/172045313-90cc7fc8-3d7e-4621-8cf8-7613cd7d1d5f.png">   

#### 1-6) 네트워크 및 스토리지 선택   

`보안 그룹은 방화벽을 의미한다.`   
이 보안그룹은 굉장히 중요한 부분이므로 신중하게 설정을 해야 한다.      

<img width="750" alt="스크린샷 2022-06-05 오후 7 22 32" src="https://user-images.githubusercontent.com/26623547/172045994-57fbb586-97e4-40f4-8f32-6b908e60e9a5.png">   

ssh 트래픽은 aws ec2에 터미널로 접속할 때를 이야기 한다.   
pem키가 없으면 접속이 안되어서 전체 오픈(0.0.0.0/0)을 하는 경우가 종종 있으나, 
    실수로 깃허브 등에 pem 키가 노출되는 경우 위험하므로 `pem키 관리와 지정된 IP(내 IP)에서만 
    ssh 접속이 가능하도록 구성하는 것이 안전하다.`     
  
`프리티어는 최대 30 까지 지원하기 때문에 해당 부분만 변경`해준다.   
`볼륨 유형은 범용 SSD`로 선택한다.     

<img width="750" alt="스크린샷 2022-06-05 오후 7 14 23" src="https://user-images.githubusercontent.com/26623547/172045782-a6c1bf84-3ad0-4274-bfd7-62ea22059f99.png">     

다 설정하면 우측에 간단하게 지금까지 설정한 인스턴스 요약이 나온다.   
이상없다면 인스턴스 시작을 클릭하여 생성하면 된다.   

<img width="900" alt="스크린샷 2022-06-05 오후 7 45 15" src="https://user-images.githubusercontent.com/26623547/172046845-0917fcc5-f799-43a4-a215-22546f787564.png">   
  

- - - 

## 2. 고정 IP(Elastic IP) 설정   

`인스턴스도 하나의 서버이기 때문에 IP가 존재하는데, 인스턴스 생성 시 
항상 새로운 IP로 할당된다.`   

`추가적으로 동일한 인스턴스를 중지하고 다시 시작할 때도 
새로운 IP가 할당 된다.`   

이렇게 되면 매번 접속해야 하는 IP가 변경돼서 PC에서 접근할 때마다 
IP의 주소를 확인해야 하는 번거로움이 발생한다.  

<img width="1000" alt="스크린샷 2022-06-05 오후 7 52 03" src="https://user-images.githubusercontent.com/26623547/172047153-5e09d4ee-6a08-45c2-b7d9-6b7efc0a8dc3.png">   

위 그림처럼 생성한 ec2 인스턴스의 퍼블릭 IP가 변경되는지 확인해보려면, 
    해당 인스턴스의 퍼블릭 IP를 확인 하고 인스턴스 재시작 후 IP를 확인해보면 된다.   

위에 탄력적 IP란은 설정해주지 않았기 때문에 비어있다.   

따라서 인스턴스의 IP가 매번 변경되지 않고 고정 IP(탄력적 IP)를 
가지게 설정해보자.   

#### 2-1) 탄력적 IP 메뉴 접근   

메뉴에서 탄력적 IP를 찾아서 들어간다.   

<img width="600" alt="스크린샷 2022-06-05 오후 7 57 26" src="https://user-images.githubusercontent.com/26623547/172047392-e7e2f097-7c87-4da6-bbe1-1bfb5f0aaede.png">   

바로 할당 버튼을 클릭하여 만들어준다.   

<img width="700" alt="스크린샷 2022-06-05 오후 8 01 36" src="https://user-images.githubusercontent.com/26623547/172047441-c5a5d6f0-9251-401a-8c4c-23f369afede8.png">   


#### 2-2) 탄력적 IP 주소 선택   

<img width="1000" alt="스크린샷 2022-06-05 오후 8 03 32" src="https://user-images.githubusercontent.com/26623547/172047517-2d84d163-e6d9-47ab-b186-3e528b3d413b.png">    

방금 생성한 탄력적 IP를 선택해서 연결을 시도한다.    

#### 2-3) 인스턴스 선택 및 연결     

설정 화면에 들어가면 내 인스턴스 목록을 선택할 수 있고 연결된 
프라이빗 IP까지 선택 가능하다.   

<img width="900" alt="스크린샷 2022-06-05 오후 8 12 05" src="https://user-images.githubusercontent.com/26623547/172047846-ce706ee2-94ff-4169-8570-16df72ea0907.png">   


#### 2-4) 인스턴스 정보 확인 

탄력적 IP를 연결하고 다시 인스턴스 정보를 확인해보면 IP가 할당된 것을 볼 수 있다.   
퍼블릭 IP 주소도 기존 값에서 탄력적 IP 주소로 자동으로 변경되었다.   

<img width="1100" alt="스크린샷 2022-06-05 오후 8 18 26" src="https://user-images.githubusercontent.com/26623547/172048140-09b61bf0-0f26-4203-961d-d7ad58ed1a5b.png">      


#### 2-5) Elastic IP 요금 주의사항   

`AWS 프리티어에서는 무료로 EIP 1개를 사용할 수 있다.`   

하지만 [링크](https://aws.amazon.com/ko/premiumsupport/knowledge-center/elastic-ip-charges/)를 확인하지 않고 
사용할 경우 과금이 발생할 수 있으니 반드시 숙지하자.  

EIP를 만들어두고 사용하지 않거나, EC2에 연결해두었다고 해도 EC2가 
Stop된 상태라면 과금이 발생한다.   

> EIP를 만들어두고 사용하지 않게되면 낭비되는 IP가 발생하기 때문에 과금을 발생시키는 것 같다.   


- - - 

## 3. SSH 클라이언트로 서버 접속    

이제 내가 만든 EC2 인스턴스에 접속해보자.   
`인스턴스 정보에서 연결 버튼을 클릭하면 인스턴스에 연결 가능한 
여러가지 방법을 알려준다.`   

<img width="1000" alt="스크린샷 2022-06-05 오후 11 15 06" src="https://user-images.githubusercontent.com/26623547/172054933-83b397ee-bafe-42de-b529-e17f2f031cd1.png">   

여기서는 SSH 클라이언트로 접속하는 방법을 확인하고 그대로 따라가보자.   

<img width="1000" alt="스크린샷 2022-06-05 오후 11 15 21" src="https://user-images.githubusercontent.com/26623547/172054938-ee8cd486-31f5-4c97-a7b9-b337c741be76.png">     

- - - 

## 4. 보안 그룹 설정   

`보안 그룹은 AWS에서 제공하는 방화벽 모음이다.`   

서비스를 제공하는 애플리케이션이라면 상관 없지만 RDS처럼 외부에서 
함부로 접근하면 안되는 인스턴스는 허용된 IP에서만 접근하도록 설정이 
필요하다.   

- 인바운드(Inbound): 외부 -> 인스턴스 내부 허용     
- 아웃바운드(Outbound): 인스턴스 내부 -> 외부 허용   

#### 4-1) 현재 보안 그룹 확인   

`인스턴스 정보의 보안 탭에서 현재 설정된 보안 그룹을 확인할 수 있다.`   

위에서 생성한 인스턴스의 보안그룹을 해석해보자.   
인바운드 규칙을 보면, 22번 포트의 내 IP에 대해서는 TCP 연결을 허용한다는 의미로 
인스턴스에 SSH 접속을 직접 하기 위해서는 지정된 IP만 허용을 해주었다.   

반면, 아웃바운드의 경우는 모든 IP에 대해서 연결을 허용해 주었다.   

여기서 나의 어플리케이션을 다른 사용자가 접속하여 사용할수 있게 
하기 위해서는 인바운드 규칙을 추가 해야 한다.   

<img width="1173" alt="스크린샷 2022-06-06 오후 4 38 01" src="https://user-images.githubusercontent.com/26623547/172117357-b93c517c-809e-4fd2-8906-7e1801a37267.png">    

#### 4-2) 보안 그룹 수정    

보안그룹으로 이동하여, 방금 전에 EC2에서 설정되어있던 보안 그룹을 수정해보자.   

<img width="1395" alt="스크린샷 2022-06-06 오후 4 46 09" src="https://user-images.githubusercontent.com/26623547/172118513-fc1a6c2a-2389-4cf8-81f4-0421b1d05279.png">    

위처럼, 인바운드 규칙에서 인바운드 규칙 편집을 클릭해보자.   
규칙 추가 버튼을 클릭하여 인바운드 규칙을 추가한다.   

<img width="1376" alt="스크린샷 2022-06-06 오후 4 53 38" src="https://user-images.githubusercontent.com/26623547/172119445-3bab7f12-f006-4149-a935-eaa8019f118a.png">   
 
- - - 

## 5. Docker Compose 설치 및 배포   

EC2에 접속하여 도커 및 Git을 설치해 보자.  

#### 5-1) Git 설치   

```
#Perform a quick update on your instance:
$ sudo yum update -y

#Install git in your EC2 instance
$ sudo yum install git -y

#Check git version
$ git version
```

#### 5-2) 도커 및 도커 컴포즈 설치   

```
//도커 설치  
$ sudo yum install docker
$ docker -v

// 도커 컴포즈 설치 
$ sudo curl -L https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m) -o /usr/local/bin/docker-compose

// 실행 권한 적용   
$ sudo chmod +x /usr/local/bin/docker-compose    
$ sudo chmod 666 /var/run/docker.sock
$ docker-compose -v
```   
 
#### 5-3) 도커 시작하기   

```
$ sudo systemctl start docker
```

#### 5-4) Docker Compose 파일이 존재하는 소스 내려받기  

```
$ git clone https://github.com/WonYong-Jang/Pharmacy-Recommendation.git
```  

#### 5-5) Docker 환경변수    

로컬에서 개발할 때, DB 계정 정보나 외부에 노출되면 안되는 값들을 따로 
제외하여 관리하였고 이를 도커 컨테이너를 실행할 때 전달해주어야 하는데 
이때 .ENV 파일을 사용할 수 있다.  

`docker-compose를 사용할때 .env라는 파일에 환경변수를 사용하면 자동으로 
참조하여 사용할 수 있다.`    

이를 동일하게 EC2에서도 docker-compose파일이 있는 위치에 
아래와 같이 환경변수 값들을 추가해 주어서 docker-compose 실행시 
해당 값들을 참조하여 컨테이너를 실행시킬 수 있게 해준다.   

```
$ vi .env   

SPRING_DATASOURCE_USERNAME=root
SPRING_DATASOURCE_PASSWORD=1234
```

.env 파일을 생성후 아래 명령어를 통해 값을 확인 가능하다.   

```
$ docker-compose config    
```   

#### 5-6) Docker 이미지 받고 Docker Compose 실행    

```
$ docker pull {도커 허브 이미지 경로}

$ docker-compose up
```

위와 같이 도커 허브에 push한 이미지가 있다면, 해당 이미지를 
내려받고 docker-compose를 이용해서 애플리케이션을 실행시킨다.     

<img width="882" alt="스크린샷 2022-06-06 오후 6 07 46" src="https://user-images.githubusercontent.com/26623547/172131535-a3d87de5-dac4-43cb-a5fb-bb16245826ed.png">    

위에서 적용한 Elastic IP를 통해 접속하게 되면, 정상적으로 애플리케이션을 
접속하는 것을 확인 할 수 있다.   

- - -   

**Reference**

<https://bcp0109.tistory.com/356>   
<https://zzang9ha.tistory.com/329?category=954133>   

{% highlight ruby linenos %}


{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

