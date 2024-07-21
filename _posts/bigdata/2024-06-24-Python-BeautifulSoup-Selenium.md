---
layout: post
title: "[Python] Python을 이용한 Crawling (BeautifulSoup, Selenium)"
subtitle: "웹 크롤링(Crawling), 웹 스크래핑(Scraping) / CSS Selector(태그 선택자, 클래스 선택자, ID 선택자)"
comments: true
categories : BigData
date: 2024-06-24
background: '/img/posts/mac.png'
---

이번 글에서는 python을 이용하여 Crawling을 실습해보자.    

- - -    

## 1. anaconda를 이용한 python 환경 셋팅     

먼저, python 환경 구성을 위해 anaconda를 설치해보자.   

```
// conda 설치하여 버전확인
$ conda --version


// 설치가 정상적으로 되었다면 커멘드에서 (base) 확인 가능
// 아래 명령어를 이용하여 생성된 가상 환경 list 확인
(base) ➜ conda env list
# conda environments:
#
base                  *  /Users/jang-won-yong/opt/anaconda3
orange3                  /Users/jang-won-yong/opt/anaconda3/envs/orange3


// conda 를 이용하여 새로운 가상 환경 생성 
// python 버전 지정 가능 
$ conda create --name study python=3.11


// 가상 환경 활성화 및 비활성화 
$ conda activate study
$ conda deactivate


// 새로운 가상 환경을 생성 및 활성화하여 ipykernel을 설치해준다.
$ pip install ipykernel
```

이제 base 환경에서 jupyterlab을 설치하여 확인해보자.   

```
// 설치
(base) ➜  ~ pip install jupyterlab

// 현재 위치에서 주피터 시작 
(base) ➜  ~ jupyter lab .
```   

아래와 같이 주피터 웹을 확인할 수 있다.   

> http://localhost:8888/lab   

<img width="1011" alt="스크린샷 2024-06-24 오후 11 42 42" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/95fe7117-4fe4-4961-a7df-96554876b88a">


이제 study 이름을 가진 환경을 주피터 웹에서 사용할 수 있도록 연동을 해보자.   

`ipykernel 을 이용하면 여러 다른 가상 환경을 쉽게 이동하면서 작업이 가능해진다.`   

```
(study) ➜   python -m ipykernel install --user --name study
```   

그 후 다시 주피터 웹을 확인해보면, 연동한 study 환경을 확인할 수 있다.   

<img width="687" alt="스크린샷 2024-06-24 오후 11 47 53" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/3f05dff9-1647-44c1-802f-24bfae3ade7b">  

마지막으로 아래 실습 라이브러리를 requirements.txt 파일로 생성 후 
pip install -r requirements.txt 명령어를 입력하여 설치한다.   

```
bs4==0.0.2
chromadb==0.4.24
financedatabase==2.2.2
langchain==0.1.16
langchain-openai==0.1.3
lark==1.1.9
lxml==5.2.1
matplotlib==3.8.4
numpy==1.26.4
pandas==2.2.2
python-dotenv==1.0.1
pytube==15.0.0
requests==2.31.0
seaborn==0.13.2
selenium==4.19.0
torch==2.2.2
torchaudio==2.2.2
torchvision==0.17.2
transformers==4.40.0
webdriver-manager==4.0.1
youtube-search==2.1.2
youtube-transcript-api==0.6.2
```

- - - 

## 2. 웹 크롤링과 스크래핑   

일반적으로 데이터 수집 방법에는 내부 데이터를 수집하는 방식과 
외부 데이터를 수집하는 방식으로 나뉠 수 있다.   

내부 데이터 수집은 데이터 베이스나 별도의 파이프라인을 구축하여 수집하는 
방식일 것이다.      

외부 데이터 수집은 파일 다운로드, 오픈 api 사용 또는 웹 크롤링(스크래핑) 방식이 
있을 수 있다.   

