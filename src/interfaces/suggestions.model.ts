import type { ColorSet, CategorySet } from './distinctAndCount.model';
import { Product } from './product.model';

export interface SuggestionsResponse {
  suggestions: Product[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  categoriesWithCounts: CategorySet[];
  colorsWithCounts: ColorSet[];
}