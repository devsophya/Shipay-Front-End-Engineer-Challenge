import { render, screen } from '@testing-library/react';
import ProductList from '../ProductList';

const mockItems = [
  { id: 1, name: 'Cash In - COB' },
  { id: 2, name: 'Cash In - COBV' },
];

describe('ProductList Component', () => {
  test('renders list of products', () => {
    render(<ProductList items={mockItems} searchTerm="" />);
    
    expect(screen.getByText('Cash In - COB')).toBeInTheDocument();
    expect(screen.getByText('Cash In - COBV')).toBeInTheDocument();
  });

  test('renders all items with proper list structure', () => {
    render(<ProductList items={mockItems} searchTerm="" />);
    
    const list = screen.getByRole('list');
    expect(list).toBeInTheDocument();
    
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(2);
  });

  test('shows empty state when no items', () => {
    render(<ProductList items={[]} searchTerm="" />);
    
    expect(screen.getByText('Nenhum produto encontrado')).toBeInTheDocument();
  });

  test('shows search term in empty state message', () => {
    render(<ProductList items={[]} searchTerm="test" />);
    
    expect(screen.getByText(/Não encontramos produtos que correspondam a "test"/i)).toBeInTheDocument();
  });

  test('does not show search term message when searchTerm is empty', () => {
    render(<ProductList items={[]} searchTerm="" />);
    
    expect(screen.queryByText(/Não encontramos produtos que correspondam/i)).not.toBeInTheDocument();
  });

  test('renders correct number of products', () => {
    const manyItems = [
      { id: 1, name: 'Product 1' },
      { id: 2, name: 'Product 2' },
      { id: 3, name: 'Product 3' },
      { id: 4, name: 'Product 4' },
      { id: 5, name: 'Product 5' },
    ];
    
    render(<ProductList items={manyItems} searchTerm="" />);
    
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(5);
  });
});