엄밀하게 따지면 웹 크롤링과 웹 스크래핑은 아래와 같이 구분할 수 있다.   

- 웹 크롤링: 웹 페이지를 탐색하며 데이터를 수집하는 행위     
- 웹 스크래핑: 웹 페이지에서 원하는 데이터를 추출하는 행위     

`웹 크롤링은 정적(static) 페이지와 동적(dynamic) 페이지를 
수집하는 방식으로 나눌 수 있다.`    

`먼저 정적(static) 페이지는 서버에 미리 저장된 파일(html, 이미지 등)을 
웹 브라우저에 표시하는 것이며 웹 페이지는 내용이 고정되어 변하지 않는다.`     
`이때는 주로 BeautifulSoup 라이브러리를 사용할 수 있다.`      

`동적(dynamic) 페이지는 서버에서 데이터를 가공하여 실시간으로 웹페이지를 생성하는 
방식이며 사용자의 요청, 시간, 상황에 따라 웹페이지 내용이 달라지게 된다.`   
`이때는 Selenium 라이브러리를 활용할 수 있다.`   

> 물론 정적 페이지에서 Selenium을 바로 적용해 볼 수도 있다.   

이제 직접 실습을 진행해 보자.   

- - -   

## 3. 정적 웹페이지 스크래핑    

가장 기본적인 코드는 아래와 같이 라이브러리를 import 하고  
입력한 url 서버에 요청을 하여 응답을 받는다.   

```python
# 라이브러리
import requests
from bs4 import BeautifulSoup

# request.get 함수로 서버에 응답 요청
url = "https://news.daum.net/"
response = requests.get(url)
print(response)
```

위 응답 받은 reponse에서 전달 받은 html 코드는 아래와 같이 
확인할 수 있다.

```python
response.text 
```

결과를 확인해보면 전체 문자열이기 때문에 여기서 필요한 데이터만 
추출하는 것이 쉽지 않다.   
`따라서 BeautifulSoup을 이용하여 html 구조로 파싱을 해준다.`   

```python
soup = BeautifulSoup(response.text, 'html.parser')
print(type(soup))

# print(soup.head)
# print(soup.body)
print(soup)
```

이제 BeautifulSoup에서 제공하는 여러 메서드를 이용하여 웹 페이지 요소를 
추출 할 수 있다.    

> find 메서드  

```python
# find : 가장 먼저 나타나는 태그를 찾는다.  
soup.find(name='ul')

# find_all : 모든 태그를 찾는다.
ul_data = soup.find_all(name='ul')
len(ul_data)

# class 속성이 list_newsissue 인 ul 태그를 모두 찾는다.
newsissue = soup.find_all(name='ul', attrs={'class':'list_newsissue'})
```

> select 메서드   

`select 메서드는 아래와 같이 CSS Selector(태그 선택자, 클래스 선택자, ID 선택자)를 사용하여 
데이터를 추출할 수 있다.`    

```python
# 태그 선택자를 이용   
ul_list = soup.select('ul')

# class 속성값이 list_newsissue인 경우
class_list = soup.select('.list_newsissue')

# id 속성자를 이용하여 찾기
id_list = soup.select('#kakaoServiceLogo')   

# class_list[0] 안에 들어 있는 li 태그들 (class 속성자를 이용)
li_list = soup.select('.list_newsissue > li') 
```

`select 함수를 사용할 때, 추출하고자 위치에서 html 자식관계가 어떻게 되어 있는지 
빠르게 확인하기 위해서는 아래 그림을 진행해서 확인할 수 있다.`          

<img width="500" alt="스크린샷 2024-06-25 오후 10 51 36" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/b27874bd-0460-42ec-a7b6-f3999211ac2e"> 

### 3-1) 판다스 DataFrame 사용하기   

