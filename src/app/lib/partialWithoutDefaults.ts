import { z } from "zod";

type StripDefault<T> =
  T extends z.ZodDefault<infer Inner>
    ? StripDefault<Inner>
    : T extends z.ZodPrefault<infer Inner>
      ? StripDefault<Inner>
      : T;

type PartialShapeWithoutDefaults<Shape extends z.core.$ZodShape> = {
  [K in keyof Shape]: z.ZodOptional<StripDefault<Shape[K]>>;
};

function withoutDefault(field: z.ZodType): z.ZodType {
  if (field instanceof z.ZodDefault || field instanceof z.ZodPrefault) {
    return withoutDefault(field.unwrap() as z.ZodType);
  }
  return field;
}

/**
 * Partial object schema that leaves omitted keys out.
 * Zod 4 still applies `.default()` inside `.partial()`, which would write those defaults on PATCH.
 */
export function partialWithoutDefaults<Shape extends z.core.$ZodShape>(
  schema: z.ZodObject<Shape>
): z.ZodObject<PartialShapeWithoutDefaults<Shape>> {
  const shape: Record<string, z.ZodType> = {};
  const source = schema.shape as unknown as Record<string, z.ZodType>;
  for (const key of Object.keys(source)) {
    shape[key] = withoutDefault(source[key]);
  }
  return z.object(shape).partial() as unknown as z.ZodObject<
    PartialShapeWithoutDefaults<Shape>
  >;
}
