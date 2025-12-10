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

import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { withErrorHandler } from "@/lib/errorHandler";

export const POST = withErrorHandler(async (req: NextRequest) => {
  const body = await req.json();
  const location = body.location;
  const traffic = body.traffic;
  const dailyChart = body.daily_chart;

  if (!location) {
    return NextResponse.json(
      { success: false, message: "Location is required" },
      { status: 400 }
    );
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const modelName = process.env.GEMINI_MODEL;
  
  if (!apiKey || !modelName) {
    throw new Error("Missing GEMINI_API_KEY or GEMINI_MODEL");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ 
      model: modelName,
  });

  const now = new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });

  let trafficContext = "";
  if (traffic) {
    trafficContext = `
    Thông tin giao thông hiện tại tại địa điểm này:
    - Chỉ số tắc nghẽn (SI): ${traffic.si_score} (SI > 120: Kẹt cứng, 95-120: Tắc nghẽn, 80-95: Ùn ứ, 50-80: Đông chậm, < 50: Thông thoáng).
    - Xu hướng thay đổi: ${traffic.change_percent > 0 ? `Đang tăng thêm ${traffic.change_percent}% (Tệ hơn)` : traffic.change_percent < 0 ? `Đang giảm ${Math.abs(traffic.change_percent)}% (Tốt hơn)` : "Ổn định"}.
    `;
  }

  let chartContext = "";
  if (dailyChart && Array.isArray(dailyChart)) {
    const currentHour = new Date().getHours();
    const recentData = dailyChart.filter(d => d.hour_index <= currentHour && d.si_score > 0).slice(-6);
    const upcomingData = dailyChart.filter(d => d.hour_index > currentHour && d.si_score > 0).slice(0, 3);
    
    if (recentData.length > 0) {
      chartContext += `\n    Dữ liệu giao thông trong ${recentData.length} giờ gần đây:`;
      recentData.forEach(d => {
        chartContext += `\n    - ${d.time_display}: SI=${d.si_score}, Tổng xe=${d.total_count}`;
      });
    }
    
    if (upcomingData.length > 0) {
      chartContext += `\n    Dự đoán ${upcomingData.length} giờ tới:`;
      upcomingData.forEach(d => {
        chartContext += `\n    - ${d.time_display}: SI=${d.si_score}, Tổng xe=${d.total_count}`;
      });
    }
  }

  const prompt = `
    Bạn là một trợ lý AI thông minh về địa lý và thời tiết tại Việt Nam.
    Thời điểm hiện tại là: ${now} (Giờ Việt Nam).
    
    TÌM KIẾM GOOGLE MAPS: Trước tiên, hãy tìm kiếm địa điểm "${location}" trên Google Maps để lấy địa chỉ CHÍNH XÁC (Phường, Quận/Huyện, Tỉnh/Thành phố).
      
    ${trafficContext}
    ${chartContext}

    Nhiệm vụ:
    1. Từ tên đường/địa điểm sau: "${location}", dựa trên danh sách chính thức và kiến thức địa lý, hãy xác định chính xác địa chỉ theo 2 định dạng:
       - Định dạng 3 cấp (Trước 01/07/2025): Phường/Xã, Quận/Huyện/Thị xã, Tỉnh/Thành phố
       - Định dạng 2 cấp (Sau 01/07/2025 - Chính thức): Phường/Xã, TP. Hồ Chí Minh. LÝ DO: Sau ngày 01/07/2025, Bình Dương, TP Thủ Đức và một phần Bà Rịa-Vũng Tàu đã được sáp nhập vào TP.HCM và không còn Thành Phố Thủ Đức, Bình Dương, Bà rịa vững tàu nữa (trở thành Thành Phố Hồ CHí Minh)
    2. Đưa ra dự báo thời tiết HIỆN TẠI cho khu vực đó tại thời điểm ${now}.
    3. Đưa ra lời khuyên giao thông ngắn gọn, PHẢI KẾT HỢP CẢ 3 YẾU TỐ: THỜI TIẾT hiện tại, THỜI GIAN (giờ cao điểm/thấp điểm), và XU HƯỚNG GIAO THÔNG từ dữ liệu biểu đồ (SI score, số xe qua các giờ). Ví dụ: Nếu mưa + kẹt xe + giờ cao điểm → khuyên tìm đường khác; Nếu nắng + thoáng + sáng sớm → nhắc chống nắng. (Tối đa 25 từ).
    
    Hãy trả về kết quả dưới dạng JSON thuần túy (không markdown) theo cấu trúc sau:
    {
      "address": {
        "street": "Tên đường gốc",
        "old_3_level": {
          "ward": "Tên Phường",
          "district": "Tên Quận",
          "city": "TP. Hồ Chí Minh",
          "full_string": "Phường ..., Quận ..., TP. Hồ Chí Minh"
        },
        "new_2_level": {
          "ward": "Tên Phường",
          "city": "TP. Hồ Chí Minh (hoặc TP. Thủ Đức nếu thuộc)",
          "full_string": "Phường ..., TP. ..."
        }
      },
      "weather": {
        "temp": "Nhiệt độ (VD: 32°C)",
        "condition": "Trạng thái (VD: Có mây, Mưa rào, Nắng gắt)",
        "humidity": "Độ ẩm (VD: 75%)",
        "wind": "Gió (VD: 10 km/h)",
        "advice": "Lời khuyên (tối đa 20 từ)"
      }
    }
  `;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();

  const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();
  
  let data;
  try {
      data = JSON.parse(cleanedText);
  } catch {
      console.error("Failed to parse Gemini response:", text);
      throw new Error("Invalid JSON response from Gemini");
  }

  return NextResponse.json({ success: true, data });
});