
import React from 'react';
import ShoppingList from './ShoppingList';
import { useIngredients } from '@/hooks/useIngredients';

const ShoppingListWrapper: React.FC = () => {
  const { prices, updatePrice } = useIngredients();

  const handlePriceUpdate = async (ingredient: string, price: number) => {
    console.log('ShoppingListWrapper - updating price:', ingredient, price);
    await updatePrice(ingredient, price);
  };

  return (
    <ShoppingList 
      prices={prices} 
      onPriceUpdate={handlePriceUpdate}
    />
  );
};

export default ShoppingListWrapper;
