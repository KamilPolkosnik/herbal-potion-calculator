import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

export type Category = 'herbs' | 'oils' | 'others';

interface IngredientCardProps {
  name: string;
  unit: string;
  amount: number;
  price: number;
  selectedCategory: Category;
  onCategoryChange: (name: string, category: Category) => void;
  onAmountUpdate: (name: string, amount: number) => void;
  onPriceUpdate: (name: string, price: number) => void;
}

export const IngredientCard: React.FC<IngredientCardProps> = ({
  name,
  unit,
  amount,
  price,
  selectedCategory,
  onCategoryChange,
  onAmountUpdate,
  onPriceUpdate,
}) => (
  <Card className="mb-4">
    <CardContent>
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">{name}</h3>
        <span className="text-sm text-muted-foreground">{unit}</span>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-4">
        <div>
          <Label>Ilść</Label>
          <Input
            type="number"
            value={amount}
            onChange={e => onAmountUpdate(name, Number(e.target.value))}
          />
        </div>
        <div>
          <Label>Cena</Label>
          <Input
            type="number"
            value={price}
            onChange={e => onPriceUpdate(name, Number(e.target.value))}
          />
        </div>
      </div>

      <div className="mt-4">
        <Label>Typ składnika</Label>
        <Select
          value={selectedCategory}
          onValueChange={value => onCategoryChange(name, value as Category)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Wybierz kategorię" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="herbs">Zioło</SelectItem>
            <SelectItem value="oils">Olejek</SelectItem>
            <SelectItem value="others">Inne</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </CardContent>
  </Card>
);
