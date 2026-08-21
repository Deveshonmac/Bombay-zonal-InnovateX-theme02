import React, { useState } from 'react';
import {
  GraduationCap,
  BookOpen,
  ShoppingBag,
  HelpCircle,
  ExternalLink,
  ShieldCheck,
  Star,
  CheckCircle2,
  XCircle,
  Sparkles,
  Award,
  Zap,
  Wrench,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { MOCK_ARTICLES, MOCK_QUIZ_QUESTIONS, MOCK_PURIFIERS } from '../data/mockData';
import { ArticleCaseStudy, QuizQuestion, PurifierProduct } from '../types';

interface AwarenessHubProps {
  initialSubTab?: 'articles' | 'quiz' | 'store' | 'diy';
}

export const AwarenessHub: React.FC<AwarenessHubProps> = ({ initialSubTab = 'articles' }) => {
  const { recordQuizSuccess, user } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'articles' | 'quiz' | 'store' | 'diy'>(initialSubTab);
  const [selectedArticle, setSelectedArticle] = useState<ArticleCaseStudy | null>(null);

  // Sync if initialSubTab changes
  React.useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  // Quiz state
  const [currentQuizIndex, setCurrentQuizIndex] = useState<number>(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [quizScore, setQuizScore] = useState<number>(0);
  const [quizFinished, setQuizFinished] = useState<boolean>(false);
  const [answeredState, setAnsweredState] = useState<boolean>(false);

  // Store filter
  const [priceFilter, setPriceFilter] = useState<number>(50000);

  const filteredPurifiers = MOCK_PURIFIERS.filter((p) => p.price <= priceFilter);

  const handleAnswer = (optionIndex: number) => {
    if (answeredState) return;
    setSelectedAnswer(optionIndex);
    setAnsweredState(true);
    if (optionIndex === MOCK_QUIZ_QUESTIONS[currentQuizIndex].correctIndex) {
      setQuizScore((s) => s + 1);
    }
  };

  const handleNextQuiz = () => {
    if (currentQuizIndex + 1 < MOCK_QUIZ_QUESTIONS.length) {
      setCurrentQuizIndex((i) => i + 1);
      setSelectedAnswer(null);
      setAnsweredState(false);
    } else {
      setQuizFinished(true);
      recordQuizSuccess((quizScore + 1) * 20);
    }
  };

  const resetQuiz = () => {
    setCurrentQuizIndex(0);
    setSelectedAnswer(null);
    setQuizScore(0);
    setQuizFinished(false);
    setAnsweredState(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Header & Sub-Tabs */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            <h1 className="font-extrabold text-xl text-zinc-900 dark:text-zinc-100">
              Awareness, Education & Clean Air Protection Hub
            </h1>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Atmospheric physics explainers, interactive mastery quiz, Corsi-Rosenthal DIY blueprints, and tested HEPA hardware.
          </p>
        </div>

        {/* Sub-Tabs Selector */}
        <div className="flex items-center p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-xs font-bold shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('articles')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
              activeSubTab === 'articles'
                ? 'bg-white dark:bg-zinc-900 text-sky-600 dark:text-sky-400 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Case Studies</span>
          </button>

          <button
            onClick={() => setActiveSubTab('diy')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
              activeSubTab === 'diy'
                ? 'bg-white dark:bg-zinc-900 text-sky-600 dark:text-sky-400 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>DIY Purifier Guide</span>
          </button>

          <button
            onClick={() => setActiveSubTab('quiz')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
              activeSubTab === 'quiz'
                ? 'bg-white dark:bg-zinc-900 text-sky-600 dark:text-sky-400 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Clean Air Quiz</span>
          </button>

          <button
            onClick={() => setActiveSubTab('store')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
              activeSubTab === 'store'
                ? 'bg-white dark:bg-zinc-900 text-sky-600 dark:text-sky-400 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Tested Purifiers</span>
          </button>
        </div>
      </div>

      {/* Sub-View 1: Educational Articles */}
      {activeSubTab === 'articles' && (
        <div className="space-y-6">
          {selectedArticle ? (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 sm:p-8 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-6">
              <button
                onClick={() => setSelectedArticle(null)}
                className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
              >
                ← Back to Articles Library
              </button>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-black uppercase bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300">
                    {selectedArticle.category}
                  </span>
                  <span className="text-xs text-zinc-400">•</span>
                  <span className="text-xs text-zinc-500">{selectedArticle.readTime}</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white">
                  {selectedArticle.title}
                </h2>
                <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  {selectedArticle.subtitle}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Published by <strong>{selectedArticle.author}</strong> ({selectedArticle.authorTitle}) • {selectedArticle.date}
                </p>
              </div>

              {/* Key Takeaways Box */}
              <div className="p-4 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 text-xs space-y-2">
                <span className="font-extrabold text-sky-900 dark:text-sky-200 uppercase tracking-wide">
                  Key Scientific Takeaways:
                </span>
                <ul className="list-disc list-inside space-y-1 text-zinc-700 dark:text-zinc-300">
                  {selectedArticle.keyTakeaways.map((t, idx) => (
                    <li key={idx}>{t}</li>
                  ))}
                </ul>
              </div>

              <div className="prose dark:prose-invert max-w-none text-zinc-700 dark:text-zinc-300 text-sm leading-relaxed space-y-4">
                {selectedArticle.content.map((p, idx) => (
                  <p key={idx}>{p}</p>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {MOCK_ARTICLES.map((art) => (
                <div
                  key={art.id}
                  onClick={() => setSelectedArticle(art)}
                  className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:border-sky-300 dark:hover:border-sky-700 transition-all cursor-pointer flex flex-col justify-between space-y-4 group"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                        {art.category}
                      </span>
                      <span className="text-zinc-400 text-[11px]">{art.readTime}</span>
                    </div>

                    <h3 className="font-extrabold text-base text-zinc-900 dark:text-zinc-100 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                      {art.title}
                    </h3>

                    <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-3 leading-relaxed">
                      {art.summary}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
                    <span>{art.author}</span>
                    <span className="font-bold text-sky-600 dark:text-sky-400 group-hover:translate-x-1 transition-transform">
                      Read Guide →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sub-View 2: DIY Corsi-Rosenthal Purifier Blueprint */}
      {activeSubTab === 'diy' && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 sm:p-8 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h2 className="text-xl font-extrabold text-zinc-900 dark:text-white">
                  The Corsi-Rosenthal Box Blueprint & Build Guide
                </h2>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Open-source, ultra-high CADR (&gt;550 CFM) DIY air purifier delivering hospital-grade particulate clearance for under $70.
              </p>
            </div>

            <span className="px-3 py-1 rounded-xl text-xs font-black uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 shrink-0">
              Lab-Validated: 99.4% PM2.5 Clearance
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-700/60 space-y-2">
              <span className="font-bold text-zinc-900 dark:text-zinc-100 uppercase text-[10px]">1. Required Materials ($65)</span>
              <ul className="space-y-1 text-zinc-600 dark:text-zinc-300">
                <li>• 1x 20" Box Fan (e.g. Lasko 20" 3-speed)</li>
                <li>• 4x MERV 13 (or HEPA) 20x20x2" furnace filters</li>
                <li>• 1x 20x20" cardboard base plate</li>
                <li>• 1x Roll heavy-duty Gorilla / Duct tape</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-700/60 space-y-2">
              <span className="font-bold text-zinc-900 dark:text-zinc-100 uppercase text-[10px]">2. 20-Minute Assembly</span>
              <ul className="space-y-1 text-zinc-600 dark:text-zinc-300">
                <li>• Tape 4 MERV 13 filters into a cube (airflow arrows facing inward).</li>
                <li>• Tape cardboard plate to the bottom opening.</li>
                <li>• Mount box fan on top pointing UP (blowing exhaust ceiling-ward).</li>
                <li>• Cut cardboard shroud circle (15" diameter) over fan face to prevent backpressure.</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-700/60 space-y-2">
              <span className="font-bold text-zinc-900 dark:text-zinc-100 uppercase text-[10px]">3. Performance & CADR</span>
              <ul className="space-y-1 text-zinc-600 dark:text-zinc-300">
                <li>• <strong>580 CFM CADR</strong> (Outperforms $600 commercial purifiers).</li>
                <li>• Cleans a 600 sq ft room in ~12 minutes.</li>
                <li>• Low noise (Speed 1 = 48dB).</li>
                <li>• 6-month continuous filter lifespan.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Sub-View 3: Interactive Clean Air Quiz */}
      {activeSubTab === 'quiz' && (
        <div className="max-w-2xl mx-auto bg-white dark:bg-zinc-900 rounded-2xl p-6 sm:p-8 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-6">
          {!quizFinished ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between text-xs text-zinc-400 pb-2 border-b border-zinc-100 dark:border-zinc-800">
                <span className="font-bold text-zinc-900 dark:text-zinc-100">
                  Question {currentQuizIndex + 1} of {MOCK_QUIZ_QUESTIONS.length}
                </span>
                <span>Current Score: {quizScore}</span>
              </div>

              <h2 className="text-lg font-black text-zinc-900 dark:text-white leading-snug">
                {MOCK_QUIZ_QUESTIONS[currentQuizIndex].question}
              </h2>

              {/* Options */}
              <div className="space-y-2.5">
                {MOCK_QUIZ_QUESTIONS[currentQuizIndex].options.map((opt, idx) => {
                  const isCorrect = idx === MOCK_QUIZ_QUESTIONS[currentQuizIndex].correctIndex;
                  const isSelected = selectedAnswer === idx;
                  let btnStyle = 'bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200/80 dark:border-zinc-700/80 text-zinc-800 dark:text-zinc-200';

                  if (answeredState) {
                    if (isCorrect) {
                      btnStyle = 'bg-emerald-100 dark:bg-emerald-950 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-bold';
                    } else if (isSelected) {
                      btnStyle = 'bg-rose-100 dark:bg-rose-950 border-rose-500 text-rose-900 dark:text-rose-200 font-bold';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleAnswer(idx)}
                      disabled={answeredState}
                      className={`w-full p-3.5 rounded-xl border text-left text-xs transition-all flex items-start gap-3 ${btnStyle}`}
                    >
                      <span className="w-5 h-5 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-black text-[11px] flex items-center justify-center shrink-0">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span>{opt}</span>
                    </button>
                  );
                })}
              </div>

              {/* Scientific Explanation Box after answering */}
              {answeredState && (
                <div className="p-4 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 text-xs space-y-1">
                  <div className="font-bold text-sky-900 dark:text-sky-200 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-sky-500" />
                    <span>Atmospheric Science Explanation:</span>
                  </div>
                  <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">
                    {MOCK_QUIZ_QUESTIONS[currentQuizIndex].explanation}
                  </p>
                </div>
              )}

              {/* Next Button */}
              {answeredState && (
                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleNextQuiz}
                    className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-xs"
                  >
                    {currentQuizIndex + 1 < MOCK_QUIZ_QUESTIONS.length ? 'Next Question →' : 'View Final Results'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center space-y-5 py-6">
              <Award className="w-16 h-16 text-amber-500 mx-auto animate-bounce" />
              <div>
                <h2 className="text-2xl font-black text-zinc-900 dark:text-white">
                  Quiz Completed!
                </h2>
                <p className="text-sm text-zinc-500 mt-1">
                  You scored <strong className="text-sky-600 dark:text-sky-400 text-lg">{quizScore}</strong> out of{' '}
                  <strong>{MOCK_QUIZ_QUESTIONS.length}</strong>
                </p>
              </div>

              <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
                {quizScore === MOCK_QUIZ_QUESTIONS.length
                  ? 'Outstanding Mastery! You earned +100 Clean Air Knowledge points!'
                  : 'Great effort! You earned knowledge points. Re-read the educational articles to achieve full mastery.'}
              </p>

              <button
                onClick={resetQuiz}
                className="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-xs"
              >
                Retake Quiz
              </button>
            </div>
          )}
        </div>
      )}

      {/* Sub-View 4: Curated Protection Store & Affiliate Monetization */}
      {activeSubTab === 'store' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                Lab-Tested True HEPA Hardware & CADR Ratings
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Independent particle clearance benchmarks with transparent referral commissions supporting our open clean air network.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-zinc-400">Max Budget:</span>
              <select
                value={priceFilter}
                onChange={(e) => setPriceFilter(Number(e.target.value))}
                className="p-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 font-bold"
              >
                <option value={5000}>Under ₹5,000</option>
                <option value={15000}>Under ₹15,000</option>
                <option value={25000}>Under ₹25,000</option>
                <option value={50000}>All Prices (Under ₹50,000)</option>
              </select>
            </div>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredPurifiers.map((prod) => (
              <div
                key={prod.id}
                className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-zinc-400">
                        {prod.brand}
                      </span>
                      <h3 className="font-extrabold text-base text-zinc-900 dark:text-zinc-100 leading-snug">
                        {prod.name}
                      </h3>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-lg font-black text-sky-600 dark:text-sky-400">
                        ₹{prod.price.toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-amber-500 mb-3">
                    <Star className="w-3.5 h-3.5 fill-amber-500" />
                    <span className="font-bold text-zinc-900 dark:text-zinc-100">{prod.rating}</span>
                    <span className="text-zinc-400">({prod.reviewsCount} reviews)</span>
                  </div>

                  {/* Spec Chips */}
                  <div className="grid grid-cols-3 gap-1.5 p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-700/60 text-center text-[10px] font-semibold text-zinc-600 dark:text-zinc-300 mb-3">
                    <div>
                      <span className="block text-zinc-400 text-[9px] uppercase">CADR Airflow</span>
                      <strong className="text-zinc-900 dark:text-zinc-100">{prod.cadrCfm} CFM</strong>
                    </div>
                    <div>
                      <span className="block text-zinc-400 text-[9px] uppercase">Coverage</span>
                      <strong className="text-zinc-900 dark:text-zinc-100">{prod.coverageSqFt} sq ft</strong>
                    </div>
                    <div>
                      <span className="block text-zinc-400 text-[9px] uppercase">Noise</span>
                      <strong className="text-zinc-900 dark:text-zinc-100">{prod.noiseLevelDb} dB</strong>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs">
                    {prod.features.map((feat, fIdx) => (
                      <div key={fIdx} className="flex items-start gap-1.5 text-zinc-600 dark:text-zinc-400">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                  <span className="text-[11px] text-zinc-400">
                    Annual Filter: ₹{prod.annualFilterCost.toLocaleString('en-IN')}/yr
                  </span>

                  <a
                    href={prod.affiliateUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold flex items-center gap-1 shadow-xs transition-all"
                  >
                    <span>Check Price</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
