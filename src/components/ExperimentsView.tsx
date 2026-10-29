import React, { useState } from 'react';
import {
  FlaskConical,
  CheckCircle2,
  XCircle,
  Play,
  RotateCcw,
  HelpCircle,
  ArrowRight,
  ListOrdered,
  ChevronRight,
  Info,
  Sparkles,
} from 'lucide-react';
import { GUIDED_EXPERIMENTS, GuidedExperiment } from '../data/guidedExperiments';
import { NetworkConfiguration } from '../types/simulation';

interface ExperimentsViewProps {
  onSetupExperiment: (experiment: GuidedExperiment) => void;
  onRunAutoExperiment: (experiment: GuidedExperiment) => void;
  onGoToLab: () => void;
}

export const ExperimentsView: React.FC<ExperimentsViewProps> = ({
  onSetupExperiment,
  onRunAutoExperiment,
  onGoToLab,
}) => {
  const [selectedExpId, setSelectedExpId] = useState<number>(1);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showAnswerResults, setShowAnswerResults] = useState<Record<number, boolean>>({});

  const currentExp =
    GUIDED_EXPERIMENTS.find((e) => e.id === selectedExpId) || GUIDED_EXPERIMENTS[0];

  const handleSelectOption = (expId: number, optIndex: number) => {
    setSelectedAnswers((prev) => ({ ...prev, [expId]: optIndex }));
    setShowAnswerResults((prev) => ({ ...prev, [expId]: true }));
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
      {/* Experiments Sidebar */}
      <div className="md:col-span-4 space-y-3">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <FlaskConical className="w-4 h-4 text-sky-600" />
            <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
              12 Guided Experiments
            </h2>
          </div>

          <div className="space-y-1.5 max-h-[620px] overflow-y-auto pr-1">
            {GUIDED_EXPERIMENTS.map((exp) => {
              const isSelected = exp.id === selectedExpId;
              const hasAnswered = showAnswerResults[exp.id];
              const isCorrect = selectedAnswers[exp.id] === exp.correctOptionIndex;

              return (
                <button
                  key={exp.id}
                  onClick={() => setSelectedExpId(exp.id)}
                  className={`w-full text-left p-2.5 rounded-lg text-xs font-medium flex items-center justify-between transition-colors ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="truncate mr-2">
                    <span className="font-mono text-[11px] opacity-70 mr-1.5">#{exp.id}</span>
                    <span>{exp.title}</span>
                  </div>

                  {hasAnswered && (
                    <span
                      className={`h-2 w-2 rounded-full shrink-0 ${
                        isCorrect ? 'bg-emerald-400' : 'bg-rose-400'
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Experiment View */}
      <div className="md:col-span-8 space-y-5">
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-5">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200 mb-1.5 inline-block">
                Laboratory Exercise #{currentExp.id} of 12
              </span>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                {currentExp.title}
              </h1>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => onSetupExperiment(currentExp)}
                className="px-3 py-1.5 rounded-md border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                Configure Simulator State
              </button>

              <button
                onClick={() => onRunAutoExperiment(currentExp)}
                className="px-3.5 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium flex items-center gap-1.5 transition-colors shadow-2xs"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                Auto-Run Experiment
              </button>
            </div>
          </div>

          {/* Objective & Starting Conditions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="font-semibold text-slate-800 block text-[11px] uppercase tracking-wider mb-1">
                Learning Objective
              </span>
              <p className="text-slate-600 leading-relaxed">{currentExp.objective}</p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="font-semibold text-slate-800 block text-[11px] uppercase tracking-wider mb-1">
                Required Starting State
              </span>
              <p className="text-slate-600 leading-relaxed font-mono">{currentExp.startingConditions}</p>
            </div>
          </div>

          {/* Step-by-Step Procedure */}
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-2.5 flex items-center gap-1.5">
              <ListOrdered className="w-4 h-4 text-sky-600" />
              Step-by-Step Instructions
            </h3>

            <ol className="space-y-2 text-xs">
              {currentExp.steps.map((step, idx) => (
                <li
                  key={idx}
                  className="p-2.5 rounded-lg border border-slate-200 bg-white flex items-start gap-3"
                >
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-900 text-white font-mono text-[10px] shrink-0 font-bold">
                    {idx + 1}
                  </span>
                  <span className="text-slate-700 pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Challenge Mode Prediction Question */}
          <div className="p-4 bg-sky-50/60 border border-sky-200 rounded-xl space-y-3">
            <div className="flex items-center gap-1.5 text-sky-900 font-bold text-xs">
              <Sparkles className="w-4 h-4 text-sky-600" />
              <span>Challenge Mode: Predict the Outcome</span>
            </div>
            <p className="text-xs text-sky-950 font-medium">
              {currentExp.challengeQuestion}
            </p>

            <div className="space-y-1.5">
              {currentExp.challengeOptions.map((opt, oIdx) => {
                const isSelected = selectedAnswers[currentExp.id] === oIdx;
                const showResult = showAnswerResults[currentExp.id];
                const isCorrect = oIdx === currentExp.correctOptionIndex;

                let btnStyle = 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50';
                if (showResult) {
                  if (isCorrect) {
                    btnStyle = 'bg-emerald-100 border-emerald-300 text-emerald-950 font-semibold';
                  } else if (isSelected) {
                    btnStyle = 'bg-rose-100 border-rose-300 text-rose-950';
                  }
                }

                return (
                  <button
                    key={oIdx}
                    onClick={() => handleSelectOption(currentExp.id, oIdx)}
                    className={`w-full text-left p-2.5 rounded-lg border text-xs transition-colors flex items-center justify-between ${btnStyle}`}
                  >
                    <span>{opt}</span>
                    {showResult && isCorrect && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 ml-2" />
                    )}
                    {showResult && isSelected && !isCorrect && (
                      <XCircle className="w-4 h-4 text-rose-600 shrink-0 ml-2" />
                    )}
                  </button>
                );
              })}
            </div>

            {showAnswerResults[currentExp.id] && (
              <div className="p-3 bg-white border border-sky-200 rounded-lg text-[11px] text-slate-700 leading-relaxed mt-2">
                <span className="font-bold text-slate-900 block mb-0.5">Engineering Explanation:</span>
                {currentExp.challengeExplanation}
              </div>
            )}
          </div>

          {/* Expected Result & Observed Event Log */}
          <div className="space-y-3 pt-2">
            <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-lg text-xs space-y-1">
              <span className="font-semibold text-emerald-900 block text-[11px] uppercase tracking-wider">
                Expected Result
              </span>
              <p className="text-emerald-950 leading-relaxed">{currentExp.expectedResult}</p>
            </div>

            <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-lg text-xs space-y-1 font-mono text-emerald-400">
              <span className="font-semibold text-slate-300 block text-[11px] uppercase tracking-wider font-sans">
                Observed Firmware / Packet Trace
              </span>
              <p className="leading-relaxed">{currentExp.observedLogExplanation}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
