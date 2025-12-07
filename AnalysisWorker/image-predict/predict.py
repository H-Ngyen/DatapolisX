from dotenv import load_dotenv
from sqlalchemy import create_engine
import os
import joblib
import pandas as pd
import numpy as np
from train import create_time_features, CAMERA_LIST
from datetime import datetime, timedelta
from validate import filtered_data
import time

load_dotenv()
DB_CONNECTION_STRING = os.getenv("DB_CONNECTION_STRING")
model_filename = 'global_traffic_model_10min_20251206_2025.joblib'

def feature_order():
    with open("FEATURE_ORDER.txt", "r") as f:
        content = f.readlines()
        res = []
        for col in content:
            res.append(col.strip())

    # print(res)
    return res


def recursive_forecast_all(model, feature_order, camera_list, historical_data_func, minutes, steps=3):
    forecasts = {}  # Dictionary chứa kết quả dự đoán cho từng camera
    time_step = pd.Timedelta(minutes, unit='m')  # Tạo Timedelta, ví dụ: 10T (10 phút)

    # 1. LẤY THỜI GIAN BẮT ĐẦU DỰ ĐOÁN ĐỒNG NHẤT (ĐÃ LÀM TRÒN)
    # Giả định historical_data_func trả về thời gian ĐÃ LÀM TRÒN (floored)
    try:
        _, start_timestamp_floored = historical_data_func(camera_list[0], 3)
    except IndexError:
        print("Lỗi: Danh sách camera (camera_list) bị trống.")
        return {}

    # 2. TẠO STANDARD INDEX CHỈ MỘT LẦN
    # Index này là [t+10, t+20, t+30, ...]
    standard_index = [start_timestamp_floored + (time_step * i) for i in range(1, steps + 1)]

    for cam_id in camera_list:
        print(f"\n--- Dự đoán cho Camera {cam_id} ---")

        # Lấy 3 giá trị Lag thực tế mới nhất và last_timestamp (Đã floored)
        historical_lags, last_timestamp = historical_data_func(cam_id, 3)

        current_lags = historical_lags.copy()
        cam_forecasts = []

        for i in range(1, steps + 1):
            next_timestamp = last_timestamp + (time_step * i)

            # 3. Tạo Input DataFrame (X_future)
            X_future = pd.DataFrame(index=[next_timestamp])

            # Tạo Time Features (Giờ, ngày,...)
            # Yêu cầu hàm create_time_features được định nghĩa
            X_future = create_time_features(X_future)

            # Thêm Lagged Features
            for j, lag in enumerate([1, 2, 3]):
                X_future[f'total_lag_{lag}'] = current_lags[j]

            # Thêm One-Hot Encoding cho camera hiện tại
            for cid in camera_list:
                X_future[f'cam_{cid}'] = 1 if cid == cam_id else 0

            # 4. Đảm bảo đúng thứ tự cột VÀ chuẩn bị cho mô hình
            X_future = X_future[feature_order]

            # 5. Dự đoán
            predicted_value = model.predict(X_future)[0]
            cam_forecasts.append(predicted_value)

            # 6. Cập nhật Lag (Recursive Step)
            current_lags = np.roll(current_lags, 1)  # Dịch chuyển lag2 thành lag3, lag1 thành lag2
            current_lags[0] = predicted_value  # Đặt giá trị dự đoán mới vào vị trí lag1

        # 7. SỬ DỤNG STANDARD INDEX ĐỒNG NHẤT CHO TẤT CẢ SERIES
        forecasts[cam_id] = pd.Series(cam_forecasts, index=standard_index)

    return forecasts


def get_historical_data_mock(cam_id, num_lags):
    # Lấy 3 giá trị total_objects gần nhất (t, t-1, t-2)
    # Cần đảm bảo các giá trị này là từ CÙNG camera đó.
    mock_data = {
        '662b86c41afb9c00172dd31c': [7.17, 6.01, 6.35],  # t, t-1, t-2
        '5a6065c58576340017d06615': [25.5, 24.0, 26.2],
        '6623f4df6f998a001b2528eb': [12.0, 10.5, 11.0],
        '662b7ce71afb9c00172dc676': [8.0, 8.5, 9.0],
    }
    mock_timestamp = pd.to_datetime('2025-12-06 14:00:00')
    return np.array(mock_data.get(cam_id, [0, 0, 0])), mock_timestamp


