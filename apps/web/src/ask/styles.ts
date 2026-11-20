import { cn } from '#/lib/utils';

const buttonBase =
  'inline-flex h-[34px] items-center justify-center gap-2 whitespace-nowrap rounded-[10px] px-3 text-[13px] font-semibold transition-[filter,border-color] disabled:cursor-not-allowed disabled:opacity-50';

export const askButton = {
  primary: cn(buttonBase, 'bg-accent text-on-accent hover:brightness-105'),
  ghost: cn(buttonBase, 'border border-line bg-surface text-fg hover:border-line-strong'),
  chip: 'rounded-full border border-line bg-surface px-3.5 py-2 text-sm text-fg transition-colors hover:border-line-strong hover:bg-surface-2',
  icon: 'grid size-[34px] shrink-0 place-items-center rounded-[10px] border border-line bg-surface text-fg hover:border-line-strong',
};
