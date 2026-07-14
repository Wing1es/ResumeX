import { useQuery } from '@tanstack/react-query';
import { Loader2, FileText, Clock, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const History = () => {
  const { data: reviews, isLoading: loadingReviews } = useQuery({
    queryKey: ['reviews'],
    queryFn: async () => {
      const res = await api.get('/reviews/');
      return res.data;
    }
  });

  const getScoreStyle = (score: number) => {
    if (score >= 80) return { bg: 'bg-emerald-500', text: 'text-emerald-600', light: 'bg-emerald-50', border: 'border-emerald-100', label: 'Excellent' };
    if (score >= 60) return { bg: 'bg-amber-500', text: 'text-amber-600', light: 'bg-amber-50', border: 'border-amber-100', label: 'Good' };
    return { bg: 'bg-red-500', text: 'text-red-500', light: 'bg-red-50', border: 'border-red-100', label: 'Needs Work' };
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-black mb-1">Analysis History</h1>
        <p className="text-sm text-neutral-500">
          {reviews?.length ? `${reviews.length} analysis${reviews.length > 1 ? 'es' : ''} completed` : 'Your past resume analyses will appear here'}
        </p>
      </div>

      {loadingReviews ? (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-neutral-300 mb-3" />
          <p className="text-sm text-neutral-400">Loading your analyses...</p>
        </div>
      ) : reviews?.length === 0 ? (
        <div className="bg-white border border-dashed border-neutral-300 rounded-2xl p-16 text-center">
          <div className="w-14 h-14 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText className="h-7 w-7 text-neutral-400" />
          </div>
          <h3 className="text-base font-semibold text-black mb-1">No analyses yet</h3>
          <p className="text-sm text-neutral-500">Upload your first resume to get started.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {reviews?.map((review: any) => {
            const feedback = JSON.parse(review.feedback_json || '{}');
            const score = feedback.score || 0;
            const atsScore = feedback.ats_score || 0;
            const style = getScoreStyle(score);

            return (
              <Link
                key={review.id}
                to={`/review/${review.id}`}
                className="bg-white rounded-2xl border border-neutral-200/60 hover:border-black/20 hover:shadow-md transition-all flex items-center gap-5 group px-6 py-5"
              >
                {/* Score Circle */}
                <div className="relative w-14 h-14 shrink-0">
                  <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                    <circle cx="28" cy="28" r="24" fill="none" stroke="#f5f5f5" strokeWidth="4" />
                    <circle
                      cx="28" cy="28" r="24" fill="none"
                      stroke="currentColor"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeDasharray={`${(score / 100) * 150.8} 150.8`}
                      className={style.text}
                    />
                  </svg>
                  <span className={`absolute inset-0 flex items-center justify-center text-sm font-bold ${style.text}`}>
                    {score}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-[15px] font-semibold text-black truncate group-hover:underline decoration-1 underline-offset-4">{review.job_title}</h3>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${style.light} ${style.text}`}>
                      {style.label}
                    </span>
                    {atsScore > 0 && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 border border-neutral-200">
                        ATS Score: {atsScore}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-400 flex items-center gap-1.5">
                    <Clock className="h-3 w-3" />
                    {new Date(review.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                  {feedback.summary && (
                    <p className="text-xs text-neutral-500 mt-2 line-clamp-1">{feedback.summary}</p>
                  )}
                </div>

                {/* Open Icon */}
                <div className="text-neutral-300 group-hover:text-black transition-colors shrink-0">
                  <ChevronRight className="h-5 w-5" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default History;
