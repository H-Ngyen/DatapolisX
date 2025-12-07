"use client";

import React from "react";
import { ArrowLeft, Home, Search, MapPin, Camera, Clock } from "lucide-react";
import { useParams } from "next/navigation";
import camInfo from "../../../assets/cam_info.json";

export default function CameraDetailPage() {
  const params = useParams();
  const camId = params.id as string;
  
  const camera = camInfo.data_filtered_final.find(cam => cam.CamId === camId);

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
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại
        </button>

        {/* Camera Info Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          <div className="p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Camera className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{camera.DisplayName}</h1>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>Mã: {camera.Code}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>Cập nhật: Thời gian thực</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Camera Image Placeholder */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Hình ảnh Camera</h2>
            <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden shadow-inner">
              <iframe 
                src={`https://giaothong.hochiminhcity.gov.vn/expandcameraplayer/?camId=${camera.CamId}`}
                className="w-full h-full border-0"
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-1">Trạng thái</h3>
                <p className="text-2xl font-bold text-green-600">Thông thoáng</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-1">Chỉ số SI</h3>
                <p className="text-2xl font-bold text-blue-600">45</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-1">Xu hướng</h3>
                <p className="text-2xl font-bold text-orange-600">+5%</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}