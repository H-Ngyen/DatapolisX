import prisma from '@/lib/prisma'

export const dashboardController = {
    async getDashboardData() {
    // Sử dụng queryRaw để viết SQL thuần
    // Lưu ý: Prisma trả về BigInt cho các hàm SUM/COUNT, cần convert sang Number
    const results = await prisma.$queryRaw`
      WITH 
      -- 1. Tìm mốc thời gian mới nhất (Anchor Time) để tránh trường hợp DB bị lag/không có data mới
      Anchor AS (
          SELECT MAX(created_at) as max_time FROM camera_detections
      ),

      -- 2. Tính toán thống kê 5 phút (PCU & Composition) ngay trong DB
      Stats AS (
          SELECT 
              d.camera_id,
              -- Tính PCU trung bình
              AVG(
                  (COALESCE((d.detections->>'motorbike')::int, 0) * 0.25) + 
                  (COALESCE((d.detections->>'car')::int, 0) * 1.0) + 
                  (COALESCE((d.detections->>'truck')::int, 0) + COALESCE((d.detections->>'bus')::int, 0) + COALESCE((d.detections->>'container')::int, 0)) * 2.5
              ) as avg_pcu,

              -- Tính tổng tích lũy để xét Composition (Primary Vehicle)
              SUM(
                  (COALESCE((d.detections->>'truck')::int, 0) + COALESCE((d.detections->>'bus')::int, 0) + COALESCE((d.detections->>'container')::int, 0)) * 2.5
              ) as sum_heavy_pcu,
              
              SUM(
                  (COALESCE((d.detections->>'car')::int, 0) * 1.0)
              ) as sum_car_pcu,

              SUM(
                  (COALESCE((d.detections->>'motorbike')::int, 0) * 0.25) + 
                  (COALESCE((d.detections->>'car')::int, 0) * 1.0) + 
                  (COALESCE((d.detections->>'truck')::int, 0) + COALESCE((d.detections->>'bus')::int, 0) + COALESCE((d.detections->>'container')::int, 0)) * 2.5
              ) as total_sum_pcu

          FROM camera_detections d, Anchor a
          -- Lọc dữ liệu trong 5 phút tính từ mốc mới nhất
          WHERE d.created_at >= (a.max_time - INTERVAL '5 minutes') 
            AND d.created_at <= a.max_time
          GROUP BY d.camera_id
      ),

      -- 3. Lấy Sức chứa (Capacity) - Max Objects từng ghi nhận
      Capacity AS (
          SELECT 
              camera_id,
              MAX(total_objects) as max_obj
          FROM camera_detections
          GROUP BY camera_id
      ),

      -- 4. Lấy Dự báo tương lai gần nhất
      Forecast AS (
          SELECT DISTINCT ON (camera_id)
              camera_id,
              predicted_total_objects
          FROM camera_predictions, Anchor a
          WHERE forecast_timestamp > a.max_time
          ORDER BY camera_id, forecast_timestamp ASC
      )

      -- 5. KẾT HỢP TẤT CẢ (Final Selection)
      SELECT 
          s.camera_id as id,
          
          -- Tính SI Score: (AvgPCU / Capacity) * 100
          -- *Lưu ý: Capacity là object count, nhân tạm 1.5 để ước lượng ra PCU capacity
          ROUND((s.avg_pcu / GREATEST(c.max_obj * 1.5, 1)) * 100) as si_score,

          -- Logic Traffic Composition (Case When)
          CASE 
              WHEN s.total_sum_pcu > 0 AND (s.sum_heavy_pcu / s.total_sum_pcu) > 0.15 THEN 'bigcar'
              WHEN s.total_sum_pcu > 0 AND (s.sum_car_pcu / s.total_sum_pcu) > 0.50 THEN 'car'
              ELSE 'motorbike'
          END as primary_composition,

          -- Tính Trend %: ((Predicted - Current) / Current) * 100
          -- *Lưu ý: Predicted là object count, nhân 0.8 để quy đổi PCU ước lượng
          CASE 
              WHEN s.avg_pcu > 0 THEN 
                  ROUND(((f.predicted_total_objects * 0.8 - s.avg_pcu) / s.avg_pcu) * 100)
              ELSE 0
          END as change_percent

      FROM Stats s
      LEFT JOIN Capacity c ON s.camera_id = c.camera_id
      LEFT JOIN Forecast f ON s.camera_id = f.camera_id
      ORDER BY si_score DESC;
    `;

    // Map lại kết quả vì Raw Query trả về BigInt ở một số field số học
    const formattedResults = (results as any[]).map((row) => ({
      id: row.id,
      si_score: Number(row.si_score),
      composition: { primary: row.primary_composition },
      change_percent: Number(row.change_percent),
    }));

    return formattedResults;
  }
};