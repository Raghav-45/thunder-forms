export interface ChoiceOption {
  id: string
  label: string
  value: string
  disabled?: boolean
}

type UnknownRecord = Record<string, unknown>

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null

export function createChoiceOptionId(): string {
  return `option_${crypto.randomUUID()}`
}

export function hasValidChoiceOptionValues(
  options: readonly Pick<ChoiceOption, 'value'>[],
): boolean {
  return options.every(
    (option) => !isChoiceOptionValueInvalid(option.value, options),
  )
}

export function isChoiceOptionValueInvalid(
  value: string,
  options: readonly Pick<ChoiceOption, 'value'>[],
): boolean {
  return (
    !value.trim() ||
    options.filter((option) => option.value === value).length > 1
  )
}

export function hasValidChoiceOptions(value: unknown): value is ChoiceOption[] {
  if (!Array.isArray(value)) return false

  const ids = new Set<string>()
  const options: Pick<ChoiceOption, 'value'>[] = []

  for (const option of value) {
    if (
      !isRecord(option) ||
      typeof option.id !== 'string' ||
      !option.id.trim() ||
      ids.has(option.id) ||
      typeof option.label !== 'string' ||
      typeof option.value !== 'string'
    ) {
      return false
    }

    ids.add(option.id)
    options.push({ value: option.value })
  }

  return hasValidChoiceOptionValues(options)
}

function uniqueValue(value: string, values: Set<string>): string {
  let uniqueValue = value
  let suffix = 2

  while (values.has(uniqueValue)) {
    uniqueValue = `${value}_${suffix}`
    suffix += 1
  }

  values.add(uniqueValue)
  return uniqueValue
}

export function normalizeChoiceOptions(value: unknown): ChoiceOption[] {
  if (!Array.isArray(value)) return []

  const ids = new Set<string>()
  const values = new Set<string>()
  const options: ChoiceOption[] = []

  for (const option of value) {
    if (!isRecord(option)) continue

    const label =
      typeof option.label === 'string' ? option.label : `Option ${options.length + 1}`
    const valueCandidate =
      typeof option.value === 'string' && option.value.trim()
        ? option.value
        : `option_${options.length + 1}`
    let id =
      typeof option.id === 'string' && option.id.trim()
        ? option.id
        : createChoiceOptionId()

    while (ids.has(id)) {
      id = createChoiceOptionId()
    }

    ids.add(id)
    options.push({
      id,
      label,
      value: uniqueValue(valueCandidate, values),
      ...(option.disabled === true ? { disabled: true } : {}),
    })
  }

  return options
}
