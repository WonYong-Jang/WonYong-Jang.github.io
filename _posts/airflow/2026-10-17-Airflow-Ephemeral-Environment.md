---
layout: post
title: "[Airflow] Ephemeral Airflow PoC 진행하기"
subtitle: Ephemeral Airflow / ArgoCD SCM provider
comments: true
categories: Airflow
date: 2026-10-17
background: /img/posts/mac.png
---
[이전글](https://wonyong-jang.github.io/airflow/2026/07/06/Airflow3-Rebuild-Deployment-Structure.html) 에서는 기존 Airflow 배포 방식의 문제점과 이를 개선하기 위한 방법들을 살펴봤다.   
이번에는 브랜치마다 독립된 테스트 화경을 제공하는 Ephemeral Airflow Environment를 설계하고 PoC를 진행해보려고 한다.   

전체적인 흐름은 다음과 같다. 

- 개발자가 feature 브랜치에서 Airflow 코드를 작성하고 원격 저장소에 push 한다.
- ApplicationSet controller가 Github에서 대상 저장소와 브랜치 목록을 주기적으로 조회한다.   
- 조건에 맞는 브랜치마다 Application을 생성하거나 갱신한다.   
- Argo CD가 각 Application 의 배포 명세를 기준으로 Helm chart에서 생성한 Kubernetes 리소스를 동기화한다.   
- 각 Airflow 환경은 자신의 feature 브랜치에 있는 Dag와 공유 코드를 가져온다.   
- 원격 브랜치가 삭제되면 해당 Application을 삭제하고, 관리하던 Airflow 리소스도 정리한다.   
이제 각각 검토해야할 항목들을 살펴보자.   

- - - 
## 1.  하나의 Kubernetes namespace 안에서 환경 구분하기

`현재 Airflow는 하나의 팀에서 사용하므로, 이번 PoC에서는 하나의 namespace 안에 브랜치별 Airflow 환경을 배포한다.`

이때 Helm의 releaseName에 브랜치를 식별할 수 있는 값을 사용한다.  

```
브랜치: feature-11945
releaseName: af-feature-11945
```

`chart가 release 이름을 리소스 이름과 label에 반영하면, 같은 namespace 안에서도 환경별 Deployment와 Service 등을 구분할 수 있다.`   

다만, release 이름만 다르게 지정한다고 모든 자원이 자동으로 분리되는 것은 아니기 때문에 다음 항목을 함께 확인해야 한다.   

- Deployment, Service 가 환경별 고유 이름과 올바른 selector를 사용하는지
- 메타데이터 DB에 대해 환경별 독립 database 와 접속 설정을 사용하는지
- Dag, 로그 저장소에 대해 환경별 볼륨 또는 경로로 구분되는지
- Secret, ServiceAccount 중 환경 전용 자원과 공유 자원이 구분되어 있는지 
- CeleryExecutor를 사용한다면 broker와 queue 설정 때문에 환경 간 Task가 섞이지 않는지


- - - 

## 2. Argo CD 

브랜치별 Airflow 환경을 자동으로 생성하기 전에, Argo CD에서 배포를 관리하는 Application과 
여러 Application을 자동으로 관리하는 ApplicationSet의 역할부터 살펴보자.

### 2-1) Application 과 ApplicationSet

Application은 하나의 어플리케이션을 어떤 소스로, 어디에, 어떤 설정으로 배포할지 정의하는 리소스다. Git 저장소와 사용할 버전, Helm chart 경로, 배포할 클러스터의 namespace 등을 지정한다.  
Argo CD는 이 명세를 기준으로 실제 Kubernetes 리소스를 동기화 한다.   

이번 PoC에서는 브랜치 하나에 Application 하나를 대응시킨다. 예를 들어 feature-11945의 Application은 해당 브랜치의 Scheduler, Dag Processor 등 Airflow 환경에 필요한 리소스를 함께 관리한다.   

브랜치가 늘어나면 Application도 추가해야 하고, 브랜치가 삭제되면 해당 Application도 정리해야 한다. `ApplicationSet은 여러 Application의 생성과 관리를 자동화하는 리소스다.`      

ApplicationSet의 핵심 구성은 generator와 template이다. generator는 Application을 만들 대상과 입력값을 구하고, template은 각 Application에 적용할 공통 배포 명세를 정의한다.   
이번에는 generator로 feature 브랜치 목록을 조회하고, 브랜치별 값을 template에 채워 Application을 생성한다.  

이때 ApplicationSet controller는 Application을 생성, 갱신, 삭제하고, Argo CD application-controller는 각 Application을 기준으로 실제 Airflow 리소스를 배포하고 동기화 한다.   

아래 여러 generator에 대해서 살펴보자.  

### 2-1) SCM Provider generator   

SCM Provider generator는 Github 같은 소스 코드 관리 서비스의 API를 사용하여 저장소를 발견한다.   
Github에서는 allBranches: true를 설정하여 각 저장소의 브랜치 목록도 조회할 수 있다.   

조회한 모든 저장소와 브랜치를 배포할 필요는 없다.
`repositoryMatch와 branchMatch 같은 필터를 사용하면 특정 저장소와 feature 브랜치만 Application 생성 대상으로 선택할 수 있다.`      

예를 들어 feature-11945 브랜치가 발견되면 airflow-feature-11945 Application을 생성하도록 구성할 수 있다. 이후 브랜치가 삭제되어 조회 결과에서 사라지면 해당 Application을 삭제하는 
흐름으로 연결할 수 있다.   

`장점은 실제 브랜치 목록을 환경 관리의 기준으로 사용할 수 있다는 점이다.`   
`브랜치별 환경 설정 파일이나 생성 대상 목록을 별도로 등록하지 않아도 되므로, 브랜치의 생성, 삭제와 테스트 환경의 생명주기를 직접 연결하기에 적합하다.`      

`반면 Github API 접근을 위한 인증과 호출 제한을 고려해야 한다.`      
`또한 조건에 맞는 브랜치가 남아 있으면 환경도 계속 유지될 수 있으므로, 대상 브랜치를 제한하는 필터와 오래된 환경의 정리 정책이 필요하다.`     

Argo CD의 ApplicationSet 리소스 정의의 예시는 아래와 같다.   

{% raw %}
```yaml
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  # 여러 브랜치의 Application 을 관리할 ApplicationSet 이름
  name: af-ephemeral
  # ApplicationSet이 위치할 namespace
  namespace: argocd
spec:
  # Application 템플릿에서 브랜치명 등 generator가 전달한 값을 사용
  goTemplate: true
  # 템플릿에서 존재하지 않는 값을 참조하면 오류 발생
  goTemplateOptions: ["missingkey=error"]
  
  # 생성된 Application 삭제 시 관리하던 배포 리소스도 정리하도록 설정
  syncPolicy:
    preserveResourcesOnDeletion: false
  generators:
    - scmProvider:
        github:
          organization: my-unit
          api: https://git.company.com/api/v3
          
          # Github App 인증 정보가 저장된 Kubernetes secret 이름
          # App ID, Installation ID, Private Key 등이 준비되어 있어야 함
          appSecretName: creds-689911
          allBranches: true
        # generator가 제공할 Git 저장소 URL을 https 형식으로 지정
        cloneProtocol: https
        # 변경 사항을 다시 조회할 간격
        requeueAfterSeconds: 120
        filters:
          - repositoryMatch: '^my-project$'
            branchMatch: '^feature-[0-9]+$'
  # 브랜치마다 생성할 Application 의 공통 템플릿
  template:
    metadata:
      # 브랜치명을 리소스 이름에 사용할 수 있도록 정규화하여 사용
      # 예: feature-11945 -> dev-af-feature-11945
      name: 'dev-af-{{.branchNormalized}}'
      
      # Application 삭제 시 관리하던 Kubernetes 리소스도 연쇄 삭제
      finalizers:
        - resources-finalizer.argocd.argoproj.io
    spec:
    
      # 생성된 Application이 소속될 Argo CD AppProject 이름
      # Kubernetes namespace와는 다른 개념 
      # 해당 Project에 소스 저장소와 배포 대상이 허용되어 있어야 함
      project: dev
      source:
        
        repoURL: https://git.company.com/my-unit/my-project.git
        # generator가 조회한 브랜치의 커밋 SHA 를 사용
        # 해당 커밋에 있는 chart와 values를 기준으로 배포 정의를 생성
        # 추가 push를 발견하면 새로운 SHA로 갱신될 수 있음
        targetRevision: '{{.sha}}'
        
        # 저장소 루트 기준으로 helm chart가 위치한 디렉터리
        path: helm_charts/airflow
        helm:
          # helm chart 렌더링에 사용할 release 이름 
          # chart가 이 이름을 사용해 환경별 리소스 이름 등을 생성
          releaseName: 'af-{{.branchNormalized}}'
          
          # chart의 기본 values에 추가로 적용할 설정 파일
          valueFiles:
            - values/airflow-ephemeral.yaml
              
          # helm에 전달할 개별 설정값 
          parameters:
              # Airflow의 기본 URL로 사용할 값을 chart에 전달
              # Ingress와 DNS 까지 자동으로 생성되는 것은 아님
            - name: airflow.config.api.base_url
              value: 'https://af-{{.branchNormalized}}.k8s.com'
            - name: dagDeploy.branch
              value: '{{.branch}}'
      destination:
        # 배포 대상 Kubernetes 클러스터의 API 서버 주소
        server: https://airflow-ephemeral.kubernetes.default.svc
        
        # Airflow 리소스를 배포할 kubernetes namespace
        namespace: airflow-ephemeral
      # 생성된 각 Application의 배포 동기화 정책
      syncPolicy:
        # 원하는 배포 상태와 실제 클러스터 상태가 다르면 자동 동기화
        automated:
          # 렌더링 결과에서 더 이상 정의되지 않는 관리 리소스 자동 삭제
          prune: true
          # 관리 리소스를 수동 변경하여 배포 정의와 달라지면 다시 동기화
          selfHeal: true
```
{% endraw %}


. 2-2) Pull Request generator

