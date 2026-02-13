
export type Language = 'en' | 'cn';

export type UserRole = 'user' | 'general_admin';

export type Layer = 'general' | 'community';

export type DemoStatus = 'published' | 'pending' | 'rejected';

// General Layer fixed subjects
export enum Subject {
  Physics = 'Physics',
  Chemistry = 'Chemistry',
  Mathematics = 'Mathematics',
  Biology = 'Biology',
  ComputerScience = 'Computer Science',
  Astronomy = 'Astronomy',
  EarthScience = 'Earth Science',
  CreativeTools = 'Creative Tools'
}

// Community Layer dynamic categories
export interface Category {
  id: string;
  name: string;
  parentId: string | null; // null means root level in community layer
  communityId?: string; // If null, it might be a general layer category (future proofing)
  createdAt: number;
}

export interface Bounty {
  id: string;
  title: string;
  description: string;
  reward: string;
  layer: Layer;
  communityId?: string;
  status: 'open' | 'closed';
  creator: string;
  createdAt: number;
}

export interface Community {
  id: string;
  name: string;
  description: string;
  creatorId: string; // The user who created it (and is the admin)
  code: string; // 12-digit random code
  status: 'pending' | 'approved' | 'rejected';
  members: string[]; // List of User IDs who are members
  pendingMembers: string[]; // List of User IDs asking to join
  createdAt: number;
}

export interface Demo {
  id: string;
  title: string;
  // For General layer, categoryId is the Subject enum value. 
  // For Community layer, it's the Category.id.
  categoryId: string; 
  layer: Layer;
  communityId?: string; // Crucial for isolating community content
  description: string;
  code: string; // The HTML/JS source
  author: string;
  thumbnailUrl?: string; // Base64 or URL
  status: DemoStatus;
  createdAt: number;
  rejectionReason?: string;
  bountyId?: string; // Optional link to a bounty task
  likeCount?: number; // Number of likes (optional, populated on demand)
  userLiked?: boolean; // Whether current user has liked this demo
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}
