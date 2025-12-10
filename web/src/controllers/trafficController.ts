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

import prisma from '@/lib/prisma'
import { DetectionData } from '@/lib/types';

const getTrafficMetrics = async (id: string | null = null) => {
  const filterId = id ? { camera_id: id } : {};

  // --- BƯỚC 0: Xác định "NOW" ---
  const lastRecord = await prisma.camera_detections.findFirst({
    where: filterId,
    orderBy: { created_at: 'desc' },
    select: { created_at: true },
  });

  const anchorNow = lastRecord?.created_at || new Date();
  const minutesWindow = new Date(anchorNow.getTime() - 2 * 60 * 1000);

  const baseWhere = {
    ...filterId,
    created_at: { gte: minutesWindow, lte: anchorNow }
  };

  // --- BƯỚC 1: Fetch dữ liệu ---
  const [recentDetections, capacities, predictions] = await Promise.all([
    // 1. Detections
    prisma.camera_detections.findMany({
      where: baseWhere,
      select: { camera_id: true, detections: true },
    }),

    // 2. Max Capacity
    prisma.camera_detections.groupBy({
      by: ['camera_id'],
      where: filterId,
      _max: { total_objects: true },
    }),

    // 3. Predictions (Lấy dự báo tương lai gần nhất)
    prisma.camera_predictions.findMany({
      where: {
        ...filterId,
        forecast_timestamp: { gt: anchorNow }
      },
      orderBy: { forecast_timestamp: 'asc' },
      distinct: ['camera_id'],
      select: { camera_id: true, predicted_total_objects: true },
    }),
  ]);

  // --- BƯỚC 2: Xử lý dữ liệu ---

  // A. Gom nhóm detection
  const statsMap = new Map<string, {
    sumRawObjects: number;
    count: number;
    sumBig: number; sumCar: number; sumMoto: number
  }>();

  for (const record of recentDetections) {
    const detections = record.detections as DetectionData | null;
    if (!detections) continue;

    const motorbike = detections.motorbike || 0;
    const car = detections.car || 0;
    const bigcar = (detections.truck || 0) + (detections.bus || 0) + (detections.container || 0);

    const rawTotal = motorbike + car + bigcar;

    if (!statsMap.has(record.camera_id)) {
      statsMap.set(record.camera_id, {
        sumRawObjects: 0, // Init
        count: 0,
        sumBig: 0, sumCar: 0, sumMoto: 0
      });
    }

    const stats = statsMap.get(record.camera_id)!;
    stats.sumRawObjects += rawTotal;
    stats.sumBig += bigcar;
    stats.sumCar += car;
    stats.sumMoto += motorbike;
    stats.count++;
  }

  // B. Map Capacity và Prediction
  const capacityMap = new Map(capacities.map(c => [c.camera_id, c._max.total_objects || 1]));
  const predictionMap = new Map(predictions.map(p => [p.camera_id, p.predicted_total_objects]));

  // C. Tổng hợp kết quả
  const allCameraIds = new Set([...statsMap.keys(), ...capacityMap.keys()]);
  const results = [];

  for (const cameraId of allCameraIds) {
    const stats = statsMap.get(cameraId);
    const capacity = capacityMap.get(cameraId) || 1;
    const predictedVal = predictionMap.get(cameraId);

    let avgCurrentRaw = 0;
    let primaryComposition = "motorbike";

    if (stats && stats.count > 0) {
      avgCurrentRaw = stats.sumRawObjects / stats.count;

      const totalAccumulated = stats.sumRawObjects;
      if (totalAccumulated > 0) {
        if ((stats.sumBig / totalAccumulated) > 0.15) primaryComposition = "bigcar";
        else if ((stats.sumCar / totalAccumulated) > 0.50) primaryComposition = "car";
      }
    }

    // --- TÍNH TOÁN CHỈ SỐ ---
    const siScore = avgCurrentRaw / capacity * 100;

    let changePercent = 0;

    if (predictedVal !== undefined && avgCurrentRaw > 10) {
      changePercent = ((predictedVal - avgCurrentRaw) / avgCurrentRaw) * 100;
    }

    results.push({
      id: cameraId,
      si_score: Math.round(siScore),
      composition: { primary: primaryComposition },
      change_percent: Math.round(changePercent),
      vehicle_count: {
        bigcar: stats?.sumBig || 0,
        car: stats?.sumCar || 0,
        motorbike: stats?.sumMoto || 0,
      }
    });
  }

  return results;
}

