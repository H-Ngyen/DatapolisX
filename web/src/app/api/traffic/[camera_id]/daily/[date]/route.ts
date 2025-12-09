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

import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/errorHandler';
import trafficController from '@/controllers/trafficController';

// Định nghĩa params nhận vào từ URL Dynamic Route
interface RouteParams {
  params: {
    camera_id: string;
    date: string; // Format: YYYY-MM-DD
  }
}

export const GET = withErrorHandler(async (req: NextRequest, { params }: RouteParams) => {
  const { camera_id, date } = params;
  const dailyStats = await trafficController.getDailyTrafficStats(camera_id, date);
  return NextResponse.json({ success: true, data: dailyStats });
});