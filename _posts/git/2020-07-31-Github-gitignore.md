---
layout: post
title: "[Git] Gitignore 설정 후 적용이 안될 때"
subtitle: ".gitignore 적용 후 github 반영"
comments: true
categories : Git
date: 2020-07-31
background: '/img/posts/mac.png'
---

## gitignore 설정 후 적용 

```
$ git rm -r --cached .
$ git add .
$ git commit -m "fixed untracked files”
$ git push origin master
```

- 다음의 명령을 사용하면 곧바로 설정이 적용된다. 저장소에 이미 올라가 있는 
파일들도 삭제된다

- - - 
<p>Reference</p>

{% highlight ruby linenos %}


{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

