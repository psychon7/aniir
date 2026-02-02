import React from 'react';
import { useLanguage } from '../hooks/useLanguage';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LanguageSwitcherProps {
  /** Show language name instead of just flag */
  showName?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Variant of the trigger button */
  variant?: 'default' | 'ghost' | 'outline';
  /** Size of the trigger button */
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

/**
 * Language switcher dropdown component
 */
export function LanguageSwitcher({ 
  showName = false, 
  className,
  variant = 'ghost',
  size = 'sm'
}: LanguageSwitcherProps) {
  const { currentLanguage, changeLanguage, languages } = useLanguage();
  
  const currentLang = languages.find(l => l.code === currentLanguage);
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant={variant} 
          size={size}
          className={cn('gap-2', className)}
        >
          {showName ? (
            <>
              <span>{currentLang?.flag}</span>
              <span>{currentLang?.name}</span>
            </>
          ) : (
            <>
              <Globe className="h-4 w-4" />
              <span className="sr-only">Change language</span>
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => changeLanguage(language.code)}
            className={cn(
              'gap-2 cursor-pointer',
              language.isActive && 'bg-accent'
            )}
          >
            <span>{language.flag}</span>
            <span>{language.name}</span>
            {language.isActive && (
              <span className="ml-auto text-xs text-muted-foreground">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
