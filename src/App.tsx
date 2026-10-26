import { useState } from 'react';
import { categories, Category, Article } from './data/categories';
import { getCategoryIcon } from './components/Icons';

type Page = 'home' | 'profile' | 'workspace' | 'article' | 'search' | 'create-draft' | 'notifications';

interface WorkspaceTab {
  id: string;
  label: string;
  icon: string;
  status: Article['status'] | 'comments' | 'trash';
}

const workspaceTabs: WorkspaceTab[] = [
  { id: 'drafts', label: 'Черновики', icon: 'drafts', status: 'draft' },
  { id: 'published', label: 'Опубликованные', icon: 'published', status: 'published' },
  { id: 'review', label: 'На проверке', icon: 'review', status: 'review' },
  { id: 'archive', label: 'Архив', icon: 'archive', status: 'archived' },
  { id: 'comments', label: 'Мои комментарии', icon: 'comments', status: 'comments' },
  { id: 'trash', label: 'Корзина', icon: 'trash', status: 'trash' },
];

// Helper to collect all articles from a category tree
function collectArticles(cat: Category): Article[] {
  let arts: Article[] = cat.articles || [];
  if (cat.children) {
    for (const child of cat.children) {
      arts = arts.concat(collectArticles(child));
    }
  }
  return arts;
}

// Find category by id
function findCategory(cats: Category[], id: string): Category | null {
  for (const cat of cats) {
    if (cat.id === id) return cat;
    if (cat.children) {
      const found = findCategory(cat.children, id);
      if (found) return found;
    }
  }
  return null;
}

