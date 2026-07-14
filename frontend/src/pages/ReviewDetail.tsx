import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Loader2, ArrowLeft, CheckCircle2, AlertCircle, Lock, Send, Sparkles, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../services/api';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const ReviewDetail = () => {
  const { id } = useParams();
  
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'ai', content: string}[]>([]);
  const [isChatting, setIsChatting] = useState(false);
  const [pdfDataUri, setPdfDataUri] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const pdfContainerRef = useRef<HTMLDivElement>(null);
  const [pdfWidth, setPdfWidth] = useState<number>(0);
  const [numPages, setNumPages] = useState<number>();
  const [pageNumber, setPageNumber] = useState<number>(1);

  useEffect(() => {
    const updateWidth = () => {
      if (pdfContainerRef.current) {
        // Leave a little margin (40px)
        setPdfWidth(pdfContainerRef.current.clientWidth - 40);
      }
    };
    setTimeout(updateWidth, 100);
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, [pdfDataUri]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isChatting]);

  const { data: review, isLoading: loadingReview } = useQuery({
    queryKey: ['review', id],
    queryFn: async () => {
      const res = await api.get(`/reviews/${id}`);
      return res.data;
    }
  });

  const { data: status } = useQuery({
    queryKey: ['subscription'],
    queryFn: async () => {
      const res = await api.get('/stripe/subscription-status');
      return res.data;
    }
  });

  const isPro = status?.tier === 'pro';

  // Fetch initial PDF preview by triggering rewrite endpoint
  useEffect(() => {
    const fetchInitialPdf = async () => {
      if (review && isPro && !pdfDataUri) {
        try {
          const response = await api.post(`/reviews/${id}/rewrite`, {}, { responseType: 'blob' });
          const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
          setPdfDataUri(url);
        } catch (error) {
          console.error("Failed to fetch initial PDF preview", error);
        }
      }
    };
    fetchInitialPdf();
  }, [review, isPro, id, pdfDataUri]);


  const handleSendMessage = async () => {
    if (!chatInput.trim() || !isPro) return;

    const userMessage = chatInput.trim();
    setChatInput('');
    setChatHistory(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsChatting(true);

    try {
      const response = await api.post(`/reviews/${id}/chat`, { message: userMessage });
      const { chat_response, pdf_base64 } = response.data;
      
      setChatHistory(prev => [...prev, { role: 'ai', content: chat_response }]);
      
      if (pdf_base64) {
        // Create a blob URL from base64 to display in iframe
        const byteCharacters = atob(pdf_base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        setPdfDataUri(url);
      }
    } catch (error) {
      console.error("Chat failed", error);
      setChatHistory(prev => [...prev, { role: 'ai', content: "Sorry, I couldn't process that request right now." }]);
    } finally {
      setIsChatting(false);
    }
  };

  if (loadingReview) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#FAFAFA]">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (!review) return <div>Review not found.</div>;

  const feedback = JSON.parse(review.feedback_json || '{}');
  const matchScore = feedback.score || 0;
  const atsScore = feedback.ats_score || 0;
  const sectionAnnotations = feedback.section_annotations || [];

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col lg:flex-row overflow-hidden bg-[#FAFAFA]">
      
      {/* LEFT PANEL: Analysis & Chat */}
      <div className="w-full lg:w-1/2 h-[65%] lg:h-full flex flex-col border-b lg:border-b-0 lg:border-r border-neutral-200 bg-white shadow-[0_4px_20px_-10px_rgba(0,0,0,0.1)] lg:shadow-sm overflow-hidden z-10 relative">
        
        {/* Header */}
        <div className="px-8 py-6 border-b border-neutral-100 shrink-0">
          <Link to="/history" className="inline-flex items-center gap-2 text-sm font-medium text-neutral-500 hover:text-black mb-4 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to History
          </Link>
          <h1 className="text-2xl font-bold text-black mb-1 truncate">{review.job_title}</h1>
          <p className="text-sm text-neutral-500">Analysis complete. <span className="font-semibold text-black">Scroll down</span> to view details or chat with AI.</p>
        </div>

        {/* Scrollable Analysis Content */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-6 sm:space-y-8 custom-scrollbar relative shadow-[inset_0_-15px_15px_-15px_rgba(0,0,0,0.05)]">
          
          {/* Scores */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 bg-neutral-50 rounded-2xl p-4 sm:p-5 border border-neutral-100 flex flex-col justify-center items-center">
              <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1">Match Score</span>
              <span className="text-4xl font-black text-black">{matchScore}<span className="text-xl text-neutral-400">/100</span></span>
            </div>
            <div className="flex-1 bg-neutral-50 rounded-2xl p-4 sm:p-5 border border-neutral-100 flex flex-col justify-center items-center">
              <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1">ATS Score</span>
              <span className="text-4xl font-black text-black">{atsScore}<span className="text-xl text-neutral-400">/100</span></span>
            </div>
          </div>

          {/* Section Annotations */}
          {sectionAnnotations.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-black mb-4 uppercase tracking-wider">Section Breakdown</h3>
              <div className="space-y-3">
                {sectionAnnotations.map((ann: any, i: number) => (
                  <div key={i} className={`p-4 rounded-xl border flex items-start gap-3 ${
                    ann.status === 'green' ? 'bg-emerald-50/50 border-emerald-100' : 'bg-red-50/50 border-red-100'
                  }`}>
                    {ann.status === 'green' ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <h4 className="text-sm font-bold text-black mb-0.5">{ann.section}</h4>
                      <p className={`text-xs ${ann.status === 'green' ? 'text-emerald-700' : 'text-red-700'}`}>
                        {ann.note}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pros & Cons */}
          <div>
            <h3 className="text-sm font-bold text-black mb-4 uppercase tracking-wider">Key Findings</h3>
            <div className="grid gap-4">
              <div className="bg-emerald-50/60 rounded-xl p-5 border border-emerald-100">
                <h4 className="text-[11px] font-bold text-emerald-700 flex items-center gap-1.5 mb-3 uppercase tracking-widest">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Strengths
                </h4>
                <ul className="space-y-2">
                  {feedback.pros?.map((pro: string, i: number) => (
                    <li key={i} className="text-[13px] text-emerald-700 flex gap-2 leading-relaxed">
                      <span className="shrink-0 mt-1.5 w-1 h-1 rounded-full bg-emerald-400" />
                      {pro}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="relative bg-red-50/60 rounded-xl p-5 border border-red-100 overflow-hidden">
                <h4 className="text-[11px] font-bold text-red-600 flex items-center gap-1.5 mb-3 uppercase tracking-widest">
                  <AlertCircle className="h-3.5 w-3.5" /> Improvement Areas
                </h4>
                
                <div className={!isPro ? "blur-md select-none pointer-events-none opacity-50" : ""}>
                  <ul className="space-y-2">
                    {feedback.cons?.map((con: string, i: number) => (
                      <li key={i} className="text-[13px] text-red-600 flex gap-2 leading-relaxed">
                        <span className="shrink-0 mt-1.5 w-1 h-1 rounded-full bg-red-400" />
                        {con}
                      </li>
                    ))}
                  </ul>
                </div>

                {!isPro && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/40">
                    <Lock className="h-6 w-6 text-black mb-2" />
                    <span className="text-xs font-bold text-black uppercase tracking-wider mb-2">Pro Feature</span>
                    <Link to="/billing" className="text-xs font-semibold bg-black text-white px-4 py-2 rounded-full hover:bg-neutral-800 transition-colors">
                      Upgrade to View
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Chat History */}
          {chatHistory.length > 0 && (
            <div className="pt-8 border-t border-neutral-100">
              <h3 className="text-sm font-bold text-black mb-4 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="h-4 w-4" /> AI Modifications
              </h3>
              <div className="space-y-4">
                {chatHistory.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-[13px] leading-relaxed ${
                      msg.role === 'user' 
                        ? 'bg-black text-white rounded-br-sm' 
                        : 'bg-neutral-100 text-black rounded-bl-sm border border-neutral-200'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {isChatting && (
                  <div className="flex justify-start">
                    <div className="bg-neutral-100 text-neutral-500 rounded-2xl rounded-bl-sm px-4 py-3 text-[13px] flex items-center gap-2">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> AI is rewriting your resume...
                    </div>
                  </div>
                )}
              </div>
              <div ref={chatEndRef} />
            </div>
          )}
          
          <div className="h-4"></div> {/* Bottom padding spacer */}
        </div>

        {/* Chat Input Box */}
        <div className="p-6 bg-white border-t border-neutral-100 shrink-0 relative">
          {!isPro && (
            <div className="absolute inset-0 z-20 bg-white/60 backdrop-blur-[1px] flex flex-col items-center justify-center">
              <Link to="/billing" className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-neutral-800 transition-colors shadow-lg">
                <Lock className="h-4 w-4" /> Upgrade to Chat with AI
              </Link>
            </div>
          )}
          
          <div className="relative">
            <input
              type="text"
              placeholder="e.g. Make my experience sound more leadership-focused..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              disabled={!isPro || isChatting}
              className="w-full bg-neutral-100 border border-transparent focus:bg-white focus:border-black rounded-full pl-5 pr-12 py-3.5 text-sm text-black outline-none transition-all disabled:opacity-50"
            />
            <button
              onClick={handleSendMessage}
              disabled={!isPro || isChatting || !chatInput.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black text-white rounded-full hover:bg-neutral-800 disabled:opacity-50 disabled:hover:bg-black transition-colors"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <p className="text-[10px] text-neutral-400 text-center mt-3 font-medium uppercase tracking-widest">
            AI updates the PDF instantly
          </p>
        </div>

      </div>

      {/* RIGHT PANEL: Live PDF Viewer */}
      <div className="w-full lg:w-1/2 h-1/2 lg:h-full bg-neutral-100 flex flex-col relative">
        <div className="absolute top-4 left-4 z-10">
          <span className="bg-black/90 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div> Live Preview
          </span>
        </div>
        
        {!isPro ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <div className="w-20 h-20 bg-white rounded-3xl shadow-sm border border-neutral-200 flex items-center justify-center mb-6">
              <Lock className="h-8 w-8 text-neutral-300" />
            </div>
            <h2 className="text-xl font-bold text-black mb-2">Live PDF Generation Locked</h2>
            <p className="text-sm text-neutral-500 max-w-sm mb-6 leading-relaxed">
              Upgrade to Pro to automatically generate a beautifully formatted, ATS-optimized LaTeX PDF from your resume.
            </p>
            <Link to="/billing" className="bg-black text-white px-6 py-3 rounded-full text-sm font-semibold hover:bg-neutral-800 transition-colors">
              Upgrade to Pro
            </Link>
          </div>
        ) : !pdfDataUri ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-neutral-400 mb-4" />
            <p className="text-sm font-medium text-neutral-500">Compiling ATS-optimized PDF...</p>
          </div>
        ) : (
          <div ref={pdfContainerRef} className="flex-1 overflow-y-auto w-full flex flex-col items-center p-5 custom-scrollbar">
            <Document 
              file={pdfDataUri} 
              onLoadSuccess={({ numPages }) => setNumPages(numPages)}
              loading={
                <div className="flex flex-col items-center justify-center p-12">
                  <Loader2 className="h-8 w-8 animate-spin text-neutral-400 mb-4" />
                  <p className="text-sm font-medium text-neutral-500">Rendering PDF...</p>
                </div>
              }
              className="drop-shadow-lg flex flex-col w-full"
            >
              {/* Desktop: Continuous Scroll */}
              <div className="hidden lg:flex flex-col gap-6 w-full items-center">
                {Array.from(new Array(numPages || 1), (el, index) => (
                  <Page 
                    key={`page_desktop_${index + 1}`}
                    pageNumber={index + 1} 
                    width={pdfWidth > 0 ? pdfWidth : undefined}
                    renderTextLayer={true}
                    renderAnnotationLayer={true}
                    className="bg-white shadow-md mx-auto"
                  />
                ))}
              </div>

              {/* Mobile: Pagination */}
              <div className="flex lg:hidden flex-col items-center w-full">
                <Page 
                  key={`page_mobile_${pageNumber}`}
                  pageNumber={pageNumber} 
                  width={pdfWidth > 0 ? pdfWidth : undefined}
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                  className="bg-white shadow-md mx-auto"
                />
                
                {numPages && numPages > 1 && (
                  <div className="flex items-center justify-center gap-4 mt-6 mb-2 bg-white px-5 py-2.5 rounded-full shadow-sm border border-neutral-200 w-fit self-center">
                    <button 
                      onClick={() => setPageNumber(p => Math.max(1, p - 1))}
                      disabled={pageNumber <= 1}
                      className="p-1.5 rounded-full hover:bg-neutral-100 disabled:opacity-50 transition-colors"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <span className="text-sm font-bold tracking-widest text-neutral-600">
                      PAGE {pageNumber} OF {numPages}
                    </span>
                    <button 
                      onClick={() => setPageNumber(p => Math.min(numPages, p + 1))}
                      disabled={pageNumber >= numPages}
                      className="p-1.5 rounded-full hover:bg-neutral-100 disabled:opacity-50 transition-colors"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </div>
            </Document>
            
            {/* Mobile Download Fallback */}
            <a 
              href={pdfDataUri}
              download="ResumeX_Optimized.pdf"
              className="lg:hidden mt-6 bg-black text-white px-6 py-3 rounded-full text-sm font-semibold flex items-center gap-2 shadow-lg hover:bg-neutral-800"
            >
              <Download className="h-4 w-4" /> Download PDF File
            </a>
          </div>
        )}
      </div>

    </div>
  );
};

export default ReviewDetail;
