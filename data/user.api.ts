import { mockUser } from '@/data/mocks/user.mock';
import { UserDetails } from '@/types/schemas/authorization-schemas';

export function getUser(): UserDetails {
  return mockUser;
}
