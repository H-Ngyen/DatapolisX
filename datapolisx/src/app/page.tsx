"use client";

import React, { useState, useEffect } from "react";
import {
  Truck,
  Car,
  Bike,
  Bus,
  Info,
  Clock,
  Home,
  Search,
  Github
} from "lucide-react";
import { useApiCall } from "../hooks/useApiCall";
import camInfo from "../assets/cam_info.json";

// --- Camera Location Helper ---
const getLocationByCamId = (camId: string): string => {
  const cam = camInfo.data_filtered_final.find(c => c.CamId === camId);
  return cam?.DisplayName || "Không xác định";
};

interface TrafficItem {
  id: string;
  si_score: number;
  composition: { primary: string };
  change_percent: number;
  rank?: number;
  location?: string;
}

interface DashboardResponse {
  success: boolean;
  data: TrafficItem[];
}

// --- Helper Functions ---

const getStatusConfig = (score: number) => {
  if (score > 120) return { color: "bg-purple-600", text: "Kẹt cứng", textColor: "text-white" };
  if (score > 95) return { color: "bg-red-500", text: "Tắc nghẽn", textColor: "text-white" };
  if (score > 80) return { color: "bg-orange-500", text: "Ùn ứ", textColor: "text-white" };
  if (score > 50) return { color: "bg-yellow-400", text: "Đông chậm", textColor: "text-black" };
  return { color: "bg-green-500", text: "Thông thoáng", textColor: "text-white" };
};



const getVehicleIcon = (primary: string) => {
  switch (primary) {
    case "truck":
      return { icon: <Truck className="w-3.5 h-3.5" />, text: "Chủ yếu xe máy xe tải", color: "text-amber-600" };
    case "car":
      return { icon: <Car className="w-3.5 h-3.5" />, text: "Chủ yếu xe máy ô tô", color: "text-blue-600" };
    case "bus":
      return { icon: <Bus className="w-3.5 h-3.5" />, text: "Chủ yếu xe máy xe BUS", color: "text-green-600" };
    case "bigcar":
      return { icon: <Truck className="w-3.5 h-3.5" />, text: "Chủ yếu xe máy xe lớn", color: "text-orange-600" };
    default:
      return { icon: <Bike className="w-3.5 h-3.5" />, text: "Chủ yếu xe máy", color: "text-purple-600" };
  }
};

// --- Components ---

