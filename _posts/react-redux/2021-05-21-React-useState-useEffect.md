---
layout: post
title: "[React] Hooks 이해하기( useState, useEffect )"        
subtitle: "Side Effect 처리를 위한 React Hooks / useEffect 내부에서 side effect를 실행해야 하는 이유"    
comments: true
categories : React-Redux
date: 2021-05-21
background: '/img/posts/mac.png'
---

Hooks는 React v16.8에 새롭게 도입된 기능이다.    
`Hooks는 함수형 컴포넌트에 state를 제공함으로써 상태 관련 로직의 재사용을 이전보다 훨씬 
쉽게 만들어준다.`       
`클래스형 컴포넌트의 문제점들을 해결하기 위해 나온 것이 바로 훅(Hooks)이다.`   

- - - 

# What are Hooks?   

Hooks는 일반 JavaScript 함수이다. 그래서 Hooks를 활용하는 Custom Hooks를 
만들어 상태를 가지는 로직을 함수로 쉽게 분리할 수 있다.   

`Hooks가 제공하는 내장 API에는 useEffect와 useState가 있다.`   

- - -   

## 1. useState   

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

- - - 

## 2. useEffect   

`useEffect는 컴포넌트의 상태값 변화에 따라 컴포넌트 내부에서 변경이 
이루어져야 되는것들을 처리할 수 있다.`   
또한 React에서 제공하는 useEffect는 Side-Effect를 처리하기 
위해 사용한다고 한다.    
그렇다면 Side-Effect란 무엇일까?   

### 2-1) Side-Effect란?   

의료계에서 말하는 부작용의 의미는 아니고, 컴퓨터 공학에서 사용하는 
다른 의미가 존재한다.   
`함수가 실행되면서 함수 외부에 존재하는 값이나 상태를 변경시키는 등의 행위를 
말한다.`      

`React에서는 컴포넌트가 화면에 렌더링된 이후에 비동기로 처리되어야 
하는 부수적인 효과들을 흔히 Side Effect라고 말한다.`   
대표적인 예로 어떤 데이터를 가져오기 위해서 외부 API를 호출하는 
경우, `일단 화면에 렌더링할 수 있는 것은 먼저 렌더링하고 실제 데이터는 
비동기로 가져오는 것이 권장된다.`      
컴포넌트의 lifecycle 중에서, 서버와 통신하게 되면, 화면이 잠시 멈추거나 
끊기는 상황이 나타날 수 있다. 따라서, 서버에서 값을 받아오는 
작업은 lifecycle에 영향을 주지 않는 방법으로 처리해야 한다.   
요청 즉시 1차 렌더링을 함으로써 연동하는 API가 응답이 늦어지거나 
응답이 없을 경우에도 영향을 최소화 시킬 수 있어서 
사용자 경험 측면에서 유리하기 때문이다.   

이러한 작업시, useeffect()가 매우 유용하게 사용될 수 있다.   
비동기처리, 병럴처리, setTimeout(), setInterval(), Event handling 등 
시간이 많이 걸리거나, lifecycle과 무관한 작업을 수행하고 
싶을 때 사용될 수 있다.     

### 2-2) React에서 Side-Effect 처리   

useEffect는 컴포넌트가 mount 됐을 때, 컴포넌트가 unmount 됐을 때, 
    컴포넌트가 update 됐을 때, 특정 작업을 처리할 수 있다.  

> 컴포넌트가 처음 실행될 때 Mount라고 표현을 한다. 반대로 컴포넌트가 제거 되는 것은 Unmount라고
표현한다.   

즉, 클래스형 컴포넌트에서 사용할 수 있었던 생명주기 메서드를 
함수형 컴포넌트에서도 사용할 수 있게 된 것이다.   
클래스 컴포넌트에서 사용되는 Component Lifecycle 관련된 함수들(componentDidMount, 
        shouldComponentUpdate, componentWillUnMount 등)의 역할을 
그대로 맡아 처리할 수 있다.     

<img width="900" alt="스크린샷 2021-11-18 오후 11 39 55" src="https://user-images.githubusercontent.com/26623547/142436369-b1ee8850-82f2-4c36-a4fd-8c96d4c57c81.png">      

위 그림에서 `Render 단계(phrase)는 컴포넌트의 생성, 갱신, 소멸과 
관련되어 있는 life cycle의 한 부분이다.`    
리액트는 새로운 props와 state를 
바탕으로 Virtual DOM을 그린다. (추가로 갱신의 경우에는 어떤 
        차이가 있는지 파악한다)   
`한마디로 state와 props를 바탕으로 어떤 화면이 나타나야 하는지 
리액트가 파악하는 과정이다.`   

`이어지는 commit 단계에서는 Virtual DOM을 바탕으로 실제 DOM에 
마운트 한다.` (화면에 그리는 단계는 아직이다.)    

