// простой «ивент-бас» для открытия модалки из любого места
export const AUTH_MODAL_EVENT = 'open-auth-modal';

export function openAuthModal() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(AUTH_MODAL_EVENT));
  }
}
