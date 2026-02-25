import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import AIChallengePanel from '@/components/AIChallengePanel';

const AIPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/95 py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Back Button */}
        <Button
          variant="ghost"
          className="mb-6 gap-2"
          onClick={() => navigate('/dashboard')}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>

        {/* Main AI Panel */}
        <div className="grid grid-cols-1 gap-6">
          <AIChallengePanel isCompact={false} />
        </div>
      </div>
    </div>
  );
};

export default AIPage;
