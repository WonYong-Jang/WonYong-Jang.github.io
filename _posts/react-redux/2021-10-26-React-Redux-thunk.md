---
layout: post
title: "[Redux] redux-Thunk로 프로미스 다루기"        
subtitle: "리덕스에서 비동기 작업을 처리할수 있는 미들웨어 / Promise / Router v6"    
comments: true
categories : React-Redux
date: 2021-10-26
background: '/img/posts/mac.png'
---

# 1. redux-thunk   

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

`이 미들웨어를 사용하면 함수를 디스패치 할 수 있다고 했는데, 함수를 
디스패치 할 때에는, 해당 함수에서 dispatch와 getState를 
파라미터로 받아와주어야 한다.`         
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

# 2. redux-thunk 설치 및 적용하기   

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

##### containers/CounterContainer.js   

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

# 3. redux-thunk로 프로미스 다루기   

이번에는 redux-thunk를 사용하여 프로미스(Promise)를 다루는 방법을 알아보자.     
프로미스에 대해서는 아래 링크를 참고하자.   

- [https://learnjs.vlpt.us/async/](https://learnjs.vlpt.us/async/)    
- [https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Global_Objects/Promise](https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Global_Objects/Promise)    


### 가짜 API 함수 만들기   

먼저, Promise를 사용하여 데이터를 반환하는 가짜 API 함수를 만들어보자.   
아래 디렉터리를 만들고, posts.js 라는 파일을 생성하여 코드를 다음과 
같이 작성하자.   

##### api/posts.js    

```react
// n 밀리세컨드동안 기다리는 프로미스를 만들어주는 함수
const sleep = n => new Promise(resolve => setTimeout(resolve, n));

// 가짜 포스트 목록 데이터
const posts = [
  {
    id: 1,
    title: '리덕스 미들웨어를 배워봅시다',
    body: '리덕스 미들웨어를 직접 만들어보면 이해하기 쉽죠.'
  },
  {
    id: 2,
    title: 'redux-thunk를 사용해봅시다',
    body: 'redux-thunk를 사용해서 비동기 작업을 처리해봅시다!'
  },
  {
    id: 3,
    title: 'redux-saga도 사용해봅시다',
    body:
      '나중엔 redux-saga를 사용해서 비동기 작업을 처리하는 방법도 배워볼 거예요.'
  }
];

// 포스트 목록을 가져오는 비동기 함수
export const getPosts = async () => {
  await sleep(500); // 0.5초 쉬고
  return posts; // posts 배열
};

// ID로 포스트를 조회하는 비동기 함수
export const getPostById = async id => {
  await sleep(500); // 0.5초 쉬고
  return posts.find(post => post.id === id); // id 로 찾아서 반환
};
```   

### posts 리덕스 모듈 준비하기   

이제, posts 라는 리덕스 모듈을 준비하자.    
프로미스를 다루는 리덕스 모듈을 다룰 땐 다음과 같은 사항을 고려해야 한다.   

`1. 프로미스가 시작, 성공, 실패했을 때 다른 액션을 디스패치해야 한다.`   
`2. 각 프로미스마다 thunk 함수를 만들어주어야 한다.`   
`3. 리듀서에서 액션에 따라 로딩중, 결과, 에러 상태를 변경해주어야 한다.`   

##### modules/posts.js    

```react
import * as postsAPI from '../api/posts'; // api/posts 안의 함수 모두 불러오기

/* 액션 타입 */

// 포스트 여러개 조회하기
const GET_POSTS = 'GET_POSTS'; // 요청 시작
const GET_POSTS_SUCCESS = 'GET_POSTS_SUCCESS'; // 요청 성공
const GET_POSTS_ERROR = 'GET_POSTS_ERROR'; // 요청 실패

// 포스트 하나 조회하기
const GET_POST = 'GET_POST';
const GET_POST_SUCCESS = 'GET_POST_SUCCESS';
const GET_POST_ERROR = 'GET_POST_ERROR';

// thunk 를 사용 할 때, 꼭 모든 액션들에 대하여 액션 생성함수를 만들 필요는 없습니다.
// 그냥 thunk 함수에서 바로 액션 객체를 만들어주어도 괜찮습니다.

export const getPosts = () => async dispatch => {
  dispatch({ type: GET_POSTS }); // 요청이 시작됨
  try {
    const posts = await postsAPI.getPosts(); // API 호출
    dispatch({ type: GET_POSTS_SUCCESS, posts }); // 성공
  } catch (e) {
    dispatch({ type: GET_POSTS_ERROR, error: e }); // 실패
  }
};

// thunk 함수에서도 파라미터를 받아와서 사용 할 수 있습니다.
export const getPost = id => async dispatch => {
  dispatch({ type: GET_POST }); // 요청이 시작됨
  try {
    const post = await postsAPI.getPostById(id); // API 호출
    dispatch({ type: GET_POST_SUCCESS, post }); // 성공
  } catch (e) {
    dispatch({ type: GET_POST_ERROR, error: e }); // 실패
  }
};

const initialState = {
  posts: {
    loading: false,
    data: null,
    error: null
  },
  post: {
    loading: false,
    data: null,
    error: null
  }
};

export default function posts(state = initialState, action) {
  switch (action.type) {
    case GET_POSTS:
      return {
        ...state,
        posts: {
          loading: true,
          data: null,
          error: null
        }
      };
    case GET_POSTS_SUCCESS:
      return {
        ...state,
        posts: {
          loading: true,
          data: action.posts,
          error: null
        }
      };
    case GET_POSTS_ERROR:
      return {
        ...state,
        posts: {
          loading: true,
          data: null,
          error: action.error
        }
      };
    case GET_POST:
      return {
        ...state,
        post: {
          loading: true,
          data: null,
          error: null
        }
      };
    case GET_POST_SUCCESS:
      return {
        ...state,
        post: {
          loading: true,
          data: action.post,
          error: null
        }
      };
    case GET_POST_ERROR:
      return {
        ...state,
        post: {
          loading: true,
          data: null,
          error: action.error
        }
      };
    default:
      return state;
  }
}
```    

위의 코드를 보면 반복되는 코드들이 많이 있다. 이런 반복되는 
코드는 따로 함수화하여 코드를 리펙토링해보자.   

### 리덕스 모듈 리펙토링하기     

asyncUtils.js파일을 만들고 함수들을 다음과 같이 작성해보자.   

##### lib/asyncUtils.js   

```react
// Promise에 기반한 Thunk를 만들어주는 함수입니다.
export const createPromiseThunk = (type, promiseCreator) => {
  const [SUCCESS, ERROR] = [`${type}_SUCCESS`, `${type}_ERROR`];

  // 이 함수는 promiseCreator가 단 하나의 파라미터만 받는다는 전제하에 작성되었습니다.
  // 만약 여러 종류의 파라미터를 전달해야하는 상황에서는 객체 타입의 파라미터를 받아오도록 하면 됩니다.
  // 예: writeComment({ postId: 1, text: '댓글 내용' });
  return param => async dispatch => {
    // 요청 시작
    dispatch({ type, param });
    try {
      // 결과물의 이름을 payload 라는 이름으로 통일시킵니다.
      const payload = await promiseCreator(param);
      dispatch({ type: SUCCESS, payload }); // 성공
    } catch (e) {
      dispatch({ type: ERROR, payload: e, error: true }); // 실패
    }
  };
};


// 리듀서에서 사용 할 수 있는 여러 유틸 함수들입니다.
export const reducerUtils = {
  // 초기 상태. 초기 data 값은 기본적으로 null 이지만
  // 바꿀 수도 있습니다.
  initial: (initialData = null) => ({
    loading: false,
    data: initialData,
    error: null
  }),
  // 로딩중 상태. prevState의 경우엔 기본값은 null 이지만
  // 따로 값을 지정하면 null 로 바꾸지 않고 다른 값을 유지시킬 수 있습니다.
  loading: (prevState = null) => ({
    loading: true,
    data: prevState,
    error: null
  }),
  // 성공 상태
  success: payload => ({
    loading: false,
    data: payload,
    error: null
  }),
  // 실패 상태
  error: error => ({
    loading: false,
    data: null,
    error: error
  })
};
```    

이제 이 함수들을 사용하여 기존 posts 모듈을 리펙토링해보자.   

##### modules/posts.js   

```react
import * as postsAPI from '../api/posts'; // api/posts 안의 함수 모두 불러오기
import { createPromiseThunk, reducerUtils } from '../lib/asyncUtils';

/* 액션 타입 */

// 포스트 여러개 조회하기
const GET_POSTS = 'GET_POSTS'; // 요청 시작
const GET_POSTS_SUCCESS = 'GET_POSTS_SUCCESS'; // 요청 성공
const GET_POSTS_ERROR = 'GET_POSTS_ERROR'; // 요청 실패

// 포스트 하나 조회하기
const GET_POST = 'GET_POST';
const GET_POST_SUCCESS = 'GET_POST_SUCCESS';
const GET_POST_ERROR = 'GET_POST_ERROR';

// 아주 쉽게 thunk 함수를 만들 수 있게 되었습니다.
export const getPosts = createPromiseThunk(GET_POSTS, postsAPI.getPosts);
export const getPost = createPromiseThunk(GET_POST, postsAPI.getPostById);

// initialState 쪽도 반복되는 코드를 initial() 함수를 사용해서 리팩토링 했습니다.
const initialState = {
  posts: reducerUtils.initial(),
  post: reducerUtils.initial()
};

export default function posts(state = initialState, action) {
  switch (action.type) {
    case GET_POSTS:
      return {
        ...state,
        posts: reducerUtils.loading()
      };
    case GET_POSTS_SUCCESS:
      return {
        ...state,
        posts: reducerUtils.success(action.payload) // action.posts -> action.payload 로 변경됐습니다.
      };
    case GET_POSTS_ERROR:
      return {
        ...state,
        posts: reducerUtils.error(action.error)
      };
    case GET_POST:
      return {
        ...state,
        post: reducerUtils.loading()
      };
    case GET_POST_SUCCESS:
      return {
        ...state,
        post: reducerUtils.success(action.payload) // action.post -> action.payload 로 변경됐습니다.
      };
    case GET_POST_ERROR:
      return {
        ...state,
        post: reducerUtils.error(action.error)
      };
    default:
      return state;
  }
}
```

위의 코드를 보면 반복되는 코드가 많이 줄었다. 그런데 아직 리듀서쪽에서는 
여전히 반복되는 코드가 많이 있다. 이 또한, 원한다면 
리펙토링 할 수 있다.   
asyncUtils.js에서 handleAsyncActions라는 함수를 다음과 같이 작성해보자.   

##### lib/asyncUtils.js    

```react
// Promise에 기반한 Thunk를 만들어주는 함수입니다.
export const createPromiseThunk = (type, promiseCreator) => {
  const [SUCCESS, ERROR] = [`${type}_SUCCESS`, `${type}_ERROR`];

  // 이 함수는 promiseCreator가 단 하나의 파라미터만 받는다는 전제하에 작성되었습니다.
  // 만약 여러 종류의 파라미터를 전달해야하는 상황에서는 객체 타입의 파라미터를 받아오도록 하면 됩니다.
  // 예: writeComment({ postId: 1, text: '댓글 내용' });
  return param => async dispatch => {
    // 요청 시작
    dispatch({ type, param });
    try {
      // 결과물의 이름을 payload 라는 이름으로 통일시킵니다.
      const payload = await promiseCreator(param);
      dispatch({ type: SUCCESS, payload }); // 성공
    } catch (e) {
      dispatch({ type: ERROR, payload: e, error: true }); // 실패
    }
  };
};


// 리듀서에서 사용 할 수 있는 여러 유틸 함수들입니다.
export const reducerUtils = {
  // 초기 상태. 초기 data 값은 기본적으로 null 이지만
  // 바꿀 수도 있습니다.
  initial: (initialData = null) => ({
    loading: false,
    data: initialData,
    error: null
  }),
  // 로딩중 상태. prevState의 경우엔 기본값은 null 이지만
  // 따로 값을 지정하면 null 로 바꾸지 않고 다른 값을 유지시킬 수 있습니다.
  loading: (prevState = null) => ({
    loading: true,
    data: prevState,
    error: null
  }),
  // 성공 상태
  success: payload => ({
    loading: false,
    data: payload,
    error: null
  }),
  // 실패 상태
  error: error => ({
    loading: false,
    data: null,
    error: error
  })
};

// 비동기 관련 액션들을 처리하는 리듀서를 만들어줍니다.
// type 은 액션의 타입, key 는 상태의 key (예: posts, post) 입니다.
export const handleAsyncActions = (type, key) => {
  const [SUCCESS, ERROR] = [`${type}_SUCCESS`, `${type}_ERROR`];
  return (state, action) => {
    switch (action.type) {
      case type:
        return {
          ...state,
          [key]: reducerUtils.loading()
        };
      case SUCCESS:
        return {
          ...state,
          [key]: reducerUtils.success(action.payload)
        };
      case ERROR:
        return {
          ...state,
          [key]: reducerUtils.error(action.payload)
        };
      default:
        return state;
    }
  };
};
```    

handleAsyncActions 함수를 만들어주었으면, posts 리듀서를 다음과 
같이 리펙토링 할 수 있다.   

최종 리펙토링 결과는 다음과 같다.   

##### modules/posts.js   

```react
import * as postsAPI from '../api/posts'; // api/posts 안의 함수 모두 불러오기
import {
  createPromiseThunk,
  reducerUtils,
  handleAsyncActions
} from '../lib/asyncUtils';

/* 액션 타입 */

// 포스트 여러개 조회하기
const GET_POSTS = 'GET_POSTS'; // 요청 시작
const GET_POSTS_SUCCESS = 'GET_POSTS_SUCCESS'; // 요청 성공
const GET_POSTS_ERROR = 'GET_POSTS_ERROR'; // 요청 실패

// 포스트 하나 조회하기
const GET_POST = 'GET_POST';
const GET_POST_SUCCESS = 'GET_POST_SUCCESS';
const GET_POST_ERROR = 'GET_POST_ERROR';

// 아주 쉽게 thunk 함수를 만들 수 있게 되었습니다.
export const getPosts = createPromiseThunk(GET_POSTS, postsAPI.getPosts);
export const getPost = createPromiseThunk(GET_POST, postsAPI.getPostById);

// initialState 쪽도 반복되는 코드를 initial() 함수를 사용해서 리팩토링 했습니다.
const initialState = {
  posts: reducerUtils.initial(),
  post: reducerUtils.initial()
};

export default function posts(state = initialState, action) {
  switch (action.type) {
    case GET_POSTS:
    case GET_POSTS_SUCCESS:
    case GET_POSTS_ERROR:
      return handleAsyncActions(GET_POSTS, 'posts')(state, action);
    case GET_POST:
    case GET_POST_SUCCESS:
    case GET_POST_ERROR:
      return handleAsyncActions(GET_POST, 'post')(state, action);
    default:
      return state;
  }
}
```

참고로 다음 코드는    

```react
case GET_POSTS:
case GET_POSTS_SUCCESS:
case GET_POSTS_ERROR:
  return handleAsyncActions(GET_POSTS, 'posts')(state, action);
```   

이렇게 표현 할 수도 있다.   

```react
case GET_POSTS:
case GET_POSTS_SUCCESS:
case GET_POSTS_ERROR:
  const postsReducer = handleAsyncActions(GET_POSTS, 'posts');
  return postsReducer(state, action);
```

리펙토링 끝났으면 이제 이 모듈을 루트 리듀서에 등록해주자.   

##### modules/index.js   

```react
import { combineReducers } from 'redux';
import counter from './counter';
import posts from './posts';

const rootReducer = combineReducers({ counter, posts });

export default rootReducer;
```

### 포스트 목록 구현하기   

이제 포스트 목록을 보여줄 프리젠테이셔널 컴포넌트를 준비해보자.   

##### components/PostList.js   

```react
import React from 'react';

function PostList({ posts }) {
  return (
    <ul>
      {posts.map(post => (
        <li key={post.id}>
          {post.title}
        </li>
      ))}
    </ul>
  );
}

export default PostList;
```

이제는 PostList를 위한 컨테이너 컴포넌트인 PostListContainer를 
만들어보자.   

##### containers/PostListContainer.js   

```react
import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PostList from '../components/PostList';
import { getPosts } from '../modules/posts';

function PostListContainer() {
  const { data, loading, error } = useSelector(state => state.posts.posts);
  const dispatch = useDispatch();

  // 컴포넌트 마운트 후 포스트 목록 요청
  useEffect(() => {
    dispatch(getPosts());
  }, [dispatch]);

  if (loading) return <div>로딩중...</div>;
  if (error) return <div>에러 발생!</div>;
  if (!data) return null;
  return <PostList posts={data} />;
}

export default PostListContainer;
```

이제 이 컴포넌트를 App에서 렌더링해보자.   

##### App.js   

```react
import React from 'react';
import PostListContainer from './containers/PostListContainer';

function App() {
  return <PostListContainer />;
}

export default App;
```   

아래와 같이 `비동기 작업`이 잘 처리되는 것을 확인 할 수 있다.   

<img width="750" alt="스크린샷 2021-11-06 오후 10 51 18" src="https://user-images.githubusercontent.com/26623547/140612067-24794960-7445-4d1e-9fac-f206a8b71851.png">   

<img width="750" alt="스크린샷 2021-11-06 오후 10 51 05" src="https://user-images.githubusercontent.com/26623547/140612074-733a76a5-a407-4df5-b48e-efdb6cd3d7df.png">  

### 리액트 라우터 적용하기   

이제 리액트 라우터를 프로젝트에 적용해서 특정 포스터를 읽는 기능도 
구현해보자.   

리액트 라우터를 설치하자.   

```shell
$ npm install react-router-dom  
$ npm install react-router   
```

`여기서 주의할 점은 React Router 버전을 꼭 확인해보자.`   
버전 6 이후 부터 기존과 사용 방법이 조금 다르기 때문에 
이전 버전의 소스를 그대로 사용할 경우 에러가 발생한다.   

주요 변경사항은 [참고링크1](https://reacttraining.com/blog/react-router-v6-pre/) 또는 
[참고링크2](https://blog.woolta.com/categories/1/posts/211) 을 
참고하자.    


`여러 변경사항이 있지만 Router를 Routers로 감싸서 사용해야 한다는 점이 
가장 큰 변경사항이다.`       

`또한 이전 버전처럼 exact를 사용하여 Route path에 추가하지 않아도 된다. 즉, 
    모든 Route path가 default로 정확하게 매칭된다.`   

index.js를 다음과 같이 구현하자.   

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
import { BrowserRouter } from 'react-router-dom';

const store = createStore(
    rootReducer,
    // logger 를 사용하는 경우, logger가 가장 마지막에 와야합니다.
    composeWithDevTools(applyMiddleware( ReduxThunk, logger))
); // 여러개의 미들웨어를 적용 할 수 있습니다.


ReactDOM.render(
    <BrowserRouter>
        <Provider store={store}>
            <App />
        </Provider>
    </BrowserRouter>,
    document.getElementById('root')
);

reportWebVitals();
```

### 포스트 조회하기   

이번에는 포스트 하나를 조회하는 기능을 구현해보자. 우선 
프리젠테이셔널 컴포넌트 Post.js 를 만들어보자.   

##### components/Post.js   

```react
import React from 'react';

function Post({ post }) {
  const { title, body } = post;
  return (
    <div>
      <h1>{title}</h1>
      <p>{body}</p>
    </div>
  );
}

export default Post;
```

이제 PostContainer 컴포넌트도 만들어보자.   

##### containers/PostContainer.js   

```react
import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getPost } from '../modules/posts';
import Post from '../components/Post';

function PostContainer({ postId }) {
  const { data, loading, error } = useSelector(state => state.posts.post);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(getPost(postId));
  }, [postId, dispatch]);

  if (loading) return <div>로딩중...</div>;
  if (error) return <div>에러 발생!</div>;
  if (!data) return null;

  return <Post post={data} />;
}

