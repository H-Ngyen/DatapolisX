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

export const dashboardController = {
async getDashboardData() {
    // --- BƯỚC 0: Xác định "NOW" ---
    const lastRecord = await prisma.camera_detections.findFirst({
      orderBy: { created_at: 'desc' },
      select: { created_at: true },
    });

    const anchorNow = lastRecord?.created_at || new Date();
    const minutesWindow = new Date(anchorNow.getTime() - 10 * 60 * 1000);

    // --- BƯỚC 1: Fetch dữ liệu ---
    const [recentDetections, capacities, predictions] = await Promise.all([
      // 1. Detections
      prisma.camera_detections.findMany({
        where: {
          created_at: { gte: minutesWindow, lte: anchorNow },
        },
        select: { camera_id: true, detections: true },
      }),

      // 2. Max Capacity
      prisma.camera_detections.groupBy({
        by: ['camera_id'],
        _max: { total_objects: true },
      }),

      // 3. Predictions (Lấy dự báo tương lai gần nhất)
      prisma.camera_predictions.findMany({
        where: { forecast_timestamp: { gt: anchorNow } },
        orderBy: { forecast_timestamp: 'asc' },
        distinct: ['camera_id'],
        select: { camera_id: true, predicted_total_objects: true },
      }),
    ]);

    // --- BƯỚC 2: Xử lý dữ liệu ---

    // A. Gom nhóm detection
    const statsMap = new Map<string, { 
      sumPCU: number;       // Dùng để tính SI (Vẫn cần trọng số để biết mức độ tắc)
      sumRawObjects: number; // MỚI: Dùng để tính Trend (Không trọng số)
      count: number; 
      sumBig: number; sumCar: number; sumMoto: number 
    }>();

    for (const record of recentDetections) {
      const detections = record.detections as DetectionData | null;
      if (!detections) continue;

      const motorbike = detections.motorbike || 0;
      const car = detections.car || 0;
      const bigcar = (detections.truck || 0) + (detections.bus || 0) + (detections.container || 0);

      const pcu = (motorbike * 0.25) + (car * 1.0) + (bigcar * 2.5);
      
      const rawTotal = motorbike + car + bigcar;

      if (!statsMap.has(record.camera_id)) {
        statsMap.set(record.camera_id, { 
            sumPCU: 0, 
            sumRawObjects: 0, // Init
            count: 0, 
            sumBig: 0, sumCar: 0, sumMoto: 0 
        });
      }

      const stats = statsMap.get(record.camera_id)!;
      stats.sumPCU += pcu;
      stats.sumRawObjects += rawTotal; // Cộng dồn số thô
      stats.sumBig += (bigcar * 2.5); // Vẫn giữ logic cũ cho composition
      stats.sumCar += (car * 1.0);
      stats.sumMoto += (motorbike * 0.25);
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

      let avgCurrentPCU = 0;
      let avgCurrentRaw = 0; // Biến mới
      let primaryComposition = "motorbike";

      if (stats && stats.count > 0) {
        avgCurrentPCU = stats.sumPCU / stats.count;
        avgCurrentRaw = stats.sumRawObjects / stats.count; // Trung bình số lượng xe thô

        // Composition Logic (Giữ nguyên)
        const totalAccumulated = stats.sumPCU;
        if (totalAccumulated > 0) {
          if ((stats.sumBig / totalAccumulated) > 0.15) primaryComposition = "bigcar";
          else if ((stats.sumCar / totalAccumulated) > 0.50) primaryComposition = "car";
        }
      }

      // --- TÍNH TOÁN CHỈ SỐ ---

      // 1. SI Score (Vẫn dùng PCU để đánh giá độ tắc chính xác hơn)
      // Nếu bạn muốn SI cũng dùng số thô nốt thì sửa tử số thành avgCurrentRaw
      const siScore = (avgCurrentPCU / (capacity * 1.5)) * 100; 

      let changePercent = 0;
      
      if (predictedVal !== undefined && avgCurrentRaw > 10) {
        changePercent = ((predictedVal - avgCurrentRaw) / avgCurrentRaw) * 100;
      }

      results.push({
        id: cameraId,
        si_score: Math.round(siScore),
        composition: { primary: primaryComposition },
        change_percent: Math.round(changePercent),
      });
    }

    return results;
  },

    // async getDashboardData() {
    //     // Sử dụng queryRaw để viết SQL thuần
    //     // Lưu ý: Prisma trả về BigInt cho các hàm SUM/COUNT, cần convert sang Number
    //     const results = await prisma.$queryRaw`
    //   WITH 
    //   -- 1. Tìm mốc thời gian mới nhất (Anchor Time) để tránh trường hợp DB bị lag/không có data mới
    //   Anchor AS (
    //       SELECT MAX(created_at) as max_time FROM camera_detections
    //   ),

    //   -- 2. Tính toán thống kê 5 phút (PCU & Composition) ngay trong DB
    //   Stats AS (
    //       SELECT 
    //           d.camera_id,
    //           -- Tính PCU trung bình
    //           AVG(
    //               (COALESCE((d.detections->>'motorbike')::int, 0) * 0.25) + 
    //               (COALESCE((d.detections->>'car')::int, 0) * 1.0) + 
    //               (COALESCE((d.detections->>'truck')::int, 0) + COALESCE((d.detections->>'bus')::int, 0) + COALESCE((d.detections->>'container')::int, 0)) * 2.5
    //           ) as avg_pcu,

    //           -- Tính tổng tích lũy để xét Composition (Primary Vehicle)
    //           SUM(
    //               (COALESCE((d.detections->>'truck')::int, 0) + COALESCE((d.detections->>'bus')::int, 0) + COALESCE((d.detections->>'container')::int, 0)) * 2.5
    //           ) as sum_heavy_pcu,
              
    //           SUM(
    //               (COALESCE((d.detections->>'car')::int, 0) * 1.0)
    //           ) as sum_car_pcu,

    //           SUM(
    //               (COALESCE((d.detections->>'motorbike')::int, 0) * 0.25) + 
    //               (COALESCE((d.detections->>'car')::int, 0) * 1.0) + 
    //               (COALESCE((d.detections->>'truck')::int, 0) + COALESCE((d.detections->>'bus')::int, 0) + COALESCE((d.detections->>'container')::int, 0)) * 2.5
    //           ) as total_sum_pcu

    //       FROM camera_detections d, Anchor a
    //       -- Lọc dữ liệu trong 5 phút tính từ mốc mới nhất
    //       WHERE d.created_at >= (a.max_time - INTERVAL '10 minutes') 
    //         AND d.created_at <= a.max_time
    //       GROUP BY d.camera_id
    //   ),

    //   -- 3. Lấy Sức chứa (Capacity) - Max Objects từng ghi nhận
    //   Capacity AS (
    //       SELECT 
    //           camera_id,
    //           MAX(total_objects) as max_obj
    //       FROM camera_detections
    //       GROUP BY camera_id
    //   ),


    //   -- 4. Lấy Dự báo tương lai gần nhất (Logic MỚI)
    //   Forecast AS (
    //       SELECT DISTINCT ON (camera_id)
    //           camera_id,
    //           predicted_total_objects
    //       FROM camera_predictions, Anchor a
    //       WHERE 
    //         -- Chỉ lấy mốc tương lai
    //         forecast_timestamp > a.max_time 
    //         -- VÀ QUAN TRỌNG NHẤT: Chỉ lấy trong vòng 15 phút tới (để khớp với yêu cầu 8:00 lấy 8:10)
    //         AND forecast_timestamp <= (a.max_time + INTERVAL '15 minutes')
    //       ORDER BY camera_id, forecast_timestamp ASC
    //   )

    //   -- 5. KẾT HỢP TẤT CẢ (Final Selection)
    //   SELECT 
    //       s.camera_id as id,
          
    //       -- Tính SI Score: (AvgPCU / Capacity) * 100
    //       -- *Lưu ý: Capacity là object count, nhân tạm 1.5 để ước lượng ra PCU capacity
    //       ROUND((s.avg_pcu / GREATEST(c.max_obj * 1.5, 1)) * 100) as si_score,

    //       -- Logic Traffic Composition (Case When)
    //       CASE 
    //           WHEN s.total_sum_pcu > 0 AND (s.sum_heavy_pcu / s.total_sum_pcu) > 0.15 THEN 'bigcar'
    //           WHEN s.total_sum_pcu > 0 AND (s.sum_car_pcu / s.total_sum_pcu) > 0.50 THEN 'car'
    //           ELSE 'motorbike'
    //       END as primary_composition,

    //       -- Tính Trend %: ((Predicted - Current) / Current) * 100
    //       -- *Lưu ý: Predicted là object count, nhân 0.8 để quy đổi PCU ước lượng
    //       CASE 
    //           WHEN s.avg_pcu > 0 THEN 
    //               ROUND(((f.predicted_total_objects * 0.5 - s.avg_pcu) / s.avg_pcu) * 100)
    //           ELSE 0
    //       END as change_percent

    //   FROM Stats s
    //   LEFT JOIN Capacity c ON s.camera_id = c.camera_id
    //   LEFT JOIN Forecast f ON s.camera_id = f.camera_id
    //   ORDER BY si_score DESC;
    // `;

    //     // Map lại kết quả vì Raw Query trả về BigInt ở một số field số học
    //     const formattedResults = (results as any[]).map((row) => ({
    //         id: row.id,
    //         si_score: Number(row.si_score),
    //         composition: { primary: row.primary_composition },
    //         change_percent: Number(row.change_percent),
    //     }));

    //     return formattedResults;
    // },
};