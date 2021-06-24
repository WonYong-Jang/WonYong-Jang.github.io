---
layout: post
title: "[ELK] ElasticSearch 에서 한글 형태소 개념"
subtitle: "한글 형태소 분석기 nori 사용법"    
comments: true
categories : ELK
date: 2021-06-18
background: '/img/posts/mac.png'
---


# 노리(nori) 한글 형태소 분석기   

한글은 형태의 변형이 매우 복잡한 언어이다. 특히 복합어, 합성어 등이 
많아 하나의 단어도 여러 어간으로 분리해야 하는 경우가 많아 
한글을 형태소 분석을 하려면 반드시 한글 형태소 사전이 필요하다.   

Elasticsearch 6.6 버전 부터 공식적으로 Nori(노리)라고 하는 한글 형태소 분석기를 
Elastic사에서 공식적으로 개발해서 지원을 하기 시작했다.   

- - - 

## 설치   

Nori를 사용하기 위해서는 먼저 elasticsearch에 analysis-nori 플러그인을 
설치해야 한다. elasticsearch 홈 디렉토리에서 다음 명령을 실행하면 
버전에 맞는 nori 플러그인을 받아서 자동으로 설치한다.   

```
nori 플러그인 설치
$ bin/elasticsearch-plugin install analysis-nori
```   

설치된 nori 플러그인을 제거하려면 다음 명령을 실행한다.   

```
nori 플러그인 제거
$ bin/elasticsearch-plugin remove analysis-nori
```   

> Elastic 클라우드 서비스에서 사용하기 위해서는 클러스터를 배포할 때
Customize deployment 메뉴의 Manage plugins and settings 부분에서
analysis-nori 부분을 선택한다.

## nori_tokenizer   

`Nori는 nori_tokenizer 토크나이저와 nori_part_of_speech, nori_readingform 토큰 필터를 제공한다.`       

토크나이저는 사용자 질의 혹은 색인되는 문장을 형태소(토큰)형태로 분리하는데 사용된다.   

먼저 nori tokenizer 토크나이저를 사용해서 한글을 간단하게 테스트 할 수 있다. 
아래는 standard와 nori tokenizer를 비교해서 '동해물과 백두산이' 를 분석한 
예제이다. 당연히 테스트 하는 elasticsearch 에는 analaysis nori 플러그인이 
설치되어 있어야 한다.    

아래는 Standard 토크나이저를 이용한 예제이며, 결과를 보면 
공백 외에 아무런 분리를 하지 못한다.   

```
GET _analyze
{
  "tokenizer": "standard",
  "text": [
    "동해물과 백두산이"
  ]
}
```

Output   

```
{
  "tokens" : [
    {
      "token" : "동해물과",
      "start_offset" : 0,
      "end_offset" : 4,
      "type" : "<HANGUL>",
      "position" : 0
    },
    {
      "token" : "백두산이",
      "start_offset" : 5,
      "end_offset" : 9,
      "type" : "<HANGUL>",
      "position" : 1
    }
  ]
}
```   

`그러나 아래와 같이 nori_tokenizer는 한국어 사전 정보를 이용해 
단어를 분리 한 것을 확인할 수 있다.`    

```
GET _analyze
{
  "tokenizer": "nori_tokenizer",
  "text": [
    "동해물과 백두산이"
  ]
}
```

Output    

```
{
  "tokens" : [
    {
      "token" : "동해",
      "start_offset" : 0,
      "end_offset" : 2,
      "type" : "word",
      "position" : 0
    },
    {
      "token" : "물",
      "start_offset" : 2,
      "end_offset" : 3,
      "type" : "word",
      "position" : 1
    },
    {
      "token" : "과",
      "start_offset" : 3,
      "end_offset" : 4,
      "type" : "word",
      "position" : 2
    },
    {
      "token" : "백두",
      "start_offset" : 5,
      "end_offset" : 7,
      "type" : "word",
      "position" : 3
    },
    {
      "token" : "산",
      "start_offset" : 7,
      "end_offset" : 8,
      "type" : "word",
      "position" : 4
    },
    {
      "token" : "이",
      "start_offset" : 8,
      "end_offset" : 9,
      "type" : "word",
      "position" : 5
    }
  ]
}
```    

`nori_tokenizer에는 다음과 같은 옵션들이 있다.`     

- user_dictionary : 사용자 사전이 저장된 파일의 경로를 입력한다. 
- user_dictionary_rules : 사용자 정의 사전을 배열로 입력한다.   
- decompound_mode : 합성어의 저장 방식을 결정한다. 다음 3개의 값을 사용 가능하다.   

    - none : 어근을 분리하지 않고 완성된 합성어만 저장한다.    
    - discard (디폴트) : 합성어를 분리하여 각 어근만 저장한다.    
    - mixed : 어근과 합성어를 모두 저장한다.     

