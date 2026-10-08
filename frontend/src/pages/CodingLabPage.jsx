import React, { useState } from 'react';
import {
  Terminal,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Code2,
  Loader2
} from 'lucide-react';
import { api } from '../services/api';

export const CodingLabPage = () => {
  const PRESET_CODE = `# Dijkstra's Banker's Algorithm: Safe Sequence Detection
def is_safe_state(processes, available, max_demand, allocation):
    need = []
    n = len(processes)
    m = len(available)
    
    for i in range(n):
        need.append([max_demand[i][j] - allocation[i][j] for j in range(m)])
        
    finish = [False] * n
    safe_seq = []
    work = list(available)
    
    while len(safe_seq) < n:
        found = False
        for i in range(n):
            if not finish[i] and all(need[i][j] <= work[j] for j in range(m)):
                for j in range(m):
                    work[j] += allocation[i][j]
                finish[i] = True
                safe_seq.append(processes[i])
                found = True
                break
        if not found:
            return False, []
            
    return True, safe_seq

# Test Configuration
processes = ["P0", "P1", "P2", "P3", "P4"]
available = [3, 3, 2]
max_demand = [
    [7, 5, 3],
    [3, 2, 2],
    [9, 0, 2],
    [2, 2, 2],
    [4, 3, 3]
]
allocation = [
    [0, 1, 0],
    [2, 0, 0],
    [3, 0, 2],
    [2, 1, 1],
    [0, 0, 2]
]

safe, seq = is_safe_state(processes, available, max_demand, allocation)
print("System in Safe State?", safe)
print("Computed Safe Sequence:", " -> ".join(seq))
`;

  const [code, setCode] = useState(PRESET_CODE);
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [status, setStatus] = useState(null);

  const handleRunCode = async () => {
    setIsRunning(true);
    setStatus(null);
    setOutput('Submitting code to sandboxed execution environment with AST pre-audit...\n');

    try {
      const res = await api.executeCode(code, 'python');
      if (res.error) {
        setOutput(`Execution Error:\n${res.error}\n${res.stderr || ''}`);
        setStatus('error');
      } else {
        setOutput(res.stdout || 'Program executed successfully with no output.');
        setStatus('success');
      }
    } catch (err) {
      setOutput(`Communication Error:\n${err.message}`);
      setStatus('error');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-7xl mx-auto p-6 space-y-4 animate-in fade-in">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-indigo-400" />
          <div>
            <h2 className="text-sm font-bold text-white">Interactive Concurrency Coding Laboratory</h2>
            <span className="text-[11px] text-slate-400">
              Sandboxed Execution with AST AST Pre-Audit Verification
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setCode(PRESET_CODE)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Algorithm</span>
          </button>

          <button
            onClick={handleRunCode}
            disabled={isRunning}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md transition-all"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Running...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Run in Sandbox</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Editor & Console Split View */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 overflow-hidden">
        {/* Editor Box */}
        <div className="flex flex-col bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="h-10 bg-slate-950 px-4 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
            <span className="flex items-center gap-1.5">
              <Code2 className="w-4 h-4 text-indigo-400" />
              banker_algorithm.py
            </span>
            <span className="text-[10px] text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> AST Protected
            </span>
          </div>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck="false"
            className="flex-1 w-full bg-slate-900 text-slate-200 font-mono text-xs p-4 outline-none resize-none leading-relaxed selection:bg-indigo-600 selection:text-white"
          />
        </div>

        {/* Sandboxed Console Box */}
        <div className="flex flex-col bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="h-10 bg-slate-900/60 px-4 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
            <span className="flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-emerald-400" />
              Terminal Console Output
            </span>
            {status && (
              <span className={`text-[10px] font-bold ${status === 'success' ? 'text-emerald-400' : 'text-rose-400'}`}>
                {status === 'success' ? 'Exit Code 0' : 'Failed'}
              </span>
            )}
          </div>
          <div className="flex-1 p-4 font-mono text-xs text-slate-300 overflow-y-auto whitespace-pre-wrap leading-relaxed">
            {output || 'Click "Run in Sandbox" to compile and execute the algorithm.'}
          </div>
        </div>
      </div>
    </div>
  );
};
