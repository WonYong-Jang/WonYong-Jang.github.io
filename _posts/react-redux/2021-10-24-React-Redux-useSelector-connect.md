---
layout: post
title: "[Redux] useSelector최적화와 connect함수"        
subtitle: ""    
comments: true
categories : React-Redux
date: 2021-10-24
background: '/img/posts/mac.png'
---

## useSelector 최적화    

리액트 컴포넌트에서 리덕스 상태를 조회해서 사용 할 때 최적화를 
하기 위해서 어떤 사항을 고려해야 하는지 알아보도록 하자.       

[지난 글](https://wonyong-jang.github.io/react/2021/10/23/React-Redux-Practice.html)에서 할일 목록을 만들 때에는 프리젠테이셔널 컴포넌트에서 React.memo를 
사용하여 리렌더링 최적화를 해줬었다.    
컨테이너 컴포넌트에서는 어떤 것들을 컴토해야 하는지 알아보자.     

우선, 리액트 개발자 도구의 톱니바퀴를 눌러서 Highlight Updats를 체크해보자.    

<img width="781" alt="스크린샷 2021-10-24 오후 10 46 30" src="https://user-images.githubusercontent.com/26623547/138597016-845d6127-22d6-4895-97de-baa13c51fd6b.png">   

`그리고 나서 카운터의 +, -를 눌러서 보면 하단의 할일 목록이 리렌더링되진 
않지만 할 일 목록의 항목을 토글 할 때에는 카운터까지 리렌더링 되는 것을 
확인 할 수 있다.`         

<img width="800" alt="스크린샷 2021-10-24 오후 11 05 51" src="https://user-images.githubusercontent.com/26623547/138597771-7df6e17f-633a-418b-b67c-44874eedf1d2.png">   

<img width="800" alt="스크린샷 2021-10-24 오후 11 05 05" src="https://user-images.githubusercontent.com/26623547/138597774-02c00f6d-33dc-44cb-a74e-272142c3e8ce.png">   

`기본적으로, useSelector를 사용해서 리덕스 스토어의 상태를 조회를 
할 땐 만약 상태가 바뀌지 않았으면 리렌더링 하지 않는다.`     

`TodosContainer의 경우 카운터 값이 바뀔 때 todos값엔 변화가 없으니까, 리렌더링 
되지 않는 것이다.`  

```react
const todos = useSelector(state => state.todos);   
```

반면 CounterContainer를 살펴보자.   

```react
const { number, diff } = useSelector(state => ({
  number: state.counter.number,
  diff: state.counter.diff
}));
```   

`CounterContainer에서는 사실상 useSelector Hook을 통해 매번 렌더링 될 때마다 
새로운 객체 { number, diff }를 만드는 것이기 때문에 
상태가 바뀌었는지 바뀌지 않았는지 확인을 할 수 없어서 낭비 렌더링이 
이루어지고 있다.`      

이를 최적화 하기 위해선 두가지 방법이 있다.   

`첫번째는, useSelector를 여러번 하는 것이다.`      

```react
const number = useSelector(state => state.counter.number);
const diff = useSelector(state => state.counter.diff);  
```  

이렇게 하면 해당 값들 하나라도 바뀌었을 때에만 컴포넌트가 리렌더링 된다.   

`두번째는, react-redux의 shallowEqual 함수를 useSelector의 두번째 인자로 
전달해주는 것이다.`    

```react
import React from 'react';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import Counter from '../components/Counter';
import { increase, decrease, setDiff } from '../modules/counter';

function CounterContainer() {
  // useSelector는 리덕스 스토어의 상태를 조회하는 Hook입니다.
  // state의 값은 store.getState() 함수를 호출했을 때 나타나는 결과물과 동일합니다.
  const { number, diff } = useSelector(
    state => ({
      number: state.counter.number,
      diff: state.counter.diff
    }),
    shallowEqual
  );

  (...)
```   

useSelector의 두번째 파라미터는 equalityFn이다.   

```react
equalityFn?: (left: any, right: any) => boolean
```

이전값과 다음 값을 비교하여 true가 나오면 리렌더링을 하지 않고 
false가 나오면 리렌더링을 한다.   
shallowEqual은 react-redux에 내장되어 있는 함수로써, 객체 안의 
가장 겉에 있는 값들을 모두 비교해준다.   

여기서 겉에 있는 값이란, 만약 다음과 같은 객체가 있다면   

```react
const object = {
  a: {
    x: 3,
    y: 2,
    z: 1
  },
  b: 1,
  c: [{ id: 1 }]
}
```

가장 겉에 있는 값은 object.a, object.b, object.c 이다. shallowEqual 에서는 
최적화를 위해 해당 값들만 비교하고 objejct.a.x또는 object.c[0] 값은 
비교하지 않는다.  

이렇게 둘 중 하나의 방식으로 최적화를 해주면, 
    컨테이너 컴포넌트가 필요한 상황에서만 리렌더링 될 것이다.   


- - - 

## connect 함수   

`connect 함수는 컨테이너 컴포넌트를 만드는 또 다른 방법이다.` 이 함수는 
사실 사용할 일이 별로 없다. useSelector, useDispatch가 워낙 편하기 때문이다.   

`하지만, 우리가 리액트 컴포넌트를 만들 때에는 함수형 컴포넌트로 만드는 것을 
우선시 해야 하고, 꼭 필요할 때에만 클래스형 컴포넌트로 작성을 해야 한다.   
만약 클래스형 컴포넌트로 작성을 하게 되는 경우에는 Hooks를 사용하지 못하기 
때문에 connect 함수를 사용해야 한다.`    

추가적으로 2019년 이전에 작성된 리덕스와 연동된 컴포넌트들은 connect 함수로 
작성되었을 것이다.    
나중에 리액트 프로젝트를 유지보수하게 될 일이 있다면 connect 함수를 종종 
접할 것이기 때문에 이 함수가 어떻게 작동하는지 이해를 한다면  
도움이 될 것이다.   

### 1. HOC란?   

connect 는 [HOC](https://velopert.com/3537) 이다. HOC란, Higher-Order Component를 의미하는데, 이는 
리액트 컴포넌트를 개발하는 하나의 패턴으로써, 컴포넌트의 
로직을 재활용 할 때 유용한 패턴이다.    
예를 들어서, 특정 함수 또는 값을 props로 받아와서 사용하고 싶은 경우에 
이러한 패턴을 사용한다.    
`리액트에 Hook이 도입되기 전에는 HOC 패턴이 자주 사용되어 왔으나, 
    리액트에 Hook이 도입된 이후에는 HOC를 만들 이유가 없어졌다.`   
대부분의 경우 Hook으로 대체 할 수 있기 때문이다. 심지어, 커스텀 Hook을 
만드는 건 굉장히 쉽기도 하다.     

HOC를 직접 구현하게 되는 일은 거의 없기 때문에 지금 시점에 와서 
HOC를 직접 작성하는 방법을 배워보거나, 이해하기 위해 시간을 
쏟을 필요는 없다.   

`HOC의 용도는 컴포넌트를 특정 함수로 감싸서 특정 값 또는 함수를 props로 
받아와서 사용 할 수 있게 해주는 패턴이라는 정도만 알아두면 된다.`       

HOC 컬렉션 라이브러리인 [recompose](https://github.com/acdlite/recompose)라는 
라이브러리를 보면 HOC를 통해서 어떤 것을 하는지 갈피를 잡을 수 있다.   

```react
const enhance = withState('counter', 'setCounter', 0)
const Counter = enhance(({ counter, setCounter }) =>
  <div>
    Count: {counter}
    <button onClick={() => setCounter(n => n + 1)}>Increment</button>
    <button onClick={() => setCounter(n => n - 1)}>Decrement</button>
  </div>
)
```    

어디선가 많이 본 느낌일 것이다. 마치 useState 같다.    
withState 함수를 사용해서 enhance 라는 컴포넌트에 props로 
특정 값과 함수를 넣어주는 함수를 만들었다.   
그리고 컴포넌트를 만들 때 enhance로 감싸주는 원하는 값과 함수를 props를 
통하여 사용할 수 있게 된다.      

### 2. connect 사용해보기   

`connect 함수는 리덕스 스토어안에 있는 상태를 props로 넣어줄수도 있고, 
        액션을 디스패치하는 함수를 props로 넣어줄 수도 있다.`     

이전 글에서 진행했던 CounterContainer를 connect 함수로 구현해보자.   

##### containers/CounterContainer.js   

```react 
import React from 'react';
import { connect } from 'react-redux';
import Counter from '../components/Counter';
import { increase, decrease, setDiff } from '../modules/counter';

function CounterContainer({ number, diff, onIncrease, onDecrease, onSetDiff }) {
  return (
    <Counter
      // 상태와
      number={number}
      diff={diff}
      // 액션을 디스패치 하는 함수들을 props로 넣어줍니다.
      onIncrease={onIncrease}
      onDecrease={onDecrease}
      onSetDiff={onSetDiff}
    />
  );
}

// mapStateToProps 는 리덕스 스토어의 상태를 조회해서 어떤 것들을 props 로 넣어줄지 정의합니다.
// 현재 리덕스 상태를 파라미터로 받아옵니다.
const mapStateToProps = state => ({
  number: state.counter.number,
  diff: state.counter.diff
});

// mapDispatchToProps 는 액션을 디스패치하는 함수를 만들어서 props로 넣어줍니다.
// dispatch 를 파라미터로 받아옵니다.
const mapDispatchToProps = dispatch => ({
  onIncrease: () => dispatch(increase()),
  onDecrease: () => dispatch(decrease()),
  onSetDiff: diff => dispatch(setDiff(diff))
});

// connect 함수에는 mapStateToProps, mapDispatchToProps 를 인자로 넣어주세요.
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(CounterContainer);

/* 위 코드는 다음과 동일합니다.
  const enhance = connect(mapStateToProps, mapDispatchToProps);
  export defualt enhance(CounterContainer);
*/
```    

카운터가 잘 작동되는지 확인해보자.   

`mapStateToProps는 컴포넌트에 props로 넣어줄 리덕스 스토어 상태에 관련된 
함수이고, mapDispatchToProps는 컴포넌트에 props로 넣어줄 액션을 디스패치하는 
함수들에 관련된 함수이다.`    

`여기서 mapDispatchToProps는 redux 라이브러리에 내장된 bindActionCreators 라는 
함수를 사용하면 다음과 같이 리팩토링 할 수 있다.`   

```react   
import React from 'react';
import { bindActionCreators } from 'redux'; 
import { connect } from 'react-redux';
import Counter from '../components/Counter';
import { increase, decrease, setDiff } from '../modules/counter';

// 액션 생성함수 이름이 바뀌어서 props 이름도 바뀌었습니다.
// 예: onIncrease -> increase
function CounterContainer({ number, diff, increase, decrease, setDiff }) {
  return (
    <Counter
      // 상태와
      number={number}
      diff={diff}
      // 액션을 디스패치 하는 함수들을 props로 넣어줍니다.
      onIncrease={increase}
      onDecrease={decrease}
      onSetDiff={setDiff}
    />
  );
}

// mapStateToProps 는 리덕스 스토어의 상태를 조회해서 어떤 것들을 props 로 넣어줄지 정의합니다.
// 현재 리덕스 상태를 파라미터로 받아옵니다.
const mapStateToProps = state => ({
  number: state.counter.number,
  diff: state.counter.diff
});

// mapDispatchToProps 는 액션을 디스패치하는 함수를 만들어서 props로 넣어줍니다.
// dispatch 를 파라미터로 받아옵니다.
const mapDispatchToProps = dispatch =>
  // bindActionCreators 를 사용하면, 자동으로 액션 생성 함수에 dispatch 가 감싸진 상태로 호출 할 수 있습니다.
  bindActionCreators(
    {
      increase,
      decrease,
      setDiff
    },
    dispatch
  );

// connect 함수에는 mapStateToProps, mapDispatchToProps 를 인자로 넣어주세요.
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(CounterContainer);

/* 위 코드는 다음과 동일합니다.
  const enhance = connect(mapStateToProps, mapDispatchToProps);
  export defualt enhance(CounterContainer);
*/
```   

`connect 함수에서는 mapDispatchToProps가 함수가 아니라 아예 객체형태일때에는 
bindActionCreators를 대신 호출해준다. 다음과 같이 코드를 
수정해보자.`    

```react
import React from 'react';
import { connect } from 'react-redux';
import Counter from '../components/Counter';
import { increase, decrease, setDiff } from '../modules/counter';

function CounterContainer({ number, diff, increase, decrease, setDiff }) {
  return (
    <Counter
      // 상태와
      number={number}
      diff={diff}
      // 액션을 디스패치 하는 함수들을 props로 넣어줍니다.
      onIncrease={increase}
      onDecrease={decrease}
      onSetDiff={setDiff}
    />
  );
}

// mapStateToProps 는 리덕스 스토어의 상태를 조회해서 어떤 것들을 props 로 넣어줄지 정의합니다.
// 현재 리덕스 상태를 파라미터로 받아옵니다.
const mapStateToProps = state => ({
  number: state.counter.number,
  diff: state.counter.diff
});

// mapDispatchToProps가 함수가 아니라 객체면
// bindActionCreators 를 connect 에서 대신 해줍니다.
const mapDispatchToProps = {
  increase,
  decrease,
  setDiff
};

// connect 함수에는 mapStateToProps, mapDispatchToProps 를 인자로 넣어주세요.
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(CounterContainer);

/* 위 코드는 다음과 동일합니다.
  const enhance = connect(mapStateToProps, mapDispatchToProps);
  export defualt enhance(CounterContainer);
*/
```


### 3. connect 함수 더 깔끔하게 작성하기   

취향에 따라 다르지만, mapStateToProps와 mapDispatchToProps를 
따로 선언하지 않고 connect 함수를 사용 할 때 인자 쪽에서 
익명함수로 바로 만들어서 사용하면 코드가 꽤나 깔끔해진다.   

CounterContainer.js를 수정해보자.   

##### containers/CounterContainer.js   

```react
import React from 'react';
import { connect } from 'react-redux';
import Counter from '../components/Counter';
import { increase, decrease, setDiff } from '../modules/counter';

function CounterContainer({ number, diff, increase, decrease, setDiff }) {
    return (
        <Counter
            // 상태와
            number={number}
            diff={diff}
            // 액션을 디스패치 하는 함수들을 props로 넣어줍니다.
            onIncrease={increase}
            onDecrease={decrease}
            onSetDiff={setDiff}
        />
    );
}

export default connect(
    state => ({number: state.counter.number, diff: state.counter.diff}),
    {
        increase,
        decrease,
        setDiff
    }
)(CounterContainer)
```

### 4. connect, 알아둬야 하는 것들    

이번에 다뤄본 예시들은 정말 기본적인것들만 있었고, connect에서 다루지는 
않았지만 알아두면 유용 할 수 있는 내용 몇가지들을 다뤄보자.     

#### mapStateToProps의 두번째 파라미터 ownProps   

mapStateToProps 에서는 두번째 파라미터 ownProps를 받아올 수 있는데 이 
파라미터는 생략해도 되는 파라미터이다. 이 값은 우리가 컨테이너 
컴포넌트를 렌더링 할때 직접 넣어주는 props를 가르킨다.    
예를 들면 아래와 같다.   

```react 
// <CounterContainer myValue={1} /> 이라고 하면 {myValue: 1} 값이 ownProps가 된다.     
// 이 두번째 파라미터는 다음과 같은 용도로 활용 할 수 있다.   

const mapStateToProps = (state, ownProps) => ({
  todo: state.todos[ownProps.id]
})
```   

리덕스에서 어떤 상태를 조회 할 지 설정하는 과저어에서 현재 받아온 
props에 따라 다른 상태를 조회 할 수 있다.   

#### connect의 3번째, 4번째 파라미터    

mergeProps는 connect 함수의 세번째 파라미터이며, 생략해도 되는 
파라미터이다.   
4번째 파라미터 역시 생략 가능하며, connect 함수를 사용 할 때 이 컨테이너 컴포넌트가 어떻게 
동작할지에 대한 옵션을 4번째 파라미터를 통해 
설정할 수 있다.     
위 파라미터는 사용하게 될 일이 거의 없기 때문에 자세한 내용은 생략한다.   





- - - 

**Reference**     

<https://react.vlpt.us/redux/08-optimize-useSelector.html>   
<https://react-redux.js.org/using-react-redux/connect-mapstate>   
<https://react-redux.js.org/using-react-redux/connect-mapdispatch#defining-the-mapdispatchtoprops-function-with-bindactioncreators>   

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

