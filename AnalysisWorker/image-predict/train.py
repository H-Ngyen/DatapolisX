import os
import joblib
import pandas as pd
import numpy as np
from sqlalchemy import create_engine
from dotenv import load_dotenv

from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error


load_dotenv()
DB_CONNECTION_STRING = os.getenv("DB_CONNECTION_STRING")

SQL_QUERY = """
            SELECT "created_at", "total_objects", "camera_id"
            FROM camera_detections
            """

CAMERA_LIST = [
    '662b86c41afb9c00172dd31c',
    '5a6065c58576340017d06615',
    '6623f4df6f998a001b2528eb',
    '662b7ce71afb9c00172dc676',
    "649da77ea6068200171a6dd4",
    "662b857b1afb9c00172dd106",
    "5d9ddd49766c880017188c94",
    "5d9ddec9766c880017188c9c",
    "5a8256315058170011f6eac9",
    "58b5510817139d0010f35d4e",
    "5d8cd653766c88001718894c",
    "5d9ddf0f766c880017188c9e",
    "5d9dde1f766c880017188c98",
    "587ee0ecb807da0011e33d50",
    "5a8253615058170011f6eabf",
    "6623df636f998a001b251e92",
    "58e49e3dd9d6200011e0b9d1",
    "5a8241105058170011f6eaa6",
    "662b7f9f1afb9c00172dca50",
    "587ed91db807da0011e33d4e",
]

def fetch_data_from_postgres(connection_string, sql_query):
    try:
        # engine = create_engine(connection_string)
        engine = create_engine(connection_string, pool_pre_ping=True, pool_recycle=300)
        print("Đã tạo Engine kết nối thành công.")

        df = pd.read_sql(sql_query, engine)

        df['created_at'] = pd.to_datetime(df['created_at'])

        df.set_index('created_at', inplace=True)

        print("Dữ liệu đã được tải vào DataFrame.")
        return df

    except Exception as error:
        print(f"Lỗi khi kết nối hoặc truy vấn dữ liệu: {error}")
        return pd.DataFrame()

def create_time_features(df):
    """Trích xuất các đặc trưng thời gian từ index."""
    df['hour'] = df.index.hour
    df['dayofweek'] = df.index.dayofweek
    df['dayofyear'] = df.index.dayofyear # Có thể hữu ích
    df['weekofyear'] = df.index.isocalendar().week.astype(int)
    df['month'] = df.index.month
    df['is_weekend'] = df.index.dayofweek.isin([5, 6]).astype(int) # 1 nếu là T7/CN
    return df

def create_lagged_features(df, lags=[1, 2, 3]):
    """Tạo các cột lagged (giá trị trễ) cho biến mục tiêu."""
    for lag in lags:
        # Cột mới sẽ là total_vehicles của lag đơn vị thời gian trước đó
        df[f'total_lag_{lag}'] = df['total_objects'].shift(lag)
    return df


def group_camera_id(traffic_df, minutes):
    df_resampled_list = []

    for cam_id in traffic_df['camera_id'].unique():
        df_cam = traffic_df[traffic_df['camera_id'] == cam_id]
        df_cam_resampled = df_cam['total_objects'].resample(f'{minutes}min').mean().to_frame()

        # 1. TẠO LAG FEATURES TẠI ĐÂY (TRONG VÒNG LẶP)
        df_cam_resampled = create_lagged_features(df_cam_resampled, lags=[1, 2, 3])

        df_cam_resampled.dropna(inplace=True)  # Loại bỏ NaN của lag
        df_cam_resampled['camera_id'] = cam_id  # Giữ lại ID camera
        df_resampled_list.append(df_cam_resampled)

    traffic_df_final = pd.concat(df_resampled_list)

    # ⭐ DÒNG LỆNH CẦN BỔ SUNG: Sắp xếp lại theo Index (là cột created_at)
    traffic_df_final.sort_index(inplace=True)

    # 2. Tạo One-Hot Encoding VÀ Time Features (Sau khi gộp)
    df_ohe = pd.get_dummies(traffic_df_final['camera_id'], prefix='cam')
    traffic_df_final = pd.concat([traffic_df_final, df_ohe], axis=1)
    traffic_df_final.drop('camera_id', axis=1, inplace=True)

    traffic_df_final = create_time_features(traffic_df_final)

    # Do đã tạo lag trước, chỉ cần xử lý NaN còn sót (nếu có)
    # traffic_df_final.dropna(inplace=True)


    # --- XUẤT RA CSV ---
    output_filename = 'traffic_df_final.csv'
    traffic_df_final.to_csv(output_filename, index=True, mode='w')
    print(f"\n✅ Dữ liệu đã xử lý được lưu vào file: **{output_filename}**")

    print("5 hàng đầu tiên sau khi xử lý (Kiểm tra Lag Features và thứ tự thời gian):")
    # Kiểm tra xem các cột lag có giá trị không
    print(traffic_df_final.head())

    return traffic_df_final

