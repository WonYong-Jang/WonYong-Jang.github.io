---
layout: post
title: "[Airflow] Understanding Airflow 3 DAG Bundles: Architecture, Internals, and Feature Branch Management"
subtitle: LocalDagBundle, GitDagBundle / BaseDagBundle을 상속한 커스텀 Bundle / 여러 개발자가 동시에 테스트 할 수 있는 Airflow 환경 구성
comments: true
categories: Airflow
date: 2026-07-10
background: /img/posts/mac.png
---
현재 업무에서 문제가 되는 [Airflow 배포 구조](https://wonyong-jang.github.io/airflow/2026/07/06/Airflow3-Rebuild-Deployment-Structure.html)를 개선하기 위해 Airflow 3 에서 부터 제공하는 Dag Bundle 도입을 검토하고 있다.
이를 위해서 Dag Bundle에 대한 아키텍처를 자세히 살펴볼 예정이다.
  
## 1. Dag Bundle

`Airflow 3 부터는 Dag와 실행에 필요한 Python 모듈, 설정 파일 등의 관련 리소스를 하나의 단위로 관리하는 Dag Bundle 개념이 도입되었다.`

> /opt/airflow/dags/ 폴더에 관리하는 것은 LocalDagBundle 방식이다.   

### 1-1) 기본 제공 Bundle 종류

Dag Bundle 의 종류는 아래와 같다.

- LocalDagBundle: 기존처럼 dags/ 폴더에서 로딩하며 버전관리를 하지 않는다.
	- path를 명시하지 않으면 dags_folder(/opt/airflow/dags/) 설정 값을 그대로 사용
- GitDagBundle: Git 저장소에서 Dag 코드를 불러오며 버전 관리를 진행한다.

> 그 외에도 S3DagBundle, GCSDagBundle을 제공하며, BaseDagBundle을 상속한 커스텀 Bundle 도 지원한다. (버전 관리를 지원하는 기본 번들은 GitDagBundle 뿐이며, S3/GCS는 항상 최신 코드로 실행된다.)   

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
      "tracking_ref": "master",
      "git_conn_id": "my_git_conn",
      "refresh_interval": 30
    }
  }
]
```

동작 흐름은 아래와 같다
1. initialize - git_conn_id(GitHook)의 자격증명으로 저장소를 로컬 경로에 clone
2. refresh - 주기적으로 git fetch 후 tracking_ref를 최신으로 checkout, GitSync 사이드카, 또는 self-hosted 러너가 하던일을 번들이 대신 함
3. get_current_version - 현재 checkout 된 commit SHA를 버전으로 반환
4. 버전 pinning - Dag Run 이 생성될 때 그 시점의 번들 버전(commit)이 Run에 고정되고, 워커는 그 커밋을 체크아웃해 태스트를 실행한다. 즉, 배포 중에 코드가 바뀌어도 진행 중인 Run은 시작 시점 커밋으로 일관되게 실행되고, UI에서 그 버전으로 재실행이 가능

Dag Bundle 구조 덕분에 Airflow 는 Dag 실행 시 해당 시점의 Dag 코드 상태를 버전(v1, v2, ..) 으로 고정 할 수 있게 되었다.
버전 관리형 Bundle을 쓰면 Task Instance를 Clear 하고 재실행할 때 UI 에서 "최신 Bundle 버전으로 실행할지, 원래 Run이 사용했던 버전으로 실행할지"를 선택할 수도 있다. 

### 1-2) GitDagBundle



### 1-3) 


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

### 2-1) 동작 흐름 

`Bundle의 로직은 기동 시 1회 실행되는 initialize() 와 refresh_interval 마다 반복되는 refresh() 로 나뉜다.`   


> Bundle의 전체 흐름은 상대적으로 무거운 작업인 clone은 initialize에서 한번 발생하며, 그 이후 refresh()는 git fetch 와 bundle_folders rebuild 를 반복한다.   
> 머지/삭제된 브랜치는 다음 refresh에서 diff 대상에서 제외되어 Dag 목록에서 사라진다.

##### initialize()

`오버라이드할 경우 반드시 메서드 맨 끝에 super().initialize()를 호출해야 한다.(그래야 is_initialized 플래그가 셋팅되어 1회만 실행된다)`

- repo_url 검증 및 lock 획득
- base branch를 git clone 하며,기존 저장소가 존재한다면 기존 저장소를 연다.
- 디렉터리 준비 - repo_path 와 bundle_path(/opt/airflow/bundle_folders) 를 생성

##### refresh()

`refresh() 에서 네트워크 작업은 git fetch --all 하나뿐이고, 그 이후 나머지는 전부 로컬 파일시스템에서 번들 폴더(/opt/airflow/bundle_folders)를 다시 만드는 작업이다.`

> Bundle 파일을 최신으로 당겨오는 것이다.

- Bundle 폴더 초기화
- 원격 갱신(fetch 기반)
- feature- 브랜치 조회
- main 과 비교(diff)
- 변경된 Dag 폴더 찾기
- Bundle 폴더로 복사
- Dag_id 수정(AST 재작성)
- Airflow가 자동 로드 - Dag Processor가 bundle_folders 를 파싱해서 Dag 를 반영한다.

### 2-2) 동작 검증
- feature branch 에서 신규 Dag 생성시 
- 파드 로컬 에서 bundle 파일 관리
	- Airflow 3 의 Dag Bundle 자체가 공유 볼륨 탈출을 위해 나온 기능이다. 
	- Airflow 2 에서는 공유 PVC(git-sync 또는 러너로 채우는) 방식은 여러 파드가 같은 Dags를 마운트해야 해서 RWX 스토리지를 요구하고, 갱신, 파싱 경합이 발생할 수 있다.
	- Bundle은 각 컴포넌트가 자기 소스를 독립적으로 materialize하는 방식으로 이를 대체한다.
- common_utils 등 공통 모듈 import
- dags, scripts 파일 분리된 형태인 경우 versioning이 제공될 수 있는지


### 2-3) 원자적 교체

기존 방식은 새 커밋을 store/ 에 미리 clone 해두고 준비가 끝난 뒤 심볼릭 링크만 원자적으로 swap 하여 Dag 가 잠깐 사라지는 구간을 없앴다.  

현재 커스텀 번들은 아래와 같이 구성되어 있다.

```python
if self.bundle_path.exists():
    shutil.rmtree(self.bundle_path)