`Pull Request generator는 지정한 저장소의 PR 정보를 API로 조회하고, 조건에 맞는 PR을 기준으로 Application을 생성하는 방식이다.`       

예를 들어 열려 있는 PR 중 preview 라벨이 붙은 PR만 테스트 환경을 제공하도록 설정할 수 있다.   
PR 이 닫히거나 라벨이 제거되어 조건을 충족하지 않으면 생성 대상에서 제외할 수 있다.   

`SCM Provider generator와의 차이는 환경의 생명주기를 브랜치가 아니라 PR의 상태와 조건에 연결한다는 점이다.`   
따라서 브랜치가 삭제되지 않았더라도 PR이 종료되면 환경을 정리하는 구성이 가능하다.   

`장점은 코드 리뷰 과정과 테스트 환경을 연결하기 쉽다는 것이다. 필요한 PR에만 라벨을 붙여 환경을 제공하면 불필요한 환경 생성을 줄일 수 있고, PR 번호를 환경 식별자로 사용하기도 쉽다.`      

`반면, PR을 만들기 전부터 테스트 환경이 필요한 개발 흐름에는 추가 절차가 생긴다는 단점이 있다.`

### 2-3) Git generator   

Git Generator는 지정한 Git 저장소의 특정 revision에서 디렉터리나 설정 파일을 읽고, 이를 기준으로 Application에 사용할 값을 생성하는 방식이다.   

