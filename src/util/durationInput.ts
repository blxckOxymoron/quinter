const suffixMultipliers = {
  s: 1,
  m: 60,
  h: 3600,
} as const;

const suffixes = Object.keys(suffixMultipliers) as (keyof typeof suffixMultipliers)[];

const durationFormatter = /(\d+)\s*([hms])?/g;

export function parseDuration(durationString: string): number {
  const matches = durationString.matchAll(durationFormatter);

  let match = matches.next();
  let duration = 0;

  while (!match.done) {
    const [, value, suffix] = match.value;
    const multiplier = suffix ? suffixMultipliers[suffix] : 1;
    duration += parseInt(value ?? "") * multiplier || 0;
    match = matches.next();
  }

  return duration;
}

const exampleAmounts = [
  "Input a custom duration, e. g. 2m20s",
  "1m 30s",
  "10m",
  "30m",
  "1h",
  "1h 30m",
];

export function getDurationSuggestions(input: string): string[] {
  const formatted = input
    .replaceAll(/\s+/g, " ")
    .replaceAll(/[^\dhms\s]/g, "")
    .trim();

  if (formatted === "") return exampleAmounts;

  const endsWithNumber = !isNaN(parseInt(formatted.slice(-1)));

  const suffixesNotIncluded = suffixes.filter(suffix => !formatted.slice(0, -1).includes(suffix));

  if (suffixesNotIncluded.length === 0) return [formatted];

  if (endsWithNumber) {
    return suffixesNotIncluded.map(suffix => formatted + suffix);
  } else {
    return suffixesNotIncluded.map(suffix => formatted.slice(0, -1) + suffix);
  }
}
