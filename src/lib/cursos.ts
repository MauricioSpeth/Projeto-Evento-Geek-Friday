export const CURSOS = [
  'Administração','Ciências Contábeis','Direito','Educação Física','Enfermagem',
  'Engenharia Agronômica','Engenharia Civil','Engenharia de Software',
  'Medicina Veterinária','Nutrição','Pedagogia','Psicologia',
  'Terapia Ocupacional','Zootecnia'
] as const;

export type Curso = typeof CURSOS[number];

/** Quantidade máxima de períodos oferecidos em cada curso. */
export const PERIODOS_POR_CURSO: Record<Curso, 8 | 10> = {
  'Administração': 8,
  'Ciências Contábeis': 8,
  'Direito': 10,
  'Educação Física': 8,
  'Enfermagem': 10,
  'Engenharia Agronômica': 10,
  'Engenharia Civil': 10,
  'Engenharia de Software': 8,
  'Medicina Veterinária': 10,
  'Nutrição': 10,
  'Pedagogia': 8,
  'Psicologia': 10,
  'Terapia Ocupacional': 8,
  'Zootecnia': 10,
};

/** Cursos legados permanecem editáveis, sem inventar um limite desconhecido. */
export function maxPeriodosCurso(curso: string): number {
  if (!curso) return 0;
  return PERIODOS_POR_CURSO[curso as Curso] ?? 10;
}
