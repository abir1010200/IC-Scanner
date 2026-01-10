
export interface PriceData {
  store: string;
  price: string;
  availability: string;
  url?: string;
}

export interface ICCharacteristic {
  id: number;
  label: string;
  value: string;
}

export interface PinFunction {
  pin: string;
  name: string;
  description: string;
}

export interface GroundingSource {
  title?: string;
  uri?: string;
}

export interface DatasetLink {
  name: string;
  url: string;
}

export interface ResourceLink {
  platform: 'Wikipedia' | 'YouTube' | 'GitHub' | 'Manufacturer';
  title: string;
  url: string;
}

export interface UserFeedback {
  rating: number;
  comment: string;
  timestamp: number;
  reportId: string;
}

export interface CaseStudy {
  title: string;
  description: string;
  outcome: string;
}

export interface ICIntelligenceReport {
  identification: {
    name: string;
    number: string;
    manufacturer: string;
    family: string;
    confidence: number;
  };
  technicalProfile: ICCharacteristic[];
  pinout: {
    diagram: string;
    table: PinFunction[];
    warnings: string[];
  };
  testing: {
    multimeter: string[];
    oscilloscope: string[];
    expectedVoltages: string;
    faultSymptoms: string[];
    safety: string[];
  };
  marketPrice: {
    prices: PriceData[];
    minPrice: string;
    maxPrice: string;
    bulkTrend: string;
    indiaRetailers: PriceData[];
  };
  resources: {
    wikipedia?: ResourceLink;
    youtubeVideos: ResourceLink[];
    officialDatasets: DatasetLink[];
  };
  references: {
    summary: string;
    youtubeKeywords: string[];
    datasheetNotes: string;
    datasetLinks?: DatasetLink[];
  };
  applications: {
    consumer: string;
    industrial: string;
    automotiveIot: string;
    typicalCircuits: string;
  };
  caseStudy?: CaseStudy;
  useCases?: string[];
  confidence: {
    ocrScore: number;
    idScore: number;
    disclaimer: string;
  };
  groundingSources?: GroundingSource[];
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  name: string;
  image: string;
  report: ICIntelligenceReport;
}

export interface FilterSettings {
  contrast: number;
  brightness: number;
  grayscale: boolean;
  invert: boolean;
  saturate: number;
  pixelated: boolean;
  hueRotate: number;
  blur: number;
  zoom: number;
  sharpen: number;
}

export interface FilterPreset {
  id: string;
  name: string;
  settings: FilterSettings;
}

export interface AnalysisState {
  originalImage: string | null;
  enhancedImage: string | null;
  isAnalyzing: boolean;
  report: ICIntelligenceReport | null;
  error: string | null;
  history: HistoryItem[];
}
