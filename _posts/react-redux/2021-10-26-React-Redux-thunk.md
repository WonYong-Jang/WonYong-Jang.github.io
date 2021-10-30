---
layout: post
title: "[Redux] Thunk로 프로미스 다루기 "        
subtitle: "리덕스에서 비동기 작업을 처리할수 있는 미들웨어"    
comments: true
categories : React-Redux
date: 2021-10-26
background: '/img/posts/mac.png'
---

## redux-thunk   

`redux-thunk는 리덕스에서 비동기 작업을 처리 할 때 가장 많이 사용하는 
미들웨어이다. 이 미들웨어를 사용하면 액션 객체가 아닌 함수를 
디스패치 할 수 있다.`     
redux-thunk는 리덕스의 창시자인 Dan Abramov가 만들었으며, 리덕스 
공식 매뉴얼에서도 비동기 작업을 처리하기 위하여 미들웨어를 
사용하는 예시를 보여준다.   

[이전글](https://wonyong-jang.github.io/react-redux/2021/10/25/React-Redux-middleware.html)에서 
다음과 같은 예시 코드를 다뤘었다.   

```react
const thunk = store => next => action =>
  typeof action === 'function'
    ? action(store.dispatch, store.getState)
    : next(action)
```

실제로 redux-thunk의 코드는 위와 유사하다. 그냥 추가 기능을 
위하여 몇줄이 조금 더 추가 됐을 뿐이다.   

이 미들웨어를 사용하면 함수를 디스패치 할 수 있다고 했는데, 함수를 
디스패치 할 때에는, 해당 함수에서 dispatch와 getState를 
파라미터로 받아와주어야 한다.    
`이 함수를 만들어주는 함수를 우리는 thunk라고 부른다.`    

thunk의 사용 예시를 확인해보자.   

```react
const getComments = () => (dispatch, getState) => {
  // 이 안에서는 액션을 dispatch 할 수도 있고
  // getState를 사용하여 현재 상태도 조회 할 수 있습니다.
  const id = getState().post.activeId;

  // 요청이 시작했음을 알리는 액션
  dispatch({ type: 'GET_COMMENTS' });

  // 댓글을 조회하는 프로미스를 반환하는 getComments 가 있다고 가정해봅시다.
  api
    .getComments(id) // 요청을 하고
    .then(comments => dispatch({ type: 'GET_COMMENTS_SUCCESS', id, comments })) // 성공시
    .catch(e => dispatch({ type: 'GET_COMMENTS_ERROR', error: e })); // 실패시
};
```

thunk 함수에서 async/await를 사용해도 상관 없다.   

```react
const getComments = () => async (dispatch, getState) => {
  const id = getState().post.activeId;
  dispatch({ type: 'GET_COMMENTS' });
  try {
    const comments = await api.getComments(id);
    dispatch({ type:  'GET_COMMENTS_SUCCESS', id, comments });
  } catch (e) {
    dispatch({ type:  'GET_COMMENTS_ERROR', error: e });
  }
}
```


- - - 

## redux-thunk 설치 및 적용하기   

redux-thunk를 설치하고 적용해보자.   

```shell
$ npm install redux-thunk
```

`그 후, redux-thunk를 index.js에서 불러와서 applyMiddlewares를 통해 
적용해보자.`   

##### index.js   

```react
import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { createStore, applyMiddleware } from 'redux';
import { Provider } from 'react-redux';
import rootReducer from './modules';
import logger from 'redux-logger';
import { composeWithDevTools } from 'redux-devtools-extension';
import ReduxThunk from 'redux-thunk';


const store = createStore(
    rootReducer,
    // logger 를 사용하는 경우, logger가 가장 마지막에 와야합니다.
    composeWithDevTools(applyMiddleware(ReduxThunk, logger))
); // 여러개의 미들웨어를 적용 할 수 있습니다.

ReactDOM.render(
    <Provider store={store}>
        <App />
    </Provider>,
    document.getElementById('root')
);

reportWebVitals();
```

### 카운터 딜레이하기   

매우 기본적인 것부터 해보자. thunk 함수를 만들고, setTimeout를 사용하여 
액션이 디스패치 되는 것을 1초씩 딜레이 시켜보자.   

##### modules/counter.js   

```react
// 액션 타입
const INCREASE = 'INCREASE';
const DECREASE = 'DECREASE';

// 액션 생성 함수
export const increase = () => ({ type: INCREASE });
export const decrease = () => ({ type: DECREASE });

// getState를 쓰지 않는다면 굳이 파라미터로 받아올 필요 없습니다.
export const increaseAsync = () => dispatch => {
  setTimeout(() => dispatch(increase()), 1000);
};
export const decreaseAsync = () => dispatch => {
  setTimeout(() => dispatch(decrease()), 1000);
};

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

`increaseAsync와 decreaseAsync라는 thunk 함수를 만들었다. 이제 컨테이너 
컴포넌트를 다음과 같이 수정해보자.`    


```react
import React from 'react';
import Counter from '../components/Counter';
import { useSelector, useDispatch } from 'react-redux';
import { increaseAsync, decreaseAsync } from '../modules/counter';

function CounterContainer() {
  const number = useSelector(state => state.counter);
  const dispatch = useDispatch();

  const onIncrease = () => {
    dispatch(increaseAsync());
  };
  const onDecrease = () => {
    dispatch(decreaseAsync());
  };

  return (
    <Counter number={number} onIncrease={onIncrease} onDecrease={onDecrease} />
  );
}

export default CounterContainer;
```

이제 카운터 버튼을 클릭하여 결과를 확인해보면, 액션 디스패치가 
딜레이 된 것을 확인해 볼 수 있다.   

- - - 

**Reference**     

<https://react.vlpt.us/redux-middleware/04-redux-thunk.html>   

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