#### user dictionary   

`다른 애널라이저들과 마찬가지로 config 디렉토리의 상대 경로를 입력하며 
수정된 사전을 업데이트 하기 위해서는 
dictionary file을 가지고 있는 node를 재시작 하거나, 
           인덱스를 _close / _open 하면 반영된다.`    

> 인덱스가 close 된 중에는 색인이나 검색이 불가능 하게 되니 주의해야 한다.   

`참고로 elasticsearch는 특정 인덱스를 지정하여 열고 닫는 것이 가능한데 
더 이상 사용하지 않는 인덱스가 있으면 검색 서버 성능을 고려해서 
닫거나 삭제해 주는 것이 좋다.`       
이렇게 닫혀진 인덱스는 클러스터에 overhead를 주지 않으며 
닫혀진 인덱스 내용을 읽고 쓰는 것은 불가능 하다.   
다시 인덱스를 읽고 싶으면 언제든지 다시 인덱스를 열어 줄 수 있다.   

```
POST my_nori/_close
POST my_nori/_open
```

한가지 더 주의할점은 이 방식으로 사전 업데이트는 이미 인덱싱된 
document에는 적용되지 않는다.    
`왜냐하면 document는 사전이 업데이트 되기전에 
analyzer를 사용해서 인덱싱 되기 때문이다. 그래서 
사전이 업데이트 되었다고 해서 기존에 인덱싱된 document는 적용되지 않는다.`        

