import { motion } from "framer-motion";
import {
  Calendar,
  Clock,
  Eye,
  Heart,
  Share2,
  Bookmark,
} from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import RichEditorRenderer, {
  RichEditorStyle,
} from "../editor/rich-editor-renderer";
import { useAuthStore as useAuth } from "../context/authStore";
import { useNavigate } from "react-router-dom";
import { articleService } from "@/services/articleService";
import { useToast } from "../../lib/use-toast";
import { useEffect, useState } from "react";

interface ArticleContentProps {
  article: any;
  handleLikeArticle: () => void;
  userLiked: boolean;
  likeCount: number;
}

export default function ArticleContent({
  article,
  handleLikeArticle,
  userLiked,
  likeCount,
}: ArticleContentProps) {
  const user = useAuth((s) => s.user);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);

  useEffect(() => {
    console.log(article);
    // Set bookmark status based on article data
    if (article?.favorited !== undefined) {
      setIsBookmarked(article.favorited);
    }
  }, [article]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Link copied",
      description: "Article link copied to clipboard",
    });
  };

  const handleBookmark = async () => {
    if (!user) {
      navigate("/login?redirect=" + encodeURIComponent(window.location.href));
      return;
    }

    if (!article?._id) return;

    try {
      setBookmarkLoading(true);
      const response = await articleService.favoriteArticle(article._id);
      setIsBookmarked(response.favorited);

      toast({
        title: response.favorited ? "Article bookmarked" : "Bookmark removed",
        description: response.favorited
          ? "Article has been bookmarked"
          : "Article removed from your bookmarks",
      });
    } catch (error) {
      console.error("Error bookmarking article:", error);
      toast({
        title: "Action failed",
        description: "Could not bookmark article. Please try again.",
        type: "error",
      });
    } finally {
      setBookmarkLoading(false);
    }
  };

  // Format date
  const formatDate = (date: string) => {
    if (!date) return "";
    try {
      return new Date(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (e) {
      return "";
    }
  };

  // Estimate read time (1 minute per 200 words)
  const estimateReadTime = (content: any) => {
    if (!content) return "1 min read";

    try {
      // For Editor.js content
      if (content.blocks) {
        const textBlocks = content.blocks.filter((block: any) =>
          ["paragraph", "header", "quote", "list"].includes(block.type)
        );

        let wordCount = 0;
        textBlocks.forEach((block: any) => {
          if (
            block.type === "paragraph" ||
            block.type === "header" ||
            block.type === "quote"
          ) {
            wordCount += (block.data.text || "").split(/\s+/).length;
          } else if (block.type === "list" && Array.isArray(block.data.items)) {
            block.data.items.forEach((item: string) => {
              wordCount += item.split(/\s+/).length;
            });
          }
        });

        const minutes = Math.max(1, Math.ceil(wordCount / 200));
        return `${minutes} min read`;
      }

      // Fallback for string content
      if (typeof content === "string") {
        const wordCount = content.split(/\s+/).length;
        const minutes = Math.max(1, Math.ceil(wordCount / 200));
        return `${minutes} min read`;
      }

      return "1 min read";
    } catch (e) {
      return "1 min read";
    }
  };

  if (!article) {
    return <div className="text-center p-8">Loading article...</div>;
  }

  return (
    <article className="max-w-4xl mx-auto">
      {/* Article Header */}
      <motion.div
        className="space-y-6 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="space-y-4">
          <Badge className="text-white bg-black px-5 py-2 rounded-full">
            {article.category || "Uncategorized"}
          </Badge>

          <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight">
            {article.title}
          </h1>

          <p className="text-xl text-muted-foreground leading-relaxed">
            {article.description || "No description available"}
          </p>
        </div>

        {/* Article Meta */}
        <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center space-x-1">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(article.createdAt)}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Clock className="h-4 w-4" />
            <span>{estimateReadTime(article.content)}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Eye className="h-4 w-4" />
            <span>{article.views || 0} views</span>
          </div>
          <div className="flex items-center space-x-1">
            <Heart className="h-4 w-4" />
            <span>{likeCount || 0} likes</span>
          </div>
        </div>

        {/* Author Info */}
        <div className="flex items-center justify-between p-6 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
          <div className="flex items-center space-x-4">
            <Avatar className="h-12 w-12 border-2 border-blue-200 dark:border-blue-800">
              <AvatarImage
                src={article.author?.avatar}
                alt={article.author?.username || "Unknown Author"}
              />
              <AvatarFallback>
                {(article.author?.username || "UA")
                  .substring(0, 2)
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-lg">
                {article.author?.name ||
                  article.author?.username ||
                  "Unknown Author"}
              </h3>
              {article.author?.title && (
                <p className="text-sm text-muted-foreground">
                  {article.author?.title}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleLikeArticle}
              className={
                userLiked
                  ? "bg-blue-50 text-blue-600 border-blue-300 dark:bg-blue-900/20 dark:border-blue-700"
                  : ""
              }
            >
              <Heart
                className={`h-4 w-4 mr-1 ${
                  userLiked ? "fill-blue-600 text-blue-600" : ""
                }`}
              />
              Like
            </Button>
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-1" />
              Share
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleBookmark}
              disabled={bookmarkLoading}
              className={
                isBookmarked
                  ? "bg-yellow-50 text-yellow-600 border-yellow-300 dark:bg-yellow-900/20 dark:border-yellow-700"
                  : ""
              }
            >
              <Bookmark
                className={`h-4 w-4 mr-1 ${
                  isBookmarked ? "fill-yellow-500 text-yellow-500" : ""
                }`}
              />
              {bookmarkLoading
                ? "Saving..."
                : isBookmarked
                ? "Bookmarked"
                : "Bookmark"}
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Banner Image */}
      {article.coverImage && (
        <motion.div
          className="mb-12"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="relative aspect-video rounded-xl overflow-hidden">
            <img
              src={article.coverImage}
              alt={article.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          </div>
        </motion.div>
      )}

      {/* Article Content */}
      <motion.div
        className="prose prose-lg dark:prose-invert max-w-none"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        {typeof article.content === "string" ? (
          // Handle legacy string content format
          article.content
            .split("\n")
            .map((paragraph: string, index: number) => (
              <p key={index} className="mb-4">
                {paragraph}
              </p>
            ))
        ) : (
          // Use the new renderer for Editor.js content
          <>
            <RichEditorRenderer content={article.content} />
            <RichEditorStyle />
          </>
        )}
      </motion.div>
    </article>
  );
}