def floor_timestamp(dt, minutes):
    """Làm tròn thời gian xuống mốc phút chẵn gần nhất (floor)."""
    # Nếu là datetime object, chuyển thành timestamp (tính bằng giây)
    seconds = dt.timestamp()

    # Tính tổng số phút và làm tròn xuống mốc minutes chẵn
    total_minutes = int(seconds // 60)

    # Tính số phút cần loại bỏ
    minutes_to_remove = total_minutes % minutes

    # Tính thời gian đã làm tròn
    floored_seconds = (total_minutes - minutes_to_remove) * 60

    return datetime.fromtimestamp(floored_seconds)

def get_historical_data_real(cam_id, num_lags):
    data = filtered_data()
    current_time = datetime.now()
    real_timestamp = floor_timestamp(current_time, 10)
    return np.array(data.get(cam_id, [0, 0, 0])), real_timestamp

def save_forecast_results_to_db(
        forecasts_df: pd.DataFrame,
        connection_string: str,
        minutes_resample: int,
        table_name: str = 'forecast_results'
):
    """
    Lưu kết quả dự đoán vào database, bao gồm cột minutes_resample.
    """
    try:
        # engine = create_engine(connection_string)
        engine = create_engine(connection_string, pool_pre_ping=True, pool_recycle=300)

        # 1. Reset index và Unpivot
        df_melted = forecasts_df.reset_index().rename(columns={'index': 'camera_id'})

        df_melted = df_melted.melt(
            id_vars=['camera_id'],
            var_name='forecast_timestamp',
            value_name='predicted_total_objects'
        )

        # Đảm bảo forecast_timestamp là datetime object
        df_melted['forecast_timestamp'] = pd.to_datetime(df_melted['forecast_timestamp'])

        # 2. PHÂN GIẢI FORECAST_TIMESTAMP
        df_melted['forecast_hour'] = df_melted['forecast_timestamp'].dt.hour
        df_melted['forecast_dayofweek'] = df_melted['forecast_timestamp'].dt.dayofweek
        df_melted['forecast_is_weekend'] = df_melted['forecast_dayofweek'].isin([5, 6]).astype(int)
        df_melted['forecast_is_weekend'] = df_melted['forecast_is_weekend'].astype(bool)
        df_melted['forecast_dayofyear'] = df_melted['forecast_timestamp'].dt.dayofyear

        # isocalendar().week trả về tuần ISO, cần chuyển sang int
        df_melted['forecast_weekofyear'] = df_melted['forecast_timestamp'].dt.isocalendar().week.astype(int)
        df_melted['forecast_month'] = df_melted['forecast_timestamp'].dt.month

        # 3. Thêm cột metadata
        df_melted['minutes_resample'] = minutes_resample
        df_melted['prediction_time'] = datetime.now()

        # Lưu vào database.
        df_melted.to_sql(table_name, engine, if_exists='append', index=False)
        print(f"✅ Đã lưu {len(df_melted)} dự đoán (Resample: {minutes_resample} phút) vào bảng '{table_name}'.")

    except Exception as e:
        print(f"❌ Lỗi khi lưu kết quả dự đoán vào DB: {e}")


def start_scheduled_prediction_service(
        model,
        feature_order_list,
        camera_list,
        db_connection_string: str,
        minutes_resample: int,
        prediction_interval_minutes: int,  # Dùng để tính steps, KHÔNG dùng để tính sleep_duration
        table_name: str = 'camera_predictions'
):
    """
    Khởi động dịch vụ dự đoán liên tục, căn chỉnh thời gian chạy theo minutes_resample.
    """
    # Tính số bước dự đoán
    steps = prediction_interval_minutes // minutes_resample
    if steps == 0:
        steps = 1

    print(f"\n--- 🚀 Khởi động Dịch vụ Dự đoán ({minutes_resample} phút Model) ---")
    print(f"   - Tần suất cập nhật: {minutes_resample} phút/lần (Tần suất cốt lõi)")
    print(f"   - Dự đoán: {steps} bước ({steps * minutes_resample} phút tương lai)")

    interval_minutes = prediction_interval_minutes
    while True:
        start_time = time.time()
        current_datetime = datetime.now()

        try:
            all_forecasts = recursive_forecast_all(
                model,
                feature_order_list,
                camera_list,
                get_historical_data_real,
                minutes=minutes_resample,
                steps=steps
            )

            # 2. Xử lý và Lưu kết quả vào Database
            forecasts_df = pd.DataFrame(all_forecasts).T
            save_forecast_results_to_db(
                forecasts_df,
                db_connection_string,
                minutes_resample,
                table_name
            )

            print(f"✅ Dự đoán hoàn tất lúc {datetime.now().strftime('%H:%M:%S')}")

        except Exception as e:
            print(f"⚠️ Lỗi xảy ra trong vòng lặp chính: {e}")

        # ---------------------------------------------------------------------
        # 3. TÍNH TOÁN THỜI GIAN CHỜ ĐẾN MỐC CHẴN TIẾP THEO (30 PHÚT)
        # ---------------------------------------------------------------------

        end_datetime = datetime.now()
        # 1. Tính toán thời gian cần chờ để đạt đến MỐC 30 PHÚT CHẴN tiếp theo
        interval_seconds = interval_minutes * 60
        total_seconds_of_day = (end_datetime.hour * 3600 + end_datetime.minute * 60 + end_datetime.second)

        # Số giây cần chờ đến mốc interval_minutes tiếp theo
        seconds_to_wait = interval_seconds - (total_seconds_of_day % interval_seconds)

        # 2. Trừ đi thời gian đã mất để dự đoán trong vòng lặp này
        execution_time = (end_datetime - current_datetime).total_seconds()

        # Tổng thời gian chờ (đảm bảo không bao giờ âm)
        sleep_duration = max(0, seconds_to_wait - execution_time)

        if sleep_duration > 0:
            print(
                f"🕒 Chờ {sleep_duration:.2f} giây ({round(sleep_duration / 60)} phút) để đạt đến mốc dự đoán tiếp theo ({interval_minutes} phút)...")
            time.sleep(sleep_duration)
        else:
            print("⚠️ Cảnh báo: Vòng lặp mất nhiều thời gian hơn chu kỳ. Bắt đầu ngay lập tức.")

#
# if __name__ == "__main__":
#     minutes_resample = 10
#
#     try:
#         final_model = joblib.load(model_filename)
#         print(f"Mô hình '{model_filename}' đã được tải thành công.")
#
#         all_forecasts = recursive_forecast_all(
#             final_model,
#             feature_order(),
#             CAMERA_LIST,
#             get_historical_data_real,
#             minutes=minutes_resample,
#             steps=3
#         )
#
#         print("\n--- KẾT QUẢ DỰ ĐOÁN CUỐI CÙNG (30 phút) ---")
#
#         # 2. CHUYỂN ĐỔI KẾT QUẢ SANG DATAFRAME
#         forecasts_df = pd.DataFrame(all_forecasts).T
#         print(forecasts_df)  # In kết quả trước khi lưu
#
#         print("\n--- BẮT ĐẦU LƯU KẾT QUẢ DỰ ĐOÁN VÀO DB ---")
#         save_forecast_results_to_db(
#             forecasts_df,
#             DB_CONNECTION_STRING,
#             minutes_resample=minutes_resample,
#             table_name='camera_predictions'
#         )
#
#     except FileNotFoundError:
#         print(f"Lỗi: Không tìm thấy file mô hình {model_filename}")
#
#     except Exception as e:
#         print(f"⚠️ Lỗi chung trong quá trình dự đoán/lưu DB: {e}")
#
#         pass
if __name__ == "__main__":
    minutes_resample = 10
    prediction_interval_minutes = 30  # Cập nhật dự đoán 30 phút/lần

    def historical_data_wrapper(cam_id, num_lags):
        return get_historical_data_real(cam_id, num_lags)
    # ---------------------------------------------------------------------------------------

    try:
        # Tải mô hình đã huấn luyện
        final_model = joblib.load(model_filename)
        print(f"Mô hình '{model_filename}' đã được tải thành công.")

        # TẢI THỨ TỰ CỘT
        feature_order_list = feature_order()

        # 🚀 BẮT ĐẦU DỊCH VỤ DỰ ĐOÁN LIÊN TỤC 🚀
        start_scheduled_prediction_service(
            model=final_model,
            feature_order_list=feature_order_list,
            camera_list=CAMERA_LIST,  # Sử dụng danh sách camera đã định nghĩa
            db_connection_string=DB_CONNECTION_STRING,
            minutes_resample=minutes_resample,
            prediction_interval_minutes=prediction_interval_minutes,
            table_name='camera_predictions'
        )

    except FileNotFoundError:
        print(f"Lỗi: Không tìm thấy file mô hình {model_filename}")

    except Exception as e:
        print(f"⚠️ Lỗi khởi động dịch vụ: {e}")