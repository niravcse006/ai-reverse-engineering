export function releaseProposalAuthority(input: {
  repository: string;
  packageName: string;
}): { allowed: true } | { allowed: false; reason: string };

export function applyReleasePleasePatch(directory?: string): Promise<void>;

export function releaseProposalSearchDepth(
  run: (command: string, args: string[]) => Promise<string>,
  sourceSha: string,
): Promise<number>;
