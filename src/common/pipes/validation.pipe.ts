import { BadRequestException, ValidationPipe } from '@nestjs/common';
import type { ValidationError } from 'class-validator';
import { CodigoErro } from '../errors/codigos-erro';

/**
 * Converte os erros do class-validator no canal `fields` que o frontend usa
 * para exibir a mensagem ao lado de cada input. As chaves sao os nomes das
 * propriedades dos DTOs — que estao em portugues.
 */
export function criarValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    // Coercao implicita transforma "abc" em NaN silenciosamente; preferimos
    // @Type() explicito nos DTOs.
    transformOptions: { enableImplicitConversion: false },
    stopAtFirstError: true,
    exceptionFactory: (erros: ValidationError[]) => {
      const fields: Record<string, string> = {};

      const percorrer = (lista: ValidationError[], prefixo = ''): void => {
        for (const erro of lista) {
          const caminho = prefixo ? `${prefixo}.${erro.property}` : erro.property;

          if (erro.constraints) {
            fields[caminho] = Object.values(erro.constraints)[0];
          }

          if (erro.children?.length) {
            percorrer(erro.children, caminho);
          }
        }
      };

      percorrer(erros);

      return new BadRequestException({
        code: CodigoErro.VALIDATION_ERROR,
        message: 'Dados invalidos.',
        fields,
      });
    },
  });
}
