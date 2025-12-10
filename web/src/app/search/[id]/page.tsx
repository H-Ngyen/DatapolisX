/**
 * MIT License
 * Copyright (c) 2025 DatapolisX
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import { ArrowLeft, Home, Search, MapPin, Camera, Clock, Info, Wind, Droplets, Github } from "lucide-react";
import { useParams } from "next/navigation";
import { useApiCall } from "../../../hooks/useApiCall";
import camInfo from "../../../assets/cam_info.json";

interface TrafficItem {
  id: string;
  si_score: number;
  composition: { primary: string };
  change_percent: number;
  vehicle_count?: {
    bigcar: number;
    car: number;
    motorbike: number;
  };
}

interface DashboardResponse {
  success: boolean;
  data: TrafficItem[];
}

interface ChartDataPoint {
  time_display: string;
  hour_index: number;
  si_score: number;
  total_count: number;
  motorbike: number;
  car: number;
  big_car: number;
}

interface DailyStatsResponse {
  success: boolean;
  data: {
    camera_id: string;
    date: string;
    summary: {
      total_records: number;
      estimated_capacity: number;
      avg_si_until_now: number;
      avg_vehicles_until_now: number;
      vehicle_breakdown: {
        motorbike: { avg_count: number; percentage: number };
        car: { avg_count: number; percentage: number };
        big_car: { avg_count: number; percentage: number };
      };
    };
    chart_data: ChartDataPoint[];
  };
}

interface WeatherData {
  address: {
    street: string;
    old_3_level: {
        ward: string;
        district: string;
        city: string;
        full_string: string;
    };
    new_2_level: {
        ward: string;
        city: string;
        full_string: string;
    };
  };
  weather: {
    temp: string;
    condition: string;
    humidity: string;
    wind: string;
    advice: string;
  };
}

interface WeatherApiResponse {
    success: boolean;
    data: WeatherData;
    isFallback?: boolean;
    errorType?: string;
    message?: string;
}

const getStatusConfig = (score: number) => {
  if (score > 120) return { text: "Kẹt cứng", color: "text-red-600" };
  if (score > 95) return { text: "Tắc nghẽn", color: "text-red-500" };
  if (score > 80) return { text: "Ùn ứ", color: "text-orange-500" };
  if (score > 50) return { text: "Đông chậm", color: "text-yellow-600" };
  return { text: "Thông thoáng", color: "text-green-600" };
};

export default function CameraDetailPage() {
  const params = useParams();
  const camId = params.id as string;
  const { data: dashboardData, loading: dashboardLoading, execute: executeDashboard } = useApiCall<DashboardResponse>();
  const { data: dailyStats, loading: chartLoading, execute: executeDailyStats } = useApiCall<DailyStatsResponse>();
  const { 
    data: weatherResponse, 
    loading: weatherLoading, 
    error: weatherApiError, 
    execute: executeWeather 
  } = useApiCall<WeatherApiResponse>();

  useEffect(() => {
    executeDashboard(`/api/traffic?camera_id=${camId}`);
    const today = new Date().toISOString().split('T')[0];
    executeDailyStats(`/api/traffic/${camId}/daily/${today}`);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const camera = camInfo.data_filtered_final.find(cam => cam.CamId === camId);
  const weatherFetchedRef = React.useRef(false);
  const trafficInfo = dashboardData?.data?.find(item => item.id === camId);
  
  // Real-time Clock State
  const [currentTime, setCurrentTime] = React.useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (camera?.DisplayName && trafficInfo && dailyStats?.data && !weatherFetchedRef.current) {
      weatherFetchedRef.current = true;
      
      executeWeather('/api/weather', 'POST', { 
        location: camera.DisplayName,
        traffic: {
          si_score: trafficInfo.si_score,
          change_percent: trafficInfo.change_percent
        },
        daily_chart: dailyStats.data.chart_data
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trafficInfo, dailyStats]);

  // Derived state for weather data and errors
  const weatherData = weatherResponse?.success ? weatherResponse.data : null;
  
  // Determine error type and message
  const getWeatherErrorInfo = () => {
    if (weatherApiError) {
      return {
        show: true,
        title: 'LỖI KẾT NỐI',
        message: 'Không thể kết nối đến dịch vụ thời tiết. Vui lòng kiểm tra kết nối mạng.'
      };
    }
    if (weatherResponse && !weatherResponse.success) {
      return {
        show: true,
        title: 'LỖI HỆ THỐNG',
        message: weatherResponse.message || 'Không thể lấy dữ liệu thời tiết. Vui lòng thử lại sau.'
      };
    }
    return { show: false, title: '', message: '' };
  };
  
  const weatherError = getWeatherErrorInfo();

  // Format Date & Time for UI
  const formattedTime = new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(currentTime);
  const formattedDate = new Intl.DateTimeFormat('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' }).format(currentTime);

  const getWeatherBackground = () => {
    if (!weatherData) return "bg-gradient-to-br from-blue-500 to-indigo-600";
    
    const condition = weatherData.weather.condition.toLowerCase();
    const hour = currentTime.getHours();
    const isNight = hour >= 18 || hour < 6;

    // Mưa / Dông
    if (condition.includes('mưa') || condition.includes('dông') || condition.includes('bão')) {
        return "bg-gradient-to-br from-slate-700 via-slate-800 to-gray-900";
    }
    
    // Ban đêm
    if (isNight) {
        return "bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900"; 
    }

    // Nắng / Trong xanh
    if (condition.includes('nắng') || condition.includes('quang') || condition.includes('trong xanh')) {
        return "bg-gradient-to-br from-orange-400 to-blue-500";
    }

    // Có mây / Âm u
    if (condition.includes('mây') || condition.includes('âm u')) {
        return "bg-gradient-to-br from-slate-400 to-blue-500";
    }

    // Default
    return "bg-gradient-to-br from-blue-500 to-indigo-600";
  };

  if (dashboardLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center p-8">
          <div className="relative mb-8">
            <div className="w-16 h-16 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
            </div>
          </div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">DatapolisX</h2>
          <div className="flex items-center gap-1 mt-2">
            <span className="text-slate-500 font-medium">Đang đồng bộ dữ liệu</span>
            <span className="flex gap-1">
              <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
              <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce"></span>
            </span>
          </div>
        </div>
      </div>
    );
  }



  if (!camera) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Camera className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Camera không tồn tại</h1>
          <p className="text-gray-600 mb-4">Không tìm thấy thông tin camera với ID này</p>
          <button 
            onClick={() => window.location.href = '/search'}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Quay lại tìm kiếm
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-slate-900">
      {/* Navigation Header */}
      <div className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-4 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 md:gap-8">
              <h1 className="text-xl md:text-2xl font-bold text-white cursor-pointer tracking-tight flex items-center gap-3" onClick={() => window.location.href = '/'}>
                DatapolisX
              </h1>
              <nav className="flex items-center gap-2 md:gap-3">
                <button 
                  onClick={() => window.location.href = '/'}
                  className="flex items-center gap-1 md:gap-2 px-2 md:px-4 py-2 text-xs md:text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg cursor-pointer transition-all"
                >
                  <Home className="w-3.5 md:w-4 h-3.5 md:h-4" />
                  <span className="hidden sm:inline">Trang chủ</span>
                </button>
                <button 
                  onClick={() => window.location.href = '/search'}
                  className="flex items-center gap-1 md:gap-2 px-2 md:px-4 py-2 text-xs md:text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg cursor-pointer transition-all"
                >
                  <Search className="w-3.5 md:w-4 h-3.5 md:h-4" />
                  <span className="hidden sm:inline">Tìm kiếm</span>
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Button */}
        <button 
          onClick={() => window.history.back()}
          className="group flex items-center gap-2 px-5 py-2.5 bg-white text-blue-600 font-semibold rounded-full shadow-sm border border-blue-100 hover:bg-blue-50 hover:border-blue-200 hover:shadow-md transition-all duration-300 mb-8 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300" />
          Quay lại
        </button>

        {/* Camera Info Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8 hover:shadow-md transition-shadow duration-300">
          <div className="p-6 sm:p-8">
            <div className="flex items-start gap-6">
              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 shadow-sm shrink-0">
                <Camera className="w-8 h-8 text-blue-600" />
              </div>
              <div className="flex-1 space-y-3">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight tracking-tight">
                  {camera.DisplayName}
                </h1>
                <div className="flex items-center gap-3">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-sm font-medium border border-slate-200">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Mã: <span className="text-slate-900 font-bold">{camera.Code}</span></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

       {/* Camera Image Placeholder */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Hình ảnh Camera</h2>
              <div className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-600 text-xs font-medium rounded-full">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                LIVE
              </div>
            </div>
            <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden shadow-inner relative group">
              <iframe 
                src={`https://giaothong.hochiminhcity.gov.vn/expandcameraplayer/?camId=${camera.CamId}`}
                className="w-full h-[130%] border-0 -translate-y-[3%]"
                title={`Camera ${camera.DisplayName}`}
                allowFullScreen
                loading="lazy"
              />
            </div>
          </div>
        </div>

        {/* Traffic Status */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Thông tin Giao thông</h2>
            {trafficInfo ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-1">Trạng thái</h3>
                  <p className={`text-2xl font-bold ${getStatusConfig(trafficInfo.si_score).color}`}>
                    {getStatusConfig(trafficInfo.si_score).text}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-1">Chỉ số SI</h3>
                  <p className="text-2xl font-bold text-blue-600">{trafficInfo.si_score}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-1">Xu hướng</h3>
                  <p className={`text-2xl font-bold ${
                    trafficInfo.change_percent > 0 ? 'text-red-500' : 
                    trafficInfo.change_percent < 0 ? 'text-green-500' : 'text-gray-400'
                  }`}>
                    {trafficInfo.change_percent > 0 ? '+' : ''}{trafficInfo.change_percent}%
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Info className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Không có dữ liệu giao thông cho camera này</p>
              </div>
            )}
          </div>
        </div>

        {/* Traffic Chart */}
        {dailyStats?.data && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Biểu đồ Giao thông Hôm nay</h2>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span>Chỉ số SI</span>
                </div>
              </div>
              
              {chartLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <Clock className="w-8 h-8 animate-spin text-gray-400" />
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Summary Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                      <p className="text-xs text-blue-600 font-medium mb-1">SI Trung bình</p>
                      <p className="text-2xl font-bold text-blue-900">{dailyStats.data.summary.avg_si_until_now}</p>
                    </div>
                    <div className="p-3 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
                      <p className="text-xs text-green-600 font-medium mb-1">Xe máy</p>
                      <p className="text-2xl font-bold text-green-900">{dailyStats.data.summary.vehicle_breakdown.motorbike.percentage}%</p>
                    </div>
                    <div className="p-3 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                      <p className="text-xs text-purple-600 font-medium mb-1">Xe lớn</p>
                      <p className="text-2xl font-bold text-purple-900">{dailyStats.data.summary.vehicle_breakdown.car.percentage}%</p>
                    </div>
                  </div>

                  {/* Line Chart */}
                  <div className="relative h-64 bg-gradient-to-b from-slate-50 to-white rounded-lg border border-gray-200 p-4">
                    <svg className="w-full h-full" viewBox="0 0 1000 200" preserveAspectRatio="none">
                      {/* Grid lines */}
                      <line x1="0" y1="50" x2="1000" y2="50" stroke="#e5e7eb" strokeWidth="1" />
                      <line x1="0" y1="100" x2="1000" y2="100" stroke="#e5e7eb" strokeWidth="1" />
                      <line x1="0" y1="150" x2="1000" y2="150" stroke="#e5e7eb" strokeWidth="1" />
                      
                      {/* Area fill */}
                      <defs>
                        <linearGradient id="areaGradient" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05" />
                        </linearGradient>
                      </defs>
                      
                      <path
                        d={`M 0 200 ${dailyStats.data.chart_data.map((point, i) => {
                          const x = (i / 23) * 1000;
                          const y = 200 - (point.si_score / 150) * 200;
                          return `L ${x} ${y}`;
                        }).join(' ')} L 1000 200 Z`}
                        fill="url(#areaGradient)"
                      />
                      
                      {/* Line */}
                      <path
                        d={dailyStats.data.chart_data.map((point, i) => {
                          const x = (i / 23) * 1000;
                          const y = 200 - (point.si_score / 150) * 200;
                          return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                        }).join(' ')}
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      
                      {/* Dots */}
                      {dailyStats.data.chart_data.map((point, i) => {
                        const x = (i / 23) * 1000;
                        const y = 200 - (point.si_score / 150) * 200;
                        return point.si_score > 0 ? (
                          <circle key={i} cx={x} cy={y} r="4" fill="#3b82f6" stroke="white" strokeWidth="2" />
                        ) : null;
                      })}
                    </svg>
                    
                    {/* X-axis labels */}
                    <div className="absolute bottom-0 left-0 right-0 flex justify-between px-4 text-[10px] text-gray-500">
                      {dailyStats.data.chart_data.filter((_, i) => i % 3 === 0).map((point) => (
                        <span key={point.hour_index}>{point.time_display}</span>
                      ))}
                    </div>
                    
                    {/* Y-axis labels */}
                    <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-[10px] text-gray-500 pr-2">
                      <span>150</span>
                      <span>100</span>
                      <span>50</span>
                      <span>0</span>
                    </div>
                  </div>

                  {/* Hourly Details */}
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {dailyStats.data.chart_data.filter(p => p.si_score > 0).map((point) => (
                      <div key={point.hour_index} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                        <span className="text-xs font-medium text-gray-500 w-12">{point.time_display}</span>
                        <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden relative">
                          <div 
                            className={`h-full rounded-full transition-all relative ${
                              point.si_score > 95 ? 'bg-gradient-to-r from-red-500 to-red-600' :
                              point.si_score > 80 ? 'bg-gradient-to-r from-orange-500 to-orange-600' :
                              point.si_score > 50 ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' :
                              'bg-gradient-to-r from-green-500 to-green-600'
                            }`}
                            style={{width: `${Math.min((point.si_score / 150) * 100, 100)}%`}}
                          >
                            <span className="absolute inset-0 flex items-center px-3 text-[10px] font-bold text-white">
                              {point.si_score > 10 && `SI: ${point.si_score}`}
                            </span>
                          </div>
                        </div>
                        <span className="text-xs font-medium text-gray-600 w-16 text-right">{point.total_count} xe</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Weather & Location Info (Redesigned) */}
        <div className="bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2">

            {/* Left: Weather App Style Widget */}
            <div className={`${getWeatherBackground()} p-8 text-white relative overflow-hidden transition-all duration-1000 ease-in-out`}>
              {/* Decorative circles */}
              <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-white/10 blur-2xl"></div>
              <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-24 h-24 rounded-full bg-white/10 blur-xl"></div>

              <div className="flex flex-col relative z-10 mb-8">
                <div>
                    <div className="flex items-center gap-2 text-blue-100 mb-1">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm font-medium">Khu vực hiện tại</span>
                    </div>
                    <h3 className="text-2xl font-bold leading-tight">{weatherData ? camera?.DisplayName : (weatherLoading ? 'Đang tải...' : camera?.DisplayName)}</h3>
                </div>
              </div>

              {weatherLoading ? (
                 <div className="h-40 flex items-center justify-center">
                    <Clock className="w-10 h-10 animate-spin text-white/50" />
                 </div>
              ) : weatherData ? (
                <>
                  <div className="flex items-center gap-6 mb-8 relative z-10">
                      <span className="text-6xl font-bold tracking-tighter">{weatherData.weather.temp}</span>
                      <div>
                        <div className="text-xl font-medium">{weatherData.weather.condition}</div>
                        <div className="text-blue-100 text-sm opacity-90 mt-1 flex flex-col">
                            <span className="font-semibold text-white">{formattedTime}</span>
                            <span className="text-xs capitalize">{formattedDate}</span>
                        </div>
                      </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/10 relative z-10">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-sm">
                            <Droplets className="w-5 h-5 text-blue-200" />
                        </div>
                        <div>
                            <div className="text-xs text-blue-200 font-medium uppercase tracking-wide">Độ ẩm</div>
                            <div className="font-semibold text-lg">{weatherData.weather.humidity}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-sm">
                            <Wind className="w-5 h-5 text-blue-200" />
                        </div>
                        <div>
                            <div className="text-xs text-blue-200 font-medium uppercase tracking-wide">Gió</div>
                            <div className="font-semibold text-lg">{weatherData.weather.wind}</div>
                        </div>
                      </div>
                  </div>
                </>
              ) : (
                <div className="h-40 flex items-center justify-center text-white/50">
                  {weatherError.show ? null : "Không có dữ liệu"}
                </div>
              )}

               {/* Error Warning */}
               {weatherError.show && (
                <div className="mt-4 p-4 bg-red-500 text-white rounded-xl flex items-start gap-3 relative z-10 shadow-lg border-2 border-red-400">
                    <Info className="w-5 h-5 text-white mt-0.5 shrink-0" />
                    <div className="text-sm">
                        <span className="font-bold block mb-1.5 text-base">{weatherError.title}</span>
                        <p className="leading-relaxed opacity-95">{weatherError.message}</p>
                    </div>
                </div>
               )}

               <div className="absolute bottom-4 right-4 px-2.5 py-1 bg-white/20 backdrop-blur-md rounded-lg text-[10px] font-bold border border-white/10 z-20 text-blue-50 tracking-wider">
                    AI WEATHER
                </div>
            </div>

            {/* Right: Location Details */}
            <div className="p-8 bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                  <Info className="w-5 h-5 text-indigo-500" />
                  Địa chỉ cung đường
              </h3>

              {weatherLoading ? (
                 <div className="space-y-4 animate-pulse">
                    <div className="h-20 bg-slate-200 rounded-xl"></div>
                    <div className="h-20 bg-slate-200 rounded-xl"></div>
                 </div>
              ) : weatherData ? (
                <>
                  <div className="space-y-6">
                      {/* Item 1: New Standard */}
                      <div className="relative pl-6 border-l-2 border-green-500">
                        <span className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-green-100 border-2 border-green-500 box-content"></span>
                        <p className="text-xs font-bold text-green-600 uppercase tracking-wider mb-2">Địa chỉ hiện tại</p>
                        <div className="text-slate-800 font-semibold text-lg leading-snug mb-2">
                            {weatherData.address.new_2_level.full_string}
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <span className="px-2.5 py-1 bg-white text-slate-600 text-xs font-medium rounded-md border border-slate-200 shadow-sm">
                              P: {weatherData.address.new_2_level.ward}
                            </span>
                            <span className="px-2.5 py-1 bg-white text-slate-600 text-xs font-medium rounded-md border border-slate-200 shadow-sm">
                              TP: {weatherData.address.new_2_level.city}
                            </span>
                        </div>
                      </div>

                      {/* Item 2: Old Standard */}
                      <div className="relative pl-6 border-l-2 border-slate-300">
                        <span className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-100 border-2 border-slate-300 box-content"></span>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Địa chỉ cũ (3 cấp)</p>
                        <div className="text-slate-600 font-medium">
                            {weatherData.address.old_3_level.full_string}
                        </div>
                      </div>
                  </div>
                  
                  {/* Advice Box */}
                  <div className="mt-8 p-4 bg-indigo-50 rounded-xl border border-indigo-100 flex gap-3 shadow-sm">
                      <div className="shrink-0 mt-1">
                        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                      </div>
                      <p className="text-sm text-indigo-800 italic leading-relaxed font-medium">
                        &ldquo;{weatherData.weather.advice}&rdquo;
                      </p>
                  </div>
                </>
              ) : (
                <div className="text-center py-10 text-slate-400">
                  Chưa tải được thông tin địa điểm
                </div>
              )}
            </div>

          </div>
        </div>
      </main>

            {/* Copyright Footer */}
            <footer className="mt-16 bg-slate-900 border-t border-slate-800">
              <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  
                  {/* Left: Brand & Copyright */}
                  <div className="text-center md:text-left">
                    <div className="flex items-center gap-2 justify-center md:justify-start mb-1">
                      <div className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></span>
                      </div>
                      <span className="font-bold text-white text-lg tracking-tight">DatapolisX</span>
                    </div>
                    <p className="text-xs text-slate-400 font-medium">
                      © 2025 - Cuộc thi Phần mềm Nguồn mở - OLP 2025
                    </p>
                  </div>
      
                  {/* Right: Socials & Links */}
                  <div className="flex items-center gap-2">
                    <a 
                      href="https://www.vlu.edu.vn/" 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded-full"
                      title="Van Lang University"
                    >
                      <Image src="/logo-van-lang.png" alt="VLU Logo" width={24} height={24} className="object-contain opacity-70 hover:opacity-100 transition-opacity" />
                    </a>
                    <a 
                      href="https://github.com/H-Ngyen/DatapolisX" 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded-full"
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