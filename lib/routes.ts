export enum Routes {
  Home = '/',
  Dashboard = '/dashboard',
  SignIn = '/sign-in',
  Onboard = '/onboard',
  Interview = '/interview',
  Session = '/session',
  Analytics = '/analytics',
  Leaderboard = '/leaderboard',
  History = '/history',
  Profile = '/profile',
  // Legacy aliases (old MCQ quiz routes, kept for backward compat)
  Library = '/interview',
}

export enum UserRole {
  Admin = 'admin',
  User = 'user',
}

// Route config type
export type RouteConfig = {
  access: 'all' | 'authorized' | 'unauthorized';
  allowedRoles?: UserRole[];
};

export const RoutePermissions: Record<string, RouteConfig> = {
  [Routes.Home]: { access: 'all' },
  [Routes.Dashboard]: { access: 'authorized' },
  [Routes.SignIn]: { access: 'unauthorized' },
  [Routes.Interview]: { access: 'authorized' },
  [Routes.Leaderboard]: { access: 'all' },
  [Routes.History]: { access: 'authorized' },
  [Routes.Onboard]: { access: 'authorized' },
  [Routes.Profile]: { access: 'authorized' },
};
