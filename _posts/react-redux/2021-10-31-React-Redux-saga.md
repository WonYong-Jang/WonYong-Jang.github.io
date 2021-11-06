---
layout: post
title: "[Redux] redux-saga 다루기 "        
subtitle: "비동기 처리 / Generator / promise"    
comments: true
categories : React-Redux
date: 2021-10-31
background: '/img/posts/mac.png'
---

## 1. redux-saga   

[redux-saga](https://github.com/redux-saga/redux-saga)는 redux-thunk 다음으로 
가장 많이 사용되는 라이브러리이다.   
`redux-thunk의 경우엔 함수를 디스패치 할 수 있게 해주는 미들웨어 였다.`   

`redux-saga의 경우엔, 액션을 모니터링하고 있다가, 특정 액션이 
발생하면 이에 따라 특정 작업을 하는 방식으로 사용한다. 여기서 특정 작업이란, 
    특정 자바스크립트를 실행하는 것 일수도 있고, 다른 
    액션을 디스패치하는 것일 수도 있고, 현재 상태를 불러오는 것 일수도 있다.`   

redux-saga는 redux-thunk로 못하는 다양한 작업들을 처리 할 수 있다. 예를 들면 아래와 같다.   

- 비동기 작업을 할 때 기존 요청을 취소 처리 할 수 있다.   
- 특정 액션이 발생했을 때 이에 따른 액션이 디스패치되게끔 하거나, 
    자바스크립트 코드를 실행 할 수 있다.   
- 웹 소켓을 사용하는 경우 Channel이라는 기능을 사용하여 더욱 효율적으로 
코드 관리를 할 수 있다. [링크](https://medium.com/@pierremaoui/using-websockets-with-redux-sagas-a2bf26467cab)를 참고하자.   
- API 요청이 실패했을 때 재요청하는 작업을 할 수 있다.   

이 외에도 다양한 까다로운 비동기 작업들을 redux-saga를 사용하여 처리할수 있다.     

redux-saga는 다양한 상황에 쓸 수 있는 만큼, 제공되는 기능도 많고, 
    사용방법도 진입장벽이 꽤나 크다. 자바스크립트 초심자라면 생소할만한 
    Generator 문법을 사용한다.    
이 문법을 이해하지 못하면 redux-saga를 배우는 것이 매우 어려우니, 
    이 문법부터 작동방식을 이해해보도록 하자.   

- - - 

## 2. Generator 문법 배우기   

`이 문법의 핵심 기능은 함수를 작성 할 때 함수를 특정 구간에 멈춰놓을 수도 있고, 
    원할 때 다시 돌아가게 할 수도 있다. 그리고 결과값을 여러번 반활 할 수도 있다.`   

예를 들어서 다음과 같은 함수가 있다고 가정해보자.   

```javascript
function weirdFunction() {
  return 1;
  return 2;
  return 3;
  return 4;
  return 5;
}
```

사실 함수에서 값을 여러번에 걸쳐서 반환하는 것은 불가능하다. 이 함수는 
호출 할 때마다 무조건 1을 반환하게 될 것이다.   

`하지만, 제너레이터 함수를 사용하면 함수에서 값을 순차적으로 반환할 수 있다. 
함수의 흐름을 도중에 멈춰놓았다가 나중에 이어서 진행 할 수도 있다.`   

크롬 개발자 도구의 콘솔에서 다음 함수를 한번 작성해보자.   

```javascript
function* generatorFunction() {
    console.log('안녕하세요?');
    yield 1;
    console.log('제너레이터 함수');
    yield 2;
    console.log('function*');
    yield 3;
    return 4;
}
```

`제너레이터 함수를 만들 때에는 function* 이라는 키워드를 사용한다.`   
`제너레이터 함수를 호출했을때는 한 객체가 반환되는데, 이를 제너레이터라고 부른다.`   
함수를 작성한 뒤에는 다음 코드를 사용해 제너레이터를 생성해보자.   

```javascript
const generator = generatorFunction();
```   

`제너레이터 함수를 호출한다고 해서 해당 함수 안의 코드가 바로 시작되지는 
않는다. generator.next()를 호출해야만 코드가 실행되며, yield를 
한 값을 반환하고 코드의 흐름을 멈춘다.`   

코드의 흐름을 멈추고 나서 generator.next()를 다시 호출하면 흐름이 이어서 다시 시작된다.   

<img width="700" alt="스크린샷 2021-10-31 오전 12 40 54" src="https://user-images.githubusercontent.com/26623547/139539863-e7af37d7-ef50-4158-a638-b5eae012d416.png">        

제너레이터 함수의 또 다른 예시를 알아보자.   
`next를 호출할 때 인자를 전달하여 이를 제너레이터 함수 내부에서 사용 할 수도 
있다.`       

```javascript
function* sumGenerator() {
    console.log('sumGenerator이 시작됐습니다.');
    let a = yield;
    console.log('a값을 받았습니다.');
    let b = yield;
    console.log('b값을 받았습니다.');
    yield a + b;
}
```

<img width="700" alt="스크린샷 2021-10-31 오전 12 48 59" src="https://user-images.githubusercontent.com/26623547/139540130-d6a4ee9b-b5fd-45da-83b2-2da2d5a14c3c.png">    

- - -  

## 3. Generator로 액션 모니터링하기   

`redux-saga는 액션을 모니터링 할 수 있다`고 소개했다. Generator를 통해 
모니터링이 어떻게 이루어지는지 예시 코드를 작성해보면서 배워보도록 하자.   

다음 코드를 크롬 개발자 도구 콘솔에 작성해보자.   

```javascript
function* watchGenerator() {
    console.log('모니터링 시작!');
    while(true) {
        const action = yield;
        if (action.type === 'HELLO') {
            console.log('안녕하세요?');
        }
        if (action.type === 'BYE') {
            console.log('안녕히가세요.');
        }
    }
}
```

이제 제너레이터 함수를 호출하여 제너레이터를 만들고, next()를 호출해보자.   

<img width="700" alt="스크린샷 2021-10-31 오전 1 05 39" src="https://user-images.githubusercontent.com/26623547/139540620-515d171c-7818-4e71-ba76-db4ac468b6bf.png">    

`redux-saga에서는 이러한 원리로 액션을 모니터링하고, 특정 액션이 발생했을 때 
우리가 원하는 자바스크립트 코드를 실행시켜준다.`    

- - - 

## 4. 리덕스 사가 설치 및 비동기 카운터 만들기    

[이전글](https://wonyong-jang.github.io/react-redux/2021/10/26/React-Redux-thunk.html)에서 사용했던 비동기 카운터 기능을 이번에는 
redux-saga를 사용하여 구현해보자.   
우선 redux-saga 라이브러리를 설치해보자.   

```shell
$ npm install redux-saga   
```

그 다음에는, counter.js 리덕스 모듈을 열어서 기존 increaseAsync와 
decreaseAsync thunk 함수를 지우고, 일반 액션 생성 함수로 
대체시키자.   
`그 다음엔, increaseSaga와 decreaseSaga를 다음과 같이 만들어주자. redux-saga에서
제너레이터 함수를 "사가"라고 부른다.`    

##### modules/couter.js   

```react
import { delay, put } from 'redux-saga/effects';

// 액션 타입
const INCREASE = 'INCREASE';
const DECREASE = 'DECREASE';
const INCREASE_ASYNC = 'INCREASE_ASYNC';
const DECREASE_ASYNC = 'DECREASE_ASYNC';

// 액션 생성 함수
export const increase = () => ({ type: INCREASE });
export const decrease = () => ({ type: DECREASE });
export const increaseAsync = () => ({ type: INCREASE_ASYNC });
export const decreaseAsync = () => ({ type: DECREASE_ASYNC });

function* increaseSaga() {
  yield delay(1000); // 1초를 기다립니다.
  yield put(increase()); // put은 특정 액션을 디스패치 해줍니다.
}
function* decreaseSaga() {
  yield delay(1000); // 1초를 기다립니다.
  yield put(decrease()); // put은 특정 액션을 디스패치 해줍니다.
}

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

`redux-saga/effects에는 다양한 유틸함수들이 들어있다. 여기서 사용한 put 이란 
함수가 매우 중요하다.`   
`이 함수를 통하여 새로운 액션을 디스패치 할 수 있다.`   

`그 다음엔, takeEvery, takeLatest 라는 유틸 함수들을 사용해보자. 이 함수들은 
액션을 모니터링하는 함수이다.`   

`takeEvery는 특정 액션 타입에 대하여 디스패치되는 모든 액션들을 처리하는 것이고, takeLatest는 
특정 액션 타입에 대하여 디스패치된 가장 마지막 액션만을 처리하는 함수이다.`    
예를 들어서 특정 액션을 처리하고 있는 동안 동일한 타입의 새로운 액션이 
디스패치되면 기존에 하던 작업을 무시 처리하고 새로운 작업을 시작한다.   

counterSaga라는 함수를 만들어서 두 액션을 모니터링 해보자.   

##### modules/counter.js   

```react
import { delay, put, takeEvery, takeLatest } from 'redux-saga/effects';

// 액션 타입
const INCREASE = 'INCREASE';
const DECREASE = 'DECREASE';
const INCREASE_ASYNC = 'INCREASE_ASYNC';
const DECREASE_ASYNC = 'DECREASE_ASYNC';

// 액션 생성 함수
export const increase = () => ({ type: INCREASE });
export const decrease = () => ({ type: DECREASE });
export const increaseAsync = () => ({ type: INCREASE_ASYNC });
export const decreaseAsync = () => ({ type: DECREASE_ASYNC });

function* increaseSaga() {
  yield delay(1000); // 1초를 기다립니다.
  yield put(increase()); // put은 특정 액션을 디스패치 해줍니다.
}
function* decreaseSaga() {
  yield delay(1000); // 1초를 기다립니다.
  yield put(decrease()); // put은 특정 액션을 디스패치 해줍니다.
}

export function* counterSaga() {
  yield takeEvery(INCREASE_ASYNC, increaseSaga); // 모든 INCREASE_ASYNC 액션을 처리
  yield takeLatest(DECREASE_ASYNC, decreaseSaga); // 가장 마지막으로 디스패치된 DECREASE_ASYNC 액션만을 처리
}

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

`counterSaga 함수의 경우 다른 곳에서 불러와서 사용해야 하기 때문에 export 키워드를 
사용했다.`   

`이제 루트 사가를 만들어주자. 프로젝트에서 여러개의 사가를 만들게 될 텐데, 
    이를 모두 합쳐서 루트 사가를 만든다.`     

##### modules/index.js   

```react
import { combineReducers } from 'redux';
import counter, { counterSaga } from './counter';
import posts from './posts';
import { all } from 'redux-saga/effects';

const rootReducer = combineReducers({ counter, posts });
export function* rootSaga() {
  yield all([counterSaga()]); // all 은 배열 안의 여러 사가를 동시에 실행시켜줍니다.
}

export default rootReducer;
```

이제 리덕스 스토어에 redux-saga 미들웨어를 적용해보자.   

##### index.js   

```react
import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { createStore, applyMiddleware } from 'redux';
import { Provider } from 'react-redux';
import rootReducer, {rootSaga} from './modules';
import logger from 'redux-logger';
import { composeWithDevTools } from 'redux-devtools-extension';
import createSagaMiddleware from 'redux-saga';

const sagaMiddleware = createSagaMiddleware(); // 사가 미들웨어를 만듭니다.

const store = createStore(
    rootReducer,
    // logger 를 사용하는 경우, logger가 가장 마지막에 와야합니다.
    composeWithDevTools(applyMiddleware(sagaMiddleware, logger))
); // 여러개의 미들웨어를 적용 할 수 있습니다.

sagaMiddleware.run(rootSaga); // 루트 사가를 실행해줍니다.
// 주의: 스토어 생성이 된 다음에 위 코드를 실행해야합니다.

ReactDOM.render(
    <Provider store={store}>
        <App />
    </Provider>,
    document.getElementById('root')
);

reportWebVitals();
```

그 다음엔, App 컴포넌트에서 CounterContainer를 렌더링해보자.   

##### App.js   

```react
import React from 'react';
import CounterContainer from './containers/CounterContainer';

function App() {
  return <CounterContainer />;
}
export default App;
```    

이제 브라우저를 열어서 +1, -1버튼을 연속해서 눌러보고, 서로 다른 패턴으로 
작동하는 것을 확인해보자.   
+1 버튼은 연속으로 버튼을 클릭했을 때 모두 숫자가 증가하고, 
    -1 버튼은 연속으로 버튼을 클릭했을 때 한번만 반영 되는 것을 
    볼수 있다.   



- - - 

**Reference**     

<https://react.vlpt.us/redux-middleware/10-redux-saga.html>    
<https://medium.com/@pierremaoui/using-websockets-with-redux-sagas-a2bf26467cab>   
<https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Global_Objects/Generator>   

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

