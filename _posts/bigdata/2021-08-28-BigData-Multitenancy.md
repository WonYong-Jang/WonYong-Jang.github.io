---
layout: post
title: "[BigData] 멀티 테넌시 (Multi-tenancy) 아키텍처"
subtitle: "멀티테넌시 사용시 고려사항 및 장단점"       
comments: true
categories : BigData
date: 2021-08-20
background: '/img/posts/mac.png'
---

## 멀티 테넌시   

`멀티 테넌시는 소프트웨어 어플리케이션의 단일 인스턴스가 여러 고객에게 
서비스를 제공하는 아키텍처이다.`    

그 용어에서 유추할 수 있듯 여러 테넌트(tenant, 사용자)를 가진 아키텍처라는 
의미이다. 많은 사람이 같은 기능을 사용하는 웹메일 서비스가 대표적인 
멀티테넌시 아키텍처 소프트웨어이다.   

> 테넌트(tenant)를 조금더 자세히 설명하면 소프트웨어 인스턴스에 대해 공통이 
되는 특정 접근 권한을 공유하는 사용자들의 그룹이다.   

여기서 중요한 것은 각 사용자가 독립적으로 이용할 수 있어야 한다는 점이다. 
웹메일에 접속했는데 모든 사용자의 메일이 하나의 메일함에서 보인다면 아무도 
사용하지 않을 것이다. 멀티테넌트 아키텍처 덕분에 사용자 별로 데이터와 
설정, 화면 구성 등 많은 속성을 개인화 할 수 있게 됐고, 이 기술이 
성숙하면서 비로소 클라우드도 본격 확산했다고 할 수 있다.   

멀티 테넌시(Multi-tenancy)는 고객마다 새로운 시스템을 만들 필요가 
없기 때문에 
소프트웨어 개발과 유지보수 비용을 
공유할 수 있어서 경제적이다.    
즉, 오류를 발견해도 하나만 수정하면 전세계 고객에게 똑같이 적용되고, 
    한 번만 업그레이드하면 전 세계 고객이 동시에 이를 이용할 수 있다.   

> 멀티테넌시는 개개의 소프트웨어의 인스턴스들이 각기 다른 테넌트를 위해 
운영되는 멀티인스턴스 구조와는 상반된다.   

<img width="752" alt="스크린샷 2021-08-28 오후 2 48 42" src="https://user-images.githubusercontent.com/26623547/131207825-57a26ab1-a962-4e84-8648-0c9688d90b73.png">    


- - - 

## 장점과 단점     

멀티테넌시 아키텍처가 등장한 지 10년이 넘어가면서 상당한 수준까지 고도화되었다.   
`같은 소프트웨어를 사용해도 사용자 혹은 기업고객별로 메뉴 구성과 디자인 등을 
완전히 다른 형태로 구성할 수 있다. 기업별 고유의 업무 절차 차이까지도 
반영해 소프트웨어를 수정할 수 있고 특히 특정 기업단위 사용자 중 일부에게 
특정 권한과 제한을 하는 것도 가능해졌다.`    

그럼에도 불구하고 멀티테넌시에는 몇 가지 단점이 있다. 예를 들어 개인화를 지원하기 
위해서는 더 정교한 멀티테넌시 아키텍처를 적용해야 하는데 이를 개발하는 
입장에서는 상당한 비용과 인력이 필요하다. 업데이트 과정에서 자칫 버그나 
장애가 발생하면 모든 사용자가 공통으로 장애를 겪을 수 있고, 또 일부 사용자에게 
유용한 업데이트가 다른 사용자에게는 오히려 불편함을 유발할 수도 있다.   

`가장 논란이 되는 것은 보안이다. 외부적으로 사용자별로 다른 것처럼 보인다고 
해도 결국 멀티테넌시 아키텍처 내부적으로는 단일 데이터베이스에 
다양한 사용자의 데이터가 공존하게 된다. 따라서 사용자 별 데이터가 서로 섞이지 
않도록 해야하고, 해킹이라도 발생하면 해당 장비를 사용하는 모든 사용자의 데이터가 
동시에 유출되지 않도록 더 강력한 보안 체계를 갖춰야 한다.`   

- - - 

## 클라우드 내 멀티 테넌시   

클라우드 컴퓨팅에서 가상화, 컨테이너화, 원격 액세스를 활용하는 새로운 서비스 
모델 때문에 멀티 테넌시 아키텍처의 의미가 확대 되었다.  
퍼블릭 클라우드 제공자는 동시에 더 많은 사용자를 수용하기 위해 멀티 테넌트 
아키텍처에 의존한다.   
고객의 작업 부하가 하드웨어 및 기본 소프트웨어에서 추상화되므로 
여러 사용자가 동일한 호스트에 상주할 수 있다.   

단일 테넌트 클라우드에서는 각 고객이 소프트웨어 어플리케이션의 전용 인스턴스를 
가지고 있다. 
이와는 대조적으로, SaaS(Software as a Service) 제공자는 데이터베이스의 
한 인스턴스에서 어플리케이션의 한 인스턴스를 실행하고 여러 고객에게 
웹 엑세스를 제공할 수 있다.   
이러한 시나리오에서는 각 테넌트의 데이터가 격리되어 테넌트에게는 보이지 
않는 상태를 유지해야 한다.   
멀티테넌시 아키텍처를 사용할 때 데이터베이스 구성은 [링크](https://vladmihalcea.com/database-multitenancy/)를 
참조하자.   

<img width="588" alt="스크린샷 2021-08-28 오후 4 42 59" src="https://user-images.githubusercontent.com/26623547/131210629-0e0f74bc-f9c8-4582-97a4-5c3feed8d26c.png">   

- - - 

**Reference**   

<https://pasupuletipradeepkumar.wordpress.com/2015/01/15/multi-tenancy-and-hadoop/>   
<https://m.blog.naver.com/ki630808/221778753901>   
<https://www.itworld.co.kr/news/101255>  
<https://vladmihalcea.com/database-multitenancy/>   

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}
