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

import { useState } from "react";
import { ApiCallState, HttpMethod } from "@/lib/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export const useApiCall = <T = unknown>(): ApiCallState<T> => {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const execute = async (endpoint: string, method: HttpMethod = 'GET', body: object | null = null): Promise<void> => {
        setLoading(true);
        setError(null);

        try {
            const options: RequestInit = {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                }
            };

            if (body && method !== 'GET') options.body = JSON.stringify(body);

            const url = `${API_BASE_URL}${endpoint}`;
            const response = await fetch(url, options);
            if (!response.ok) throw new Error(`HTTP error: ${response.status}`);

            const result: T = await response.json();
            setData(result);
        }
        catch (err: unknown) {
            if (err instanceof Error) setError(err);
            else setError(new Error("An unknown error occurred"));
        }
        finally {
            setLoading(false);
        }
    };

    return { execute, data, loading, error };
};