---
layout: post
title: "[Airflow] Dag Bundle 과 Versioning 이해하기"
subtitle: Apache Airflow 3.x 에 도입된 기능
comments: true
categories: Airflow
date: 2026-07-06
background: /img/posts/mac.png
---
Airflow 3.0 에서는 Dag를 관리하는 방식에 큰 변화가 생겼다.   
기존 Airflow 2.x 에서는 dags 디렉터리에 있는 Python 파일을 Scheduler가 지속적으로 스캔하여 Dag를 생성했다.   
이 방식은 단순하지만, 실행 중인 Dag Run이 코드 변경의 영향을 받을 수 있다는 문제가 있었다.   
Airflow 3에서는 이러한 문제를 해결하기 위해 Dag Versioning과 Dag Bundle 이라는 두 가지 개념이 도입되었다.

이 글에서는 두 기능의 관계와 차이점을 중심으로 설명할 예정이다.  
- - -  


## 1. 기존 업무에서의 배포 구조 방식
현재 팀에서 Airflow 배포 방식은 Airflow 2.x 에서 부터 branch 별 테스트 가능한 격리 환경이 필요했고, 그에 따라 sys.path.append 방식을 이용한 커스텀 배포 패턴을 사용하고 있었다.

git action의 self-hosted 러너가 Kubernetes 클러스터 안에서 직접 코드를 git clone 하여 공유 PVC에 배치하는 커스텀 배포 방식을 사용한다.   

개발자가 Airflow Dag를 개발하여 git push를 하게 되면 master 브랜치인 경우는 Airflow prod 환경으로 배포되며, 그 외에 개발 브랜치면 Airflow dev 환경에 배포가 되는 구조이다.   

배포를 수행하는 러너 자체가 Kubernetes 클러스터 안에서 실행되며, Dag PVC(/opt/airflow/dags)를 직접 마운트 하고 있다.   
Airflow dev 의 경우는 각 git branch 마다 격리된 환경에서 테스트를 진행할 수 있도록 하기 위한 구조를 제공했었다.

```
/opt/airflow/dags/projects/
|--master/
|--NP-11945/
|--NP-12068/
```

위 배포 방식의 문제점은 git branch 마다 격리를 해주기 위하여 명시적으로 sys.path.apend 를 이용하여 상위 경로를 전달해줘야 한다는 점이다.

> 이 구조는 뒤에서 설명할 GitDagBundle 이 정확히 대체하려는 패턴이다. 브랜치마다 Bundle을 등록하면 sys.path.append 없이도 완전히 격리된 네임스페이스를 구성할 수 있다.   

- - - 
## 2. Airflow 2.x 의 한계

Airflow 2.x 에서는 Scheduler가 지정된 dags 디렉터리를 지속적으로 스캔한다.   
Dag Run이 실행되는 도중 개발자가 새로운 코드를 배포하면 다음과 같은 상황이 발생할 수 있다.   

```
Dag Run 시작
Task A 실행 완료(v1)-> 새로운 코드가 반영됨 -> Task B (v2) 실행
```

`즉, 하나의 Dag Run 안에서 서로 다른 버전의 코드가 실행될 가능성이 존재한다.`   

또는, Dag 수정시 삭제된 태스크가 Airflow UI 에서 사라지는 경우도 발생할 수 있다.

```
09:00 Dag Run 실행 (task_a >> validate >> task_b) -> validate 실행 완료
09:30 validate 태스크를 제거하고 재배포 (task_a >> task_b)
10:00 Grid 뷰 확인 -> 09:00 Run 에서도 validate 컬럼 자체가 사라짐
```

`Grid/Graph 뷰가 각 Dag Run 시점의 구조가 아니라 가장 최근에 파싱된 Dag 구조 하나만 기준으로 렌더링되기 때문이다.`   

> 실제 실행 데이터(task_instance) 는 메타데이터 DB에 남아있지만, validate가 실제로 성공했던 09:00 Run에서조차 UI 상으로는 조회할 방법이 사라진다.   

이러한 방식은 다음과 같은 문제를 발생시킨다.

