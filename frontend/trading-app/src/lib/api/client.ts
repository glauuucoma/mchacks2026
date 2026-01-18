const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export const apiRequest = async (path: string, options: RequestInit = {}) => {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
  return response.json();
};