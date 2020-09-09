---
layout: post
title: "[Java] 싱글톤 패턴"
subtitle: "JAVA Singleton Pattern"
comments: true
categories : Java
date: 2020-03-29
background: '/img/posts/mac.png'
---

<h2 class="section-heading">자바 싱글톤 패턴</h2>

<p><u>애플리케이션이 시작될 때 어떤 클래스가 한번만 메모리를 할당(Static) 하고
 그 메모리에 인스턴스를 만들어 사용하는 디자인 패턴</u></p>

<p>생성자가 여러 차례 호출되더라도 실제로 생성되는 객체는 하나고 최초 생성 이후에 
호출된 생성자는 최초에 생성한 객체를 반환한다.(자바에선 생성자를 private로 선언해서
 생성불가하게 하고 getInstance()로 받아쓰기도 함)</p>
<p>=> 즉, 인스턴스가 필요 할 때 인스턴스를 또 만드는게 아니라 동일(기존) 인스턴스를 사용하게 한다.</p>

<img width="391" alt="스크린샷 2020-03-29 오후 3 38 46" src="https://user-images.githubusercontent.com/26623547/77843027-ff17a800-71d3-11ea-8c08-74869747879f.png">

<p>위의 Main 클래스는 테스트를 하기위해 main메서드를 포함한 클래스이고, 
 Normal 클래스는 생성자만 존재하는 클래스이다. 마지막으로 Singleton 클래스는
 생성자와 getInstance() 라는 메서드를 포함한 클래스이다. 여기서 중요한 점은
 생성자가 private로 지정되어 있다는 점이다.</p>

<img width="750" alt="스크린샷 2020-03-29 오후 3 47 57" src="https://user-images.githubusercontent.com/26623547/77843119-d217c500-71d4-11ea-8cd0-1b873d58659a.png">
<p>위는 new 연산자로 인스턴스 만드는 것과 싱글톤 패턴을 이용하여 인스턴스를 만드는 것의 차이를 확인하기 위함</p>

<img width="750" alt="스크린샷 2020-03-29 오후 3 48 08" src="https://user-images.githubusercontent.com/26623547/77843120-d47a1f00-71d4-11ea-9572-467089327d3b.png">
<p>Singleton 클래스를 만들 때 눈여겨봐야 할 부분은 바로 생성자 부분이다.
대부분 생성자를 만들 때 public으로 선언하는데, 지금 싱글톤 패턴에서는 private으로 선언했는데,
private 으로 생성자를 만들어놓으면 new 연산자로 생성이 불가능하다!</p>

<p><u>Singleton이라는 클래스를 new 연산자로 생성하려고 할때 private 생성자가 못하게 
강제한다는점이 중요하다!</u></p>

<p><b>private static Singleton singleton = new Singleton();</b></p>

<p>new 연산자로 객체를 생성하지 못하는 클래스가 되어버린 Singleton 클래스는
위 부분에서 정적으로 싱글톤 클래스의 객체를 선언했다. private으로 생성된
생성자는 자기 자신에서는 호출이 가능하기 때문이다.</p>

<p><u>이렇게 생성해 놓은 시이글톤 클래스의 객체를 getInstance 메서드를 
반환하는데 결과적으로 Singleton 객체를 단 한번만 생성해 놓고 다른 클래스에서
반환을 요구할 때 항상 같은 객체를 반환시켜 줄수 있다!!</u></p>


<img width="750" alt="스크린샷 2020-03-29 오후 3 48 23" src="https://user-images.githubusercontent.com/26623547/77843122-d6dc7900-71d4-11ea-9128-f3380a0bb6c4.png">
<img width="750" alt="스크린샷 2020-03-29 오후 4 03 17" src="https://user-images.githubusercontent.com/26623547/77843322-e6f55800-71d6-11ea-8fd0-56e64fc9de11.png">
<img width="750" alt="스크린샷 2020-03-29 오후 4 05 31" src="https://user-images.githubusercontent.com/26623547/77843342-291e9980-71d7-11ea-904a-176f9dd4a5d0.png">
<br/><br/>
<h3>싱글톤 사용 이유</h3>
<p><b>고정된 메모리 영역을 사용하도록 하여 단 한번 new 연산자로 인스턴스를
얻어오기 때문에 메모리 낭비를 줄인다.</b></p>
<p><b>전역변수로 선언되고 전역메서드로 호출하기 때문에 다른 클래스에서 사용하기 쉽다.</b></p>
<p><b>공통된 객체를 사용해야하는 코딩에서 매번 객체를 생성하지 않고 같은 객체를
 사용하도록하면 성능면에서 뛰어나다!</b></p>

<h3>싱글톤 패턴의 문제점</h3>
<p>싱글톤 인스턴스가 너무 많은 일을 하거나 많은 데이터를 공유시킬 경우 다른
클래스의 인스턴스들 간에 결합도가 높아져 객체 지향 설계 원칙에 어긋날수 있다.</p>
<p>따라서 수정이 어려워지고 테스트하기 어려워진다.</p>
<p>멀티쓰레드환경에서 동기화처리를 안하면 인스턴스가 두개가 생성된다든지 하는
 경우가 발생할 수 있다.</p>

<h3>멀티쓰레드에서 안전한(Thread-safe) 싱글톤 클래스, 인스턴스 만드는 방법</h3>
<p>포스팅 준비중</p>

---

<p>Reference</p>
 <a href ="https://commin.tistory.com/121">https://commin.tistory.com/121</a><br/>
 <a href ="https://jeong-pro.tistory.com/86">https://jeong-pro.tistory.com/86</a><br/>
 <a href ="https://javaplant.tistory.com/21">https://javaplant.tistory.com/21</a>
<br/>

{% highlight ruby linenos %}


{% endhighlight %}

{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

