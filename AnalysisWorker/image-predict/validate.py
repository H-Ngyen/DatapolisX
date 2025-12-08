# MIT License
# Copyright (c) 2025 DatapolisX
# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction, including without limitation the rights
# to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
# copies of the Software, and to permit persons to whom the Software is
# furnished to do so, subject to the following conditions:
# The above copyright notice and this permission notice shall be included in all
# copies or substantial portions of the Software.
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
# SOFTWARE.

from datetime import datetime, timedelta
import pandas as pd
from sqlalchemy import create_engine
import os
from dotenv import load_dotenv
load_dotenv()
from main import group_camera_id

DB_CONNECTION_STRING = os.getenv("DB_CONNECTION_STRING")
engine = create_engine(DB_CONNECTION_STRING, pool_pre_ping=True, pool_recycle=300)


def fetch_data_from_postgres(engine):
    SQL_LATEST_TIMESTAMP = f"""
            SELECT
                "created_at" AS "latest_created_at",
                "camera_id"
            FROM
                camera_detections
            ORDER BY
                "created_at" DESC
            LIMIT 1;
        """
    try:
        # engine = create_engine(connection_string)
        print("Đã tạo Engine kết nối thành công.")

        df = pd.read_sql(SQL_LATEST_TIMESTAMP, engine)

        df['latest_created_at'] = pd.to_datetime(df['latest_created_at'])

        df.set_index('latest_created_at', inplace=True)

        print("Dữ liệu đã được tải vào DataFrame.")

        # --- XUẤT RA CSV ---
        # output_filename = 'traffic_df_final.csv'
        # df.to_csv(output_filename, index=True)
        # print(f"\n✅ Dữ liệu đã xử lý được lưu vào file: **{output_filename}**")

        # utc_timestamp = df.index[0].tz_localize('UTC')
        # local_timestamp = utc_timestamp.tz_convert('Asia/Ho_Chi_Minh')
        # print(df.index[0])
        return df.index[0]

    except Exception as error:
        print(f"Lỗi khi kết nối hoặc truy vấn dữ liệu: {error}")
        return pd.DataFrame()

def get_historical_data(num_lags, minutes_resample, engine):
    latest_created_at = fetch_data_from_postgres(engine)

    # end_time = datetime.now()
    end_time = latest_created_at
    start_time = end_time - timedelta(minutes=(num_lags + 2) * minutes_resample)
    SQL_QUERY = f"""
            SELECT
                "camera_id", "total_objects", "created_at"
            FROM
                camera_detections
            WHERE
                "created_at" >= '{start_time}' AND
                "created_at" <= '{end_time}'
        """
    df = pd.read_sql(SQL_QUERY, engine)
    df['created_at'] = pd.to_datetime(df['created_at'])

    df.set_index('created_at', inplace=True)

    # --- XUẤT RA CSV ---
    # output_filename = 'test.csv'
    # df.to_csv(output_filename, index=True)
    # print(f"\n✅ Dữ liệu đã xử lý được lưu vào file: **{output_filename}**")

    print(df.head())
    # print(end_time)
    # print(start_time)

    return df

def remove_prefix_from_keys(lag_features_dict: dict) -> dict:
    cleaned_dict = {}

    for full_id, lag_values in lag_features_dict.items():
        cleaned_id = full_id.replace('cam_', '')

        cleaned_dict[cleaned_id] = lag_values

    return cleaned_dict
def transform_to_lag_dictionary(df_latest_cams: pd.DataFrame) -> dict:
    """
    Chuyển đổi DataFrame chứa dữ liệu lag mới nhất sang định dạng dictionary:
    {'camera_id': [total_lag_1, total_lag_2, total_lag_3]}
    """
    lag_dict = {}

    # 1. Lặp qua các hàng của DataFrame
    # df_latest_cams.iterrows() trả về (index, row)
    for camera_id, row in df_latest_cams.iterrows():
        # 2. Trích xuất các giá trị lag
        lag_values = [
            row['total_lag_1'],
            row['total_lag_2'],
            row['total_lag_3']
        ]

        # 3. Lưu vào dictionary
        lag_dict[camera_id] = lag_values

    return remove_prefix_from_keys(lag_dict)

traffic_df = get_historical_data(3, 10, engine)
group_camera_id(traffic_df, 10)
df = pd.read_csv('traffic_df_final.csv')

def filtered_data():

    df['created_at'] = pd.to_datetime(df['created_at'])

    camera_columns = [col for col in df.columns if col.startswith('cam_')]
    lag_columns = ['total_lag_1', 'total_lag_2', 'total_lag_3']

    latest_data = {}

    for cam_col in camera_columns:
        cam_data = df[df[cam_col].astype(bool)]

        if not cam_data.empty:
            latest_index = cam_data['created_at'].idxmax()

            latest_row = df.loc[latest_index]

            latest_data[cam_col] = {
                'latest_created_at': latest_row['created_at'],
                'total_lag_1': latest_row['total_lag_1'],
                'total_lag_2': latest_row['total_lag_2'],
                'total_lag_3': latest_row['total_lag_3']
            }

    df_latest_cams = pd.DataFrame.from_dict(latest_data, orient='index')
    df_latest_cams.index.name = 'camera_id'

    df_latest_cams = df_latest_cams.sort_index()

    # print("Dữ liệu mới nhất cho mỗi camera, bao gồm các cột lag:")
    # print(df_latest_cams)

    return transform_to_lag_dictionary(df_latest_cams)

# lag_features_dict = transform_to_lag_dictionary(filtered_data())
# print("Dữ liệu Lag đã được biến đổi:")
# print(filtered_data())