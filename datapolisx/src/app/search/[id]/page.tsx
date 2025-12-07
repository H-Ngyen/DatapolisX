"use client";

import React, { useEffect } from "react";
import { ArrowLeft, Home, Search, MapPin, Camera, Clock, Info, Github } from "lucide-react";
import { useParams } from "next/navigation";
import { useApiCall } from "../../../hooks/useApiCall";
import camInfo from "../../../assets/cam_info.json";

interface TrafficItem {
  id: string;
  si_score: number;
  composition: { primary: string };
  change_percent: number;
}

interface DashboardResponse {
  success: boolean;
  data: TrafficItem[];
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
  const { data: dashboardData, loading, error, execute } = useApiCall<DashboardResponse>();
  
  useEffect(() => {
    execute('/api/dashboard');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const camera = camInfo.data_filtered_final.find(cam => cam.CamId === camId);
  const trafficInfo = dashboardData?.data?.find(item => item.id === camId);

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
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <h1 className="text-xl font-bold text-blue-900 cursor-pointer" onClick={() => window.location.href = '/'}>DatapolisX</h1>
              <nav className="flex items-center gap-4">
                <button 
                  onClick={() => window.location.href = '/'}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-white/50 rounded-lg cursor-pointer"
                >
                  <Home className="w-4 h-4" />
                  Trang chủ
                </button>
                <button 
                  onClick={() => window.location.href = '/search'}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-700 bg-white/70 rounded-lg shadow-sm cursor-pointer"
                >
                  <Search className="w-4 h-4" />
                  Tìm kiếm
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
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
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