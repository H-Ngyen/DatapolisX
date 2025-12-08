"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Search, Home, MapPin, Github } from "lucide-react";
import { useApiCall } from "../../hooks/useApiCall";
import camInfo from "../../assets/cam_info.json";



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

interface Camera {
  CamId: string;
  Code: string;
  DisplayName: string;
  Name: string;
}

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Camera[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const { data: dashboardData, loading, execute } = useApiCall<DashboardResponse>();

  useEffect(() => {
    execute('/api/dashboard');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Get unique camera IDs from API and create camera objects with lookup, sorted by Code
  const allCameras = dashboardData?.data
    ? dashboardData.data.map(item => {
        const cam = camInfo.data_filtered_final.find(c => c.CamId === item.id);
        return cam ? {
          CamId: cam.CamId,
          Code: cam.Code,
          DisplayName: cam.DisplayName,
          Name: cam.Name
        } : null;
      }).filter(Boolean).sort((a, b) => a!.Code.localeCompare(b!.Code)) as Camera[]
    : [];

  const handleSearch = () => {
    setHasSearched(true);
    if (searchQuery.trim()) {
      const results = allCameras.filter(cam =>
        cam.DisplayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cam.Code.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 10);
      setSearchResults(results);
    } else {
      setSearchResults(allCameras);
    }
  };

  if (loading) {
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



  return (
    <div className="min-h-screen bg-gray-50 font-sans text-slate-900">
      {/* Navigation Header */}
      <div className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-4 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <h1 className="text-2xl font-bold text-white cursor-pointer tracking-tight flex items-center gap-3" onClick={() => window.location.href = '/'}>
                DatapolisX
              </h1>
              <nav className="flex items-center gap-3">
                <button 
                  onClick={() => window.location.href = '/'}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg cursor-pointer transition-all"
                >
                  <Home className="w-4 h-4" />
                  Trang chủ
                </button>
                <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600/20 border border-blue-500/30 rounded-lg shadow-sm cursor-pointer">
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
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Tìm kiếm Camera Giao thông</h1>
          <p className="text-gray-600">Tìm kiếm camera theo tên địa điểm hoặc mã camera</p>
        </div>

        {/* Search Input */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Nhập tên địa điểm hoặc mã camera..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={handleSearch}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              Tìm kiếm
            </button>
          </div>
        </div>

        {/* Search Results */}
        {hasSearched && searchResults.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Kết quả tìm kiếm ({searchResults.length})</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {searchResults.map((cam) => (
                <div
                  key={cam.CamId}
                  onClick={() => window.location.href = `/search/${cam.CamId}`}
                  className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-medium text-gray-900">{cam.DisplayName}</h3>
                      <p className="text-sm text-gray-500 mt-1">Mã: {cam.Code}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {hasSearched && searchQuery.trim() && searchResults.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center mb-6">
            <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Không tìm thấy kết quả</h3>
            <p className="text-gray-500">Thử tìm kiếm với từ khóa khác</p>
          </div>
        )}

        {/* All Cameras List */}
        {!hasSearched && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Danh sách Camera ({allCameras.length})</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {allCameras.map((cam) => (
                <div
                  key={cam.CamId}
                  onClick={() => window.location.href = `/search/${cam.CamId}`}
                  className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-medium text-gray-900">{cam.DisplayName}</h3>
                      <p className="text-sm text-gray-500 mt-1">Mã: {cam.Code}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
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