export interface Bookmark {
  id: number;
  user_id: number;
  secop_process_id: string;
  entidad: string | null;
  departamento: string | null;
  nombre_procedimiento: string | null;
  precio_base: number | null;
  estado_apertura: string | null;
  url_secop: string | null;
  created_at: string;
  deleted_at: string | null;
}
