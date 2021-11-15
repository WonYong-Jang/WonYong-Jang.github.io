---
layout: post
title: "[React] Hooks 이해하기( useState, useEffect )"        
subtitle: ""    
comments: true
categories : React-Redux
date: 2021-05-21
background: '/img/posts/mac.png'
---

Hooks는 React v16.8에 새롭게 도입된 기능이다.    
`Hooks는 함수형 컴포넌트에 state를 제공함으로써 상태 관련 로직의 재사용을 이전보다 훨씬 
쉽게 만들어준다.`       

## What are Hooks?   

Hooks는 일반 JavaScript 함수이다. 그래서 Hooks를 활용하는 Custom Hooks를 
만들어 상태를 가지는 로직을 함수로 쉽게 분리할 수 있다.   

`Hooks가 제공하는 내장 API에는 useEffect와 useState가 있다.`   

### useState   

useState는 함수에 state를 제공한다. initialState를 파라미터로 받고, 
    state와 state를 변경할 setState함수를 반환한다.   

```react
import { useState } from 'react';

const Example = () => {
  const [count, setCount] = useState(0);
  
  return (
    <div>
      <p>{`count: ${count}`}</p>
      <button onClick={() => setCount(count + 1)}>+</button>
    </div>
  )
};

export default Example;
```

useState가 반환하는 첫 번째 인자인 state와 두번째 인자인 setState를 
[비구조화 할당 문법](https://poiemaweb.com/es6-destructuring)을 통해 count, setCount로 받아서 사용할 수 있게 된다.   
`setCount로 count state를 변경하면 렌더링이 다시 일어난다.`   

Example은 함수이기 때문에, 렌더링 할 컴포넌트 대신에 값을 반환할 수도 있다.   



- - - 

**Reference**     

<https://medium.com/humanscape-tech/hooks-%EC%9D%B4%ED%95%B4%ED%95%98%EA%B8%B0-usestate-useeffect-811636d1035e>   

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

