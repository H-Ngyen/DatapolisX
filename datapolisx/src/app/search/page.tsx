"use client";

import React, { useState } from "react";
import { Search, Home, MapPin } from "lucide-react";
import camInfo from "../../assets/cam_info.json";

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
  
  const allCameras = camInfo.data_filtered_final.slice(0, 20) as Camera[];

  const handleSearch = () => {
    setHasSearched(true);
    if (searchQuery.trim()) {
      const results = camInfo.data_filtered_final.filter(cam =>
        cam.DisplayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cam.Code.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 10) as Camera[];
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

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
                <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-700 bg-white/70 rounded-lg shadow-sm cursor-pointer">
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

        {hasSearched && searchQuery && searchResults.length === 0 && (
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
    </div>
  );
}