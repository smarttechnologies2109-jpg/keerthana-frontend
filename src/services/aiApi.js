import API from "./api";

/*
=========================================================
 KEERTHANA AI API
=========================================================
*/

export const askKeerthanaAI = async (
  message,
  songs = []
) => {
  const response = await API.post("/ai/ask", {
    message,
    songs,
  });

  return response.data;
};