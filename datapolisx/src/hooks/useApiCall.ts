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