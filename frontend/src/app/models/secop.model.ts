export interface SecopConvocatoria {
  secop_process_id: string | null;
  entidad: string | null;
  nit_entidad: string | null;
  departamento: string | null;
  ciudad: string | null;
  nombre_procedimiento: string | null;
  descripcion_procedimiento: string | null;
  precio_base: number | null;
  fecha_publicacion: string | null;
  fecha_ultima_publicacion: string | null;
  modalidad_contratacion: string | null;
  tipo_contrato: string | null;
  estado_procedimiento: string | null;
  estado_apertura: string | null;
  url_secop: string | null;
}
