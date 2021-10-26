---
layout: post
title: "[Redux] 미들웨어 만들어보고 이해하기"        
subtitle: "객체와 상태를 로깅하는 미들웨어 구현 / redux-logger"    
comments: true
categories : React-Redux
date: 2021-10-25
background: '/img/posts/mac.png'
---


## 1. 리덕스 미들웨어는 왜 필요할까?   

기존의 리덕스는 액션이 발생하게 되면, 디스패치를 통해 스토어에게 상태 변화의 
필요성을 알리게 된다.   
하지만, 디스패치된 액션을 스토어로 전달하기 전에 처리하고 싶은 작업이 
있을 수 있다. 가령, 단순히 어떤 액션이 발생했는지 로그를 남길 수도 있겠고, 
    액션을 취소해 버리거나, 또 다른 액션을 발생시킬 수도 있다.   

`우리가 알고 있는 리덕스는 동기적인 흐름을 통해 동작한다. 액션 객체가 
생성되고, 디스패치가 액션 발생을 스토어에게 알리면, 리듀서는 
정해진 로직에 의해 액션을 처리한 후 새로운 상태값을 반환하는 과정이다.`   
하지만, 동기적인 흐름만으로는 처리하기 힘든 작업들이 있다. 가령, 시간을 
딜레이시켜 동작하게 한다던지, 외부 데이터를 요청하여 그에 따른 
응답을 화면에 보여줘야 한다면 어떻게 처리해야 할까?    

`리덕스에서는 이러한 비동기 작업을 처리하기 위한 지침을 알려주지 않기 
있기 때문에 이러한 비동기 작업을 처리하는데 있어 리덕스 미들웨어를 
주로 사용한다.`   

`즉, 리덕스 미들웨어는 액션을 디스패치했을 때 리듀서에서 이를 
처리하기에 앞서 사전에 지정된 작업을 실행할 수 있게 해준다. 액션과 
리듀서사이의 중간자라고 볼 수 있다.`    

대표적인 리덕스 미들웨어로는 액션이 발생했는지 로그를 남겨주는 
redux-logger가 있고, 비동기 작업을 처리할수 있게 해주는 
redux-thunk, redux-saga가 대표적인 미들웨어로 사용되고 있다.   

- - - 

## 2. 사전 준비

미들웨어를 만들기 전에 리덕스 프로젝트를 먼저 생성해서 준비하자.

```shell
$ npx create-react-app learn-redux-middleware
$ cd learn-redux-middleware
$ npm install redux react-redux
```   

### 2-1) 리덕스 모듈 준비   

액션 타입, 액션 생성함수, 리듀서를 한 파일에 작성하는 Ducks 패턴을 
사용하여 counter.js 파일을 생성해주자.   

> 원래 Ducks 패턴을 따르는 리덕스 모듈에서는 액션 이름에 'counter/INCREASE' 
이런식으로 앞부분에 접두어를 두지만, 이번에는 액션이름이 중복되는 
일이 없으니, 편의상 생략하도록 하자.   

##### modules/counter.js   

```react
// 액션 타입
const INCREASE = 'INCREASE';
const DECREASE = 'DECREASE';

// 액션 생성 함수
export const increase = () => ({ type: INCREASE });
export const decrease = () => ({ type: DECREASE });

// 초깃값 (상태가 객체가 아니라 그냥 숫자여도 상관 없습니다.)
const initialState = 0;

export default function counter(state = initialState, action) {
  switch (action.type) {
    case INCREASE:
      return state + 1;
    case DECREASE:
      return state - 1;
    default:
      return state;
  }
}
```  

그 다음에는 루트 리듀서를 만들자. 물론 지금은 서브 리듀서가 하나밖에 
없는 상황이지만, 나중에 몇개 더 만들 것이다.   

##### modules/index.js   

```react
import { combineReducers } from 'redux';
import counter from './counter';

const rootReducer = combineReducers({ counter });

export default rootReducer;
```  

### 2-2) 프로젝트에 리덕스 적용    

