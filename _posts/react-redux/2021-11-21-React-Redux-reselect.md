---
layout: post
title: "[Redux] reselect 사용하기 "        
subtitle: "memoization을 통해 불필요한 렌더링을 막아주고 성능을 향상시키는 reselector"       
comments: true
categories : React-Redux
date: 2021-11-21
background: '/img/posts/mac.png'
---

redux를 사용하면서 대다수의 경우, reselector 도입을 고려하게 된다.   
왜 사용하는지, 어떤 개선점이 있고, 주의해야하는 사항은 무엇인지 
알아보자.   

- - - 


우리는 상태 관리를 효율적으로 하기 위해 redux와 같은 상태 관리 
라이브러리를 사용한다.   
redux 사용 이유에 대해서는 [링크](https://wonyong-jang.github.io/react-redux/2021/10/21/React-Redux.html)를 
참고하자.   
기본적으로 리덕스 스토어에 있는 state를 가져오는 방법은 
다음과 같다.    
todoList가 존재하고, todo 들의 완료 여부를 필터링 할 수 있는 state가 
존재한다면 다음과 같다.     

```react
const { todos, visibilityFilter } = useSelector(state => ({ 
       const todos = state.todos.map(...) 
       return { 
           todos, 
           visibilityFilter: state.visibilityFilter 
           } 
})); 

return ( 
    { 
        todos.map(....) 
    } 
)
```

스토어에는 todos, visibilityFilter로 분류되어 있고, 이를 useSelector를 통해 
가져온다. 그리고 todos 데이터를 루프를 통해 한번 가공 후, 화면에 
그린다고 가정한다.   

우선 useSelector 에 대해 기억해야할 2가지는 다음과 같다.   
이 2가지는 그대로 문제점으로 연결될 수 있다.   

`1. useSelector는 렌더링마다 실행된다.`   
`2. 액션이 dispatch 되었을 때도 실행되어, 이전 반환값과 
현재값이 다른 경우에 리렌더링을 집행하게 된다.`   

예제로 다시 돌아가보면 todos를 통해 화면을 그리게 된다.   
그리고 액션을 통해 state가 변경된 경우에는 리렌더링을 통해 
화면을 업데이트 할 것이다.   
하지만 위 코드는 이전 반환값과 현재 반환값이 같은 경우에도 
리렌더링을 일으키게 된다.   
`즉, 리렌더링이 집행되어 불필요한 리렌더링을 하게 되는 것이다.`   

그리고 1번과 연관된 문제점으로 렌더링마다 실행된다는 것은 
내부 로직을 매번 재계산을 한다는 것이다.   
이는 useSelector 내부에서 위와 같이 루프 로직이 존재한다면, 데이터가 
클수록 비용이 증가하게 된다.   

또한, 2번과도 연결되어 만약 불필요한 리렌더링이 일어난다면, 다시 
실행되어 재계산하게 된다.   

그렇다면 우선 왜 이전 반환값과 현재 반환값이 같은 경우인데도 
리렌더링이 일어날까?   
이는 반환값을 단순히 오브젝트로 감싸는 것이 원인이 된다.  
useSelector가 실행되면, 단순히 객체로 감싸진 반환값은 매번 
새로운 주소를 가진 객체를 반환한다.      

이를 해결하기 위해 useSelector를 2개로 나누어 객체를 반환하게 하지 않거나, 
redux 자체에서 제공해주는 shallowEqual를 사용할 수 있다.  

더 자세한 내용은 [링크](https://wonyong-jang.github.io/react-redux/2021/10/24/React-Redux-useSelector-connect.html)를 
참조하자.   

`위를 해결하기 위해 더 효율적인 방안으로 reselect를 사용하는 것이고, 
    이는 memoizing selector라고 불린다.`       


- - - 

## reselect란?   

`selector 역할을 수행하면서 캐싱을 통해 동일한 계산을 방지해서 성능을 
향상시켜 주며, 파라미터로 전달받은 값이 이전과 같다면 
새롭게 계산하지 않고 저장된 결과 값을 돌려주는 라이브러리를 말한다.`   

일반적으로 selector를 한 파일에 보관하고 관리하는데, 이때 한 파일 내에 있는 
selector가 갱신되면 다른 selector도 갱신된다고 한다.  
즉, 필요하지 않은 만큼 많은 컴포넌트 렌더링이 발생하게 된다.   
`이럴 때 reselect가 memoization을 통해 불필요한 렌더링을 막아주고 
성능을 향상시켜주기 때문에 사용해야 한다.`

> memoization이란 함수에 대한 입력을 추적하고 나중에 참조할 수 있도록 
입력과 결과를 저장하는 작업을 말한다. 즉, 이전과 동일한 
입력으로 함수를 호출하면 함수는 실제 작업을 건너뛰고 해당 입력 값을 
마지막으로 수신했을 때 생성한 것과 동일한 결과를 
반환하는 작업을 말한다.     

```react
const getTodo = state => state.todos; 
const getVisibilityFilter = state => state.visibilityFilter;

const { todos, visibilityFilter } = createSelector(
     getTodo,
     getVisibilityFilter,
     (todos, visibilityFilter) => {
        const todos = state.todos.map(...)
        return {
            todos,
            visibilityFilter
        }
     }
)
```

`reselect는 넘어오는 인자 중 하나라도 변경이 되어야만 재계산을 하게 된다.`   
todos, visibilityFilter의 값이 하나라도 변해야만 실제 로직을 다시 
계산하게 된다.   


- - - 

**Reference**     

<https://godsenal.com/posts/Redux-selector-%ED%8C%A8%ED%84%B4%EA%B3%BC-reselect/>   
<https://mygumi.tistory.com/374>   
<https://ljtaek2.tistory.com/m/152>      


{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