이런 경우 [reindex api](https://www.elastic.co/guide/en/elasticsearch/reference/current/docs-reindex.html)를 
사용하여 새로운 인덱스에 재색인을 하거나 
[Update By Query API](https://www.elastic.co/guide/en/elasticsearch/reference/7.0/docs-update-by-query.html)를 
사용하여 인덱스에 모든 정보를 업데이트 해야 한다.    



`사전의 단어들에는 우선순위가 있으며` 문장 '동해물과' 에서는 
'동해'가 가장 우선순위가 높아 '동해'가 먼저 추출되고 다시 
'물' 그리고 '과' 가 추출되어 '동해' + '물' + '과' 같은 형태가 된다.   


`user_dictionary 경로에 있는 사전 파일이나 user_dictionary_rules 설정값에 
단어만 나열 해 주면 이 단어들을 가장 우선으로 추출한다.`   

다음은 my_nori 인덱스에 user_dictionary_rules 옵션을 이용하여 사용자 사전 
'해물' 을 지정하고 '동해물과' 를 분석한 예제이다.   

```
PUT my_nori
{
  "settings": {
    "analysis": {
      "tokenizer": {
        "my_nori_tokenizer": {
          "type": "nori_tokenizer",
          "user_dictionary_rules": [
            "해물"
          ]
        }
      }
    }
  }
}
```

아래와 같이 '동해물과'를 토크나이저로 분석해보자.   

```
GET my_nori/_analyze
{
  "tokenizer": "my_nori_tokenizer",
  "text": [
    "동해물과"
  ]
}
```

아래는 my_nori_tokenizer 토크나이저로 '동해물과' 를 분석한 결과이다.   

```
{
  "tokens" : [
    {
      "token" : "동",
      "start_offset" : 0,
      "end_offset" : 1,
      "type" : "word",
      "position" : 0
    },
    {
      "token" : "해물",
      "start_offset" : 1,
      "end_offset" : 3,
      "type" : "word",
      "position" : 1
    },
    {
      "token" : "과",
      "start_offset" : 3,
      "end_offset" : 4,
      "type" : "word",
      "position" : 2
    }
  ]
}
```

`위와 같이 사용자 사전에 '해물' 이라는 단어를 추가하면 '동해물과' 는 
'동' + '해물' + '과' 로 분석이 되어 이 문장이 포함된 도큐먼트는 
'동해' 로는 검색이 되지 않고 '해물' 로 검색이 된다.`    

#### decompound_mode     

`decompound_mode 는 각각 none, discard, mixed 옵션이 있다.`   

'백두산'은 '백두' + '산' 두 어근이 합쳐진 합성어 이다. 보통 
'미역' + '국' 같은 음식이나 '서울' + '역' 같은 역 이름에 합성어가 
많다.   

아래 예제는 3가지 옵션으로 각각 설정한 토크나이저이며, 
    각 옵션에 따라서 '백두산이' 어떻게 분석되는지 확인해보자.     


```
PUT my_nori
{
  "settings": {
    "analysis": {
      "tokenizer": {
        "nori_none": {
          "type": "nori_tokenizer",
          "decompound_mode": "none"
        },
        "nori_discard": {
          "type": "nori_tokenizer",
          "decompound_mode": "discard"
        },
        "nori_mixed": {
          "type": "nori_tokenizer",
          "decompound_mode": "mixed"
        }
      }
    }
  }
}
```

`먼저 none 옵션일때를 확인해보자.`    

```
GET my_nori/_analyze
{
  "tokenizer": "nori_none",
  "text": [ "백두산이" ]
}
```

Output   

```
{
  "tokens" : [
    {
      "token" : "백두산",
      "start_offset" : 0,
      "end_offset" : 3,
      "type" : "word",
      "position" : 0
    },
    {
      "token" : "이",
      "start_offset" : 3,
      "end_offset" : 4,
      "type" : "word",
      "position" : 1
    }
  ]
}
```   

`다음은 discard 옵션의 경우를 살펴보자.`       

```
GET my_nori/_analyze
{
  "tokenizer": "nori_discard",
  "text": [ "백두산이" ]
}
```   

Output   

```
{
  "tokens" : [
    {
      "token" : "백두",
      "start_offset" : 0,
      "end_offset" : 2,
      "type" : "word",
      "position" : 0
    },
    {
      "token" : "산",
      "start_offset" : 2,
      "end_offset" : 3,
      "type" : "word",
      "position" : 1
    },
    {
      "token" : "이",
      "start_offset" : 3,
      "end_offset" : 4,
      "type" : "word",
      "position" : 2
    }
  ]
}
```   

`마지막으로 mixed 옵션일 경우를 살펴보자.`    

```
GET my_nori/_analyze
{
  "tokenizer": "nori_mixed",
  "text": [ "백두산이" ]
}
```   

Output   

```
{
  "tokens" : [
    {
      "token" : "백두산",
      "start_offset" : 0,
      "end_offset" : 3,
      "type" : "word",
      "position" : 0,
      "positionLength" : 2
    },
    {
      "token" : "백두",
      "start_offset" : 0,
      "end_offset" : 2,
      "type" : "word",
      "position" : 0
    },
    {
      "token" : "산",
      "start_offset" : 2,
      "end_offset" : 3,
      "type" : "word",
      "position" : 1
    },
    {
      "token" : "이",
      "start_offset" : 3,
      "end_offset" : 4,
      "type" : "word",
      "position" : 2
    }
  ]
}
```

`각 설정에 따라 어근을 분리하거나 분리하지 않거나 모두 저장하는 것을 
확인 할 수 있다. decompound_mode의 디폴트 값은 discard 이다.`   


- - -    

## nori part of speech 와 품사 정보 (토큰필터)     

한글 검색에서는 보통 명사, 동명사 정도만을 검색하고 조사, 형용사 등은 
제거하는 것이 바람직하다.    
`nori part of speech 토큰 필터를 이용해서 제거할 품사 정보의 지정이 
가능하며, 옵션 stoptags 값에 배열로 제외할 품사 코드를 나열해서 
사용한다.`     

품사 코드는 [링크](http://kkma.snu.ac.kr/documents/?doc=postag)에 명시된 페이지에서 찾을 수 있다.   
stoptags의 디폴트 값은 다음과 같다.   

```
"stoptags": [
  "E", "IC", "J", "MAG", "MAJ",
  "MM", "SP", "SSC", "SSO", "SC",
  "SE", "XPN", "XSA", "XSN", "XSV",
  "UNA", "NA", "VSV"
]
```   

다음은 my pos 인덱스에 조사(JO)를 제거하도록 stoptags를 지정하고 
문장 '다섯아이가'를 분석한 예제이다.   

```
PUT my_pos
{
  "settings": {
    "index": {
      "analysis": {
        "filter": {
          "my_pos_f": {
            "type": "nori_part_of_speech",
            "stoptags": [
              "JO"
            ]
          }
        }
      }
    }
  }
}
```

```
GET my_pos/_analyze
{
  "tokenizer": "nori_tokenizer",
  "filter": [
    "my_pos_f"
  ],
  "text": "다섯아이가"
}
```

Output   

```
{
  "tokens" : [
    {
      "token" : "다섯",
      "start_offset" : 0,
      "end_offset" : 2,
      "type" : "word",
      "position" : 0
    },
    {
      "token" : "아이",
      "start_offset" : 2,
      "end_offset" : 4,
      "type" : "word",
      "position" : 1
    }
  ]
}

```   

위와 같이 다섯 + 아이 + 가 로 분석되어야 할 문장에서 조사인 '가' 제거 된 것을 
확인 할 수 있다.   

- - -   

## nori readingform (토큰필터)   

`nori readingform 토큰 필터는 한자로 된 단어를 한글로 바꾸어 저장한다.`    
별도의 옵션 없이 토큰필터로 명시하면 바로 적용이 가능하다.      

```
GET _analyze
{
  "tokenizer": "nori_tokenizer",
  "filter": [
    "nori_readingform"
  ],
  "text": "春夏秋冬"
}
```   

Output   

```
{
  "tokens" : [
    {
      "token" : "춘하추동",
      "start_offset" : 0,
      "end_offset" : 4,
      "type" : "word",
      "position" : 0
    }
  ]
}
```

- - - 

## explain : true 옵션   

query 또는 analuze API 에서 explain : true 옵션을 추가하면 
분석된 한글 형태소들의 품사 정보를 같이 볼 수 있다.   
explain 옵션은 nori 외에도 대부분의 애널라이저나 쿼리에서 사용하면 
확장된 정보를 보여준다.

아래 예제를 살펴보자.    

```
GET _analyze
{
  "tokenizer": "nori_tokenizer",
  "text": "동해물과 백두산이",
  "explain": true
}
```

Output   

```
{
  "detail" : {
    "custom_analyzer" : true,
    "charfilters" : [ ],
    "tokenizer" : {
      "name" : "nori_tokenizer",
      "tokens" : [
        {
          "token" : "동해",
          "start_offset" : 0,
          "end_offset" : 2,
          "type" : "word",
          "position" : 0,
          "bytes" : "[eb 8f 99 ed 95 b4]",
          "leftPOS" : "NNP(Proper Noun)",
          "morphemes" : null,
          "posType" : "MORPHEME",
          "positionLength" : 1,
          "reading" : null,
          "rightPOS" : "NNP(Proper Noun)",
          "termFrequency" : 1
        },
        {
          "token" : "물",
          "start_offset" : 2,
          "end_offset" : 3,
          "type" : "word",
          "position" : 1,
          "bytes" : "[eb ac bc]",
          "leftPOS" : "NNG(General Noun)",
          "morphemes" : null,
          "posType" : "MORPHEME",
          "positionLength" : 1,
          "reading" : null,
          "rightPOS" : "NNG(General Noun)",
          "termFrequency" : 1
        },
        {
          "token" : "과",
          "start_offset" : 3,
          "end_offset" : 4,
          "type" : "word",
          "position" : 2,
          "bytes" : "[ea b3 bc]",
          "leftPOS" : "J(Ending Particle)",
          "morphemes" : null,
          "posType" : "MORPHEME",
          "positionLength" : 1,
          "reading" : null,
          "rightPOS" : "J(Ending Particle)",
          "termFrequency" : 1
        },
        {
          "token" : "백두",
          "start_offset" : 5,
          "end_offset" : 7,
          "type" : "word",
          "position" : 3,
          "bytes" : "[eb b0 b1 eb 91 90]",
          "leftPOS" : "NNG(General Noun)",
          "morphemes" : null,
          "posType" : "MORPHEME",
          "positionLength" : 1,
          "reading" : null,
          "rightPOS" : "NNG(General Noun)",
          "termFrequency" : 1
        },
        {
          "token" : "산",
          "start_offset" : 7,
          "end_offset" : 8,
          "type" : "word",
          "position" : 4,
          "bytes" : "[ec 82 b0]",
          "leftPOS" : "NNG(General Noun)",
          "morphemes" : null,
          "posType" : "MORPHEME",
          "positionLength" : 1,
          "reading" : null,
          "rightPOS" : "NNG(General Noun)",
          "termFrequency" : 1
        },
        {
          "token" : "이",
          "start_offset" : 8,
          "end_offset" : 9,
          "type" : "word",
          "position" : 5,
          "bytes" : "[ec 9d b4]",
          "leftPOS" : "J(Ending Particle)",
          "morphemes" : null,
          "posType" : "MORPHEME",
          "positionLength" : 1,
          "reading" : null,
          "rightPOS" : "J(Ending Particle)",
          "termFrequency" : 1
        }
      ]
    },
    "tokenfilters" : [ ]
  }
}

```

- - - 

**Reference**    

<https://esbook.kimjmin.net/06-text-analysis/6.7-stemming/6.7.2-nori>   
<http://kimjmin.net/2019/08/2019-08-how-to-analyze-korean/>   
<https://coding-start.tistory.com/167>    
<https://www.elastic.co/guide/en/elasticsearch/plugins/current/analysis-nori.html>    

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

