import React, { useEffect, useState, useRef } from 'react';
import { Play, Pause, X, ExternalLink, MapPin, Sparkles, Volume2 } from 'lucide-react';
import { AnalysisResult } from '../types';

interface ResultOverlayProps {
  imageSrc: string;
  result: AnalysisResult;
  onClose: () => void;
}

const ResultOverlay: React.FC<ResultOverlayProps> = ({ imageSrc, result, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [expandDetails, setExpandDetails] = useState(false);

  useEffect(() => {
    // Decode base64 audio and setup player
    if (result.audioBase64) {
      const audioData = atob(result.audioBase64);
      const arrayBuffer = new ArrayBuffer(audioData.length);
      const view = new Uint8Array(arrayBuffer);
      for (let i = 0; i < audioData.length; i++) {
        view[i] = audioData.charCodeAt(i);
      }
      const blob = new Blob([arrayBuffer], { type: 'audio/mp3' }); // Gemini TTS usually returns MP3-compatible stream wrapped in WAV/PCM structure, but Blob handling works broadly
      // Note: Gemini API returns raw PCM usually for stream, but generateContent returns base64. 
      // Actually, for generateContent with Modality.AUDIO, it's often a wav or usable by audio context.
      // Let's rely on standard browser handling of the base64 data URI if possible, or construct Blob.
      // Constructing a Data URI is easiest for a simple <audio> element.
      const audioUrl = `data:audio/wav;base64,${result.audioBase64}`;
      
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => setIsPlaying(false);
      
      // Auto-play for "AR experience"
      audio.play().then(() => setIsPlaying(true)).catch(e => console.log("Auto-play prevented", e));
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [result.audioBase64]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="absolute inset-0 z-50 flex flex-col animate-in fade-in duration-300">
      {/* Background Image (User's photo) */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${imageSrc})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
      </div>

      {/* Header / Nav */}
      <div className="relative z-10 p-4 flex justify-between items-start pt-12">
        <button 
          onClick={onClose}
          className="p-2 rounded-full bg-black/40 text-white backdrop-blur-md border border-white/20 hover:bg-black/60 transition-colors"
        >
          <X size={24} />
        </button>
        <div className="flex flex-col items-end">
          <span className="text-xs font-mono text-emerald-400 bg-emerald-950/50 px-2 py-1 rounded border border-emerald-500/30 flex items-center gap-1">
            <Sparkles size={10} /> RECOGNIZED
          </span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative z-10 flex flex-col justify-end p-6 pb-12">
        
        {/* Title Block */}
        <div className="mb-6">
          <div className="flex items-center space-x-2 text-emerald-300 mb-2 opacity-90">
             <MapPin size={16} />
             <span className="text-sm font-medium tracking-wide uppercase">Identified Landmark</span>
          </div>
          <h1 className="text-4xl font-bold text-white leading-tight shadow-black drop-shadow-lg">
            {result.landmarkName}
          </h1>
        </div>

        {/* Info Card with Glassmorphism */}
        <div className={`bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-5 transition-all duration-300 ${expandDetails ? 'h-[60vh] overflow-y-auto' : 'h-auto'}`}>
          
          {/* Audio Player Control */}
          <div className="flex items-center space-x-4 mb-4 pb-4 border-b border-white/10">
            <button 
              onClick={togglePlay}
              className="w-12 h-12 flex items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 hover:bg-emerald-400 transition-all active:scale-95"
            >
              {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
            </button>
            <div className="flex-1">
              <div className="text-xs text-emerald-200 font-semibold mb-1 uppercase tracking-wider flex items-center gap-1">
                <Volume2 size={12} /> Audio Guide
              </div>
              <div className="h-1 w-full bg-white/20 rounded-full overflow-hidden">
                {isPlaying && (
                  <div className="h-full bg-emerald-400 animate-[progress_20s_linear_infinite]" style={{width: '100%'}}></div>
                )}
              </div>
            </div>
          </div>

          {/* Text Content */}
          <div className="text-white/90 text-sm leading-relaxed font-light space-y-4">
             <p>{result.historyText}</p>
          </div>

          {/* Sources */}
          {result.sources.length > 0 && (
            <div className="mt-6 pt-4 border-t border-white/10">
              <h4 className="text-xs font-semibold text-white/50 uppercase mb-2">Sources</h4>
              <div className="flex flex-wrap gap-2">
                {result.sources.map((source, idx) => (
                  <a 
                    key={idx}
                    href={source.uri}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-xs text-blue-300 bg-blue-900/30 px-2 py-1 rounded-md hover:bg-blue-900/50 transition-colors"
                  >
                    <ExternalLink size={10} />
                    <span className="truncate max-w-[150px]">{source.title}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Expand Toggle */}
          <button 
            onClick={() => setExpandDetails(!expandDetails)}
            className="w-full text-center mt-4 text-xs text-white/40 hover:text-white transition-colors uppercase tracking-widest"
          >
            {expandDetails ? 'Show Less' : 'Read More Details'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultOverlay;
