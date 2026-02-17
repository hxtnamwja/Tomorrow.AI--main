
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
  code: string; // The HTML/JS source or entry file path for multi-file projects
  author: string;
  creatorId?: string; // User ID of the creator
  thumbnailUrl?: string; // Base64 or URL
  status: DemoStatus;
  createdAt: number;
  rejectionReason?: string;
  bountyId?: string; // Optional link to a bounty task
  likeCount?: number; // Number of likes (optional, populated on demand)
  userLiked?: boolean; // Whether current user has liked this demo
  projectType?: 'single-file' | 'multi-file'; // Project type
  entryFile?: string; // Entry file path for multi-file projects
  projectSize?: number; // Project total size in bytes
}

export interface User {
  id: string;
  username: string;
  role: UserRole;
  createdAt: number;
  isBanned: number;
  banReason?: string;
  contactInfo?: string;
  paymentQr?: string;
  bio?: string;
}

export interface UserStats {
  demosCount: number;
  communitiesCount: number;
  communitiesManaged: Community[];
  likedDemos: Demo[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface DemoPublication {
  id: string;
  demoId: string;
  layer: Layer;
  communityId?: string;
  categoryId: string;
  status: 'pending' | 'published' | 'rejected';
  rejectionReason?: string;
  requestedBy: string;
  requestedAt: number;
  reviewedBy?: string;
  reviewedAt?: number;
}

export type FeedbackType = 'demo_complaint' | 'community_feedback' | 'website_feedback';

export interface Feedback {
  id: string;
  type: FeedbackType;
  title: string;
  content: string;
  layer: Layer;
  communityId?: string;
  demoId?: string;
  demoTitle?: string;
  communityName?: string;
  status: 'pending' | 'in_progress' | 'resolved' | 'dismissed';
  resolution?: string;
  createdBy: string;
  createdAt: number;
  reviewedBy?: string;
  reviewedAt?: number;
}
