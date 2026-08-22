import { useState, useMemo, useEffect } from 'react';
import { Search, Check, Plus, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  PREDEFINED_PROFESSIONS,
  OTHER_PROFESSION_VALUE,
  filterProfessions,
  validateCustomProfession,
} from '@/lib/professions';

interface ProfessionSelectorProps {
  value: string;
  onChange: (profession: string, isCustom: boolean) => void;
  customValue?: string;
  onCustomChange?: (customValue: string) => void;
  error?: string;
  className?: string;
}

export const ProfessionSelector = ({
  value,
  onChange,
  customValue = '',
  onCustomChange,
  error,
  className = '',
}: ProfessionSelectorProps) => {
  const isCurrentlyOther = value === OTHER_PROFESSION_VALUE || (Boolean(value) && !PREDEFINED_PROFESSIONS.includes(value as typeof PREDEFINED_PROFESSIONS[number]));
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isOtherSelected, setIsOtherSelected] = useState<boolean>(isCurrentlyOther);
  const [customInput, setCustomInput] = useState<string>(customValue || (isCurrentlyOther && value !== OTHER_PROFESSION_VALUE ? value : ''));
  const [customError, setCustomError] = useState<string | null>(null);

  useEffect(() => {
    if (value && !PREDEFINED_PROFESSIONS.includes(value as typeof PREDEFINED_PROFESSIONS[number]) && value !== OTHER_PROFESSION_VALUE) {
      setIsOtherSelected(true);
      setCustomInput(value);
    }
  }, [value]);

  const filteredList = useMemo(() => {
    return filterProfessions(searchQuery);
  }, [searchQuery]);

  const handleSelectPredefined = (profession: string) => {
    setIsOtherSelected(false);
    setCustomError(null);
    onChange(profession, false);
  };

  const handleSelectOther = () => {
    setIsOtherSelected(true);
    const validation = validateCustomProfession(customInput);
    if (validation.isValid && validation.sanitizedValue) {
      onChange(validation.sanitizedValue, true);
    } else {
      onChange(OTHER_PROFESSION_VALUE, true);
    }
  };

  const handleCustomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    setCustomInput(newVal);
    if (onCustomChange) {
      onCustomChange(newVal);
    }

    if (newVal.trim().length === 0) {
      setCustomError('Please enter your profession');
      onChange(OTHER_PROFESSION_VALUE, true);
      return;
    }

    const validation = validateCustomProfession(newVal);
    if (!validation.isValid) {
      setCustomError(validation.error || 'Invalid profession');
      onChange(OTHER_PROFESSION_VALUE, true);
    } else {
      setCustomError(null);
      onChange(validation.sanitizedValue || newVal.trim(), true);
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <Label className="font-semibold text-sm">Professional Title / Profession *</Label>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search your profession..."
          className="pl-9 bg-background"
          aria-label="Search your profession..."
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
          >
            Clear
          </button>
        )}
      </div>

      {/* Profession List Box */}
      <div className="border rounded-xl p-2 max-h-56 overflow-y-auto space-y-1 bg-background/50 divide-y divide-border/40">
        {filteredList.length > 0 ? (
          <div className="space-y-1">
            {filteredList.map((profession) => {
              const isSelected = !isOtherSelected && value === profession;
              return (
                <button
                  key={profession}
                  type="button"
                  onClick={() => handleSelectPredefined(profession)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all text-left ${
                    isSelected
                      ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                      : 'hover:bg-muted text-foreground'
                  }`}
                >
                  <span>{profession}</span>
                  {isSelected && <Check className="h-4 w-4 shrink-0 ml-2" />}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="p-4 text-center space-y-2">
            <p className="text-xs text-muted-foreground">No matching professions found.</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSelectOther}
              className="text-xs"
            >
              <Plus className="h-3 w-3 mr-1" /> Use custom profession (+ Other)
            </Button>
          </div>
        )}

        {/* "+ Other" Option */}
        <div className="pt-1 mt-1">
          <button
            type="button"
            onClick={handleSelectOther}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-semibold transition-all text-left ${
              isOtherSelected
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'hover:bg-muted text-primary'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Plus className="h-4 w-4" /> {OTHER_PROFESSION_VALUE}
            </span>
            {isOtherSelected && <Check className="h-4 w-4 shrink-0 ml-2" />}
          </button>
        </div>
      </div>

      {/* Custom Profession Entry Box */}
      {isOtherSelected && (
        <div className="p-4 bg-muted/40 border border-primary/20 rounded-xl space-y-2 mt-3 animate-in fade-in-50">
          <Label htmlFor="custom-profession-input" className="text-xs font-semibold text-foreground">
            Enter your profession *
          </Label>
          <Input
            id="custom-profession-input"
            type="text"
            value={customInput}
            onChange={handleCustomInputChange}
            placeholder="e.g. Quantum Computing Specialist, Vedic Astrologer..."
            className={`bg-background ${customError ? 'border-destructive focus-visible:ring-destructive' : ''}`}
            maxLength={80}
            autoFocus
          />
          {customError && (
            <p className="text-xs text-destructive flex items-center gap-1 mt-1">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              {customError}
            </p>
          )}
          <p className="text-[11px] text-muted-foreground">
            Custom professions are reviewed by administrators during verification.
          </p>
        </div>
      )}

      {error && !isOtherSelected && (
        <p className="text-xs text-destructive flex items-center gap-1 mt-1">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
};

export default ProfessionSelector;
