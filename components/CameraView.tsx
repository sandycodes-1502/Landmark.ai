import React, { useRef } from 'react';
import { Camera, ImagePlus } from 'lucide-react';

interface CameraViewProps {
  onImageSelected: (file: File) => void;
}

const CameraView: React.FC<CameraViewProps> = ({ onImageSelected }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImageSelected(e.target.files[0]);
    }
  };

  const triggerCamera = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="relative h-screen w-full flex flex-col items-center justify-center bg-zinc-900 overflow-hidden">
      {/* Viewfinder Grid */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="w-full h-1/3 border-b border-white/30"></div>
        <div className="w-full h-1/3 border-b border-white/30"></div>
        <div className="absolute top-0 left-1/3 w-1/3 h-full border-l border-r border-white/30"></div>
      </div>

      {/* AR HUD Elements */}
      <div className="absolute top-8 left-6 flex space-x-2 text-emerald-400 font-mono text-xs tracking-widest opacity-80 animate-pulse">
        <span>REC</span>
        <span>●</span>
        <span>AI_VISION_ACTIVE</span>
      </div>
      
      <div className="absolute top-8 right-6 text-white/50 font-mono text-xs">
         LAT: --.-- <br/> LON: --.--
      </div>

      {/* Center Target */}
      <div className="relative z-10 w-64 h-64 border-2 border-white/50 rounded-lg flex items-center justify-center">
        <div className="w-4 h-4 border-l-2 border-t-2 border-white absolute top-[-2px] left-[-2px]"></div>
        <div className="w-4 h-4 border-r-2 border-t-2 border-white absolute top-[-2px] right-[-2px]"></div>
        <div className="w-4 h-4 border-l-2 border-b-2 border-white absolute bottom-[-2px] left-[-2px]"></div>
        <div className="w-4 h-4 border-r-2 border-b-2 border-white absolute bottom-[-2px] right-[-2px]"></div>
        <span className="text-white/70 text-sm font-light tracking-wider animate-bounce">Align Landmark</span>
      </div>

      {/* Controls */}
      <div className="absolute bottom-12 w-full flex justify-center items-center space-x-8 z-20">
        <input 
          type="file" 
          accept="image/*" 
          capture="environment" // Prefers rear camera on mobile
          className="hidden" 
          ref={fileInputRef} 
          onChange={handleFileChange}
        />

        <button 
          onClick={triggerCamera}
          className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center bg-white/10 backdrop-blur-sm active:scale-95 transition-transform shadow-[0_0_15px_rgba(255,255,255,0.3)] hover:bg-white/20"
        >
          <div className="w-16 h-16 bg-white rounded-full"></div>
        </button>
        
        <button 
          onClick={triggerCamera} // Re-use input for simplicity, could be a gallery picker
          className="absolute right-12 p-3 bg-zinc-800/80 rounded-full text-white hover:bg-zinc-700 backdrop-blur-md border border-white/10"
        >
          <ImagePlus size={24} />
        </button>
      </div>

      <div className="absolute bottom-4 text-white/40 text-xs font-mono">
        v2.5.0-flash-augmented
      </div>
    </div>
  );
};

export default CameraView;