Directory 방식은 지정한 경로 패턴에 해당하는 디렉터리를 기준으로 동작한다.   
File 방식은 지정한 YAML 또는 JSON 파일의 내용을 읽어 템플릿에 전달할 값을 구한다.   

예를 들어 배포 설정 저장소의 main 브랜치에 다음 파일을 등록할 수 있다.   

```yaml
environment: airflow-feature-11945
branch: feature-11945
```

Git generator가 이 파일을 읽고, 파일에 정의된 환경 이름과 브랜치를 ApplicationSet 템플릿에 전달하도록 구성하는 것이다.  

이 방식에서는 feature 브랜치를 생성하는 것만으로 환경이 만들어지지 않는다. 위 구성에서는 해당 브랜치를 위한 환경 설정 파일도 등록해야 한다.  

장점은 환경의 생성 여부와 설정을 Git에서 명시적으로 관리할 수 있다는 것이다. 설정 변경 이력을 확인하고 리뷰할 수 있으며, CI가 이미지 빌드를 완료한 뒤 환결 설정 파일을 등록하는 흐름으로 연결하기에도 적합하다.  

단점은 브랜치 목록과 환경 정의를 별도로 관리해야 한다. 사람이 파일을 작성하는 대신 CI로 자동화할 수도 있지만, 브랜치 생성, 삭제에 맞춰 파일을 추가, 삭제하는 과정이 필요하다.   
현재처럼 브랜치의 존재 여부에 따라 환경을 제공하려는 경우에는 추가 관리 단계가 생기기 때문에 이번 PoC 에서는 제외한다.  

### 2-4) List generator   

List generator는 ApplicationSet에 명시한 목록을 기준으로 템플릿에 전달할 값을 생성하는 방식이다.  

예를 들어 다음처럼 환경 이름과 브랜치를 직접 나열할 수 있다.   

```yaml
generators:
  - list:
      elements:
        - environment: airflow-feature-11945
          branch: feature-11945
        - environment: airflow-feature-12068
          branch: feature-12068
```

이 구성에서는 목록의 각 항목이 Application을 생성하기 위한 입력이 된다.  

장점은 구조가 단순하고 생성 대상을 명확하게 확인할 수 있다는 점이다. 정해진 소수의 환경을 관리하거나, ApplicationSet 템플릿과 환경 분리 설정을 먼저 검증할 때 사용하기 좋다.  

반면 위와 같은 정적 목록에서는 브랜치가 생성되거나 삭제되어도 목록이 자동으로 바뀌지 않는다. 목록을 직접 수정하거나 이를 갱신하는 자동화를 추가해야 한다. 따라서 동적으로 생성, 삭제되는 feature 브랜치를 그대로 따라가려는 이번 PoC에는 적절하지 않다.   



- - -
Reference 

<https://medium.com/go-city/ephemeral-environments-for-apache-airflow-1c39df75ea14>   
<https://tech.kakao.com/posts/829>   
. 
{% highlight ruby linenos %}
{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

