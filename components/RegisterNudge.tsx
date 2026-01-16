"use client";

type Props = {
  open: boolean;
  onClose: () => void;
  onRegister: () => void;
};

export default function RegisterNudge({ open, onClose, onRegister }: Props) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/40"
      role="dialog"
      aria-modal
    >
      <div className="bg-white rounded-2xl p-6 max-w-md w-[90%] shadow-lg">
        <h3 className="text-lg font-semibold mb-2">Сохраните историю чатов</h3>
        <p className="text-sm text-gray-600 mb-4">
          Зарегистрируйтесь, чтобы не потерять историю чатов. Lexar.Chat не
          отправляет рекламу или рассылки.
        </p>
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border">
            Позже
          </button>
          <button
            onClick={onRegister}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white"
          >
            Зарегистрироваться
          </button>
        </div>
      </div>
    </div>
  );
}
