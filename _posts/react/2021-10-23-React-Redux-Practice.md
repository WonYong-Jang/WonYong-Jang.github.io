---
layout: post
title: "[Redux] 리덕스 모듈로 만들고 구현하기"        
subtitle: "카운터 구현하기 / 할일 목록 구현하기 / 리덕스 개발자도구 이용하기"    
comments: true
categories : React
date: 2021-10-23
background: '/img/posts/mac.png'
---

[이전글](https://wonyong-jang.github.io/react/2021/10/21/React-Redux.html)에서 
리덕스를 사용하는 이유와 동작 방식에 대해서 살펴봤다.   
이번 글에서는 리덕스를 직접 구현해보고 리덕스 개발자 도구를 사용하기 
현재 상태와 액션 기록들을 확인할 수 있는 방법에 대해서 살펴볼 예정이다.   

- - -  

## 사전 준비 

시작하기에 앞서 node 와 react 등이 설치가 되어 있어야 한다.     

```shell
$ node -v
$ npm -v
$ npm install -g create-react-app
```

그 후 새로운 프로젝트를 생성한다.   

```shell
// npx는 npm의 5.2.0 버전부터 새로 추가된 도구이다.
// npx가 존재하지 않을 경우에는 npm을 통해 생성해도 된다.   
$ npx create-react-app learn-redux     
$ cd learn-redux
$ npm run start
```

- - - 

## 리덕스 모듈 만들기   

이번에는, 리액트 프로젝트에 리덕스를 적용하기 위해서 리덕스 모듈을 만들어보자.    
리덕스 모듈이란 다음 항목들이 모두 들어있는 자바스크립트 파일을 의미한다.   

- `액션 타입`    
- `액션 생성함수`   
- `리듀서`    

- - -    

## 카운터 구현하기    

### 1. counter 모듈 만들기    

첫번째 만들 모듈은 counter 모듈이다.   
src 디렉터리에 modules 디렉터리를 만들고, 그 안에 counter.js 파일을 생성하여 
다음 코드를 작성해보자.   

##### module/counter.js   

```react
/* 액션 타입 만들기 */
// Ducks 패턴을 따를땐 액션의 이름에 접두사를 넣어주세요.
// 이렇게 하면 다른 모듈과 액션 이름이 중복되는 것을 방지 할 수 있습니다.
const SET_DIFF = 'counter/SET_DIFF';
const INCREASE = 'counter/INCREASE';
const DECREASE = 'counter/DECREASE';

/* 액션 생성함수 만들기 */
// 액션 생성함수를 만들고 export 키워드를 사용해서 내보내주세요.
export const setDiff = diff => ({ type: SET_DIFF, diff });
export const increase = () => ({ type: INCREASE });
export const decrease = () => ({ type: DECREASE });

/* 초기 상태 선언 */
const initialState = {
  number: 0,
  diff: 1
};

/* 리듀서 선언 */
// 리듀서는 export default 로 내보내주세요.
export default function counter(state = initialState, action) {
  switch (action.type) {
    case SET_DIFF:
      return {
        ...state,
        diff: action.diff
      };
    case INCREASE:
      return {
        ...state,
        number: state.number + state.diff
      };
    case DECREASE:
      return {
        ...state,
        number: state.number - state.diff
      };
    default:
      return state;
  }
}
```    

### 2. 루트 리듀서 만들기     

위에서 리덕스 모듈 중 counter 리듀서를 만들었다. 그 후 `리듀서가 추가되면서 
한 프로젝트에 여러개의 리듀서가 있을 때는 이를 한 리듀서로 합쳐서 사용한다.`      
`합쳐진 리듀서를 우리는 루트 리듀서라고 부른다.`    
`리듀서를 합치는 작업은 리덕스에 내장되어 있는 combineReducers라는 함수를 
사용한다.`    

modules 디렉터리에 index.js를 만들고 다음과 같이 코드를 작성해보자.   

##### modules/index.js   

```react
import { combineReducers } from 'redux';
import counter from './counter';

const rootReducer = combineReducers({
  counter
  // 리듀서가 추가된다면 이곳에 추가하면 된다.    
});

export default rootReducer;
```

현재는 counter 리듀서만 존재하며, 추가될 경우 루트 리듀서에 추가하면 된다.   
이제 스토어를 만들어보자.   
리덕스 스토어를 만드는 작업은 src 디렉터리의 index.js에서 해주자.   

##### index.js    


```react   
import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import * as serviceWorker from './serviceWorker';
import { createStore } from 'redux';
import rootReducer from './modules';

const store = createStore(rootReducer); // 스토어를 만듭니다.
console.log(store.getState()); // 스토어의 상태를 확인해봅시다.

ReactDOM.render(<App />, document.getElementById('root'));

serviceWorker.unregister();
```

스토어를 만들고, 스토어의 상태를 출력해서 확인해보자.    


### 3. 리액트 프로젝트에 리덕스 적용하기     

리액트 프로젝트에 리덕스를 적용할 때에는 react-redux라는 라이브러리를 사용해야 한다.   
해당 라이브러리를 설치해 주자.   

```shell
$ npm install react-redux   
```

그 다음에는 index.js 에서 Provider라는 컴포넌트를 불러와서 App 컴포넌트를 감싸주자.    
그리고 Provider의 props에 store를 넣어주면 된다.   

```react
import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';
import { createStore } from 'redux';
import { Provider } from 'react-redux';
import rootReducer from './modules';

const store = createStore(rootReducer); // 스토어를 만듭니다.

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('root')
);

serviceWorker.unregister();
```   

`Provider로 store를 넣어서 App을 감싸게 되면 우리가 렌더링하는 그 어떤 컴포넌트던지 
리덕스 스토어에 접근 할 수 있게 된다!`   


### 4. 프리젠테이셔널 컴포넌트 만들기     

`프리젠테이셔널 컴포넌트란, 리덕스 스토어에 직접적으로 접근하지 않고 필요한 값 또는 
함수를 props로만 받아와서 사용하는 컴포넌트이다.`    

src 디렉터리에 componets 디렉터리를 만들고 Counter.js 컴포넌트를 만들어주자.   

##### componets/Counter.js   

```react
import React from 'react';

function Counter({ number, diff, onIncrease, onDecrease, onSetDiff }) {
  const onChange = e => {
    // e.target.value 의 타입은 문자열이기 때문에 숫자로 변환해주어야 합니다.
    onSetDiff(parseInt(e.target.value, 10));
  };
  return (
    <div>
      <h1>{number}</h1>
      <div>
        <input type="number" value={diff} min="1" onChange={onChange} />
        <button onClick={onIncrease}>+</button>
        <button onClick={onDecrease}>-</button>
      </div>
    </div>
  );
}

export default Counter;
```


`프리젠테이셔널 컴포넌트에선 주로 이렇게 UI를 선언하는 것에 집중하며, 필요한 값들이나 
함수는 props로 받아와서 사용하는 형태로 구현한다.`   


### 5. 컨테이너 컴포넌트 만들기    

`컨테이너 컴포넌트란, 리덕스의 스토어의 상태를 조회하거나, 액션을 디스패치 할 수 
있는 컴포넌트를 의미한다. 그리고 HTML 태그들을 사용하지 않고 다른 
프리젠테이셔널 컴포넌트들을 불러와서 사용한다.`   

컨테이너 컴포넌트가 프리젠테이셔널 컴포넌트들을 포함하고 있다고 생각하면 된다.   

src 디렉터리에 containers 디렉터리를 만들고 CounterContainer.js 라는 파일을 만들자.  

##### containers/CounterContainer.js   

```react   
import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Counter from '../components/Counter';
import { increase, decrease, setDiff } from '../modules/counter';

function CounterContainer() {
  // useSelector는 리덕스 스토어의 상태를 조회하는 Hook입니다.
  // state의 값은 store.getState() 함수를 호출했을 때 나타나는 결과물과 동일합니다.
  const { number, diff } = useSelector(state => ({
    number: state.counter.number,
    diff: state.counter.diff
  }));

  // useDispatch 는 리덕스 스토어의 dispatch 를 함수에서 사용 할 수 있게 해주는 Hook 입니다.
  const dispatch = useDispatch();
  // 각 액션들을 디스패치하는 함수들을 만드세요
  const onIncrease = () => dispatch(increase());
  const onDecrease = () => dispatch(decrease());
  const onSetDiff = diff => dispatch(setDiff(diff));

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

export default CounterContainer;
```

이제 App 컴포넌트에서 CounterContainer를 불러와서 렌더링 하자.   

```react 
import React from 'react';
import CounterContainer from './containers/CounterContainer';

function App() {
  return (
    <div>
      <CounterContainer />
    </div>
  );
}

export default App;
```   

- - - 

**Reference**     

<https://react.vlpt.us/redux/03-prepare.html>   

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

