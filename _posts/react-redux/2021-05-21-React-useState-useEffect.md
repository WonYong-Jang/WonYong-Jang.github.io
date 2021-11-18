---
layout: post
title: "[React] Hooks 이해하기( useState, useEffect )"        
subtitle: "custom Hooks"    
comments: true
categories : React-Redux
date: 2021-05-21
background: '/img/posts/mac.png'
---

Hooks는 React v16.8에 새롭게 도입된 기능이다.    
`Hooks는 함수형 컴포넌트에 state를 제공함으로써 상태 관련 로직의 재사용을 이전보다 훨씬 
쉽게 만들어준다.`       
`클래스형 컴포넌트의 문제점들을 해결하기 위해 나온 것이 바로 훅(Hooks)이다.`   


## What are Hooks?   

Hooks는 일반 JavaScript 함수이다. 그래서 Hooks를 활용하는 Custom Hooks를 
만들어 상태를 가지는 로직을 함수로 쉽게 분리할 수 있다.   

`Hooks가 제공하는 내장 API에는 useEffect와 useState가 있다.`   

### useState   

`useState는 함수형 컴포넌트에서 상태값을 관리하게 해준다.  
initialState를 파라미터로 받고, state와 state를 변경할 setState함수를 반환한다.`       

기본구조는 아래와 같다.   

```react
const [state, setState] = useState(initialState);
```

`배열 비구조화 문법을 이용해 받는 것이기 때문에, 
    state와 setState의 이름은 임의로 정할 수 있다.`       
아래 사용 예제를 보자.   

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
[비구조화 문법](https://poiemaweb.com/es6-destructuring)을 통해 count, setCount로 받아서 사용할 수 있게 된다.   
`setCount로 count state를 변경하면 렌더링이 다시 일어난다.`      

주의할 점은 클래스형 컴포넌트에서 setState를 하면 병합되지만, 
    함수형 컴포넌트에서는 이전 상태값을 지운다.   


### useEffect   

`useEffect는 컴포넌트의 상태값 변화에 따라 컴포넌트 내부에서 변경이 
이루어져야 되는것들을 처리할 수 있다.`   
useEffect는 컴포넌트가 mount 됐을 때, 컴포넌트가 unmount 됐을 때, 
    컴포넌트가 update 됐을 때, 특정 작업을 처리할 수 있다.  

> 컴포넌트가 처음 실행될 때 Mount라고 표현을 한다. 반대로 컴포넌트가 제거 되는 것은 Unmount라고
표현한다.   

즉, 클래스형 컴포넌트에서 사용할 수 있었던 생명주기 메서드를 
함수형 컴포넌트에서도 사용할 수 있게 된 것이다.   
클래스 컴포넌트에서 사용되는 Component Lifecycle 관련된 함수들(componentDidMount, 
        shouldComponentUpdate, componentWillMount 등)의 역할을 
그대로 맡아 처리할 수 있다.   

<img width="900" alt="스크린샷 2021-11-18 오후 11 39 55" src="https://user-images.githubusercontent.com/26623547/142436369-b1ee8850-82f2-4c36-a4fd-8c96d4c57c81.png">   

기본 형태는 다음과 같다.  

```react
import React, { useEffect } from 'react';   

// useEffect( function, deps )
// function : 수행하고자 하는 작업   
// deps : 배열 형태이며, 배열 안에서 검사하고자 하는 특정 값 or 빈 배열   

useEffect(() => {
        console.log('마운트 될 때만 실행된다.');   
}, []);
```   

`첫번째 인자값으로 함수를 필요로 하고 두번째 인자값으로 배열형태의 값을 
필요로 한다.`   

`두번째 인자값에는 보통 컴포넌트 state 값이 들어가는데 배열에 포함된 
값이 변경되었을때 해당 useEffect 내부 로직이 실행된다.`      
`두번째 인자값으로 빈 배열을 넣는 경우 컴포넌트가 
처음 렌더링 될때(mount 될 때)만 실행된다.`    


`만약 두번째 인자의 배열을 생략한다면 리렌더링 될 때 마다 실행된다.`   

```react
useEffect(() => {
    console.log('렌더링 될 때 마다 실행된다.');
});
```

그렇다면 특정값이 업데이트 될 때 실행하고 싶을 때는 deps 배열 안에 
검사하고 싶은 값을 넣어준다.   

> 의존값이 들어있는 배열 deps(dependency를 의미) 이라고도 한다.   

`주의할 점은 업데이트 될 때만 실행하는 것이 아니라 마운트 될 때도 실행된다.`   

```react
useEffect(() => {
    console.log(name);
    console.log('업데이트 될 때 실행된다.');
}, [name]);
```

`마지막으로 useEffect의 return 값이 있는 경우 hook의 cleanup 함수로 인식하고 
다음 effect가 실행되기 전에 실행을 해준다.`   

언마운트 될 때만 cleanup 함수를 실행하고 싶을 때 
두 번째 파라미터로 빈 배열을 넣는다.    
또한, 특정값이 업데이트 되기 직전에 cleanup 함수를 실행하고 
싶을 때 deps 배열 안에 검사하고 싶은 값을 넣어준다.   

```react
useEffect(() => {
    console.log('effect');
    console.log(name);
    return () => {
        console.log('cleanup');
        console.log(name);
    };
}, []);
```   

- - - 

## Hooks를 사용했을 때 얻는 이점    

Hooks는 기존의 HOC나 reder-props같은 패턴이 가져오는 Component Tree의 
불필요한 중첩을 없애줄 수 있다. 복잡한 패턴을 적용하지 않고 보다 
직관적으로 로직을 재사용할 수 있다.   

뿐만 아니라 그간 함수형과 클래스형 두 가지 타입(상태가 있는 
        경우는 클래스형 컴포넌트로, 뷰만 관리하는 경우 함수형 
        컴포넌트로 개발하는 등)을 오가면서 개발했던 것을 
함수형 컴포넌트로 통일할 수 있다.   




- - - 

**Reference**     

<https://ko-de-dev-green.tistory.com/18>   
<https://xiubindev.tistory.com/100>   
<https://medium.com/humanscape-tech/hooks-%EC%9D%B4%ED%95%B4%ED%95%98%EA%B8%B0-usestate-useeffect-811636d1035e>   
<https://velog.io/@kwonh/ReactHook-useState-%EC%99%80-useEffect-%EB%A1%9C-%EC%83%81%ED%83%AF%EA%B0%92%EA%B3%BC-%EC%83%9D%EB%AA%85%EC%A3%BC%EA%B8%B0-%EC%82%AC%EC%9A%A9%ED%95%98%EA%B8%B0>   
<https://antdev.tistory.com/79>   

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

