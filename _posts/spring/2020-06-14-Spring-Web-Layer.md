---
layout: post
title: "[Spring] Web Layer(웹 계층) 과 도메인 모델 패턴"
subtitle: "Web, Service, Repository, Dtos, Domain / DTO와 Entity 사용 범위 / 비지니스 로직은 Service에서 처리해야할까?"
comments: true
categories : Spring
date: 2020-06-14
background: '/img/posts/spring.png'
---

<img width="624" alt="스크린샷 2020-06-14 오후 5 33 35" src="https://user-images.githubusercontent.com/26623547/84589073-2a22a700-ae67-11ea-99c8-4ce1086150df.png">
- - -

## 1. Web Layer 

- 흔히 사용하는 Controller와 JSP/Freemaker 등의 뷰 템플릿 영역이다.   
- 이외에도 필터(@Filter), 인터셉터, 컨트롤러 어드바이스(@ControllerAdvice) 등 
`외부 요청과 응답에 대한 전반적인 영역을 의미한다.`   

## 2. Service Layer  

- @Service에 사용되는 서비스 영역이다.   
- 일반적으로 Controller와 DAO의 중간 영역에서 사용된다.  
- @Transactional이 사용되어야 하는 영역이기도 하다.   

## 3. Repository Layer

- Database와 같이 데이터 저장소에 접근하는 영역이다.   
- Entity의 영속성을 관장하는 역할이다.   
- Dao(Data Access Object) 영역이라고 생각하면 된다.   

## 4. Dtos

- Dto ( Data Transfer Object)는 `계층 간에 데이터 교환을 위한 객체`를 의미하며, 
    Dtos는 이들의 영역을 의미한다.   
- 예를 들어 뷰 템플릿 엔진에서 사용될 객체나 Repository Layer에서 결과로 넘겨준 객체 등이 
이들을 이야기 한다.   

## 5. Domain Model

- 도메인이라 불리는 개발 대상을 모든 사람이 동일한 관점에서 이해할 수 있고 
공유할 수 있도록 단순화시킨 것을 도메인 모델이라고 한다.   
- 비즈니스 로직을 처리하는 영역!!   
- 이를테면 택시 앱이라고 하면 배차, 탑승, 요금 등이 모두 도메인이 될 수 있다.   
- @Entity가 사용된 영역 역시 도메인 모델이라고 이해하면 된다.   
- 다만, 무조건 데이터베이스의 테이블과 관계가 있어야 하는 것은 아니다. VO처럼 값 
객체들도 이 영역에 해당하기 때문이다.   

- - - 

## 비즈니스 로직은 Service에서 처리해야할까?    

스프링 개발을 하면서 쭉 오해하던 부분이 있었는데, 비즈니스 로직 처리는 
무조건 Service에서 해야 한다는 것이였다.   

`기존에 서비스에서 모든 비즈니스 로직을 처리하는 것을 트랜잭션 스크립트 패턴 이라고 한다.`      
이것의 단점은 프로젝트가 커지면서 하나의 서비스에서 더욱 많은 모델을 
읽어 로직이 구성될 수록 서비스의 복잡도가 매우 높아진다는 것이다.   
복잡도가 높아지면 결국 테스트와 유지보수가 힘들어지게 되는것이고 유연하지 
못한 소프트웨어가 된다.   
`이러한 이유때문에 Service에서는 트랜잭션, 도메인 간 순서 보장의 역할만 
하는 것이 좋다.`    

그렇다면 기존에 Service에서 처리하던 비즈니스 로직은 어디서 구현이 되어야 할까?   

`위의 그림에서 Domain 영역에서 처리한다.`   
위에 그림에서 Domain 영역을 보면 entity, VO(Value Object)뿐만 아니라 
domain service도 포함되는 것을 확인할 수 있다.   

`도메인이 비즈니스 로직을 가지고 객체 지향의 특성을 적극 활용하는 것을 도메인 모델 패턴이라고 한다.`   
쉽게 말해서 각각의 도메인에서 요구되는 비즈니스 로직을 처리하여 개발을 
진행하는 것이다.   
그리고 서비스 단에서 트랜잭션과 도메인 간의 순서만 보장만 해준다.   
비즈니스 로직이 도메인에 가까울 수록 서비스 단의 복잡도를 낮추는 효과를 
얻을 수 있다.   
복잡도를 낮춤으로써 유지보수와 테스트하기 쉬운 코드가 생기고 
결국엔 유연한 Software를 얻을 수 있다.  

아래의 예시를 보면서 좀 더 이해해보자.   

주문 취소 로직을 수도 코드로 확인해보자.   

```java
@Transactional
public Order cancelOrder(int orderId){
	1) 데이터베이스로부터 주문정보, 결제정보 배송정보 조회

	2) 배송 취소를 해야 하는지 확인

	3) if(배송 중이라면){
			배송 취소로 변경
		}
	4) 각 테이블에 취소 상태 Update
}
```

위의 수도코드를 트랜잭션 스크립트 패턴으로 구현된 Service 코드를 확인해보자.   

