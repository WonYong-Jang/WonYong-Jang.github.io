---
layout: post
title: "[AWS] JVM Cannot allocate memory 에러 "
subtitle: "리눅스 swap 메모리/ mkswap / dd"    
comments: true
categories : AWS
date: 2021-02-09
background: '/img/posts/mac.png'
---

## 문제    

```
OpenJDK 64-Bit Server VM warning: INFO: os::commit_memory(0x00000000caf50000, 715849728, 0) failed; error='Cannot allocate memory' (errno=12)
#
# There is insufficient memory for the Java Runtime Environment to continue.
# Native memory allocation (malloc) failed to allocate 715849728 bytes for committing reserved memory.
# An error report file with more information is saved as:
# /tmp/jvm-8091/hs_error.log
```

프리티어 ec2 인스턴스를 이용하다가 위와 같은 에러를 만났다.    
`원인은 시스템의 물리적 RAM 또는 swap 공간이 부족하여 설치하지 못한다는 에러였다.`    
`swap 공간을 통해서 메모리를 파티셔닝 함으로써 여유 공간을 확보 할 수 있다.`   

> 일반적으로 리눅스 서버를 운영하게 되면 swap 파티션을 기본적으로 사용하게 되지만 AWS 프리티어를 
사용하기 위해 ec2 t2.micro 이용해 리눅스로 서비스를 할 경우 만날 수 있는 에러이다.   

<img width="800" alt="스크린샷 2021-06-06 오후 6 05 36" src="https://user-images.githubusercontent.com/26623547/120918914-e0734200-c6f1-11eb-8c9a-9b147e4aaaee.png">   

- - - 

## swap 이란?    

swap에 대해 알아보기 전에, RAM과 하드디스크에 대해서 간단하게 정리를 해보자.   

하드디스크는 보조기억장치, RAM은 주기억장치이다.   

컴퓨터에 설치된 프로그램은 모두 하드디스크에 저장되어 있다. 이 프로그램을 실행하면 관련 데이터가 하드디스크에서
RAM으로 옮겨 지게 된다. 이후 프로그램을 관련된 데이터를 처리하는 일은 CPU의 역할이다. 

결국 RAM은 CPU가 처리해야하는 데이터가 임시적으로 저장된곳이다. 즉 실질적으로 프로그램을 
실행하면 CPU는 RAM에 들어있는 데이터를 읽어와서 처리한다. RAM에서는 하드디스크에 저장된 
데이터의 일부를 복사해서 저장하며 필요에 따라 CPU로 전달하는 역할을 수행한다.   

이후 RAM에 용량이 가득차게 되면 데이터손실이 일어나거나 여러 문제나 시스템에러가 생길 확률이 높다.   
이를 방지하기 위해서 swap 메모리 영역을 사용한다.   

`리눅스는 가상메모리라는 것을 지원한다. 결론 부터 말하자면 swap 메모리란, 하드디스크의 일부를 RAM처럼 
사용할 수 있게 만드는 기술이다.`    

물리적인 메모리 RAM은 CPU가 처리하는 데이터가 임시저장되는 공간이다. swap은 만약 프로그램 용량이 커서 
RAM에 수용할 수 있는 용량을 초과하는 경우를 대비해서 예비공간의 역할을 수행한다고 보면 된다.   

`즉, swap은 물리적인 메모리가 완전히 활용되었을 때 운영체제에서 사용하기 위한 가상 메모리 이다.`   

하지만 속도는 RAM에 비해 현저히 느리다. swap 메모리는 사용할 수 있는 메모리 영역을 확장하는데에 
도움을 주지만 데이터가 처리되는 속도는 RAM을 따라가진 못한다.   

- - - 

## 해결 방법   


#### 1. swap 공간 확인   


스왑 공간을 확인하기 위해서 아래 명령어로 확인해보자.   

```
$ free -h   
```

<img width="600" alt="스크린샷 2021-06-06 오후 5 50 17" src="https://user-images.githubusercontent.com/26623547/120919079-b79f7c80-c6f2-11eb-8905-9d7e9b0ce895.png">   

