export type Role = 'USER' | 'LAB_MANAGER' | 'ADMIN';

export type UserStatus = 'PENDING' | 'ACTIVE' | 'INACTIVE';

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  contactNumber?: string;
  role: Role;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  contactNumber?: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
  iat: number;
  exp: number;
}
