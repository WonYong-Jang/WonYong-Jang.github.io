---
layout: post
title: "[Airflow] Rebuilding Out Airflow Deployment Structure for Airflow 3"
subtitle: Dag Bundle / Module Management / Cluster Policy / sys.path.append 배포 방식에서 Dag Bundle 로
comments: true
categories: Airflow
date: 2026-07-06
background: /img/posts/mac.png
---
이 글에서는 Airflow 2.x 에서 진행하던 배포 방식을 개선하기 위해, Airflow 3.x 에서 제공하는 기능들에 대해서 살펴보며, 어떻게 개선할 수 있는지 살펴볼 예정이다.   

Airflow 3.x 에서는 Dag를 관리하는 방식에 큰 변화가 생겼다.   
기존 Airflow 2.x 에서는 dags 디렉터리에 있는 Python 파일을 Scheduler가 지속적으로 스캔하여 Dag를 생성했다.   

> AIrflow 3.x 부터는 Scheduler가 아닌 Dag Processor가 파일을 지속적으로 스캔한다. (3.x 에서 Dag Processor는 스케줄러에서 분리된 독립 컴포넌트다.)   

이 방식은 단순하지만, 실행 중인 Dag Run 이 코드 변경의 영향을 받을 수 있다는 문제가 있었다.   
Airflow 3에서는 이러한 문제를 해결하기 위해 Dag Versioning과 Dag Bundle 이라는 두 가지 개념이 도입되었다.

이 개념들에 대해 살펴보며, 기존 배포 방식을 어떻게 개선할 수 있을지 살펴보자.
- - -  

## 1. 기존 업무에서의 배포 구조 방식
현재 팀에서 Airflow 배포 방식은 Airflow 2.x 에서 부터 branch 별 테스트 가능한 격리 환경이 필요했고, 그에 따라 sys.path.append 방식을 이용한 커스텀 배포 패턴을 사용하고 있었다.

### 1-1) 배포 파이프라인 개요

GitHub Actions의 self-hosted 러너가 Kubernetes 클러스터 안에서 직접 동작하며, Dag PVC(/opt/airflow/dags)를 마운트한 상태로 코드를 git clone하여 배치하는 구조다.

`개발자가 Airflow Dag를 개발하여 git push를 하게 되면 master 브랜치인 경우는 Airflow prod 환경으로 배포되며, 그 외에 개발 브랜치면 Airflow dev 환경에 배포가 되는 구조이다.`       

Airflow dev 의 경우는 각 feature branch 마다 격리된 환경에서 테스트를 진행할 수 있도록 하기 위한 구조를 제공했었다.

### 1-2) store / symbolic 링크 구조

예를 들어, feature-11945를 push 하게 되면 러너가 /opt/airflow/dags/my-company/store/feature-11945/{COMMIT_ID} 경로로 git clone을 해 놓게 된다.

여기서 핵심은 두 계층으로 나뉜다는 점이다.   

1. store/ 계층(숨김, 실제 코드 위치): 러너가 git clone한 실제 소스코드가 커밋 단위로 쌓이는 곳이며, store 경로는 .airflowignore 를 통해 Dag Processor의 파싱 대상에서 제외된다.
2. 심볼릭 링크 계층(파싱 대상) : store/feature-11945/{COMMIT-ID}를 가르키는 심볼릭 링크가 /opt/airflow/dags/my-company/feature-11945 경로에 생성되며, Dag Processor는 이 심볼릭 링크 경로만 스캔하고 파싱한다.

`즉, 실제 코드가 저장되는 위치와 Dag Processor가 파싱하는 위치를 분리함으로써, 배포 시점에는 store 하위에 새 커밋을 안전하게 clone 해두고, 준비가 끝난 뒤 심볼릭 링크만 원자적으로 갱신(swap)하는 방식으로 무중단 배포에 가깝게 운영할 수 있게 된다.`    

`이런 방식을 사용한 이유는 동일한 브랜치에서 새로운 커밋이 반영될 때 기존 코드를 삭제하고 새로 clone 및 전처리하는 과정에서 코드가 일시적으로 사라지는 구간이 발생하기 때문이다.`   
`이 구간에 Dag 파일이 없어져 Airflow 에서 Dag가 사라지는 이슈를 방지하기 위해 새로운 코드가 준비가 완료된 이후, 심볼릭 링크를 변경해주는 방식을 채택하였다.`   

