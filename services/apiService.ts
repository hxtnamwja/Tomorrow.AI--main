import { Demo, Category, Bounty, Community } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

// Helper to get auth token
const getToken = (): string | null => {
  return localStorage.getItem('sci_demo_token');
};

// Helper for API requests
const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ code: number; message: string; data: T }> => {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getToken();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(url, {
    ...options,
    headers,
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }
  
  return response.json();
};

// Auth API
export const AuthAPI = {
  login: async (username: string, password: string) => {
    const result = await apiRequest<{ token: string; user: { id: string; username: string; role: string } }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    if (result.data.token) {
      localStorage.setItem('sci_demo_token', result.data.token);
      localStorage.setItem('sci_demo_user', JSON.stringify(result.data.user));
    }
    return result.data;
  },
  
  register: async (username: string, password: string) => {
    const result = await apiRequest<{ token: string; user: { id: string; username: string; role: string } }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
    });
    if (result.data.token) {
        localStorage.setItem('sci_demo_token', result.data.token);
        localStorage.setItem('sci_demo_user', JSON.stringify(result.data.user));
    }
    return result.data;
  },
  
  getCurrentUser: async () => {
    const result = await apiRequest<{ id: string; username: string; role: string }>('/auth/me');
    return result.data;
  },
  
  logout: () => {
    localStorage.removeItem('sci_demo_token');
    localStorage.removeItem('sci_demo_user');
  },
  
  getStoredUser: () => {
    const userStr = localStorage.getItem('sci_demo_user');
    return userStr ? JSON.parse(userStr) : null;
  },
};