// Get breadcrumb path
function findPath(cats: Category[], targetId: string, path: string[] = []): string[] | null {
  for (const cat of cats) {
    const newPath = [...path, cat.id];
    if (cat.id === targetId) return newPath;
    if (cat.children) {
      const found = findPath(cat.children, targetId, newPath);
      if (found) return found;
    }
  }
  return null;
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [workspaceTab, setWorkspaceTab] = useState('drafts');
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const toggleNode = (id: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCategoryClick = (id: string) => {
    setSelectedCategory(id);
    setCurrentPage('home');
    setSelectedArticle(null);
  };

  const handleArticleClick = (article: Article) => {
    setSelectedArticle(article);
    setCurrentPage('article');
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      setCurrentPage('search');
    }
  };

  const searchResults = searchQuery.trim()
    ? categories.flatMap(cat => {
        const arts = collectArticles(cat);
        return arts.filter(a =>
          a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.content.toLowerCase().includes(searchQuery.toLowerCase())
        );
      })
    : [];

  const getWorkspaceArticles = (tab: string): Article[] => {
    const allArticles = categories.flatMap(cat => collectArticles(cat));
    if (tab === 'comments' || tab === 'trash') return [];
    
    // Фильтруем только статьи Анны Зелёновой
    const annaArticles = allArticles.filter(a => a.author === 'Анна Зелёнова');
    
    // Добавляем статусы программно для демонстрации
    const articlesWithStatus = annaArticles.map((article, index) => {
      let status: 'published' | 'draft' | 'review' | 'archived' = 'published';
      if (index % 4 === 0) status = 'published';
      else if (index % 4 === 1) status = 'draft';
      else if (index % 4 === 2) status = 'review';
      else status = 'archived';
      
      return { ...article, status };
    });
    
    return articlesWithStatus.filter(a => a.status === tab);
  };

  const getBreadcrumbs = () => {
    if (selectedCategory) {
      const path = findPath(categories, selectedCategory);
      if (path) {
        return path.map(id => {
          const cat = findCategory(categories, id);
          return { id, name: cat?.name || '' };
        });
      }
    }
    return [];
  };

  return (
    <div className="min-h-screen bg-[#f5f5f0] flex flex-col">
      {/* Header */}
      <header className="bg-[#4a5d3a] shadow-lg sticky top-0 z-50">
        <div className="flex items-center justify-between px-6 py-3">
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setCurrentPage('home'); setSelectedCategory(null); setSelectedArticle(null); }}>
            <svg className="w-7 h-7 text-[#8fa87a]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21V11m0 0c-2-3-5-4-7-3m7 3c2-3 5-4 7-3M9 11c0-2 1-4 3-5m0 5c0-2-1-4-3-5" />
            </svg>
            <h1 className="text-white text-xl font-bold tracking-wide">База знаний</h1>
          </div>

          {/* Search */}
          <div className="flex-1 max-w-xl mx-8">
            <div className="relative">
              <input
                type="text"
                placeholder="Поиск по базе знаний..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full px-4 py-2 pl-10 rounded-lg bg-[#5a6f48] text-white placeholder-[#a8b89a] border border-[#6b7f58] focus:outline-none focus:ring-2 focus:ring-[#8fa87a] focus:border-transparent transition-all"
              />
              <svg className="absolute left-3 top-2.5 w-5 h-5 text-[#a8b89a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Right section */}
          <div className="flex items-center gap-3">
            {/* Workspace button */}
            <button
              onClick={() => setCurrentPage('workspace')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#5a6f48] hover:bg-[#6b7f58] text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <span className="hidden sm:inline">Рабочий кабинет</span>
            </button>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-lg hover:bg-[#5a6f48] transition-colors"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="absolute top-1 right-1 w-2 h-2 bg-[#e8a838] rounded-full"></span>
              </button>

              {showNotifications && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-[#d4dcc8] overflow-hidden z-50">
                  <div className="p-4 border-b border-[#e8ede2] flex items-center justify-between">
                    <h3 className="font-semibold text-[#3d4f30]">Уведомления</h3>
                    <span className="text-xs text-[#6b7f58] bg-[#e8f0de] px-2 py-0.5 rounded-full">3 новых</span>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    <div className="p-4 border-b border-[#e8ede2] hover:bg-[#f0f4eb] cursor-pointer transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#e8f0de] flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-[#4a5d3a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm text-[#3d4f30] font-medium">Статья одобрена</p>
                          <p className="text-xs text-[#6b7f58] mt-0.5">«Уход за фиалками» прошла проверку и опубликована</p>
                          <p className="text-xs text-[#a8b89a] mt-1">2 часа назад</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 border-b border-[#e8ede2] hover:bg-[#f0f4eb] cursor-pointer transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#fef3cd] flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-[#856404]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm text-[#3d4f30] font-medium">Новый комментарий</p>
                          <p className="text-xs text-[#6b7f58] mt-0.5">Игорь Садовников оставил комментарий к вашей статье</p>
                          <p className="text-xs text-[#a8b89a] mt-1">5 часов назад</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 hover:bg-[#f0f4eb] cursor-pointer transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#d4e8f0] flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-[#2c5f7c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm text-[#3d4f30] font-medium">Запрос на проверку</p>
                          <p className="text-xs text-[#6b7f58] mt-0.5">«Пересадка фаленопсиса» отправлена на рецензию</p>
                          <p className="text-xs text-[#a8b89a] mt-1">Вчера</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 border-t border-[#e8ede2]">
                    <button 
                      onClick={() => { setCurrentPage('notifications'); setShowNotifications(false); }}
                      className="w-full text-center text-sm text-[#4a5d3a] hover:text-[#3d4f30] font-medium py-1">
                      Смотреть все уведомления
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Profile */}
            <div className="relative">
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#5a6f48] transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-[#8fa87a] flex items-center justify-center text-white font-bold text-sm">
                  АЗ
                </div>
                <span className="text-white text-sm hidden md:inline">Анна Зелёнова</span>
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showProfileDropdown && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-[#d4dcc8] overflow-hidden z-50">
                  <div className="p-4 bg-gradient-to-r from-[#4a5d3a] to-[#5a6f48]">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-[#8fa87a] flex items-center justify-center text-white font-bold text-lg">
                        АЗ
                      </div>
                      <div>
                        <p className="text-white font-semibold">Анна Зелёнова</p>
                        <p className="text-[#c8d4b8] text-sm">Автор статей</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="flex justify-between items-center py-2 px-2 rounded-lg hover:bg-[#f0f4eb] cursor-pointer transition-colors" onClick={() => { setCurrentPage('profile'); setShowProfileDropdown(false); }}>
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-[#6b7f58]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="text-sm text-[#3d4f30]">Мой профиль</span>
                      </div>
                      <span className="text-xs text-[#6b7f58]">4.8 / 12 ст.</span>
                    </div>
                    <div className="flex justify-between items-center py-2 px-2 rounded-lg hover:bg-[#f0f4eb] cursor-pointer transition-colors">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-[#6b7f58]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="text-sm text-[#3d4f30]">Настройки</span>
                      </div>
                    </div>
                    <hr className="my-2 border-[#e8ede2]" />
                    <div className="flex justify-between items-center py-2 px-2 rounded-lg hover:bg-[#f0f4eb] cursor-pointer transition-colors">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-[#6b7f58]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span className="text-sm text-[#3d4f30]">Выйти</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - показываем только на страницах базы знаний */}
        {(currentPage === 'home' || currentPage === 'article' || currentPage === 'search') && (
          <aside className="w-72 bg-white border-r border-[#d4dcc8] overflow-y-auto flex-shrink-0 shadow-sm">
            <div className="p-4 border-b border-[#e8ede2]">
              <h2 className="text-sm font-semibold text-[#4a5d3a] uppercase tracking-wider">Категории</h2>
            </div>
            <nav className="p-2">
              {categories.map(cat => (
                <SidebarNode
                  key={cat.id}
                  category={cat}
                  expandedNodes={expandedNodes}
                  toggleNode={toggleNode}
                  selectedCategory={selectedCategory}
                  handleCategoryClick={handleCategoryClick}
                  depth={0}
                />
              ))}
            </nav>
          </aside>
        )}

        {/* Main Content */}
        <main className={`flex-1 overflow-y-auto bg-[#f5f5f0] ${
          currentPage === 'profile' || currentPage === 'workspace' || currentPage === 'create-draft' || currentPage === 'notifications'
            ? 'flex justify-center items-start'
            : ''
        }`}>
          {currentPage === 'home' && !selectedCategory && (
            <HomePage handleCategoryClick={handleCategoryClick} />
          )}
          {currentPage === 'home' && selectedCategory && (
            <CategoryPage
              categoryId={selectedCategory}
              onArticleClick={handleArticleClick}
              onCategoryClick={handleCategoryClick}
              breadcrumbs={getBreadcrumbs()}
            />
          )}
          {currentPage === 'article' && selectedArticle && (
            <ArticlePage article={selectedArticle} />
          )}
          {currentPage === 'profile' && (
            <ProfilePage onArticleClick={handleArticleClick} />
          )}
          {currentPage === 'workspace' && (
            <WorkspacePage
              activeTab={workspaceTab}
              setActiveTab={setWorkspaceTab}
              getArticles={getWorkspaceArticles}
              setCurrentPage={setCurrentPage}
            />
          )}
          {currentPage === 'create-draft' && (
            <CreateDraftPage setCurrentPage={setCurrentPage} />
          )}
          {currentPage === 'search' && (
            <SearchPage results={searchResults} query={searchQuery} onArticleClick={handleArticleClick} />
          )}
          {currentPage === 'notifications' && (
            <NotificationsPage setCurrentPage={setCurrentPage} />
          )}
        </main>
      </div>
    </div>
  );
}

// Sidebar tree node component
function SidebarNode({
  category,
  expandedNodes,
  toggleNode,
  selectedCategory,
  handleCategoryClick,
  depth
}: {
  category: Category;
  expandedNodes: Set<string>;
  toggleNode: (id: string) => void;
  selectedCategory: string | null;
  handleCategoryClick: (id: string) => void;
  depth: number;
}) {
  const isExpanded = expandedNodes.has(category.id);
  const hasChildren = category.children && category.children.length > 0;
  const isSelected = selectedCategory === category.id;

  return (
    <div>
      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all group
          ${isSelected ? 'bg-[#e8f0de] text-[#3d4f30] font-medium' : 'hover:bg-[#f0f4eb] text-[#4a5d3a]'}
        `}
        style={{ paddingLeft: `${depth * 16 + 12}px` }}
        onClick={() => {
          handleCategoryClick(category.id);
          if (hasChildren) toggleNode(category.id);
        }}
      >
        {hasChildren && (
          <svg
            className={`w-3 h-3 flex-shrink-0 transition-transform text-[#8fa87a]`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        )}
        {!hasChildren && <span className="w-3" />}
        <span className="text-[#6b7f58]">{getCategoryIcon(category.icon, "w-4 h-4")}</span>
        <span className="text-sm truncate">{category.name}</span>
      </div>
      {isExpanded && hasChildren && (
        <div>
          {category.children!.map(child => (
            <SidebarNode
              key={child.id}
              category={child}
              expandedNodes={expandedNodes}
              toggleNode={toggleNode}
              selectedCategory={selectedCategory}
              handleCategoryClick={handleCategoryClick}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Home page
function HomePage({ handleCategoryClick }: { handleCategoryClick: (id: string) => void }) {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#3d4f30] mb-2">Добро пожаловать в базу знаний</h1>
        <p className="text-[#6b7f58] text-lg">Энциклопедия растений — уход, посадка, размножение и многое другое</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map(cat => (
          <div
            key={cat.id}
            onClick={() => handleCategoryClick(cat.id)}
            className="bg-white rounded-xl p-5 border border-[#d4dcc8] hover:border-[#8fa87a] hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="text-[#6b7f58]">{getCategoryIcon(cat.icon, "w-7 h-7")}</span>
              <h3 className="text-lg font-semibold text-[#3d4f30] group-hover:text-[#4a5d3a] transition-colors">{cat.name}</h3>
            </div>
            <p className="text-sm text-[#6b7f58]">
              {cat.children ? `${cat.children.length} подкатегорий` : `${cat.articles?.length || 0} статей`}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Category page - shows articles and subcategories as a list
function CategoryPage({
  categoryId,
  onArticleClick,
  onCategoryClick,
  breadcrumbs
}: {
  categoryId: string;
  onArticleClick: (article: Article) => void;
  onCategoryClick: (id: string) => void;
  breadcrumbs: { id: string; name: string }[];
}) {
  const category = findCategory(categories, categoryId);
  if (!category) return null;

  const hasChildren = category.children && category.children.length > 0;
  const hasArticles = category.articles && category.articles.length > 0;

  return (
    <div className="p-8">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-[#6b7f58] mb-6 flex-wrap">
        <span
          className="hover:text-[#4a5d3a] cursor-pointer transition-colors"
          onClick={() => onCategoryClick('')}
        >
          Главная
        </span>
        {breadcrumbs.map((crumb, i) => (
          <span key={crumb.id} className="flex items-center gap-2">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            {i === breadcrumbs.length - 1 ? (
              <span className="text-[#3d4f30] font-medium">{crumb.name}</span>
            ) : (
              <span
                className="hover:text-[#4a5d3a] cursor-pointer transition-colors"
                onClick={() => onCategoryClick(crumb.id)}
              >
                {crumb.name}
              </span>
            )}
          </span>
        ))}
      </nav>

      {/* Category header */}
      <div className="flex items-center gap-4 mb-8">
        <span className="text-[#6b7f58]">{getCategoryIcon(category.icon, "w-9 h-9")}</span>
        <div>
          <h1 className="text-2xl font-bold text-[#3d4f30]">{category.name}</h1>
          <p className="text-[#6b7f58] text-sm mt-1">
            {hasChildren && `${category.children!.length} подкатегорий`}
            {hasChildren && hasArticles && ' · '}
            {hasArticles && `${category.articles!.length} статей`}
          </p>
        </div>
      </div>

      {/* Subcategories as list */}
      {hasChildren && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-[#3d4f30] mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-[#6b7f58]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            Подкатегории
          </h2>
          <div className="bg-white rounded-xl border border-[#d4dcc8] overflow-hidden">
            {category.children!.map((child, i) => (
              <div
                key={child.id}
                onClick={() => onCategoryClick(child.id)}
                className={`flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-[#f0f4eb] transition-colors group
                  ${i !== category.children!.length - 1 ? 'border-b border-[#e8ede2]' : ''}
                `}
              >
                <div className="flex items-center gap-3">
                  <span className="text-[#6b7f58]">{getCategoryIcon(child.icon, "w-5 h-5")}</span>
                  <div>
                    <span className="text-[#3d4f30] font-medium group-hover:text-[#4a5d3a]">{child.name}</span>
                    <span className="text-xs text-[#8fa87a] ml-3">
                      {child.children ? `${child.children.length} подкат.` : `${child.articles?.length || 0} ст.`}
                    </span>
                  </div>
                </div>
                <svg className="w-5 h-5 text-[#8fa87a] group-hover:text-[#4a5d3a] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Articles as list - without status badges */}
      {hasArticles && (
        <div>
          <h2 className="text-lg font-semibold text-[#3d4f30] mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-[#6b7f58]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Статьи
          </h2>
          <div className="bg-white rounded-xl border border-[#d4dcc8] overflow-hidden">
            {category.articles!.map((article, i) => (
              <div
                key={article.id}
                onClick={() => onArticleClick(article)}
                className={`px-5 py-4 cursor-pointer hover:bg-[#f0f4eb] transition-colors group
                  ${i !== category.articles!.length - 1 ? 'border-b border-[#e8ede2]' : ''}
                `}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-[#3d4f30] font-medium group-hover:text-[#4a5d3a] mb-1">{article.title}</h3>
                    <p className="text-sm text-[#6b7f58] line-clamp-2">{article.content}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-xs text-[#8fa87a]">{article.author}</span>
                      <span className="text-xs text-[#a8b89a]">{article.date}</span>
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-[#8fa87a] group-hover:text-[#4a5d3a] transition-colors flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Article page with sidebar
function ArticlePage({ article }: { article: Article }) {
  return (
    <div className="p-8">
      <div className="flex gap-6">
        {/* Main article content */}
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-xl border border-[#d4dcc8] p-8">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-[#3d4f30] mb-3">{article.title}</h1>
              <div className="flex items-center gap-4 text-sm text-[#6b7f58]">
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  {article.author}
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {article.publishedAt || article.date}
                </span>
              </div>
            </div>
            <hr className="border-[#e8ede2] mb-6" />
            <div className="prose prose-sm max-w-none">
              <p className="text-[#3d4f30] leading-relaxed text-base">{article.content}</p>
            </div>
            <div className="mt-8 pt-6 border-t border-[#e8ede2]">
              <div className="flex items-center gap-3">
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#e8f0de] hover:bg-[#d4e4c8] text-[#4a5d3a] transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                  </svg>
                  Полезно
                </button>
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#f0f4eb] hover:bg-[#e8ede2] text-[#6b7f58] transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  Поделиться
                </button>
              </div>
            </div>
          </div>

          {/* Comments section */}
          <div className="bg-white rounded-xl border border-[#d4dcc8] p-6 mt-6">
            <h3 className="text-lg font-semibold text-[#3d4f30] mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-[#6b7f58]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
              Комментарии: {article.commentsCount || 0}
            </h3>
            {(article.commentsCount || 0) > 0 ? (
              <div className="space-y-4">
                <div className="border-l-2 border-[#8fa87a] pl-4 py-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-[#3d4f30]">Игорь Садовников</span>
                    <span className="text-xs text-[#a8b89a]">2 дня назад</span>
                  </div>
                  <p className="text-sm text-[#4a5d3a]">Отличная статья, очень полезно для начинающих цветоводов!</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-[#6b7f58]">Пока нет комментариев. Будьте первым!</p>
            )}
            <div className="mt-4 pt-4 border-t border-[#e8ede2]">
              <textarea
                placeholder="Написать комментарий..."
                className="w-full px-4 py-3 rounded-lg border border-[#d4dcc8] focus:outline-none focus:ring-2 focus:ring-[#8fa87a] focus:border-transparent resize-none text-sm"
                rows={3}
              />
              <button className="mt-2 px-4 py-2 rounded-lg bg-[#4a5d3a] hover:bg-[#5a6f48] text-white text-sm transition-colors">
                Отправить
              </button>
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="w-80 flex-shrink-0 space-y-4">
          {/* Rating */}
          <div className="bg-white rounded-xl border border-[#d4dcc8] p-5">
            <h3 className="text-sm font-semibold text-[#3d4f30] mb-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-[#e8a838]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              Оценка материала
            </h3>
            {article.rating && article.ratingCount ? (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl font-bold text-[#3d4f30]">{article.rating}</span>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map(star => (
                      <svg key={star} className={`w-4 h-4 ${star <= Math.round(article.rating!) ? 'text-[#e8a838]' : 'text-[#e8ede2]'}`} fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-[#6b7f58]">{article.ratingCount} оценок</p>
              </div>
            ) : (
              <div>
                <p className="text-sm text-[#6b7f58] mb-1">Мало оценок</p>
                <p className="text-xs text-[#a8b89a]">Оценок пока нет</p>
              </div>
            )}
            <p className="text-xs text-[#a8b89a] mt-3 italic">Свой материал оценивать нельзя.</p>
          </div>

          {/* About material */}
          <div className="bg-white rounded-xl border border-[#d4dcc8] p-5">
            <h3 className="text-sm font-semibold text-[#3d4f30] mb-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-[#6b7f58]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              О материале
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-[#6b7f58]">Автор</span>
                <span className="text-sm text-[#3d4f30]">{article.author}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-[#6b7f58]">Проверил</span>
                <span className="text-sm text-[#3d4f30]">{article.reviewer || 'Тест Куратор'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-[#6b7f58]">Версия</span>
                <span className="text-sm text-[#3d4f30]">{article.version || 'v1'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-[#6b7f58]">Опубликована</span>
                <span className="text-sm text-[#3d4f30]">{article.publishedAt || '16.10.2026, 16:30'}</span>
              </div>
              <hr className="border-[#e8ede2]" />
              <div className="space-y-2">
                <button className="w-full text-left text-sm text-[#4a5d3a] hover:text-[#3d4f30] flex items-center gap-2 py-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Открыть в редакторе
                </button>
                <button className="w-full text-left text-sm text-red-600 hover:text-red-700 flex items-center gap-2 py-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                  Снять с публикации
                </button>
              </div>
            </div>
          </div>

          {/* Attachments */}
          <div className="bg-white rounded-xl border border-[#d4dcc8] p-5">
            <h3 className="text-sm font-semibold text-[#3d4f30] mb-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-[#6b7f58]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              Вложения
            </h3>
            <p className="text-sm text-[#6b7f58]">Файлов нет.</p>
          </div>

          {/* Related materials */}
          <div className="bg-white rounded-xl border border-[#d4dcc8] p-5">
            <h3 className="text-sm font-semibold text-[#3d4f30] mb-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-[#6b7f58]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Материалы по теме
            </h3>
            <p className="text-sm text-[#6b7f58]">Пока нет.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Profile page
function ProfilePage({ onArticleClick }: { onArticleClick?: (article: Article) => void }) {
  const [showAllArticles, setShowAllArticles] = useState(false);
  
  const allArticles = categories.flatMap(cat => collectArticles(cat));
  const authorArticles = allArticles.filter(a => a.author === 'Анна Зелёнова');
  
  const recentArticles = authorArticles.slice(0, 4);
  const displayedArticles = showAllArticles ? authorArticles : recentArticles;

  const handleArticleClick = (article: Article) => {
    if (onArticleClick) {
      onArticleClick(article);
    }
  };

  return (
    <div className="w-full p-8 max-w-4xl">
      <div className="bg-white rounded-xl border border-[#d4dcc8] overflow-hidden">
        {/* Profile header */}
        <div className="bg-gradient-to-r from-[#4a5d3a] to-[#6b7f58] p-8">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-[#8fa87a] flex items-center justify-center text-white font-bold text-2xl border-4 border-[#a8b89a]">
              АЗ
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Анна Зелёнова</h1>
              <p className="text-[#c8d4b8]">Автор статей · Присоединилась в марте 2024</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 divide-x divide-[#e8ede2] border-b border-[#e8ede2]">
          <div className="p-6 text-center">
            <div className="text-2xl font-bold text-[#4a5d3a]">{authorArticles.length}</div>
            <div className="text-sm text-[#6b7f58]">Статей</div>
          </div>
          <div className="p-6 text-center">
            <div className="text-2xl font-bold text-[#4a5d3a]">4.8</div>
            <div className="text-sm text-[#6b7f58]">Рейтинг</div>
          </div>
          <div className="p-6 text-center">
            <div className="text-2xl font-bold text-[#4a5d3a]">156</div>
            <div className="text-sm text-[#6b7f58]">Комментариев</div>
          </div>
          <div className="p-6 text-center">
            <div className="text-2xl font-bold text-[#4a5d3a]">1.2K</div>
            <div className="text-sm text-[#6b7f58]">Просмотров</div>
          </div>
        </div>

        {/* Rating details */}
        <div className="p-6">
          <h2 className="text-lg font-semibold text-[#3d4f30] mb-4">Рейтинг автора</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-sm text-[#6b7f58] w-24">Качество</span>
              <div className="flex-1 bg-[#e8ede2] rounded-full h-3">
                <div className="bg-[#6b7f58] h-3 rounded-full" style={{ width: '90%' }}></div>
              </div>
              <span className="text-sm font-medium text-[#4a5d3a]">90%</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-[#6b7f58] w-24">Активность</span>
              <div className="flex-1 bg-[#e8ede2] rounded-full h-3">
                <div className="bg-[#8fa87a] h-3 rounded-full" style={{ width: '75%' }}></div>
              </div>
              <span className="text-sm font-medium text-[#4a5d3a]">75%</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-[#6b7f58] w-24">Полезность</span>
              <div className="flex-1 bg-[#e8ede2] rounded-full h-3">
                <div className="bg-[#a8b89a] h-3 rounded-full" style={{ width: '85%' }}></div>
              </div>
              <span className="text-sm font-medium text-[#4a5d3a]">85%</span>
            </div>
          </div>
        </div>

        {/* Recent articles */}
        <div className="p-6 border-t border-[#e8ede2]">
          <h2 className="text-lg font-semibold text-[#3d4f30] mb-4">
            {showAllArticles ? 'Все статьи' : 'Последние статьи'}
          </h2>
          <div className="space-y-3">
            {displayedArticles.map((article, i) => (
              <div 
                key={i} 
                onClick={() => handleArticleClick(article)}
                className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-[#f0f4eb] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <svg className="w-4 h-4 text-[#8fa87a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-sm text-[#3d4f30]">{article.title}</span>
                </div>
                <span className="text-xs text-[#6b7f58]">{article.date}</span>
              </div>
            ))}
          </div>
          
          {!showAllArticles && authorArticles.length > 4 && (
            <button
              onClick={() => setShowAllArticles(true)}
              className="mt-4 w-full py-3 px-4 rounded-lg border border-[#d4dcc8] hover:bg-[#f0f4eb] transition-colors text-sm font-medium text-[#4a5d3a]"
            >
              Показать все статьи ({authorArticles.length})
            </button>
          )}
          
          {showAllArticles && (
            <button
              onClick={() => setShowAllArticles(false)}
              className="mt-4 w-full py-3 px-4 rounded-lg border border-[#d4dcc8] hover:bg-[#f0f4eb] transition-colors text-sm font-medium text-[#4a5d3a]"
            >
              Свернуть
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Workspace page
function WorkspacePage({
  activeTab,
  setActiveTab,
  getArticles,
  setCurrentPage
}: {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  getArticles: (tab: string) => Article[];
  setCurrentPage: (page: Page) => void;
}) {
  const articles = getArticles(activeTab);
  const isMyMaterials = ['drafts', 'published', 'review', 'archive'].includes(activeTab);

  return (
    <div className="w-full p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#3d4f30] mb-2">Рабочий кабинет</h1>
          <p className="text-[#6b7f58]">Управление вашими статьями и публикациями</p>
        </div>
          <button 
            onClick={() => setCurrentPage('create-draft')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#4a5d3a] hover:bg-[#5a6f48] text-white transition-colors shadow-md">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Создать черновик
          </button>      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {workspaceTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all
              ${activeTab === tab.id
                ? 'bg-[#4a5d3a] text-white shadow-md'
                : 'bg-white text-[#4a5d3a] border border-[#d4dcc8] hover:bg-[#f0f4eb] hover:border-[#8fa87a]'
              }
            `}
          >
            <TabIcon name={tab.icon} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl border border-[#d4dcc8] overflow-hidden">
        {(activeTab === 'comments' || activeTab === 'trash') ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#f0f4eb] flex items-center justify-center">
              {activeTab === 'comments' ? (
                <svg className="w-8 h-8 text-[#8fa87a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
              ) : (
                <svg className="w-8 h-8 text-[#8fa87a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              )}
            </div>
            <h3 className="text-lg font-medium text-[#3d4f30] mb-2">
              {activeTab === 'comments' ? 'Мои комментарии' : 'Корзина'}
            </h3>
            <p className="text-[#6b7f58]">
              {activeTab === 'comments' ? 'Здесь будут отображаться ваши комментарии к статьям' : 'Удалённые статьи будут перемещены сюда'}
            </p>
          </div>
        ) : articles.length > 0 ? (
          <div>
            {articles.map((article, i) => (
              <div
                key={article.id}
                className={`px-6 py-4 hover:bg-[#f0f4eb] transition-colors cursor-pointer
                  ${i !== articles.length - 1 ? 'border-b border-[#e8ede2]' : ''}
                `}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-[#3d4f30] font-medium mb-1">{article.title}</h3>
                    <p className="text-sm text-[#6b7f58] line-clamp-2">{article.content}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-xs text-[#8fa87a]">{article.author}</span>
                      <span className="text-xs text-[#a8b89a]">{article.date}</span>
                    </div>
                  </div>
                  {isMyMaterials && article.status && <StatusBadge status={article.status} />}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#f0f4eb] flex items-center justify-center">
              <svg className="w-8 h-8 text-[#8fa87a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-[#3d4f30] mb-2">Пусто</h3>
            <p className="text-[#6b7f58]">В этой вкладке пока нет статей</p>
          </div>
        )}
      </div>
    </div>
  );
}

function TabIcon({ name }: { name: string }) {
  const icons: Record<string, JSX.Element> = {
    drafts: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>,
    published: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    review: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
    archive: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>,
    comments: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>,
    trash: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
  };
  return icons[name] || null;
}

// Search page
function SearchPage({ results, query, onArticleClick }: { results: Article[]; query: string; onArticleClick: (article: Article) => void }) {
  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#3d4f30] mb-2">Результаты поиска</h1>
        <p className="text-[#6b7f58]">Найдено {results.length} результатов по запросу «{query}»</p>
      </div>

      <div className="bg-white rounded-xl border border-[#d4dcc8] overflow-hidden">
        {results.length > 0 ? (
          results.map((article, i) => (
            <div
              key={article.id}
              onClick={() => onArticleClick(article)}
              className={`px-6 py-4 hover:bg-[#f0f4eb] transition-colors cursor-pointer
                ${i !== results.length - 1 ? 'border-b border-[#e8ede2]' : ''}
              `}
            >
              <h3 className="text-[#3d4f30] font-medium mb-1">{article.title}</h3>
              <p className="text-sm text-[#6b7f58] line-clamp-2">{article.content}</p>
              <div className="flex items-center gap-4 mt-2">
                <span className="text-xs text-[#8fa87a]">{article.author}</span>
                <span className="text-xs text-[#a8b89a]">{article.date}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#f0f4eb] flex items-center justify-center">
              <svg className="w-8 h-8 text-[#8fa87a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-[#3d4f30] mb-2">Ничего не найдено</h3>
            <p className="text-[#6b7f58]">Попробуйте изменить поисковый запрос</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Notifications Page
interface Notification {
  id: number;
  type: 'approved' | 'comment' | 'review' | 'system';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

function NotificationsPage({ setCurrentPage }: { setCurrentPage: (page: Page) => void }) {
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [notifications, setNotifications] = useState<Notification[]>([
    { id: 1, type: 'approved', title: 'Статья одобрена', message: '«Уход за фиалками в домашних условиях» прошла проверку и опубликована', time: '2 часа назад', read: false },
    { id: 2, type: 'comment', title: 'Новый комментарий', message: 'Игорь Садовников оставил комментарий к вашей статье «Правильный полив фаленопсиса»', time: '5 часов назад', read: false },
    { id: 3, type: 'review', title: 'Запрос на проверку', message: '«Пересадка фаленопсиса» отправлена на рецензию куратору', time: 'Вчера, 14:30', read: false },
    { id: 4, type: 'comment', title: 'Ответ на комментарий', message: 'Мария Цветкова ответила на ваш комментарий в статье «Размножение фиалок листом»', time: 'Вчера, 10:15', read: true },
    { id: 5, type: 'system', title: 'Обновление системы', message: 'Добавлена новая функция «Материалы по теме». Ознакомьтесь с документацией.', time: '2 дня назад', read: true },
    { id: 6, type: 'approved', title: 'Статья одобрена', message: '«Хамедорея изящная — уход» прошла проверку и опубликована', time: '3 дня назад', read: true },
    { id: 7, type: 'comment', title: 'Новый комментарий', message: 'Пётр Колючкин оставил комментарий к вашей статье «Нефролепис — самый популярный папоротник»', time: '4 дня назад', read: true },
    { id: 8, type: 'review', title: 'Статья возвращена на доработку', message: 'Куратор указал на необходимость дополнить раздел о болезнях в статье «Фикус Бенджамина»', time: '5 дней назад', read: true },
    { id: 9, type: 'system', title: 'Новый куратор', message: 'Елена Орхидеева назначена куратором раздела «Орхидеи»', time: 'Неделю назад', read: true },
    { id: 10, type: 'approved', title: 'Черновик сохранён', message: 'Ваш черновик «Болезни фиалок и их лечение» автоматически сохранён', time: 'Неделю назад', read: true },
  ]);

  const markAsRead = (id: number) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.read;
    if (filter === 'read') return n.read;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'approved':
        return (
          <div className="w-10 h-10 rounded-full bg-[#e8f0de] flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-[#4a5d3a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'comment':
        return (
          <div className="w-10 h-10 rounded-full bg-[#fef3cd] flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-[#856404]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
        );
      case 'review':
        return (
          <div className="w-10 h-10 rounded-full bg-[#d4e8f0] flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-[#2c5f7c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'system':
        return (
          <div className="w-10 h-10 rounded-full bg-[#e8ede2] flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-[#6b7f58]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  return (
    <div className="w-full p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#3d4f30] mb-2">Уведомления</h1>
          <p className="text-[#6b7f58]">
            {unreadCount > 0 ? `${unreadCount} непрочитанных` : 'Все уведомления прочитаны'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white hover:bg-[#f0f4eb] text-[#4a5d3a] border border-[#d4dcc8] transition-colors text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Прочитать все
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            filter === 'all'
              ? 'bg-[#4a5d3a] text-white shadow-md'
              : 'bg-white text-[#4a5d3a] border border-[#d4dcc8] hover:bg-[#f0f4eb]'
          }`}
        >
          Все ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            filter === 'unread'
              ? 'bg-[#4a5d3a] text-white shadow-md'
              : 'bg-white text-[#4a5d3a] border border-[#d4dcc8] hover:bg-[#f0f4eb]'
          }`}
        >
          Непрочитанные ({unreadCount})
        </button>
        <button
          onClick={() => setFilter('read')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            filter === 'read'
              ? 'bg-[#4a5d3a] text-white shadow-md'
              : 'bg-white text-[#4a5d3a] border border-[#d4dcc8] hover:bg-[#f0f4eb]'
          }`}
        >
          Прочитанные ({notifications.length - unreadCount})
        </button>
      </div>

      {/* Notifications list */}
      <div className="bg-white rounded-xl border border-[#d4dcc8] overflow-hidden">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((notification, i) => (
            <div
              key={notification.id}
              onClick={() => !notification.read && markAsRead(notification.id)}
              className={`px-6 py-4 cursor-pointer transition-colors ${
                !notification.read ? 'bg-[#f9faf5]' : 'bg-white'
              } hover:bg-[#f0f4eb] ${i !== filteredNotifications.length - 1 ? 'border-b border-[#e8ede2]' : ''}`}
            >
              <div className="flex items-start gap-4">
                {getNotificationIcon(notification.type)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className={`text-sm ${!notification.read ? 'font-semibold text-[#3d4f30]' : 'font-medium text-[#4a5d3a]'}`}>
                      {notification.title}
                    </h3>
                    {!notification.read && (
                      <span className="w-2 h-2 bg-[#4a5d3a] rounded-full flex-shrink-0 mt-1.5"></span>
                    )}
                  </div>
                  <p className="text-sm text-[#6b7f58] mb-1">{notification.message}</p>
                  <p className="text-xs text-[#a8b89a]">{notification.time}</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#f0f4eb] flex items-center justify-center">
              <svg className="w-8 h-8 text-[#8fa87a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-[#3d4f30] mb-2">Нет уведомлений</h3>
            <p className="text-[#6b7f58]">
              {filter === 'unread' ? 'Все уведомления прочитаны' : 'В этой категории пока нет уведомлений'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Status badge component
function StatusBadge({ status }: { status: Article['status'] }) {
  if (!status) return null;
  const config = {
    published: { label: 'Опубликовано', className: 'bg-[#e8f0de] text-[#4a5d3a]' },
    draft: { label: 'Черновик', className: 'bg-[#fef3cd] text-[#856404]' },
    review: { label: 'На проверке', className: 'bg-[#d4e8f0] text-[#2c5f7c]' },
    archived: { label: 'Архив', className: 'bg-[#e8ede2] text-[#6b7f58]' },
  };

  const { label, className } = config[status];

  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${className}`}>
      {label}
    </span>
  );
}

// Create Draft Page
function CreateDraftPage({ setCurrentPage }: { setCurrentPage: (page: Page) => void }) {
  const [title, setTitle] = useState('');
  const [section, setSection] = useState('');
  const [tags, setTags] = useState('');
  const [additionalSections, setAdditionalSections] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<string[]>([]);
  const [content, setContent] = useState('');

  const allSections = categories.map(cat => ({ id: cat.id, name: cat.name }));

  const addAdditionalSection = () => {
    const available = allSections.filter(s => s.id !== section && !additionalSections.includes(s.id));
    if (available.length > 0) {
      setAdditionalSections([...additionalSections, available[0].id]);
    }
  };

  const removeAdditionalSection = (index: number) => {
    setAdditionalSections(additionalSections.filter((_, i) => i !== index));
  };

  return (
    <div className="w-full p-8 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#3d4f30] mb-2">Создание черновика</h1>
        <p className="text-[#6b7f58]">Заполните информацию о новом материале</p>
      </div>

      <div className="bg-white rounded-xl border border-[#d4dcc8]">
        {/* Compact metadata section */}
        <div className="p-6 border-b border-[#e8ede2]">
          {/* Строка 1: Заголовок */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-[#6b7f58] mb-1">Заголовок</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Введите заголовок статьи"
              className="w-full px-3 py-2 rounded border border-[#d4dcc8] focus:outline-none focus:ring-2 focus:ring-[#8fa87a] text-sm text-[#3d4f30]"
            />
          </div>

          {/* Строка 2: Раздел + Доп. разделы */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-[#6b7f58] mb-1">Раздел</label>
              <select
                value={section}
                onChange={(e) => setSection(e.target.value)}
                className="w-full px-3 py-2 rounded border border-[#d4dcc8] focus:outline-none focus:ring-2 focus:ring-[#8fa87a] text-sm text-[#3d4f30] bg-white"
              >
                <option value="">Выберите раздел</option>
                {allSections.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6b7f58] mb-1">Дополнительные разделы</label>
              <div className="flex gap-2">
                <select className="flex-1 px-3 py-2 rounded border border-[#d4dcc8] focus:outline-none focus:ring-2 focus:ring-[#8fa87a] text-sm text-[#3d4f30] bg-white">
                  <option>Не выбрано</option>
                </select>
                <button
                  onClick={addAdditionalSection}
                  className="px-3 py-2 rounded bg-[#e8f0de] hover:bg-[#d4e4c8] text-[#4a5d3a] text-sm transition-colors"
                  title="Добавить раздел"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Строка 3: Привязка */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-[#6b7f58] mb-1">Привязка к материалам</label>
            <div className="flex gap-2">
              <select 
                disabled={!section && additionalSections.length === 0}
                className="flex-1 px-3 py-2 rounded border border-[#d4dcc8] focus:outline-none focus:ring-2 focus:ring-[#8fa87a] text-sm text-[#3d4f30] bg-white disabled:bg-[#f0f4eb] disabled:cursor-not-allowed"
              >
                <option>Не выбрана</option>
              </select>
              <button
                disabled={!section && additionalSections.length === 0}
                className="px-3 py-2 rounded bg-[#e8f0de] hover:bg-[#d4e4c8] text-[#4a5d3a] text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Добавить привязку"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </button>
            </div>
          </div>

          {/* Строка 4: Теги */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-[#6b7f58] mb-1">Теги</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Введите теги через запятую"
              className="w-full px-3 py-2 rounded border border-[#d4dcc8] focus:outline-none focus:ring-2 focus:ring-[#8fa87a] text-sm text-[#3d4f30]"
            />
          </div>

          {/* Строка 5: Вложения */}
          <div>
            <label className="block text-xs font-medium text-[#6b7f58] mb-1">Вложения</label>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-2 px-3 py-1.5 rounded bg-[#e8f0de] hover:bg-[#d4e4c8] text-[#4a5d3a] text-xs transition-colors">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                Добавить файл
              </button>
              {attachments.length === 0 && (
                <span className="text-xs text-[#a8b89a]">PDF, DOC, JPG, PNG (макс. 10 МБ)</span>
              )}
            </div>
          </div>
        </div>

        {/* Editor section */}
        <div className="p-6">
          <label className="block text-sm font-semibold text-[#3d4f30] mb-3">Текст материала</label>
          
          {/* Toolbar */}
          <div className="border border-[#d4dcc8] rounded-t-lg bg-[#f0f4eb] p-2 flex flex-wrap gap-1">
            <button className="p-2 rounded hover:bg-white text-[#4a5d3a]" title="Отменить">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l4 4m-4-4l4-4" />
              </svg>
            </button>
            <button className="p-2 rounded hover:bg-white text-[#4a5d3a]" title="Повторить">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a8 8 0 00-8 8v2m18-10l-4 4m4-4l-4-4" />
              </svg>
            </button>
            <div className="w-px bg-[#d4dcc8] mx-1"></div>
            <select className="px-2 py-1 rounded border border-[#d4dcc8] bg-white text-sm text-[#3d4f30]">
              <option>Обычный текст</option>
              <option>Заголовок 1</option>
              <option>Заголовок 2</option>
              <option>Заголовок 3</option>
            </select>
            <select className="px-2 py-1 rounded border border-[#d4dcc8] bg-white text-sm text-[#3d4f30]">
              <option>Размер</option>
              <option>Маленький</option>
              <option>Средний</option>
              <option>Большой</option>
            </select>
            <button className="px-3 py-1 rounded hover:bg-white text-[#4a5d3a] font-bold" title="Жирный">Ж</button>
            <button className="px-3 py-1 rounded hover:bg-white text-[#4a5d3a] italic" title="Курсив">К</button>
            <button className="px-3 py-1 rounded hover:bg-white text-[#4a5d3a] line-through" title="Зачеркнутый">З</button>
            <button className="px-3 py-1 rounded hover:bg-white text-[#4a5d3a] font-mono" title="Код">&lt;/&gt;</button>
            <div className="w-px bg-[#d4dcc8] mx-1"></div>
            <button className="p-2 rounded hover:bg-white text-[#4a5d3a]" title="Список">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <button className="p-2 rounded hover:bg-white text-[#4a5d3a]" title="Нумерованный список">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <button className="p-2 rounded hover:bg-white text-[#4a5d3a]" title="Уменьшить отступ">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
            <button className="p-2 rounded hover:bg-white text-[#4a5d3a]" title="Увеличить отступ">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            </button>
            <button className="p-2 rounded hover:bg-white text-[#4a5d3a]" title="По левому краю">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h14" />
              </svg>
            </button>
            <div className="w-px bg-[#d4dcc8] mx-1"></div>
            <button className="p-2 rounded hover:bg-white text-[#4a5d3a]" title="Ссылка">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </button>
            <button className="p-2 rounded hover:bg-white text-[#4a5d3a]" title="Вставить медиафайл">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>
            <button className="p-2 rounded hover:bg-white text-[#4a5d3a]" title="Таблица">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
            <button className="p-2 rounded hover:bg-white text-[#4a5d3a]" title="Цитата">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
            </button>
            <button className="p-2 rounded hover:bg-white text-[#4a5d3a]" title="Линия">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12h16" />
              </svg>
            </button>
            <div className="w-px bg-[#d4dcc8] mx-1"></div>
            <button className="px-2 py-1 rounded bg-[#fef3cd] hover:bg-[#fde68a] text-[#856404] text-xs transition-colors" title="Заметка">Заметка</button>
            <button className="px-2 py-1 rounded bg-[#fee2e2] hover:bg-[#fecaca] text-[#991b1b] text-xs transition-colors" title="Предупреждение">Предупреждение</button>
            <button className="px-2 py-1 rounded bg-[#dbeafe] hover:bg-[#bfdbfe] text-[#1e40af] text-xs transition-colors" title="Важно">Важно</button>
            <button className="px-2 py-1 rounded bg-[#d1fae5] hover:bg-[#a7f3d0] text-[#065f46] text-xs transition-colors" title="Успех">Успех</button>
          </div>

          {/* Text area */}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Начните писать статью..."
            className="w-full px-4 py-3 border border-[#d4dcc8] rounded-b-lg focus:outline-none focus:ring-2 focus:ring-[#8fa87a] focus:border-transparent text-[#3d4f30] min-h-[400px] resize-y"
          />

          {/* Autosave */}
          <div className="mt-4 flex items-center gap-2 text-xs text-[#6b7f58]">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Автосохранение включено
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3">
          <button className="px-5 py-2.5 rounded-lg bg-[#4a5d3a] hover:bg-[#5a6f48] text-white transition-colors shadow-md">
            Сохранить черновик
          </button>
          <button className="px-5 py-2.5 rounded-lg bg-white hover:bg-[#f0f4eb] text-[#4a5d3a] border border-[#d4dcc8] transition-colors">
            Предпросмотр публикации
          </button>
          <button className="px-5 py-2.5 rounded-lg bg-white hover:bg-[#f0f4eb] text-[#4a5d3a] border border-[#d4dcc8] transition-colors">
            Отправить на модерацию
          </button>
          <button className="px-5 py-2.5 rounded-lg bg-white hover:bg-[#f0f4eb] text-[#4a5d3a] border border-[#d4dcc8] transition-colors">
            В корзину
          </button>
          <button 
            onClick={() => setCurrentPage('workspace')}
            className="px-5 py-2.5 rounded-lg bg-white hover:bg-[#f0f4eb] text-[#4a5d3a] border border-[#d4dcc8] transition-colors">
            К страницам
          </button>
        </div>
      </div>
    </div>
  );
}
