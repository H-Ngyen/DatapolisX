import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { withErrorHandler } from "@/lib/errorHandler";

export const POST = withErrorHandler(async (req: NextRequest) => {
  const body = await req.json();
  const location = body.location;
  const traffic = body.traffic;

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

  const prompt = `
    Bạn là một trợ lý AI thông minh về địa lý và thời tiết tại Việt Nam.
    Thời điểm hiện tại là: ${now} (Giờ Việt Nam).
    
    ${trafficContext}

    Nhiệm vụ:
    1. Từ tên đường/địa điểm sau: "${location}" (tại TP.HCM), hãy xác định chính xác địa chỉ theo 2 định dạng:
       - Định dạng 3 cấp (Cũ/Hiện tại): Phường, Quận, Thành phố.
       - Định dạng 2 cấp (Mới/Dự kiến nếu có sáp nhập hoặc cách gọi tắt): Phường, Thành phố (bỏ qua Quận).
    2. Đưa ra dự báo thời tiết HIỆN TẠI cho khu vực đó tại thời điểm ${now}.
    3. Đưa ra lời khuyên giao thông ngắn gọn, kết hợp cả yếu tố THỜI TIẾT, THỜI GIAN và TÌNH HÌNH GIAO THÔNG (nếu có thông tin ở trên). Ví dụ: Nếu đang mưa và kẹt xe thì khuyên tìm đường khác hoặc đi chậm; Nếu trời nắng và đường thoáng thì nhắc đội mũ/áo khoác... (Tối đa 20 từ).
    
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