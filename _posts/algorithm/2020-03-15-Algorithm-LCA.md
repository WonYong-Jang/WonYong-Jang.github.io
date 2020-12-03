---
layout: post
title: "[Algorithm] LCA"
subtitle: "Lowest Common Ancestor 최소 공통 조상"
comments: true
categories : Algorithm
date: 2020-03-15
background: '/img/posts/mac.png'
---

## LCA 

<img width="600" alt="스크린샷 2020-03-15 오후 2 50 09" src="https://user-images.githubusercontent.com/26623547/76697031-58141600-66d5-11ea-9bfc-59f50578bc7f.png">



### 백준 LCA2

<img width="600" alt="스크린샷 2020-03-15 오후 3 56 50" src="https://user-images.githubusercontent.com/26623547/76697061-9a3d5780-66d5-11ea-8b53-98101b0b4ba9.png">




```java
public class Main {

    static final int max_level = 17; // 2^17 이 100,000 을 조금 넘으므로
    static int N, M;
    static Queue<Integer> que = new LinkedList<>();
    static int[] depth;
    static int[][] par;
    static ArrayList<Integer>[] adj;
    public static void main(String[] args) throws IOException {
        // TODO Auto-generated method stub
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        BufferedWriter bw = new BufferedWriter(new OutputStreamWriter(System.out));
        StringTokenizer st = new StringTokenizer(br.readLine());
        N = Integer.parseInt(st.nextToken());
        adj = new ArrayList[N+1];
        par = new int[N+1][max_level+1];
        depth = new int[N+1];
        for(int i=0; i<= N; i++) {
            adj[i] = new ArrayList<>();
            depth[i] = -1; // 주의 : 모두 -1로 초기화 해주기!
        } // 아래 소스 중 if(depth[dx] <= depth[par[dy][k]])
        // par[dy][k] 가 0이 나왔을때 dy 가 0으로 업데이트 되면 안되기 때문에 depth[0] = -1 반드시 해주기
        for(int i=1; i<= N-1; i++) {
            st = new StringTokenizer(br.readLine());
            int dx = Integer.parseInt(st.nextToken());
            int dy = Integer.parseInt(st.nextToken());
            adj[dx].add(dy);
            adj[dy].add(dx);
        }

        que.add(1); // 루트 부터 depth 와 각 노드별 조상 기록 하기
        depth[1] = 0;
        while(!que.isEmpty()) {
            int n = que.poll();

            for(int next : adj[n]) {
                if(depth[next] == -1) {
                    depth[next] = depth[n] + 1;
                    par[next][0] = n;
                    que.add(next);
                }
            }
        }

        for(int k = 1; k <= max_level; k++) { // 각 노드 별로 부모 기록 !
            for(int cur = 1; cur <= N; cur++) { // 2^0 , 2^1, 2^2 ..
                int tmp = par[cur][k-1];
                par[cur][k] = par[tmp][k-1];
            }
        }

        st = new StringTokenizer(br.readLine());
        M = Integer.parseInt(st.nextToken());
        for(int i=1; i <= M; i++) {
            st = new StringTokenizer(br.readLine());
            int dx = Integer.parseInt(st.nextToken());
            int dy = Integer.parseInt(st.nextToken());

            if(depth[dx] != depth[dy]) {

                if(depth[dx] > depth[dy]) { // dy 기준으로 depth 맞추기 위해서
                    int tmp = dx;
                    dx = dy;
                    dy = tmp;
                }
                // dy 를 올려서 depth 를 맞춰준다.
                for(int k = max_level; k >= 0; k--) {
                    if(depth[dx] <= depth[par[dy][k]]) {
                        dy = par[dy][k];
                    }
                }
            }

            int lca = dx;
            // dx dy 다르다면 현재 깊이가 같으니 
            // 깊이를 계속 올려 조상이 같아질 때 까지 반복 ! 
            if(dx != dy) {
                for(int k = max_level; k >= 0; k--) {
                    if(par[dx][k] != par[dy][k]) {
                        dx = par[dx][k];
                        dy = par[dy][k];
                    }
                    lca = par[dx][k];
                }
            }
            bw.write(lca+"\n");
        }
        bw.flush();
    }
}

```

### LCA2를 이용한 정점들간의 거리 

백준 1761 정점들간의 거리 

두 정점간의 최단거리를 매 쿼리마다 출력하는 문제이다. 우리가 기본적으로 
알고있는 그래프의 최단거리 알고리즘은 시간복잡도 때문에 사용할 수가 없다. 
하지만 우리는 이 그래프가 트리라는 것을 이용하여 매 쿼리를 O(logN)시간 마다 처리해 줄 수 있다.  




- - - 

Reference

[https://www.crocus.co.kr/660](https://www.crocus.co.kr/660)       

{% highlight ruby linenos %}

{% endhighlight %}

{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}