self.bundle_path.mkdir(parents=True, exist_ok=True)
```

### 2-4) Dag Processor 에서 Bundle 동작 과정 

Airflow 3 의 Dag Processor는 하나의 매니저 루프(DagFileProcessorManager)가 아래를 주기적으로 순환한다.

```python
[매니저 루프]
1. heartbeat()
2. if not bundle.is_initialized:
	   bundle.initialize()
3. check refresh_interval
	   # Yes -> bundle.refresh()
	   # No -> Print Log("Not time to refresh")
4. Scan bundle.path 
5. 파일마다 워커 fork -> 파싱 # 별도 프로세스에서 파싱 -> seralized_dag 저장
```

여기서 아래 두가지가 중요하다.

`initialize() 는 1회만 실행된다. BaseDagBundle은 is_initialized 플래그를 두고, 매니저는 if not bundle.is_initialized: 일 때만 initialize()를 부른다.`   

`refresh() 는 heartbeat과 같은 단일 루프에서 돈다. refresh()가 오래 블로킹하면 다음 회전의 heatbeat()가 그만큼 밀린다. DagProcessorJob의 생존 판정 임계값은 [dag_processor] health_check_threshold(기본 30초)이고, 마지막 heartbeat이 이보다 오래되면 liveness probe(airflow jobs check)가 No alive jobs found로 컨테이너를 죽인다.`   

[Airflow Discussion(#54669)](https://github.com/apache/airflow/discussions/54669) 에 공유 된 코드는 initialize() 내에서 refresh() 직접 호출하도록 되어 있고, super().initialize()를 빠뜨려 지속적으로 호출되면서 문제가 발생했다.


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

