/**
 * Interpretacao de datas dos filtros.
 *
 * Regra: uma data sem offset (`2026-01-05`) e tratada como UTC, NUNCA no fuso
 * do servidor — senao o mesmo filtro devolveria resultados diferentes conforme
 * onde a aplicacao roda.
 */

/** Detecta se a string ja carrega fuso (Z ou +hh:mm). */
function possuiFuso(valor: string): boolean {
  return /(?:Z|[+-]\d{2}:?\d{2})$/i.test(valor);
}

/** Data apenas (YYYY-MM-DD), sem parte de hora. */
function somenteData(valor: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(valor);
}

export function inicioDoIntervalo(valor: string): Date {
  if (somenteData(valor)) {
    return new Date(`${valor}T00:00:00.000Z`);
  }

  return new Date(possuiFuso(valor) ? valor : `${valor}Z`);
}

/**
 * `dataAte=2026-01-05` deve incluir o dia inteiro — o usuario espera um
 * intervalo inclusivo, nao um corte a meia-noite.
 */
export function fimDoIntervalo(valor: string): Date {
  if (somenteData(valor)) {
    return new Date(`${valor}T23:59:59.999Z`);
  }

  return new Date(possuiFuso(valor) ? valor : `${valor}Z`);
}
