export interface LandmarkInfo {
  name: string;
  description: string;
  sources: string[];
}

export enum AppState {
  IDLE = 'IDLE',
  ANALYZING_IMAGE = 'ANALYZING_IMAGE',
  FETCHING_INFO = 'FETCHING_INFO',
  GENERATING_AUDIO = 'GENERATING_AUDIO',
  READY = 'READY',
  ERROR = 'ERROR',
}

export interface GroundingSource {
  uri: string;
  title: string;
}

export interface AnalysisResult {
  landmarkName: string;
  historyText: string;
  audioBase64: string | null;
  sources: GroundingSource[];
}
