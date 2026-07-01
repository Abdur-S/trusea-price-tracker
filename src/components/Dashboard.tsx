import React, { useState, useEffect } from 'react';

const SPREADSHEET_ID = "1ax65ntAlS7Qs-rFIZcFLaXt31sA8xLrM5BRm305f-8Y";

// Make sure these match your exact sheet tab names down to the letter
const SHEET_NAMES = ["Sheet1", "Sheet2", "Sheet3", "Sheet4"]; 

interface FishItem {
  name: string;
  myPrice: string;
  comp1Price: string;
  comp2Price: string;
  isSoldOut: boolean;
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState(SHEET_NAMES[0]);
  const [data, setData] = useState<FishItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCSVData(activeTab);
  }, [activeTab]);

  // Helper function to parse CSV lines safely
  const parseCSV = (text: string) => {
    const lines = text.split('\n');
    return lines.map(line => {
      // Handles commas inside quotes safely
      const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
      return matches ? matches.map(val => val.replace(/^"| font-style:|"$/g, '')) : line.split(',');
    });
  };

  const fetchCSVData = async (sheetName: string) => {
    setLoading(true);
    try {
      // Fetching the public CSV version of the specific sheet tab grid
      const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
      
      const response = await fetch(url);
      const csvText = await response.text();
      const parsedRows = parseCSV(csvText);

      // Assuming Row 1 is headers (Fish Name, Your Price, Comp 1, Comp 2, Status/Sold Out)
      const fishItems: FishItem[] = parsedRows.slice(1).map((row) => {
        const name = row[0] || '';
        const myPrice = row[1] || 'N/A';
        const comp1Price = row[2] || 'N/A';
        const comp2Price = row[3] || 'N/A';
        
        // Checks if column 5 (E) says "sold out", "red", or "no stock"
        const statusColumn = row[4] ? row[4].toLowerCase().trim() : '';
        const isSoldOut = statusColumn.includes('sold out') || statusColumn.includes('red');

        return { name, myPrice, comp1Price, comp2Price, isSoldOut };
      });

      // Filter out blank placeholder spreadsheet lines
      setData(fishItems.filter(item => item.name && item.name.trim() !== ''));
    } catch (error) {
      console.error("Error reading public spreadsheet CSV framework directly:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-gray-100 p-4 sm:p-6 font-sans antialiased">
      {/* Brand Header */}
      <header className="max-w-6xl mx-auto mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-neutral-800 pb-4 gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            TruSea <span className="text-blue-500 font-medium text-sm sm:text-base border border-blue-500/30 px-2 py-0.5 rounded bg-blue-500/10">Price Engine</span>
          </h1>
          <p className="text-xs text-neutral-400 mt-1 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Live syncing via public CSV database link
          </p>
        </div>
      </header>

      {/* Categories Navigator Menu */}
      <div className="max-w-6xl mx-auto mb-6 overflow-x-auto no-scrollbar flex space-x-2 border-b border-neutral-900 pb-2">
        {SHEET_NAMES.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-xs sm:text-sm font-medium rounded-lg whitespace-nowrap transition-all duration-150 ${
              activeTab === tab
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'bg-neutral-900 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Mobile-First Layout Grid Cards */}
      <main className="max-w-6xl mx-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-neutral-500 gap-2">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent"></div>
            <span className="text-xs tracking-wide">Fetching stock data...</span>
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-16 text-neutral-500 text-sm">No live data matches found for this page catalog.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {data.map((item, idx) => (
              <div 
                key={idx} 
                className={`p-4 sm:p-5 rounded-xl border transition-all relative overflow-hidden backdrop-blur-sm ${
                  item.isSoldOut 
                    ? 'bg-neutral-950/20 border-red-950/40 opacity-40 select-none' 
                    : 'bg-neutral-900/40 border-neutral-800/60 hover:border-neutral-700/80 shadow-sm'
                }`}
              >
                {item.isSoldOut && (
                  <div className="absolute top-0 right-0 bg-red-600 text-white text-[9px] font-bold uppercase px-2.5 py-0.5 rounded-bl tracking-widest">
                    Sold Out
                  </div>
                )}

                <h3 className="text-base sm:text-lg font-semibold text-white pr-12 truncate">{item.name}</h3>
                
                <div className="mt-3.5 space-y-1.5">
                  <div className="flex justify-between items-center bg-neutral-950/60 px-3 py-2 rounded-lg border border-neutral-850">
                    <span className="text-xs font-medium text-neutral-400">TruSea Cost (/kg)</span>
                    <span className={`text-sm font-bold ${item.isSoldOut ? 'text-neutral-500 line-through' : 'text-emerald-400'}`}>
                      {item.myPrice}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center px-3 py-1.5">
                    <span className="text-xs text-neutral-500">Competitor 1</span>
                    <span className="text-xs sm:text-sm font-medium text-neutral-300">{item.comp1Price}</span>
                  </div>

                  <div className="flex justify-between items-center px-3 py-1.5">
                    <span className="text-xs text-neutral-500">Competitor 2</span>
                    <span className="text-xs sm:text-sm font-medium text-neutral-300">{item.comp2Price}</span>
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