```shell
# Airflow dev의 경우 (브랜치별 격리)
/opt/airflow/dags/my-company/
├── store/                          # .airflowignore로 파싱 제외 (실제 clone 위치)
│   ├── feature-11945/
│   │   └── 2e8003/
│   │       ├── common_utils/
│   │       │   └── runtime_variable.py
│   │       └── dags/
│   │           └── example_etl.py
│   └── feature-12068/
│       └── cf33111/
│           ├── common_utils/
│           └── dags/
│
├── feature-11945 -> store/feature-11945/2e8003    # 심볼릭 링크 (파싱 대상)
└── feature-12068 -> store/feature-12068/cf33111   # 심볼릭 링크 (파싱 대상)

# Airflow prod의 경우 (master 단일, 동일한 원리)
/opt/airflow/dags/my-company/
├── store/
│   └── master/
│       └── 625c9a/
│           ├── common_utils/
│           └── dags/
│               └── example_etl.py
└── master -> store/master/625c9a
```

위 그림과 달리 Dag Processor나 개발자가 /opt/airflow/dags/my-company/feature-11945 경로에서 심볼릭 링크를 타고 들어가면, 아래처럼 마치 그 브랜치 전용 디렉토리가 통째로 존재하는 것처럼 보인다. 

```shell
# Airflow dev의 경우 (심볼릭 링크를 resolve해서 본 뷰 = 브랜치별 격리)
/opt/airflow/dags/my-company/
├── feature-11945/          # 실체는 store/feature-11945/{2e8003} 심볼릭 링크
│   ├── common_utils/       
│   │   └── runtime_variable.py
│   └── dags/
│       └── example_etl.py  
└── feature-12068/          # 실체는 store/feature-12068/{cf33111} 심볼릭 링크
    ├── common_utils/
    │   └── runtime_variable.py
    └── dags/
        └── example_etl.py

# Airflow prod의 경우 (master 단일, 동일한 원리)
/opt/airflow/dags/my-company/
└── master/                 # 실체는 store/master/{625c9a} 심볼릭 링크
    ├── common_utils/
    │   └── runtime_variable.py
    └── dags/
        └── example_etl.py
```

위 구조 덕분에 브랜치 간 코드가 완전히 격리되며, 여러 개발자가 하나의 dev cluster 에서 동시에 테스트가 가능한 환경을 제공했었다.   
`하지만 그 대가로, Dag 파일이 자기 브랜치 안의 common_utils를 import 하려면 브랜치 루트 경로를 직접 sys.path에 추가해줘야 한다.`   

`즉, 위 배포 방식의 문제점은 git branch 마다 격리를 해주기 위하여 Dag 마다 명시적으로 sys.path.apend 를 이용하여 상위 경로를 전달해줘야 한다는 점이다.`     

> Dag 파일은 {Branch}/dags/ 아래에 있고, 공통 코드는 {Branch}/common_utils/ 에 있으므로, Dag 파일 기준 두 단계 상위를 path에 추가해야 한다.

```python
import sys, os

# example_etl.py 기준 두 단계 위 = 브랜치 루트(feature-11945/)
# 브랜치 루트를 path에 추가하여 그 안의 common_utils를 import 가능하게 만든다.
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from common_utils.runtime_variable import runtime_variable
```

`그렇지 않고, 아래와 같이 자기 브랜치 dags 폴더까지만 sys.path에 추가하면 common_utils 처럼 그 상위(브랜치 루트)에 있는 공통 코드를 찾지 못하는 문제가 발생한다.`

```python
import sys, os
# feature-11945/dags/ 경로만 추가됨
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
# ModuleNotFoundError: No module named 'common_utils'
# common_utils 는 feature-11945/dags 안이 아니라 feature-11945/ 바로 아래 있기 때문
from common_utils.runtime_variable import runtime_variable
```

또한, 디렉터리의 depth가 깊어질수록 아래와 같은 경로 계산 코드가 파일마다 계속 추가될 수 있다는 문제가 존재한다.   

```python
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.append(str(Path(__file__).parents[2]))
sys.path.append(str(Path(__file__).parents[3]))
```

`그리고 이 구조에는 스토리지 측면과 Dag 파싱 시간에 대한 문제도 존재한다.`   
dev 환경은 브랜치마다 레포 전체를 git clone 해서 공유 PVC에 올리는 방식이므로, 레포 전체가 브랜치 수만큼 그대로 중복 적재된다. 