프로젝트에 리덕스를 적용해주자. `프로젝트에 리덕스를 
적용할 때에는 src 디렉터리의 index.js에서 루트 리듀서를 불러와서 
이를 통해 새로운 스토어를 만들고 Provider를 사용해서 프로젝트에 적용을 한다.`   

##### index.js    

```react
import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import reportWebVitals from './reportWebVitals';
import {createStore} from 'redux';
import {Provider} from 'react-redux';
import rootReducer from './modules';

const store = createStore(rootReducer);

ReactDOM.render(
    <Provider store={store}>
        <App />
    </Provider>,
    document.getElementById('root')
);

reportWebVitals();
```

### 2-3) 프리젠테이셔널 컴포넌트 준비    

컴포넌트 Counter를 준비해보자.   

##### components/Counter.js   

```react
import React from 'react';

function Counter({ number, onIncrease, onDecrease }) {
  return (
    <div>
      <h1>{number}</h1>
      <button onClick={onIncrease}>+1</button>
      <button onClick={onDecrease}>-1</button>
    </div>
  );
}

export default Counter;
```

### 2-4) 컨테이너 만들기    

마지막으로 컨테이너를 만들어보자.   

##### containers/CounterContainer.js   

```react
import React from 'react';
import Counter from '../components/Counter';
import { useSelector, useDispatch } from 'react-redux';
import { increase, decrease } from '../modules/counter';

function CounterContainer() {
  const number = useSelector(state => state.counter);
  const dispatch = useDispatch();

  const onIncrease = () => {
    dispatch(increase());
  };
  const onDecrease = () => {
    dispatch(decrease());
  };

  return (
    <Counter number={number} onIncrease={onIncrease} onDecrease={onDecrease} />
  );
}

export default CounterContainer;
```

이제 App에서 CounterContainer를 렌더링하고 실행을 해보자.   

```react
import React from 'react';
import CounterContainer from './containers/CounterContainer';

function App() {
  return <CounterContainer />;
}

export default App;
```


- - -   

## 3. 미들웨어 만들어보고 이해하기   

이번 글에서는 미들웨어를 직접 만들어보도록 하자. 사실 실무에서 
리덕스 미들웨어를 직접 만들게 되는 일은 거의 없다. 
하지만, 한번 직접 만들어보게 된다면 미들웨어가 어떤 역할인지 
쉽게 이해할 수 있다.    

### 3-1) 리덕스 미들웨어의 템플릿   

