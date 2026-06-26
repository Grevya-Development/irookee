
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen } from "lucide-react";

const Blog = () => {
  const blogPosts = [
    {
      id: 1,
      title: "The Future of Public Speaking",
      date: "March 15, 2024",
      description: "Explore how technology and virtual reality are transforming the landscape of public speaking.",
      author: "Kavin",
      readTime: "5 min read"
    },
    {
      id: 2,
      title: "Mastering Stage Presence",
      date: "March 12, 2024",
      description: "Essential tips and techniques for commanding attention and engaging your audience effectively.",
      author: "Kavin",
      readTime: "7 min read"
    },
    {
      id: 3,
      title: "The Art of Storytelling",
      date: "March 10, 2024",
      description: "Learn how to captivate your audience through the power of narrative and personal stories.",
      author: "Kavin",
      readTime: "6 min read"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <Navigation />
      
      <div className="container mx-auto px-4 pt-32">
        <div className="flex items-center gap-3 mb-8">
          <BookOpen className="w-8 h-8 text-primary-600" />
          <h1 className="text-4xl font-bold text-gray-900">Blog</h1>
        </div>
        
        <p className="text-xl text-gray-600 mb-12">
          Insights, tips, and stories from the world of professional speaking
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogPosts.map((post) => (
            <Card key={post.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-xl">{post.title}</CardTitle>
                <CardDescription>
                  <div className="flex justify-between text-sm">
                    <span>{post.date}</span>
                    <span>{post.readTime}</span>
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">{post.description}</p>
                <p className="text-sm text-primary-600">By {post.author}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Blog;
