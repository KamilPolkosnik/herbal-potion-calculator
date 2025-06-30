
// Utility for converting between different units
export const convertToBaseUnit = (amount: number, unit: string): number => {
  const normalizedUnit = unit.toLowerCase().trim().replace('.', '');
  
  switch (normalizedUnit) {
    case 'krople':
    case 'kropli':
      // 1 ml = 20 kropli, więc krople / 20 = ml
      return amount / 20;
    case 'ml':
    case 'milliliters':
      return amount;
    case 'g':
    case 'gram':
    case 'gramy':
      return amount;
    case 'szt':
    case 'sztuki':
    case 'pieces':
      return amount;
    default:
      console.warn(`Unknown unit: ${unit}, treating as base unit`);
      return amount;
  }
};

export const getBaseUnit = (unit: string): string => {
  const normalizedUnit = unit.toLowerCase().trim().replace('.', '');
  
  switch (normalizedUnit) {
    case 'krople':
    case 'kropli':
      return 'ml';
    case 'ml':
    case 'milliliters':
      return 'ml';
    case 'g':
    case 'gram':
    case 'gramy':
      return 'g';
    case 'szt':
    case 'sztuki':
    case 'pieces':
      return 'szt';
    default:
      return unit;
  }
};

export const areUnitsCompatible = (unit1: string, unit2: string): boolean => {
  return getBaseUnit(unit1) === getBaseUnit(unit2);
};

export const formatUnitDisplay = (amount: number, unit: string): string => {
  const normalizedUnit = unit.toLowerCase().trim().replace('.', '');
  
  // Jeśli jednostka bazowa to ml, ale oryginalna to krople, pokaż w kroplach
  if (normalizedUnit === 'ml' && amount < 1) {
    const drops = Math.round(amount * 20);
    return `${drops} kropli`;
  }
  
  return `${amount}${unit}`;
};
