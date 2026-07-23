import { useCallback } from 'react';
import { useBeforeUnload, useBlocker } from 'react-router-dom';

export const useUnsavedProposalGuard = (enabled: boolean) => {
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      enabled && currentLocation.pathname !== nextLocation.pathname,
  );

  useBeforeUnload(
    useCallback((event) => {
      if (!enabled) return;

      event.preventDefault();
      event.returnValue = '';
    }, [enabled]),
    { capture: true },
  );

  const confirmDiscard = useCallback(() => {
    if (blocker.state === 'blocked') blocker.proceed();
  }, [blocker]);

  const continueEditing = useCallback(() => {
    if (blocker.state === 'blocked') blocker.reset();
  }, [blocker]);

  return {
    blocker,
    confirmDiscard,
    continueEditing,
  };
};
