import { z } from "zod";

export function isValidCpf(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false;

  const calcCheck = (base: string, factor: number) => {
    let sum = 0;
    for (const d of base) {
      sum += Number(d) * factor--;
    }
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };

  const d1 = calcCheck(digits.slice(0, 9), 10);
  const d2 = calcCheck(digits.slice(0, 10), 11);
  return d1 === Number(digits[9]) && d2 === Number(digits[10]);
}

export const UF = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR",
  "PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"
] as const;

export const brokerApplicationSchema = z.object({
  fullName: z.string().min(3, "Informe o nome completo.").max(120),
  email: z.string().email("E-mail inválido.").max(160),
  phone: z
    .string()
    .transform((v) => v.replace(/\D/g, ""))
    .refine((v) => v.length >= 10 && v.length <= 13, "Telefone inválido."),
  cpf: z
    .string()
    .transform((v) => v.replace(/\D/g, ""))
    .refine(isValidCpf, "CPF inválido."),
  rg: z.string().min(5, "RG inválido.").max(20),
  creci: z.string().min(3, "CRECI inválido.").max(20),
  creciState: z.enum(UF, { errorMap: () => ({ message: "UF inválida." }) }),
  city: z.string().min(2).max(80),
  currentAgency: z.string().max(120).optional().or(z.literal("")),
  yearsMarket: z.coerce.number().int().min(0).max(80).optional(),
  instagram: z.string().max(60).optional().or(z.literal("")),
  credentialFileUrl: z.string().url("Envie o comprovante do CRECI."),
  notes: z.string().max(1000).optional().or(z.literal(""))
});

export type BrokerApplicationInput = z.infer<typeof brokerApplicationSchema>;
