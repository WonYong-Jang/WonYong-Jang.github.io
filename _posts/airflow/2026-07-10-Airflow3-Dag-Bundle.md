---
layout: post
title: "[Airflow] Understanding Airflow 3 DAG Bundles: Architecture, Internals, and Feature Branch Management"
subtitle: GitDagBundle / Bundle Bug Fix(airflow 기여) / BaseDagBundle을 상속한 커스텀 Bundle
comments: true
categories: Airflow
date: 2026-07-10
background: /img/posts/mac.png
---
현재 업무에서 문제가 되는 [Airflow 배포 구조](https://wonyong-jang.github.io/airflow/2026/07/06/Airflow3-Rebuild-Deployment-Structure.html)를 개선하기 위해 Airflow 3 에서 부터 제공하는 Dag Bundle 도입을 검토하고 있다.   
이를 위해서 Dag Bundle에 대한 아키텍처를 자세히 살펴볼 예정이다.
  
## 1. Dag Bundle

`Airflow 3 부터는 Dag와 실행에 필요한 Python 모듈, 설정 파일 등의 관련 리소스를 하나의 단위로 관리하는 Dag Bundle 개념이 도입되었다.`

> 기존에 /opt/airflow/dags/ 경로에 관리하는 것은 LocalDagBundle 방식이다.   

### 1-1) 기본 제공 Bundle 종류

Dag Bundle 의 종류는 아래와 같다.

- LocalDagBundle: 기존처럼 dags/ 폴더에서 로딩하며 버전관리를 하지 않는다.
	- path를 명시하지 않으면 dags_folder(/opt/airflow/dags/) 설정 값을 그대로 사용
- GitDagBundle: Git 저장소에서 Dag 코드를 불러오며 버전 관리를 진행한다.

> 그 외에도 S3DagBundle, GCSDagBundle을 제공하며, BaseDagBundle을 상속한 커스텀 Bundle 도 지원한다. (버전 관리를 지원하는 기본 번들은 GitDagBundle 뿐이며, S3/GCS는 항상 최신 코드로 실행된다.)   


### 1-2) GitDagBundle

GitDagBundle은 Git 저장소를 Dag Bundle로 노출시켜주는 구현체로, airflow-providers-git 패키지에 포함되어 있다.    
`핵심 동작 원리는 매번 clone 하지 않고, bare repo 를 한번 clone 해두고, 버전별 워킹 디렉토리를 만드는 것이다.`     

아래와 같이 dag_bundle_config_list 옵션으로, Dag 파일을 어디서 어떻게 가져올지를 정의하는 번들 목록이다.   

`아래 refresh_interval 은 Bundle 이 원격에서 코드를 얼마나 자주 당겨올지에 대한 옵션이며, default 값은 dag processor의 refresh_interval(5분) 의 값을 사용하게 된다.`
`이 옵션을 변경한다면, dag processor의 refresh_interval 을 override 하게 된다.`   

```python
# airflow.cfg — prod 환경 예시
[dag_processor]
dag_bundle_config_list = [
  {
    "name": "prod",
    "classpath": "airflow.providers.git.bundles.git.GitDagBundle",
    "kwargs": {
      "tracking_ref": "master", # 추적할 브랜치/태그
      "git_conn_id": "my_git_conn", # 인증 연결
      "refresh_interval": 30 # 갱신 주기
    }
  }
]

# subdir: repo 안에서 Dag가 존재하는 폴더
# sparse_dirs: 필요한 폴더만 체크아웃해 디스크, 시간을 아낌
```

동작 흐름은 아래와 같다
1. initialize - 지정된 repo_url 또는 git_conn_id로 저장소를 bare repo로 한번 clone
2. refresh - refresh_interval 마다 bare repo를 git fetch로 최신 상태 동기화, GitSync 사이드카, 또는 self-hosted 러너가 하던일을 번들이 대신 함
3. get_current_version - tracking_ref(추적할 브랜치/태그/커밋)가 가리키는 현재 커밋 해시를 확인
4. 워킹 디렉토리 생성: 해당 커밋 해시를 이름으로 하는 디렉토리에 bare repo로 부터 실제 checkout 수행
5. Dag Processor/Worker는 이 checkout된 디렉토리에 실제 .py 파일을 읽어 파싱/실행

Dag Bundle 구조 덕분에 Airflow 는 Dag 실행 시 해당 시점의 Dag 코드 상태를 버전(v1, v2, ..) 으로 고정 할 수 있게 되었다.
버전 관리형 Bundle을 쓰면 Task Instance를 Clear 하고 재실행할 때 UI 에서 "최신 Bundle 버전으로 실행할지, 원래 Run이 사용했던 버전으로 실행할지"를 선택할 수도 있다. 

### 1-3) KPO + GitDagBundle 파일 부재 이슈

GitDagBundle 파일은 Airflow가 관리하며 번들을 초기화 하는 파드(dag-processor: 파싱, worker: 태스크 실행) 에 materialize 된다.   
`KPO(KubernetesPodOperator)는 별도의 사용자 파드를 띄우게 되는데, 그 파드에는 번들(git repo 내용)이 마운트되지 않는다.`      
따라서, KPO 파드의 command가 repo 안의 스크립트/파일을 참조하면 파일을 찾지 못하여 실패하게 된다.   

> 이건 Airflow 버그가 아니라 배포/아키텍처 문제이며, 워커가 아닌 외부 파드에 코드를 어떻게 전달할 것인가의 문제다.   

`첫번째 방안은 공유 PVC(RWX) 를 사용하여 모든 파드가 같은 볼륨을 마운트해 파일에 접근하는 것이다.`   

이 방법은 구조가 단순하고 각 파드마다 clone이 필요 없지만, RWX PVC 를 유지해야 하기 때문에, 여러 파드가 동시 접근에 대한 동시성 이슈 고려가 필요하다.   

`두번째 방안은 KPO 파드의 init-container에서 clone하는 방법이며, 파드마다 run 에 pin한 git sha 만 clone 하게 된다.`   

이 방법은 스토리지 경합에 대한 고려가 필요 없다는 장점이 있고, 각 파드마다 clone 해야 된다는 단점이 있지만 필요한 git sha 만 clone 하는 등으로 비용을 최소화 할 수 있다. 

> clone --depth 1 와 sparse-checkout 옵션으로 파드마다 clone 비용을 최소화 할 수 있다.



### 1-4) 왜 기본 GitDagBundle 만으로는 부족한가

prod 처럼 브랜치가 master 하나뿐이라면 위 설정으로 끝이다.    

현재 업무에서 dev 환경은 여러 개발자가 동시에 테스트 가능한 구조로 구성하기 위해서 feature 브랜치 별로 
격리된 환경을 구성하였다. 
지금처럼 feature 브랜치가 계속 생기고 없어지는 구조에는 기본 GitDagBundle을 그대로 쓰려면, 브랜치 하나마다 Bundle을 하나씩 등록해야 한다. 

> Bundle은 단일 저장소의 단일 ref, 전체 Dag만 가져온다.

```yaml
[dag_processor]
dag_bundle_config_list = [
  {"name": "dev-NP-11945", "classpath": "...GitDagBundle", "kwargs": {"tracking_ref": "NP-11945", ...}},
  {"name": "dev-NP-12068", "classpath": "...GitDagBundle", "kwargs": {"tracking_ref": "NP-12068", ...}}
]
```
dag_bundle_config_list 는 정적 설정이다.   
PR이 머지될 때마다 이 리스트를 갱신하려면 config 변경 + Dag Processor(경우에 따라 Scheduler/API Server) 재시작이 필요하다.   

> Helm 으로 배포한다면 사실상 매 PR 마다 Helm upgrade가 돌게 된다.

이 정적 설정의 불편함은 [커뮤니티](https://github.com/apache/airflow/discussions/59799)에서도 동일하게 지적되고 있고, 동적으로 반영하는 기능에 대해서 제안하고 있지만, 현재로서 업데이트 된 내용은 없다.    

현재는 [Airflow Discussion(#54669)](https://github.com/apache/airflow/discussions/54669) 에 FeatureBranchGitDagBundle 이라는 이름으로 직접 구현하여 해결한 사례를 확인했다.

- - - 

## 2. FeatureBranchGitDagBundle

`FeatureBranchGitDagBundle은 위 한계를 없애기 위해 BaseDagBundle을 상속한 단 하나의 커스텀 번들로 이 번들 하나가 모든 feature 브랜치를 동적으로 관리하게 된다.`    

기본 GitDagBundle ref(브랜치) 1개 = 번들 1개 였다면, FeatureBranchGitDagBundle은 번들 1개가 base 브랜치 대비 변경된 모든 feature 브랜치를 확인하여 동적으로 노출하는 방식이다.    

```yaml
{
  "name": "feature",
  "classpath": "feature_branch_bundle.git_bundle.FeatureBranchGitDagBundle",
  "kwargs": {
    "repo_url": "...",
    "base_branch": "main",       # 비교 기준 브랜치
    "branch_prefix": "feature-", # 이 접두사로 시작하는 브랜치 전부
    "subdir": "dags",
    "changed_only": true,        # main 대비 "변경된" DAG만 노출
    "refresh_interval": 120      # 120초(2분)마다 갱신
  }
}
```




- - - 

## 3. Airflow Dag Bundle 기여

PR: [https://github.com/apache/airflow/pull/71342](https://github.com/apache/airflow/pull/71342) 

### 3-1) Out of sort memory

##### 문제상황  

태스크 수가 많고, TaskGroup으로 구성된 규모가 큰 Dag의 Task들이 Web UI(Grid)에 나타나지 않는 현상이 발생했다.   
백엔드는 MySQL이고, api server 로그에는 다음 에러가 찍혔다. 

```
ERROR 1038: Out of sort memory, consider increasing server sort buffer size
```

특징을 정리하면 다음 조건이 모두 겹쳤을 때만 재현됐다.
- MySQL 백엔드 사용
- 직렬화된 Dag (serialized_dag 테이블의 data / data_compressed 컬럼 값)의 크기가 큰 경우

##### 원인 분석

Out of sort memory 는 MySQL 고유의 에러이다.    
`MySQL의 filesort는 연결당 고정 크기 정렬 버퍼(sort_buffer_size, 기본 256KB)를 사용하며, 정렬 키뿐 아니라 SELECT 한 컬럼 전체를 버퍼에 함께 적재한다.`   

`따라서 쿼리가 대용량 컬럼(data / data_compressed)을 SELECT 하면 그 값이 정렬 버퍼로 들어가고, 단일 행이 버퍼 크기를 넘으면 에러가 발생한다.`   

> serialized_dag 테이블은 직렬화된 Dag 전체를 한 컬럼에 통째로 저장한다.
> data 컬럼(JSON 타입)은 압축을 하지 않았을 때 본문이 들어가는 컬럼이고, data_compressed 컬럼(LargeBinary 타입)은 압축 (compress_serialized_dags=True)했을 때 본문이 들어가는 컬럼이다. 
> 이 둘은 상호배타적이라 한 행에는 둘 중 하나만 값이 있고 나머지는 Null이다.   

`filesort는 ORDER BY 순서를 인덱스로 만족시키지 못할 때 발생한다.`      
`이름과 달리 항상 디스크를 쓰는 것은 아니고, 먼저 정렬 버퍼(sort_buffer_size)안에서 정렬을 시도한 뒤 넘칠 때 디스크로 넘어간다. 이 문제는 그 버퍼가 단일 행(본문 컬럼 포함) 하나 조차 담지 못해 실패하는 경우다.`      
`정리하면, 정렬 버퍼에 대용량 본문 컬럼을 통째로 싣고 넘치면 실패하기 때문에 MySQL에서만 이 에러가 발생하며, PostgreSQL 에서는 같은 쿼리라도 에러가 발생하지 않는다.`   

> PostgreSQL은 정렬 시  대용량 값을  버퍼에 직접 싣지 않고 참조(포인트) 수준으로 다루기 때문에 이런 문제가 발생하지 않는다.  

##### 문제의 쿼리 

최신 직렬화 Dag 를 조회하는 SerializedDagModel의 조회 쿼리가 원인이었다.

```python
select(SerializedDagModel) # data / data_compressed 포함 전체 컬럼 로드
	.where(SerializedDagModel.dag_id == dag_id) 
	.order_by(SerializedDagModel.id.desc()) # ORDER By -> MySQL filesort 유발 가능
	.limit(1)
```

`select(SerializedDagModel)은 대용량 컬럼(data / data_compressed)까지 전부 가져오고, 이 쿼리가 filesort로 처리되면 그 본문이 정렬 버퍼에 적재되며, 256KB를 넘는 순간 Out of sort memory가 발생한다.`   

##### 재현 여부를 가르는 것: filesort 가 발생하는지   

중요한 것은 "본문이 크다"만으로는 에러가 나지 않는다는 점이다.   
`MySQL이 이 쿼리를 filesort로 처리할 때만 본문이 버퍼에 실린다.`  
`그리고 filesort를 쓸지 말지는 MySQL이 이 쿼리를 실행할 때 어떤 인덱스를 고르느냐에 따라 달려 있다.`        
인덱스는 두 가지 역할을 할 수 있다.
- WHERE 필터를 빠르게 처리 - 조건에 맞는 행으로 바로 점프
- ORDER BY 정렬을 공짜로 제공 - 인덱스 순서가 곧 ORDER BY 순서면 재정렬이 필요 없음

이 쿼리는 필터 컬럼(dag_id)와 정렬 컬럼(id)이 다르기 때문에, 어떤 인덱스가 있느냐에 따라 얻는 것과 잃는 것이 갈린다.   

- dag_id 의 secondary index가 없는 경우
	- MySQL은 PK(id) 인덱스를 역방향으로 스캔한다. 읽는 순서가 곧 id 내림차순이므로 ORDER BY id DESC가 그대로 만족된다.
	- `즉, 정렬이 불필요하고 filesort가 발생하지 않는다.`
	- EXPLAIN ... : key=PRIMARY, Extra=Backward index scan
- dag_id 의 secondary index가 존재하는 경우 / 예: (dag_id, created_at)
	- MySQL은 dag_id 의 필터가 더 효율적이다라고 판단해 이 인덱스를 고른다.
	- dag_id 매칭 행으로 바로 점프할 수 있어 필터는 빠르지만 이 인덱스는 dag_id -> created_at 순으로만 정렬돼 있고 id 순서 정보가 없다.
	- `따라서, ORDER BY id를 하기 위해서 filesort 를 발생시켜 정렬을 하게 된다.`   
. - EXPALIN ... :key=idx ... dag_id ... , Extra=Using filesort

##### GitDagBundle에서만 발생하는 걸까?  

`근본 원인은 번들 종류가 아니라, 정렬 키로 쓰지 않는 대용량 본문 컬럼을 함께 SELECT 해서 filesort에 태우는 쿼리 구조다.`   
GitDagBundle은 대형 Dag가 실행되며 버전이 쌓이는 환경을 자연스럽게 만들어 이 쿼리 경로에 먼저 노출시켰을 뿐, 버전 누적 자체가 에러의 원인은 아니다.   

##### 해결 방법

`핵심은 정렬 단계에서 대용량 본문 컬럼을 버퍼에 넣지 않는 것이다. 정렬에 가벼운 키(id)로만 수행해 최신 1건의 id를 확정하고, 그 뒤에 그 id로 PK 단건 조회를 한다.`       

```python
@classmethod
def latest_item_select_object(cls, dag_id):
	from airflow.settings import engine
	
	if engine.dialect.name == "mysql":
		latest_item_id = (
			select(cls.id) # SELECT엔 Id만 -> sort buffer 에 본문 없음
			.join(DagVersion, cls.dag_version_id == DagVersion.id)
			.where(cls.dag_id == dag_id)
			.order_by(DagVersion.version_number.desc())
			.limit(1)
		)
		return select(cls).where(cls.id == latest_item_id) # 확정된 1건만 PK로 조회 -> filesort 없음
		
	return( # 비-MySQL은 기존 쿼리 유지
		select(cls)
		.join(DagVersion, cls.dag_version_id == DagVersion.id)
		.where(cls.dag_id == dag_id)
		.order_by(DagVersion.version_number.desc())
		.limit(1)
	)
```

`처음 SELECT 는 본문 컬럼을 빼고 정렬 키만 다루므로 정렬 버퍼에 대용량 값이 들어가지 않는다.`      
`이후 SELECT 는 확정된 단일 id를 PK로 조회하므로 정렬(filesort) 자체가 없다.`
`이 방식은 인덱스 구성이나 옵티마이저의 실행계획 선택과 무관하게 항상 안전하다.`   

이 접근은 새로운게 아니라 동일 파일(SerializedDagModel.latest_item_select_object)에서 
[PR #55589](https://github.com/apache/airflow/pull/55589) 로 확립된 패턴이다.   

> 위 PR은 최신 serialized_dag를 읽는 공용 헬퍼(스케줄러, CLI, 백필 등) 을 수정하였지만, Grid view는 그 헬퍼를 쓰지 않고 별도의 자체 쿼리를 갖고 있어 동일한 문제가 남아 있었다.   


### 3-2) Non-Version Bundle에서 무의미한 Run with latest bundle version 체크박스

ISSUE: [https://github.com/apache/airflow/issues/70371](https://github.com/apache/airflow/issues/70371)   
PR: [https://github.com/apache/airflow/pull/70427](https://github.com/apache/airflow/pull/70427)

##### 문제상황

Airflow UI에서 과거 Dag Run 또는 Task Instance를 Clear 하면, 최신 Bundle 버전으로 실행할지, 원래 Run이 사용했던 버전으로 실행할지를 고르는 체크박스가 있는 다이얼로그가 뜬다.   

`그런데 이 체크박스가 번들의 버전 관리 지원 여부와 무관하게 항상 노출됐다.`   

문제는 LocalDagBundle 같은 Non-Version Bundle 에서도 이 체크박스가 보인다는 점이다.  
사용자가 옛 코드로 실행과 최신 코드로 실행을 고를 수 있다고 기대하지만, Non-Version Bundle에서는 고정된(pinned) 버전이 없어 체크박스를 체크하든 안하든 결과는 동일하다.

##### 원인 분석 

`버전 고정은 dag_run.bundle_version 값으로 이뤄지는데, LocalDagBundle은 버전 관리를 하지 않으므로 이 값이 항상 None이다.`    

> 현재 버전 관리를 지원하는 기본 번들은 GitDagBundle 뿐이며, LocalDagBundle, S3, GCS는 실행시 항상 최신 코드를 사용한다.   

bundle_version이 None이면 실행 시점에 해석되는 serialized Dag는 체크박스 상태와 관계없이 언제나 최신이다.   
즉 Non-Version Bundle에서 이 체크박스는 아무 동작도 바꾸지 못하는 옵션이며, 존재 자체가 사용자에게 오해를 준다.   

`LocalDagBundle에서 체크박스가 켜졌던 이유는, 기존 노출 조건이 Dag 버전 번호만 비교했기 때문이다.`

```python
# Before: Dag 버전 번호만 비교
dagVersionsDiffer || shouldShowForBundleVersion,
```

여기서 헷갈리기 쉬운게 Dag Version과 Bundle Version은 서로 다른 개념이라는 점이다.   

- Dag Version: `직렬화된 Dag 내용이 바뀔 때마다 증가하며, 번들 종류와 무관하게 누적된다.` 즉, LocalDagBundle이라도 실행된 뒤 Dag 내용이 바뀌면 새 DagVersion이 쌓여 latestDagVersionNumber와 과거 Run의 selectedDagVersionNumber가 서로 달라질 수 있다.
- Bundle Version: 어느 코드 스냅샷에 고정됐는가를 나타내며, `GitDagBundle만 git sha로 채우고 LocalDagBundle은 항상 None이다.`

`기존 로직은 번들 버전이 고정되어 있는가가 아니라 Dag Version 번호가 다른가만 봤기 때문에 문제가 되었다.`    

##### 해결 방법

```python
# After: 번들의 버전 관리 여부까지 반영
(dagVersionsDiffer && hasBundleVersion(latestBundleVersion)) || shouldShowForBundleVersion
```

체크박스는 이제 아래 두 경우 중 하나라도 해당할 때만 노출된다.
- Dag 자체가 바뀐 경우 - 원래 Run이 쓰던 Dag 버전과 최신 Dag 버전이 다르면서 버전 관리를 하는 번들일 때
- 번들(git 커밋)이 바뀐 경우 - 원래 Run이 고정해 둔 커밋과 최신 커밋이 다를 때
	- Dag 내용이 똑같아도 커밋이 다르면 task가 불러오는 다른 코드가 바뀌었을 수도 있으므로 이 경우도 포함한다.

`결과적으로 GitDagBundle처럼 버전이 고정되는 번들에서는 체크박스가 그대로 보이고, LocalDagBundle 과 같이 Non-Version Bundle 에서는 숨겨지게 된다.`   

### 3-3) GitDagBundle 경로 부재 시 깨진 에러 메시지 수정

PR: [https://github.com/apache/airflow/pull/70622](https://github.com/apache/airflow/pull/70622)

##### 문제 상황

GitDagBundle이 bare repo 경로를 찾지 못했을 때 나오는 에러 메시지가 깨져서, 실제 경로 대신 튜플이 그대로 출력되었다.   
사용자는 의도한 에러메시지가 아닌 튜플 형태로 값을 전달 받게 된다.

##### 원인 분석

포맷 문자열과 값을 별도 인자로 넘겼는데, AirflowException은 이러한 처리를 하지 않는다.

```python
# Before: %s가 치환되지 않고 (문자열, 값) 튜플이 그대로 표시됨 
raise AirflowException("Repo path %s not found", self.repo_path)
```

##### 해결 방법

`f-string으로 경로를 메시지에 직접 삽입해 사람이 읽을 수 있는 형태로 고쳤다.`

```python
raise FileNotFoundError(f"Bare repo path {self.bare_repo_path} does not exist")
```

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

