import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { ListTree } from '@/types/hierarchy';

import { WorkTaskFilters } from './WorkTaskFilters';

const canonicalList = {
  id: 'list-1',
  name: 'Comercial',
} as ListTree;

describe('WorkTaskFilters', () => {
  it('exibe uma lista apenas uma vez quando a compatibilidade fornece entradas repetidas', () => {
    render(
      <WorkTaskFilters
        value={{}}
        onChange={vi.fn()}
        lists={[canonicalList, canonicalList]}
      />,
    );

    fireEvent.click(screen.getByLabelText('Lista'));

    expect(screen.getAllByRole('option', { name: 'Comercial' })).toHaveLength(1);
  });
});