```java
@Transactional
public Order cancelOrder(int orderId){
	//1)
	OrderDto order = ordersDao.selectOrders(orderId);
	BillingDto billing = billingDao.selectBilling(orderId);
	DeliveryDto delivery = deliveryDao.selectDelivery(orderId);

	//2)
	String deliveryStatus = delivery.getStatus();

	//3)
	if("IN_PROGRESS".equals(deliveryStatus)){
		delivery.setStatus("CANCEL");
		deliveryDao.update(delivery);
	}

	//4)
	order.setStatus("CANCEL");
	ordersDao.update(order);

	billing.setStatus("CANCEL");;
	deliveryDao.update(billing);

	return order;
}
```

모든 로직이 서비스 클래스 내부에서 처리되면 로직도 커지게 되며 복잡해지고 
엔티티 객체가 단순히 데이터 덩어리 역할만 하는 것이 느껴진다.   

이번에는 비즈니스가 도메인 모델에서 처리할 경우이다.   

```java
@Transactional
public Order cancelOrder(int orderId){
	//1)
	Orders order = orderRepository.findById(orderId);
	Billing billing = billingRepository.findByOrderId(orderId);
	Delivery delivery = deliveryRepository.findByOrderId(orderId);

	//2-3)
	delivery.cancel();

	//4)
	order.cancel();
	billing.cancel();

	return order;
}
```

order, billing, delivery라는 각각의 도메인이 취소 이벤트를 처리하며, 
    서비스 메소드는 트랜잭션과 도메인 간의 순서만 보장해주는 얇은 로직만 
    볼 수 있다. 좀 더 객체지향스러우면서 코드도 깔끔해진 모습이다.   

그렇다면 항상 도메인 패턴 개발이 맞을까?   
둘다 장잠점이 있기 때문에, 상황에 맞는 적절한 방법을 선택하는 것이 
중요하다.   

- - - 

## DTO와 Entity 사용 범위 및 변환 위치    

프로젝트를 진행하다보면 DTO와 Entity의 사용 범위 및 변환 위치에 대해 
의문점이 들 수 있다.     
결론부터 말하자면 프로젝트 규모 및 상황에 따라 달라질 수 있기 때문에 
반드시 정답이 있는 것은 아니다.   

하지만 보통 많이 사용하는 구조는 
DTO와 Entity의 사용범위를 나타낸 위의 그림에서 확인할 수 있다.     

MVC 패턴으로 이해해 보자.   
MVC 패턴은 어플리케이션을 개발할 때 그 구성 요소를 Model과 View 및 
Controller 등 세가지 역할로 구분하는 디자인 패턴이다. 비즈니스 
처리 로직(Model)과 UI 영역(View)은 서로의 존재를 인지하지 못하고, 
    Controller가 중간에서 Model과 View의 연결을 담당합니다.   

Controller는 View로부터 들어온 사용자 요청을 해석하여 Model을 
업데이트하거나 Model로부터 데이터를 받아 View로 전달하는 작업 
등을 수행한다.   
`MVC 패턴의 장점은 Model과 View를 분리함으로써 서로의 의존성을 
낮추고 독립적인 개발을 가능하게 한다.`       

Controller는 View와 도메인 Model의 데이터를 주고 받을 때 
별도의 DTO를 주로 사용한다. 도메인 객체를 View에 
직접 전달할 수 있지만, 민감한 도메인 비즈니스 기능이 노출될 수 
있으며 Model과 View 사이에 의존성이 생기기 때문이다.   

`즉 Model과 View가 강하게 결합되면, View의 요구사항 변화가 Model에 영향을 
끼치기 쉽다.`   
`이것은 반대로 DB와 연결되어 있는 Model이 변경되면 View에도 영향을 
끼치게 된다.`    


`또한, Model 객체는 UI에서 사용하지 않을 불필요한 데이터까지 
보유하고 있을 수 있기 때문에 개인정보등이 외부에 노출되는 
보안 문제와도 직결된다.`    

> 물론 소규모 프로젝트는 DTO 사용이 불필요한 경우도 있다.   

그럼 DTO와 Entity의 변환 위치는 어디가 좋을까?   

이 또한, 정답이 있는 것은 아니지만 Controller 또는 Service 레이어가 
적당하다는 의견이 대부분이다.   

`마틴 파울러는 Service 레이어란 어플리케이션의 경계를 정의하고 
비즈니스 로직 등 도메인을 캡슐화하는 역할이라고 정의했다.`   

이러한 관점에서 바라볼 때, 레이어간 데이터 전달 목적으로 DTO를 
엄격하게 고수한다면 변환 로직이 Service 레이어에서 정의되어야 한다는 
의견이 존재했다.

DTO를 Entity로 변환하는게 간단하다면 
Controller에서 변환해서 Service 레이어로 내려줘도 되지만, 
    복잡한 어플리케이션의 경우 Controller가 View에서 전달 받은 DTO만으로 
    Entity를 구성하기란 어렵다. Repository를 통해 여러 부수적인 
    정보들을 조회하여 Entity를 구성할 경우도 존재하기 때문이다.   

이런 경우 DTO를 Service에게 넘겨주어 Service가 Entity로 변환시키도록 
하는 것이 더 좋은 방안으로 생각한다.   


- - -
Referrence 

<https://blog.naver.com/PostView.nhn?blogId=good_ray&logNo=222267722516>   
[https://jojoldu.tistory.com/](https://jojoldu.tistory.com/)         
<https://xlffm3.github.io/spring%20&%20spring%20boot/DTOLayer/>    


{% highlight ruby linenos %}
{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

