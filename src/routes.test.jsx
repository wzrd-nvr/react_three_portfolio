import { render, screen } from '@testing-library/react';
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