async function getDailyTrafficStats(cameraId: string, dateStr: string) {
  // 1. Xác định khung thời gian theo múi giờ Việt Nam (UTC+7)
  const VN_OFFSET = 7 * 60 * 60 * 1000; // 7 giờ tính bằng milliseconds
  
  // Parse date string và tạo timestamp cho 00:00:00 và 23:59:59 theo giờ VN
  const baseDate = new Date(dateStr + 'T00:00:00.000+07:00');
  const startDate = new Date(baseDate.getTime());
  const endDate = new Date(baseDate.getTime() + 24 * 60 * 60 * 1000 - 1); 

  // 2. Lấy dữ liệu Detections và Max Capacity
  const [detections, capacityRecord] = await Promise.all([
    // Lấy tất cả bản ghi trong ngày
    prisma.camera_detections.findMany({
      where: {
        camera_id: cameraId,
        created_at: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        created_at: true,
        detections: true,
        total_objects: true
      },
      orderBy: { created_at: 'asc' }
    }),

    // Lấy capacity của camera (để tính SI)
    prisma.camera_detections.findFirst({
        where: { camera_id: cameraId },
        orderBy: { total_objects: 'desc' }, 
        select: { total_objects: true }
    })
  ]);

  const capacity = capacityRecord?.total_objects || 20; // Fallback capacity

  // 3. Khởi tạo mảng 24 giờ rỗng
  // bucket[0] là 00:00 - 00:59, bucket[1] là 01:00 - 01:59...
  const hourlyBuckets = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    count: 0,          // Số bản ghi trong giờ này
    sumSi: 0,          // Tổng SI để tính trung bình
    sumTotal: 0,       // Tổng lượng xe
    sumMoto: 0,
    sumCar: 0,
    sumBig: 0
  }));

  const now = new Date();
  let totalSiUntilNow = 0;
  let totalCountUntilNow = 0;
  let totalVehiclesUntilNow = 0;
  let totalMotoUntilNow = 0;
  let totalCarUntilNow = 0;
  let totalBigUntilNow = 0;

  // 4. Duyệt qua dữ liệu và lấp đầy các xô (buckets)
  for (const record of detections) {
    const recordDate = new Date(record.created_at);
    // Chuyển sang giờ Việt Nam (UTC+7)
    const vnTime = new Date(recordDate.getTime() + VN_OFFSET);
    const hourIndex = vnTime.getUTCHours(); 

    if (hourIndex < 0 || hourIndex > 23) continue;

    const det = record.detections as DetectionData;
    if (!det) continue;

    const moto = det.motorbike || 0;
    const car = det.car || 0;
    const big = (det.truck || 0) + (det.bus || 0) + (det.container || 0);
    const total = moto + car + big;
    const instantSi = (total / (capacity * 1.3)) * 100;

    const bucket = hourlyBuckets[hourIndex];
    bucket.count++;
    bucket.sumSi += instantSi;
    bucket.sumTotal += total;
    bucket.sumMoto += moto;
    bucket.sumCar += car;
    bucket.sumBig += big;

    // Tính tổng từ 0:00 đến hiện tại (so sánh theo giờ VN)
    const nowVN = new Date(now.getTime() + VN_OFFSET);
    if (vnTime <= nowVN) {
      totalSiUntilNow += instantSi;
      totalCountUntilNow++;
      totalVehiclesUntilNow += total;
      totalMotoUntilNow += moto;
      totalCarUntilNow += car;
      totalBigUntilNow += big;
    }
  }

  // 5. Tính trung bình (Average) cho mỗi giờ để ra chart data final
  const chartData = hourlyBuckets.map(bucket => {
    // Nếu giờ đó không có dữ liệu, trả về 0 hết
    const hasData = bucket.count > 0;
    
    // Tính trung bình SI trong 1 giờ
    const avgSi = hasData ? (bucket.sumSi / bucket.count) : 0;

    // Với số lượng xe: 
    // - Nếu muốn hiển thị "Tổng xe đi qua trong giờ": Dùng bucket.sumTotal (Lũy kế)
    // - Nếu muốn hiển thị "Mật độ trung bình": Dùng bucket.sumTotal / bucket.count
    // -> Thường biểu đồ lưu lượng sẽ dùng TỔNG XE trong giờ đó (Lũy kế) nhưng ở đây detection là snapshot
    // -> Nếu detection gửi mỗi 5 phút/lần, thì cộng dồn sẽ bị sai bản chất (trùng lặp).
    // -> NÊN DÙNG TRUNG BÌNH MẬT ĐỘ (Average Density) cho biểu đồ đường.
    
    return {
      time_display: `${bucket.hour.toString().padStart(2, '0')}:00`,
      hour_index: bucket.hour,
      
      // Data cho biểu đồ
      si_score: Math.round(avgSi), 
      
      // Mật độ trung bình từng loại xe
      total_count: hasData ? Math.round(bucket.sumTotal / bucket.count) : 0,
      motorbike: hasData ? Math.round(bucket.sumMoto / bucket.count) : 0,
      car: hasData ? Math.round(bucket.sumCar / bucket.count) : 0,
      big_car: hasData ? Math.round(bucket.sumBig / bucket.count) : 0,
    };
  });

  // Tính % từng loại xe
  const avgMotoUntilNow = totalCountUntilNow > 0 ? totalMotoUntilNow / totalCountUntilNow : 0;
  const avgCarUntilNow = totalCountUntilNow > 0 ? totalCarUntilNow / totalCountUntilNow : 0;
  const avgBigUntilNow = totalCountUntilNow > 0 ? totalBigUntilNow / totalCountUntilNow : 0;
  const totalAvgVehicles = avgMotoUntilNow + avgCarUntilNow + avgBigUntilNow;

  return {
    camera_id: cameraId,
    date: dateStr,
    summary: {
      total_records: detections.length,
      estimated_capacity: capacity,
      // Trung bình từ 0:00 đến hiện tại
      avg_si_until_now: totalCountUntilNow > 0 ? Math.round(totalSiUntilNow / totalCountUntilNow) : 0,
      avg_vehicles_until_now: totalCountUntilNow > 0 ? Math.round(totalVehiclesUntilNow / totalCountUntilNow) : 0,
      // Chi tiết từng loại xe với số lượng và %
      vehicle_breakdown: {
        motorbike: {
          avg_count: Math.round(avgMotoUntilNow),
          percentage: totalAvgVehicles > 0 ? Math.round((avgMotoUntilNow / totalAvgVehicles) * 100) : 0
        },
        car: {
          avg_count: Math.round(avgCarUntilNow),
          percentage: totalAvgVehicles > 0 ? Math.round((avgCarUntilNow / totalAvgVehicles) * 100) : 0
        },
        big_car: {
          avg_count: Math.round(avgBigUntilNow),
          percentage: totalAvgVehicles > 0 ? Math.round((avgBigUntilNow / totalAvgVehicles) * 100) : 0
        }
      }
    },
    chart_data: chartData
  };
}

export default {
  getTrafficMetrics,
  getDailyTrafficStats,
};