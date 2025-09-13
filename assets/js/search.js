class PostSearch {
  constructor() {
    this.posts = [];
    this.filteredPosts = [];
    this.currentPage = 0;
    this.postsPerPage = 10;
    this.searchInput = null;
    this.searchResults = null;
    this.pagination = null;
    this.currentCategory = null;
    this.originalPostContainer = null;
    this.isSearching = false;

    this.initializeSearch();
  }

  async loadPosts() {
    try {
      console.log('Loading posts from /search.json...');
      const response = await fetch('/search.json');

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      this.posts = await response.json();

      // 카테고리에 따른 필터링 적용
      this.filterByCategory();

      console.log('Posts loaded successfully:', this.posts.length);
      console.log('Filtered posts for current page:', this.filteredPosts.length);
      console.log('Current category:', this.currentCategory);

      // 검색 기능이 준비되었음을 표시
      this.showSearchReady();
    } catch (error) {
      console.error('Error loading posts:', error);
    }
  }

  async initializeSearch() {
    // 기존 포스트 컨테이너 저장
    this.saveOriginalContent();

    // 검색 입력 필드 생성
    this.createSearchInterface();

    // 포스트 데이터 로드
    await this.loadPosts();
  }

  saveOriginalContent() {
    // 기존 포스트들과 페이지네이션을 저장
    const existingArticles = document.querySelectorAll('article.post-preview');
    const existingHrs = document.querySelectorAll('article.post-preview + hr');
    const existingPagination = document.querySelector('.clearfix');

    this.originalContent = {
      articles: Array.from(existingArticles),
      hrs: Array.from(existingHrs),
      pagination: existingPagination
    };
  }

  showSearchReady() {
    // 검색 준비 완료 표시
    const searchInfo = document.getElementById('search-info');
    if (searchInfo) {
      searchInfo.style.display = 'block';
      const infoText = searchInfo.querySelector('small');

      let message = `Search ready! ${this.filteredPosts.length} posts available`;
      if (this.currentCategory) {
        message += ` in ${this.currentCategory} category`;
      }
      message += '.';

      infoText.textContent = message;
      infoText.className = 'text-info';

      // 3초 후 자동으로 숨기기
      setTimeout(() => {
        if (!this.isSearching) {
          searchInfo.style.display = 'none';
        }
      }, 3000);
    }
  }

  createSearchInterface() {
    // 검색바가 이미 존재하는지 확인
    if (document.getElementById('post-search-container')) {
      console.log('Search container already exists');
      return;
    }

    console.log('Creating search interface...');

    const searchContainer = document.createElement('div');
    searchContainer.id = 'post-search-container';
    searchContainer.className = 'post-search-container mb-4';

    searchContainer.innerHTML = `
      <div class="search-box">
        <input type="text"
               id="post-search-input"
               class="form-control search-input"
               placeholder="Search articles..."
               autocomplete="off">
        <div class="search-clear-btn" id="search-clear-btn" style="display: none;">
          <i class="fas fa-times"></i>
        </div>
      </div>
      <div class="search-info mt-2" id="search-info" style="display: none;">
        <small class="text-muted"></small>
      </div>
    `;

    // DOM이 준비될 때까지 기다리기 위해 setTimeout 사용
    setTimeout(() => {
      this.insertSearchBar(searchContainer);
    }, 100);
  }

  insertSearchBar(searchContainer) {
    console.log('Attempting to insert search bar...');

    // 여러 방법으로 컨테이너 찾기
    let targetContainer = null;

    // 방법 1: 첫 번째 article 요소 찾기
    const firstArticle = document.querySelector('article.post-preview');
    if (firstArticle && firstArticle.parentElement) {
      targetContainer = firstArticle.parentElement;
      console.log('Found target via first article');
    }

    // 방법 2: masthead가 아닌 container 찾기
    if (!targetContainer) {
      const containers = document.querySelectorAll('.container');
      for (let container of containers) {
        if (!container.closest('.masthead')) {
          const colContainer = container.querySelector('.col-lg-8, .col-md-10');
          if (colContainer) {
            targetContainer = colContainer;
            console.log('Found target via container method');
            break;
          }
        }
      }
    }

    // 방법 3: body에 직접 삽입 (마지막 수단)
    if (!targetContainer) {
      const mainContainer = document.querySelector('main') || document.body;
      targetContainer = mainContainer;
      console.log('Using body as fallback target');
    }

    if (targetContainer) {
      if (firstArticle) {
        // 첫 번째 article 앞에 삽입
        targetContainer.insertBefore(searchContainer, firstArticle);
      } else {
        // 컨테이너 맨 앞에 삽입
        targetContainer.insertBefore(searchContainer, targetContainer.firstChild);
      }

      console.log('Search bar successfully inserted');
      this.setupEventListeners(searchContainer);
    } else {
      console.error('Could not find target container for search bar');
    }
  }

  setupEventListeners(searchContainer) {
    // 이벤트 리스너 추가
    this.searchInput = document.getElementById('post-search-input');
    this.searchResults = document.createElement('div');
    this.searchResults.id = 'search-results';

    if (this.searchInput) {
      this.searchInput.addEventListener('input', this.debounce(this.handleSearch.bind(this), 300));

      // Clear 버튼 이벤트
      const clearBtn = document.getElementById('search-clear-btn');
      if (clearBtn) {
        clearBtn.addEventListener('click', this.clearSearch.bind(this));
      }

      console.log('Event listeners set up successfully');
    } else {
      console.error('Search input not found');
    }

    // 검색 결과 컨테이너 추가
    searchContainer.appendChild(this.searchResults);
  }

  handleSearch(event) {
    const query = event.target.value.trim().toLowerCase();
    const clearBtn = document.getElementById('search-clear-btn');
    const searchInfo = document.getElementById('search-info');

    console.log('Search query:', query);
    console.log('Total posts:', this.posts.length);

    if (query.length === 0) {
      clearBtn.style.display = 'none';
      searchInfo.style.display = 'none';
      this.resetToOriginalPosts();
      return;
    }

    this.isSearching = true;
    clearBtn.style.display = 'block';

    // 검색할 기본 포스트들 결정 (현재 페이지에 맞는 포스트들)
    let postsToSearch;
    const pageTitle = document.querySelector('h1')?.textContent?.trim();
    const isHomePage = window.location.pathname === '/' || window.location.pathname === '/index.html';
    const isPostsPage = window.location.pathname.includes('/posts') && !window.location.pathname.includes('/posts/');

    if (isHomePage) {
      // Home 페이지에서는 최근 5개 포스트만 검색
      postsToSearch = this.posts.slice(0, 5);
    } else if (isPostsPage) {
      // Posts 페이지에서는 모든 포스트 검색
      postsToSearch = this.posts;
    } else if (pageTitle && pageTitle !== 'Posts' && pageTitle !== 'Resume') {
      // 카테고리 페이지에서는 해당 카테고리 포스트만 검색
      postsToSearch = this.posts.filter(post =>
        post.category && post.category.toLowerCase() === pageTitle.toLowerCase()
      );
      console.log(`Searching in category: ${pageTitle}, posts available: ${postsToSearch.length}`);
    } else {
      postsToSearch = this.posts;
    }

    // 검색 수행
    this.filteredPosts = postsToSearch.filter(post => {
      const titleMatch = post.title && post.title.toLowerCase().includes(query);
      const subtitleMatch = post.subtitle && post.subtitle.toLowerCase().includes(query);

      const matches = titleMatch || subtitleMatch;

      if (matches) {
        console.log('Found match:', post.title);
      }

      return matches;
    });

    console.log('Filtered posts:', this.filteredPosts.length);

    // 검색 정보 표시
    searchInfo.style.display = 'block';
    const infoText = searchInfo.querySelector('small');
    if (this.filteredPosts.length === 0) {
      infoText.textContent = `No posts found for "${query}"`;
      infoText.className = 'text-warning';
    } else {
      infoText.textContent = `Found ${this.filteredPosts.length} post(s) for "${query}"`;
      infoText.className = 'text-success';
    }

    this.currentPage = 0;
    this.hideOriginalContent();
    this.renderSearchResults();
    this.renderSearchPagination();
  }

  clearSearch() {
    this.searchInput.value = '';
    document.getElementById('search-clear-btn').style.display = 'none';
    document.getElementById('search-info').style.display = 'none';
    this.resetToOriginalPosts();
  }

  resetToOriginalPosts() {
    this.isSearching = false;
    this.showOriginalContent();
    this.clearSearchResults();
  }

  hideOriginalContent() {
    // 기존 포스트들과 페이지네이션 숨기기
    if (this.originalContent) {
      this.originalContent.articles.forEach(article => {
        article.style.display = 'none';
      });
      this.originalContent.hrs.forEach(hr => {
        hr.style.display = 'none';
      });
      if (this.originalContent.pagination) {
        this.originalContent.pagination.style.display = 'none';
      }
    }
  }

  showOriginalContent() {
    // 기존 포스트들과 페이지네이션 다시 보이기
    if (this.originalContent) {
      this.originalContent.articles.forEach(article => {
        article.style.display = 'block';
      });
      this.originalContent.hrs.forEach(hr => {
        hr.style.display = 'block';
      });
      if (this.originalContent.pagination) {
        this.originalContent.pagination.style.display = 'block';
      }
    }
  }

  clearSearchResults() {
    // 검색 결과 컨테이너 비우기
    if (this.searchResults) {
      this.searchResults.innerHTML = '';
    }
  }

  filterByCategory() {
    // 현재 페이지가 카테고리 페이지인지 확인
    const pageTitle = document.querySelector('h1')?.textContent?.trim();
    const isHomePage = window.location.pathname === '/' || window.location.pathname === '/index.html';
    const isPostsPage = window.location.pathname.includes('/posts') && !window.location.pathname.includes('/posts/');

    if (isHomePage) {
      // Home 페이지에서는 최근 5개 포스트만 표시
      this.filteredPosts = this.posts.slice(0, 5);
      this.currentCategory = null;
    } else if (isPostsPage) {
      // Posts 페이지에서는 모든 포스트 표시
      this.filteredPosts = [...this.posts];
      this.currentCategory = null;
    } else if (pageTitle && pageTitle !== 'Posts' && pageTitle !== 'Resume') {
      // 카테고리 페이지
      this.currentCategory = pageTitle;
      this.filteredPosts = this.posts.filter(post =>
        post.category && post.category.toLowerCase() === pageTitle.toLowerCase()
      );
    } else {
      this.filteredPosts = [...this.posts];
      this.currentCategory = null;
    }
  }

  renderSearchResults() {
    // 검색 결과 표시
    const startIndex = this.currentPage * this.postsPerPage;
    const endIndex = startIndex + this.postsPerPage;
    const postsToShow = this.filteredPosts.slice(startIndex, endIndex);

    this.searchResults.innerHTML = '';

    if (postsToShow.length === 0) {
      this.searchResults.innerHTML = `
        <div class="no-results">
          <p class="text-center text-muted mt-4">No posts found matching your search.</p>
        </div>
      `;
      return;
    }

    postsToShow.forEach((post, index) => {
      const article = document.createElement('article');
      article.className = 'post-preview search-result';

      article.innerHTML = `
        <a href="${post.url}">
          <h2 class="post-title">${post.title}</h2>
          <h3 class="post-subtitle">${post.subtitle || post.excerpt}</h3>
        </a>
        <div class="post-meta">
          <div class="post-date">
            <i class="far fa-calendar-alt"></i>
            Posted by ${post.author} on ${post.date}
          </div>
          ${post.category ? `<span class="badge">${post.category}</span>` : ''}
        </div>
      `;

      this.searchResults.appendChild(article);
    });
  }

  renderSearchPagination() {
    const totalPages = Math.ceil(this.filteredPosts.length / this.postsPerPage);

    // 기존 pagination 생성 또는 업데이트
    let existingSearchPagination = document.getElementById('search-pagination');
    if (existingSearchPagination) {
      existingSearchPagination.remove();
    }

    if (totalPages <= 1) {
      return;
    }

    const pagination = document.createElement('div');
    pagination.className = 'clearfix search-pagination mt-4';
    pagination.id = 'search-pagination';

    let paginationHTML = '';

    // Previous button
    if (this.currentPage > 0) {
      paginationHTML += `
        <button class="btn btn-primary float-left" onclick="postSearch.goToSearchPage(${this.currentPage - 1})">
          &larr; Newer<span class="d-none d-md-inline"> Posts</span>
        </button>
      `;
    }

    // Page info
    paginationHTML += `
      <div class="pagination-info text-center">
        <small class="text-muted">
          Page ${this.currentPage + 1} of ${totalPages}
          (${this.filteredPosts.length} posts)
        </small>
      </div>
    `;

    // Next button
    if (this.currentPage < totalPages - 1) {
      paginationHTML += `
        <button class="btn btn-primary float-right" onclick="postSearch.goToSearchPage(${this.currentPage + 1})">
          Older<span class="d-none d-md-inline"> Posts</span> &rarr;
        </button>
      `;
    }

    pagination.innerHTML = paginationHTML;
    this.searchResults.appendChild(pagination);
  }

  goToSearchPage(page) {
    this.currentPage = page;
    this.renderSearchResults();
    this.renderSearchPagination();

    // 스크롤을 검색 컨테이너로 이동
    const searchContainer = document.getElementById('post-search-container');
    if (searchContainer) {
      searchContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
}

// 페이지 로드 후 검색 기능 초기화
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOMContentLoaded - Current pathname:', window.location.pathname);

  // Home, Posts, Category 페이지에서만 검색 기능 활성화
  const isHomePage = window.location.pathname === '/' || window.location.pathname === '/index.html';
  const isPostsPage = window.location.pathname.includes('/posts');

  console.log('Is Home Page:', isHomePage);
  console.log('Is Posts Page:', isPostsPage);

  const isValidPage = isHomePage || isPostsPage;

  console.log('Is Valid Page for search:', isValidPage);

  if (isValidPage) {
    console.log('Initializing PostSearch...');
    window.postSearch = new PostSearch();
  } else {
    console.log('Search not initialized - invalid page');
  }
});