import api from "../../../utils/api"

export const callUpdateSection = async (sectionId, content) => {
  try {
    const res = await api.put(`/admin/sections/${sectionId}`, { content });
    return res.data; // Axios puts response data in the 'data' property
  } catch (error) {
    console.log(error)
    // Axios throws errors with response data in error.response
    const errorMessage = error.response?.data?.message || error.message || "Failed to save";
    throw new Error(errorMessage);
  }
};