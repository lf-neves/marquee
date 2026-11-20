import { Slot } from 'radix-ui';
import { type VariantProps, cva } from 'class-variance-authority';
import { type ComponentProps } from 'react';
import { cn } from '#/lib/utils';

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[10px] border border-transparent font-semibold transition-[filter,background-color,border-color] disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary: 'bg-accent text-on-accent hover:brightness-105',
        screen: 'border-screen-line bg-white/8 text-screen-fg backdrop-blur-sm hover:bg-white/14',
        ghost: 'border-line bg-surface text-fg hover:border-line-strong',
        link: 'h-auto rounded-none px-0 text-screen-fg underline decoration-screen-line underline-offset-4 hover:decoration-current',
      },
      size: {
        default: 'h-[42px] px-[18px] text-sm',
        sm: 'h-[34px] px-3 text-[13px]',
        icon: 'size-10',
      },
    },
    defaultVariants: { variant: 'primary', size: 'default' },
  },
);

export type ButtonProps = ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean };

export function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Component = asChild ? Slot.Root : 'button';
  return <Component className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
