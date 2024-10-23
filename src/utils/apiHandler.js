export async function handleApiResponse(response) {
  if (!response.ok) {
    const errorResponse = await response.json();
    console.error("错误响应内容:", errorResponse);
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();
}
