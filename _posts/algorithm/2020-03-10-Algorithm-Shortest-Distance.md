---
layout: post
title: "[Algorithm] 최단거리 알고리즘"
subtitle: "다익스트라, 벨만포드, 플로이드워샬 알고리즘"
comments: true
categories : Algorithm
date: 2020-03-10
background: '/img/posts/mac.png'
---

## 다익스트라

<p><b>그래프의 어떤 정점 하나를 시작으로 선택하고, 나머지 정점들로의 최단거리를 모두 구한다.</b></p>
<p>distance 배열을 모두 무한대로 초기화 ( 시작점은 0으로 시작! )</p>
<p>각 정점들 중 최단거리르 찾는 과정에서 우선순위 큐를 쓰지 않게 되면 모든 정점을 확인해야 하므로 시간복잡도는 O(N^2) </p>
<p><u>정점 개수가 V, 간선 개수가 E일 때 기본적인 최적화를 거치면 O(ElogV)의 시간복잡도 </u></p>
<p><u>우선순위 큐를 이용하여 cost 값이 제일 작은 정점을 찾아 방문</u></p>



```java
static int V, E, S;  // 정점의 갯수, 간선의 갯수,시작 점 
static ArrayList<ArrayList<Node>> adj = new ArrayList<ArrayList<Node>>(); // 인접 리스트
static final int MAX = 20001, INF = 300005 * 10;
static int[] dis = new int[MAX];

// 인접 리스트 정점 갯수만큼 할당 해주고 인접리스트 연결 할 것 
// dis 배열 모두 INF 로 초기화 해주고 시작점 0으로 놓고 시작 !
public static void solve()
{
	PriorityQueue<Node> que = new PriorityQueue<>(new Mysort());
	que.add(new Node(S,0)); // 시작점 
	dis[S] = 0;
	
	while(!que.isEmpty())
	{
		Node n = que.poll();
		
		if(n.cost > dis[n.dx]) continue;
		
		for(Node next : adj.get(n.dx)) // 연결된 다음 노드들을 보면서 최단경로 탐색 
		{
			// 현재 노드에서 다음 노드로 가는 가중치를 더한 값이 dis[next.dx] 보다 작으면 그 경로가 최단 경로가 되니 업데이트 
			if(dis[next.dx] > next.cost + dis[n.dx])  
			{
				dis[next.dx] = next.cost + dis[n.dx];
				que.add(new Node(next.dx, dis[next.dx]));
			}
		}
	}
}
```

<p><b>만약 음수사이클 있다면 사용하지 못함! </b></p>

- - -

## 벨만포드

`기본 아이디어는 그래프를 연결하고 있는 Edge를 기준으로 모든 정점으로 가는 최단거리를 찾는 것이다. 
다익스트라가 정점 중심으로 최단 경로를 찾았다면 벨만 포드 알고리즘은 Edge들을 중심으로 찾는다!`   

`정점의 갯수를 V라 할 때, 한 정점에서 모든 정점을 방문할 수 있으려면 적어도 V-1번 
방문해야 모든 정점을 방문할 수 있다. 따라서 모든 Edge들을 V-1번 보면서 각 정점의 최단 거리를 찾는다.`   


<p><u>V개의 정점과 E개의 간선을 가진 가중 그래프에서 특정 출발정점에서부터 
모든 정점까지의 최단 경로를 구하는 알고리즘</u></p>

<p><u>음의 가중치를 가지는 간선이 있어도 가능 !</u></p>
<p><u>음의 사이클의 존재 여부도 확인 가능 !</u></p>
<p><i>최단 거리를 구하기 위해서 V-1 번 E개의 모든 간선을 확인!!!</i></p>
<p>시간복잡도 O(VE) </p>

<p>최단거리 구하는 방식은 a정점에서 b정점으로 갈때, 거리가 짧아지는 경우가 생긴다면
계속 업데이트를 해주는 방식이다.</p>

<p><u>V-1번의 반복동안 각 정점에서 연결된 정점으로 가는 비용 수정(더 적은 비용이 있다면 변경)</u></p>
<p><b>V번째에도 변화가 있다면 음수사이클 존재!!</b></p>

