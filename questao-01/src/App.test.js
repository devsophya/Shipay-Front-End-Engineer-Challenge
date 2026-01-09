import { render, screen } from '@testing-library/react';
import App from './App';

describe('App Component', () => {
  test('renders header with title', () => {
    render(<App />);
    const titleElement = screen.getByText(/Produtos Transacionais Shipay/i);
    expect(titleElement).toBeInTheDocument();
  });

  test('renders search input', () => {
    render(<App />);
    const searchInput = screen.getByRole('textbox', { name: /campo de busca de produtos/i });
    expect(searchInput).toBeInTheDocument();
  });

  test('renders all products initially', () => {
    render(<App />);
    
    expect(screen.getByText('Cash In - COB')).toBeInTheDocument();
    expect(screen.getByText('Cash In - COBV')).toBeInTheDocument();
    expect(screen.getByText('Cash In - DUEDATE')).toBeInTheDocument();
    expect(screen.getByText('Cash In - CHARGE')).toBeInTheDocument();
    expect(screen.getByText('Cash Out - PAYMENT')).toBeInTheDocument();
  });

  test('displays correct product count', () => {
    render(<App />);
    const footer = screen.getByText(/Total de produtos: 5 de 5/i);
    expect(footer).toBeInTheDocument();
  });
});
