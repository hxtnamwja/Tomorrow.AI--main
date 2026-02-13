import { Demo, Category, Bounty, Community } from '../types';
import { 
  DemosAPI, 
  CommunitiesAPI, 
  CategoriesAPI, 
  BountiesAPI,
  AuthAPI 
} from './apiService';

// Seed data for initial setup
const SEED_DEMOS: Demo[] = [
  {
    id: 'demo-001',
    title: 'Wave Interference Pattern',
    description: 'A visualization of wave interference patterns showing constructive and destructive interference.',
    categoryId: 'Physics',
    layer: 'general',
    code: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { margin: 0; overflow: hidden; background: #0f172a; }
    canvas { display: block; }
    .controls {
      position: absolute;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(255,255,255,0.1);
      backdrop-filter: blur(10px);
      padding: 15px 25px;
      border-radius: 30px;
      color: white;
      font-family: system-ui, sans-serif;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <canvas id="canvas"></canvas>
  <div class="controls">Wave Interference Simulation</div>
  <script>
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    let time = 0;
    function animate() {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      
      for (let i = 0; i < 50; i++) {
        const angle = (i / 50) * Math.PI * 2;
        const r = 100 + Math.sin(time + i * 0.2) * 30;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = \`hsl(\${200 + i * 2}, 70%, 60%)\`;
        ctx.fill();
      }
      
      time += 0.05;
      requestAnimationFrame(animate);
    }
    animate();
  </script>
</body>
</html>`,
    author: 'Dr. Smith',
    status: 'published',
    createdAt: Date.now(),
  }
];

const SEED_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'AP Physics C', parentId: null, createdAt: Date.now() },
];

const SEED_BOUNTIES: Bounty[] = [
  {
    id: 'b-1',
    title: 'Viscous Fluid Simulation',
    description: 'We need a high-performance visual of fluid dynamics with adjustable viscosity parameters.',
    reward: '$200 Grant',
    layer: 'general',
    status: 'open',
    creator: 'Admin',
    createdAt: Date.now()
  }
];

// Helper to generate community code
const generateCommunityCode = () => {
  return Math.random().toString().slice(2, 14);
};

export const StorageService = {
  // Initialize - check API connection
  initialize: async () => {
    try {
      // Check if we have a stored token and validate it
      const user = AuthAPI.getStoredUser();
      if (user) {
        try {
          await AuthAPI.getCurrentUser();
        } catch {
          // Token invalid, clear it
          AuthAPI.logout();
        }
      }
    } catch (error) {
      console.error('Storage initialization error:', error);
    }
  },

  // Auth methods
  login: async (username: string, password: string) => {
    return await AuthAPI.login(username, password);
  },

  register: async (username: string, password: string) => {
    return await AuthAPI.register(username, password);
  },


  logout: () => {
    AuthAPI.logout();
  },

  getCurrentUser: () => {
    return AuthAPI.getStoredUser();
  },

  // --- Communities ---
  getCommunities: async (): Promise<Community[]> => {
    try {
      return await CommunitiesAPI.getAll();
    } catch (error) {
      console.error('Error fetching communities:', error);
      return [];
    }
  },

  createCommunity: async (name: string, description: string, creatorId: string): Promise<Community> => {
    return await CommunitiesAPI.create(name, description);
  },

  joinCommunityRequest: async (communityId: string, userId: string) => {
    await CommunitiesAPI.requestJoin(communityId);
  },
  
  joinCommunityByCode: async (code: string, userId: string): Promise<boolean> => {
    try {
      await CommunitiesAPI.joinByCode(code);
      return true;
    } catch {
      return false;
    }
  },

  approveCommunity: async (id: string) => {
    await CommunitiesAPI.updateStatus(id, 'approved');
  },

  rejectCommunity: async (id: string) => {
    await CommunitiesAPI.updateStatus(id, 'rejected');
  },

  manageMember: async (communityId: string, memberId: string, action: 'accept' | 'kick' | 'reject_request') => {
    await CommunitiesAPI.manageMember(communityId, memberId, action);
  },

  updateCommunityCode: async (communityId: string, newCode: string) => {
    await CommunitiesAPI.updateCode(communityId);
  },

  saveCommunity: async (community: Community): Promise<Community> => {
    return await CommunitiesAPI.update(community.id, community);
  },

  deleteCommunity: async (communityId: string): Promise<void> => {
    await CommunitiesAPI.delete(communityId);
  },

  // --- Demos ---
  getAllDemos: async (): Promise<Demo[]> => {
    try {
      // Get all demos regardless of status (for admin review)
      return await DemosAPI.getAll({});
    } catch (error) {
      console.error('Error fetching demos:', error);
      return SEED_DEMOS;
    }
  },

  getPublishedDemos: async (): Promise<Demo[]> => {
    try {
      return await DemosAPI.getAll({ status: 'published' });
    } catch (error) {
      console.error('Error fetching published demos:', error);
      return [];
    }
  },

  getDemosByLayer: async (layer: string, communityId?: string): Promise<Demo[]> => {
    try {
      // Get all demos for the layer (including pending for admin review)
      return await DemosAPI.getAll({ layer, communityId });
    } catch (error) {
      console.error('Error fetching demos by layer:', error);
      return [];
    }
  },

  // Get demos sorted by likes
  getDemosSortedByLikes: async (params?: {
    layer?: string;
    communityId?: string;
    categoryId?: string;
    search?: string;
    status?: string;
  }): Promise<Demo[]> => {
    try {
      return await DemosAPI.getAllSortedByLikes(params);
    } catch (error) {
      console.error('Error fetching demos sorted by likes:', error);
      return [];
    }
  },

  saveDemo: async (demo: Demo) => {
    await DemosAPI.create(demo);
  },

  updateDemoStatus: async (id: string, status: string, rejectionReason?: string) => {
    await DemosAPI.updateStatus(id, status, rejectionReason);
  },

  updateDemoCover: async (id: string, thumbnailUrl: string) => {
    await DemosAPI.updateCover(id, thumbnailUrl);
  },

  deleteDemo: async (id: string) => {
    await DemosAPI.delete(id);
  },

  // --- Categories ---
  getCategories: async (): Promise<Category[]> => {
    try {
      return await CategoriesAPI.getAll();
    } catch (error) {
      console.error('Error fetching categories:', error);
      return SEED_CATEGORIES;
    }
  },

  getCategoriesByLayer: async (layer: string, communityId?: string): Promise<Category[]> => {
    try {
      return await CategoriesAPI.getAll({ layer, communityId });
    } catch (error) {
      console.error('Error fetching categories by layer:', error);
      return [];
    }
  },

  saveCategory: async (category: Category) => {
    await CategoriesAPI.create(category.name, category.parentId, category.communityId);
  },
 
  addCategory: async (name: string, parentId: string | null, communityId?: string) => {
    await CategoriesAPI.create(name, parentId, communityId);
  },

  deleteCategory: async (id: string) => {
    await CategoriesAPI.delete(id);
  },

  // --- Bounties ---
  getBounties: async (): Promise<Bounty[]> => {
    try {
      return await BountiesAPI.getAll();
    } catch (error) {
      console.error('Error fetching bounties:', error);
      return SEED_BOUNTIES;
    }
  },

  getBountiesByLayer: async (layer: string, communityId?: string): Promise<Bounty[]> => {
    try {
      return await BountiesAPI.getAll({ layer, communityId });
    } catch (error) {
      console.error('Error fetching bounties by layer:', error);
      return [];
    }
  },

  saveBounty: async (bounty: Bounty) => {
    await BountiesAPI.create(bounty);
  },
 
  addBounty: async (bounty: Bounty | Omit<Bounty, 'id' | 'createdAt'>) => {
    await BountiesAPI.create({
      title: bounty.title,
      description: bounty.description,
      reward: bounty.reward,
      layer: bounty.layer,
      communityId: bounty.communityId,
      status: 'open',
      creator: bounty.creator
    });
  },

  deleteBounty: async (id: string) => {
    await BountiesAPI.delete(id);
  },
};