Dag Processor는 dags_folder(/opt/airflow/dags) 아래를 재귀적으로 흝어 모든 파이썬 파일을 찾아 파싱을 한다.   
따라서 기존 구조에서 이를 해결하기 위해서 각 브랜치 마다 실제 테스트한 Dag 에 대해서만 파싱하도록 나머지 Dag 에 대해서는 파싱을 제외하는 .airflowignore를 활용하는 방식을 사용했다.

> Dag Processor는 .airflowignore 패턴에 걸린 경로를 아예 파싱 대상에서 제외하므로, 브랜치가 쌓여도 실제 파싱 수를 통제할 수 있다.

> .airflowignore 는 bundle 단위로도 동작하므로, Bundle 하나 = Branch 하나로 격리하면 각 Bundle이 자기 브랜치 파일만 보게되어 스코프가 깔끔해질 것이기 때문에 해당 파일은 Dag Bundle 방식 전환시에도 적극 활용해야 한다.


### 1-3) 파이썬의 sys.path

위와 같이 from common_utils.runtime_variable import ... 라고 하면, 파이썬은 "미리 정해진 찾아볼 목록" 에서만 순서대로 찾는다.   
따라서, 처음 찾은 common_utils 을 사용하게 되고, 찾을 수 없다면 에러를 발생시킨다.

> 이 목록의 이름이 sys.path 이며, 만약 common_utils 의 디렉터리가 여러개라면 처음 찾은 디렉터리를 사용하게 되니 주의해야 한다.   

`Airflow는 실행 시 sys.path 에 dags, config, plugins 세 폴더를 동적으로 추가하며, 추가로 PYTHONPATH 환경변수로 검색 경로를 확장할 수 있다.`   

> 여기서 dags는 sys.path에 올라가는 루트 dags_folder 인 /opt/airflow/dags 이다.

