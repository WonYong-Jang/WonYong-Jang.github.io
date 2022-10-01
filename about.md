---
layout: page
title: About Me
description: 
background: '/img/bg-index.jpg'
---


## 👨‍💻 Sr. Backend Engineer      

5년 차 백엔드 개발자로서 Java, Spring, Kotlin, Redis, Kafka, AWS 등을 
사용하여 확장성과 유지 보수성이 높은 서비스를 
설계, 개발, 운영한 경험이 있습니다.   

새로운 기술을 받아들이고 배우는 것을 좋아하여, Github와 블로그를 
통해서 배운 내용을 꾸준히 정리하면서 150여 개의 기술 포스트를 작성했습니다.      
그 결과 어떠한 환경에서도 빠르게 기술을 습득하여 적용할 수 있게 되었습니다.   

항상 일을 진행할 때 협업과 커뮤니케이션이 프로젝트의 성패를 
좌우한다고 믿고 있습니다.   
저는 주어진 일에 문제가 발생하였을 때 문제를 공유하고, 
협업을 통해 문제를 해결하기 위해 끊임없이 노력하기 때문에 
새로운 일에 대해 두려움 없이 성공적으로 마무리할 수 있습니다.     

<br>   
- - - 
 
## 💪 Skills   

##### Backend

- Java, Kotlin, Scala   
- Spring Boot/MVC 
- JPA, Hibernate 
- Junit4/5, Mockito, Spock   
- Gradle, Maven   

##### DevOps   

- DocumentDB(MongoDB), Mysql, Oracle   
- Jenkins, CircleCI, Airflow   
- Elastic Cache (Redis), S3, EC2, RDS(Aurora), Cloud Watch   
- Nginx, Tomcat   
- Spark, Kafka, Hive 
- ELK Stack   
- Grafana, Graylog   
- Git/Github, Gerrit      

##### Frontend

- React, Redux
- Typescript, Javascript   

##### Collaboration   

- Jira / Wiki Confluence    
- Slack   

<br>   
- - - 

## 💼  Work Experience    

#### 쿠팡 CS Intelligence Backend Engineer   

> 2021.02.01 ~ 현재   

- Bus Route Recommendation Service    
    - Fulfillment Center 지원자에게 버스가 제공되며, 지원자 거주지 기준으로 가까운 버스 추천   
    - 지원자의 거주지를 위, 경도로 변환 후 버스 정류장 위, 경도와 haversine formula 공식을 이용하여 가까운 거리 계산      
    - Redis를 활용하여 버스 정류장 데이터를 캐싱하여 성능 개선   
    - 상담사의 상담 준비시간(After Call Work)을 68.2% 개선    
        - As-Is : 59sec (상담사의 셔틀버스 노선 확인 시간)       
        - To-Be : 19sec      

- Build customer service data pipeline with Kafka, Spark streaming and DocumentDB       
    - 기존 batch 기반으로 API를 반복적으로 호출하는 방식에서 AWS event bridge를 사용하여 3rd party data pipeline 구축     
    - API 기반의 데이터 처리 방식 대비 약 60배의 퍼포먼스 개선  
        - As-Is : 250/sec   
        - To-Be : 15,000/sec      
    - Airflow를 통해 3rd party domain의 장애 발생 및 Event bridge로 데이터 전달 누락, 이벤트 처리 실패에 대한 retry 프로세스 적용     
    - Spark Streaming의 마이크로 배치(3초)를 통해 Data 수집 및 Kafka publishing 하여 타 도메인에서 사용할 수 있도록 제공     
    - Data 저장을 위한 AWS storage cost 절감     
        - As-Is : $12,264 / Month (AuroraDB r5.12xlarge)      
        - To-Be : $3,901 / Month (DocumentDB r5.4xlarge)     


<br>   
#### 삼성SDS회사 IT혁신사업부 Software Engineer    

> 2019.01 ~ 2021.01 (총 2년 1개월)    

- SW Certificate 강사 활동        
- Samsung SW certificate professional 취득     
- DRM(Digital Right Management) 서버를 이용한 사용자 로그인 인증 보안 설계 및 개발    
- 자바, 스프링 기반의 Outsourcing Management System 개발 및 운영    
- 삼성 SDS 대학생 it 멘토링 발표   
    > [https://www.youtube.com/watch?v=WW8luDK_pCk](https://www.youtube.com/watch?v=WW8luDK_pCk)   

<br>   
#### 인포뱅크 회사 Expert System 개발팀 인턴  

> 2018.01 ~ 2018.02 (총 2개월)     

- 사용 기술 : Java, Spring MVC, Mybatis, Tomcat, Nginx, Mysql, Drools   
- 한의학 분야와 전문가 시스템을 융합 및 웹서비스 제공 
- Nginx를 이용한 로드밸런싱 구조 구축 및 성능 벤치마킹   
    > [https://github.com/kookmin-sw/2018-cap1-4](https://github.com/kookmin-sw/2018-cap1-4)   


<br>  

- - - 

## ✍🏻 Personal Experience    

#### 패스트 캠퍼스 강의     

- [<u>https://fastcampus.co.kr/dev_online_befinal</u>](https://fastcampus.co.kr/dev_online_befinal)   
- [<u>외부 API와 공공데이터를 이용한 약국 추천 서비스</u>](https://github.com/WonYong-Jang/Pharmacy-Recommendation)를 
주제로 강의 진행     

<br>   

- - - 

## 🛠 Problem Solving Experience     

#### Spark streaming 시행착오   

- [Spark에서 Not Serializable Exception 해결(Driver와 Executor간의 데이터 전송)](https://wonyong-jang.github.io/spark/2021/06/15/Spark-Serialization.html)      

- [AWS EMR에서 실행되는 Spark 라이브러리 버전 충돌 해결](https://wonyong-jang.github.io/spark/2021/07/08/Spark-override-dependency.html)       

- [Spark Streaming graceful shutdown 적용](https://wonyong-jang.github.io/spark/2021/06/29/Spark-graceful-shutdown.html)          


<br>      
#### Apache Airflow execution date 해결        

- [<u>Airflow에서 execution date에 대한 오해와 한국시간에 대한 고려</u>](https://wonyong-jang.github.io/bigdata/2021/03/08/BigData-Apache-Airflow.html)    



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

- 2012.03 ~ 2018.06 국민대학교 소프트웨어공학과 졸업    


