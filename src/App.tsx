import { Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './components/theme-provider'
import Navbar from './components/navbar'
import { Home } from './pages/home';
import { NotFound } from "./pages/not-found.tsx";
import Articles from './pages/articles.tsx';
import ArticlePost from './pages/article-post.tsx';
import AuthRoute from './pages/auth.tsx';
import DashboardLayout from './components/dashboard-layout.tsx';
import Dashboard from './pages/dashboard.tsx';

export default function App() {
  return (
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <Routes>
          <Route path="/" element={<Navbar />}>
            <Route element={<Home />} index />
            <Route path="about" element={<></>} />
            <Route path="articles" element={<Articles />} />
            <Route path="articles/:id" element={<ArticlePost />} />
            <Route path="auth" element={<AuthRoute/>} />
            <Route path="*" element={<NotFound />} />
          </Route>
          <Route path="/dashboard" element={<DashboardLayout />}>
          <Route element={<Dashboard />} index />
          </Route>
        </Routes>
      </ThemeProvider>
  );
}
