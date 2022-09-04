---
layout: post
title: "[Docker] 컨테이너 데이터 저장하는 방법들"
subtitle: "bind mount, volume, tmpfs mount"    
comments: true
categories : DevOps
date: 2022-01-07
background: '/img/posts/mac.png'
---

Docker 컨테이너에 쓰여진 데이터는 기본적으로 컨테이너가 삭제될 때 함께 사라지게 된다.     
Docker에서 돌아가는 많은 어플리케이션이 컨테이너의 생명 주기와 관계없이 
데이터를 영속적으로 저장해야 하며, 여러 개의 Docker 컨테이너가 
하나의 저장 공간을 공유해서 데이터를 읽거나 써야 한다.   

이렇게 Docker 컨테이너의 생명주기와 관계없이 데이터를 영속적으로 
저장할 수 있도록 Docker는 세가지 옵션을 제공한다.  

`첫번째는 볼륨(volume), 두번째는 바인드 마운트(bind mount), 세번째는 tmpfs mount 방법이 있다.`   

`위 방법들의 가장 큰 차이점은 데이터가 Docker Host내에서 어디에 존재하는지 이다.`        

<img width="531" alt="스크린샷 2022-09-04 오후 5 11 31" src="https://user-images.githubusercontent.com/26623547/188304168-ca329738-541f-4efa-a060-9c44b8321153.png">    

이 글에서는 Docker 컨테이너에 데이터를 저장하는데 사용되는 
방법에 대해서 살펴볼 예정이다.   

- - - 

## 1. volume   

먼저, 볼륨(volume)에 대해서 살펴보자.   

- `volume은 docker(Linux에서는 /var/lib/docker/volume/)가 관리하는 호스트 파일 시스템의  
일부에 Data가 저장된다.`    
- Non-Docker 프로세스들이 File System의 해당 부분을 수정해서는 안된다.   
- docker에서 데이터를 존속시킬 수 있는 Best한 방법이다.   




#### 1-1) 볼륨 생성 및 조회   

아래 명령어로 volume을 하나 생성해보자.   

```
$ docker volume create my-vol
```

그 다음 docker volume ls 커맨드로 막 생성한 볼륨을 확인할 수 있다.   

```
$ docker volume ls
DRIVER    VOLUME NAME
local     my-vol
```

docker volume inspect 커맨드를 통해 해당 볼륨을 좀 더 상세한 정보를 확인할 수 있다.   

```
$ docker volume inspect my-vol
[
    {
        "CreatedAt": "2022-09-04T07:39:23Z",
        "Driver": "local",
        "Labels": {},
        "Mountpoint": "/var/lib/docker/volumes/my-vol/_data",
        "Name": "my-vol",
        "Options": {},
        "Scope": "local"
    }
]
```

Mountpoint 항목을 보면 해당 볼륨이 컴퓨터의 어느 경로에 생성되었는지를 
알 수 있다.  

#### 1-2) 볼륨 삭제 및 청소    

docker volume rm 커맨드를 사용해 삭제가 가능하다.   

```
$ docker volume rm my-vo   
```

`단, 위와 같이 제거하려는 볼륨이 마운트되어 있는 컨테이너가 있을 때는 
해당 볼륨이 제거 되지 않는다.`   
`해당 볼륨이 마운트되어 있는 모든 컨테이너를 먼저 삭제하고, 
    볼륨을 삭제해야 한다.`    

또한, docker volume prune 커맨드를 이용하여 마운트 되어 있지 않는 모든 
볼륨을 한번에 제거 가능하다.   

```
$ docker volume prune    
```

- - - 

## 2. bind mount    

Docker 컨테이너에 데이터를 저장하기 위한 다른 방법으로 바인드 마운트라는 것도 
있다.   
`바인드 마운트를 사용하면 호스트 파일 시스템의 특정 경로를 컨테이너로 
바로 마운트할 수 있다.`    

`바인드 마운트를 사용하는 방법은 docker run 커맨드를 실행할 때, -v 옵션으로  
콜론(:) 앞 부분에 호스트의 경로를 지정해주고, 뒤 부분은 컨테이너의 
경로를 지정해준다.`    

즉, Docker Host 또는 Non-Docker 프로세서들이 언제든지 저장된 Data를 
수정할 수 있다.   


- - - 

## 3. tmpfs mount    

tmpfs mount는 호스트 파일 시스템의 메모리에만 데이터가 저장되며, 절대로 
호스트의 파일 시스템에는 저장되지 않는다.   

즉, 비영구적인 상태 정보나 민감 정보들 같이 컨테이너의 생명주기와 
맞춰서 데이터를 보존하고자 할 때 사용할 수 있다.   

> 예를 들어, Docker Cluster인 Swarm Service는 내부적으로 tmpfs mount를 사용하여 
Secret 정보를 Service의 컨테이너에 Mount하여 사용한다.    



- - - 

**Reference**    

<https://docs.docker.com/storage/volumes/>   
<https://medium.com/dtevangelist/docker-%EA%B8%B0%EB%B3%B8-5-8-volume%EC%9D%84-%ED%99%9C%EC%9A%A9%ED%95%9C-data-%EA%B4%80%EB%A6%AC-9a9ac1db978c>     
<https://www.daleseo.com/docker-volumes-bind-mounts/>   

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

