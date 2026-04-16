import { useState, ChangeEvent } from 'react';
import { formatCurrencyClean, parseCurrency } from '@/utils/currency';

export function useCurrencyInput(initialValue = 0) {
  const [displayValue, setDisplayValue] = useState(formatCurrencyClean(initialValue));
  const [rawValue, setRawValue] = useState(initialValue);

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    const parsed = parseCurrency(value);
    setRawValue(parsed);
    setDisplayValue(formatCurrencyClean(parsed));
  }

  function setValue(value: number) {
    setRawValue(value);
    setDisplayValue(formatCurrencyClean(value));
  }

  return {
    displayValue,
    rawValue,
    handleChange,
    setValue,
  };
}
