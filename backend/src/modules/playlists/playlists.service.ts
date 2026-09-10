import fs from 'fs';
import path from 'path';

export interface PlaylistResource {
  id: number;
  resourceId: number;
  title: string;
  filename?: string;
  fileType: string;
  fileUrl?: string;
  isCompleted?: boolean;
}

export interface PlaylistData {
  id: number;
  name: string;
  title?: string;
  description: string;
  subject: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  isPremium: boolean;
  isPublished: boolean;
  coverUrl?: string;
  thumbnailUrl?: string;
  price?: number;
  tutorId?: number;
  tutor?: {
    id: number;
    name: string;
    profilePic?: string;
    avatarUrl?: string;
    isVerified?: boolean;
  };
  resources?: PlaylistResource[];
  resourceCount?: number;
  completedResourceIds?: number[];
  createdAt: string;
  updatedAt: string;
}

const PLAYLISTS_FILE = path.resolve(__dirname, '../../../playlists-data.json');

const DEFAULT_PLAYLISTS: PlaylistData[] = [
  {
    id: 1,
    name: 'Mastering Java & Data Structures',
    title: 'Mastering Java & Data Structures',
    description: 'A curated pathway covering Core Java, OOP principles, Collections Framework, and foundational Data Structures.',
    subject: 'Computer Science',
    difficulty: 'intermediate',
    isPremium: false,
    isPublished: true,
    coverUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=80',
    price: 0,
    tutorId: 1,
    tutor: {
      id: 1,
      name: 'Dr. Sarah Jenkins',
      isVerified: true,
    },
    resources: [
      { id: 101, resourceId: 101, title: 'Java Syntax & Basics Guide', fileType: 'pdf' },
      { id: 102, resourceId: 102, title: 'OOP Principles in Action', fileType: 'pdf' },
      { id: 103, resourceId: 103, title: 'Collections & Generics Cheat Sheet', fileType: 'pdf' },
    ],
    resourceCount: 3,
    completedResourceIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 2,
    name: 'Calculus I: Limits, Derivatives & Applications',
    title: 'Calculus I: Limits, Derivatives & Applications',
    description: 'Complete revision sequence for single-variable differential calculus with step-by-step problem sets.',
    subject: 'Mathematics',
    difficulty: 'beginner',
    isPremium: false,
    isPublished: true,
    coverUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&auto=format&fit=crop&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&auto=format&fit=crop&q=80',
    price: 0,
    tutorId: 2,
    tutor: {
      id: 2,
      name: 'Prof. David Chen',
      isVerified: true,
    },
    resources: [
      { id: 201, resourceId: 201, title: 'Limits & Continuity Summary', fileType: 'pdf' },
      { id: 202, resourceId: 202, title: 'Derivative Rules & Proofs', fileType: 'pdf' },
      { id: 203, resourceId: 203, title: 'Optimization Problems Practice', fileType: 'pdf' },
    ],
    resourceCount: 3,
    completedResourceIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 3,
    name: 'Organic Chemistry Reactions Roadmap',
    title: 'Organic Chemistry Reactions Roadmap',
    description: 'Visual mechanism flowcharts, reagent reference cards, and synthesis walkthroughs for organic chemistry.',
    subject: 'Chemistry',
    difficulty: 'advanced',
    isPremium: false,
    isPublished: true,
    coverUrl: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=600&auto=format&fit=crop&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=600&auto=format&fit=crop&q=80',
    price: 0,
    tutorId: 3,
    tutor: {
      id: 3,
      name: 'Elena Rostova',
      isVerified: true,
    },
    resources: [
      { id: 301, resourceId: 301, title: 'Reaction Mechanisms Flowchart', fileType: 'pdf' },
      { id: 302, resourceId: 302, title: 'Functional Group Conversions', fileType: 'pdf' },
    ],
    resourceCount: 2,
    completedResourceIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

function loadPlaylists(): PlaylistData[] {
  try {
    if (fs.existsSync(PLAYLISTS_FILE)) {
      const content = fs.readFileSync(PLAYLISTS_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch {
    // fallback
  }
  savePlaylists(DEFAULT_PLAYLISTS);
  return DEFAULT_PLAYLISTS;
}

function savePlaylists(data: PlaylistData[]): void {
  try {
    fs.writeFileSync(PLAYLISTS_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save playlists file:', err);
  }
}

export const playlistsService = {
  list(query?: { search?: string; subject?: string; difficulty?: string }) {
    let list = loadPlaylists();
    if (query?.search) {
      const q = query.search.toLowerCase();
      list = list.filter(p => (p.name || p.title || '').toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q));
    }
    if (query?.subject) {
      list = list.filter(p => p.subject?.toLowerCase() === query.subject?.toLowerCase());
    }
    if (query?.difficulty) {
      list = list.filter(p => p.difficulty?.toLowerCase() === query.difficulty?.toLowerCase());
    }
    return list;
  },

  getById(id: number) {
    const list = loadPlaylists();
    return list.find(p => p.id === id) || null;
  },

  listByTutor(tutorId?: number) {
    const list = loadPlaylists();
    if (!tutorId) return list;
    return list.filter(p => p.tutorId === tutorId);
  },

  create(tutor: { id: number; name: string }, input: Partial<PlaylistData>) {
    const list = loadPlaylists();
    const newId = list.length > 0 ? Math.max(...list.map(p => p.id)) + 1 : 1;
    const item: PlaylistData = {
      id: newId,
      name: input.name || input.title || 'Untitled Playlist',
      title: input.title || input.name || 'Untitled Playlist',
      description: input.description || '',
      subject: input.subject || 'General',
      difficulty: input.difficulty || 'intermediate',
      isPremium: input.isPremium || false,
      isPublished: input.isPublished !== undefined ? input.isPublished : true,
      coverUrl: input.coverUrl || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=80',
      thumbnailUrl: input.thumbnailUrl || input.coverUrl,
      price: input.price || 0,
      tutorId: tutor.id,
      tutor: {
        id: tutor.id,
        name: tutor.name,
        isVerified: true,
      },
      resources: input.resources || [],
      resourceCount: input.resourceCount || (input.resources?.length || 0),
      completedResourceIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    list.unshift(item);
    savePlaylists(list);
    return item;
  },

  update(id: number, input: Partial<PlaylistData>) {
    const list = loadPlaylists();
    const idx = list.findIndex(p => p.id === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...input, updatedAt: new Date().toISOString() };
    savePlaylists(list);
    return list[idx];
  },

  markResourceComplete(playlistId: number, resourceId: number) {
    const list = loadPlaylists();
    const p = list.find(item => item.id === playlistId);
    if (p) {
      p.completedResourceIds = p.completedResourceIds || [];
      if (!p.completedResourceIds.includes(resourceId)) {
        p.completedResourceIds.push(resourceId);
        savePlaylists(list);
      }
    }
    return true;
  },
};
