import { useParams } from 'react-router-dom';
import { ArticleDetail } from '@/components/articleDetail';

export default function ArticlePost() {
  const { id } = useParams<{ id: string }>();

  return (
      <div className="min-h-screen flex flex-col">
        <main className="flex-1">
          <ArticleDetail id={id} />
        </main>
      </div>
  );
};