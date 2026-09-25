// Minimal JSON Schema (draft-07 subset) validator used for .claude/contracts. Supports exactly the
// keywords the contracts use; an unknown keyword is a hard error so contracts cannot silently weaken.
const SUPPORTED = new Set(["$schema", "$id", "title", "description", "type", "enum", "const", "required", "properties", "additionalProperties", "items", "minItems", "minLength", "maxLength", "pattern", "minimum", "format"]);
const FORMATS = {
  "date-time": (v) => /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/.test(v) && !Number.isNaN(Date.parse(v)),
  uuid: (v) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v),
  email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
};
function typeOf(value) {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  if (Number.isInteger(value)) return "integer";
  return typeof value;
}
function matchesType(value, type) {
  const actual = typeOf(value);
  return (Array.isArray(type) ? type : [type]).some((t) => t === actual || (t === "number" && actual === "integer"));
}
export function validate(schema, value, at = "$") {
  const errors = [];
  for (const key of Object.keys(schema)) if (!SUPPORTED.has(key)) errors.push(`${at}: unsupported schema keyword "${key}"`);
  if (schema.type && !matchesType(value, schema.type)) return [...errors, `${at}: expected ${schema.type}, got ${typeOf(value)}`];
  if (schema.enum && !schema.enum.some((option) => option === value)) errors.push(`${at}: ${JSON.stringify(value)} not in enum`);
  if ("const" in schema && schema.const !== value) errors.push(`${at}: must equal ${JSON.stringify(schema.const)}`);
  if (typeof value === "string") {
    if (schema.minLength !== undefined && value.length < schema.minLength) errors.push(`${at}: shorter than ${schema.minLength}`);
    if (schema.maxLength !== undefined && value.length > schema.maxLength) errors.push(`${at}: longer than ${schema.maxLength}`);
    if (schema.pattern && !new RegExp(schema.pattern).test(value)) errors.push(`${at}: does not match ${schema.pattern}`);
    if (schema.format && FORMATS[schema.format] && !FORMATS[schema.format](value)) errors.push(`${at}: invalid ${schema.format}`);
  }
  if (typeof value === "number" && schema.minimum !== undefined && value < schema.minimum) errors.push(`${at}: below ${schema.minimum}`);
  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) errors.push(`${at}: fewer than ${schema.minItems} items`);
    if (schema.items) value.forEach((item, index) => errors.push(...validate(schema.items, item, `${at}[${index}]`)));
  }
  if (typeOf(value) === "object") {
    for (const key of schema.required || []) if (!(key in value)) errors.push(`${at}: missing required "${key}"`);
    for (const [key, child] of Object.entries(value)) {
      if (schema.properties && key in schema.properties) errors.push(...validate(schema.properties[key], child, `${at}.${key}`));
      else if (schema.additionalProperties === false) errors.push(`${at}: unexpected property "${key}"`);
      else if (schema.additionalProperties && typeof schema.additionalProperties === "object") errors.push(...validate(schema.additionalProperties, child, `${at}.${key}`));
    }
  }
  return errors;
}
