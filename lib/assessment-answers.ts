/** Newline-separated text keeps the existing assessment columns and AI context compatible. */
export function readAssessmentAnswer(value: string | null | undefined, options: readonly string[]) {
  const lines = (value ?? '').split('\n');
  return {
    selected: [
      ...new Set(lines.map((line) => line.trim()).filter((line) => options.includes(line))),
    ],
    // Preserve unfinished typing, including a trailing space in a custom response.
    custom: lines.filter((line) => !options.includes(line.trim())).join('\n'),
  };
}

export function writeAssessmentAnswer(selected: readonly string[], custom = ''): string {
  const choices = [...new Set(selected.map((s) => s.trim()).filter(Boolean))];
  return [...choices, ...(custom.length ? [custom] : [])].join('\n');
}

export function toggleAssessmentAnswer(
  value: string | null | undefined,
  option: string,
  options: readonly string[],
) {
  const answer = readAssessmentAnswer(value, options);
  return writeAssessmentAnswer(
    answer.selected.includes(option)
      ? answer.selected.filter((item) => item !== option)
      : [...answer.selected, option],
    answer.custom,
  );
}
