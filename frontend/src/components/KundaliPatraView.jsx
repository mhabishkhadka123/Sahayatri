import React from 'react';

export default function KundaliPatraView({ kundaliData }) {
  if (!kundaliData || (!kundaliData.zodiacSign && !kundaliData.rashi)) return null;

  const zodiacSign = kundaliData.zodiacSign || kundaliData.rashi || 'Kanya';
  const moonSign = kundaliData.moonSign || 'Vrishchika';
  const nakshatra = kundaliData.nakshatra || 'Jyeshtha';

  // Graha Sthiti table data
  const planetaryPositions = [
    { planet: 'सूर्य (Sun)', sign: zodiacSign, degree: "12° 45'", house: '1' },
    { planet: 'चन्द्र (Moon)', sign: moonSign, degree: "04° 15'", house: '4' },
    { planet: 'मङ्गल (Mars)', sign: 'सिंह', degree: "22° 10'", house: '7' },
    { planet: 'बुध (Mercury)', sign: 'कन्या', degree: "15° 30'", house: '2' },
    { planet: 'गुरु (Jupiter)', sign: 'मीन', degree: "08° 50'", house: '5' },
    { planet: 'शुक्र (Venus)', sign: 'तुला', degree: "19° 00'", house: '10' },
    { planet: 'शनि (Saturn)', sign: 'कुम्भ', degree: "25° 40'", house: '11' },
    { planet: 'राहु (Rahu)', sign: 'वृष', degree: "11° 20'", house: '3' },
    { planet: 'केतु (Ketu)', sign: 'वृश्चिक', degree: "11° 20'", house: '9' },
  ];

  return (
    <div className="bg-amber-50/40 border border-amber-200 rounded-xl p-6 shadow-sm mt-6 text-left">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-amber-200 pb-4 mb-6">
        <div>
          <h3 className="text-xl font-bold text-amber-900 flex items-center gap-2">
            🕉️ जन्म कुंडली पत्र (Kundali Patra)
          </h3>
          <p className="text-sm text-amber-700 mt-1">
            स्थान: {kundaliData.birthPlace || 'Dharan'} | समय: {kundaliData.birthTime || '09:07'}
          </p>
        </div>
        <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-semibold rounded-full border border-amber-300">
          वैदिक ज्योतिष
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        {/* 12-House Grid (Hamro Patro Style) */}
        <div className="bg-white border-2 border-amber-800/30 rounded-lg p-4 shadow-inner flex flex-col items-center">
          <span className="text-xs font-bold text-amber-800 mb-3 uppercase tracking-wider">
            राशी चक्र (Kundali Chart)
          </span>
          <div className="w-64 h-64 border-2 border-amber-900 grid grid-cols-3 grid-rows-3 bg-amber-50/20 text-xs">
            <div className="border border-amber-900/40 p-2 flex flex-col justify-between items-center text-center">
              <span className="text-[10px] text-gray-400">१</span>
              <span className="font-bold text-amber-900">{zodiacSign}</span>
              <span className="text-[9px] text-amber-700">सु</span>
            </div>
            <div className="border border-amber-900/40 p-2 flex flex-col justify-between items-center text-center">
              <span className="text-[10px] text-gray-400">२</span>
              <span className="font-semibold">बुध</span>
            </div>
            <div className="border border-amber-900/40 p-2 flex flex-col justify-between items-center text-center">
              <span className="text-[10px] text-gray-400">३</span>
              <span className="font-semibold">राहु</span>
            </div>

            <div className="border border-amber-900/40 p-2 flex flex-col justify-between items-center text-center">
              <span className="text-[10px] text-gray-400">१२</span>
              <span className="font-semibold">-</span>
            </div>
            <div className="border border-amber-900/40 p-2 flex flex-col justify-center items-center text-center bg-amber-100/60">
              <span className="font-bold text-amber-900 text-xs">लग्न</span>
            </div>
            <div className="border border-amber-900/40 p-2 flex flex-col justify-between items-center text-center">
              <span className="text-[10px] text-gray-400">४</span>
              <span className="font-semibold text-amber-900">{moonSign}</span>
            </div>

            <div className="border border-amber-900/40 p-2 flex flex-col justify-between items-center text-center">
              <span className="text-[10px] text-gray-400">११</span>
              <span className="font-semibold">शनि</span>
            </div>
            <div className="border border-amber-900/40 p-2 flex flex-col justify-between items-center text-center">
              <span className="text-[10px] text-gray-400">१०</span>
              <span className="font-semibold">शुक्र</span>
            </div>
            <div className="border border-amber-900/40 p-2 flex flex-col justify-between items-center text-center">
              <span className="text-[10px] text-gray-400">५-९</span>
              <span className="font-semibold">गुरु / मङ्गल</span>
            </div>
          </div>
        </div>

        {/* Details Cards */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-white p-3 rounded-lg border border-amber-200 shadow-sm">
            <span className="text-xs text-gray-500 block">राशि (Zodiac)</span>
            <span className="font-bold text-amber-900 text-base">{zodiacSign}</span>
          </div>
          <div className="bg-white p-3 rounded-lg border border-amber-200 shadow-sm">
            <span className="text-xs text-gray-500 block">चन्द्र राशि (Moon Sign)</span>
            <span className="font-bold text-amber-900 text-base">{moonSign}</span>
          </div>
          <div className="bg-white p-3 rounded-lg border border-amber-200 shadow-sm">
            <span className="text-xs text-gray-500 block">नक्षत्र (Nakshatra)</span>
            <span className="font-bold text-amber-900 text-base">{nakshatra}</span>
          </div>
          <div className="bg-white p-3 rounded-lg border border-amber-200 shadow-sm">
            <span className="text-xs text-gray-500 block">पाव / चरण (Pada)</span>
            <span className="font-bold text-amber-900 text-base">३ (Third)</span>
          </div>
        </div>
      </div>

      {/* Planetary Positions Table */}
      <div className="mt-6">
        <h4 className="text-md font-bold text-amber-900 mb-3">ग्रह स्थिति (Planetary Positions)</h4>
        <div className="overflow-x-auto bg-white rounded-lg border border-amber-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-amber-100/70 text-amber-900 border-b border-amber-200">
              <tr>
                <th className="p-3">ग्रह (Planet)</th>
                <th className="p-3">राशि (Sign)</th>
                <th className="p-3">अंश (Degree)</th>
                <th className="p-3">भाव (House)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-100">
              {planetaryPositions.map((item, idx) => (
                <tr key={idx} className="hover:bg-amber-50/50">
                  <td className="p-3 font-medium text-gray-800">{item.planet}</td>
                  <td className="p-3 text-gray-600">{item.sign}</td>
                  <td className="p-3 text-gray-600">{item.degree}</td>
                  <td className="p-3 text-gray-600 font-semibold">{item.house}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}