import React, { useState, useEffect } from 'react';
import { useRoomContext } from '../context/RoomContext';
import api from '../utils/api';

interface Scores {
  problemSolving: number;
  codeQuality: number;
  communication: number;
  timeComplexity: number;
  edgeCases: number;
  notes: string;
}

const CRITERIA = [
  { key: 'problemSolving',  label: 'Problem Solving',  weight: 25, color: '#00ffcc' },
  { key: 'codeQuality',     label: 'Code Quality',     weight: 25, color: '#a78bfa' },
  { key: 'communication',   label: 'Communication',    weight: 20, color: '#60a5fa' },
  { key: 'timeComplexity',  label: 'Time Complexity',  weight: 20, color: '#f59e0b' },
  { key: 'edgeCases',       label: 'Edge Cases',       weight: 10, color: '#f87171' },
] as const;

const getRating = (score: number) => {
  if (score >= 80) return { label: 'Excellent', color: '#00ffcc' };
  if (score >= 65) return { label: 'Good',      color: '#60a5fa' };
  if (score >= 50) return { label: 'Average',   color: '#f59e0b' };
  return               { label: 'Needs Work', color: '#f87171' };
};

const Evaluation = ({ roomId }: { roomId: string }) => {
  const { socket } = useRoomContext();
  const [scores, setScores] = useState<Scores>({
    problemSolving: 50,
    codeQuality:    50,
    communication:  50,
    timeComplexity: 50,
    edgeCases:      50,
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);

  // Live incoming updates from interviewer
  useEffect(() => {
    if (!socket) return;
    const handleUpdate = ({ scores: incoming }: { scores: Scores }) => {
      setScores(incoming);
    };
    socket.on('evaluation-updated', handleUpdate);
    return () => { socket.off('evaluation-updated', handleUpdate); };
  }, [socket]);

  const overallScore = Math.round(
    CRITERIA.reduce((acc, c) => acc + (scores[c.key] as number) * (c.weight / 100), 0)
  );
  const rating = getRating(overallScore);

  const handleSlider = (key: keyof Omit<Scores, 'notes'>, value: number) => {
    const next = { ...scores, [key]: value };
    setScores(next);
    setSaved(false);
    // Broadcast live to peers
    if (socket) socket.emit('update-evaluation', { roomId, scores: next });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch(`/rooms/${roomId}/evaluation`, scores);
      setSaved(true);
    } catch (err) {
      console.error('Failed to save evaluation', err);
    } finally {
      setSaving(false);
    }
  };

  const handleExport = () => {
    const data = {
      roomId,
      exportedAt: new Date().toISOString(),
      overallScore,
      rating: rating.label,
      breakdown: CRITERIA.map(c => ({
        criterion: c.label,
        score:     scores[c.key as keyof typeof scores],
        weight:    c.weight,
      })),
      notes: scores.notes,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `evaluation-${roomId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto p-5 scrollbar-hide">
      {/* Overall Score Card */}
      <div className="glass-panel p-5 mb-6 flex items-center gap-5 relative overflow-hidden">
        <div
          className="text-5xl font-black"
          style={{ color: rating.color, textShadow: `0 0 20px ${rating.color}66` }}
        >
          {overallScore}
        </div>
        <div>
          <div className="text-xs text-gray-400 font-mono uppercase tracking-widest mb-1">Overall Score</div>
          <div className="font-bold text-lg" style={{ color: rating.color }}>
            {rating.label}
          </div>
        </div>
        {/* Background glow */}
        <div
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{ background: `radial-gradient(circle at 10% 50%, ${rating.color}, transparent 70%)` }}
        />
      </div>

      {/* Sliders */}
      <div className="space-y-5 mb-6">
        {CRITERIA.map(c => (
          <div key={c.key}>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold text-gray-300">{c.label}</label>
              <span className="text-xs font-mono font-bold" style={{ color: c.color }}>
                {scores[c.key as keyof typeof scores]} / 100
              </span>
            </div>
            <div className="relative h-2 rounded-full bg-white/10">
              <div
                className="absolute left-0 top-0 h-full rounded-full transition-all"
                style={{ width: `${scores[c.key as keyof typeof scores]}%`, background: c.color }}
              />
            </div>
            <input
              type="range" min={0} max={100}
              value={scores[c.key as keyof typeof scores] as number}
              onChange={e => handleSlider(c.key as keyof Omit<Scores, 'notes'>, +e.target.value)}
              className="w-full mt-1 accent-cyan-400 bg-transparent cursor-pointer"
            />
            <div className="text-[10px] text-gray-600 text-right font-mono">weight: {c.weight}%</div>
          </div>
        ))}
      </div>

      {/* Notes */}
      <div className="mb-6">
        <label className="text-xs font-semibold text-gray-300 block mb-2">Feedback Notes</label>
        <textarea
          value={scores.notes}
          onChange={e => { setScores(s => ({ ...s, notes: e.target.value })); setSaved(false); }}
          rows={4}
          placeholder="Add written feedback here..."
          className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-sm text-white resize-none focus:outline-none focus:border-accent-cyan/40 placeholder:text-gray-600 transition-colors"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 mt-auto">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-accent-cyan text-black hover:brightness-110 transition-all disabled:opacity-50 shadow-[0_0_15px_rgba(0,255,204,0.2)]"
        >
          {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save Evaluation'}
        </button>
        <button
          onClick={handleExport}
          title="Export JSON"
          className="px-4 py-2.5 rounded-lg text-sm font-medium bg-white/10 text-white hover:bg-white/20 transition-all"
        >
          ↓ JSON
        </button>
      </div>
    </div>
  );
};

export default Evaluation;
