---
layout: post
title: "[AWS] S3 버킷 수명 주기 구성"
subtitle: "DeletingObjectsfromVersioningSuspendedBuckets, Versioning Suspended Bucket Lifecycle"
comments: true
categories : AWS
date: 2024-01-11
background: '/img/posts/mac.png'
---

업무에서 월별, 일별 등 여러 데이터를 주기적으로 S3에 저장하여 사용하고 있고 
시간이 지난 객체에 대해서는 주기적으로 정리 할 수 있는 방법을 리서치 하여 적용하였다.   

이번 글에서는 S3 객체를 주기적으로 자동 삭제할 수 있는 방법에 대해 살펴보자.   

`S3에서는 versioning-enabled bucket과 versioning suspended 버킷이 존재한다.`   

먼저, Versioning Suspended(버전 관리가 일시 중지된) 버켓을 사용하는 경우 객체를 
삭제할 때 과정은 다음과 같다.   

- 버전 ID가 null인 객체만 제거할 수 있다.     
- 버킷에 null 버전의 객체가 없는 경우 어떤 것도 제거하지 않는다.    
- 버킷에 삭제 마커(delete marker)를 삽입한다.   

Versioning suspended 의 경우 동일한 객체에서 새 버전이 발생하지 않도록 버전 관리를 일시 중지할 수 있으며, 버킷에 단일 버전의 객체만 
필요한 경우 이 작업을 수행할 수 있다.      
`즉, Versioning Suspended 상태가 된 이후 업로드 된 객체들은 모두 버전 ID가 null로 생성되며, 
    객체들을 삭제할 시 해당 객체는 영구 삭제되며, Null 값의 Version ID를 갖는 Delete Marker가 생성된다.`       

Versioning Suspended 상태 이전에 버전 관리를 하고 있었다면(Versioning Enable), 객체에 여러 버전이 존재할 것이며 
Version ID가 null 값이 아닌 객체를 삭제 시, 해당 객체는 이전 버전 객체가 되며, null 값을 
갖는 Delete Marker가 생성된다.   

> Versioning Suspended는 여러 버전에 대한 요금이 부과되지 않도록 하기 위해서 사용한다.   

`아래 그림과 같이 버전 ID가 null인 객체만 제거할 수 있으며 제거 후 delete marker를 추가한다.`      

<img width="430" alt="스크린샷 2024-01-11 오전 7 16 41" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/903ccdd7-27ab-4b0d-a2cc-32864c3f3277">     

> delete marker에는 기존 객체 컨텐츠는 존재하지 않으며 flag 역할을 한다.  

다음 그림은 null 버전이 없는 버킷을 보여준다. 이 경우 DELETE 요청은 아무것도 제거하지 않으며, delete marker만 삽입한다.   

<img width="442" alt="스크린샷 2024-01-11 오전 7 33 10" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/8456683f-282d-48b1-8327-0ab0e0251944">   


Versioning Suspended 버켓에서도 버킷 소유자는 DELETE 요청에 의해 버전 ID를 포함하여 특정 버전을 영구적으로
삭제할 수 있다. 다음 그림은 지정된 객체 버전을 삭제하면 해당 객체의 버전이 영구적으로 제거됨을 보여준다.     

<img width="430" alt="스크린샷 2024-01-11 오전 7 34 50" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/f5a0c4d3-7d17-4cac-b13c-3b340f6bfc97">

`사용 중인 버킷이 Versioning Suspended 상태인 경우 S3 Lifecycle 설정을 통해 주기적으로 
자동 삭제를 할 수 있으며, 삭제 과정에서 두가지 경우가 발생 될 수 있다.`    

- `Versioning Suspended 상태 변경 전에 업로드 된 객체를 삭제하는 경우 기존에 존재하던 객체는 Previous Version으로 
존재하게 되며, Version ID Null 값을 갖는 Delete Marker가 생성된다.`      

- `Versioning Suspended 상태 변경 후에 업로드 된 객체를 삭제하는 경우 기존에 존재하던 객체는 삭제 되며, 
    Version ID Null 값을 갖는 Delete Marker가 생성 된다.`      

`즉 위의 두가지 경우 모두에서 영구 삭제를 위한 Lifecycle을 구성해 주어야 한다.`   


먼저 Lifecycle 을 설정할 때, 접두사로 범위를 제한하기 위해 원하는 접두사(prefix)를 입력한다.   

> 해당 설정을 적용할 버킷의 prefix를 추가한다.   


그리고 Expire current versions of objects를 선택하여 객체 생성 후 일 수를 입력한다.   

> 예를 들면 새 객체가 생성된지 180일 이후 객체들을 삭제하고 싶다면 180일을 입력한다.   

그리고 Permanently delete noncurrent versions of objects을 선택하고, Days after objects become noncurrent을 1로 선택하여 
이전 버전이 된지 1일 이상이 된 객체들을 영구 삭제하도록 한다.   

> 위 설정은 이전에 버전 관리(Versioning Enable)를 했을 때 생성된 객체까지 
제거해주기 위함이며, 1 이라는 숫자는 가장 빠르게 이전 버전 객체들을 삭제할 수 있기 때문에 
설정했다.    

- - -   

**Reference**

<https://docs.aws.amazon.com/ko_kr/AmazonS3/latest/userguide/how-to-set-lifecycle-configuration-intro.html>   
<https://docs.aws.amazon.com/ko_kr/AmazonS3/latest/userguide/DeletingObjectsfromVersioningSuspendedBuckets.html>   

{% highlight ruby linenos %}


{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

