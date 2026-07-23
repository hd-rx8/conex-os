import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import {
  createMemoryRouter,
  Link,
  RouterProvider,
} from 'react-router-dom';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { useUnsavedProposalGuard } from './useUnsavedProposalGuard';

const NativeRequest = globalThis.Request;

class JsdomCompatibleRequest extends NativeRequest {
  constructor(input: RequestInfo | URL, init?: RequestInit) {
    super(input, init ? { ...init, signal: undefined } : init);
  }
}

beforeAll(() => {
  globalThis.Request = JsdomCompatibleRequest;
});

afterAll(() => {
  globalThis.Request = NativeRequest;
});

const GuardHarness = ({
  initiallyDirty = false,
  initiallySaving = false,
}: {
  initiallyDirty?: boolean;
  initiallySaving?: boolean;
}) => {
  const [isDirty, setIsDirty] = useState(initiallyDirty);
  const [isSaving, setIsSaving] = useState(initiallySaving);
  const { blocker, confirmDiscard, continueEditing } = useUnsavedProposalGuard(
    isDirty && !isSaving,
  );

  return (
    <main>
      <output data-testid="blocker-state">{blocker.state}</output>
      <Link to="/target">Ir para destino</Link>
      <button type="button" onClick={() => setIsDirty(false)}>Limpar</button>
      <button type="button" onClick={() => setIsSaving(false)}>Finalizar salvamento</button>
      {blocker.state === 'blocked' && (
        <>
          <button type="button" onClick={continueEditing}>Continuar editando</button>
          <button type="button" onClick={confirmDiscard}>Descartar alterações</button>
        </>
      )}
    </main>
  );
};

const renderGuard = (options?: {
  initiallyDirty?: boolean;
  initiallySaving?: boolean;
}) => {
  const router = createMemoryRouter([
    {
      path: '/editor',
      element: <GuardHarness {...options} />,
    },
    {
      path: '/target',
      element: <h1>Destino</h1>,
    },
  ], {
    initialEntries: ['/editor'],
  });

  render(<RouterProvider router={router} />);

  return router;
};

describe('useUnsavedProposalGuard', () => {
  it('allows navigation when the editor is clean', async () => {
    renderGuard();

    fireEvent.click(screen.getByRole('link', { name: 'Ir para destino' }));

    expect(await screen.findByRole('heading', { name: 'Destino' })).toBeInTheDocument();
  });

  it('blocks navigation while the editor has unsaved changes', async () => {
    const router = renderGuard({ initiallyDirty: true });

    fireEvent.click(screen.getByRole('link', { name: 'Ir para destino' }));

    await waitFor(() => expect(screen.getByTestId('blocker-state')).toHaveTextContent('blocked'));
    expect(router.state.location.pathname).toBe('/editor');
  });

  it('cancels the pending navigation and keeps the draft protected', async () => {
    const router = renderGuard({ initiallyDirty: true });

    fireEvent.click(screen.getByRole('link', { name: 'Ir para destino' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Continuar editando' }));

    await waitFor(() => expect(screen.getByTestId('blocker-state')).toHaveTextContent('unblocked'));
    expect(router.state.location.pathname).toBe('/editor');
  });

  it('continues exactly the pending navigation after discard confirmation', async () => {
    const router = renderGuard({ initiallyDirty: true });

    fireEvent.click(screen.getByRole('link', { name: 'Ir para destino' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Descartar alterações' }));

    await screen.findByRole('heading', { name: 'Destino' });
    expect(router.state.location.pathname).toBe('/target');
  });

  it('blocks browser back navigation until the user confirms discard', async () => {
    const router = createMemoryRouter([
      {
        path: '/previous',
        element: <h1>Página anterior</h1>,
      },
      {
        path: '/editor',
        element: <GuardHarness initiallyDirty />,
      },
    ], {
      initialEntries: ['/previous', '/editor'],
      initialIndex: 1,
    });
    render(<RouterProvider router={router} />);

    void router.navigate(-1);

    await screen.findByRole('button', { name: 'Descartar alterações' });
    expect(router.state.location.pathname).toBe('/editor');

    fireEvent.click(screen.getByRole('button', { name: 'Descartar alterações' }));

    expect(await screen.findByRole('heading', { name: 'Página anterior' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/previous');
  });

  it('prevents native unload only while dirty and not saving', () => {
    const { unmount } = render(<RouterProvider router={createMemoryRouter([
      {
        path: '/',
        element: <GuardHarness initiallyDirty />,
      },
    ])} />);
    const dirtyEvent = new Event('beforeunload', { cancelable: true });

    window.dispatchEvent(dirtyEvent);

    expect(dirtyEvent.defaultPrevented).toBe(true);
    unmount();

    render(<RouterProvider router={createMemoryRouter([
      {
        path: '/',
        element: <GuardHarness initiallyDirty initiallySaving />,
      },
    ])} />);
    const savingEvent = new Event('beforeunload', { cancelable: true });

    window.dispatchEvent(savingEvent);

    expect(savingEvent.defaultPrevented).toBe(false);
  });
});
