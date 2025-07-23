import { useEffect, useState } from "react";
import axios from "axios"
import { useLocation, useSearchParams } from "react-router-dom";
import Pagination from "@/components/pagination";
import ArticleCard from "@/components/article-card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Filter, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";

const MEDICAL_CATEGORIES = [
    "Neurology", "Cardiology", "Pulmonology", "Genetics", "Infectious Disease",
    "Immunology", "Rheumatology", "Endocrinology", "Oncology", "Pediatrics",
    "Psychiatry", "Hematology", "Internal Medicine", "Nephrology",
    "Transplant Medicine", "Gastroenterology", "Dermatology",
    "Obstetrics & Gynecology", "Surgery", "Ophthalmology", "Otolaryngology",
    "Dentistry", "Orthopedics", "Public Health", "Medical Technology"
];

interface Article {
    _id: string;
    title: string;
    description?: string;
    content: any;
    author: {
        _id: string;
        username: string;
        name?: string;
        title?: string;
        avatar?: string;
    };
    category?: string;
    coverImage?: string;
    createdAt: string;
    likes?: number;
    views?: number;
    tags?: string[];
}

const Articles = () => {
    const [articles, setArticles] = useState<Article[]>([]);
    const [currentPage, setCurrentPage] = useState(1); // Fixed: Start from page 1
    const [totalPages, setTotalPages] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
    const [category, setCategory] = useState("all");
    const [sortBy, setSortBy] = useState("newest");
    const [categories, setCategories] = useState<string[]>(MEDICAL_CATEGORIES);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [searchParams, setSearchParams] = useSearchParams();
    const location = useLocation();

    // Initialize all parameters from URL
    useEffect(() => {
        const searchFromUrl = searchParams.get("search");
        if (searchFromUrl) {
            setSearchQuery(searchFromUrl);
            setDebouncedSearchQuery(searchFromUrl);
        }

        const categoryFromUrl = searchParams.get("category");
        if (categoryFromUrl) {
            setCategory(categoryFromUrl);
        }

        const sortFromUrl = searchParams.get("sort");
        if (sortFromUrl) {
            setSortBy(sortFromUrl);
        }

        // Fixed: Initialize page from URL
        const pageFromUrl = searchParams.get("page");
        if (pageFromUrl) {
            setCurrentPage(parseInt(pageFromUrl));
        }
    }, [location.search]);

    // Debounce search query
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);

            // Update URL with search query
            if (searchQuery) {
                searchParams.set("search", searchQuery);
            } else {
                searchParams.delete("search");
            }
            setSearchParams(searchParams);
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery, searchParams, setSearchParams]);

    useEffect(() => {
        const fetchArticles = async () => {
            try {
                setLoading(true);
                const params = {
                    page: currentPage,
                    limit: 9, // Fixed: Changed to 9 as mentioned
                    sort: sortBy,
                    search: debouncedSearchQuery,
                    category: category !== "all" ? category : ""
                };

                let response = await axios.get(import.meta.env.VITE_SERVER_DOMAIN + 'articles', {
                    params // Fixed: Use params object properly
                });
                response = response.data;
                setArticles(response.articles);
                setTotalPages(response.totalPages);

                if (response.categories) {
                    const allCategories = [...new Set([
                        ...MEDICAL_CATEGORIES,
                        ...response.categories.filter(cat => cat)
                    ])];
                    setCategories(allCategories);
                }
                console.log('Fetched articles:', response.articles);
            } catch (err) {
                console.error("Error fetching articles:", err);
                setError("Failed to load articles. Please try again later.");
            } finally {
                setLoading(false);
            }
        };
        fetchArticles();
    }, [currentPage, debouncedSearchQuery, category, sortBy]);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    };

    // Reset to first page when search query is actually applied
    useEffect(() => {
        if (currentPage !== 1) {
            setCurrentPage(1);
        }
    }, [debouncedSearchQuery, category, sortBy]);

    // Fixed: Handle page change with URL update
    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        
        // Update URL with new page
        if (page > 1) {
            searchParams.set("page", page.toString());
        } else {
            searchParams.delete("page");
        }
        setSearchParams(searchParams);
    };

    // Handle category change
    const handleCategoryChange = (value: string) => {
        setCategory(value);

        if (value && value !== "all") {
            searchParams.set("category", value);
        } else {
            searchParams.delete("category");
        }
        setSearchParams(searchParams);
    };

    // Handle sort change
    const handleSortChange = (value: string) => {
        setSortBy(value);

        if (value && value !== "newest") {
            searchParams.set("sort", value);
        } else {
            searchParams.delete("sort");
        }
        setSearchParams(searchParams);
    };

    return (
        <div>
            <div className="min-h-[87vh] w-full">
                <div className="min-h-screen flex flex-col">
                    <main className="flex-1">
                        <div className="px-4 md:px-6 py-8 w-full">
                            <motion.div
                                className="flex flex-col md:flex-row gap-4 mb-8"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2, duration: 0.5 }}
                            >
                                <div className="relative flex-1">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="search"
                                        placeholder="Search articles by title, author, category, or keywords..."
                                        className="pl-8"
                                        value={searchQuery}
                                        onChange={handleSearch}
                                    />
                                </div>
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <Select value={category} onValueChange={handleCategoryChange}>
                                        <SelectTrigger className="w-full sm:w-[200px]">
                                            <SelectValue placeholder="Medical Specialty" />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-[400px]">
                                            <SelectItem value="all">All Specialties</SelectItem>
                                            {categories.sort().map((cat) => (
                                                <SelectItem key={cat} value={cat}>
                                                    {cat}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Select value={sortBy} onValueChange={handleSortChange}>
                                        <SelectTrigger className="w-full sm:w-[180px]">
                                            <SelectValue placeholder="Sort by" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="newest">Newest First</SelectItem>
                                            <SelectItem value="oldest">Oldest First</SelectItem>
                                            <SelectItem value="popular">Most Popular</SelectItem>
                                            <SelectItem value="trending">Trending</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Button variant="outline" size="icon" className="hidden sm:flex">
                                        <Filter className="h-4 w-4" />
                                        <span className="sr-only">Filter</span>
                                    </Button>
                                </div>
                            </motion.div>

                            {loading ? (
                                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                    {[...Array(6)].map((_, index) => (
                                        <div key={index} className="animate-pulse">
                                            <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-lg mb-4" />
                                            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-3/4" />
                                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
                                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                                        </div>
                                    ))}
                                </div>
                            ) : error ? (
                                <div className="text-center p-8 text-red-500">{error}</div>
                            ) : articles.length === 0 ? (
                                <div className="text-center py-12">
                                    <h3 className="text-xl font-semibold mb-2">No articles found</h3>
                                    <p className="text-muted-foreground">
                                        {debouncedSearchQuery ?
                                            `No results for "${debouncedSearchQuery}"${category !== 'all' ? ` in ${category}` : ''}` :
                                            category !== 'all' ? `No articles in ${category} yet` : 'No articles available'}
                                    </p>
                                </div>
                            ) : (
                                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 w-[100%]">
                                    {articles.map((article, index) => (
                                        <ArticleCard key={article._id} article={article} index={index} />
                                    ))}
                                </div>
                            )}

                            {totalPages > 1 && (
                                <div className="mt-8">
                                    <Pagination
                                        currentPage={currentPage}
                                        totalPages={totalPages}
                                        onPageChange={handlePageChange} // Fixed: Use the new handler
                                    />
                                </div>
                            )}
                        </div>
                    </main>
                </div>
            </div>
        </div>
    )
}

export default Articles;