def tran_ai(traffic_df, minutes):
    # Tạo DataFrame đã xử lý
    traffic_df_time = group_camera_id(traffic_df, minutes)

    y = traffic_df_time['total_objects']

    # Lấy các cột camera ID (cột One-Hot Encoding)
    camera_id_cols = [col for col in traffic_df_time.columns if col.startswith('cam_')]

    # 2. Xác định các đặc trưng (X)
    X = traffic_df_time.drop('total_objects', axis=1)

    FEATURE_ORDER = X.columns
    output_filename = 'FEATURE_ORDER.txt'
    with open(output_filename, 'w') as f:
        # Lặp qua từng tên cột và ghi ra file, mỗi cột một dòng
        for feature_name in FEATURE_ORDER:
            f.write(f"{feature_name}\n")

    print(f"\n✅ Danh sách features đã được lưu vào file: **{output_filename}**")

    split_index = int(len(X) * 0.9)

    X_train = X.iloc[:split_index]
    y_train = y.iloc[:split_index]
    X_test = X.iloc[split_index:]
    y_test = y.iloc[split_index:]

    print(f"\nKích thước tập huấn luyện: {len(X_train)} (từ {X_train.index.min()})")
    print(f"Kích thước tập kiểm tra: {len(X_test)} (đến {X_test.index.max()})")

    model = RandomForestRegressor(n_estimators=100, max_depth=10, random_state=42, n_jobs=-1)

    print("\nBắt đầu huấn luyện mô hình Chung (Global Model)...")
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    print("Hoàn thành dự đoán.")

    # --- ĐÁNH GIÁ TỔNG THỂ ---
    mae_global = mean_absolute_error(y_test, y_pred)
    rmse_global = np.sqrt(mean_squared_error(y_test, y_pred))

    print("\n--- 1. Kết quả Đánh giá TỔNG THỂ (Global) ---")
    print(f"Mean Absolute Error (MAE): {mae_global:.2f} xe")
    print(f"Root Mean Squared Error (RMSE): {rmse_global:.2f} xe")

    # --- ĐÁNH GIÁ TỪNG CAMERA ---
    df_results = pd.DataFrame({'Actual': y_test, 'Predicted': y_pred})
    df_results = pd.concat([df_results, X_test[camera_id_cols]], axis=1)
    print("\n--- 2. Kết quả Đánh giá CHI TIẾT theo Camera ---")

    for col in camera_id_cols:
        df_cam = df_results[df_results[col] == 1]
        if not df_cam.empty:
            cam_mae = mean_absolute_error(df_cam['Actual'], df_cam['Predicted'])
            cam_rmse = np.sqrt(mean_squared_error(df_cam['Actual'], df_cam['Predicted']))

            cam_name = col.replace('cam_', '')
            print(f"  - Camera {cam_name}: MAE={cam_mae:.2f} | RMSE={cam_rmse:.2f} (n={len(df_cam)})")

    # --- Bảng Kết quả Gần nhất ---
    df_results['Error'] = df_results['Actual'] - df_results['Predicted']
    df_results['Camera_ID'] = df_results[camera_id_cols].idxmax(axis=1).str.replace('cam_', '')


    print(f"\n--- 3. 10 Kết quả Dự đoán Gần nhất ({minutes} phút tiếp theo) ---")
    print(df_results[['Camera_ID', 'Actual', 'Predicted', 'Error']].tail(10))

    model_filename = f'global_traffic_model_{minutes}min_{pd.Timestamp.now().strftime("%Y%m%d_%H%M")}.joblib'

    # Xuất mô hình
    joblib.dump(model, model_filename)

    print(f"\n✅ Mô hình đã được lưu thành công tại: {model_filename}")

    return model


traffic_df = fetch_data_from_postgres(DB_CONNECTION_STRING, SQL_QUERY)

if not traffic_df.empty:
    # print("\n--- 5 Hàng Dữ liệu Đầu tiên ---")
    # print(traffic_df.head())
    # print(f"\nTổng số hàng dữ liệu: {len(traffic_df)}")

    # traffic_df = create_time_features(traffic_df)
    # print("DataFrame sau khi thêm đặc trưng thời gian:")
    # print(traffic_df.head())

    # group_camera_id(traffic_df, 5)
    # final_model = tran_ai(traffic_df, 10)
    # print("\nQuá trình Huấn luyện Mô hình Đa Camera đã hoàn tất.")
    pass


