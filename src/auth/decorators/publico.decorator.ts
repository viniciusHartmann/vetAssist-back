import { SetMetadata } from '@nestjs/common';

export const ROTA_PUBLICA = 'rota_publica';

/**
 * Libera a rota do AuthGuard global.
 *
 * O guard e registrado globalmente de proposito: o padrao e "protegido", e
 * abrir uma rota exige um ato explicito. O inverso (proteger caso a caso)
 * deixa rota nova desprotegida por esquecimento.
 */
export const Publico = () => SetMetadata(ROTA_PUBLICA, true);