export default PostContainer;
```

`이 컴포넌트는 postId 값을 props로 받아온다. 해당 값은 
라우트의 URL 파라미터에서 읽어올 것이다.`    

### 라우트 설정하기   

이제 라우트를 설정해보자. pages 디렉터리에 postListPage.js 와 
PostPage.js를 다음과 같이 작성해주자.   

##### pages/PostListPage.js   

```react
import React from 'react';
import PostListContainer from '../containers/PostListContainer';

function PostListPage() {
  return <PostListContainer />;
}

export default PostListPage;
```

##### pages/PostPage.js   

```react
import React from 'react';
import PostContainer from '../containers/PostContainer';
import {useParams} from "react-router";

function PostPage() {

    const params = useParams();  // userParam hook을 이용하여 파라미터 가져오기 
    const { id } = params // URL 파라미터 조회하기

    // URL 파라미터 값은 문자열이기 때문에 parseInt 를 사용하여 숫자로 변환해주어야 합니다.
    return <PostContainer postId={parseInt(id, 10)} />;
}

export default PostPage;
```

페이지 관련 컴포넌트들을 모두 다 작성했으면, App에서 라우트 설정을 해보자.   

##### App.js   

```react
import React from 'react';
import {Route, Routes} from 'react-router-dom';
import PostListPage from './pages/PostListPage';
import PostPage from './pages/PostPage';

