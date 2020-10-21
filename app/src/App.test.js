import React from 'react';
import { render } from '@testing-library/react';
import App from './App';

test('renders hello world text', () => {
  const { getByText } = render(<App />);
  const helloElement = getByText(/Hello World/i);
  expect(helloElement).toBeInTheDocument();
});
