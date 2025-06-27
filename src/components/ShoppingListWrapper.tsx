
import React from 'react';
import ShoppingList from './ShoppingList';
import { useIngredients } from '@/hooks/useIngredients';

const ShoppingListWrapper: React.FC = () => {
  const { prices, updatePrice } = useIngredients();

  return (
    <ShoppingList 
      prices={prices} 
      onPriceUpdate={updatePrice}
    />
  );
};

export default ShoppingListWrapper;
