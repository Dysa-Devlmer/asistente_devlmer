export function toJson<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (_key, current) =>
      typeof current === 'bigint' ? current.toString() : current
    )
  ) as T;
}
