---
layout: page
title: Resume
description: 
background: '/img/bg-index.jpg'
---

## 👨‍💻 Sr. Data Engineer      

8년차 Data Engineer 로서 Daily Events Count 2,000만건의 Spark Streaming, Batch Size 
1,000만건의 Spark Batch 와 Elastic Search를 이용한 서비스 등 여러 백엔드 개발 및 데이터 파이프라인을 
구축한 경험이 있습니다.     

데이터 볼륨이 증가했을 때 processing delay 및 분산처리 시스템에서의 동시성 이슈 등 
여러 incident를 경험하면서 스트리밍 성능 최적화를 진행하였고   
그 결과, 기존 대비 10배 이상의 성능 향상 경험을 가지고 있습니다.   

데이터 엔지니어로서 기술적인 역량 뿐만 아니라 협업이 프로젝트의 성패를 
좌우한다고 믿고 있습니다.   
저는 주어진 일에 문제가 발생하였을 때 문제를 공유하고, 
협업을 통해 문제를 해결하기 위해 끊임없이 노력하기 때문에 
새로운 일에 대해 두려움 없이 성공적으로 마무리할 수 있습니다.     

<br>   
- - - 
 
## 💪 Skills   

##### Backend

- Java, Kotlin, Scala, Python   
- Spring Boot/MVC 
- JPA, Querydsl   
- Junit4/5, Mockito, Spock, Kotest, ScalaTest        
- Gradle, Maven   

##### DevOps   

- DocumentDB(MongoDB), Aurora(Mysql)    
- Jenkins, CircleCI, Airflow, Airbyte   
- Elastic Cache (Redis), S3, EC2, Cloud Watch   
- Nginx, Tomcat   
- Spark Streaming/Batch, Structured Streaming     
- AWS Event Bridge, Kinesis, Kafka    
- Hive, Trino(Presto), Iceberg         
- Elastic Search, Kibana      
- Grafana, Graylog, Prometheus, nGrinder   
- Git/Github    

##### Frontend

- React, Redux
- Typescript, Javascript   

##### Collaboration   

- Jira / Wiki Confluence    
- Slack   

<br>   
- - - 

## 💼  Work Experience    

#### 라인플러스 Talk Message & OpenChat Data Engineering

> 2025.08 ~ 

