export const parseNumberArray = (answer: unknown): number[] | undefined => {
  if (Array.isArray(answer) && answer.every((item) => typeof item === 'number')) {
    return answer;
  }

  if (typeof answer !== 'string') {
    return undefined;
  }

  const trimmed = answer.trim();
  if (trimmed === '') {
    return undefined;
  }

  try {
    const parsed = JSON.parse(trimmed);

    if (Array.isArray(parsed) && parsed.every((item) => typeof item === 'number')) {
      return parsed;
    }
  } catch {
    // Fallback
  }

  const values = trimmed.split(',').map((item) => Number(item.trim()));
  return values.every((item) => !Number.isNaN(item)) ? values : undefined;
};

export const isEqualNumberArray = (left: number[], right: number[]) =>
  left.length === right.length && left.every((value, index) => value === right[index]);
