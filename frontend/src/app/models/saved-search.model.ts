export interface SavedSearch {
  id: number;
  user_id: number;
  name: string;
  query_params: Record<string, string>;
  created_at: string;
  updated_at: string;
}