const LegendBar = ({ currentTime, currentDate }: { currentTime: string, currentDate: string }) => {
  const legends = [
    { color: "bg-green-500", label: "0-50", text: "Thông thoáng", textColor: "text-black" },
    { color: "bg-yellow-400", label: "51-80", text: "Đông chậm", textColor: "text-black" },
    { color: "bg-orange-500", label: "81-95", text: "Ùn ứ", textColor: "text-white" },
    { color: "bg-red-500", label: "96-120", text: "Tắc nghẽn", textColor: "text-white" },
    { color: "bg-purple-600", label: ">120", text: "Kẹt cứng", textColor: "text-white" }
  ];

  return (
    <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 py-4 shadow-sm">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex flex-col gap-4">
          
          {/* Top: Title & Time */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-1">
              Xếp hạng Giao thông
            </h1>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-3.5 h-3.5 text-gray-500" />
              <span className="font-bold text-gray-500">{currentTime}</span>
              <span className="text-gray-400">•</span>
              <span className="text-gray-500">{currentDate}</span>
              <span className="text-gray-400">•</span>
              <span className="text-gray-500">TP. Hồ Chí Minh</span>
            </div>
          </div>

          {/* Bottom: Legend */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between font-medium whitespace-nowrap">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Chỉ số tắc nghẽn (SI)
              </span>
            </div>
            <div className="flex overflow-hidden rounded-sm transition-[max-height] duration-500 max-md:flex-col max-h-40 md:max-h-14">
              {legends.map((item, idx) => (
                <div key={idx} className={`flex w-full gap-0.5 px-2 py-1 text-[12px] max-md:leading-[14px] md:flex-col md:pt-1 md:pb-4 md:text-[10px] ${item.color} ${item.textColor}`}>
                  <span className="w-[50px]">{item.label}</span>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

const StatusBadge = ({ data }: { data: TrafficItem & { rank: number } }) => {
  const config = getStatusConfig(data.si_score);

  return (
    <div
      className={`
        relative flex flex-col items-center justify-center 
        w-[88px] h-[52px] rounded-lg shadow-sm transition-all duration-300
        ${config.color} ${config.textColor}
      `}
    >
      {/* Score */}
      <div className="flex items-center font-bold text-lg leading-none">
        {data.si_score}
      </div>

      {/* Caption Status */}
      <span className="text-[10px] font-medium uppercase mt-0.5 opacity-90 tracking-tight">
        {config.text}
      </span>
    </div>
  );
};

export default function TrafficDashboard() {
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const { data: dashboardData, loading, error, execute } = useApiCall<DashboardResponse>();

  useEffect(() => {
    execute('/api/dashboard');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const locale = process.env.NEXT_PUBLIC_LOCALE;
      const timezone = process.env.NEXT_PUBLIC_TIMEZONE;
      
      setCurrentTime(new Intl.DateTimeFormat(locale, { timeZone: timezone, hour: '2-digit', minute: '2-digit' }).format(now));
      setCurrentDate(new Intl.DateTimeFormat(locale, { timeZone: timezone, weekday: 'long', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now));
    };
    
    updateTime();
    const interval = setInterval(updateTime, Number(process.env.NEXT_PUBLIC_TIME_UPDATE_INTERVAL));
    return () => clearInterval(interval);
  }, []);

  // Process API data: sort by si_score and add rank + location
  const trafficData = dashboardData?.data
    ? dashboardData.data
        .sort((a, b) => b.si_score - a.si_score)
        .map((item, index) => ({
          ...item,
          rank: index + 1,
          location: getLocationByCamId(item.id)
        }))
    : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4 animate-pulse" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Đang tải dữ liệu...</h1>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Info className="w-16 h-16 text-red-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Lỗi tải dữ liệu</h1>
          <p className="text-gray-600 mb-4">Không thể kết nối đến server</p>
          <button 
            onClick={() => execute('/api/dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-slate-900 flex flex-col">
      
      {/* Navigation Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <h1 className="text-xl font-bold text-blue-900 cursor-pointer" onClick={() => window.location.href = '/'}>DatapolisX</h1>
              <nav className="flex items-center gap-4">
                <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-700 bg-white/70 rounded-lg shadow-sm cursor-pointer">
                  <Home className="w-4 h-4" />
                  Trang chủ
                </button>
                <button 
                  onClick={() => window.location.href = '/search'}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-white/50 rounded-lg cursor-pointer"
                >
                  <Search className="w-4 h-4" />
                  Tìm kiếm
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Header & Legend Combined */}
      <LegendBar currentTime={currentTime} currentDate={currentDate} />

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 mt-6">
        
        {/* Table Container (Card style) */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          
          {/* Table Header (Desktop only) */}
          <div className="hidden md:flex bg-gray-50/50 text-xs font-semibold text-gray-400 uppercase tracking-wider py-3 px-4 border-b border-gray-100">
            <div className="w-16 text-center">Hạng</div>
            <div className="flex-1">Địa điểm</div>
            <div className="w-20 text-center">Xu hướng</div>
            <div className="w-24 text-right pr-2">Trạng thái</div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-gray-50">
            {trafficData.map((item) => {
              const vehicleInfo = getVehicleIcon(item.composition.primary);

              return (
                <div 
                  key={item.id} 
                  className="group flex items-center py-4 px-4 hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => window.location.href = `/search/${item.id}`}
                >
                  
                  {/* Column 1: Rank */}
                  <div className="w-12 md:w-16 flex-shrink-0 text-center">
                    <span className="text-xl font-bold text-gray-400 group-hover:text-gray-600 transition-colors">
                      {item.rank}
                    </span>
                  </div>

                  {/* Column 2: Location & Context */}
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-baseline gap-2 mb-1">
                      <h3 className="text-base font-bold text-gray-800 truncate">
                        {item.location}
                      </h3>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      {/* Vehicle Composition */}
                      <div className={`flex items-center gap-1 text-[11px] font-medium ${vehicleInfo.color}`}>
                        {vehicleInfo.icon}
                        <span>{vehicleInfo.text}</span>
                      </div>
                    </div>
                  </div>

                  {/* Column 3: Change Percentage */}
                  <div className="w-20 flex-shrink-0 text-center">
                    <div className={`text-sm font-bold ${
                      item.change_percent > 0 ? 'text-red-500' : 
                      item.change_percent < 0 ? 'text-green-500' : 'text-gray-400'
                    }`}>
                      {item.change_percent > 0 ? '+' : ''}{item.change_percent}%
                    </div>
                    <div className="text-[10px] text-gray-400 mt-0.5">
                      {item.change_percent > 0 ? 'Tăng' : item.change_percent < 0 ? 'Giảm' : 'Ổn định'}
                    </div>
                  </div>

                  {/* Column 4: Status Badge */}
                  <div className="flex-shrink-0 pl-2">
                    <StatusBadge data={item} />
                  </div>

                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-6 bg-blue-50 rounded-lg p-4 border border-blue-100">
          <div className="flex items-start gap-3">
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-600" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Về chỉ số giao thông</p>
              <p className="text-blue-700 leading-relaxed">
                Chỉ số tắc nghẽn được tính toán dựa trên dữ liệu từ hệ thống camera AI phân tích giao thông thời gian thực, 
                kết hợp với thuật toán dự đoán bất thường để đánh giá mức độ tắc nghẽn tại các điểm quan trọng trong thành phố.
              </p>
            </div>
          </div>
        </div>

      </main>

      {/* Copyright Footer */}
      <footer className="mt-16 bg-white border-t border-slate-100">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            
            {/* Left: Brand & Copyright */}
            <div className="text-center md:text-left">
              <div className="flex items-center gap-2 justify-center md:justify-start mb-1">
                <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                <span className="font-bold text-slate-800 text-lg tracking-tight">DatapolisX</span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                © 2025 - Cuộc thi Phần mềm Nguồn mở - OLP 2025
              </p>
            </div>

            {/* Right: Socials & Links */}
            <div className="flex items-center gap-6">
              <a 
                href="https://github.com/H-Ngyen/DatapolisX" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-slate-900 transition-colors p-2 hover:bg-slate-50 rounded-full"
                title="GitHub"
              >
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}