[https://news.daum.net](https://news.daum.net) 에서 
뉴스 제목, 뉴스 카테고리, 언론사 이름, 뉴스 링크를 추출하여서 
판다스 DataFrame으로 생성해보자.  

<img width="1185" alt="스크린샷 2024-07-02 오후 10 04 07" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/6e80d8c7-7563-469d-8c36-30bcb8e5164f">

먼저 첫번째 기사만 가져와서 결과를 확인해보자.   

```python
li_list = soup.select('ul.list_newsissue > li')

# 첫번째 뉴스 제목 추출 
link_text = li_list[0].select('a.link_txt')[0].text

# strip(): 앞 뒤 공백 제거   
link_text.strip()

# 첫번째 뉴스 카테고리 추출 
text_category = li_list[0].select('span.txt_category')[0].text
text_category.strip()
```    

다음으로 언론사 이름을 가져와 보자.   

`언론사 이름을 가져왔을 때 값이 여러개가 반환되며, alt 속성값에 값이 있는 것만 가져와야 하기 때문에 
아래와 같이 작성해볼 수 있다.`        

```python
# list comprehension
[ t['alt'] for t in li_list[0].select('img.thumb_g') if t['alt'] != ""]
```

마지막으로 링크를 가져온다.   

```python
link = li_list[0].select('a.link_txt')[0]['href']
link
```

이제 최종적으로 첫번째 요소만이 아닌, 전체 관련 데이터를 추출하여 DataFrame으로 생성해보자.   

```python
data = {'title': [], 'agency': [], 'category': [], 'link': []}
# li_list[0].select('a.link_txt')[0].text
# text_category = li_list[0].select('span.txt_category')[0].text

for item in li_list:
    try:        
        data['title'].append(item.select('a.link_txt')[0].text.strip())
        data['agency'].append( [ t['alt'] for t in item.select('img.thumb_g') if t['alt'] != ""][0] )
        data['category'].append(item.select('span.txt_category')[0].text.strip())
        data['link'].append(item.select('a.link_txt')[0]['href'].strip())
    except:
        print("error item:" + item)
```

<img width="1400" alt="스크린샷 2024-07-02 오후 11 02 58" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/1cf29772-cd82-4a8c-8e39-a66a7a1b6140">

생성한 DataFrame을 아래와 같이 csv 파일로 저장할 수 있다.   

```python
# csv 파일로 저장
# index=False 인 경우 인덱스 번호 제외  
df.to_csv('news.csv', index=False)
```

- - - 

## 4. 동적 웹 페이지 스크래핑    

`Selenium 라이브러리를 이용할 수 있으며, Selenium 은 동적 웹페이지가 
실시간으로 변동하는 내용을 중간 단계에 저장이 가능하다.`   

웹 어플리케이션 테스트 도구로 개발되었으며 크롬 웹드라이버를 실행하여 
모든 동작을 직접 제어 가능하다.   

Selenium을 사용하기 위한 기본 코드는 아래와 같다.   

```python
#Selenium 드라이버 생성
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager

# Chrome 옵션 설정 
options = webdriver.ChromeOptions()
options.add_argument('--headless') # 화면 없이 실행 

# Driver 서비스 실행 
service = Service(ChromeDriverManager().install())

# 웹 드라이버 초기화 
driver = webdriver.Chrome(service=service, options=options)
```

<img width="800" alt="스크린샷 2024-06-30 오후 11 45 00" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/bab26026-9421-4b5e-a20b-74b8d977fa0d">   

`그 이후에는 Selenium이 제어하는 Chrome 창에 주소를 전달해서 
서버에 요청을 보내는 작업이다.`   


```python
# 뉴스 사이트
url = "https://news.daum.net/"

driver.get(url)
```

<img width="800" alt="스크린샷 2024-06-30 오후 11 42 25" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/37882a3d-2883-45cd-9d21-266baeda3612">     

해당 페이지의 소스코드는 아래와 같이 확인해볼 수 있다.   

<img width="1500" alt="스크린샷 2024-06-30 오후 11 53 58" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/d5d860fb-cca2-4c45-aea3-9dc8b7caa446">     

위에서 실습했던 것과 마찬가지로 Selenium을 이용하여 
문자열을 html로 파싱하고 원하는 데이터를 추출 할 수 있다.   

`Selenium을 이용하면 페이지를 이동을 하거나 로그인 하는 등의 
액션도 가능하기 때문에 동적으로 변하는 페이지에 대하여 데이터 추출이 가능해진다.`       

```python
# 페이지 소스 가져오기
from bs4 import BeautifulSoup
page_source = driver.page_source

soup = BeautifulSoup(page_source, 'html.parser')

# 태그 검색
print('title 태그 요소: ', soup.title)
print('title 태그 이름: ', soup.title.name)
print('title 태그 문자열: ', soup.title.text)
```   

### 4-1) 웹 요소 선택 도구 By 활용     

Selenium을 이용하여 아래와 같이 `경제 카테고리를 클릭하는 액션`을 구성해보자.   

<img width="800" alt="스크린샷 2024-07-15 오후 7 17 31" src="https://github.com/user-attachments/assets/ca777203-13fc-4c4b-af87-7acd931803ce">      


```python
from selenium.webdriver.common.by import By

# 경제 뉴스 클릭
economy = driver.find_element(By.CSS_SELECTOR, '#gnbContent > div > ul > li:nth-child(4) > a')
# click 액션  
economy.click()

# 페이지 로딩되는데 대기 시간 설정 (최대 5초)    
driver.implicitly_wait(5)
```   

### 4-3) implicitly wait, explicitly wait, time.sleep 

`implicitly wait 함수는 페이지의 로딩이 완료될 때까지 기다리는 함수이며, 
    파라미터는 최대 n 초 동안 대기하였다가 n 초 동안 페이지가 
    로딩 완료가 안되는 경우 에러를 발생시킨다.`   
`n 초 안에 페이지 로딩이 완료되면, 이후 남은 시간을 무시하고 다음 코드가 
실행이 된다.`   

- implicitly wait는 웹페이지 전체가 넘어올때까지 기다린다.     
- explicitly wait 는 웹페이지 일부분이 나타날때까지 기다리는 것이다.     

> 한번만 설정하면 driver를 사용하는 모든 코드에 적용된다.   

하지만, 어떤 사이트에 접속을 하면 전체 페이지의 일부분이 먼저 노출되거나 
나중에 노출되는 경우가 있다.   

> 블로그를 방문하였는데 블로그 내용이 먼저 보이고 몇초 후에 광고가 나타나는 경우를 예롤 들 수 있다.   

즉, implicitly wait를 충분히 설정하였더라도 웹페이지가 넘어오는 순간 다음 명령어가 실행되어 버릴 것이고 
웹페이지는 넘어왔으니 일부 자바스크립트의 내용이 렌더링 되기도 전에 그 다음 명령어가 
작동이 되어 버린다면 제대로 된 수집이 불가능해진 것이다.    

`이러한 경우 explicitly wait를 사용하여 어떤 조건이 성립했을 때까지 
기다릴 수 있다.`
`조건이 성립하지 않으면 timeout으로 설정된 시간만큼 최대한 기다린다.`   

```python
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions

# wait until someid is clickable
wait = WebDriverWait(driver, 10)
element = wait.until(expected_conditions.element_to_be_clickable((By.ID, 'someid')))
```

위와 같이 WebDrivrWait를 사용할 수 있다.   

```
WebDriverWait(driver, timeout, poll_frequence=0.5, ignored_exceptions=None)   

- driver: 사용할 webdriver 객체를 전달  
- timeout: 최대로 대기할 시간이며 단위는 초
- poll_frequency: 로딩이 완료될때까지 기다리는 동안 element를 일정 시간 마다 호출해보게 되는데, 이때 얼마만큼의 시간 간격으로 호출할 것인지를 결정한다. 기본값은 0.5초   
- ignored_exceptions: 일정간격마다 element를 호출하는 동안 발생하는 Exception 을 무시할 수 있으며, 기본값으로 NoSuchElementException만 무시   
```   

더 많은 옵션은 [링크](https://selenium-python.readthedocs.io/api.html#module-selenium.webdriver.support.expected_conditions)를 확인해보자.   

참고로 `time.sleep(2) 물리적으로 정해진 시간 동안 대기`하는 함수이다.   


이제 경제 카테고리로 이동하였고, 그 후 스크래핑 작업을 동일하게 하면 된다.   

```python
# 이제 page_source 는 경제 카테고리를 클릭하여 나온 html을 가져온다 
soup = BeautifulSoup(driver.page_source, 'html.parser')

# 실시간 경제 뉴스 검색 
news = soup.select('#timeline > ul > li')   

# 첫번째 요소만 선택 ( select_one )
news[0].select_one("a.link_txt").text.strip()
```

### 4-4) Pagination     

이제 아래와 같이 실시간 경제 뉴스에서 pagination 되어 있는 기사를 수집해보자.   

<img width="700" alt="스크린샷 2024-07-15 오후 7 32 55" src="https://github.com/user-attachments/assets/d407b6d8-f0fb-46fd-9756-d21d6916a31d">     

각 pagination 번호를 클릭하는 
액션을 구성하기 위해 아래와 같이 진행해보자.   

<img width="719" alt="스크린샷 2024-07-15 오후 7 40 35" src="https://github.com/user-attachments/assets/97b500b8-58a5-4130-8d46-581ae4cdfb9b">      

최종적으로 driver와 카테고리를 전달 해주면, 해당 카테고리의 실시간 기사를 
수집하는 함수는 아래와 같다.   

```python
# 페이지를 이동하면서 데이터를 수집하여 정리하는 함수
def get_news(driver, category):

    # 모든 category 찾기
    category_tabs = driver.find_elements(By.CSS_SELECTOR, '#gnbContent > div > ul > li')
    # category 별 dictionary 생성
    category_dict = {category.text:category for category in category_tabs}
    target_category = category_dict[category]
    
    target_category.click()
    
    # result
    data = {'title': [], 'agency': [], 'category': [], 'link': [], 'time_line': []}
    
    current_page = 1
    while current_page < 6:
        
        try:
            page_numbers = WebDriverWait(driver, 5).until(
                expected_conditions.presence_of_all_elements_located((By.CSS_SELECTOR, '#timeline > div > div > .num_paging'))
            )

            for p in page_numbers:
                if(p.text == '다음'): 
                    continue
                if(int(p.text) == current_page):
                    print(p.text)
                    p.click()
                    time.sleep(1)
                    
                    soup = BeautifulSoup(driver.page_source, 'html.parser')
                    news = soup.select('#timeline > ul > li')

                    for current_news in news:
                        data['title'].append(current_news.select_one('strong> a').text.strip())
                        data['agency'].append(current_news.select_one('strong> span.info_cp').text.strip())
                        data['category'].append(category)
                        data['link'].append(current_news.select_one('strong> a')['href'].strip())
                        data['time_line'].append(current_news.select_one('em.txt_time').text.strip())
                    break
                        
            current_page = current_page + 1
                        
        except Exception as e:
            print(f"Error navigating to the next page: {e}")
            break
            
    return pd.DataFrame(data)
```




- - -

<https://www.crummy.com/software/BeautifulSoup/bs4/doc/>    
<https://www.inflearn.com/course/lecture?courseSlug=llm-%EB%8D%B0%EC%9D%B4%ED%84%B0%EB%B6%84%EC%84%9D-%EC%9B%B9%ED%81%AC%EB%A1%A4%EB%A7%81-%EC%B6%94%EC%B2%9C%EC%8B%9C%EC%8A%A4%ED%85%9C&unitId=220385&tab=curriculum>    

{% highlight ruby linenos %}
{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}