리덕스 미들웨어를 만들 땐 다음 [템플릿](https://redux.js.org/tutorials/fundamentals/part-4-store#middleware)을 사용한다.   

```react
const middleware = store => next => action => {
  // 하고 싶은 작업...
}
```   

미들웨어는 결국 하나의 함수이다. 함수를 연달아서 두번 리턴하는 함수이다.    
화살표가 여러번 나타나는게 도대체 뭐지, 하고 헷갈릴 수도 
있을 것이다. 이 함수를 function 키워드를 사용하여 작성한다면 
다음과 같다.   

```react
function middleware(store) {
  return function (next) {
    return function (action) {
      // 하고 싶은 작업...
    };
  };
};
```   

이제 여기서 각 함수에서 받아오는 파라미터가 어떤 것을 의미하는지 알아보자.   
`첫번째 store는 리덕스 스토어 인스턴스이다. 이 안에 dispatch, getState, subscribe 내장함수들이 
들어 있다.`   

`두번째 next는 액션을 다음 미들웨어에게 전달하는 함수이다. next(action) 이런 
형태로 사용한다. 만약 다음 미들웨어가 없다면 리듀서에게 액션을 전달해준다. 만약에 
next를 호출하지 않게 된다면 액션이 무시처리되어 리듀서에게로 전달되지 않는다.`   

`세번째 action은 현재 처리하고 있는 액션 객체이다.`   

<img width="800" alt="스크린샷 2021-10-24 오후 11 54 19" src="https://user-images.githubusercontent.com/26623547/138599564-117a8f63-7172-43bd-a052-eb063c03b64a.png">     

미들웨어는 위와 같은 구조로 작동한다. 리덕스 스토어에는 여러 개의 미들웨어를 
등록할 수 있다. 새로운 액션이 디스패치 되면 첫 번째로 등록한 미들웨어가 호출된다.     
만약에 미들웨어에서 next(action)을 호출하게 되면 다음 미들웨어로 액션이 넘어간다.   
그리고 만약 미들웨어에서 store.dispatch를 사용하면 다른 액션을 추가적으로 
발생 시킬 수도 있다.

### 3-2) 사전 준비    

미들웨어를 만들기 전에 리덕스 프로젝트를 먼저 생성해서 준비하자.   

```shell
$ npx create-react-app learn-redux-middleware   
$ cd learn-redux-middleware
$ npm install redux react-redux
```

### 3-3) 미들웨어 직접 작성해보기 

그럼 미들웨어를 직접 작성해보자. src 디렉터리에 middlewares라는 디렉터리를 
만들고, myLogger.js라는 파일을 다음과 같이 작성해보자.   

##### middlewares/myLogger.js   

```react
const myLogger = store => next => action => {
  console.log(action); // 먼저 액션을 출력합니다.
  const result = next(action); // 다음 미들웨어 (또는 리듀서) 에게 액션을 전달합니다.
  return result; // 여기서 반환하는 값은 dispatch(action)의 결과물이 됩니다. 기본: undefined
};

export default myLogger; 
```

지금은 단순히 전달받은 액션을 출력하고 다음으로 넘기는 작업을 
구현했다.   

### 3-4) 미들웨어 적용하기   

이제 미들웨어를 스토어에 적용해보자!   
`스토어에 미들웨어를 적용할 때에는 applyMiddleware 라는 함수를 사용한다.`   

##### index.js   

```react
import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import reportWebVitals from './reportWebVitals';
import {applyMiddleware, createStore} from 'redux';
import {Provider} from 'react-redux';
import rootReducer from './modules';
import myLogger from './middlewares/myLogger';

const store = createStore(rootReducer, applyMiddleware(myLogger));

ReactDOM.render(
    <Provider store={store}>
        <App />
    </Provider>,
    document.getElementById('root')
);

reportWebVitals();
```   

이제 카운터에서 버튼을 눌러보자. 액션이 잘 출력되는지를 
확인해보자.   

<img width="494" alt="스크린샷 2021-10-26 오전 9 01 02" src="https://user-images.githubusercontent.com/26623547/138786732-f8cb57f7-5384-41ed-8ab4-a61ecfb51d61.png">   

### 3-5) 미들웨어 수정하기   

미들웨어를 조금 더 수정해보자. 만약 액션이 리듀서까지 전달되고 난 후의 
새로운 상태를 확인하고 싶다면 다음과 같이 수정할 수 있다.   

```react
const myLogger = store => next => action => {
  console.log(action); // 먼저 액션을 출력합니다.
  const result = next(action); // 다음 미들웨어 (또는 리듀서) 에게 액션을 전달합니다.

  // 업데이트 이후의 상태를 조회합니다.
  console.log('\t', store.getState()); // '\t' 는 탭 문자 입니다.

  return result; // 여기서 반환하는 값은 dispatch(action)의 결과물이 됩니다. 기본: undefined
};

export default myLogger;
```

<img width="500" alt="스크린샷 2021-10-26 오전 9 07 31" src="https://user-images.githubusercontent.com/26623547/138787162-66d9e587-2a82-4fff-a55d-6c526c73d6f8.png">    
 
실행해보면, 업데이트 후의 상태가 잘 나타나는 것을 
확인할 수 있다.   

미들웨어 안에서 무엇이든지 할 수 있다. 예를 들어서 액션 값을 
객체가 아닌 함수도 받아오게 만들어서 액션이 함수 타입이면 
이를 실행하게끔 할 수도 있다.

> 다음 글에서 살펴볼 redux-thunk 이다.   

```react
const thunk = store => next => action =>
  typeof action === 'function'
    ? action(store.dispatch, store.getState)
    : next(action)
```

그러면 나중에 dispatch 할 때 다음과 같이 할 수도 있다.   

```react
const myThunk = () => (dispatch, getState) => {
  dispatch({ type: 'HELLO' });
  dispatch({ type: 'BYE' });
}

dispatch(myThunk());
```

우리가 이번에 이렇게 미들웨어를 직접 만들어보면서 객체와 
상태를 로깅하는 작업을 해봤다.    
리덕스 관련 값들을 콘솔에 로깅하는건 이렇게 
직접 만드는 것보단 [redux-logger](https://github.com/LogRocket/redux-logger) 미들웨어를 
사용하는게 더욱 좋다.   

- - - 

## 4. redux-logger 사용   

이번에는 redux-logger를 설치해서 적용을 해보고, 또 Redux DevTools와 
리덕스 미들웨어를 함께 사용해야 할 때에는 어떻게 해야하는지 
살펴보자.         

### 4-1) redux-logger 사용하기   

우선 redux-logger를 설치하자.      

```shell
$ npm install redux-logger  
```

`그 후 index.js에서 불러와서 적용을 해보자. 리덕스에 미들웨어를 
적용 할 때에는 다음과 같이 여러개의 미들웨어를 등록 할 수 있다.`   

##### index.js   

```react
import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import reportWebVitals from './reportWebVitals';
import {applyMiddleware, createStore} from 'redux';
import { Provider } from 'react-redux';
import rootReducer from './modules';
import myLogger from './middlewares/myLogger';
import logger from 'redux-logger';

const store = createStore(rootReducer, applyMiddleware(myLogger, logger));

ReactDOM.render(
    <Provider store={store}>
        <App />
    </Provider>,
  document.getElementById('root')
);

reportWebVitals();
```

이제 myLogger는 사용할 일이 없으니 비활성화 해주자.   
그 후 결과를 확인해보면 redux-logger쪽에서만 출력이 된다.   

<img width="500" alt="스크린샷 2021-10-26 오후 11 30 50" src="https://user-images.githubusercontent.com/26623547/138900640-0b60a2d8-039d-42b0-b1ab-7e946fce5d89.png">   


### 4-2) Redux DevTools 사용하기   

Redux DevTools를 미들웨어와 함께 사용해야 한다면 어떻게 코드를 
작성해야 하는지 알아보자.    

[매뉴얼 상의 사용법](https://www.npmjs.com/package/redux-devtools-extension#usage)은 다음과 같다.   
우선 redux-devtools-extension을 설치하자.   

```shell
$ npm install redux-devtools-extension
```    

다음, index.js를 수정하자.   

##### index.js   

```react
import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import reportWebVitals from './reportWebVitals';
import {applyMiddleware, createStore} from 'redux';
import { Provider } from 'react-redux';
import rootReducer from './modules';
import logger from 'redux-logger';
import { composeWithDevTools } from 'redux-devtools-extension';


const store = createStore(
    rootReducer,
    composeWithDevTools(applyMiddleware(logger))
);

ReactDOM.render(
    <Provider store={store}>
        <App />
    </Provider>,
  document.getElementById('root')
);

reportWebVitals();
```

이제 Redux DevTool이 잘 작동하는지 확인해보자.   


다음 글에서는 redux-thunk에 대해서 살펴보자.   

- - - 

**Reference**     

<https://react.vlpt.us/redux-middleware/02-make-middleware.html>   
<https://velog.io/@youthfulhps/%EB%A6%AC%EB%8D%95%EC%8A%A4-%EB%AF%B8%EB%93%A4%EC%9B%A8%EC%96%B4%EB%8A%94-%EB%AC%B4%EC%97%87%EC%9D%B8%EA%B0%80>   
<https://www.npmjs.com/package/redux-devtools-extension#usage>   

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

