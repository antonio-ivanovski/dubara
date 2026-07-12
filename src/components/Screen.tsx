import type { ReactNode } from 'react';

interface ScreenProps {
  children: ReactNode;
  padded?: boolean;
}

export function Screen({ children, padded = true }: ScreenProps) {
  return (
    <main
        className="min-h-[100svh] w-full bg-bg text-text flex justify-center"
    >
      <div
        className={
          'w-full max-w-lg flex flex-col flex-1 ' +
          (padded ? 'px-4 sm:px-6 pt-3 sm:pt-5 safe-bottom' : '')
        }
      >
        {children}
      </div>
    </main>
  );
}
