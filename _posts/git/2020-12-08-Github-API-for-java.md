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

시작하기 앞서 해당 API를 사용하려면 인증이 필요하다. 인증 방법은 총 4가지가 
존재하고 이에 맞게 자신의 정보가 필요하다.

- Username, Password   
- Personal access token   
- JWT Token   
- Gihub App installation token   

여기서는 personal access token 방식을 이용한다.   

[personal token 생성방법](https://docs.github.com/en/free-pro-team@latest/github/authenticating-to-github/creating-a-personal-access-token) 을 이용하여 
토큰을 생성하여 자바소스에서 사용 가능하다. 아래에와 같이 github에서 받은 토큰을 my_personal_token에 넣어 주면 인스턴스가 
생성된다.   

### 주요 클래스    

과제에 필요한 클래스를 정리해 보면 아래와 같다.   

##### GitHubBuilder   

withOAuthToken() 메소드에 GitHub에서 발급받은 personal token을 넘겨 Github 인스턴스를 
반환받을 수 있다.   
`여기서 주의할 점은 우리가 얻은 토큰은 개인 정보이며 이를 로컬에서만 관리하고 절때 퍼지지 않게 관리해야 한다.   `   

```java
GitHub github = new GitHubBuilder().withOAuthToken("my_personal_token").build();
```

해당 라이브러리에서 Property File과 Environmental variables를 사용할 수 있게 메소드를 제공하고 있다. 아래와 같이 
사용 가능하다.   

```java
String path = "src/main/resources/application.properties";
GitHub github = GitHubBuilder.fromPropertyFile(path).build();
```

```
// application.properties
oauth=토큰 정보 
```

##### GitHub   

getRepository() 메소드에 원하는 repository의 문자열을 이용하여 GHRepository 인스턴스를 반환받을 수 있다.   

```java
GHRepository repository = github.getRepository("WonYong-Jang/Github-API-Practice");
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

    private static final int TOTAL_ISSUE = 2; // 여기서는 2회까지만 순회

    public static void main(String[] args) throws IOException {

        // properties 파일로 token 관리
        String path = "src/main/resources/application.properties";
        GitHub github = GitHubBuilder.fromPropertyFile(path).build();

        // 해당 repository 가져오기
        GHRepository repository = github.getRepository("WonYong-Jang/Github-API-Practice");

        // 모든 issue 객체 가져오기
        List<GHIssue> issues = repository.getIssues(GHIssueState.ALL);

        // 사용자가 각 Issue 별로 몇번 comment를 입력했는지
        HashMap<GHUser, Boolean[]> map = new HashMap<>();

        for(int i=0; i< issues.size(); i++) {

            // 각 Issue 에 대한 comments 확인
            List<GHIssueComment> comments = issues.get(i).getComments();

            // 각 comment 확인
            for(GHIssueComment comment : comments) {

                GHUser user = comment.getUser();

                Boolean[] attendance = new Boolean[TOTAL_ISSUE];;
                if(map.containsKey(user)) {
                    attendance = map.get(user);
                }
                attendance[i] = true;
                map.put(user, attendance);

            }
        }

        // 참여 횟수 구하기
        NumOfParticipation(map);

    }
    public static void NumOfParticipation(HashMap<GHUser, Boolean[]> map) throws IOException {

        StringBuilder sb = new StringBuilder();
        sb.append("### 스터디 현황\n");
        sb.append("| 참여자 | 1주차 | 2주차 | 참석율\n");
        sb.append("| --- | --- | --- | --- | \n");

        for(Map.Entry<GHUser, Boolean[]> cur : map.entrySet()) {

            int sum = 0;
            Boolean[] attendance = cur.getValue();
            GHUser user = cur.getKey();
            sb.append("|"+user.getName()+"|");
            for(int i =0; i < attendance.length; i++) {
                if(attendance[i]) {
                    sum++;
                    sb.append(":white_check_mark:|");
                }
            }

            String percent = String.format("%.2f", (double)(sum*100) / TOTAL_ISSUE);
            sb.append( percent + "|");
            sb.append("\n");

        }

        System.out.println(sb.toString());
    }
}
```


- - -

### 결과   

<img width="464" alt="스크린샷 2020-12-13 오후 8 55 20" src="https://user-images.githubusercontent.com/26623547/102011130-aac64f80-3d85-11eb-8d71-633c8df38fa3.png">   

- - - 

Refererence  

[https://github-api.kohsuke.org/](https://github-api.kohsuke.org/)   
[https://github.com/whiteship/live-study/issues/4](https://github.com/whiteship/live-study/issues/4)   


{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

