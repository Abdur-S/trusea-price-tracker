import React, { useState, useEffect } from 'react';

// Your live Google Apps Script microservice deployment link
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbywv50T1E_DtdRnUCclZPUZ1npXAF5EPMrYnmK9KJixxTfPPQ78o_EPCBGu0mrYYiFRVA/exec";

// Your exact sheet tab configuration layout names
const SHEET_NAMES = [
  "Updated Prices - 1 Jul 2026",
  "Updated Prices - 30 Jun 2026",
  "Updated Prices - 29 Jun 2026",
  "Daily Price Tracking"
];

interface FishItem {
  name: string;
  tenderCuts: string;
  licious: string;
  freshma: string;
  freshToHome: string;
  supreme: string;
  truSea500g: string;
  truSeaKg: string;
  isSoldOut: boolean;
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState(SHEET_NAMES[0]);
  const [data, setData] = useState<FishItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLiveSheetData(activeTab);
  }, [activeTab]);

  const fetchLiveSheetData = async (sheetName: string) => {
    setLoading(true);
    try {
      const url = `${WEB_APP_URL}?sheet=${encodeURIComponent(sheetName)}`;
      const response = await fetch(url);
      const jsonResult = await response.json();
      
      if (Array.isArray(jsonResult)) {
        setData(jsonResult);
      } else {
        console.error("Invalid database payload array layout sequence returned:", jsonResult);
      }
    } catch (error) {
      console.error("Failed to cleanly sync background data parameters:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-gray-100 p-4 sm:p-6 font-sans antialiased">
      {/* Brand Header Header block */}
      <header className="max-w-6xl mx-auto mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-neutral-800 pb-4 gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            TruSea <span className="text-blue-500 font-medium text-sm sm:text-base border border-blue-500/30 px-2 py-0.5 rounded bg-blue-500/10">Price Engine</span>
          </h1>
          <p className="text-xs text-neutral-400 mt-1 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Real-time synchronization engine with red cell tracking
          </p>
        </div>
      </header>

      {/* Sheet Tabs Filter Menu Navigation */}
      <div className="max-w-6xl mx-auto mb-6 overflow-x-auto no-scrollbar flex space-x-2 border-b border-neutral-900 pb-2">
        {SHEET_NAMES.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-xs sm:text-sm font-medium rounded-lg whitespace-nowrap transition-all duration-150 ${
              activeTab === tab
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'bg-neutral-900 text-neutral-400 hover:bg-neutral-800'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Core Grid Cards layout panel */}
      <main className="max-w-6xl mx-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-neutral-500 gap-2">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent"></div>
            <span className="text-xs tracking-wide">Syncing market metrics...</span>
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-16 text-neutral-500 text-sm">No live metrics rows detected for this date page context.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.map((item, idx) => (
              <div 
                key={idx} 
                className={`p-4 sm:p-5 rounded-xl border transition-all relative overflow-hidden backdrop-blur-sm flex flex-col justify-between ${
                  item.isSoldOut 
                    ? 'bg-neutral-950/40 border-red-950/50 opacity-45 select-none' 
                    : 'bg-neutral-900/40 border-neutral-800/60 hover:border-neutral-700/80 shadow-sm'
                }`}
              >
                {/* Out Of Stock Accent Banner */}
                {item.isSoldOut && (
                  <div className="absolute top-0 right-0 bg-red-600 text-white text-[9px] font-bold uppercase px-2.5 py-0.5 rounded-bl tracking-widest animate-pulse">
                    Sold Out
                  </div>
                )}

                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-white pr-12 leading-snug mb-3">
                    {item.name}
                  </h3>
                  
                  {/* TruSea Price Benchmarks Panel */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="bg-neutral-950/60 p-2.5 rounded-lg border border-neutral-850 text-center">
                      <span className="block text-[10px] uppercase tracking-wider text-neutral-400 mb-0.5">TruSea 500g</span>
                      <span className={`text-sm font-bold ${item.isSoldOut ? 'text-neutral-500 line-through' : 'text-blue-400'}`}>
                        {item.truSea500g}
                      </span>
                    </div>
                    <div className="bg-neutral-950/60 p-2.5 rounded-lg border border-neutral-850 text-center">
                      <span className="block text-[10px] uppercase tracking-wider text-neutral-400 mb-0.5">TruSea /KG</span>
                      <span className={`text-sm font-bold ${item.isSoldOut ? 'text-neutral-500 line-through' : 'text-emerald-400'}`}>
                        {item.truSeaKg}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Competitors List Panel Grouping */}
                <div className="border-t border-neutral-800/60 pt-3 space-y-1.5 text-xs">
                  <div className="flex justify-between text-neutral-400">
                    <span>TenderCuts</span>
                    <span className="font-medium text-neutral-200">{item.tenderCuts}</span>
                  </div>
                  <div className="flex justify-between text-neutral-400">
                    <span>Licious</span>
                    <span className="font-medium text-neutral-200">{item.licious}</span>
                  </div>
                  <div className="flex justify-between text-neutral-400">
                    <span>Freshma</span>
                    <span className="font-medium text-neutral-200">{item.freshma}</span>
                  </div>
                  <div className="flex justify-between text-neutral-400">
                    <span>FreshToHome</span>
                    <span className="font-medium text-neutral-200">{item.freshToHome}</span>
                  </div>
                  <div className="flex justify-between text-neutral-400">
                    <span>Supreme Seafoods</span>
                    <span className="font-medium text-neutral-200">{item.supreme}</span>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
