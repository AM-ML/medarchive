import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Clock, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Link } from "react-router-dom";
import { articleService } from "../../services/articleService";

interface Article {
  _id: string;
  title: string;
  description?: string;
  content: any;
  author: {
    _id: string;
    username: string;
    avatar?: string;
  };
  category?: string;
  coverImage?: string;
  createdAt: string;
  tags?: string[];
}

interface RelatedArticlesProps {
  currentArticleId?: string;
  tags?: string[];
  category?: string;
}

export default function RelatedArticles({ 
  currentArticleId, 
  tags = [], 
  category 
}: RelatedArticlesProps) {
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRelatedArticles = async () => {
      if (!currentArticleId) return;
      
      try {
        setLoading(true);
        
        // Using tags and category for better related content
        const params: Record<string, string | number> = {
          limit: 3,
          excludeId: currentArticleId
        };
        
        if (tags && tags.length > 0) {
          params.tags = tags.join(',');
        }
        
        if (category) {
          params.category = category;
        }
        
        const response = await articleService.getRelatedArticles(params);
        setRelatedArticles(response.articles || []);
      } catch (err) {
        console.error("Error fetching related articles:", err);
        setError("Failed to load related articles.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchRelatedArticles();
  }, [currentArticleId, tags, category]);

  // Estimate read time (1 minute per 200 words)
  const estimateReadTime = (content: any) => {
    if (!content) return '1 min read';
    
    try {
      // For Editor.js content
      if (content.blocks) {
        const textBlocks = content.blocks.filter((block: any) => 
          ['paragraph', 'header', 'quote', 'list'].includes(block.type)
        );
        
        let wordCount = 0;
        textBlocks.forEach((block: any) => {
          if (block.type === 'paragraph' || block.type === 'header' || block.type === 'quote') {
            wordCount += (block.data.text || '').split(/\s+/).length;
          } else if (block.type === 'list' && Array.isArray(block.data.items)) {
            block.data.items.forEach((item: string) => {
              wordCount += item.split(/\s+/).length;
            });
          }
        });
        
        const minutes = Math.max(1, Math.ceil(wordCount / 200));
        return `${minutes} min read`;
      }
      
      // Fallback for string content
      if (typeof content === 'string') {
        const wordCount = content.split(/\s+/).length;
        const minutes = Math.max(1, Math.ceil(wordCount / 200));
        return `${minutes} min read`;
      }
      
      return '1 min read';
    } catch (e) {
      return '1 min read';
    }
  };

  // Format date for display
  const formatDate = (date: string) => {
    if (!date) return '';
    try {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (e) {
      return '';
    }
  };

  if (loading) {
    return (
      <section>
        <h2 className="text-3xl font-bold mb-4">Related Articles</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-lg mb-4" />
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-3/4" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section>
        <h2 className="text-3xl font-bold mb-4">Related Articles</h2>
        <div className="text-center p-8 text-red-500">{error}</div>
      </section>
    );
  }

  if (relatedArticles.length === 0) {
    return (
      <section>
        <h2 className="text-3xl font-bold mb-4">Related Articles</h2>
        <div className="text-center p-8 text-gray-500">No related articles found</div>
      </section>
    );
  }

  return (
    <section>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-8"
      >
        <h2 className="text-3xl font-bold mb-4">Related Articles</h2>
        <p className="text-muted-foreground">
          Continue exploring with these related articles
        </p>
      </motion.div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {relatedArticles.map((article, index) => (
          <motion.div
            key={article._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
          >
            <Link to={`/articles/${article._id}`}>
              <Card className="h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1 pb-8">
                <div className="aspect-video relative overflow-hidden rounded-t-lg">
                  <img
                    src={article.coverImage || "/placeholder.svg"}
                    alt={article.title}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                  />
                  {article.category && (
                    <div className="absolute top-4 left-4">
                      <Badge className="bg-black text-white">{article.category}</Badge>
                    </div>
                  )}
                </div>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg line-clamp-2 hover:text-accent-foreground dark:hover:text-accent-foreground transition-colors">
                    {article.title}
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                    {article.description || "No description available"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(article.createdAt)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{estimateReadTime(article.content)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage 
                          src={article.author?.avatar || "/placeholder.svg"} 
                          alt={article.author?.username || "Author"} 
                        />
                        <AvatarFallback>
                          {article.author?.username
                            ? article.author.username.substring(0, 2).toUpperCase()
                            : "AU"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{article.author?.username || "Unknown Author"}</span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}