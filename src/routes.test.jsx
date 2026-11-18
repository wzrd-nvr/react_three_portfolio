import { fireEvent, render, screen } from '@testing-library/react';
import App from './App';

const renderAt = (path) => {
  window.history.pushState({}, '', path);
  return render(<App />);
};

test.each([
  ['/about', 'About Me'],
  ['/projects', 'My Projects'],
  ['/resume', 'My Resume'],
  ['/contact', 'Contact Me'],
])('%s renders its section heading', (path, heading) => {
  renderAt(path);
  expect(screen.getByRole('heading', { level: 2, name: heading })).toBeInTheDocument();
});

test('inner pages render the menu with links to every section', () => {
  renderAt('/about');
  for (const name of ['Home', 'About', 'Projects', 'Goals', 'Resume', 'Contact']) {
    expect(screen.getByRole('link', { name })).toBeInTheDocument();
  }
});

test('inner-page menu toggle is named, reports its state, and keeps closed links out of reach', () => {
  renderAt('/about');
  const toggle = screen.getByRole('button', { name: 'Toggle navigation' });
  const menu = document.getElementById(toggle.getAttribute('aria-controls'));

  expect(toggle).toHaveAttribute('aria-expanded', 'false');
  expect(menu).toHaveAttribute('inert');

  fireEvent.click(toggle);

  expect(toggle).toHaveAttribute('aria-expanded', 'true');
  expect(menu).not.toHaveAttribute('inert');
});
