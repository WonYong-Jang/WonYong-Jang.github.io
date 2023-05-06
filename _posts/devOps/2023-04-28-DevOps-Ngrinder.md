---
layout: post
title: "[nGrinder] 어플리케이션 성능 테스트"
subtitle: "성능 지표 확인하기(TPS, MTT) / 부하 테스트, 성능 테스트, 스트레스 테스트 차이"
comments: true
categories : DevOps
date: 2023-04-28
background: '/img/posts/mac.png'
---

현재 업무에서 실시간으로 집계 결과값을 제공하는 api를 개발하고 있고, 
    해당 api가 배포 되었을 때 성능이 어느정도까지 도달할 수 있는지 
    측정해보고자 한다.   

따라서 서버가 트래픽을 얼마 만큼 수용할 수 있는지 오픈소스인 nGrinder를 
사용하여 성능 테스트를 진행해보려고 한다.     

- - - 

## 1. 테스트 종류    

시작 전에 `부하테스트, 스트레스 테스트, 성능 테스트의 차이`에 대해 먼저 살펴보자.    

[링크](https://www.apple-economy.com/news/articleView.html?idxno=69902)와 같이 
테스트 각각 이점을 가지고 있고, 이를 정확하게 구분할 수 있어야 
추후 예상되는 각종 오류나 문제점, 기회 비용을 예방할 수 있다.   

<img width="541" alt="스크린샷 2023-05-06 오후 5 31 16" src="https://user-images.githubusercontent.com/26623547/236613011-e7373aae-3338-4a9b-810c-1c0c1dc345c2.png">    


`성능 테스트(Performance Test)는 특정 상황에서 어느 정도 성능을 보이는지 측정하는 테스트이다.`    
보통 성능 테스트와 부하 테스트는 혼동되어 사용되곤 하는데 부하 테스트는 
스트레스 테스트와 함께 성능 테스트의 하위 요소에 속한다.    
`성능 테스트는 어플리케이션의 결함을 찾는 것을 목표로 하지 않으며, 테스트를 통과하거나 실패로 
나누지 않는다.`       
성능 테스트의 일반적인 목적은 현재의 어플리케이션이 
최대로 수용가능한 동시 사용자 수가 몇 명인지, 혹은 목표로 정한
성능이 도출되지 않을 때 병목지점이 어딘지를 밝히고 목표 성능을 
획득하기 위해 무엇을 시정해야 하는지를 찾아내기 위함이다.     
성능 테스트 과정에서 매우 중요한 부분은 목표 성능을 설정하고
그러한 목표 성능을 확인 및 측정하기 위해 향후 시스템 운영 중에
실제로 발생할 접속 사용자의 호출 패턴이 어떠하냐를 분석 및 추정하는 과정이
반드시 필요하다.    
이러한 주요 지표 중 일부는 다음과 같다.    

- 디스크 시간: 요청을 작성하거나 읽기를 실행하는데 소요된 시간    
- 대역폭 사용량: 네트워크 인터페이스에서 사용하는 초당 비트 수   
- 처리량: 초당 수신된 요청 비율   
- 스레드 수: 활성 스레드 수   
- 메모리 사용: 가상 메모리 사용 패턴    


`스트레스 테스트(Stress Test)는 어플리케이션이 실행 시에 필요로 하는 
각종 리소스(CPU, RAM, Disk 등)의 허용하는 한도를 넘어서서 비정상적인 
높은 부하를 발생시켜보는 테스트를 말한다.`    
일정한 한도를 넘어서는 부하 상황이 되면 경우에 따라 JVM이 다운되거나, 데이터를 
잃어버리게 되는 것 등과 같이 시스템의 비정상적인 작동을 
유발시킬 수도 있다.   
`이 같은 결점(Bug)나 결함(failure)를 찾기 위해 스트레스를 가해보는 것이다.`      
스트레스 테스트 시의 부하는 이처럼 시스템 리소스 한계점을 시험하려는 
의도이기 때문에, 향후 실제 접속자에 의해 발생하는 부하량 패턴과는 
거리가 멀 수도 있다.   

> 스트레스 테스트는 시스템 과부하 상태에서 모니터링 알람이 잘 오는지 
확인하거나, Auto Scailing 계획이 잘 동작하는지 등 장애가 발생했을 때 어떻게 복구할 수 있는지를 
확인할 수 있다.   
> 교착 상태, 동시성 문제, 데이터 불일치, 동기화 병목현상, 메모리 누수 등 다양한 장애 요인을 찾을 수도 있다.   

`반면, 부하(Load Test)는 임계 값 한계에 도달하는 순간까지 시스템의 부하를 지속적으로 
증가하면서 진행하는 테스트이다.`        
부하 테스트의 목표는 어플리케이션의 데이터베이스, 하드웨어, 네트워크 등과 같은 
구성 요소에 대한 상한을 결정한다.   
> 또한, 어플리케이션에 대한 SLA(Service Level Agreement)를 설정하는데, 사용할 수 있다.   


- - - 

## 2. nGrinder 란   
 
`nGrinder는 네이버에서 개발한 부하 테스트 툴이며, 크게 controller와 agent로 구분된다.`      

- controller: 웹 기반 GUI 시스템으로, 작업을 전반적으로 관리하며 부하스크립트 작성 기능을 지원한다.   

- agent: controller의 명령을 받아 작업을 수행하며 프로세스 및 스레드를 실행시켜 타겟이 되는 어플리케이션에 부하를 발생시킨다.     

<img width="800" alt="스크린샷 2023-04-28 오후 1 09 45" src="https://user-images.githubusercontent.com/26623547/235052106-bdd1b09d-40f1-4a5a-9434-3aba8fe2ea2b.png">    

- Monitor: 우리가 테스트하고자 하는 대상 서버를 target 서버라 부르고, target 서버에서 발생한 
오류들 혹은 CPU, Memory 상태 등 조금 더 자세한 정보를 확인하고 싶다면 Target 서버에 
nGrinder Monitor를 설치하면 확인할 수 있다.   

만약 세 가지 요소가 하나의 서버에 존재한다면 서버는 자원을 
나눠서 사용해야 하고, 그만큼 Context Switching이 발생하는 등 
테스트에 있어서 불필요한 노이즈가 발생하게 되기 때문에 
순수한 target 서버의 성능을 노출하기 어려워진다.   

그러므로 각각 서버를 분리하여 설치하는 것이 권장되며, 필요에 따라 vUser 수를 
늘리기 위해서 agent 서버를 추가적으로 설치할 수도 있다.   

> 이 글에서는 Monitor는 다루지 않으며, 빠르게 nGrinder를 온보딩하기 위해 
로컬에서 설치를 진행하여 테스트할 예정입니다.   

- - - 

## 3. nGrinder 설치      

docker를 통해 설치를 진행하며 아래와 같이 작성 후 
docker-compose를 통해 실행시킨다.   

```yaml
version: "3.8"
services:
  controller:
    image: ngrinder/controller
    restart: always
    ports:
      - "9000:80"
      - "16001:16001"
      - "12000-12009:12000-12009"
    volumes:
      - ./ngrinder-controller:/opt/ngrinder-controller
  agent:
    image: ngrinder/agent
    restart: always
```

`초기 주소는 http:localhost:9000 를 통해 접속한다.`   

- 아이디: admin    
- 패스워드: admin  

nGrinder 웹페이지에 로그인을 완료하면 아래와 같은 화면이 보일 것이다.   

<img width="1224" alt="스크린샷 2023-04-27 오후 6 49 27" src="https://user-images.githubusercontent.com/26623547/234827992-6f0dc3d8-c9db-4094-b82e-2aa4769070b4.png">     

페이지 상단에 Performance Test, Script 2개의 메뉴가 있다.   

`Performance Test는 어플리케이션을 테스트하고 그 결과에 대해 조회할 수 있는 메뉴이고, 
Script는 Performance Test를 하기 전 어떻게 테스트할 것인가를 작성하는 Script이다.`       

아래와 같이 `admin > Agent Management` 로 접속해보면, agent가 정상적으로 생성되어 있는 것을 
확인 할 수 있다.   

<img width="1209" alt="스크린샷 2023-04-27 오후 6 57 17" src="https://user-images.githubusercontent.com/26623547/234828903-67679f45-d72f-419b-b021-9f58876b4a99.png">    

nGrinder의 로그는 controller 쪽에만 존재하며, 경로는 아래와 같다.   

> 또는 테스트 결과 UI에서 로그를 다운로드 할 수도 있다.

```
./ngrinder-controller/perftest       
```

- - -     

## 4. Script 작성    

이제 테스트에 사용할 스크립트를 작성해보자.   
스크립트는 Groovy 언어로 작성가능하며, 자바와 유사하기 때문에 러닝커브 없이 
사용 가능하다.   

`Script > Create > Create a script` 버튼을 클릭 후, 
    스크립트 이름과 테스트할 URL을 입력하면 된다.   

`URL에는 localhost나 127.0.0.1로 테스트 할 수 없다`    
`로컬에서 테스트할 경우 개인 PC 환경설정에서 IP 확인 후 기입한다.`    

그 후 Create 버튼을 클릭하게 되면, 아래와 같이 스크립트가 자동으로 생성된다.   

<img width="1000" alt="스크린샷 2023-04-27 오후 7 20 56" src="https://user-images.githubusercontent.com/26623547/234834719-40fc983c-fca6-4841-8cfa-ac787ddcdf6d.png">   

마지막으로 저장 버튼을 클릭하게 되면, 스크립트 작성은 완료 되었다.   

- - - 

## 5. nGrinder 테스트 실행     

이제 작성한 스크립트를 기준으로 테스트를 생성해보자.   

Performance Test 메뉴에서 Create Test를 클릭 후 
테스트할 옵션들을 선택해보자.   

<img width="1500" alt="스크린샷 2023-05-06 오후 6 16 16" src="https://user-images.githubusercontent.com/26623547/236615486-d2119174-2bde-44cd-baf6-bd0c761c6bfd.png">


### 5-1) Basic Configuration   

##### 5-1-1) Agent     

실행할 Agent 갯수(현재는 1개이므로 1로 기입)   

##### 5-1-2) Vuser per agent   

`agent 당 설정할 가상 사용자 수이며 동시에 요청을 하는 사용자 수를 의미한다.`    

실행하는 Controller 서버 사양을 고려하여 설정하지 않으면 
agent is about to die due to lack of free memory라는 에러가 
발생할 수 있다.   

`vUser = agent * process * thread 로 계산 할 수 있다.`   

##### 5-1-3) Script      

성능 측정시 각 agent에서 실행할 스크립트이다.   
groovy로 작성한 스크립트를 연결하거나 github에서 가져올 수 있다.   

##### 5-1-4) Duration(HH:MM:SS)        

성능 측정 수행 시간    

##### 5-1-5) Run Count   

요청 갯수를 의미하며, Duration과 Run Count 중 선택 가능   


### 5-2) Enable Ramp-Up    

성능 측정 과정에서 가상 사용자를 점진적으로 늘리도록 활성화 할 수도 있다.   

> prcess와 thread 중 선택    

##### 5-2-1) Initial Count   

처음 시작시 Process 또는 Thread 수     

##### 5-2-2) Initial Sleep Time   

초기 대기 시간을 지정   

##### 5-2-3) Incremental Step   

Process 또는 Thread를 증가시키는 개수          

##### 5-2-4) Interval   

Process 또는 Thread를 증가시키는 시간 간격    




- - -    

## 6. nGrinder 테스트 결과   

실행이 완료 되면 테스트 결과를 아래와 같이 확인할 수 있다.   
Detailed Report 버튼을 클릭하여 더 상세한 테스트 결과를 확인할 수 있으며, 
         CSV 파일로 결과를 다운로드 받을 수도 있다.   

<img width="417" alt="스크린샷 2023-05-06 오후 6 24 07" src="https://user-images.githubusercontent.com/26623547/236615617-d9362e12-fdb4-4977-becd-43beb0586bb6.png">   

<img width="797" alt="스크린샷 2023-05-06 오후 6 24 15" src="https://user-images.githubusercontent.com/26623547/236615625-2106f027-123b-4e34-89e7-fd3ace77619c.png">   



`테스트 결과 중에 가장 먼저 봐야할 것은 MTT(Mean Test Time)이며, 평균적인 1회 수행 시간이라고 보면 된다.`       

`또한, TPS(Transaction Per Second)는 초당 처리 갯수이며, TPS가 높을 수록 
MTT와 에러는 적을 수록 좋은 성능을 나타낸다.`   

- - - 

## 글 마무리   

이 글에서는 nGrinder를 설치해보고, 성능 측정하는 방법을 
살펴봤다.  

`nGrinder를 활용하면 스크립트 생성과 테스트 실행, 모니터링 및 결과 보고서 생성을 
통합된 Web UI를 통해 사용할 수 있으므로 성능 테스트를 보다 쉽게 할 수 있었다.`   

nGrinder 설치 및 기본적인 성능 테스트는 어렵지 않다. 하지만, 실무에서 테스트의 
목적과 전략 그리고 각 지표를 통해 어떤 가설을 세울 수 있을지가 더 중요해 보인다.   

정확한 nGrinder 성능 테스트를 하기 위해서는 controller, agent, target 서버가 필요하고, 
    이는 각각 다른 서버로 구성되어 있어야 한다.   

마지막으로 여러 agent를 설치하여 부하 테스트를 진행할 때, 동적으로 agent 수를 
늘리고 싶을 때 [링크](https://jojoldu.tistory.com/581)를 고려해보자.   

- - -
Referrence 

<https://github.com/naver/ngrinder>   
<https://jojoldu.tistory.com/581>    
<https://brownbears.tistory.com/26#google_vignette>    
<https://techblog.woowahan.com/2572/>    

{% highlight ruby linenos %}
{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

