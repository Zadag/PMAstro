export type Version = "jp" | "us" | "pal" | "ique";

const structure = {
  timestamp: parseInt,
  commit: (s: string) => s,
  totalFuncs: parseInt,
  nonMatchingFuncs: parseInt,
  matchingFuncs: parseInt,
  totalBytes: (b: string) => parseInt(b),
  nonMatchingBytes: (b: string) => parseInt(b),
  matchingBytes: (b: string) => parseInt(b),
};

type ParsedRow = {
  [Key in keyof typeof structure]: ReturnType<typeof structure[Key]>
};

export type Progress = ParsedRow & { percentBytes: number };

export async function fetchProgress(version: Version): Promise<Progress[]> {
  const csv = await fetch(
    `https://papermar.io/reports/progress_${version}.csv`
  ).then((response) => response.text());

  const rows = csv
    .split("\n")
    .filter((row) => row.length)
    .map((row) => {
      const [version, ...data] = row.split(",");
		if (version !== "1") {
			throw new Error(`invalid CSV row: ${row}`);
		}
      return Object.entries(structure).reduce(
        (acc, [key, transform]) => ({
          ...acc,
          [key]: transform(data.shift()!),
        }),
        {} as ParsedRow
      );
    });

  const latest = rows[rows.length - 1];

  const totalBytes = latest.totalBytes;

  return rows.map((row) => ({
    ...row,
    percentBytes: (row.matchingBytes / totalBytes) * 100,
  }));
}
