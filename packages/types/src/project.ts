export type ProjectStatus =
  | 'DRAFT'
  | 'ACTIVE'
  | 'IN_LAB'
  | 'ANALYSIS'
  | 'COMPLETED'
  | 'ARCHIVED'
  | 'CANCELLED';

export interface Client {
  id: number;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
}

export interface Location {
  id: number;
  name: string;
  address?: string;
  city?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
}

export interface Project {
  id: number;
  name: string;
  description?: string;
  projectCode: string;
  startDate?: string;
  endDate?: string;
  status: ProjectStatus;
  client?: Client;
  location?: Location;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
}

export interface Borehole {
  id: number;
  projectId: number;
  name: string;
  depthM?: number;
  latitude?: number;
  longitude?: number;
  groundwaterDepthM?: number;
  notes?: string;
  createdBy: number;
  createdAt: string;
}

export interface Sample {
  id: number;
  boreholeId: number;
  sampleCode: string;
  depthFromM?: number;
  depthToM?: number;
  description?: string;
  uscsClassification?: string;
  aashtoClassification?: string;
  classifiedAt?: string;
  createdAt: string;
}

export interface ProjectCreateDto {
  name: string;
  description?: string;
  clientId?: number;
  locationId?: number;
  startDate?: string;
  endDate?: string;
}

export interface BoreholeCreateDto {
  projectId: number;
  name: string;
  depthM?: number;
  latitude?: number;
  longitude?: number;
  groundwaterDepthM?: number;
  notes?: string;
}

export interface SampleCreateDto {
  boreholeId: number;
  sampleCode: string;
  depthFromM?: number;
  depthToM?: number;
  description?: string;
}
