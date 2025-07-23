import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { articleService } from '@/services/articleService';
import { useAuthStore } from '@/components/context/authStore'; 
import ArticleContent from '@/components/article/article-content';
import ArticleSidebar from '@/components/article/article-sidebar';
import RelatedArticles from '@/components/article/related-articles';
import { Button } from '@/components/ui/button';

interface Article {
  _id: string;
  title: string;
  content: any; // Changed from string to any to support Editor.js content structure
  author: {
    _id: string;
    username: string;
    name?: string;
    title?: string;
    avatar?: string;
  };
  status: 'draft' | 'published';
  tags?: string[];
  category?: string;
  createdAt: string;
  updatedAt: string;
  likes: number;
  views?: number;
  likedBy?: string[];
  favorited?: boolean;
}

interface ArticleResponse {
  article: Article;
  comments?: any[];
}

interface ArticleDetailProps {
  id: string | undefined;
}

export function ArticleDetail({ id }: ArticleDetailProps) {
  const navigate = useNavigate();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const user = useAuthStore((s) => s.user);
  
  // Like state
  const [userLiked, setUserLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  
  // Article reference 
  const articleRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (id) {
      fetchArticle();
    }
  }, [id, user]);
  
  const fetchArticle = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const response = await articleService.getArticleById(id) as Article | ArticleResponse;
      
      console.log(response);
      // Check if response has article property (new API format) or is the article itself (old format)
      let articleData: Article;
      if ('article' in response) {
        articleData = response.article;
      } else {
        articleData = response;
      }
      
      // If the favorited property is not set and user is logged in, check favorite status
      if (user && articleData.favorited === undefined) {
        try {
          const favoriteResponse = await articleService.checkFavoriteStatus(id);
          articleData.favorited = favoriteResponse.favorited;
        } catch (err) {
          console.error("Error checking favorite status:", err);
          // Default to false if there's an error
          articleData.favorited = false;
        }
      }
      
      setArticle(articleData);
      setLikeCount(articleData.likes || 0);
      
      // Check if user has liked this article
      if (user && articleData.likedBy) {
        setUserLiked(articleData.likedBy.includes(user._id));
      }
      
      console.log("Article data received:", articleData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch article');
      console.error("Error fetching article:", err);
    } finally {
      setLoading(false);
    }
  };
  
    const handleDelete = async () => {
      if (
        !id ||
        !window.confirm("Are you sure you want to delete this article?")
      ) {
        return;
      }

      try {
        setLoading(true);
        await articleService.deleteArticle(id);
        navigate("/articles");
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to delete article"
        );
      } finally {
        setLoading(false);
      }
    };
  
  const handleLikeArticle = async () => {
    if (!user) {
      navigate('/login?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }
    
    if (!id || !article) return;
    
    try {
      const response = await articleService.likeArticle(id);
      setLikeCount(response.likes);
      setUserLiked(response.userLiked);
    } catch (err) {
      console.error("Error liking article:", err);
    }
  };
  
  

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-destructive/10 text-destructive p-4 rounded-md dark:bg-destructive/20">
          {error}
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center text-muted-foreground">
          Article not found
        </div>
      </div>
    );
  }

  const canEdit = user && (
    user.role?.toLowerCase() === 'admin' || 
    user.role?.toLowerCase() === 'owner' || 
    (article.author && user._id === article.author._id)
  );
  const canDelete = user && (
    user.role?.toLowerCase() === 'admin' || 
    user.role?.toLowerCase() === 'owner'
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid gap-8 lg:grid-cols-4">
        <div className="lg:col-span-3" ref={articleRef}>
          <ArticleContent
            article={article}
            handleLikeArticle={handleLikeArticle}
            userLiked={userLiked}
            likeCount={likeCount}
          />

          {canEdit || canDelete ? (
            <div className="flex justify-end space-x-4 mt-6">
              {canEdit && (
                <Button
                  onClick={() => navigate(`/dashboard/write?id=${id}`)}
                  variant="default"
                >
                  Edit Article
                </Button>
              )}
              {canDelete && (
                <Button onClick={handleDelete} variant="destructive">
                  Delete Article
                </Button>
              )}
            </div>
          ) : null}

          <div className="mt-16">
            <RelatedArticles
              currentArticleId={article._id}
              tags={article.tags}
              category={article.category}
            />
          </div>
        </div>

        <div className="lg:col-span-1">
          <ArticleSidebar
            article={article}
            handleLikeArticle={handleLikeArticle}
            userLiked={userLiked}
          />
        </div>
      </div>
    </div>
  );
}