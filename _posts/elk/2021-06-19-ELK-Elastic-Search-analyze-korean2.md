---
layout: post
title: "[ELK] ElasticSearch에서 한글 형태소 분석 실습"
subtitle: "공공데이터를 이용한 대시보드 만들기 / Logstash, Elasticsearch, Kibana"    
comments: true
categories : ELK
date: 2021-06-19
background: '/img/posts/mac.png'
---

[지난 글](https://wonyong-jang.github.io/elk/2021/06/18/ELK-Elastic-Search-analyze-korean.html) 에서 엘라스틱 서치에서 제공하는 한글 형태소 분석기 nori에 대해서 살펴봤다.     
이번 글에서는 한글 형태소 분석기인 nori를 이용하여 실습해 보자.   
먼저 Logstash를 이용하여 공공 데이터를 엘라스틱 서치에 색인하고 
색인된 데이터를 이용하여 대시보드를 만들어보자.    

- - -    
 
## 공공데이터 이용하기    

엘라스틱 서치에서 제공하는 nori를 실습해보기 위해서 한글 정보가 많은 
데이터를 선택한다.    
이 글에서는 [서울 열린 데이터 광장](https://data.seoul.go.kr/)에서 제공하는 
'서울특별시 시민참여예산 제안사업 댓글'을 json 형식으로 
다운로드 하여 data.json 이름으로 저장하였다.    

- - -    

## Logstash를 이용하여 ES로 색인 

`Logstash는 실시간 파이프라인 기능을 가진 오픈소스 데이터 수집엔진이다.`   
Logstash는 Filebeat와 연동을 한다면 파일에 축적되고 있는 로그 데이터를 
하나의 저장소로 보낼수도 있고, 카프카의 토픽에 누적되어 있는 
메시지들을 가져와 하나의 저장소에 보낼 수도 있다.      

<img width="509" alt="스크린샷 2021-06-19 오후 11 41 53" src="https://user-images.githubusercontent.com/26623547/122645963-fce29600-d157-11eb-893d-3140ab1a4503.png">   

데이터 처리를 위한 logstash 설정은 input, filter, output으로 나뉜다.   

Logstash 설정은 아래와 같이 logstash.conf 파일을 생성해 주었다.   

```
input {
  file {
    path => "{데이터 경로}/data.json"
    codec => "json"
    start_position => "beginning"
    sincedb_path => "/dev/null"
  }
}
filter {
}

output {
  elasticsearch {
    hosts => "http://localhost:9200"
    index => "nori-analyzer"
  }
  stdout {}
}
```

### Input 설정    

##### path    

입력 파일(input)이 위치한 경로이다.   

##### start_position

Logstash를 시작할 때 file의 어디서부터 읽을지를 결정하는 설정이다.   

`주의할 점은 start_position설정은 file을 최초 읽을 때만 적용된다는 점이다. 즉, logstash를 여러번 restart 하더라도 
동일한 내용이 출력될 것이라고 생각하면 안된다.`       

##### sincedb 

`logstash가 최초 시작될 때는 file을 읽을 위치가 start_position에 의해 결정되지만, 
이후 실행시에는 sincedb에 저장된 offset 부터 읽기 시작한다.`       

sincedb가 저장된 위치에서 저장된 offset을 확인해보면 현재 어디까지 처리 되었는지 확인이 가능하다.   

```
$ cat ~/.sincedb_a8ae6517118b64cf101eba5a72c366d4
22253332 1 3 14323
```

`위의 예에서 22253332번 파일은 현재 14323번 offset까지 처리가 되었다는 걸 의미하며, logstash를 restart하는 경우 
start_position값과 상관없이 14323 offset부터 파일을 읽기 시작한다.`   

`logstash를 테스트 하는 동안에는 sincedb 때문에 테스트하는데 번거로우므로 path를 /dev/null로 설정하면 
restart 할때마다 처음부터 파일을 읽는다.`        


### logstash 파이프라인 시작   

`아래와 같이 파라미터 -e, -f를 사용하는 경우 conf 설정파일을 읽어서 모든 파이프라인을 시작한다.   
만약 파라미터 -e, -f를 사용하지 않는 경우 pipeline.yml를 읽어서 실행시킨다. 파라미터를 
주지 않고 실행시킬 경우 pipeline.yml을 작성해야 한다.`        

먼저 logstash를 설치했다면 확인을 위해서 아래와 같이 입력한다.   
-e 옵션을 이용하면 설정 파일을 읽지 않고, 그 다음에 오는 명령을 설정으로 인식한다.   
위 명령은 stdin -> filter 없음 -> stdout으로 동작하는 logstash를 실행한다는 의미이다.   
즉, 명령어 입력후 hello world를 입력하면 timestamp, host 정보를 붙여서 그대로 hello world가 출력되는 것을 
확인 할 수 있다.   

```
$ logstash -e 'input { stdin {}} output {stdout {} }'
```

아래는 명령어는 생성한 conf 파일을 이용하여 logstash를 실행한다.    

```
// logstash -f {설정파일 명}
$ sudo logstash -f logstash.conf   
```

- - - 

## mappings 설정     

가장 간단한 방법은 샘플 데이터를 조금 색인을 해보고 나온 맵핑 정보를 이용하여 
커스터 마이징 하는 방법을 권장한다.   
또한, text 분석이 굳이 필요 없는 필드는 text를 지우고 keyword만을 사용하도록 설정하면 
저장 인덱스 용량을 아낄 수 있고 성능면에서도 이점이 있다.    

`엘라스틱 서치가 맵핑 정보를 자동으로 해주지만, 맵핑을 최적화 해서 만드는 것이 
성능을 튜닝 할 수 있는 방법 중 하나이다.`           



- - - 

## settings 설정    


```
"settings" : {
    "index" : {
      "analysis" : {
        "filter" :  {
          "my_pos_f": {
            "type": "nori_part_of_speech",
            "stoptags": [
              "E", "IC", "J", "MAG", "MAJ",
  "MM", "SP", "SSC", "SSO", "SC",
  "SE", "XPN", "XSA", "XSN", "XSV",
  "UNA", "NA", "VSV","SF","VA", "VCN", "VCP", "VX", "VV", "NR", "XR", "NP", "SN", "NNB"
            ]
          }
        },
        "analyzer" : {
            "nori" :  {
              "filter": [
                "my_pos_f"
                ],
              "tokenizer" : "nori_tokenizer"
            }
        }
      }
    }
  }
```    

`아래와 같이 analyze api를 이용하여 해당 인덱스 테스트가 가능하다.`   
`text에 테스트하고자 하는 내용을 작성하면 품사 확인이 
가능하기 때문에 테스트 후 색인에 제외시킬 항목이 있으면 filter를 추가해주면 된다.`     


```
POST nori-analyzer-temp/_analyze
{ 
  "text": "때", 
  "explain": true 
}
```   

## 인덱스 정보 확인   

최종적으로 settings와 mapping 설정을 확인하면 다음과 같다.   

```
{
  "nori-analyzer-temp" : {
    "aliases" : { },
    "mappings" : {
      "doc" : {
        "properties" : {
          "@timestamp" : {
            "type" : "date"
          },
          "@version" : {
            "type" : "text",
            "fields" : {
              "keyword" : {
                "type" : "keyword",
                "ignore_above" : 256
              }
            }
          },
          "eval_desc" : {
            "type" : "text",
            "fields" : {
              "keyword" : {
                "type" : "keyword",
                "ignore_above" : 256
              },
              "nori" : {
                "type" : "text",
                "analyzer" : "nori",
                "fielddata" : true
              }
            }
          },
          "eval_seq" : {
            "type" : "text",
            "fields" : {
              "keyword" : {
                "type" : "keyword",
                "ignore_above" : 256
              }
            }
          },
          "fis_year" : {
            "type" : "text",
            "fields" : {
              "keyword" : {
                "type" : "keyword",
                "ignore_above" : 256
              }
            }
          },
          "host" : {
            "type" : "text",
            "fields" : {
              "keyword" : {
                "type" : "keyword",
                "ignore_above" : 256
              }
            }
          },
          "message" : {
            "type" : "text",
            "fields" : {
              "keyword" : {
                "type" : "keyword",
                "ignore_above" : 256
              }
            }
          },
          "path" : {
            "type" : "text",
            "fields" : {
              "keyword" : {
                "type" : "keyword",
                "ignore_above" : 256
              }
            }
          },
          "reg_dt" : {
            "type" : "long"
          },
          "sugg_no" : {
            "type" : "text",
            "fields" : {
              "keyword" : {
                "type" : "keyword",
                "ignore_above" : 256
              }
            }
          },
          "tags" : {
            "type" : "text",
            "fields" : {
              "keyword" : {
                "type" : "keyword",
                "ignore_above" : 256
              }
            }
          },
          "up_dt" : {
            "type" : "long"
          },
          "use_yn" : {
            "type" : "text",
            "fields" : {
              "keyword" : {
                "type" : "keyword",
                "ignore_above" : 256
              }
            }
          }
        }
      }
    },
    "settings" : {
      "index" : {
        "number_of_shards" : "5",
        "provided_name" : "nori-analyzer-temp",
        "creation_date" : "1624518890938",
        "analysis" : {
          "filter" : {
            "my_pos_f" : {
              "type" : "nori_part_of_speech",
              "stoptags" : [
                "E",
                "IC",
                "J",
                "MAG",
                "MAJ",
                "MM",
                "SP",
                "SSC",
                "SSO",
                "SC",
                "SE",
                "XPN",
                "XSA",
                "XSN",
                "XSV",
                "UNA",
                "NA",
                "VSV",
                "SF",
                "VA",
                "VCN",
                "VCP",
                "VX",
                "VV",
                "NR",
                "XR",
                "NP",
                "SN",
                "NNB"
              ]
            },
            "my_stop" : {
              "type" : "stop",
              "stopwords_path" : "stopFilter.txt"
            }
          },
          "analyzer" : {
            "nori" : {
              "filter" : [
                "my_pos_f",
                "my_stop"
              ],
              "tokenizer" : "nori_tokenizer"
            }
          },
          "tokenizer" : {
            "nori" : {
              "type" : "nori_tokenizer",
              "decompound_mode" : "mixed"
            }
          }
        },
        "number_of_replicas" : "1",
        "uuid" : "0ijTmq3JRLerdyBlLUs2tA",
        "version" : {
          "created" : "6080299"
        }
      }
    }
  }
}
```   

위의 mappings 설정에서 nori 애널라이저를 적용할 필드에 직접 추가해 줄 수도 있지만, 
 아래와 같이 default로 nori 애널라이저를 지정해서 필드에 직접 추가하지 않고도 
    모두 default로 nori 애널라이저가 적용되게 할 수도 있다.   

```
"analyzer" : {
    "default" : {
        "tokenizer" : "nori",
        "filter": [
            "my_pos_f"
        ]
    }
}
```

> 애널라이저를 추가하지 않으면 default로 standard 애널라이저가 적용된다.   

또한, fielddata를 true로 하지 않으면 aggregations를 사용하지 못한다. 
자세한 내용은 [링크](https://wonyong-jang.github.io/elk/2021/07/06/ELK-Elastic-Search-fielddata.html)를 
참고하자.    

## Kibana에서 대시보드 만들기   

<img width="1256" alt="스크린샷 2021-06-28 오전 9 43 14" src="https://user-images.githubusercontent.com/26623547/123564721-6e27e600-d7f5-11eb-9737-21f6f69cd610.png">   

- - - 

**Reference**   

<http://data.seoul.go.kr/dataList/OA-15717/S/1/datasetView.do>      
<https://coding-start.tistory.com/189>   

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

