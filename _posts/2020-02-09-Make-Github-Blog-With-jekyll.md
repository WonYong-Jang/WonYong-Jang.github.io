---
layout: post
title:  "Jekyll을 이용한 GitHub 블로그 만들기"
date:   2020-02-09 21:15:05 +0000
image: /assets/images/twoscreen.jpg
---

## GitHub 블로그 소개

GitHub 동작 과정을 먼저 살펴 보면 블로거 A는 본인의 컴퓨터 (Local)에서 블로그 글 발행을 위한 작업을 하게 된다.
작업 결과물을 git push를 하고 GitHub Pages는 commit이 들어오면 Jekyll로 블로그 업데이트를
진행한다. 마지막으로 블로그 방문자들이 웹주소를 통해서 블로그에 접속하면 GitHub Pages가 컨텐츠를 전송하게 된다. 

## Jekyll 에 대한 소개 

Jekyll 은 루비로 만든 정적 웹 사이트 생성기(static websites generator)이다.
지킬은 Template과 Contents를 등의 다양한 포맷의 텍스트 데이터를 읽어서 static websites를
생성해준다. 즉, markdown 파일을 사용하는 블로그 플랫폼이다. 
로컬 컴퓨터에서 웹호스팅을 할 경우에는 24시간 컴퓨터를 켜두어야하고 웹서비스가 에러가 없는지
등의 모니터링 해야하는 관리 작업이 필요하지만 Jekyll을 이용한 GitHub Pages를 이용하여 이를 호스팅하여 관리해준다.

정리하자면 GitHub Pages에서 과정은 markdown을 통해 포스팅할 글을 작성하고나면
jekyll이 설치된 로컬에서 html으로 변환하고 git push 가 이루어지면 GitHub Pages가 
이를 자동으로 인식하여 웹사이트를 업데이트 한다. 