결국 외부에서 데이터를 받아오면(Side Effect) 컴포넌트가 생성될 때의 
초기값을 바탕으로 Virtual-DOM을 생성하고(render phrase) 실제 DOM에 
마운트 하는 과정을 거쳐 변경된 state를 바탕으로 다시 
render와 commit 단계를 거쳐 데이터를 갱신하는 과정을 
리액트는 수행하고 있다는 결론이 나온다.   

`그렇다면 아예 render 전에 데이터를 받아오면(Side Effect) 되는데 
왜 굳이 두번 수행하는 것일까?`    
`결론부터 이야기하면 성능이 저하된다.`   

가상돔을 그리는 과정에서 오직 컴포넌트의 "순수한 부분"만 포함되어야 
한다. 그래야 리액트의 핵심인 이전 렌더링 결과와 이번 렌더링 
결과를 비교해 바뀐 것만 비교해 컴포넌트를 업데이트 할 수 있기 
때문이다.   

Side Effect를 야기하는 과정을 가상돔을 만드는 과정(render phrase)에 
포함되면 부수 효과가 발생할 때마다 Virtual-DOM을 
다시 그려야 한다. 또한 데이터 요청의 경우에는 동기적으로 네트워크 
응답을 받아야만 다음 과정이 진행될 수 있다.   

따라서 리액트는 컴포넌트 내부의 순수한 부분을 사용해 화면을 
그리고 난 후 Side Effect를 발생시킨다. 이후에 컴포넌트 갱신이 
필요하다면 다시 모든 과정을 거쳐 다시 렌더링하는 과정을 거쳐도 
가상돔을 활용해 필요한 부분만 업데이트 하여 성능에 큰 영향을 
주지 않는다.   


### 2-3) useEffect 사용하기    

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
값이 변경 되었을 때 해당 useEffect 내부 로직이 실행된다.`      
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

#### 정리    

useEffect를 다시한번 정리해보면, 어떠한 값의 
변화를 감지하면, 실행되어 특정 함수나 작업을 실행하는 
함수이다.   

useEffect는 3가지 방법으로 사용할 수 있다.  

##### 1. Dependency가 없는 방법   

```react
useEffect() => {});   
```

Dependency가 없다면 useEffect는 어떤 useState의 변수이든, 값이 
변경된 것을 인지하고 실행된다.   

##### 2. 대괄호를 이용하는 방법   

```react
useEffect(() => {}, []);
```   

대괄호만 사용하면 무조건 단 한번 실행되고, 그 후 전혀 실행되지 않는다.   

##### 3. 대괄호 안에 특정 변수(들)를 지정하는 방법   

`useEffect는 Dependency가 있던 없던, 대괄호만 있던, 렌더링 후 
useEffect는 무조건 한번은 실행된다.`    

```react
useEffect(() => {}, [특정변수 혹은 오브젝트]);
```  

대괄호 안에 지정된 변수 혹은 오브젝트가 변하지 않는다면, useEffect는 
실행되지 않는다.   

- - - 

## Hooks를 장점 및 주의사항    

Hooks는 기존의 HOC나 reder-props같은 패턴이 가져오는 Component Tree의 
불필요한 중첩을 없애줄 수 있다. 복잡한 패턴을 적용하지 않고 보다 
직관적으로 로직을 재사용할 수 있다.   

뿐만 아니라 그간 함수형과 클래스형 두 가지 타입(상태가 있는 
        경우는 클래스형 컴포넌트로, 뷰만 관리하는 경우 함수형 
        컴포넌트로 개발하는 등)을 오가면서 개발했던 것을 
함수형 컴포넌트로 통일할 수 있다.   

`마지막으로 Hooks 사용시 주의사항은 반드시 최상위(at the Top Level)에서만 
Hook을 호출해야 한다.`   

반복문, 조건문 혹은 중첩된 함수 내에서 Hook을 호출하면 안된다. 이 규칙을 
따라야 컴포넌트가 렌더링 될 때마다 항상 동일한 순서로 Hook이 
호출되는 것이 보장된다.   
이러한 점은 React가 useState와 useEffect가 여러번 호출되는 중에도 
Hook의 상태를 올바르게 유지할 수 있게 도와준다.   

```react
// 조건문에 Hook을 사용함으로써 첫 번째 규칙을 깼습니다
  if (name !== '') {
    useEffect(function persistForm() {
      localStorage.setItem('formData', name);
    });
  }
```

위처럼 if 조건문내에 Hook을 사용하게 되면 조건에 따라 
Hook이 동작하기 때문에 호출 순서가 달라지게 된다.  
그렇기 때문에 Hook의 호출 순서가 밀리면서 버그가 발생할 수 있다.  

이것이 컴포넌트 최상위(the top of level)에서 Hook이 호출되어야만 
하는 이유이다. 만약 조건부로 effect를 실행하기를 
원한다면 조건문을 Hook 내부에 넣을 수 있다.   

```react
useEffect(function persistForm() {
    // 더 이상 첫 번째 규칙을 어기지 않습니다
    if (name !== '') {
      localStorage.setItem('formData', name);
    }
  });
```

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

