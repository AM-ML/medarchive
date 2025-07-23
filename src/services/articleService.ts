import { API_URL } from '../lib/constants';

interface Article {
  _id: string;
  title: string;
  content: string;
  author: {
    _id: string;
    username: string;
  };
  status: 'draft' | 'published';
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

interface ArticleInput {
  title: string;
  content: string;
  status?: 'draft' | 'published';
  tags?: string[];
}

interface ArticlesResponse {
  articles: Article[];
  totalPages: number;
  currentPage: number;
  categories?: string[];
  popularTags?: {name: string; count: number}[];
}

interface ArticleResponse {
  article: Article;
  comments?: [];
}

interface ArticlesParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  tags?: string;
  sort?: string;
  excludeId?: string; // For getting related articles
  authorId?: string; // Filter by author
  minDate?: string; // Filter by minimum date
  maxDate?: string; // Filter by maximum date
  exact?: boolean; // Whether to use exact matching (instead of fuzzy search)
  favoritesOnly?: boolean; // Filter to show only favorited articles
}

export const articleService = {
  async getArticles(params: number | ArticlesParams = 1): Promise<ArticlesResponse> {
    let queryParams = '';
    
    if (typeof params === 'number') {
      // Legacy support for page number only
      queryParams = `?page=${params}&limit=10`;
    } else {
      // Support for full parameter object
      const searchParams = new URLSearchParams();
      if (params.page) searchParams.append('page', params.page.toString());
      if (params.limit) searchParams.append('limit', params.limit.toString());
      
      // Enhanced search parameter handling
      if (params.search) {
        // Clean and sanitize the search query
        const cleanedSearch = params.search.trim();
        if (cleanedSearch) {
          searchParams.append('search', cleanedSearch);
          
          // Add exact matching parameter if specified
          if (params.exact) {
            searchParams.append('exact', 'true');
          }
        }
      }
      
      if (params.category) searchParams.append('category', params.category);
      if (params.tags) searchParams.append('tags', params.tags);
      if (params.sort) searchParams.append('sort', params.sort);
      if (params.excludeId) searchParams.append('excludeId', params.excludeId);
      
      // Add additional filter parameters
      if (params.authorId) searchParams.append('authorId', params.authorId);
      if (params.minDate) searchParams.append('minDate', params.minDate);
      if (params.maxDate) searchParams.append('maxDate', params.maxDate);
      if (params.favoritesOnly) searchParams.append('favoritesOnly', 'true');
      
      queryParams = `?${searchParams.toString()}`;
    }
    
    try {
      const response = await fetch(
        `${API_URL}/articles${queryParams}`,
        {
          credentials: 'include'
        }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch articles: ${response.statusText}`);
      }
      
      return response.json();
    } catch (error) {
      console.error('Error in getArticles:', error);
      throw error;
    }
  },

  async getRelatedArticles(params: ArticlesParams = {}): Promise<ArticlesResponse> {
    const searchParams = new URLSearchParams();
    
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.excludeId) searchParams.append('excludeId', params.excludeId);
    if (params.category) searchParams.append('category', params.category);
    if (params.tags) searchParams.append('tags', params.tags);
    
    const queryParams = `?${searchParams.toString()}`;
    
    try {
      // First try the dedicated related articles endpoint with the correct URL structure
      const response = await fetch(
        `${API_URL}/articles/related${queryParams}`,
        {
          credentials: 'include'
        }
      );
      
      if (response.ok) {
        return response.json();
      }
      
      // If the related endpoint failed, fall back to regular articles endpoint with similar params
      console.log("Related articles endpoint not available, using fallback");
      
      // Create new params for the fallback request
      const fallbackSearchParams = new URLSearchParams();
      if (params.limit) fallbackSearchParams.append('limit', params.limit.toString());
      if (params.category) fallbackSearchParams.append('category', params.category);
      if (params.tags) fallbackSearchParams.append('tags', params.tags);
      
      // Add random sort to mix things up
      fallbackSearchParams.append('sort', 'random');
      
      // Exclude the current article
      if (params.excludeId) {
        fallbackSearchParams.append('excludeId', params.excludeId);
      }
      
      const fallbackQueryParams = `?${fallbackSearchParams.toString()}`;
      
      const fallbackResponse = await fetch(
        `${API_URL}/articles${fallbackQueryParams}`,
        {
          credentials: 'include'
        }
      );
      
      if (!fallbackResponse.ok) {
        throw new Error('Failed to fetch related articles');
      }
      
      const data = await fallbackResponse.json();
      
      // Additional client-side filtering in case the server doesn't support excludeId
      if (params.excludeId && data.articles) {
        data.articles = data.articles.filter((article: any) => article._id !== params.excludeId);
      }
      
      return data;
    } catch (err) {
      console.error("Error fetching related articles:", err);
      throw new Error('Failed to fetch related articles');
    }
  },

  async getArticleById(id: string): Promise<Article | ArticleResponse> {
    const response = await fetch(
      `${API_URL}/articles/${id}`,
      {
        credentials: 'include'
      }
    );
    if (!response.ok) {
      throw new Error('Failed to fetch article');
    }
    return response.json();
  },

  async createArticle(articleData: ArticleInput): Promise<Article> {
    const response = await fetch(
      `${API_URL}/articles`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(articleData)
      }
    );
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create article');
    }
    return response.json();
  },

  async updateArticle(id: string, articleData: ArticleInput): Promise<Article> {
    const response = await fetch(
      `${API_URL}/articles/${id}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(articleData)
      }
    );
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update article');
    }
    return response.json();
  },

  async deleteArticle(id: string): Promise<{ message: string }> {
    const response = await fetch(
      `${API_URL}/articles/${id}`,
      {
        method: 'DELETE',
        credentials: 'include'
      }
    );
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete article');
    }
    return response.json();
  },

  async likeArticle(id: string): Promise<{ likes: number; userLiked: boolean }> {
    const response = await fetch(
      `${API_URL}/articles/${id}/like`,
      {
        method: 'POST',
        credentials: 'include'
      }
    );
    if (!response.ok) {
      throw new Error('Failed to like article');
    }
    return response.json();
  },
  
  async favoriteArticle(id: string): Promise<{ favorited: boolean }> {
    const response = await fetch(
      `${API_URL}/articles/${id}/favorite`,
      {
        method: 'POST',
        credentials: 'include'
      }
    );
    if (!response.ok) {
      throw new Error('Failed to favorite article');
    }
    return response.json();
  },

  async checkFavoriteStatus(id: string): Promise<{ favorited: boolean }> {
    const response = await fetch(
      `${API_URL}/articles/${id}/favorite`,
      {
        credentials: 'include'
      }
    );
    if (!response.ok) {
      throw new Error('Failed to check favorite status');
    }
    return response.json();
  },

  async getArticleComments(id: string, page = 1): Promise<any> {
    const response = await fetch(
      `${API_URL}/articles/${id}/comments?page=${page}`,
      {
        credentials: 'include'
      }
    );
    if (!response.ok) {
      throw new Error('Failed to fetch comments');
    }
    return response.json();
  },

  async addComment(articleId: string, content: string): Promise<any> {
    const response = await fetch(
      `${API_URL}/articles/${articleId}/comments`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ content })
      }
    );
    if (!response.ok) {
      throw new Error('Failed to add comment');
    }
    return response.json();
  },

  async replyToComment(commentId: string, content: string): Promise<any> {
    const response = await fetch(
      `${API_URL}/comments/${commentId}/replies`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ content })
      }
    );
    if (!response.ok) {
      throw new Error('Failed to add reply');
    }
    return response.json();
  }
}