// Demos API
export const DemosAPI = {
  getAll: async (params?: {
    layer?: string;
    communityId?: string;
    categoryId?: string;
    search?: string;
    status?: string;
    authorId?: string;
  }): Promise<Demo[]> => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value);
        }
      });
    }
    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    const result = await apiRequest<Demo[]>(`/demos${query}`);
    return result.data;
  },
  
  getById: async (id: string): Promise<Demo> => {
    const result = await apiRequest<Demo>(`/demos/${id}`);
    return result.data;
  },
  
  create: async (demo: Omit<Demo, 'id' | 'createdAt'>): Promise<Demo> => {
    const result = await apiRequest<Demo>('/demos', {
      method: 'POST',
      body: JSON.stringify({
        title: demo.title,
        description: demo.description,
        categoryId: demo.categoryId,
        layer: demo.layer,
        communityId: demo.communityId,
        code: demo.code,
        bountyId: demo.bountyId,
        // Author is set server-side based on the authenticated user
      }),
    });
    return result.data;
  },
  
  updateStatus: async (id: string, status: string, rejectionReason?: string): Promise<Demo> => {
    const result = await apiRequest<Demo>(`/demos/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, rejectionReason }),
    });
    return result.data;
  },
  
  updateCover: async (id: string, thumbnailUrl: string): Promise<Demo> => {
    const result = await apiRequest<Demo>(`/demos/${id}/cover`, {
      method: 'PATCH',
      body: JSON.stringify({ thumbnailUrl }),
    });
    return result.data;
  },
  
  delete: async (id: string): Promise<void> => {
    await apiRequest<void>(`/demos/${id}`, {
      method: 'DELETE',
    });
  },

  // Like methods
  getLikes: async (id: string): Promise<{ count: number; userLiked: boolean }> => {
    const result = await apiRequest<{ count: number; userLiked: boolean }>(`/demos/${id}/likes`);
    return result.data;
  },

  like: async (id: string): Promise<{ count: number; userLiked: boolean }> => {
    const result = await apiRequest<{ count: number; userLiked: boolean }>(`/demos/${id}/like`, {
      method: 'POST',
    });
    return result.data;
  },

  unlike: async (id: string): Promise<{ count: number; userLiked: boolean }> => {
    const result = await apiRequest<{ count: number; userLiked: boolean }>(`/demos/${id}/like`, {
      method: 'DELETE',
    });
    return result.data;
  },

  getLikedByUser: async (userId: string): Promise<Demo[]> => {
    const result = await apiRequest<Demo[]>(`/demos/liked/by/${userId}`);
    return result.data;
  },

  // Get demos sorted by likes
  getAllSortedByLikes: async (params?: {
    layer?: string;
    communityId?: string;
    categoryId?: string;
    search?: string;
    status?: string;
  }): Promise<Demo[]> => {
    const queryParams = new URLSearchParams();
    queryParams.append('sortBy', 'likes');
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value);
        }
      });
    }
    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    const result = await apiRequest<Demo[]>(`/demos${query}`);
    return result.data;
  },
};

// Communities API
export const CommunitiesAPI = {
  getAll: async (params?: { status?: string; userId?: string }): Promise<Community[]> => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value);
        }
      });
    }
    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    const result = await apiRequest<Community[]>(`/communities${query}`);
    return result.data;
  },
  
  create: async (name: string, description: string): Promise<Community> => {
    const result = await apiRequest<Community>('/communities', {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    });
    return result.data;
  },
  
  updateStatus: async (id: string, status: string): Promise<Community> => {
    const result = await apiRequest<Community>(`/communities/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    return result.data;
  },
  
  joinByCode: async (code: string): Promise<Community> => {
    const result = await apiRequest<Community>('/communities/join-by-code', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
    return result.data;
  },
  
  requestJoin: async (communityId: string): Promise<void> => {
    await apiRequest<void>(`/communities/${communityId}/join-request`, {
      method: 'POST',
    });
  },
  
  manageMember: async (communityId: string, userId: string, action: 'accept' | 'kick' | 'reject_request'): Promise<void> => {
    await apiRequest<void>(`/communities/${communityId}/members/manage`, {
      method: 'POST',
      body: JSON.stringify({ userId, action }),
    });
  },
  
  getMembers: async (communityId: string): Promise<{ id: string; username: string; status: string; joined_at: number }[]> => {
    const result = await apiRequest<{ id: string; username: string; status: string; joined_at: number }[]>(`/communities/${communityId}/members`);
    return result.data;
  },
  
  updateCode: async (communityId: string): Promise<{ code: string }> => {
    const result = await apiRequest<{ code: string }>(`/communities/${communityId}/code`, {
      method: 'PATCH',
    });
    return result.data;
  },

  update: async (id: string, data: Partial<Community>): Promise<Community> => {
    const result = await apiRequest<Community>(`/communities/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return result.data;
  },
  
  delete: async (id: string): Promise<void> => {
    await apiRequest<void>(`/communities/${id}`, {
      method: 'DELETE',
    });
  },
};

// Categories API
export const CategoriesAPI = {
  getAll: async (params?: { layer?: string; communityId?: string }): Promise<Category[]> => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value);
        }
      });
    }
    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    const result = await apiRequest<Category[]>(`/categories${query}`);
    return result.data;
  },
  
  create: async (name: string, parentId: string | null, communityId?: string): Promise<Category> => {
    const result = await apiRequest<Category>('/categories', {
      method: 'POST',
      body: JSON.stringify({ name, parentId, communityId }),
    });
    return result.data;
  },
  
  delete: async (id: string): Promise<void> => {
    await apiRequest<void>(`/categories/${id}`, {
      method: 'DELETE',
    });
  },
};

// Bounties API
export const BountiesAPI = {
  getAll: async (params?: { layer?: string; communityId?: string; status?: string }): Promise<Bounty[]> => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value);
        }
      });
    }
    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    const result = await apiRequest<Bounty[]>(`/bounties${query}`);
    return result.data;
  },
  
  create: async (bounty: Omit<Bounty, 'id' | 'createdAt'>): Promise<Bounty> => {
    const result = await apiRequest<Bounty>('/bounties', {
      method: 'POST',
      body: JSON.stringify({
        title: bounty.title,
        description: bounty.description,
        reward: bounty.reward,
        layer: bounty.layer,
        communityId: bounty.communityId,
      }),
    });
    return result.data;
  },
  
  updateStatus: async (id: string, status: string): Promise<Bounty> => {
    const result = await apiRequest<Bounty>(`/bounties/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    return result.data;
  },
  
  delete: async (id: string): Promise<void> => {
    await apiRequest<void>(`/bounties/${id}`, {
      method: 'DELETE',
    });
  },
};
