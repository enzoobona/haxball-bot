import { showNotification } from '@mantine/notifications';
import { IconCheck } from '@tabler/icons-react';
import { NavigateFunction } from 'react-router';

import { Translator } from '@components/utils/types';

export function performLogout() {
  localStorage.removeItem('login');
}

export function performLogoutAndRedirect(t: Translator, navigate: NavigateFunction) {
  performLogout();

  showNotification({
    color: 'green',
    title: t('logout_success_title'),
    icon: <IconCheck />,
    message: '',
    autoClose: 10000,
  });
  navigate('/login', { replace: true });
}

export function getLogin() {
  const login = localStorage.getItem('login');
  return login != null ? JSON.parse(login) : {};
}

export function tokenPresent() {
  return localStorage.getItem('login') != null;
}

export type SessionRole = 'ADMIN' | 'USER';

/**
 * Rol de la sesión actual, o null si no inició sesión.
 * Solo decide qué pantallas mostrar: el backend vuelve a validar cada acción.
 */
export function getSessionRole(): SessionRole | null {
  if (!tokenPresent()) {
    return null;
  }

  // Las sesiones guardadas antes de que existieran los roles no traen `role`, y todas las cuentas
  // de entonces eran de organizadores.
  return getLogin().role === 'USER' ? 'USER' : 'ADMIN';
}

export function isAdminSession() {
  return getSessionRole() === 'ADMIN';
}

export function isPlayerSession() {
  return getSessionRole() === 'USER';
}
