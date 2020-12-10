---
layout: post
title: "[Git] GitHub API 사용하기"
subtitle: "GitHub API for Java "
comments: true
categories : Git
date: 2020-12-08
background: '/img/posts/mac.png'
---

## 과제 

- 깃헙 이슈 1번부터 18번까지 댓글을 순회하며 댓글을 남긴 사용자를 체크 할 것.   
- 참여율을 계산하세요. 총 18회에 중에 몇 %를 참여했는지 소숫점 두자리가지 보여줄 것.   
- Github 자바 라이브러리를 사용 할 것.    

- - - 

## Github API 사용하기 

[personal token 생성방법](https://docs.github.com/en/free-pro-team@latest/github/authenticating-to-github/creating-a-personal-access-token) 을 이용하여 
토큰을 생성하여 자바소스에서 사용 가능하다. 아래에와 같이 github에서 받은 토큰을 my_personal_token에 넣어 주면 인스턴스가 
생성된다.   

### 주요 클래스    

과제에 필요한 클래스를 정리해 보면 아래와 같다.   

##### GitHubBuilder   

withOAuthToken() 메소드에 GitHub에서 발급받은 personal token을 넘겨 Github 인스턴스를 
반환받을 수 있다.   

```java
GitHub github = new GitHubBuilder().withOAuthToken("my_personal_token").build();
```

##### GitHub   

getRepository() 메소드에 원하는 repository의 문자열을 이용하여 GHRepository 인스턴스를 반환받을 수 있다.   

```java
GHRepository repository = github.getRepository("WonYong-Jang/GitHub_API_Test").getSource();
```

##### GHRepository   

getIssue()메소드에 GHIssueState.ALL 과 같은 이슈의 상태값을 넘겨 해당 repository의 issue들을 필터링해서 인스턴스로 받을 수 있다.   

```java
List<GHIssue> list = repository.getIssues(GHIssueState.ALL);
```

##### GHIssue     

getComment() 메소드들을 호출해 해당 GHIssue 인스턴스의 comment들을 인스턴스로 반환받을 수 있다.     

##### GHIssueComment 

user.getUser() 메소드를 호출해 해당 GHIssueComment 인스턴스의 작성자 정보를 GHUser 인스턴스로 반환받을 수 있다.   

- - -  

### live-study 대시보드를 만드는 코드를 작성 

각 사용자 별로 issue에 comment를 작성 했는지 확인 하는 예제를 작성해보자.   

```java

/**
 깃헙 이슈 1번부터 18번까지 댓글을 순회하며 댓글을 남긴 사용자를 체크 할 것.
 참여율을 계산하세요. 총 18회에 중에 몇 %를 참여했는지 소숫점 두자리가지 보여줄 것.
 Github 자바 라이브러리를 사용하면 편리합니다.
 깃헙 API를 익명으로 호출하는데 제한이 있기 때문에 본인의 깃헙 프로젝트에 이슈를 만들고 테스트를 하시면 더 자주 테스트할 수 있습니다.
 */
public class Main {

    private static final int TOTAL_ISSUE = 2;

    public static void main(String[] args) throws IOException {

        GitHub github = new GitHubBuilder().withOAuthToken("my_personal_token").build();
        GHRepository repository = github.getRepository("WonYong-Jang/GitHub_API_Test");

        // Issue List
        List<GHIssue> list = repository.getIssues(GHIssueState.ALL);

        // 각 유저 별로 Issue에 comment가 있는지 확인
        HashMap<GHUser, Integer> map = new HashMap<>();

        for(int i=0; i< list.size(); i++) {

            // 각 Issue 에 대한 comments 확인
            List<GHIssueComment> comments = list.get(i).getComments();

            // 각 comment 확인
            for(GHIssueComment comment : comments) {

                GHUser user = comment.getUser();
                // 한 issue에 여러 comment를 한 경우 ( 중복 방지 )
                if(map.containsKey(user)) continue;
                map.put(user, map.getOrDefault(user, 0)+ 1);
            }
        }

        // 참여 횟수 구하기
        NumOfParticipation(map);

    }
    public static void NumOfParticipation(HashMap<GHUser, Integer> map) {

        for(Map.Entry<GHUser, Integer> cur : map.entrySet()) {

            //System.out.println(cur.getKey());
            double result = (double)(cur.getValue()*100) / TOTAL_ISSUE;
            System.out.println(String.format("%.2f", result));
        }

    }
}

```


- - -


- - - 

Refererence  

[https://github-api.kohsuke.org/](https://github-api.kohsuke.org/)   
[https://github.com/whiteship/live-study/issues/4](https://github.com/whiteship/live-study/issues/4)   


{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

