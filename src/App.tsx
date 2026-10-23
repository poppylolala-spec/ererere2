import { useState } from 'react';
import { categories, Category, Article } from './data/categories';

type Page = 'home' | 'profile' | 'workspace' | 'article' | 'search';

interface WorkspaceTab {
  id: string;
  label: string;
  icon: string;
  status: Article['status'] | 'comments' | 'trash';
}

const workspaceTabs: WorkspaceTab[] = [
  { id: 'drafts', label: 'Черновики', icon: '📝', status: 'draft' },
  { id: 'published', label: 'Опубликованные', icon: '✅', status: 'published' },
  { id: 'review', label: 'На проверке', icon: '🔍', status: 'review' },
  { id: 'archive', label: 'Архив', icon: '📦', status: 'archived' },
  { id: 'comments', label: 'Мои комментарии', icon: '💬', status: 'comments' },
  { id: 'trash', label: 'Корзина', icon: '🗑️', status: 'trash' },
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
  const [showSearch, setShowSearch] = useState(false);

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
      setShowSearch(false);
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
    return allArticles.filter(a => a.status === tab);
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
            <span className="text-2xl">🌿</span>
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
          <div className="flex items-center gap-4">
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
                        <span>👤</span>
                        <span className="text-sm text-[#3d4f30]">Мой профиль</span>
                      </div>
                      <span className="text-xs text-[#6b7f58]">⭐ 4.8 · 12 статей</span>
                    </div>
                    <div className="flex justify-between items-center py-2 px-2 rounded-lg hover:bg-[#f0f4eb] cursor-pointer transition-colors">
                      <div className="flex items-center gap-2">
                        <span>⚙️</span>
                        <span className="text-sm text-[#3d4f30]">Настройки</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center py-2 px-2 rounded-lg hover:bg-[#f0f4eb] cursor-pointer transition-colors">
                      <div className="flex items-center gap-2">
                        <span>🔔</span>
                        <span className="text-sm text-[#3d4f30]">Уведомления</span>
                      </div>
                      <span className="bg-[#e8a838] text-white text-xs px-2 py-0.5 rounded-full">3</span>
                    </div>
                    <hr className="my-2 border-[#e8ede2]" />
                    <div className="flex justify-between items-center py-2 px-2 rounded-lg hover:bg-[#f0f4eb] cursor-pointer transition-colors">
                      <div className="flex items-center gap-2">
                        <span>🚪</span>
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
        {/* Sidebar */}
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

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-[#f5f5f0]">
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
            <ProfilePage />
          )}
          {currentPage === 'workspace' && (
            <WorkspacePage
              activeTab={workspaceTab}
              setActiveTab={setWorkspaceTab}
              getArticles={getWorkspaceArticles}
            />
          )}
          {currentPage === 'search' && (
            <SearchPage results={searchResults} query={searchQuery} onArticleClick={handleArticleClick} />
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
            className={`w-3 h-3 flex-shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        )}
        {!hasChildren && <span className="w-3" />}
        <span className="text-base">{category.icon}</span>
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
              <span className="text-3xl">{cat.icon}</span>
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
        <span className="text-4xl">{category.icon}</span>
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
                  <span className="text-xl">{child.icon}</span>
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

      {/* Articles as list */}
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
                      <StatusBadge status={article.status} />
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

// Article page
function ArticlePage({ article }: { article: Article }) {
  return (
    <div className="p-8 max-w-4xl">
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
              {article.date}
            </span>
            <StatusBadge status={article.status} />
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
              Комментарий
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
    </div>
  );
}

// Profile page
function ProfilePage() {
  return (
    <div className="p-8 max-w-4xl">
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
            <div className="text-2xl font-bold text-[#4a5d3a]">12</div>
            <div className="text-sm text-[#6b7f58]">Статей</div>
          </div>
          <div className="p-6 text-center">
            <div className="text-2xl font-bold text-[#4a5d3a]">⭐ 4.8</div>
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
          <h2 className="text-lg font-semibold text-[#3d4f30] mb-4">Последние статьи</h2>
          <div className="space-y-3">
            {[
              { title: 'Уход за фиалками в домашних условиях', date: '2024-12-15', status: 'published' },
              { title: 'Правильный полив фаленопсиса', date: '2024-12-01', status: 'published' },
              { title: 'Хамедорея изящная — уход', date: '2024-09-25', status: 'published' },
              { title: 'Нефролепис — самый популярный папоротник', date: '2024-09-15', status: 'published' },
            ].map((article, i) => (
              <div key={i} className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-[#f0f4eb] transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-[#8fa87a]">📄</span>
                  <span className="text-sm text-[#3d4f30]">{article.title}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-[#6b7f58]">{article.date}</span>
                  <StatusBadge status={article.status as Article['status']} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Workspace page
function WorkspacePage({
  activeTab,
  setActiveTab,
  getArticles
}: {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  getArticles: (tab: string) => Article[];
}) {
  const articles = getArticles(activeTab);

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#3d4f30] mb-2">Рабочий кабинет</h1>
        <p className="text-[#6b7f58]">Управление вашими статьями и публикациями</p>
      </div>

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
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl border border-[#d4dcc8] overflow-hidden">
        {(activeTab === 'comments' || activeTab === 'trash') ? (
          <div className="p-12 text-center">
            <span className="text-5xl mb-4 block">{activeTab === 'comments' ? '💬' : '🗑️'}</span>
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
                  <div className="flex items-center gap-2">
                    <StatusBadge status={article.status} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <span className="text-5xl mb-4 block">📭</span>
            <h3 className="text-lg font-medium text-[#3d4f30] mb-2">Пусто</h3>
            <p className="text-[#6b7f58]">В этой вкладке пока нет статей</p>
          </div>
        )}
      </div>
    </div>
  );
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
                <StatusBadge status={article.status} />
              </div>
            </div>
          ))
        ) : (
          <div className="p-12 text-center">
            <span className="text-5xl mb-4 block">🔍</span>
            <h3 className="text-lg font-medium text-[#3d4f30] mb-2">Ничего не найдено</h3>
            <p className="text-[#6b7f58]">Попробуйте изменить поисковый запрос</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Status badge component
function StatusBadge({ status }: { status: Article['status'] }) {
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
