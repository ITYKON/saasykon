export type Business = {
  id: string;
  name: string;
  description?: string;
  category?: string;
  logo_url?: string;
  cover_url?: string;
  rating?: number;
  reviewCount?: number;
  location?: {
    address: string;
    city?: string;
    postalCode?: string;
    latitude?: number;
    longitude?: number;
  };
  media: Array<{ url: string; type?: string; position?: number }>;
  services: Array<{ 
    id: string; 
    name: string; 
    price_cents?: number; 
    duration_minutes?: number 
  }>;
  employeesCount: number;
  isPremium: boolean;
  isNew?: boolean;
  isTop?: boolean;
  city?: string;
  public_name?: string | null;
  legal_name?: string;
  claim_status?: 'none' | 'pending' | 'approved' | 'not_claimable';
};
