// src/api/upload.js

export const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "ml_default"); // Your Unsigned preset

  // Upload directly to Cloudinary
  const response = await fetch(
    "https://api.cloudinary.com/v1_1/rtbv1t8f/image/upload",
    {
      method: "POST",
      body: formData,
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error?.message || "Cloudinary upload failed");
  }

  return data.secure_url; // Returns the public image URL
};