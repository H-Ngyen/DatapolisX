import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: NextRequest) {
  let location = "";
  
  try {
    const body = await req.json();
    location = body.location;

    if (!location) {
      return NextResponse.json(
        { success: false, message: "Location is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const modelName = process.env.GEMINI_MODEL;
    
    // Nếu không có API Key hoặc Model, báo lỗi Server Error
    if (!apiKey || !modelName) {
      console.error("GEMINI_API_KEY or GEMINI_MODEL is missing in environment variables");
      return NextResponse.json(
        { success: false, message: "Server configuration error: Missing GEMINI_API_KEY or GEMINI_MODEL" },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
        model: modelName,
    });

    const now = new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });

    const prompt = `
      Bạn là một trợ lý AI thông minh về địa lý và thời tiết tại Việt Nam.
      Thời điểm hiện tại là: ${now} (Giờ Việt Nam).
      
      Nhiệm vụ:
      1. Từ tên đường/địa điểm sau: "${location}" (tại TP.HCM), hãy xác định chính xác địa chỉ theo 2 định dạng:
         - Định dạng 3 cấp (Cũ/Hiện tại): Phường, Quận, Thành phố.
         - Định dạng 2 cấp (Mới/Dự kiến nếu có sáp nhập hoặc cách gọi tắt): Phường, Thành phố (bỏ qua Quận).
      2. Đưa ra dự báo thời tiết HIỆN TẠI cho khu vực đó tại thời điểm ${now}.
      3. Đưa ra lời khuyên giao thông phù hợp với THỜI TIẾT và THỜI GIAN hiện tại (VD: Trời tối nhớ bật đèn, Giờ cao điểm cẩn thận kẹt xe, Nắng gắt nên mặc áo khoác...).
      
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
          "advice": "Lời khuyên ngắn gọn cho người tham gia giao thông (tối đa 15 từ)"
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

  } catch (error) {
    console.error("Weather API Error Detailed:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    
    // Fallback data CHỈ KHI có lỗi trong quá trình fetch/xử lý từ AI
    const mockData = {
      address: {
        street: location || "Không xác định",
        old_3_level: {
            ward: "Không xác định",
            district: "Không xác định",
            city: "TP. Hồ Chí Minh",
            full_string: "Không xác định"
        },
        new_2_level: {
            ward: "Không xác định",
            city: "TP. Hồ Chí Minh",
            full_string: "Không xác định"
        }
      },
      weather: {
        temp: "--°C",
        condition: "Không có dữ liệu",
        humidity: "--%",
        wind: "--",
        advice: "Hệ thống đang bận, vui lòng thử lại sau"
      }
    };
    return NextResponse.json({ success: true, data: mockData });
  }
}
