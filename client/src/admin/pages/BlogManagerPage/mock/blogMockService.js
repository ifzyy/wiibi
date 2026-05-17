import api from "../../../utils/api";
export const blogApi = {
  // Public routes
  getPublishedBlogs(params) {
    return api.get('/blog', { params });
  },

  getPublishedBlogBySlug(slug) {
    return api.get(`/blog/${slug}`);
  },

  getPublicTags() {
    return api.get('/blog/tags');
  },

  // Admin routes
  getBlogs(params) {
    return api.get('/admin/blog', { params });
  },

  getBlogById(id) {
    return api.get(`/admin/blog/${id}`);
  },

  createBlog(data) {
    return api.post('/admin/blog', data);
  },

  updateBlog(id, data) {
    return api.patch(`/admin/blog/${id}`, data);
  },

  deleteBlog(id) {
    return api.delete(`/admin/blog/${id}`);
  },

  restoreBlog(id) {
    return api.post(`/admin/blog/${id}/restore`);
  },

  hardDeleteBlog(id) {
    return api.delete(`/admin/blog/${id}/hard`);
  },

  getAdminTags() {
    return api.get('/admin/blog/tags');
  },

  bulkStatusUpdate(ids, status) {
    return api.patch('/admin/blog/bulk-status', { ids, status });
  },

  attachMedia(blogId, data) {
    return api.post(`/admin/blog/${blogId}/media/attach`, data);
  },

  removeMedia(blogId, mediaId) {
    return api.delete(`/admin/blog/${blogId}/media/${mediaId}`);
  }
};

// Wrap it in the same interface as mock service
export const blogMockService = {
  async getBlogs() {
    const response = await blogApi.getBlogs();
    console.log("Fetched blogs from API:", response.data.blogs);
    return response.data.blogs || [];
  },

  async getBlogById(id) {
    const response = await blogApi.getBlogById(id);
    return response.data.blog;
  },

  async createBlog(data) {
    const response = await blogApi.createBlog(data);
    return response.data.blog;
  },

  async updateBlog(id, data) {
    const response = await blogApi.updateBlog(id, data);
    return response.data.blog;
  },

  async deleteBlog(id) {
    await blogApi.deleteBlog(id);
    return { success: true };
  }
};