[Spark History Server 자체 구축 및 MCP 기반 AI 분석 파이프라인 구성](https://wonyong-jang.github.io/spark/2026/01/20/Custom-Spark-History-Server.html)

- Kubernetes 기반 팀 전용 Spark History Server를 구축하여 전사 공용 서버 의존도 완화 및 이벤트 로그 보존 정책, 분석 플러그인 독립 운영   
- DataFlint 분석 플러그인을 적용하여 실행 흐름과 disk spill, data skew 등 성능 문제 시각화   
- Spark History Server MCP와 AI 클라이언트를 연동하여 실제 실행 정보와 메트릭 기반 분석 파이프라인 구성   
- Stage별 수동 Spark UI 탐색을 자연어 기반 분석으로 개선하여 병목 Stage 우선순위를 파악하고, 실행 메트릭에 근거한 적절한 해결 방안을 제안받을 수 있는 환경 제공  
	- AS-IS: approximately 20 min (Spark UI에서 Stage 별 수동 병목 탐색)
	- TO-BE: 5 min or less on average (MCP 기반 AI 분석 및 해결 방안 제안)   

   
#### 쿠팡 Data Intelligence Platform      

> 2021.02.01 ~ 2025.08.01

[Spark Batch 와 Apache Iceberg 테이블을 이용한 데이터 파이프라인]    

- 기존 hive 테이블을 iceberg 테이블로 전환    
    - hive 테이블은 데이터 업데이트가 어렵기 때문에 중간 테이블이 
    생겨 리드 타임 및 파이프라인 복잡성 증가       
    - iceberg 테이블로 전환하여 ACID 트랜잭션 제공 및 데이터 파이프라인 간소화      
    - 유연한 스키마 및 데이터 변경을 제공함으로서 비지니스에 빠르게 대응      
    - [<u>iceberg 1.4.0 버전 이슈</u>](https://wonyong-jang.github.io/data-engineering/2025/04/17/Iceberg-Manifest-SplitOffsets.html) 확인 및 분석     

- spark를 활용한 효율적인 join 전략     
- 엑셀을 이용한 메뉴얼 작업을 시스템 자동화하여 97% 리드타임 단축    
    - AS-IS: 8 hour (약 100만건 기준)     
    - TO-BE: 10 min      


[Daily Events Count 2,000만건의 Spark Structured Streaming]      

- 기존 Spark Streaming 데이터 파이프라인의 성능 및 구조 문제 분석   
    - [<u>Spark Streaming Incident Review</u>](https://wonyong-jang.github.io/spark/2023/07/09/Spark-Streaming-Processing-Delay.html)     
- 비효율적인 Shuffle 및 DB I/O 개선   
- 이벤트 데이터에 대한 동시성 이슈 및 데이터 순서 불일치 해결      
- 재처리 구조 개선       
- 데이터 정합성 메트릭 구성      
- [<u>RDD 기반 Spark Streaming을 DataFrame 기반 Structured Streaming 전환</u>](https://wonyong-jang.github.io/spark/2022/03/07/Spark-Streaming-To-Structured-Streaming.html)     
- 기존 대비 10배 이상 성능 향상     
    - Processed rows per second(AS-IS: 800 -> TO-BE: 10,000)
       
          
[Batch Size 1,000만건의 Spark Batch 와 Elastic Search, Airflow를 이용한 검색 서비스]       

- Daily로 1,000 만건 이상의 데이터를 여러 검색 패턴으로 검색이 가능하도록 Elastic Search 와 Spark Batch Job 을 통해 개발    
- Spark를 이용하여 하이브 테이블간 집계 결과를 ES 에 인덱싱(daily 1,000만건)      
- [<u>Wildcard 쿼리 대신 n-gram으로 검색 성능 개선</u>](https://wonyong-jang.github.io/elk/2024/12/29/ELK-Elastic-Search-Wildcard-N-Gram.html)   
- [<u>ES 템플릿을 이용하여 인덱스의 Alias, Lifecycle 관리</u>](https://wonyong-jang.github.io/elk/2021/03/27/ELK-Elastic-Search-Index-Template.html)         
- 웹 어플리케이션에서 모든 검색 패턴에 대해 0.5 s 이내에 검색을 제공   
    - [<u>검색 및 집계 데이터를 페이지네이션을 통해 제공</u>](https://wonyong-jang.github.io/elk/2022/11/29/ELK-Elastic-Search-Max-Result-Window.html)   
- nGrinder를 이용한 성능 테스트 

[고객 인입 데이터를 통한 고객 요청 분류 서비스]
- 기존 Rule base 기반 서비스를 ML 전환하기 위한 PoC 진행   
- 분류 알고리즘 중 Random forest 로 학습 및 api 를 통한 서빙  
- 상담 가능성이 높은 상품들을 상담사에게 제공 및 Call routing 서비스 적용   
- Threshold 조절을 통해 비지니스에 적합한 Precision 과 Recall 메트릭 확인   
    - Accuracy: (60% -> 92%)
    - Precision: (42% -> 79%)
    - Recall: (30% -> 62%)
          

[Build customer service data pipeline with Kafka, Spark streaming and DocumentDB]       

- 기존 batch 기반으로 API를 반복적으로 호출하는 방식에서 AWS event bridge를 사용하여 3rd party data pipeline 구축     
- Spark Streaming의 마이크로 배치(10초)를 통해 Data 수집 및 Kafka publishing 하여 타 도메인에서 사용할 수 있도록 제공     
- API 기반의 데이터 처리 방식 대비 약 60배의 퍼포먼스 개선  
    - As-Is : 250/sec   
    - To-Be : 15,000/sec     
- API error로 인해 발생하던 exception 100% 감소   
    - As-Is: 1000/day   
    - To-Be: 0/day   
- Airflow를 통해 3rd party domain의 장애 발생 및 Event bridge로 데이터 전달 누락, 이벤트 처리 실패에 대한 retry 프로세스 적용     
- Data 저장을 위한 AWS storage cost 절감     
    - As-Is : $12,264 /Month (AuroraDB r5.12xlarge)      
    - To-Be : $3,901 /Month (DocumentDB r5.4xlarge)     


<br>   
#### 삼성SDS회사 IT혁신사업부 Software Engineer    

> 2019.01 ~ 2021.01 (총 2년 1개월)    

- SW Certificate 강사 활동        
- Samsung SW certificate professional 취득     
- 자바, 스프링 기반의 Outsourcing Management System 개발 및 운영    
- 삼성 SDS 대학생 it 멘토링 발표   
    > [https://www.youtube.com/watch?v=WW8luDK_pCk](https://www.youtube.com/watch?v=WW8luDK_pCk)   

<br>   
#### 인포뱅크 회사 Expert System 개발팀 인턴  

> 2018.01 ~ 2018.02 (총 2개월)     

- 한의학 분야와 Drools를 이용한 전문가 시스템을 융합 및 웹서비스 제공    
- Nginx를 이용한 로드밸런싱 구조 구축 및 성능 벤치마킹   
- A Scalability Study with Nginx for Drools-Based Oriental Medical Expert System 논문 발행     
    > [https://github.com/WonYong-Jang/Medical-Expert-System](https://github.com/WonYong-Jang/Medical-Expert-System)   


<br>  

- - - 

## ✍🏻 Personal Experience    

#### 패스트 캠퍼스 강의     

- [<u>https://fastcampus.co.kr/dev_online_befinal</u>](https://fastcampus.co.kr/dev_online_befinal)   
- [<u>외부 API와 공공데이터를 이용한 약국 추천 서비스</u>](https://github.com/WonYong-Jang/Pharmacy-Recommendation)를 주제로 강의 진행     

<br>   

- - - 

## 🛠 Problem Solving Experience     

#### Spark streaming trouble shooting     

- [Spark에서 Not Serializable Exception 해결(Driver와 Executor간의 데이터 전송)](https://wonyong-jang.github.io/spark/2021/06/15/Spark-Serialization.html)      

- [AWS EMR에서 실행되는 Spark 라이브러리 버전 충돌 해결](https://wonyong-jang.github.io/spark/2021/07/08/Spark-override-dependency.html)       

- [Spark Streaming 에서 데이터 손실을 방지하기 위한 graceful shutdown 적용](https://wonyong-jang.github.io/spark/2021/04/19/Spark-Streaming-Graceful-Shutdown.html)             

- [Spark Streaming 처리 지연 장애 리뷰](https://wonyong-jang.github.io/spark/2023/07/09/Spark-Streaming-Processing-Delay.html)       


#### Airflow
- [<u>Airflow 3 DAG Bundle 버그 수정 및  오픈소스 기여</u>](https://wonyong-jang.github.io/airflow/2026/07/10/Airflow3-Dag-Bundle-Contributions.html)      

<br>   
- - -   

## 🏆  Prize      

#### 2018. 05 춘계학술발표대회 수상    

> 전자정보연구정보센터 한국정보처리학회 (제 2018-6-18 호)   

- Drools를 이용한 Nginx와 Ajax기반의 Medical Expert System 개발   


<br>   
- - -

## 🎓  Paper   

#### 2018. 12. 07 정보처리학회논문지   

- Drools 기반 한방전문가 시스템의 Nginx를 이용한 확장성 연구    

    > [https://github.com/WonYong-Jang/Medical-Expert-System/tree/master/journal](https://github.com/WonYong-Jang/Medical-Expert-System/tree/master/journal)    
    > [http://kiss.kstudy.com/thesis/thesis-view.asp?key=3652924](http://kiss.kstudy.com/thesis/thesis-view.asp?key=3652924)  

#### 2018. 05. 12 정보처리학회   

- Drools를 이용한 Nginx와 Ajax기반의 Medical Expert System 개발   

#### 2017. 11. 04 정보처리학회   

-  Drools 기반의 메디컬 Expert 시스템 아키텍처와 프로세스 연구    


#### 2017. 11. 04 정보처리학회   

-  메디컬 Expert 시스템을 위한 Drools와 JavaFX 기반의 사용자 인터페이스 설계 및 구현    
    > [https://github.com/WonYong-Jang/Medical-Expert-System](https://github.com/WonYong-Jang/Medical-Expert-System)   


<br>   
- - - 

## 🏫  Education  

- 2012.03 ~ 2019.02 국민대학교 소프트웨어공학과 졸업    


