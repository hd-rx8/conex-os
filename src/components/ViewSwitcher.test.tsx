import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import ViewSwitcher from './ViewSwitcher';

describe('ViewSwitcher', () => {
  it('exposes Kanban, Lista and Tabela as accessible selected controls', () => {
    const onChange = vi.fn();

    render(
      <ViewSwitcher currentView="kanban" onViewChange={onChange} />,
    );

    expect(screen.getByRole('button', { name: 'Kanban' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Lista' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );

    fireEvent.click(screen.getByRole('button', { name: 'Tabela' }));
    expect(onChange).toHaveBeenCalledWith('table');
  });
});