[Airflow Moodules Management](https://airflow.apache.org/docs/apache-airflow/3.2.2/administration-and-deployment/modules_management.html) 문서에서도 PYTHONPATH 루트 아래 고유한 최상위 패키지(my_company) 하나를 두고, 그 안에 공유 코드와 DAG 코드를 함께 넣으라고 말하고 있다.

이 문서는 다음도 함께 권고하고 있다.

```
- 모든 패키지 폴더에 __init__.py를 둘 것
  : Python 3 의 네임스페이스 패키지에 의존하지 말고 정규 패키지로 구성한다.
  
- 상대 임포트를 사용하지 말 것
  : 항상 최상위 패키지부터의 절대 임포트를 사용한다.

- 최상위 레벨에 표준 라이브러리나 Airflow와 겹칠 수 있는 일반적인 이름(common, utils 등)을 직접 두지 말 것. 
```

현재 구조는 PYTHONPATH를 배포 설정으로 미리 등록하는 대신, Dag 파일 안에서 sys.path.append로 그 역할을 대신하도록 구성한 것이다.   

> 이 구조는 뒤에서 설명할 GitDagBundle 이 정확히 대체하려는 패턴이다. 브랜치마다 Bundle을 등록하면 sys.path.append 없이도 완전히 격리된 네임스페이스를 구성할 수 있다.   

또한, 브랜치 폴더 마다 Dag 파일이 구성되기 때문에 dag_id 가 브랜치 간에 겹치기 쉽다.   
`Airflow 메타데이터 DB의 dag 테이블은 dag_id를 PK로 쓰기 때문에, Dag Processor가 공유 PVC를 계속 스캔하는 한 어느 브랜치가 마지막으로 파싱됐느냐에 따라 같은 dag_id의 row가 서로 다른 브랜치 코드로 계속 덮어써 진다.`   
따라서, 이 또한 dev 환경의 경우는 dag_id 에 브랜치 이름을 추가하여 고유하게 강제하는 로직이 들어가야 한다.

```python
import os
branch = os.environ.get("AIRFLOW_DEPLOY_BRANCH", "master")
with DAG(dag_id=f"example_etl_{branch}") as dag:
```
> branch 마다 격리된 환경으로 테스트를 해야 하기 때문에 이 로직은 Dag Bundle 을 사용하더라도 필요하다.


마지막으로, Airflow 3 에서 제공하는 Dag Versioning을 사용함에도 불구하고, Versioning 기능을 제대로 활용하기 어렵다.  

> Dag Versioning과 Dag Bundle에 대한 내용은 아래에서 자세히 다룰 예정이다.   


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

`단, 모든 코드 변경이 새로운 Dag Version을 생성하는 것은 아니다. Dag Processor가 Dag를 다시 파싱했을 때 Serialized Dag(실행에 필요한 Dag 정의)가 이전과 달라진 경우에만 새로운 Dag Version이 생성된다.`

`예를 들면, 태스크 추가, 제거, 태스크 ID 변경, 태스크 의존성 변경, Dag/Task 파라미터 변경 등 serialized Dag에 영향을 주는 변경을 말한다.`   

python_callable 같은 함수 본문 내부의 로직은 Dag Versioning에 해당이 안된다.

> Airflow가 직렬화 하는 건 "이 태스크는 어떤 모듈의 어떤 함수를 호출한다"는 참조 정보이지, 그 함수의 소스코드 자체가 아니다.   

아래와 같이 query 문자열은 함수 본문 안의 로직이라 serialized Dag에 영향을 주지 않는다.

```python
@task 
def extract_orders(): 
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

Dag Bundle의 자세한 내용은 [링크](https://wonyong-jang.github.io/airflow/2026/07/10/Airflow3-Dag-Bundle.html) 를 참고하자.

## 5. Alternative Solution

위의 솔루션은 하나의 airflow(dev) 에서 여러 브랜치를 격리 하여 테스트 환경을 제공하려는 방안이고, 각 브랜치 마다 개별 airflow 환경을 제공하는 방식도 대안으로 볼 수 있다. 

실제로 여러 글에서 이런 사례를 확인해볼 수 있다.
- [여러 조직에서 Airflow 제공하기 2](https://engineering.linecorp.com/ko/blog/multi-tenancy-airflow-2)
- [Ephemeral Environments for Apache Airflow](https://medium.com/go-city/ephemeral-environments-for-apache-airflow-1c39df75ea14)

위 방식을 Ephemeral Airflow Environment 방식이라고 부르며, 일반적으로 Github Actions에서 PR 이벤트를 트리거로 Helm release 를 네임스페이스 단위로 올리고 내리는 방식을 많이 사용한다.   

> PR이 닫히면 네임스페이스를 통째로 정리하여 Airflow를 종료한다. 

### 5-1) 선택 기준

##### Dag Bundle(FeatureBranchGitDagBundle)
- 검증하려는 변경이 대부분 Dag 코드/로직 수준이고, Airflow 설정이나 provider 버전 변경이 드문 경우
- 동시 활성 브랜치 수가 많은 경우
- 빠른 반복 개발 루프가 중요한 경우(브랜치 push 이후 빠르게 dev cluster 에 반영)
- Connection/Variable/Pool 구성이 이미 안정적이고 자주 바뀌지 않는 경우 

##### Ephemeral Airflow Environment
- Airflow 버전 업그레이드, provider 패키지 변경, Scheduler, Executor 변경을 자체 브랜치 단위로 검증해야 하는 경우 
- 동시 활성 브랜치 수가 상대적으로 적은 경우
- 팀에서 K8s 기반 provisioning/teardown 자동화 구축, 운영이 가능한 경우

### 5-2) 한계

##### Dag Bundle(FeatureBranchGitDagBundle)
- Connection/Variable/Pool 은 하나의 메타데이터 DB를 공유하기 때문에, 브랜치별로 다르게 테스트할 수 없다.
- Scheduler 자체의 부하는 브랜치 모두 공유 될 수 있다.
- Provider 패키지 버전이나 airflow.cfg 등의 변경처럼 인프라 격리는 불가능 하다.

##### Ephemeral Airflow Environment
- 부팅 시간이 병목이 될 수 있다. PR을 열때마다 수 분을 기다려야 한다.
- 비용이 선형으로 증가 될 수 있다. 활성 브랜치가 20개면 이론상 Airflow 풀스택 20세트가 동시에 떠 있을 수 있으므로, pod 단위 리소스 제한, 유휴 인스턴스 자동 종료, 동시 인스턴스 수 상한 같은 비용 통제 장치가 필수적이다.

- - - 
## 6. 정리 
### 6-1) 현재 구조의 문제점 

##### 코드 안에 배포 인프라 로직 존재 

격리를 Airflow가 아니라 우리가 파일 시스템 레이어(store/symlink)에서 직접 구현하다 보니, sys.path.append 와 같은 보일러플레이트가 들어가야 하고, 디렉토리 depth가 바뀌면 이 계산 로직도 전부 다시 변경이 필요하다.

##### 스토리지가 브랜치 수만큼 그대로 중복

dev 환경은 브랜치마다 레포 전체를 clone하는 방식이라, feature 브랜치가 늘어날수록 PVC 사용량이 선형으로 증가한다.

##### 파싱 범위 통제를 .airflowignore 수동 관리에 의존

브랜치가 쌓일 수록 Dag Processor가 스캔해야 할 대상도 늘어나고, 브랜치 정리(오래된 store 삭제 등)도 별도 배치 작업으로 챙겨야 한다.   

##### Airflow 배포 파이프라인 유지보수

git clone -> store 에 배치 -> 준비 완료 후 synlink 원자적 교체 라는 무중단 배포 로직 전체가 self-hosted 러너 스크립트 안에 커스텀으로 구현되어 있어야 한다.   
Airflow 코어가 보장해주는 부분이 아니라서, 이 스크립트의 버그는 곧 배포 시스템의 버그가 된다. 

##### Dag Versioning 의 효과가 반감

Airflow 3 의 Dag Versioning 자체는 Bundle 종류와 무관하게 동작하지만, 지금 구조는 사실상 LocalDagBundle과 동일하게 취급된다.

> LocalDagBundle은 버전관리를 지원하지 않기 때문에, UI에 버전 이력은 쌓여도 그 버전의 코드로 재실행이 보장되지 않는다.   

### 6-2) Dag Bundle 적용시 이점

##### sys.path.append 보일러플레이트 제거 가능

Bundle 하나가 곧 하나의 격리된 네임스페이스이므로, 브랜치 루트 경로를 Dag 파일이 직접 계산할 필요가 없다. modules_management 문서가 권장하는 PYTHONPATH 루트 아래 고유 top-level 패키지 패턴을 Bundle 단위로 자연스럽게 따르게 된다.

##### GitDagBundle 기반을 사용하게 되면, 버전 관리가 보장

commit SHA 기반으로 Dag Run에 버전이 pin 되므로, 배포 중에도 진행 중인 Run 은 시작 시점 커밋으로 일관되게 실행 가능하다.

##### 파싱/스토리지 관리가 Bundle 생명주기에 통합

불필요해진 feature 브랜치의 Bundle을 내리면, 그 즉시 파싱 대상에서도 빠지고 별도 PVC 정리 스크립트 없이도 관리 단위가 명확해진다. base 브랜치 대비 변경분만 복사하므로 스토리지 중복도 사라진다.

##### 무중단 배포 로직을 우리가 유지보수하지 않아도 됨 

GitDagBundle은 내부적으로 저장소를 한 번 bare clone해두고 버전별로 그 로컬 캐시에서 clone하는 방식으로 동작한다. 기존에 store/symlink로 직접 구현했던 새 코드 준비 후 원자적 교체의 목적을, Bundle 추상화가 Airflow 코어 레벨에서 담당하게 된다.

##### 네임스페이스 격리

Bundle 단위로 네임스페이스가 분리되므로, common_utils 와 같은 공통 모듈의 이름 충돌 위험이 구조적으로 제거 될 수 있다.

최종적으로 Airflow 3 로의 전환은 단순한 버전 업그레이드가 아니라, 그 동안 우리 배포 파이프라인 파일 시스템 레이어에서 직접 떠안고 있던 격리, 버전, 무중단 배포 책임을 Airflow 코어의 Dag Bundle 추상화로 넘기는 아키텍처 전환이다.   

- prod 는 기본 GitDagBundle 하나로 단순화하고, 
- dev 는 FeatureBranchGitDagBundle 하나로 모든 feature 브랜치를 동적으로 관리한다.

- - -
Reference 

<https://github.com/apache/airflow/discussions/54669>
<https://airflow.apache.org/docs/apache-airflow/3.2.2/administration-and-deployment/dag-bundles.html>
<https://airflow.apache.org/docs/apache-airflow/3.2.2/administration-and-deployment/cluster-policies.html>
<https://airflow.apache.org/docs/apache-airflow/3.2.2/administration-and-deployment/modules_management.html>   
. 
{% highlight ruby linenos %}
{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

