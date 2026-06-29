interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export function getApiBaseUrl(): string {
  if (import.meta.env.SSR) {
    return import.meta.env.PUBLIC_API_URL || "http://127.0.0.1:5000";
  }
  return "";
}

export async function apiGet<T>(path: string): Promise<T> {
  const url = `${getApiBaseUrl()}/api${path}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`API request failed: ${path}`);
  }

  const json = (await response.json()) as ApiResponse<T>;
  return json.data;
}
