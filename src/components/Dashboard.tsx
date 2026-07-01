import React, { useState, useEffect } from 'react';

// Configuration details
const API_KEY = "YOUR_GOOGLE_API_KEY"; // Replace with your real Google API Key
const SPREADSHEET_ID = "1ax65ntAlS7Qs-rFIZcFLaXt31sA8xLrM5BRm305f-8Y";
const SHEET_NAMES = ["Sheet1", "Sheet2", "Sheet3", "Sheet4"]; // Modify to perfectly match your tab names

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
    fetchSheetData(activeTab);
  }, [activeTab]);

  const fetchSheetData = async (sheetName: string) => {
    setLoading(true);
    try {
      // API call requests raw string values along with backing userEnteredFormat layout configurations
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}?ranges=${sheetName}!A2:E60&fields=sheets(data(rowData(values(formattedValue,userEnteredFormat(backgroundColor)))))&key=${API_KEY}`;
      
      const response = await fetch(url);
      const resData = await response.json();
      
      const rows = resData.sheets[0].data[0].rowData || [];
      
      const parsedData: FishItem[] = rows.map((row: any) => {
        const values = row.values || [];
        
        // Checks cell metadata targeting specific custom Red hex/RGB fill attributes
        const isRed = (cell: any) => {
          const bg = cell?.userEnteredFormat?.backgroundColor;
          if (!bg) return false;
          return (bg.red > 0.7 && (!bg.green || bg.green < 0.35) && (!bg.blue || bg.blue < 0.35));
        };

        // Flags standard item out-of-stock instantly if either the identity or original baseline cost fields read red.
        const soldOutCondition = isRed(values[0]) || isRed(values[1]);

        return {
          name: values[0]?.formattedValue || 'Unknown Fish',
          myPrice: values[1]?.formattedValue || 'N/A',
          comp1Price: values[2]?.formattedValue || 'N/A',
          comp2Price: values[3]?.formattedValue || 'N/A',
          isSoldOut: soldOutCondition
        };
      });

      // Filter empty rows out clean
      setData(parsedData.filter(item => item.name !== 'Unknown Fish' && item.name.trim() !== ''));
    } catch (error) {
      console.error("Failed to parse sheet grid array context parameters:", error);
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
            Live syncing dynamic mobile database grids
          </p>
        </div>
      </header>

      {/* Categories Navigator Menu (Smooth swipe interface adjustments built-in) */}
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

      {/* Mobile Card Component Display Grids */}
      <main className="max-w-6xl mx-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-neutral-500 gap-2">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent"></div>
            <span className="text-xs tracking-wide">Syncing market sheets...</span>
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-16 text-neutral-500 text-sm">No inventory listing tracks detected on this sheet page layout.</div>
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
                {/* Out Of Stock Accent Banner */}
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
                    <span className="text-xs text-neutral-500">Competitor A</span>
                    <span className="text-xs sm:text-sm font-medium text-neutral-300">{item.comp1Price}</span>
                  </div>

                  <div className="flex justify-between items-center px-3 py-1.5">
                    <span className="text-xs text-neutral-500">Competitor B</span>
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
