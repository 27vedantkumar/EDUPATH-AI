import React, { useState, useEffect } from 'react';
import {
  Terminal,
  Play,
  RotateCcw,
  ShieldCheck,
  Code2,
  Loader2,
  Cpu,
  Sparkles,
  Copy,
  Trash2,
  ExternalLink
} from 'lucide-react';

export default function CodingLabPage() {
  const [pyodide, setPyodide] = useState(null);
  const [output, setOutput] = useState("");
  const [code, setCode] = useState("import antigravity\nprint('System Ready. Let\'s fly.')");
  const [isRunning, setIsRunning] = useState(false);
  const [status, setStatus] = useState(null); // 'success' | 'error' | null
  const [copied, setCopied] = useState(false);
  const [activePreset, setActivePreset] = useState('antigravity');

  // Load Pyodide from CDN on mount
  useEffect(() => {
    let isMounted = true;

    const loadPyodideEngine = async () => {
      try {
        if (window.loadPyodide) {
          // If already attached to window, initialize instance if not set
          const pyodideInstance = await window.loadPyodide({
            indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/"
          });
          if (isMounted) {
            setPyodide(pyodideInstance);
          }
          return;
        }

        // Attach CDN script
        let script = document.querySelector('script[src*="pyodide.js"]');
        if (!script) {
          script = document.createElement('script');
          script.src = "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js";
          document.body.appendChild(script);
        }

        script.onload = async () => {
          try {
            const pyodideInstance = await window.loadPyodide({
              indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/"
            });
            if (isMounted) {
              setPyodide(pyodideInstance);
            }
          } catch (initErr) {
            console.error("Pyodide instance initialization error:", initErr);
            if (isMounted) {
              setOutput("Failed to initialize Pyodide WebAssembly runtime:\n" + initErr.toString());
              setStatus('error');
            }
          }
        };
      } catch (err) {
        console.error("Pyodide script load error:", err);
        if (isMounted) {
          setOutput("Failed to load Pyodide CDN script:\n" + err.toString());
          setStatus('error');
        }
      }
    };

    loadPyodideEngine();
    return () => {
      isMounted = false;
    };
  }, []);

  const runCode = async () => {
    if (!pyodide) return;
    setIsRunning(true);
    setStatus(null);
    setOutput("Executing in WebAssembly environment...");

    try {
      // Redirect Python stdout to a string buffer we can read in JS
      pyodide.runPython(`
        import sys
        import io
        sys.stdout = io.StringIO()
      `);

      await pyodide.runPythonAsync(code);
      const stdout = pyodide.runPython("sys.stdout.getvalue()");

      setOutput(stdout || "Code executed successfully (no output).");
      setStatus('success');
    } catch (err) {
      // Catch syntax errors and tracebacks natively
      setOutput(err.toString());
      setStatus('error');
    } finally {
      setIsRunning(false);
    }
  };

  const PRESETS = {
    antigravity: {
      name: "Antigravity Flight",
      filename: "flight_control.py",
      code: "import antigravity\nprint('System Ready. Let\'s fly.')"
    },
    banker: {
      name: "Banker's Algorithm",
      filename: "banker_algorithm.py",
      code: `# Dijkstra's Banker's Algorithm: Safe Sequence Detection
def is_safe_state(processes, available, max_demand, allocation):
    n = len(processes)
    m = len(available)
    need = [[max_demand[i][j] - allocation[i][j] for j in range(m)] for i in range(n)]
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
max_demand = [[7, 5, 3], [3, 2, 2], [9, 0, 2], [2, 2, 2], [4, 3, 3]]
allocation = [[0, 1, 0], [2, 0, 0], [3, 0, 2], [2, 1, 1], [0, 0, 2]]

safe, seq = is_safe_state(processes, available, max_demand, allocation)
print("System in Safe State?", safe)
print("Computed Safe Sequence:", " -> ".join(seq))
`
    },
    dp: {
      name: "Dynamic Programming",
      filename: "fibonacci_dp.py",
      code: `# Top-Down DP with Memoization
def fib_memo(n, memo={}):
    if n in memo:
        return memo[n]
    if n <= 1:
        return n
    memo[n] = fib_memo(n - 1, memo) + fib_memo(n - 2, memo)
    return memo[n]

terms = [fib_memo(i) for i in range(12)]
print("First 12 Fibonacci Numbers:")
print(", ".join(map(str, terms)))
print("\\nTime Complexity: O(N) linear time with O(N) auxiliary space.")
`
    }
  };

  const handleSelectPreset = (key) => {
    setActivePreset(key);
    setCode(PRESETS[key].code);
    setOutput("");
    setStatus(null);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-7xl mx-auto p-4 md:p-6 space-y-4 animate-in fade-in">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-sky-500 to-emerald-400 flex items-center justify-center shadow-md shadow-indigo-500/20">
            <Cpu className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                "Antigravity" Pyodide Lab
              </h2>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold flex items-center gap-1.5 border ${
                pyodide
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${pyodide ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500 animate-ping'}`} />
                {pyodide ? 'Pyodide WASM v0.25 Ready' : 'Initializing WASM Runtime...'}
              </span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400">
              Live in-browser Python execution • Zero backend latency • Direct stdout redirection
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Preset Selector */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold">
            {Object.keys(PRESETS).map((key) => (
              <button
                key={key}
                onClick={() => handleSelectPreset(key)}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  activePreset === key
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {PRESETS[key].name}
              </button>
            ))}
          </div>

          <button
            onClick={() => handleSelectPreset(activePreset)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer"
            title="Reset to preset starter code"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>

          {/* Run Code Button */}
          <button
            onClick={runCode}
            disabled={!pyodide || isRunning}
            className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-blue-500/25 transition-all cursor-pointer"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Running...</span>
              </>
            ) : !pyodide ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Loading Environment...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-white text-white" />
                <span>Run Code</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Split-View: Editor & Native WebAssembly Terminal */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 overflow-hidden min-h-[420px]">
        {/* Editor Pane */}
        <div className="preserve-dark-surface flex flex-col bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="h-10 bg-slate-950 px-4 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
            <span className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-indigo-400" />
              <span>{PRESETS[activePreset]?.filename || 'script.py'}</span>
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-sans">
                <ShieldCheck className="w-3.5 h-3.5" /> Client Sandbox
              </span>
              <button
                onClick={handleCopyCode}
                className="hover:text-white transition-colors p-1"
                title="Copy code to clipboard"
              >
                {copied ? <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck="false"
            className="flex-1 w-full bg-slate-900 text-emerald-400 font-mono text-xs p-4 outline-none resize-none leading-relaxed selection:bg-indigo-600 selection:text-white"
            placeholder="Write Python 3 code here..."
          />
        </div>

        {/* Sandboxed Console Box */}
        <div className="preserve-dark-surface flex flex-col bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="h-10 bg-slate-900/60 px-4 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
            <span className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span>Pyodide WebAssembly Terminal Output</span>
            </span>
            <div className="flex items-center gap-2">
              {status && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                  status === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                }`}>
                  {status === 'success' ? 'Exit Code 0' : 'Runtime / Syntax Error'}
                </span>
              )}
              {output && (
                <button
                  onClick={() => { setOutput(""); setStatus(null); }}
                  className="hover:text-rose-400 transition-colors p-1"
                  title="Clear console output"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
          <div className="flex-1 p-4 font-mono text-xs text-slate-200 overflow-y-auto whitespace-pre-wrap leading-relaxed selection:bg-indigo-600 selection:text-white">
            {output ? (
              <span className={status === 'error' ? 'text-rose-400 font-mono' : 'text-emerald-300'}>
                {output}
              </span>
            ) : (
              <span className="text-slate-500 italic">
                Pyodide runtime ready. Click "Run Code" to compile and execute Python natively in your browser.
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Named export for backwards compatibility
export { CodingLabPage as CodingLabPage };
