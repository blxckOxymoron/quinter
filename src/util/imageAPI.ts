import { createClient } from "pexels";

export async function searchForImage(query: string, page: number = 1) {
  if (!process.env.PEXELS_API_KEY) throw new Error("No PEXELS_API_KEY env variable set");

  const response = await createClient(process.env.PEXELS_API_KEY).photos.search({
    query,
    per_page: 6,
    page,
  });

  if ("error" in response) throw new Error(response.error);

  return response;
}