<br/>
<img width="560" alt="스크린샷 2020-03-09 오후 9 05 14" src="https://user-images.githubusercontent.com/26623547/76211611-fe7d9880-6249-11ea-88f4-ac11f9250698.png">
<br/><br/>


<h3>1) leetcode 787. Cheapest Flights Within K Stops</h3>
<br/>

{% highlight ruby linenos %}

class Solution {

    public final int INF = 1<<30;
    public int[][] dis;
    public int findCheapestPrice(int n, int[][] flights, int src, int dst, int K) {

        dis = new int[K+2][n];
        for(int[] cur : dis) {
            Arrays.fill(cur, INF);
        }
        int ans = INF;
        dis[0][src] = 0;
        for(int i = 0; i <= K; i++) {
            for(int[] cur : flights) {
                if(dis[i][cur[0]] != INF && dis[i+1][cur[1]] > dis[i][cur[0]] + cur[2]) {
                    dis[i+1][cur[1]] = dis[i][cur[0]] + cur[2];

                    if(cur[1] == dst) ans = Math.min(ans, dis[i+1][cur[1]]); // 도착했다면
                }
            }
        }

        return ans != INF ? ans : -1;
    }
}

{% endhighlight %}

<h3>2) 백준 타임머신 </h3>
<br/>

{% highlight ruby linenos %}

public class Main {

    static final int INF = 10005*6000; // 무한대 값 설정
    static int N, M;
    static int[][] adj;
    static int[] dis;
    public static void main(String[] args) throws IOException {
        // TODO Auto-generated method stub
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        BufferedWriter bw = new BufferedWriter(new OutputStreamWriter(System.out));
        StringTokenizer st = new StringTokenizer(br.readLine());
        N = Integer.parseInt(st.nextToken());
        M = Integer.parseInt(st.nextToken());
        adj = new int[M+1][3];
        dis = new int[N+1];

        int dx = 0, dy=0, cost = 0;
        for(int i=1; i<= M; i++) {
            st = new StringTokenizer(br.readLine());
            dx = Integer.parseInt(st.nextToken());
            dy = Integer.parseInt(st.nextToken());
            cost = Integer.parseInt(st.nextToken());
            adj[i][0] = dx; adj[i][1] = dy; adj[i][2] = cost;
        }
        for(int i=1; i<= N; i++) dis[i] = INF;

        dis[1] = 0; // 시작점 0
        for(int i = 1; i <= N-1; i++) {
            for(int j=1; j<= M; j++) { // 더 작은 값으로 이동 가능 하면 변경
                if(dis[adj[j][0]] != INF && dis[adj[j][1]] > dis[adj[j][0]] + adj[j][2]) {
                    dis[adj[j][1]] = dis[adj[j][0]] + adj[j][2];
                }
            }
        }

        boolean flag = false; // 사이클 확인
        for(int j=1; j<= M; j++) {
            if(dis[adj[j][0]] != INF && dis[adj[j][1]] > dis[adj[j][0]] + adj[j][2]) {
                flag = true; break;
            }
        }
        if(flag) bw.write(-1+"\n");
        else {
            for(int i=2; i<= N; i++) {
                if(dis[i] == INF) bw.write(-1+"\n");
                else bw.write(dis[i]+"\n");
            }
        }
        bw.flush();
    }

}
{% endhighlight %}

- - -

## 플로이드 워샬

<br/>
<h3>백준 플로이드 </h3>

<p><u>V개의 정점과 E개의 간선을 가진 가중 그래프에서 모든 정점의 최단 경로를 구하는 알고리즘</u></p>
<p><u>시간복잡도 O(N^3) 이기 때문에 제한시간 1초 이내에 들어오려면 N=500 이내만 사용할 것!</u></p>

<p> 음수 가중치도 가능!</p>

<img width="652" alt="스크린샷 2020-03-10 오후 10 09 14" src="https://user-images.githubusercontent.com/26623547/76315321-d1011f80-631b-11ea-81b3-de5208132a5d.png">
<br/>

{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}
