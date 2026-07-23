import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const sidebarStates = vi.hoisted(() => [] as boolean[]);

vi.mock('./NavigationSidebar', () => ({
  default: ({ isCollapsed }: { isCollapsed: boolean }) => {
    sidebarStates.push(isCollapsed);
    return <aside data-testid="navigation-sidebar" />;
  },
}));
vi.mock('./MobileMenuToggle', () => ({ default: () => null }));
vi.mock('./AppSwitcher', () => ({ default: () => null }));
vi.mock('./UserNav', () => ({ default: () => null }));
vi.mock('./GlobalFAB', () => ({ default: () => null }));
vi.mock('./ThemeToggle', () => ({ ThemeToggle: () => null }));
vi.mock('@/hooks/use-mobile', () => ({ useIsMobile: () => false }));
vi.mock('@/hooks/useSession', () => ({
  useSession: () => ({ user: { id: 'user-1' } }),
}));
vi.mock('@/context/AppModuleContext', () => ({
  useAppModule: () => ({
    activeModule: 'crm',
    setActiveModule: vi.fn(),
  }),
}));

import MainLayout from './MainLayout';

describe('MainLayout', () => {
  beforeEach(() => {
    localStorage.clear();
    sidebarStates.length = 0;
  });

  it('starts collapsed on the first render when that preference is persisted', () => {
    localStorage.setItem('sidebar-collapsed', 'true');

    render(
      <MemoryRouter initialEntries={['/clients']}>
        <MainLayout module="crm">Conteúdo</MainLayout>
      </MemoryRouter>,
    );

    expect(sidebarStates[0]).toBe(true);
    expect(sidebarStates).not.toContain(false);
  });
});
