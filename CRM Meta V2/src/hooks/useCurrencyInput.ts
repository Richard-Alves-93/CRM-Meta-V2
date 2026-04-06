import { useState, ChangeEvent } from 'react';
import { formatCurrency, parseCurrency } from '@/utils/currency';

export function useCurrencyInput(initialValue = 0) {
  const [displayValue, setDisplayValue] = useState(formatCurrency(initialValue));
  const [rawValue, setRawValue] = useState(initialValue);

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const parsed = parseCurrency(e.target.value);
    setRawValue(parsed);
    setDisplayValue(formatCurrency(parsed));
  }

  function setValue(value: number) {
    setRawValue(value);
    setDisplayValue(formatCurrency(value));
  }

  return {
    displayValue,
    rawValue,
    handleChange,
    setValue,
  };
}
