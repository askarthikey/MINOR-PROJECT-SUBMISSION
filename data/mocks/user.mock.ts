import { UserRole } from '@/lib/routes';
import { UserDetails } from '@/types/schemas/authorization-schemas';

export const mockUser: UserDetails = {
  id: '1',
  email: 'user@mail.com',
  username: 'Ivan',
  role: UserRole.User,
};

export const mockAdmin: UserDetails = {
  id: '2',
  email: 'admin@mail.com',
  username: 'Admin',
  role: UserRole.Admin,
};