function App() {
  return (
        <>
          <Routes>
              <Route path="/" element={<PostListPage />} />
              <Route path="/:id" element={<PostPage />} />
          </Routes>
        </>
  );
}

export default App;
```

그 다음에는, PostList를 열어서 Link 컴포넌트를 사용해보자.   

##### components/PostList.js   

```react
import React from 'react';
import { Link } from 'react-router-dom';

function PostList({ posts }) {
  return (
    <ul>
      {posts.map(post => (
        <li key={post.id}>
          <Link to={`/${post.id}`}>{post.title}</Link>
        </li>
      ))}
    </ul>
  );
}

export default PostList;
```

이제 특정 포스트를 읽는 작업도 잘 작동하는지 확인해보자.   
잘 동작하긴 하는데 문제점이 있다.   

특정 포스트를 읽고 뒤로 갔을 때, 포스트 목록을 또 다시 불러오게 되면서 
로딩중..이 나타나게 된다.   

사용자에게 나쁜 경험을 제공할 수 있는 API 재로딩
문제를 해결해보도록 하자.    

### 포스트 목록 재로딩 문제 해결하기

포스트 목록이 재로딩 되는 문제를 해결하는 방법은 두가지가 있다.
`첫번째는 만약 데이터가 이미 존재한다면 요청을 하지 않도록 하는
방법이다.`
PostListContainer를 다음과 같이 수정해보자.

##### containers/PostListContainer.js

```react
import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PostList from '../components/PostList';
import { getPosts } from '../modules/posts';

