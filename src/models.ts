export type UserRole = "donor" | "user";

export interface User {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  role: UserRole;
}

export interface Food {
  id: number;
  donor_id: number;
  title: string;
  description?: string;
  quantity?: string;
  contact_info: string;
  expiry: string; // ISO datetime
  created_at: string;
}
