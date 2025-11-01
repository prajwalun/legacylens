'use client';

import { useState } from 'react';

export default function TestUI() {
  const [repoUrl, setRepoUrl] = useState('https://github.com/tj/commander.js');
  const [scanId, setScanId] = useState('');
  const [status, setStatus] = useState<'idle' | 'starting' | 'scanning' | 'complete' | 'error'>('idle');
  const [logs, setLogs] = useState<string[]>([]);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState('');

  const startScan = async () => {
    setStatus('starting');
    setLogs([]);
    setResults(null);
    setError('');
    
    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl }),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to start scan');
      }

      const data = await res.json();
      setScanId(data.scanId);
      setStatus('scanning');
      setLogs(prev => [...prev, `✓ Scan started: ${data.scanId}`]);
      
      // Start listening to SSE
      listenToStream(data.scanId);
      
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLogs(prev => [...prev, `❌ Error: ${err}`]);
    }
  };

  const listenToStream = (id: string) => {
    const eventSource = new EventSource(`/api/scan/${id}/stream`);
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'connected') {
          setLogs(prev => [...prev, '🔌 Connected to stream']);
        } else if (data.type === 'log') {
          const emoji = data.log.phase === 'plan' ? '📋' :
                       data.log.phase === 'hunt' ? '🔍' :
                       data.log.phase === 'explain' ? '🤖' : '✍️';
          setLogs(prev => [...prev, `${emoji} [${data.log.phase.toUpperCase()}] ${data.log.message}`]);
        } else if (data.type === 'progress') {
          // Progress update (optional display)
        } else if (data.type === 'complete') {
          setStatus('complete');
          setLogs(prev => [...prev, `✅ Scan ${data.status}: ${data.findingsCount} issues found`]);
          eventSource.close();
          fetchResults(id);
        } else if (data.type === 'error') {
          setStatus('error');
          setError(data.message);
          setLogs(prev => [...prev, `❌ Error: ${data.message}`]);
          eventSource.close();
        }
      } catch (err) {
        console.error('Failed to parse SSE data:', err);
      }
    };
    
    eventSource.onerror = () => {
      setLogs(prev => [...prev, '⚠️ Stream connection closed']);
      eventSource.close();
    };
  };

  const fetchResults = async (id: string) => {
    try {
      const res = await fetch(`/api/scan/${id}`);
      const data = await res.json();
      setResults(data);
    } catch (err) {
      setError('Failed to fetch results');
    }
  };

  const loadDemo = async (type: 'messy' | 'clean' | 'failed') => {
    const demoIds = {
      messy: 'demo-messy-nodejs',
      clean: 'demo-clean-python',
      failed: 'demo-failed-scan',
    };
    
    const id = demoIds[type];
    setScanId(id);
    setStatus('complete');
    setLogs([`📦 Loaded demo scan: ${type}`]);
    fetchResults(id);
  };

  return (
    <div style={{ 
      padding: '40px', 
      fontFamily: 'system-ui, -apple-system, sans-serif',
      maxWidth: '1200px',
      margin: '0 auto',
    }}>
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '10px' }}>
          🔮 LegacyLens Test UI
        </h1>
        <p style={{ color: '#666', fontSize: '14px' }}>
          Test the complete scan workflow: Start scan → Watch logs → View results → Download roadmap
        </p>
      </div>

      {/* Input Section */}
      <div style={{ 
        background: '#f8f9fa', 
        padding: '20px', 
        borderRadius: '8px',
        marginBottom: '20px',
      }}>
        <label style={{ display: 'block', marginBottom: '10px', fontWeight: '600' }}>
          GitHub Repository URL:
        </label>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            style={{ 
              flex: 1,
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px',
            }}
            placeholder="https://github.com/owner/repo"
            disabled={status === 'scanning'}
          />
          <button 
            onClick={startScan} 
            disabled={status === 'scanning' || !repoUrl}
            style={{ 
              padding: '10px 24px',
              background: status === 'scanning' ? '#ccc' : '#007bff',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: status === 'scanning' ? 'not-allowed' : 'pointer',
              fontWeight: '600',
            }}
          >
            {status === 'scanning' ? '⏳ Scanning...' : '🚀 Start Scan'}
          </button>
        </div>
        <p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
          💡 Tip: Use small repos (&lt;100 files) for quick demos (~30-60s)
        </p>
      </div>

      {/* Demo Buttons */}
      <div style={{ 
        background: '#fff3cd', 
        padding: '15px', 
        borderRadius: '8px',
        marginBottom: '20px',
        border: '1px solid #ffc107',
      }}>
        <p style={{ fontWeight: '600', marginBottom: '10px', fontSize: '14px' }}>
          ⚡ Quick Demo (Instant Results):
        </p>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => loadDemo('messy')}
            style={{ 
              padding: '8px 16px',
              background: '#dc3545',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            🔴 Messy Codebase (6 issues)
          </button>
          <button 
            onClick={() => loadDemo('clean')}
            style={{ 
              padding: '8px 16px',
              background: '#28a745',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            🟢 Clean Codebase (2 issues)
          </button>
          <button 
            onClick={() => loadDemo('failed')}
            style={{ 
              padding: '8px 16px',
              background: '#6c757d',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            ⚫ Failed Scan
          </button>
        </div>
      </div>

      {/* Status Display */}
      {scanId && (
        <div style={{ marginBottom: '20px', padding: '15px', background: '#e7f3ff', borderRadius: '8px' }}>
          <p style={{ margin: '0 0 5px 0', fontSize: '14px' }}>
            <strong>Scan ID:</strong> <code style={{ 
              background: '#fff',
              padding: '2px 6px',
              borderRadius: '3px',
              fontSize: '12px',
            }}>{scanId}</code>
          </p>
          <p style={{ margin: 0, fontSize: '14px' }}>
            <strong>Status:</strong> <span style={{
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: '600',
              background: status === 'complete' ? '#d4edda' :
                         status === 'scanning' ? '#fff3cd' :
                         status === 'error' ? '#f8d7da' : '#e7f3ff',
              color: status === 'complete' ? '#155724' :
                     status === 'scanning' ? '#856404' :
                     status === 'error' ? '#721c24' : '#004085',
            }}>
              {status}
            </span>
          </p>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div style={{ 
          marginBottom: '20px',
          padding: '15px',
          background: '#f8d7da',
          border: '1px solid #f5c6cb',
          borderRadius: '8px',
          color: '#721c24',
        }}>
          <strong>❌ Error:</strong> {error}
        </div>
      )}

      {/* Live Logs */}
      {logs.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ marginBottom: '10px', fontSize: '16px', fontWeight: '600' }}>
            📋 Live Logs:
          </h3>
          <div style={{ 
            background: '#1e1e1e',
            color: '#00ff00',
            padding: '15px',
            borderRadius: '8px',
            maxHeight: '400px',
            overflow: 'auto',
            fontFamily: 'monospace',
            fontSize: '13px',
          }}>
            {logs.map((log, i) => (
              <div key={i} style={{ marginBottom: '5px' }}>
                {log}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results Display */}
      {results && (
        <div style={{ marginTop: '20px' }}>
          <h3 style={{ marginBottom: '15px', fontSize: '18px', fontWeight: '600' }}>
            📊 Scan Results:
          </h3>
          
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '15px',
            marginBottom: '20px',
          }}>
            <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '5px' }}>
                {results.findings?.length || 0}
              </div>
              <div style={{ fontSize: '14px', color: '#666' }}>Total Issues</div>
            </div>
            <div style={{ background: '#fdecea', padding: '15px', borderRadius: '8px' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '5px' }}>
                🔴 {results.stats?.criticalCount || 0}
              </div>
              <div style={{ fontSize: '14px', color: '#666' }}>Critical</div>
            </div>
            <div style={{ background: '#fff3cd', padding: '15px', borderRadius: '8px' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '5px' }}>
                ⚠️ {results.stats?.highCount || 0}
              </div>
              <div style={{ fontSize: '14px', color: '#666' }}>High</div>
            </div>
            <div style={{ background: '#fff8e1', padding: '15px', borderRadius: '8px' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '5px' }}>
                🟡 {results.stats?.mediumCount || 0}
              </div>
              <div style={{ fontSize: '14px', color: '#666' }}>Medium</div>
            </div>
            <div style={{ background: '#e3f2fd', padding: '15px', borderRadius: '8px' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '5px' }}>
                🔵 {results.stats?.lowCount || 0}
              </div>
              <div style={{ fontSize: '14px', color: '#666' }}>Low</div>
            </div>
            <div style={{ background: '#e8f5e9', padding: '15px', borderRadius: '8px' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '5px' }}>
                {Math.round((results.stats?.totalMinutes || 0) / 60 * 10) / 10}h
              </div>
              <div style={{ fontSize: '14px', color: '#666' }}>Time Saved</div>
            </div>
          </div>

          {/* Sample Findings */}
          {results.findings && results.findings.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ marginBottom: '10px', fontSize: '16px', fontWeight: '600' }}>
                🔍 Sample Findings:
              </h4>
              {results.findings.slice(0, 3).map((finding: any) => (
                <div key={finding.id} style={{ 
                  background: '#f8f9fa',
                  padding: '15px',
                  borderRadius: '8px',
                  marginBottom: '10px',
                  borderLeft: `4px solid ${
                    finding.severity === 'critical' ? '#dc3545' :
                    finding.severity === 'high' ? '#ffc107' :
                    finding.severity === 'medium' ? '#fd7e14' : '#17a2b8'
                  }`,
                }}>
                  <div style={{ fontWeight: '600', marginBottom: '5px', fontSize: '14px' }}>
                    {finding.title}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>
                    📁 {finding.file}:{finding.line} • 
                    <span style={{ marginLeft: '5px', padding: '2px 6px', background: '#fff', borderRadius: '3px' }}>
                      {finding.severity}
                    </span> • 
                    <span style={{ marginLeft: '5px' }}>
                      {finding.eta}
                    </span>
                  </div>
                  <div style={{ fontSize: '13px', color: '#333' }}>
                    {finding.explanation.slice(0, 150)}...
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Download Roadmap */}
          {scanId && results.status === 'completed' && (
            <div style={{ marginTop: '20px' }}>
              <a 
                href={`/api/roadmap/${scanId}`}
                download
                style={{ 
                  display: 'inline-block',
                  padding: '12px 24px',
                  background: '#28a745',
                  color: '#fff',
                  textDecoration: 'none',
                  borderRadius: '4px',
                  fontWeight: '600',
                  fontSize: '14px',
                }}
              >
                📥 Download Refactor Roadmap
              </a>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div style={{ 
        marginTop: '40px',
        paddingTop: '20px',
        borderTop: '1px solid #ddd',
        fontSize: '12px',
        color: '#666',
      }}>
        <p>
          🔗 API Endpoints: 
          <a href="/api/test" style={{ marginLeft: '5px', color: '#007bff' }}>
            /api/test
          </a>
        </p>
      </div>
    </div>
  );
}

