import { Link } from 'react-router-dom';
import { ArrowRight, FileText, Zap, ShieldCheck, Check, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { token } = useAuth();

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative py-28 lg:py-40 bg-[#111] text-white overflow-hidden">
        {/* Subtle radial glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-neutral-800/40 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.07] border border-white/[0.12] text-xs font-medium text-neutral-400 mb-10">
            <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Powered by Groq &amp; LLaMA 3.3
          </div>
          
          <h1 className="text-5xl md:text-6xl lg:text-[4.5rem] font-extrabold tracking-tight text-white mb-6 leading-[1.08]">
            Land your dream job<br />
            <span className="bg-gradient-to-r from-neutral-400 to-neutral-500 bg-clip-text text-transparent">with AI-powered insights</span>
          </h1>
          
          <p className="text-[17px] text-neutral-400 mb-12 max-w-lg mx-auto leading-relaxed">
            Upload your resume and a job description. Get an instant match score with actionable feedback in seconds.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to={token ? "/dashboard" : "/register"}
              className="inline-flex items-center gap-2.5 px-7 py-3.5 bg-white text-black text-sm font-semibold rounded-full hover:bg-neutral-200 transition-all group shadow-lg shadow-white/10"
            >
              Get Started for Free
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-7 py-3.5 text-sm font-medium text-neutral-400 hover:text-white rounded-full border border-white/15 hover:border-white/30 transition-all"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* Social Proof Bar */}
      <section className="py-8 bg-white border-b border-neutral-100">
        <div className="max-w-4xl mx-auto px-6 flex items-center justify-center gap-10 flex-wrap">
          {[
            { value: '10,000+', label: 'Resumes Analyzed' },
            { value: '95%', label: 'User Satisfaction' },
            { value: '< 30s', label: 'Analysis Time' },
          ].map((stat, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-2xl font-bold text-black">{stat.value}</span>
              <span className="text-xs text-neutral-400 font-medium">{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-neutral-100">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold tracking-widest text-neutral-400 uppercase mb-3">How it works</p>
            <h2 className="text-3xl font-bold text-black">Three simple steps</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: FileText, step: '01', title: 'Upload Resume', desc: 'Drop your PDF resume and paste the target job description.' },
              { icon: Zap, step: '02', title: 'AI Analysis', desc: 'Our AI scores your fit and identifies strengths and gaps instantly.' },
              { icon: ShieldCheck, step: '03', title: 'Get Feedback', desc: 'Receive specific suggestions to improve your match score.' },
            ].map((feature, i) => (
              <div key={i} className="bg-white rounded-2xl p-7 shadow-sm hover:shadow-md transition-all group">
                <div className="flex items-center justify-between mb-5">
                  <div className="w-11 h-11 bg-neutral-900 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                    <feature.icon className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-[11px] font-bold text-neutral-300 tracking-wider">{feature.step}</span>
                </div>
                <h3 className="text-[15px] font-semibold text-black mb-2">{feature.title}</h3>
                <p className="text-sm text-neutral-500 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold tracking-widest text-neutral-400 uppercase mb-3">Pricing</p>
            <h2 className="text-3xl font-bold text-black">Start free, upgrade anytime</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Free */}
            <div className="bg-neutral-50 rounded-2xl p-8 flex flex-col border border-neutral-200/60">
              <h3 className="text-lg font-bold text-black mb-1">Starter</h3>
              <p className="text-sm text-neutral-500 mb-6">Perfect to test the waters</p>
              <div className="text-4xl font-extrabold text-black mb-8">
                $0<span className="text-base font-medium text-neutral-400">/mo</span>
              </div>
              
              <ul className="space-y-3 mb-8 flex-1">
                {['3 resume analyses', 'ATS Match Scoring', 'Strengths & Weaknesses'].map((f, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-sm text-neutral-600">
                    <Check className="h-4 w-4 text-neutral-400" />
                    {f}
                  </li>
                ))}
              </ul>
              
              <Link
                to={token ? "/dashboard" : "/register"}
                className="w-full py-3 text-sm font-semibold text-center border border-neutral-300 rounded-full text-black hover:bg-white transition-colors"
              >
                Get Started
              </Link>
            </div>

            {/* Pro */}
            <div className="bg-black text-white rounded-2xl p-8 flex flex-col relative shadow-xl shadow-black/10">
              <div className="absolute -top-3 right-6">
                <span className="text-[11px] font-semibold bg-white text-black px-3.5 py-1 rounded-full inline-flex items-center gap-1 shadow-sm">
                  <Star className="h-3 w-3" /> Popular
                </span>
              </div>
              <h3 className="text-lg font-bold mb-1">Pro</h3>
              <p className="text-sm text-neutral-400 mb-6">For serious job seekers</p>
              <div className="text-4xl font-extrabold mb-8">
                $9.99<span className="text-base font-medium text-neutral-500">/mo</span>
              </div>
              
              <ul className="space-y-3 mb-8 flex-1">
                {['Unlimited analyses', 'Interactive AI Resume Chat', 'Live PDF Generation', 'Advanced LLaMA 3.3 70B'].map((f, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-sm text-neutral-400">
                    <Check className="h-4 w-4 text-neutral-500" />
                    {f}
                  </li>
                ))}
              </ul>
              
              <Link
                to={token ? "/billing" : "/register"}
                className="w-full py-3 text-sm font-semibold text-center bg-white text-black rounded-full hover:bg-neutral-100 transition-colors"
              >
                Upgrade to Pro
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-neutral-100">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-black mb-4">Ready to stand out?</h2>
          <p className="text-neutral-500 mb-8 max-w-md mx-auto">Join thousands of job seekers who've improved their resumes with ResumeX.</p>
          <Link
            to={token ? "/dashboard" : "/register"}
            className="inline-flex items-center gap-2.5 px-7 py-3.5 bg-black text-white text-sm font-semibold rounded-full hover:bg-neutral-800 transition-colors group"
          >
            Start Analyzing
            <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
