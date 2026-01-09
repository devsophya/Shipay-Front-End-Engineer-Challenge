import { render, screen } from '@testing-library/react';
import ProductItem from '../ProductItem';

describe('ProductItem Component', () => {
  test('renders product name', () => {
    const product = { id: 1, name: 'Cash In - COB' };
    render(<ProductItem product={product} />);
    
    expect(screen.getByText('Cash In - COB')).toBeInTheDocument();
  });

  test('renders Cash In badge for Cash In products', () => {
    const product = { id: 1, name: 'Cash In - COB' };
    render(<ProductItem product={product} />);
    
    expect(screen.getByText('Entrada')).toBeInTheDocument();
  });

  test('renders Cash Out badge for Cash Out products', () => {
    const product = { id: 5, name: 'Cash Out - PAYMENT' };
    render(<ProductItem product={product} />);
    
    expect(screen.getByText('Saída')).toBeInTheDocument();
  });

  test('applies correct CSS class for Cash In products', () => {
    const product = { id: 1, name: 'Cash In - COB' };
    const { container } = render(<ProductItem product={product} />);
    
    const listItem = container.querySelector('.product-item--cash-in');
    expect(listItem).toBeInTheDocument();
  });

  test('applies correct CSS class for Cash Out products', () => {
    const product = { id: 5, name: 'Cash Out - PAYMENT' };
    const { container } = render(<ProductItem product={product} />);
    
    const listItem = container.querySelector('.product-item--cash-out');
    expect(listItem).toBeInTheDocument();
  });

  test('renders as list item', () => {
    const product = { id: 1, name: 'Cash In - COB' };
    render(<ProductItem product={product} />);
    
    const listItem = screen.getByRole('listitem');
    expect(listItem).toBeInTheDocument();
  });
});
