
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { CalculatorInputs, CalculationResult, CountryConfig, CountryCode } from './types';
import { formatCurrency, formatPercent } from './utils/formatters';

// Firebase 초기화
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  deleteDoc,
  doc
} from 'firebase/firestore';

// 엑셀 다운로드용
import * as XLSX from 'xlsx';

// Firebase 설정
const firebaseConfig = {
  apiKey: "AIzaSyC_zi7fxcsVEC_e6vTkkSr8ngzlpT3Tja4",
  authDomain: "shopee-margin-pro.firebaseapp.com",
  projectId: "shopee-margin-pro",
  storageBucket: "shopee-margin-pro.firebasestorage.app",
  messagingSenderId: "226638166012",
  appId: "1:226638166012:web:fef88eabbcf83b9807e479",
  measurementId: "G-MSGE32YLE0"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 히스토리 아이템 타입 정의
interface HistoryItem {
  id: string;
  productName: string;
  countryCode: string;
  costKRW: number;
  sellingPriceLocal: number;
  shippingKRW: number;
  exchangeRate: number;
  feeRate: number;
  netProfitKRW: number;
  marginRate: number;
  createdAt: Timestamp | null;
}

const COUNTRIES: CountryConfig[] = [
  { code: 'SG', name: '싱가포르', currency: 'SGD', defaultExchangeRate: 1020, flag: '🇸🇬' },
  { code: 'MY', name: '말레이시아', currency: 'MYR', defaultExchangeRate: 305, flag: '🇲🇾' },
  { code: 'PH', name: '필리핀', currency: 'PHP', defaultExchangeRate: 23.5, flag: '🇵🇭' },
  { code: 'VN', name: '베트남', currency: 'VND', defaultExchangeRate: 0.053, flag: '🇻🇳' },
  { code: 'TH', name: '태국', currency: 'THB', defaultExchangeRate: 38.5, flag: '🇹🇭' },
  { code: 'TW', name: '대만', currency: 'TWD', defaultExchangeRate: 42.5, flag: '🇹🇼' },
  { code: 'BR', name: '브라질', currency: 'BRL', defaultExchangeRate: 255, flag: '🇧🇷' },
  { code: 'MX', name: '멕시코', currency: 'MXN', defaultExchangeRate: 72, flag: '🇲🇽' },
];

const App: React.FC = () => {
  const [inputs, setInputs] = useState<CalculatorInputs>({
    productName: '',
    countryCode: 'SG',
    costKRW: 0,
    sellingPriceLocal: 0,
    shippingKRW: 0,
    exchangeRate: 1020,
    feeRate: 10,
  });

  const [result, setResult] = useState<CalculationResult | null>(null);

  // 히스토리 상태 추가
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // 필터 상태 추가
  const [filterCountry, setFilterCountry] = useState<string>('ALL');

  // 더보기 상태 추가
  const [showAll, setShowAll] = useState<boolean>(false);

  const selectedCountry = useMemo(() =>
    COUNTRIES.find(c => c.code === inputs.countryCode) || COUNTRIES[0]
    , [inputs.countryCode]);

  // Firestore에서 히스토리 불러오기 (전체 데이터)
  const fetchHistory = useCallback(async () => {
    try {
      const calculationsRef = collection(db, 'calculations');
      const q = query(calculationsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);

      const historyData: HistoryItem[] = [];
      querySnapshot.forEach((doc) => {
        historyData.push({
          id: doc.id,
          ...doc.data()
        } as HistoryItem);
      });

      setHistory(historyData);
    } catch (error) {
      console.error('히스토리 불러오기 실패:', error);
    }
  }, []);

  // 컴포넌트 마운트 시 히스토리 불러오기
  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // 히스토리 삭제 함수
  const deleteHistory = useCallback(async (id: string) => {
    if (!window.confirm('이 기록을 삭제하시겠습니까?')) return;

    try {
      await deleteDoc(doc(db, 'calculations', id));
      await fetchHistory();
      alert('✅ 삭제되었습니다!');
    } catch (error) {
      console.error('삭제 실패:', error);
      alert('❌ 삭제에 실패했습니다.');
    }
  }, [fetchHistory]);

  // 필터링된 히스토리
  const filteredHistory = useMemo(() => {
    if (filterCountry === 'ALL') return history;
    return history.filter(item => item.countryCode === filterCountry);
  }, [history, filterCountry]);

  // 엑셀 다운로드 함수 (필터링된 데이터 기준)
  const downloadExcel = useCallback(() => {
    try {
      console.log('필터 상태:', filterCountry);
      console.log('전체 히스토리:', history.length);
      console.log('필터된 히스토리:', filteredHistory.length);

      const dataToExport = filteredHistory;

      const excelData: any[] = dataToExport.map((item) => {
        const countryInfo = COUNTRIES.find(c => c.code === item.countryCode);
        return {
          '상품명': item.productName || '',
          '국가': countryInfo?.name || item.countryCode,
          '매입원가(원)': item.costKRW,
          '판매가': item.sellingPriceLocal,
          '배송비(원)': item.shippingKRW,
          '환율': item.exchangeRate,
          '수수료율(%)': item.feeRate,
          '순수익(원)': Math.round(item.netProfitKRW),
          '마진율(%)': item.marginRate?.toFixed(1),
          '생성일시': item.createdAt?.toDate?.()?.toLocaleString('ko-KR') || ''
        };
      });

      if (excelData.length === 0) {
        alert('다운로드할 데이터가 없습니다.');
        return;
      }

      // 엑셀 파일 생성
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      const sheetName = filterCountry === 'ALL' ? '전체기록' : `${COUNTRIES.find(c => c.code === filterCountry)?.name || filterCountry}기록`;
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

      // 파일 다운로드
      const filterSuffix = filterCountry === 'ALL' ? 'all' : filterCountry.toLowerCase();
      const fileName = `shopee_margin_${filterSuffix}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      alert(`✅ ${excelData.length}개의 기록이 다운로드되었습니다!`);
    } catch (error) {
      console.error('엑셀 다운로드 실패:', error);
      alert('❌ 다운로드에 실패했습니다.');
    }
  }, [filteredHistory, filterCountry]);

  const handleCountryChange = (code: CountryCode) => {
    const country = COUNTRIES.find(c => c.code === code);
    if (country) {
      setInputs(prev => ({
        ...prev,
        countryCode: code,
        exchangeRate: country.defaultExchangeRate
      }));
      setResult(null);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setInputs((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };

  const calculateMargin = useCallback(async () => {
    const { productName, countryCode, costKRW, sellingPriceLocal, shippingKRW, exchangeRate, feeRate } = inputs;
    const revenueKRW = sellingPriceLocal * exchangeRate;
    const marketFeeKRW = revenueKRW * (feeRate / 100);
    const totalExpensesKRW = costKRW + shippingKRW + marketFeeKRW;
    const netProfitKRW = revenueKRW - totalExpensesKRW;
    const marginRate = revenueKRW > 0 ? (netProfitKRW / revenueKRW) * 100 : 0;

    setResult({
      revenueKRW,
      marketFeeKRW,
      totalExpensesKRW,
      netProfitKRW,
      marginRate,
      localCurrency: selectedCountry.currency
    });

    // Firestore에 계산 결과 저장
    try {
      await addDoc(collection(db, 'calculations'), {
        productName,
        countryCode,
        costKRW,
        sellingPriceLocal,
        shippingKRW,
        exchangeRate,
        feeRate,
        netProfitKRW,
        marginRate,
        createdAt: serverTimestamp()
      });

      alert('✅ 계산 결과가 저장되었습니다!');

      // 입력 폼 초기화
      setInputs({
        productName: '',
        countryCode: inputs.countryCode,
        costKRW: 0,
        sellingPriceLocal: 0,
        shippingKRW: 0,
        exchangeRate: inputs.exchangeRate,
        feeRate: 10,
      });

      // 히스토리 다시 불러오기
      await fetchHistory();
    } catch (error) {
      console.error('저장 실패:', error);
      alert('❌ 저장에 실패했습니다. 콘솔을 확인해주세요.');
    }
  }, [inputs, selectedCountry, fetchHistory]);

  const inputBaseClass = "w-full px-4 py-3 rounded-2xl bg-indigo-50 border border-indigo-100 focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all outline-none font-black text-gray-900 text-lg shadow-sm placeholder:text-gray-300";
  const labelBaseClass = "block text-base font-black text-gray-900 mb-1.5";

  return (
    <div className="min-h-screen bg-slate-100 py-6 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-xl mx-auto">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-4 bg-white p-4 rounded-3xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-xl shrink-0 shadow-lg shadow-indigo-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-900 leading-none">Shopee Margin Pro</h1>
              <p className="text-[10px] text-indigo-600 font-black uppercase tracking-widest mt-1">Global Profit Calculator</p>
            </div>
          </div>
          <span className="text-[10px] font-black text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">V3.1 READY</span>
        </div>

        {/* Country Selector */}
        <div className="mb-5 bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex flex-wrap gap-2 justify-center">
            {COUNTRIES.map((country) => (
              <button
                key={country.code}
                onClick={() => handleCountryChange(country.code)}
                className={`flex items-center justify-center min-w-[50px] px-4 py-2 rounded-xl border-2 transition-all text-xs font-black shadow-sm ${inputs.countryCode === country.code
                  ? 'bg-indigo-600 border-indigo-600 text-white transform scale-105 z-10'
                  : 'bg-white border-gray-100 text-gray-900 hover:border-indigo-200'
                  }`}
              >
                <span className="whitespace-nowrap">{country.code}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Calculator Form */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-200">
          <div className="p-6 sm:p-8">
            <div className="space-y-5">
              {/* Product Name */}
              <div>
                <label className={labelBaseClass}>상품 정보</label>
                <input
                  type="text"
                  name="productName"
                  value={inputs.productName}
                  onChange={handleInputChange}
                  placeholder="예: K-뷰티 스킨케어 세트"
                  className={inputBaseClass}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Cost KRW */}
                <div>
                  <label className={labelBaseClass}>매입 원가</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-black text-base">₩</span>
                    <input
                      type="number"
                      name="costKRW"
                      value={inputs.costKRW || ''}
                      onChange={handleInputChange}
                      className={`${inputBaseClass} pl-10 text-right`}
                    />
                  </div>
                </div>

                {/* Selling Price Local */}
                <div>
                  <label className={labelBaseClass}>판매가 ({selectedCountry.name})</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400 font-black text-xs">{selectedCountry.currency}</span>
                    <input
                      type="number"
                      name="sellingPriceLocal"
                      value={inputs.sellingPriceLocal || ''}
                      onChange={handleInputChange}
                      className={`${inputBaseClass} pl-12 text-right text-indigo-900`}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Shipping KRW */}
                <div>
                  <label className={labelBaseClass}>배송비</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-black text-base">₩</span>
                    <input
                      type="number"
                      name="shippingKRW"
                      value={inputs.shippingKRW || ''}
                      onChange={handleInputChange}
                      className={`${inputBaseClass} pl-10 text-right`}
                    />
                  </div>
                </div>

                {/* Exchange Rate */}
                <div>
                  <label className={labelBaseClass}>적용 환율</label>
                  <div className="relative">
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-black text-[10px]">원</span>
                    <input
                      type="number"
                      name="exchangeRate"
                      value={inputs.exchangeRate || ''}
                      onChange={handleInputChange}
                      step="0.001"
                      className={`${inputBaseClass} pr-8 text-right`}
                    />
                  </div>
                </div>
              </div>

              {/* Fee Rate Slider */}
              <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 shadow-inner">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-base font-black text-gray-900">마켓 수수료율</label>
                  <span className="text-indigo-700 font-black text-xl">{inputs.feeRate}%</span>
                </div>
                <input
                  type="range"
                  name="feeRate"
                  min="0"
                  max="40"
                  step="0.1"
                  value={inputs.feeRate}
                  onChange={handleInputChange}
                  className="w-full h-2.5 bg-indigo-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              <button
                onClick={calculateMargin}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-200 transition-all transform active:scale-95 flex items-center justify-center gap-3 text-lg"
              >
                <span>마진 계산하기</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Results Section */}
        {result && (
          <div className="mt-6 space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-12">
            <div className="bg-white rounded-3xl shadow-2xl border-2 border-indigo-50 overflow-hidden">
              <div className="bg-gray-900 px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{selectedCountry.flag}</span>
                  <span className="text-white font-black text-base">{selectedCountry.name} 정밀 분석</span>
                </div>
              </div>

              <div className="p-0">
                <table className="w-full text-left border-collapse">
                  <tbody>
                    <tr className="border-b border-gray-100 bg-white">
                      <td className="px-6 py-4 text-base font-black text-gray-600">현지 판매가 ({selectedCountry.currency})</td>
                      <td className="px-6 py-4 text-lg font-black text-gray-900 text-right">{formatCurrency(inputs.sellingPriceLocal, result.localCurrency)}</td>
                    </tr>
                    <tr className="border-b border-gray-100 bg-indigo-50/20">
                      <td className="px-6 py-4 text-base font-black text-gray-600">예상 매출액 (KRW)</td>
                      <td className="px-6 py-4 text-lg font-black text-gray-900 text-right">{formatCurrency(result.revenueKRW, 'KRW')}</td>
                    </tr>
                    <tr className="border-b border-gray-100 bg-white">
                      <td className="px-6 py-4 text-base font-black text-gray-600">플랫폼 수수료</td>
                      <td className="px-6 py-4 text-lg font-black text-red-500 text-right">-{formatCurrency(result.marketFeeKRW, 'KRW')}</td>
                    </tr>
                    <tr className="border-b border-gray-100 bg-indigo-50/20">
                      <td className="px-6 py-4 text-base font-black text-gray-600">마진율</td>
                      <td className={`px-6 py-4 text-xl font-black text-right ${result.marginRate >= 15 ? 'text-green-600' : result.marginRate > 0 ? 'text-indigo-600' : 'text-red-600'}`}>
                        {formatPercent(result.marginRate)}
                      </td>
                    </tr>
                  </tbody>
                </table>

                <div className="p-6 bg-indigo-600 flex justify-between items-center shadow-inner">
                  <div className="text-white">
                    <h4 className="text-indigo-100 text-[10px] font-black uppercase tracking-[0.2em] mb-0.5">Final Net Profit</h4>
                    <p className="text-lg font-black">최종 예상 순수익</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl sm:text-4xl font-black text-white drop-shadow-md">
                      {formatCurrency(result.netProfitKRW, 'KRW')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Insight Card */}
            <div className="bg-white border-2 border-indigo-100 rounded-3xl p-5 flex items-start gap-4 shadow-sm">
              <div className="p-2.5 bg-indigo-50 rounded-2xl shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-black text-indigo-900 mb-0.5">{selectedCountry.name} 마켓 핵심 팁</p>
                <p className="text-[13px] font-bold text-gray-700 leading-relaxed">
                  {selectedCountry.code === 'VN' ? '베트남 동(VND)은 계산 단위가 매우 큽니다. 환율과 판매가 입력 시 0의 개수를 반드시 재확인하세요.' :
                    selectedCountry.code === 'BR' ? '브라질은 관세 및 배송 지연 변수가 많으므로 최소 20% 이상의 마진율 설정을 권장합니다.' :
                      `쇼피 ${selectedCountry.name} 판매 시 서비스 수수료(FSP, CCB) 참여 여부에 따라 실제 정산 금액이 달라질 수 있습니다.`}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 계산 히스토리 */}
        {history.length > 0 && (
          <div className="mt-6 bg-white rounded-3xl shadow-sm border border-gray-200 p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                계산 기록
              </h3>
              <div className="flex items-center gap-2">
                {/* 국가 필터 */}
                <select
                  value={filterCountry}
                  onChange={(e) => {
                    setFilterCountry(e.target.value);
                    setShowAll(false);
                  }}
                  className="text-xs font-bold bg-gray-100 border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ALL">🌏 전체</option>
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
                  ))}
                </select>
                {/* 엑셀 다운로드 */}
                <button
                  onClick={downloadExcel}
                  className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all shadow-sm"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  엑셀
                </button>
              </div>
            </div>

            {filteredHistory.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-4">해당 국가의 기록이 없습니다.</p>
            ) : (
              <>
                <ul className="space-y-2">
                  {(showAll ? filteredHistory : filteredHistory.slice(0, 5)).map((item) => {
                    const countryInfo = COUNTRIES.find(c => c.code === item.countryCode);
                    return (
                      <li
                        key={item.id}
                        className="flex justify-between items-center bg-indigo-50/50 px-4 py-3 rounded-xl border border-indigo-100"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-base">{countryInfo?.flag || '🌏'}</span>
                          <span className="font-bold text-gray-800 text-sm truncate max-w-[120px]">
                            {item.productName || '(상품명 없음)'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm shrink-0">
                          <span className={`font-black ${item.netProfitKRW >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ₩{item.netProfitKRW?.toLocaleString() || 0}
                          </span>
                          <span className="text-indigo-600 font-black">
                            ({item.marginRate?.toFixed(1) || 0}%)
                          </span>
                          {/* 삭제 버튼 */}
                          <button
                            onClick={() => deleteHistory(item.id)}
                            className="ml-1 p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="삭제"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
                {/* 더보기/접기 버튼 */}
                {filteredHistory.length > 5 && (
                  <button
                    onClick={() => setShowAll(!showAll)}
                    className="w-full mt-3 py-2 text-sm font-bold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-xl transition-all flex items-center justify-center gap-1"
                  >
                    {showAll ? (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                        접기
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                        더보기 ({filteredHistory.length - 5}개 더)
                      </>
                    )}
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 mb-6 text-center">
          <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.5em]">
            Shopee Margin Calculator Pro
          </p>
        </div>
      </div>
    </div>
  );
};

export default App;
