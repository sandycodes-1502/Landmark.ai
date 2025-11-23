import React, { useEffect, useState } from 'react';
import { Loader2, Zap, Search, Mic } from 'lucide-react';
import { AppState } from '../types';

interface LoadingScreenProps {
  state: AppState;
  imageSrc: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ state, imageSrc }) => {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const getStatusText = () => {
    switch (state) {
      case AppState.ANALYZING_IMAGE: return "Analyzing architecture";
      case AppState.FETCHING_INFO: return "Digging through history";
      case AppState.GENERATING_AUDIO: return "Synthesizing guide voice";
      default: return "Processing";
    }
  };

  const getIcon = () => {
    switch (state) {
      case AppState.ANALYZING_IMAGE: return <Zap className="text-amber-400 animate-pulse" size={32} />;
      case AppState.FETCHING_INFO: return <Search className="text-blue-400 animate-bounce" size={32} />;
      case AppState.GENERATING_AUDIO: return <Mic className="text-emerald-400 animate-pulse" size={32} />;
      default: return <Loader2 className="animate-spin text-white" size={32} />;
    }
  };

  return (
    <div className="absolute inset-0 z-40 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center">
      {/* Background hint */}
      {imageSrc && (
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20 filter blur-lg"
          style={{ backgroundImage: `url(${imageSrc})` }}
        />
      )}

      <div className="relative z-10 flex flex-col items-center space-y-6 p-8 rounded-2xl bg-black/40 border border-white/10 shadow-2xl">
        <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center border border-white/10 shadow-[0_0_30px_rgba(255,255,255,0.1)]">
          {getIcon()}
        </div>
        
        <div className="text-center">
          <h2 className="text-xl font-light text-white tracking-wider">
            {getStatusText()}{dots}
          </h2>
          <p className="text-white/40 text-sm mt-2 font-mono">
            Powered by Gemini
          </p>
        </div>

        {/* Progress Bar Simulation */}
        <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden">
          <div className={`h-full bg-gradient-to-r from-emerald-500 to-blue-500 transition-all duration-1000 ease-out 
            ${state === AppState.ANALYZING_IMAGE ? 'w-1/3' : 
              state === AppState.FETCHING_INFO ? 'w-2/3' : 
              state === AppState.GENERATING_AUDIO ? 'w-full' : 'w-0'}`}
          />
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
