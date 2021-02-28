---
layout: post
title: "[Scala] 여러가지 date 표현  "
subtitle: "ISO 8601, UTC, GMT, Timezone"    
comments: true
categories : Scala
date: 2021-02-27
background: '/img/posts/mac.png'
---

# UTC?   

`국제 표준시(UTC)는 각 나라별 시차를 조정하기 위한 기준 시간이다.`      

UTC라는 국제표준시로 시간을 정했다면, 국가 마다 사용하는 시간이 
다르기 때문에 공통된 시간대로 묶는 특정 지역을 `Timezone` 이라고 한다.   

우리나라의 경우 UTC+9 로 표기된다.   
UTC 기준으로 +9시간을 추가한 시간이 된다.   
예를 들어, 우리나라 시간이 22시라면 9시를 뺀 13시가 UTC이다.   

<img width="700" alt="스크린샷 2021-02-27 오후 1 23 05" src="https://user-images.githubusercontent.com/26623547/109375308-1c328a80-78ff-11eb-89f3-5caecc3b0c17.png">    

`UTC 기준이 되기 때문에, 해외 API와 연동이 필요한 경우 
서로간의 기준 시간을 맞추기 위해 UTC를 활용 할 수 있다.`    

# GMT(Greenwich Mean Time)   

그리니치 평균시라고 불리며 런던을 기점으로 하고 웰링텅에서 종점으로 
설정되는 협정 세계시이다.   

#### UTC 와 GMT ?   

UTC와 GMT는 동일하다고 생각하면 된다. (정확하게 
        들어가면 UTC가 더 정확한 시간을 표현한다.) 1972년 1월 1일 부터 UTC로 
세계 협정시가 변경되었으며 이는 먼저 사용되던 GMT와 같은 기준시가 같기에 
요즘은 혼용해서 사용하게 되었다.    
기술적인 표현에서는 UTC를 주로 쓴다.   

# ISO 8601    

`UTC 그리고 TImezone과 함께 문자열의 형태로 시간을 표현하는 방법을 
기술해놓은 표준이다.`     

#### 원칙   

- 년/월/일T시:분:초 처럼 왼쪽에서 오른쪽으로 갈수록 작은 단위어야 한다.     

- 날짜와 시간은 포맷을 맞추기 위해 0을 붙인다. ex) 4월 -> 04월   

#### 형태    

```
2017-03-16T17:40:00+09:00   
```   

- 날짜 => 년-월-일의 형태로 나와있다.   
- T =>  날짜 뒤에 시간이 오는 것을 표시해 주는 문자이다.   
- 시간 => 시:분:초의 형태로 나와있으며 프로그래밍 언어에 따라서 초 뒤에 소수점 형태로 
milliseconds가 표시되기도 한다.   
- Timezone Offset: 시간뒤에 ±시간:분 형태로 나와있으며 UTC시간시로부터 얼마만큼 차이가 
있는지를 나타낸다. 현재 위의 예시는 한국시간을 나타내며 UTC기준시로부터 9시간 +된 시간임을 나타낸다.   
- (Z or +00:00): UTC기준시를 나타내는 표시이며 '+00:00'으로 나타내기도 한다.   


#### 왜 UTC와 ISO 8601을 따라야 할까?   

ISO 8601에 따르면 파싱을 할 수 있는 라이브러리가 많으며 전체적으로 
호환이 되는 부분이 많다.     

- - - 




- - - 

**Reference**    

<https://vmpo.tistory.com/77>    
<https://twpower.github.io/29-iso8601-utc-and-python-example>    

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

