import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { UploadCloud, FileText, Loader2, AlertCircle, Zap, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const DEMO_EXAMPLES = [
  {
    title: 'Senior Frontend Engineer',
    description: `We're looking for a Senior Frontend Engineer to build high-quality web applications. Requirements: 5+ years with React/TypeScript, experience with state management (Redux, Zustand), REST/GraphQL APIs, CI/CD pipelines, and responsive design. Nice to have: Next.js, testing (Jest, Cypress), design systems.`,
  },
  {
    title: 'Data Scientist',
    description: `Seeking a Data Scientist to develop ML models and derive insights from large datasets. Requirements: 3+ years in data science, proficiency in Python (pandas, scikit-learn, PyTorch), SQL, statistical analysis, and data visualization. Experience with NLP and cloud platforms (AWS/GCP) preferred.`,
  },
  {
    title: 'Product Manager',
    description: `Looking for a Product Manager to define product strategy and roadmap. Requirements: 4+ years in product management, experience with agile methodologies, user research, A/B testing, and cross-functional collaboration. Strong analytical skills and familiarity with analytics tools required.`,
  },
];

const Dashboard = () => {
  const [file, setFile] = useState<File | null>(null);
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const navigate = useNavigate();

  const { data: status } = useQuery({
    queryKey: ['subscription'],
    queryFn: async () => {
      const res = await api.get('/stripe/subscription-status');
      return res.data;
    }
  });

  const analyzeMutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("Please upload a PDF resume");
      if (!jobTitle) throw new Error("Please enter a job title");
      if (!jobDescription) throw new Error("Please enter a job description");

      const formData = new FormData();
      formData.append('resume', file);
      formData.append('job_title', jobTitle);
      formData.append('job_description', jobDescription);

      const res = await api.post('/reviews/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return res.data;
    },
    onSuccess: (data) => {
      navigate(`/review/${data.id}`);
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const loadExample = (example: typeof DEMO_EXAMPLES[0]) => {
    if (jobTitle === example.title && jobDescription === example.description) {
      setJobTitle('');
      setJobDescription('');
    } else {
      setJobTitle(example.title);
      setJobDescription(example.description);
    }
  };

  const isPro = status?.tier === 'pro';
  const reachedLimit = !isPro && (status?.usage_count || 0) >= (status?.max_free_uses || 3);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-[360px] bg-[#111] text-white flex-col p-10 relative overflow-hidden shrink-0">
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-neutral-800/20 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-bold">ResumeX</span>
          </div>

          {status && (
            <div className="bg-white/[0.06] border border-white/10 rounded-2xl p-5 mb-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-neutral-400">Your Plan</span>
                <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${isPro ? 'bg-white text-black' : 'bg-white/10 text-neutral-300'}`}>
                  {isPro ? 'Pro' : 'Free'}
                </span>
              </div>
              {!isPro && (
                <>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-neutral-500">Analyses used</span>
                    <span className="text-white font-semibold">{status.usage_count}/{status.max_free_uses}</span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white rounded-full transition-all"
                      style={{ width: `${Math.min(((status?.usage_count || 0) / (status?.max_free_uses || 1)) * 100, 100)}%` }}
                    />
                  </div>
                </>
              )}
              {isPro && (
                <p className="text-xs text-neutral-400">Unlimited analyses available</p>
              )}
            </div>
          )}
        </div>

        <div className="relative z-10">
          <h3 className="text-sm font-semibold text-neutral-300 mb-4">How it works</h3>
          <div className="space-y-4">
            {[
              { step: '1', text: 'Enter the job title and description' },
              { step: '2', text: 'Upload your resume as PDF' },
              { step: '3', text: 'Get AI-powered match analysis' },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-3">
                <span className="w-6 h-6 bg-white/10 rounded-lg flex items-center justify-center text-[11px] font-bold text-neutral-400 shrink-0">{item.step}</span>
                <span className="text-sm text-neutral-400 leading-relaxed">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-xs text-neutral-600 mt-auto">
          Powered by LLaMA 3.1 &amp; Gemini
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="flex-1 flex items-start justify-center px-6 py-10 bg-neutral-50 overflow-y-auto">
        <div className="w-full max-w-xl">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-black mb-1">Analyze Resume</h2>
              <p className="text-sm text-neutral-500">Paste a job description and upload your resume.</p>
            </div>
          </div>

          {/* Mobile free tier display */}
          {status && !isPro && (
            <div className="lg:hidden mb-6 p-4 bg-neutral-100 rounded-xl border border-neutral-200">
              <div className="flex justify-between text-xs mb-2">
                <span className="text-neutral-500 font-medium">Free Analyses Used</span>
                <span className="text-black font-bold">{status.usage_count}/{status.max_free_uses}</span>
              </div>
              <div className="h-1.5 bg-neutral-200 rounded-full overflow-hidden mb-3">
                <div
                  className="h-full bg-black rounded-full transition-all"
                  style={{ width: `${Math.min(((status?.usage_count || 0) / (status?.max_free_uses || 1)) * 100, 100)}%` }}
                />
              </div>
              {reachedLimit && (
                <Link to="/billing" className="block text-center text-xs font-semibold text-white bg-black py-2 rounded-lg hover:bg-neutral-800 transition-colors">
                  Upgrade to Pro
                </Link>
              )}
            </div>
          )}

          {analyzeMutation.isError && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex gap-2.5">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <p>{(analyzeMutation.error as any).response?.data?.detail || analyzeMutation.error.message}</p>
            </div>
          )}

          {/* Demo Examples */}
          <div className="mb-5 space-y-2.5">
            <span className="text-[13px] font-medium text-neutral-500 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" /> Demo Examples
            </span>
            <div className="flex flex-wrap gap-2">
              {DEMO_EXAMPLES.map((ex, i) => {
                const isSelected = jobTitle === ex.title && jobDescription === ex.description;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => loadExample(ex)}
                    className={`text-[13px] font-medium px-3.5 py-1.5 rounded-full border transition-all ${
                      isSelected 
                        ? 'bg-black text-white border-black' 
                        : 'bg-white text-neutral-600 border-neutral-200 hover:border-black hover:text-black hover:shadow-sm'
                    }`}
                  >
                    {ex.title}
                  </button>
                );
              })}
            </div>
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); analyzeMutation.mutate(); }}
            className="space-y-5"
          >
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-neutral-600">Job Title</label>
              <input
                type="text"
                required
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-xl text-sm text-black placeholder-neutral-400 outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                placeholder="e.g. Senior Frontend Engineer"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-neutral-600">Job Description</label>
              <textarea
                required
                rows={6}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-xl text-sm text-black placeholder-neutral-400 outline-none focus:border-black focus:ring-1 focus:ring-black transition-all resize-none"
                placeholder="Paste the full job description here..."
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-neutral-600">Resume (PDF)</label>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center transition-all cursor-pointer ${
                  dragActive
                    ? 'border-black bg-neutral-100'
                    : file
                      ? 'border-neutral-300 bg-neutral-50'
                      : 'border-neutral-300 bg-white hover:bg-neutral-50 hover:border-neutral-400'
                }`}
              >
                <input
                  type="file"
                  accept=".pdf"
                  required
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                {file ? (
                  <div className="flex flex-col items-center text-black">
                    <div className="w-12 h-12 bg-neutral-900 rounded-xl flex items-center justify-center mb-3">
                      <FileText className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-sm font-semibold truncate max-w-[280px]">{file.name}</span>
                    <span className="text-xs text-neutral-400 mt-1">Click to change file</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-neutral-400">
                    <div className="w-12 h-12 bg-neutral-100 rounded-xl flex items-center justify-center mb-3">
                      <UploadCloud className="h-6 w-6 text-neutral-400" />
                    </div>
                    <span className="text-sm font-medium text-neutral-600">Drop your PDF here or click to browse</span>
                    <span className="text-xs text-neutral-400 mt-1">Only PDF files supported</span>
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={analyzeMutation.isPending || reachedLimit}
              className="w-full py-3.5 bg-black text-white text-sm font-semibold rounded-xl hover:bg-neutral-800 transition-all flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed mt-2 group"
            >
              {analyzeMutation.isPending ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Analyzing...</>
              ) : reachedLimit ? (
                'Free Limit Reached — Upgrade to Pro'
              ) : (
                <><Zap className="h-4 w-4" /> Analyze Resume</>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