function PostListContainer() {
    const { data, loading, error } = useSelector(state => state.posts.posts);
    const dispatch = useDispatch();

    // 컴포넌트 마운트 후 포스트 목록 요청
    useEffect(() => {
        if(data) return;
        dispatch(getPosts());
    }, [dispatch]);

    if (loading) return <div>로딩중...</div>;
    if (error) return <div>에러 발생!</div>;
    if (!data) return null;

    return <PostList posts={data} />;
}

export default PostListContainer;
```

이렇게 하고 나면 포스트 목록이 이미 있는데 재로딩 하는 이슈를 수정할 수 있다.
즉, 포스트를 열고 뒤로가기를 눌렀을 때 로딩중..이라는 문구를
띄우지 않는다.

`두번째 방법은 로딩을 새로하긴 하는데, 로딩중...을 띄우지 않는 것이다.`
`두번째 방법의 장점은 사용자에게 좋은 경험을 제공하면서도
뒤로가기를 통해 다시 포스트 목록을 조회 할 때 최신 데이터를
보여줄 수 있다는 것이다.`

우선, asyncUtils.js의 handleAsyncActions 함수를 다음과 같이
수정하자.

##### lib/asyncUtils.js -handleAsyncActions.js

```react
export const handleAsyncActions = (type, key, keepData = false) => {
  const [SUCCESS, ERROR] = [`${type}_SUCCESS`, `${type}_ERROR`];
  return (state, action) => {
    switch (action.type) {
      case type:
        return {
          ...state,
          [key]: reducerUtils.loading(keepData ? state[key].data : null)
        };
      case SUCCESS:
        return {
          ...state,
          [key]: reducerUtils.success(action.payload)
        };
      case ERROR:
        return {
          ...state,
          [key]: reducerUtils.error(action.error)
        };
      default:
        return state;
    }
  };
};
```

keepData 라는 파라미터를 추가하여 만약 이 값이 true로 주어지면
로딩을 할 때에도 데이터를 유지하도록 수정을 해주었다.

이제 posts 리덕스 모듈의 리듀서 부분도 다음과 같이 수정해보자.

##### modules/posts.js - posts 리듀서

```react
export default function posts(state = initialState, action) {
  switch (action.type) {
    case GET_POSTS:
    case GET_POSTS_SUCCESS:
    case GET_POSTS_ERROR:
      return handleAsyncActions(GET_POSTS, 'posts', true)(state, action);
    case GET_POST:
    case GET_POST_SUCCESS:
    case GET_POST_ERROR:
      return handleAsyncActions(GET_POST, 'post')(state, action);
    default:
      return state;
  }
}
```

그리고 나서 PostListContainer를 다음과 같이 수정해보자.

##### containers/PostListContainer.js

```react
import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PostList from '../components/PostList';
import { getPosts } from '../modules/posts';

function PostListContainer() {
  const { data, loading, error } = useSelector(state => state.posts.posts);
  const dispatch = useDispatch();

  // 컴포넌트 마운트 후 포스트 목록 요청
  useEffect(() => {
    dispatch(getPosts());
  }, [dispatch]);

  if (loading && !data) return <div>로딩중...</div>; // 로딩중이면서, 데이터가 없을 때에만 로딩중... 표시
  if (error) return <div>에러 발생!</div>;
  if (!data) return null;

  return <PostList posts={data} />;
}

export default PostListContainer;
```

이렇게 구현을 해주고 나면 뒤로가기를 눌렀을 때 데이터를 요청하긴 하지만,
    로딩중...이라는 문구를 보여주지 않게된다.

이 외에 더 자세한 내용은 [링크](https://react.vlpt.us/redux-middleware/06-fix-reloading.html)를 참고하자. 


- - - 

**Reference**     

<https://react.vlpt.us/redux-middleware/04-redux-thunk.html>   
<https://reacttraining.com/blog/react-router-v6-pre/>  
<https://reactrouter.com/docs/en/v6/getting-started/concepts>  
<https://blog.woolta.com/categories/1/posts/211>   

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