결과를 확인해보면 스왑 공간이 0B인 것을 확인 할 수 있다.   

대부분 리눅스 배포판은 스왑(SWAP) 파티션 설정을 권장한다고 한다. 파티션 하나에 전체 운영체제를 두고 
사용해온 윈도우 사용자에게는 낮설수도 있다.    


#### 2. swap 파일 생성  

`dd 명령을 사용하여 루트 파일 시스템에 swap 파일을 생성한다.`    

bs는 블록 크기이고 count 블록 수이다. swap 파일의 크기는 dd 명령의 블록 크기 옵션에 블록 수 옵션을 
곱한 값이다.   

지정한 블록 크기는 인스턴스에서 사용 가능한 메모리 보다 작아야 한다. 그렇지 않으면 
'memory exhausted' 오류가 발생한다.  

swap 파일을 생성하고 2G의 메모리를 할당해주었다.   

```
$ sudo touch /var/spool/swap/swapfile 
$ sudo dd if=/dev/zero of=/var/spool/swap/swapfile count=2048000 bs=1024
```

- if : 초기화할 때 사용하는 장치 파일명   
- of : 생성할 파일명   
- bs : 블록 크기 지정   
- count : bs에 설정한 블록의 개수    

#### 3. swap 파일에 대한 읽기 및 쓰기 권한을 업데이트 한다.   

```
$ sudo chmod 600 /swapfile
```

위와 같이 권한을 설정 해준다.    

```
$ sudo mkswap /var/spool/swap/swapfile
$ sudo swapon /var/spool/swap/swapfile
```

파일 포맷을 swap으로 변환하고 swap file로 등록해준다.   

#### 4. 파일시스템테이블에 등록   

`mkswap, swapon 명령을 통해 swap 영역을 활성화 시킨 뒤 재부팅하면 자동으로 비활성화상태가 되어 있다.`   

결국 부팅할 때마다 번번히 명령어를 입력해서 활성화시켜야 한다는 의미이다.   

부팅 시 swap 파일을 자동으로 활성화 시키는 방법은 /etc/fstab 파일을 수정하는 것이다.   
주석 아래와 같이 작성해주고 저장해준다.   

```
$ sudo vim /etc/fstab
```

> /swapfile swap swap defaults 0 0   

<img width="465" alt="스크린샷 2021-06-06 오후 6 16 29" src="https://user-images.githubusercontent.com/26623547/120919208-59bf6480-c6f3-11eb-92d4-14176e5671da.png">   

#### 5. swap 영역 확인   

```
$ free -h
```

다시 확인해보면 swap 영역이 생긴 것을 알 수 있다.   

<img width="600" alt="스크린샷 2021-06-06 오후 6 14 37" src="https://user-images.githubusercontent.com/26623547/120919149-1533c900-c6f3-11eb-98c6-dc08b86aeb71.png">   

swap이 정상적으로 잡혀있으면 아래 명령어로도 확인 가능하다.    

> swap이 잡혀있지 않으면 아무런 결과가 출력되지 않음   

```
$ swapon -s   
```


- - - 

## swap 공간 삭제 방법   

swap 파일은 한번 설정하면 굳이 삭제할 필요는 없지만, 추가로 삭제 방법을 기록해 본다.   

##### 1. swap을 비활성화 한다.   

```
$ swapoff -v /var/spool/swap/swapfile   
```

##### 2. swap 파일을 생성할 때 /etc/fstab에 추가한 내용을 삭제한다.   

##### 3. 생성했던 swapfile을 삭제하면 비활성화가 끝난다.    

```
$ rm /var/spool/swap/swapfile   
```

##### 4. free -h 명령어로 다시 확인하면 swap 공간이 비어 있는 것을 볼 수 있다.   

- - - 

**Reference**    

<https://coco-log.tistory.com/132>   
<https://velog.io/@adam2/JVM-Cannot-allocate-memory-%EC%97%90%EB%9F%AC>    
<https://gre-eny.tistory.com/177>   

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

