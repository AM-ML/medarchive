"use client"

import { motion } from "framer-motion"
import { Calendar, Clock, ArrowRight } from "lucide-react"
import { Badge } from "./ui/badge"
import { Card, CardContent, CardFooter, CardHeader } from "./ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { Link } from "react-router-dom"

interface ArticleCardProps {
    article: {
        _id: string
        title: string
        description?: string
        category?: string
        coverImage?: string
        createdAt: string
        content: any
        author: {
            _id: string
            username: string
            name?: string
            title?: string
            avatar?: string
        }
    }
    index?: number
}

export default function ArticleCard({ article, index = 0 }: ArticleCardProps) {
    // Format date
    const formatDate = (date: string) => {
        if (!date) return ''
        try {
            return new Date(date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            })
        } catch (e) {
            return ''
        }
    }

    // Estimate read time (1 minute per 200 words)
    const estimateReadTime = (content: any) => {
        if (!content) return '1 min read'

        try {
            // For Editor.js content
            if (content.blocks) {
                const textBlocks = content.blocks.filter((block: any) =>
                    ['paragraph', 'header', 'quote', 'list'].includes(block.type)
                )

                let wordCount = 0
                textBlocks.forEach((block: any) => {
                    if (block.type === 'paragraph' || block.type === 'header' || block.type === 'quote') {
                        wordCount += (block.data.text || '').split(/\s+/).length
                    } else if (block.type === 'list' && Array.isArray(block.data.items)) {
                        block.data.items.forEach((item: string) => {
                            wordCount += item.split(/\s+/).length
                        })
                    }
                })

                const minutes = Math.max(1, Math.ceil(wordCount / 200))
                return `${minutes} min read`
            }

            // Fallback for string content
            if (typeof content === 'string') {
                const wordCount = content.split(/\s+/).length
                const minutes = Math.max(1, Math.ceil(wordCount / 200))
                return `${minutes} min read`
            }

            return '1 min read'
        } catch (e) {
            return '1 min read'
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            whileHover={{ y: -5 }}
            className="h-full"
        >
            <Link to={`/articles/${article._id}`} className="h-full">
                <Card className="overflow-hidden h-full transition-all hover:shadow-md dark:hover:shadow-blue-900/10">
                    <div className="aspect-video relative overflow-hidden">
                        <img
                            src={article.coverImage || "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"}
                            alt={article.title}
                            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                        />
                        <div className="absolute top-4 left-4">
                            <Badge className="bg-hero p-3 rounded-full text-white hover:brightness-130">
                                {article.category || "Uncategorized"}
                            </Badge>
                        </div>
                    </div>
                    <CardHeader className="p-4">
                        <h3 className="text-xl font-bold line-clamp-2 hover:text-accent-foreground transition-colors">
                            {article.title}
                        </h3>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <p className="text-muted-foreground line-clamp-3 text-sm">{article.description || ""}</p>
                    </CardContent>
                    <CardFooter className="p-4 pt-0 flex flex-col space-y-4">
                        <div className="flex items-center justify-between w-full text-sm text-muted-foreground">
                            <div className="flex items-center space-x-1">
                                <Calendar className="h-3.5 w-3.5" />
                                <span>{formatDate(article.createdAt)}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                                <Clock className="h-3.5 w-3.5" />
                                <span>{estimateReadTime(article.content)}</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between w-full">
                            <div className="flex items-center space-x-2">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={article.author.avatar || "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"} alt={article.author.username} />
                                    <AvatarFallback>{article.author.username?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium">{article.author.name || article.author.username}</span>
                                    {article.author.title && (
                                        <span className="text-xs text-muted-foreground">{article.author.title}</span>
                                    )}
                                </div>
                            </div>
                            <ArrowRight className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                    </CardFooter>
                </Card>
            </Link>
        </motion.div>
    )
}