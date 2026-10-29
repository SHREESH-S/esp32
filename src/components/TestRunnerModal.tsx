import React, { useState } from 'react';
import {
  TestTube2,
  CheckCircle2,
  XCircle,
  Play,
  X,
  Clock,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { TestCaseResult, runAllSimulationTests } from '../engine/simulationTests';

interface TestRunnerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TestRunnerModal: React.FC<TestRunnerModalProps> = ({ isOpen, onClose }) => {
  const [testResults, setTestResults] = useState<TestCaseResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  if (!isOpen) return null;

  const handleRunTests = () => {
    setIsRunning(true);
    setTimeout(() => {
      const results = runAllSimulationTests();
      setTestResults(results);
      setIsRunning(false);
    }, 150);
  };

  const totalTests = 14;
  const passedCount = testResults.filter((r) => r.passed).length;
  const allPassed = testResults.length === totalTests && passedCount === totalTests;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-2xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full p-6 border border-slate-200 shadow-2xl relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
              <TestTube2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Simulation Engine Test Suite (Section 22)
              </h2>
              <p className="text-xs text-slate-500">
                14 automated verification tests for FSM transitions, DHCP, and packet generation.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Test Summary Bar */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 mb-4 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-800">
              Results: {testResults.length > 0 ? `${passedCount} / ${totalTests} Passed` : 'Not run yet'}
            </span>
            {testResults.length > 0 && (
              <span
                className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] ${
                  allPassed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}
              >
                {allPassed ? 'ALL 14 TESTS PASSED' : 'SOME TESTS FAILED'}
              </span>
            )}
          </div>

          <button
            onClick={handleRunTests}
            disabled={isRunning}
            className="px-4 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium text-xs flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            {isRunning ? 'Running Tests...' : 'Run All 14 Tests'}
          </button>
        </div>

        {/* Test Results List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-xs">
          {testResults.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              Click "Run All 14 Tests" to verify the simulation engine.
            </div>
          ) : (
            testResults.map((test) => (
              <div
                key={test.id}
                className={`p-3 rounded-lg border transition-colors ${
                  test.passed
                    ? 'bg-white border-slate-200 hover:border-slate-300'
                    : 'bg-rose-50/50 border-rose-200'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    {test.passed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span className="font-bold text-slate-900">
                      Test {test.id}: {test.name}
                    </span>
                  </div>

                  <span className="font-mono text-[10px] text-slate-400 shrink-0">
                    {test.durationMs}ms
                  </span>
                </div>

                <p className="text-slate-600 text-[11px] pl-6 leading-relaxed">
                  {test.message}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Deterministic FSM Verification
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-md bg-slate-900 text-white font-medium hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
