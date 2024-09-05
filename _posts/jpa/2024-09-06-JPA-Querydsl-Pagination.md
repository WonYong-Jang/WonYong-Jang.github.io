---
layout: post
title: "[JPA] Querydsl을 이용하여 페이징 성능 개선하기"
subtitle: "커버링 인덱스"
comments: true
categories : JPA
date: 2024-09-06
background: '/img/posts/mac.png'
---   

## 1. 인덱스란?    



## 2. 커버링 인덱스     

`커버링 인덱스란 쿼리를 충족시키는 데 필요한 모든 데이터를 갖고 있는 
인덱스를 이야기한다.`   

즉, select, where, order by, limit, group by 등에서 사용되는 
모든 컬럼이 index 컬럼안에 다 포함된 경우이다.   

여기서 의문이 드는 것은 select 절까지 포함하게 되면 너무 
많은 컬럼이 인덱스에 포함될 것이다.   

따라서 실제로 커버링 인덱스를 태우는 부분은 select를 제외한 나머지만 우선으로 
수행한다.   





- - -
Referrence

<https://jojoldu.tistory.com/243>  
<https://jojoldu.tistory.com/529>   
<https://jojoldu.tistory.com/476>   

{% highlight ruby linenos %}
{% endhighlight %}

{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

