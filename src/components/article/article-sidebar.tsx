import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Eye,
  Heart,
  Share2,
  Bookmark,
  User,
  Calendar,
  Tag,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../lib/use-toast";
import { articleService } from "../../services/articleService";
import { useAuthStore } from "../context/authStore";

interface ArticleSidebarProps {
  article: any;
  handleLikeArticle: () => void;
  handleShareArticle?: () => void;
  userLiked: boolean;
}

export default function ArticleSidebar({
  article,
  handleLikeArticle,
  userLiked,
}: ArticleSidebarProps) {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("");
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const { toast } = useToast();
  const user = useAuthStore((s) => s.user);

  // Check if article is favorited on mount
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (!user || !article?._id) return;

      try {
        // First check if the article already has favorited status from the API
        if (article.favorited !== undefined) {
          setIsFavorited(article.favorited);
          return;
        }

        // If not, make an API call to check
        const response = await articleService.checkFavoriteStatus(article._id);
        setIsFavorited(response.favorited);
      } catch (error) {
        console.error("Error checking favorite status:", error);
        // Default to false if there's an error
        setIsFavorited(false);
      }
    };

    checkFavoriteStatus();
  }, [article, user]);

  // Generate table of contents from article content
  const generateTableOfContents = () => {
    if (!article?.content) return [];

    let toc: { id: string; title: string; level: number }[] = [];

    // For Editor.js content
    if (article.content.blocks) {
      article.content.blocks.forEach((block: any, index: number) => {
        if (block.type === "header") {
          const level = block.data.level || 1;
          const title = block.data.text;
          const id = `heading-${index}`;
          toc.push({ id, title, level });
        }
      });
    }

    // If no headers found, add default sections
    if (toc.length === 0) {
      toc = [
        { id: "abstract", title: "Abstract", level: 1 },
        { id: "introduction", title: "Introduction", level: 1 },
        { id: "methodology", title: "Methodology", level: 1 },
        { id: "results", title: "Results", level: 1 },
        { id: "conclusion", title: "Conclusion", level: 1 },
      ];
    }

    return toc;
  };

  const tableOfContents = generateTableOfContents();

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

  // Set up scroll listener to update active section
  useEffect(() => {
    const handleScroll = () => {
      const headingElements = document.querySelectorAll(
        "h1, h2, h3, h4, h5, h6"
      );
      let currentSection = "";

      headingElements.forEach((heading) => {
        const rect = heading.getBoundingClientRect();
        if (rect.top <= 150) {
          currentSection = heading.id;
        }
      });

      setActiveSection(currentSection);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Handle share action
  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Link copied",
      description: "Article link copied to clipboard",
    });
  };

  // Handle favorite action
  const handleFavorite = async () => {
    if (!user) {
      navigate("/login?redirect=" + encodeURIComponent(window.location.href));
      return;
    }

    if (!article?._id) return;

    try {
      setFavoriteLoading(true);
      const response = await articleService.favoriteArticle(article._id);
      setIsFavorited(response.favorited);

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
      setFavoriteLoading(false);
    }
  };

  // Handle author profile view
  const handleViewAuthorProfile = () => {
    if (article?.author?._id) {
      navigate(`/profile/${article.author._id}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Table of Contents */}
      {tableOfContents.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="py-5">
            <CardHeader>
              <CardTitle className="text-lg">Table of Contents</CardTitle>
            </CardHeader>
            <CardContent>
              <nav className="space-y-2">
                {tableOfContents.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className={`block text-sm hover:text-accent-foreground dark:hover:text-accent-foreground transition-colors ${
                      item.level === 2
                        ? "ml-4 text-muted-foreground"
                        : "font-medium"
                    } ${
                      activeSection === item.id
                        ? "text-accent-foreground hover:dark:text-accent-foreground"
                        : ""
                    }`}
                  >
                    {item.title}
                  </a>
                ))}
              </nav>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Article Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="py-5">
          <CardHeader>
            <CardTitle className="text-lg">Article Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleLikeArticle}
            >
              <Heart
                className={`h-4 w-4 mr-2 ${
                  userLiked ? "fill-accent-foreground text-accent-foreground" : ""
                }`}
              />
              {userLiked ? "Unlike Article" : "Like Article"}
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleFavorite}
              disabled={favoriteLoading}
            >
              <Bookmark
                className={`h-4 w-4 mr-2 ${
                  isFavorited ? "fill-yellow-500 text-yellow-500" : ""
                }`}
              />
              {favoriteLoading
                ? "Saving..."
                : isFavorited
                ? "Remove Bookmark"
                : "Bookmark"}
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleShare}
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share Article
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Article Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Card className="py-5">
          <CardHeader>
            <CardTitle className="text-lg">Article Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Views</span>
                </div>
                <span className="font-medium">{article?.views || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Heart className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Likes</span>
                </div>
                <span className="font-medium">{article?.likes || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Share2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Shares</span>
                </div>
                <span className="font-medium">{article?.shares || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Published</span>
                </div>
                <span className="font-medium">
                  {formatDate(article?.createdAt || "")}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Author Info */}
      {article?.author && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className="py-5">
            <CardHeader>
              <CardTitle className="text-lg">About the Author</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage
                      src={article.author.avatar}
                      alt={article.author.username}
                    />
                    <AvatarFallback>
                      {(article.author.username || "UA")
                        .substring(0, 2)
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-semibold">
                      {article.author.name || article.author.username}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {article.author.title || ""}
                    </p>
                  </div>
                </div>
                {article.author.bio && (
                  <p className="text-sm text-muted-foreground">
                    {article.author.bio}
                  </p>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={handleViewAuthorProfile}
                >
                  <User className="h-4 w-4 mr-2" />
                  View Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Tags */}
      {article?.tags && article.tags.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Card className="py-5">
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Tag className="h-4 w-4 mr-2" />
                Tags
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {article.tags.map((tag: string, index: number) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
