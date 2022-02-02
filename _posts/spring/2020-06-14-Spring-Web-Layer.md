---
layout: post
title: "[Spring] Web Layer(웹 계층) 과 도메인 모델 패턴"
subtitle: "Web, Service, Repository, Dtos, Domain / 비지니스 로직은 Service에서 처리해야할까?"
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
Referrence 

<https://blog.naver.com/PostView.nhn?blogId=good_ray&logNo=222267722516>   
[https://jojoldu.tistory.com/](https://jojoldu.tistory.com/)         


{% highlight ruby linenos %}
{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

