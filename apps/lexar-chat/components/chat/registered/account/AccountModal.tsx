"use client";

import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { CreditCard, LogOut, X } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;

  emailOrName?: string | null;
  planLabel?: string | null;

  onBilling?: () => void;
  onLogout?: () => void;
};

export function AccountModal({
  open,
  onClose,
  emailOrName,
  planLabel,
  onBilling,
  onLogout,
}: Props) {
  const [mounted, setMounted] = React.useState(false);
  const [accountData, setAccountData] = React.useState<any>(null);
  const [accountStatus, setAccountStatus] = React.useState<
    "idle" | "loading" | "ready" | "unauthorized" | "error"
  >("idle");

  const [billingOpen, setBillingOpen] = React.useState(false);

  // ✅ один-единственный обработчик
  const handleBilling = React.useCallback(() => {
    if (onBilling) {
      onBilling();
      return;
    }
    setBillingOpen(true);
  }, [onBilling]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Esc закрывает
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  // загрузка профиля при открытии
  useEffect(() => {
    if (!open) return;

    let active = true;
    setAccountStatus("loading");

    (async () => {
      try {
        const res = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include",
        });

        if (!res.ok) {
          if (res.status === 401) {
            if (active) {
              setAccountStatus("unauthorized");
              setAccountData(null);
            }
            return;
          }

          const errorData = await res.json().catch(() => null);
          if (active) {
            setAccountStatus("error");
            setAccountData(errorData);
          }
          return;
        }

        const data = await res.json().catch(() => null);
        const responseUser = data?.user ?? data;

        // диагностический лог (можешь потом убрать)
        console.debug("[auth/me] response fields", {
          hasUser: Boolean(data?.user),
          userKeys:
            responseUser && typeof responseUser === "object"
              ? Object.keys(responseUser)
              : [],
        });

        if (active) {
          setAccountData(data);
          setAccountStatus("ready");
        }
      } catch {
        if (active) {
          setAccountStatus("error");
          setAccountData(null);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [open]);

  if (!open || !mounted) return null;

  const resolvedUser = accountData?.user ?? accountData;

  const resolvedEmailOrName =
    emailOrName ??
    resolvedUser?.email ??
    resolvedUser?.login ??
    resolvedUser?.name ??
    accountData?.email ??
    accountData?.login ??
    accountData?.name ??
    null;

  const resolvedPlan =
    resolvedUser?.plan ??
    accountData?.plan ??
    resolvedUser?.tariff ??
    accountData?.tariff ??
    null;

  const resolvedPlanLabel =
    resolvedUser?.planLabel ??
    accountData?.planLabel ??
    planLabel ??
    (typeof resolvedPlan === "string"
      ? { free: "FREE", vip: "VIP", pro: "PRO" }[resolvedPlan.toLowerCase()]
      : null) ??
    (typeof resolvedPlan === "string" ? resolvedPlan : resolvedPlan?.name) ??
    (typeof resolvedPlan === "string" ? null : resolvedPlan?.title) ??
    null;

  const loginLabel =
    accountStatus === "unauthorized"
      ? "Не авторизован"
      : resolvedEmailOrName || "—";

  const planText =
    accountStatus === "unauthorized" ? "—" : resolvedPlanLabel || "—";

  const isVip =
    accountStatus !== "unauthorized" &&
    ((typeof resolvedPlan === "string" && resolvedPlan.toLowerCase() === "vip") ||
      (typeof resolvedPlanLabel === "string" &&
        resolvedPlanLabel.toLowerCase() === "vip"));

  // ⚠️ в клиентском компоненте это работает только если переменная задана при сборке
  const vipSupportUrl = process.env.NEXT_PUBLIC_VIP_SUPPORT_URL ?? "";
  const vipSupportLabel = vipSupportUrl || "Ссылка поддержки пока не настроена";

  const node = (
    <div className="fixed inset-0 z-[9999]">
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-black/30"
        onMouseDown={onClose}
        aria-hidden="true"
      />

      {/* modal */}
      <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="pointer-events-auto w-full max-w-[520px] rounded-2xl border border-slate-200 bg-white shadow-2xl"
          role="dialog"
          aria-modal="true"
          aria-label="Аккаунт"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div className="text-base font-semibold text-slate-900">Аккаунт</div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-slate-100"
              aria-label="Закрыть"
              title="Закрыть"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="px-5 py-5">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="text-xs text-slate-500">Логин</div>
              <div className="mt-1 text-sm font-medium text-slate-900">
                {loginLabel}
              </div>

              <div className="mt-3 text-xs text-slate-500">Тариф</div>
              <div className="mt-1 text-sm font-medium text-slate-900">
                {planText}
              </div>
            </div>

            <div className="mt-4 grid gap-2">
              {isVip ? (
                <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                  <p>
                    Вы используете сервис бесплатно. Поддержать проект можно по
                    ссылке:
                  </p>

                  {vipSupportUrl ? (
                    <a
                      href={vipSupportUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
                    >
                      <CreditCard className="h-4 w-4" />
                      Поддержать проект
                    </a>
                  ) : (
                    <div className="mt-3 rounded-xl border border-dashed border-slate-200 px-4 py-2 text-sm text-slate-500">
                      {vipSupportLabel}
                    </div>
                  )}

                  <p className="mt-2 text-sm text-slate-600">
                    {vipSupportUrl ? (
                      <>
                        <span>Ссылка: </span>
                        <a
                          href={vipSupportUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium text-slate-900 underline underline-offset-2"
                        >
                          {vipSupportLabel}
                        </a>
                      </>
                    ) : (
                      vipSupportLabel
                    )}
                  </p>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleBilling}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
                >
                  <CreditCard className="h-4 w-4" />
                  Оплата / тариф
                </button>
              )}

              <button
                type="button"
                onClick={onLogout}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
              >
                <LogOut className="h-4 w-4" />
                Выйти
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(
    <>
      {node}
      <BillingModal
        open={billingOpen}
        onClose={() => setBillingOpen(false)}
        planLabel={planText}
        isVip={isVip}
        vipSupportUrl={vipSupportUrl}
        vipSupportLabel={vipSupportLabel}
        isUnauthorized={accountStatus === "unauthorized"}
      />
    </>,
    document.body
  );
}

type BillingModalProps = {
  open: boolean;
  onClose: () => void;
  planLabel: string;
  isVip: boolean;
  vipSupportUrl: string;
  vipSupportLabel: string;
  isUnauthorized: boolean;
};

function BillingModal({
  open,
  onClose,
  planLabel,
  isVip,
  vipSupportUrl,
  vipSupportLabel,
  isUnauthorized,
}: BillingModalProps) {
  const [plansStatus, setPlansStatus] = React.useState<
    "idle" | "loading" | "ready" | "error"
  >("idle");
  const [plansData, setPlansData] = React.useState<any>(null);

  useEffect(() => {
    if (!open) return;

    let active = true;
    setPlansStatus("loading");

    (async () => {
      try {
        const res = await fetch("/api/billing/plans", {
          method: "GET",
          credentials: "include",
        });

        const data = await res.json().catch(() => null);
        if (!res.ok) {
          if (active) {
            setPlansStatus("error");
            setPlansData(data);
          }
          return;
        }

        if (active) {
          setPlansStatus("ready");
          setPlansData(data);
        }
      } catch {
        if (active) {
          setPlansStatus("error");
          setPlansData(null);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [open]);

  if (!open) return null;

  const rawPlans = Array.isArray(plansData?.plans)
    ? plansData.plans
    : Array.isArray(plansData)
      ? plansData
      : [];

  return (
    <div className="fixed inset-0 z-[10000]">
      <div
        className="absolute inset-0 bg-black/30"
        onMouseDown={onClose}
        aria-hidden="true"
      />
      <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="pointer-events-auto w-full max-w-[640px] rounded-2xl border border-slate-200 bg-white shadow-2xl"
          role="dialog"
          aria-modal="true"
          aria-label="Оплата и тариф"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div className="text-base font-semibold text-slate-900">
              Оплата / тариф
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-slate-100"
              aria-label="Закрыть"
              title="Закрыть"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="px-5 py-5">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="text-xs text-slate-500">Текущий тариф</div>
              <div className="mt-1 text-sm font-medium text-slate-900">
                {isUnauthorized ? "—" : planLabel || "—"}
              </div>
            </div>

            {isVip && (
              <div className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                <p>
                  Вы используете сервис бесплатно. Поддержать проект можно по
                  ссылке:
                </p>
                {vipSupportUrl ? (
                  <a
                    href={vipSupportUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
                  >
                    <CreditCard className="h-4 w-4" />
                    Поддержать проект
                  </a>
                ) : (
                  <div className="mt-3 rounded-xl border border-dashed border-slate-200 px-4 py-2 text-sm text-slate-500">
                    {vipSupportLabel}
                  </div>
                )}
              </div>
            )}

            <div className="mt-4">
              <div className="text-xs uppercase tracking-wide text-slate-500">
                Доступные тарифы
              </div>

              {plansStatus === "loading" && (
                <div className="mt-2 text-sm text-slate-500">Загрузка…</div>
              )}
              {plansStatus === "error" && (
                <div className="mt-2 text-sm text-rose-500">
                  Не удалось загрузить тарифы.
                </div>
              )}

              {plansStatus === "ready" && (
                <div className="mt-3 grid gap-3">
                  {rawPlans.length === 0 ? (
                    <div className="text-sm text-slate-500">Тарифы не найдены.</div>
                  ) : (
                    rawPlans.map((plan: any, index: number) => {
                      const title =
                        plan?.label ??
                        plan?.title ??
                        plan?.name ??
                        plan?.code ??
                        `Тариф ${index + 1}`;

                      const features = Array.isArray(plan?.features)
                        ? plan.features
                        : Array.isArray(plan?.limits)
                          ? plan.limits
                          : [];

                      return (
                        <div
                          key={plan?.id ?? plan?.code ?? index}
                          className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
                        >
                          <div className="text-sm font-semibold text-slate-900">
                            {title}
                          </div>

                          {features.length > 0 && (
                            <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-slate-600">
                              {features.map((feature: string, featureIndex: number) => (
                                <li key={`${title}-${featureIndex}`}>{feature}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
