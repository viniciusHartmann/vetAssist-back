import { SetMetadata } from '@nestjs/common';

export const SEM_ENVELOPE = 'sem_envelope';

/**
 * Desliga o envelope para uma rota especifica.
 *
 * Usado apenas no callback do OAuth, que responde 302 sem corpo. Qualquer
 * outra rota HTTP deve manter o envelope.
 */
export const SemEnvelope = () => SetMetadata(SEM_ENVELOPE, true);
