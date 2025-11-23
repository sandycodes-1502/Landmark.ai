import React, { useState, useCallback } from 'react';
import CameraView from './components/CameraView';
import ResultOverlay from './components/ResultOverlay';
import LoadingScreen from './components/LoadingScreen';
import { AppState, AnalysisResult } from './types';
import { analyzeImagePipeline, fileToBase64 } from './services/geminiService';
import { AlertCircle } from 'lucide-react';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleImageSelected = useCallback(async (file: File) => {
    try {
      setErrorMessage(null);
      
      // 1. Preview Image
      const base64 = await fileToBase64(file);
      setCurrentImage(`data:${file.type};base64,${base64}`);
      
      // 2. Start Pipeline
      setAppState(AppState.ANALYZING_IMAGE);
      
      // We manually update states to show progress to user (UX)
      // Note: In a real streaming architecture we'd use events, but here we estimate steps inside the service wrapper.
      // To show distinct steps in UI, I'll break down the service call in the UI layer slightly or rely on the single pipeline function 
      // but the single pipeline is cleaner. Let's use a "fake" progress simulation if we use the single function, 
      // or break it apart. Breaking it apart is better for granular error handling and state updates.

      // Step 1: Identify
      const { identifyLandmark, fetchLandmarkDetails, generateNarration } = await import('./services/geminiService');
      
      const landmarkName = await identifyLandmark(base64, file.type);
      setAppState(AppState.FETCHING_INFO);

      // Step 2: Search
      const { text, sources } = await fetchLandmarkDetails(landmarkName);
      setAppState(AppState.GENERATING_AUDIO);

      // Step 3: TTS
      // Create a script for TTS
      const script = `I've identified this as ${landmarkName}. ${text}`;
      const audioBase64 = await generateNarration(script);

      setResult({
        landmarkName,
        historyText: text,
        sources,
        audioBase64
      });

      setAppState(AppState.READY);

    } catch (error: any) {
      console.error(error);
      setErrorMessage(error.message || "Something went wrong. Please try again.");
      setAppState(AppState.ERROR);
    }
  }, []);

  const resetApp = () => {
    setAppState(AppState.IDLE);
    setCurrentImage(null);
    setResult(null);
    setErrorMessage(null);
  };

  return (
    <div className="w-full h-screen bg-black text-white overflow-hidden relative">
      
      {/* Base Layer: Camera/Idle View */}
      <CameraView onImageSelected={handleImageSelected} />

      {/* Loading Overlay */}
      {(appState === AppState.ANALYZING_IMAGE || 
        appState === AppState.FETCHING_INFO || 
        appState === AppState.GENERATING_AUDIO) && currentImage && (
        <LoadingScreen state={appState} imageSrc={currentImage} />
      )}

      {/* Result Layer */}
      {appState === AppState.READY && result && currentImage && (
        <ResultOverlay 
          imageSrc={currentImage} 
          result={result} 
          onClose={resetApp} 
        />
      )}

      {/* Error Toast */}
      {appState === AppState.ERROR && (
        <div className="absolute top-10 left-1/2 transform -translate-x-1/2 w-[90%] max-w-md bg-red-500/90 text-white p-4 rounded-lg shadow-xl backdrop-blur-md flex items-center z-50 animate-in slide-in-from-top-4">
          <AlertCircle className="mr-3 flex-shrink-0" />
          <div className="flex-1 text-sm">
            <p className="font-bold">Error</p>
            <p>{errorMessage}</p>
          </div>
          <button onClick={resetApp} className="ml-3 font-bold hover:underline">
            CLOSE
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