- 실행 결과의 재현이 어렵다.
- 장애 발생 시 어떤 코드로 실행되었는지 확인하기 어렵다.
- Backfill이나 재실행 시 동일한 결과를 보장하기 어렵다.   

- - -  

## 3. Dag Versioning

Dag Versioning은 Dag 정의의 변경 이력을 Airflow가 자동으로 추적하는 기능이다. 별도 설정 없이 Airflow 3에서 기본 동작한다.   

`단, 모든 변경에서 새 버전이 생기는 건 아니다. 구조적 변경(structural change) 이 있고, 그 이후 새로운 Dag Run 이 생성될 때 새 버전이 만들어 진다.`

`구조적 변경(structural change) 이란 태스크 추가, 제거, 태스크 ID 변경, 태스크 의존성 변경, Dag/Task 파라미터 변경 등 serialized Dag에 영향을 주는 변경을 말한다.`   

python_callable 같은 함수 본문 내부의 로직은 Dag Versioning에 해당이 안된다.

> Airflow가 직렬화 하는 건 "이 태스크는 어떤 모듈의 어떤 함수를 호출한다"는 참조 정보이지, 그 함수의 소스코드 자체가 아니다.   

아래와 같이 query 문자열은 함수 본문 안의 로직이라 serialized Dag에 영향을 주지 않는다.

```python
@task def extract_orders(): 
	query = "SELECT id, amount FROM orders WHERE created_at >= '2026-07-01'" 
	return run_query(query)
```

반면, 아래처럼 operator 파라미터로 넘기면 구조적 변경으로 취급된다.  

```python
extract = SQLExecuteQueryOperator( 
	task_id="extract_orders", 
	conn_id="postgres_default", 
	sql="SELECT id, amount FROM orders WHERE created_at >= '2026-07-01'"
)
```

`중요한 것은 Dag Versioning은 UI에서 이력을 보고 어떤 버전이 실행됐는지 추적하는 관측성(observability) 기능이지, 그 자체로 실행 중 코드 변경으로부터 격리를 보장하지는 않는다.`   

특히 LocalDagBundle(버전 관리 미지원)을 쓰는 환경이라면, 함수 본문만 바뀐 배포는 Dag 버전이 그대로임에도 Task마다 실제로 다른 코드가 실행되는 Airflow 2.x와 동일한 문제가 재현될 수 있다.   
진짜 격리를 원한다면 운영 환경에서는 GitDagBundle(또는 버전관리 지원 커스텀 Bundle)을 구성해야 한다.   

- - -  

## 4. Dag Bundle

Dag Bundle은 Dag 와 Dag 실행에 필요한 파일을 제공하는 소스(Backend) 추상화이다.   
`Airflow3 부터는 기존의 dags/ 폴더에 파일을 두는 구조 대신, Dag 코드를 하나의 단위로 묶는 Dag Bundle 이라는 개념이 도입되었다.`   

Dag Bundle 의 종류는 아래와 같다.

- LocalDagBundle: 기존처럼 dags/ 폴더에서 로딩하며 버전관리를 하지 않는다.
- GitDagBundle: Git 저장소에서 Dag 코드를 불러오며 버전 관리를 진행한다.

> 그 외에도 S3DagBundle, GCSDagBundle을 제고하며, BaseDagBundle을 상속한 커스텀 Bundle 도 지원한다. 

Dag Bundle 구조 덕분에 Airflow 는 Dag 실행 시 해당 시점의 Dag 코드 상태를 버전(v1, v2, ..) 으로 고정 할 수 있게 되었다.
버전 관리형 Bundle을 쓰면 Task Instance를 Clear 하고 재실행할 때 UI 에서 "최신 Bundle 버전으로 실행할지, 원래 Run이 사용했던 버전으로 실행할지"를 선택할 수도 있다. 

- - -
Reference 

<https://devocean.sk.com/blog/techBoardDetail.do?page=&boardType=undefined&query=&ID=168274&searchData=&subIndex=&searchText=&techType=&searchDataSub=&searchDataMain=&comment=&p=> 
<https://github.com/apache/airflow/discussions/54669>
. 
{% highlight ruby linenos %}
{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

