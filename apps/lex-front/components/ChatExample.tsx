"use client";
import { useMemo, useState } from "react";

export default function ChatExample() {
  const samples = useMemo(
    () => [
      {
        q: "Поставщик сорвал срок, как вернуть аванс?",
        a: "Коротко: заявите расторжение по ст. 450, 452 ГК РФ и потребуйте возврат аванса и неустойку. Шаги и ссылки ниже.",
      },
      {
        q: "Что делать, если арендодатель повышает аренду без допсоглашения?",
        a: "Проверьте условия договора, ст. 310, 614 ГК РФ. Направьте возражения, требуйте соблюдения порядка изменения цены.",
      },
      {
        q: "Как оформить договор займа между физлицами?",
        a: "Письменная форма, сумма, срок, проценты/беспроцентность. Расписка о получении. Ст. 807–810 ГК РФ.",
      },
    ],
    []
  );

  const [idx, setIdx] = useState(0);
  const prev = () => setIdx((i) => (i - 1 + samples.length) % samples.length);
  const next = () => setIdx((i) => (i + 1) % samples.length);
  const cur = samples[idx];

  return (
    <div className="bg-white border rounded-xl shadow p-4">
      <div className="flex items-center justify-between border-b pb-2 mb-4">
        <div className="font-medium text-gray-700">Чат-пример</div>
        <div className="flex items-center gap-2 text-xs">
          <button onClick={prev} className="px-2 py-1 border rounded hover:bg-gray-50">
            ←
          </button>
          <span className="text-gray-500">
            {idx + 1}/{samples.length}
          </span>
          <button onClick={next} className="px-2 py-1 border rounded hover:bg-gray-50">
            →
          </button>
        </div>
      </div>

      <div className="mb-4">
        <div className="mb-2 font-semibold">Вопрос</div>
        <div className="p-3 border rounded-lg bg-gray-50 text-sm text-left">{cur.q}</div>
      </div>
      <div className="mb-4">
        <div className="mb-2 font-semibold">Ответ</div>
        <div className="p-3 border rounded-lg bg-gray-50 text-sm text-left">{cur.a}</div>
      </div>

      {/* Статичный демо: ввод/кнопка отключены */}
      <div className="flex items-center gap-2 border-t pt-3 opacity-50 cursor-not-allowed">
        <input
          disabled
          type="text"
          placeholder="Введите вопрос..."
          className="flex-1 border rounded-md px-3 py-2 text-sm bg-gray-100"
        />
        <button disabled className="px-4 py-2 bg-gray-900 text-white rounded-md text-sm">
          Открыть чат
        </button>
      </div>
    </div>
  );
}
