import React, { useState } from 'react';
import {
  BookOpen,
  HelpCircle,
  Eye,
  EyeOff,
  ChevronRight,
  ExternalLink,
  Layers,
  Radio,
  Cpu,
  ArrowRight,
  Lightbulb,
} from 'lucide-react';
import { LEARNING_MODULES, LearningModule } from '../data/learningModules';

interface LearningGuideViewProps {
  onGoToLab: () => void;
  explanationMode: 'beginner' | 'engineering';
}

export const LearningGuideView: React.FC<LearningGuideViewProps> = ({
  onGoToLab,
  explanationMode,
}) => {
  const [selectedModuleId, setSelectedModuleId] = useState<number>(1);
  const [revealedAnswers, setRevealedAnswers] = useState<Record<string, boolean>>({});

  const currentModule =
    LEARNING_MODULES.find((m) => m.id === selectedModuleId) || LEARNING_MODULES[0];

  const toggleAnswer = (key: string) => {
    setRevealedAnswers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const categories = Array.from(new Set(LEARNING_MODULES.map((m) => m.category)));

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
      {/* Module Selector Sidebar */}
      <div className="md:col-span-4 space-y-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3">
            Learning Curriculum (14 Modules)
          </h2>

          <div className="space-y-4 max-h-[620px] overflow-y-auto pr-1">
            {categories.map((cat) => (
              <div key={cat} className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-2 py-1">
                  {cat}
                </span>

                {LEARNING_MODULES.filter((m) => m.category === cat).map((mod) => {
                  const isSelected = mod.id === selectedModuleId;
                  return (
                    <button
                      key={mod.id}
                      onClick={() => setSelectedModuleId(mod.id)}
                      className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition-colors ${
                        isSelected
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span className="truncate">
                        {mod.id}. {mod.title}
                      </span>
                      <ChevronRight
                        className={`w-3.5 h-3.5 shrink-0 ml-1 ${
                          isSelected ? 'text-white' : 'text-slate-400'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Module Content Area */}
      <div className="md:col-span-8 space-y-5">
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-5">
          {/* Header */}
          <div className="border-b border-slate-100 pb-4">
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200 mb-2 inline-block">
              Module {currentModule.id} of 14 &middot; {currentModule.category}
            </span>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {currentModule.title}
            </h1>
          </div>

          {/* Simple Explanation */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-1 flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
              Plain-English Explanation
            </h3>
            <p className="text-xs text-slate-700 leading-relaxed">
              {currentModule.simpleExplanation}
            </p>
          </div>

          {/* Technical Engineering Explanation */}
          <div className="p-4 bg-sky-50/50 border border-sky-200 rounded-lg">
            <h3 className="text-xs font-bold text-sky-900 uppercase tracking-wide mb-1 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-sky-700" />
              Engineering Protocol Deep-Dive
            </h3>
            <p className="text-xs text-sky-950 leading-relaxed font-sans">
              {currentModule.technicalExplanation}
            </p>
          </div>

          {/* Real-world Analogy */}
          <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-lg">
            <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wide mb-1">
              Real-World Analogy
            </h3>
            <p className="text-xs text-amber-950 leading-relaxed italic">
              "{currentModule.realWorldAnalogy}"
            </p>
          </div>

          {/* Visual Diagram */}
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-500" />
              Architecture Diagram
            </h3>
            <div className="bg-slate-900 text-emerald-400 p-4 rounded-lg font-mono text-[11px] overflow-x-auto leading-relaxed border border-slate-800">
              <pre>{currentModule.visualDiagram}</pre>
            </div>
          </div>

          {/* Hands-on Experiment Link */}
          <div className="p-4 bg-slate-100 rounded-lg flex items-center justify-between gap-3 text-xs">
            <div>
              <span className="font-semibold text-slate-900 block">Practical Lab Experiment</span>
              <p className="text-slate-600 text-[11px] mt-0.5">{currentModule.practicalExperiment}</p>
            </div>
            <button
              onClick={onGoToLab}
              className="px-3.5 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white font-medium flex items-center gap-1 whitespace-nowrap shadow-xs"
            >
              Open in Lab
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Review Quiz (3 Questions) */}
          <div className="pt-3 border-t border-slate-100 space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-sky-600" />
              Knowledge Check Questions
            </h3>

            <div className="space-y-2.5">
              {currentModule.questions.map((q, idx) => {
                const qKey = `m-${currentModule.id}-q-${idx}`;
                const isAnswerRevealed = !!revealedAnswers[qKey];

                return (
                  <div
                    key={idx}
                    className="p-3 border border-slate-200 rounded-lg text-xs bg-white space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-semibold text-slate-900">
                        Q{idx + 1}: {q.question}
                      </span>
                      <button
                        onClick={() => toggleAnswer(qKey)}
                        className="text-[11px] text-sky-700 hover:text-sky-900 font-medium shrink-0 flex items-center gap-1"
                      >
                        {isAnswerRevealed ? (
                          <>
                            <EyeOff className="w-3 h-3" /> Hide
                          </>
                        ) : (
                          <>
                            <Eye className="w-3 h-3" /> Reveal Answer
                          </>
                        )}
                      </button>
                    </div>

                    {isAnswerRevealed && (
                      <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded text-emerald-900 text-[11px] leading-relaxed">
                        <strong className="text-emerald-950">Answer:</strong> {q.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
