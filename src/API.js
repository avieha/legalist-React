export async function sendFilesToServer(formData) {
  console.log("Uploading files with formData...");

  try {
    const res = await fetch(`${import.meta.env.VITE_API_LOCAL}/files`, {
      method: "POST",
      body: formData,
    });
    return await res.json();
  } catch (err) {
    console.error("Upload error:", err);
    return { error: true };
  }
}

export async function sendMessageToServer(formData) {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_LOCAL}/prompt`, {
      method: "POST",
      body: formData,
    });
    return await response.json();
  } catch (error) {
    console.error("Error sending message:", error);
    return { error: true };
  }
}
export async function getFileSummary(fileName) {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_LOCAL}/get-summary/${fileName}`,
    );
    return await response.json();
  } catch (error) {
    console.error("Error fetching file summary:", error);
    throw error;
  }
}
