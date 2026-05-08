import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowDownRight,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  AlertCircle,
  Banknote,
  Bell,
  CalendarClock,
  Check,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  Download,
  Edit3,
  Eye,
  ExternalLink,
  GalleryHorizontalEnd,
  LayoutDashboard,
  ListFilter,
  Plus,
  ReceiptText,
  Search,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Target,
  Trash2,
  Upload,
  WalletCards,
  X
} from 'lucide-react';
import './styles.css';

const STORAGE_KEY = 'finch:data:v1';
const UPDATE_SNOOZE_KEY = 'finch:update-snoozed-until';
const LOGO_URL = `${import.meta.env.BASE_URL}finch-logo.svg`;

const today = new Date();
const isoToday = today.toISOString().slice(0, 10);

const addMonths = (date, months) => {
  const copy = new Date(date);
  copy.setMonth(copy.getMonth() + months);
  return copy;
};

const toISODate = (date) => date.toISOString().slice(0, 10);

const monthKey = (dateLike) => {
  const date = new Date(`${dateLike}T12:00:00`);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

const currentMonthKey = monthKey(isoToday);
const supportedThemes = ['iOS claro', 'Grafite', 'Contraste suave'];
const themeAliases = {
  'Noite roxa': 'iOS claro',
  'Alto contraste': 'Contraste suave',
  'Coral suave': 'iOS claro'
};

const uid = () => {
  if (crypto?.randomUUID) {
    return crypto.randomUUID();
  }

  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const currency = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 2
});

const compactCurrency = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  notation: 'compact',
  maximumFractionDigits: 1
});

const compactMoney = (value) => compactCurrency.format(value).replace(/\s/g, '\u00a0');

const monthLabel = (key) => {
  const [year, month] = key.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric'
  });
};

const shortMonthLabel = (key) => {
  const [year, month] = key.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString('pt-BR', {
    month: 'short'
  });
};

const capitalize = (value) => value.charAt(0).toUpperCase() + value.slice(1);

const seedData = {
  settings: {
    theme: 'iOS claro',
    userName: '',
    onboardingCompleted: false,
    salaryIsVariable: false,
    planningGoal: 'Organizar meu dinheiro',
    monthlyBudget: 5200,
    salary: 7800,
    categories: ['Moradia', 'Mercado', 'Transporte', 'Lazer', 'Saúde', 'Educação', 'Viagem', 'Tecnologia'],
    accounts: ['Nubank', 'Inter', 'Carteira', 'Investimentos']
  },
  transactions: [
    {
      id: 'tx-salario',
      title: 'Salário',
      amount: 7800,
      type: 'income',
      category: 'Receita',
      account: 'Inter',
      date: toISODate(new Date(today.getFullYear(), today.getMonth(), 4)),
      status: 'confirmed',
      recurring: true,
      installments: 1,
      notes: 'Receita mensal principal.'
    },
    {
      id: 'tx-aluguel',
      title: 'Aluguel',
      amount: 2450,
      type: 'expense',
      category: 'Moradia',
      account: 'Nubank',
      date: toISODate(new Date(today.getFullYear(), today.getMonth(), 6)),
      status: 'confirmed',
      recurring: true,
      installments: 1,
      notes: 'Contrato residencial.'
    },
    {
      id: 'tx-mercado',
      title: 'Mercado da semana',
      amount: 386.72,
      type: 'expense',
      category: 'Mercado',
      account: 'Nubank',
      date: toISODate(new Date(today.getFullYear(), today.getMonth(), 8)),
      status: 'confirmed',
      recurring: false,
      installments: 1,
      notes: 'Compra principal do mês.'
    },
    {
      id: 'tx-academia',
      title: 'Academia',
      amount: 129.9,
      type: 'expense',
      category: 'Saúde',
      account: 'Inter',
      date: toISODate(new Date(today.getFullYear(), today.getMonth(), 12)),
      status: 'pending',
      recurring: true,
      installments: 1,
      notes: 'Mensalidade.'
    },
    {
      id: 'tx-curso',
      title: 'Curso de produto',
      amount: 220,
      type: 'expense',
      category: 'Educação',
      account: 'Nubank',
      date: toISODate(new Date(today.getFullYear(), today.getMonth(), 18)),
      status: 'pending',
      recurring: false,
      installments: 4,
      notes: 'Parcela 1 de 4.'
    },
    {
      id: 'tx-freela',
      title: 'Projeto freelance',
      amount: 1800,
      type: 'income',
      category: 'Receita',
      account: 'Carteira',
      date: toISODate(new Date(today.getFullYear(), today.getMonth(), 22)),
      status: 'pending',
      recurring: false,
      installments: 1,
      notes: 'Pagamento previsto.'
    },
    {
      id: 'tx-viagem',
      title: 'Passagem viagem',
      amount: 580,
      type: 'expense',
      category: 'Viagem',
      account: 'Nubank',
      date: toISODate(addMonths(today, 1)),
      status: 'pending',
      recurring: false,
      installments: 3,
      notes: 'Parcela 2 de 3 entra nos próximos meses.'
    }
  ],
  purchases: [
    {
      id: 'wish-monitor',
      name: 'Monitor ultrawide',
      targetPrice: 2190,
      priority: 'Alta',
      category: 'Tecnologia',
      store: 'Kabum',
      link: 'https://www.kabum.com.br/',
      image:
        'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=900&q=80',
      notes: 'Aguardar promoção abaixo de R$ 2.200.',
      status: 'planned',
      createdAt: isoToday
    },
    {
      id: 'wish-bike',
      name: 'Bicicleta urbana',
      targetPrice: 1650,
      priority: 'Média',
      category: 'Transporte',
      store: 'Decathlon',
      link: 'https://www.decathlon.com.br/',
      image:
        'https://images.unsplash.com/photo-1507035895480-2b3156c31fc8?auto=format&fit=crop&w=900&q=80',
      notes: 'Boa para reduzir gastos curtos de app.',
      status: 'planned',
      createdAt: isoToday
    },
    {
      id: 'wish-camera',
      name: 'Câmera mirrorless',
      targetPrice: 4200,
      priority: 'Baixa',
      category: 'Criativo',
      store: 'Mercado Livre',
      link: 'https://www.mercadolivre.com.br/',
      image:
        'https://images.unsplash.com/photo-1510127034890-ba27508e9f1c?auto=format&fit=crop&w=900&q=80',
      notes: 'Desejo de médio prazo.',
      status: 'planned',
      createdAt: isoToday
    }
  ]
};

const createEmptyData = (settings = {}) => ({
  settings: {
    ...seedData.settings,
    monthlyBudget: 0,
    salary: 0,
    userName: '',
    onboardingCompleted: false,
    salaryIsVariable: false,
    planningGoal: 'Organizar meu dinheiro',
    ...settings
  },
  transactions: [],
  purchases: []
});

const navItems = [
  { id: 'overview', label: 'Visão geral', icon: LayoutDashboard },
  { id: 'wallet', label: 'Carteira / Extrato', icon: WalletCards },
  { id: 'future', label: 'Compras futuras', icon: GalleryHorizontalEnd },
  { id: 'projection', label: 'Projeções', icon: CalendarClock },
  { id: 'settings', label: 'Configurações', icon: Settings }
];

const emptyTransaction = {
  title: '',
  amount: '',
  type: 'expense',
  category: 'Mercado',
  account: 'Nubank',
  date: isoToday,
  status: 'pending',
  recurring: false,
  installments: 1,
  notes: ''
};

const emptyPurchase = {
  name: '',
  targetPrice: '',
  priority: 'Média',
  category: 'Tecnologia',
  store: '',
  link: '',
  image: '',
  notes: '',
  status: 'planned'
};

function normalizeData(data) {
  const settings = { ...seedData.settings, ...data?.settings };
  settings.theme = themeAliases[settings.theme] || (supportedThemes.includes(settings.theme) ? settings.theme : seedData.settings.theme);
  settings.onboardingCompleted =
    data?.settings?.onboardingCompleted ?? Boolean(data?.transactions?.length || data?.purchases?.length);
  const transactions = Array.isArray(data?.transactions) ? data.transactions : [];
  const transactionById = new Map(transactions.map((transaction) => [transaction.id, transaction]));
  const rawPurchases = Array.isArray(data?.purchases) ? data.purchases : [];
  const purchases = rawPurchases.map((purchase) => {
    if (purchase.status !== 'purchased') return purchase;

    const linkedTransaction = purchase.purchaseTransactionId
      ? transactionById.get(purchase.purchaseTransactionId)
      : transactions.find(
          (transaction) =>
            transaction.sourcePurchaseId === purchase.id ||
            (transaction.notes?.includes('Compra registrada a partir da galeria de desejos') &&
              transaction.title === purchase.name &&
              Number(transaction.amount) === Number(purchase.targetPrice))
        );

    if (linkedTransaction) {
      return {
        ...purchase,
        purchaseTransactionId: linkedTransaction.id
      };
    }

    return {
      ...purchase,
      status: 'planned',
      purchasedAt: undefined,
      purchaseTransactionId: undefined
    };
  });

  return {
    settings,
    transactions,
    purchases
  };
}

function getDesktopStorage() {
  return typeof window !== 'undefined' ? window.finchStorage : null;
}

function getUpdateService() {
  return typeof window !== 'undefined' ? window.finchUpdates : null;
}

function getUpdateSnoozedUntil() {
  return Number(localStorage.getItem(UPDATE_SNOOZE_KEY) || 0);
}

function isUpdateSnoozed() {
  return Date.now() < getUpdateSnoozedUntil();
}

function snoozeUpdatesFor24h() {
  localStorage.setItem(UPDATE_SNOOZE_KEY, String(Date.now() + 24 * 60 * 60 * 1000));
}

function loadData() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? normalizeData(JSON.parse(stored)) : createEmptyData();
  } catch {
    return createEmptyData();
  }
}

function App() {
  const [activePage, setActivePage] = useState('overview');
  const [data, setData] = useState(loadData);
  const [storageReady, setStorageReady] = useState(() => !getDesktopStorage());
  const [storageMeta, setStorageMeta] = useState(() => ({
    mode: getDesktopStorage() ? 'desktop' : 'browser',
    path: '',
    error: ''
  }));
  const [showOnboarding, setShowOnboarding] = useState(() => !loadData().settings.onboardingCompleted);
  const [updateState, setUpdateState] = useState(null);
  const updateWasRequestedRef = useRef(false);

  useEffect(() => {
    const desktopStorage = getDesktopStorage();

    if (!desktopStorage?.loadData) {
      setStorageReady(true);
      return undefined;
    }

    let active = true;

    desktopStorage
      .loadData()
      .then((result) => {
        if (!active) return;

        if (result?.ok) {
          if (result.data) {
            const normalized = normalizeData(result.data);
            setData(normalized);
            setShowOnboarding(!normalized.settings.onboardingCompleted);
          } else {
            const emptyData = createEmptyData();
            setData(emptyData);
            setShowOnboarding(true);
          }

          setStorageMeta({
            mode: 'desktop',
            path: result.path || '',
            error: ''
          });
        } else {
          setStorageMeta({
            mode: 'desktop-error',
            path: result?.path || '',
            error: result?.error || 'Não foi possível carregar o arquivo local.'
          });
        }
      })
      .catch((error) => {
        if (!active) return;

        setStorageMeta({
          mode: 'desktop-error',
          path: '',
          error: error?.message || 'Não foi possível carregar o arquivo local.'
        });
      })
      .finally(() => {
        if (active) {
          setStorageReady(true);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!storageReady) return;

    const desktopStorage = getDesktopStorage();

    if (desktopStorage?.saveData) {
      desktopStorage
        .saveData(data)
        .then((result) => {
          if (!result?.ok) {
            setStorageMeta((current) => ({
              ...current,
              mode: 'desktop-error',
              error: result?.error || 'Não foi possível salvar os dados locais.'
            }));
          } else {
            setStorageMeta((current) => ({
              ...current,
              mode: 'desktop',
              path: result.path || current.path,
              error: ''
            }));
          }
        })
        .catch((error) => {
          setStorageMeta((current) => ({
            ...current,
            mode: 'desktop-error',
            error: error?.message || 'Não foi possível salvar os dados locais.'
          }));
        });
      return;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data, storageReady]);

  useEffect(() => {
    const updateService = getUpdateService();

    if (!updateService?.checkForUpdates) return undefined;

    let active = true;
    const handleUpdateEvent = (event) => {
      if (!active || !event) return;

      if (event.state === 'available' && isUpdateSnoozed()) return;
      if (event.state === 'error' && !updateWasRequestedRef.current) return;

      setUpdateState(event);
    };

    const unsubscribe = updateService.onUpdateEvent?.(handleUpdateEvent);

    updateService.getStatus?.().then((status) => {
      if (!active || !status?.state || status.state === 'idle') return;
      if (status.state === 'available' && isUpdateSnoozed()) return;

      setUpdateState(status);
    });

    if (!isUpdateSnoozed()) {
      updateService.checkForUpdates().then(handleUpdateEvent).catch(() => {});
    }

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);

  const metrics = useMemo(() => calculateMetrics(data), [data]);
  const themeClass = `theme-${data.settings.theme
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, '-')}`;

  const updateSettings = (settings) => {
    setData((current) => ({
      ...current,
      settings: { ...current.settings, ...settings }
    }));
  };

  const saveTransaction = (transaction) => {
    setData((current) => {
      const payload = {
        ...transaction,
        amount: Number(transaction.amount),
        installments: Math.max(1, Number(transaction.installments || 1)),
        recurring: Boolean(transaction.recurring)
      };

      if (payload.id) {
        return {
          ...current,
          transactions: current.transactions.map((item) => (item.id === payload.id ? payload : item))
        };
      }

      return {
        ...current,
        transactions: [{ ...payload, id: uid() }, ...current.transactions]
      };
    });
  };

  const deleteTransaction = (id) => {
    setData((current) => {
      const removedTransaction = current.transactions.find((transaction) => transaction.id === id);
      const isPurchaseTransaction = (purchase) => {
        if (!removedTransaction || purchase.status !== 'purchased') return false;
        if (purchase.purchaseTransactionId === id) return true;

        return (
          !purchase.purchaseTransactionId &&
          removedTransaction.notes?.includes('Compra registrada a partir da galeria de desejos') &&
          purchase.name === removedTransaction.title &&
          Number(purchase.targetPrice) === Number(removedTransaction.amount)
        );
      };

      return {
        ...current,
        transactions: current.transactions.filter((transaction) => transaction.id !== id),
        purchases: current.purchases.map((purchase) =>
          isPurchaseTransaction(purchase)
            ? {
                ...purchase,
                status: 'planned',
                purchasedAt: undefined,
                purchaseTransactionId: undefined
              }
            : purchase
        )
      };
    });
  };

  const toggleTransactionStatus = (id) => {
    setData((current) => ({
      ...current,
      transactions: current.transactions.map((transaction) =>
        transaction.id === id
          ? {
              ...transaction,
              status: transaction.status === 'confirmed' ? 'pending' : 'confirmed'
            }
          : transaction
      )
    }));
  };

  const savePurchase = (purchase) => {
    setData((current) => {
      const payload = {
        ...purchase,
        targetPrice: Number(purchase.targetPrice),
        image: purchase.image || '',
        link: purchase.link || '',
        createdAt: purchase.createdAt || isoToday
      };

      if (payload.id) {
        return {
          ...current,
          purchases: current.purchases.map((item) => (item.id === payload.id ? payload : item))
        };
      }

      return {
        ...current,
        purchases: [{ ...payload, id: uid() }, ...current.purchases]
      };
    });
  };

  const deletePurchase = (id) => {
    setData((current) => ({
      ...current,
      purchases: current.purchases.filter((purchase) => purchase.id !== id)
    }));
  };

  const reorderPlannedPurchases = (orderedIds) => {
    setData((current) => {
      const plannedById = new Map(
        current.purchases
          .filter((purchase) => purchase.status !== 'purchased')
          .map((purchase) => [purchase.id, purchase])
      );
      const knownIds = new Set(orderedIds);
      const orderedPlanned = orderedIds.map((id) => plannedById.get(id)).filter(Boolean);
      const remainingPlanned = current.purchases.filter(
        (purchase) => purchase.status !== 'purchased' && !knownIds.has(purchase.id)
      );
      const purchased = current.purchases.filter((purchase) => purchase.status === 'purchased');

      return {
        ...current,
        purchases: [...orderedPlanned, ...remainingPlanned, ...purchased]
      };
    });
  };

  const markPurchaseBought = (purchase) => {
    setData((current) => {
      const transactionId = uid();

      return {
        ...current,
      purchases: current.purchases.map((item) =>
        item.id === purchase.id
          ? {
              ...item,
              status: 'purchased',
              purchasedAt: isoToday,
              purchaseTransactionId: transactionId
            }
          : item
      ),
        transactions: [
        {
          id: transactionId,
          sourcePurchaseId: purchase.id,
          title: purchase.name,
          amount: Number(purchase.targetPrice),
          type: 'expense',
          category: purchase.category,
          account: current.settings.accounts[0] || 'Carteira',
          date: isoToday,
          status: 'confirmed',
          recurring: false,
          installments: 1,
          notes: `Compra registrada a partir da galeria de desejos. Loja: ${purchase.store || 'não informada'}.`
        },
          ...current.transactions
        ]
      };
    });
  };

  const resetData = () => setData({ ...seedData, settings: { ...seedData.settings, onboardingCompleted: true } });

  const clearData = () => {
    setData((current) => ({
      ...current,
      transactions: [],
      purchases: []
    }));
  };

  const importData = (payload) => setData(normalizeData(payload));

  const completeOnboarding = (settings) => {
    setData(createEmptyData({ ...settings, onboardingCompleted: true }));
    setShowOnboarding(false);
  };

  const Page = {
    overview: OverviewPage,
    wallet: WalletPage,
    future: FuturePurchasesPage,
    projection: ProjectionPage,
    settings: SettingsPage
  }[activePage];

  return (
    <div className={`app-shell ${themeClass}`}>
      <AmbientBackground />
      {showOnboarding ? (
        <OnboardingPage onComplete={completeOnboarding} />
      ) : (
        <>
          <Sidebar activePage={activePage} setActivePage={setActivePage} metrics={metrics} />
          <main className="content-shell">
            <TopBar activePage={activePage} metrics={metrics} />
            <Page
              data={data}
              metrics={metrics}
              onSaveTransaction={saveTransaction}
              onDeleteTransaction={deleteTransaction}
              onToggleTransactionStatus={toggleTransactionStatus}
              onSavePurchase={savePurchase}
              onDeletePurchase={deletePurchase}
              onMarkPurchaseBought={markPurchaseBought}
              onReorderPurchases={reorderPlannedPurchases}
              onUpdateSettings={updateSettings}
              onResetData={resetData}
              onClearData={clearData}
              onImportData={importData}
              storageMeta={storageMeta}
            />
          </main>
        </>
      )}
      {updateState && ['available', 'downloading', 'downloaded', 'install-on-quit', 'error'].includes(updateState.state) && (
        <UpdateModal
          status={updateState}
          onSnooze={() => {
            snoozeUpdatesFor24h();
            setUpdateState(null);
          }}
          onDismiss={() => setUpdateState(null)}
          onDownload={() => {
            const updateService = getUpdateService();
            updateWasRequestedRef.current = true;
            setUpdateState((current) => ({
              ...current,
              state: 'downloading',
              progress: { percent: 0 }
            }));
            updateService?.downloadUpdate?.();
          }}
          onInstallNow={() => getUpdateService()?.installNow?.()}
          onInstallOnQuit={() => {
            getUpdateService()?.installOnQuit?.();
            setUpdateState((current) => ({ ...current, state: 'install-on-quit' }));
          }}
        />
      )}
    </div>
  );
}

function AmbientBackground() {
  return (
    <div className="ambient" aria-hidden="true">
      <span className="ambient-glow glow-one" />
      <span className="ambient-glow glow-two" />
      <span className="ambient-grid" />
    </div>
  );
}

function LogoMark() {
  return (
    <div className="logo-mark" aria-label="finch">
      <img src={LOGO_URL} alt="" />
    </div>
  );
}

function OnboardingPage({ onComplete }) {
  const [form, setForm] = useState({
    userName: '',
    salary: '',
    salaryIsVariable: false,
    monthlyBudget: '',
    mainAccount: '',
    planningGoal: 'Organizar meu dinheiro'
  });

  const canContinue = form.userName.trim().length >= 2;
  const salary = form.salaryIsVariable ? 0 : Number(form.salary || 0);
  const suggestedBudget = form.monthlyBudget ? Number(form.monthlyBudget) : Math.round(salary * 0.75);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const finish = () => {
    if (!canContinue) return;

    onComplete({
      userName: form.userName.trim(),
      salary,
      salaryIsVariable: form.salaryIsVariable,
      monthlyBudget: Math.max(0, suggestedBudget || 0),
      planningGoal: form.planningGoal,
      accounts: form.mainAccount.trim() ? [form.mainAccount.trim(), ...seedData.settings.accounts] : seedData.settings.accounts
    });
  };

  return (
    <main className="onboarding-shell">
      <section className="onboarding-card">
        <div className="onboarding-brand">
          <LogoMark />
          <div>
            <p className="brand-name">finch</p>
            <span>Seu dinheiro, seu futuro.</span>
          </div>
        </div>

        <div className="onboarding-copy">
          <p className="eyebrow">Primeiros passos</p>
          <h1>Vamos deixar o Finch com a sua cara.</h1>
          <p>Algumas respostas rápidas ajudam o app a começar limpo, com orçamento e projeções mais próximas da sua realidade.</p>
        </div>

        <div className="onboarding-form">
          <label>
            <span>Como podemos chamar você?</span>
            <input
              value={form.userName}
              onChange={(event) => updateField('userName', event.target.value)}
              placeholder="Ex.: João"
              autoFocus
            />
          </label>

          <label>
            <span>Quanto você ganha por mês?</span>
            <input
              type="number"
              min="0"
              value={form.salary}
              disabled={form.salaryIsVariable}
              onChange={(event) => updateField('salary', event.target.value)}
              placeholder="Ex.: 3500"
            />
          </label>

          <label className="check-row">
            <input
              type="checkbox"
              checked={form.salaryIsVariable}
              onChange={(event) => updateField('salaryIsVariable', event.target.checked)}
            />
            <span>Meu salário não é fixo, pular por enquanto</span>
          </label>

          <label>
            <span>Qual orçamento mensal você quer acompanhar?</span>
            <input
              type="number"
              min="0"
              value={form.monthlyBudget}
              onChange={(event) => updateField('monthlyBudget', event.target.value)}
              placeholder={salary ? `Sugestão: ${Math.round(salary * 0.75)}` : 'Ex.: 2500'}
            />
          </label>

          <label>
            <span>Conta principal</span>
            <input
              value={form.mainAccount}
              onChange={(event) => updateField('mainAccount', event.target.value)}
              placeholder="Ex.: Nubank, Inter, Carteira"
            />
          </label>

          <label>
            <span>Seu foco agora</span>
            <select value={form.planningGoal} onChange={(event) => updateField('planningGoal', event.target.value)}>
              <option>Organizar meu dinheiro</option>
              <option>Reduzir gastos</option>
              <option>Planejar compras futuras</option>
              <option>Criar reserva financeira</option>
              <option>Acompanhar parcelas e compromissos</option>
            </select>
          </label>
        </div>

        <div className="onboarding-actions">
          <button className="secondary-button" type="button" onClick={() => updateField('salaryIsVariable', true)}>
            Pular renda fixa
          </button>
          <button className="primary-button" type="button" disabled={!canContinue} onClick={finish}>
            Começar
          </button>
        </div>
      </section>
    </main>
  );
}

function Sidebar({ activePage, setActivePage, metrics }) {
  return (
    <aside className="sidebar">
      <div className="brand-lockup">
        <LogoMark />
        <div>
          <p className="brand-name">finch</p>
          <span>Seu dinheiro, seu futuro.</span>
        </div>
      </div>

      <div className="balance-tile">
        <div className="eyebrow">Saldo atual</div>
        <strong>{currency.format(metrics.balance)}</strong>
        <span className={metrics.monthNet >= 0 ? 'positive' : 'negative'}>
          {metrics.monthNet >= 0 ? '+' : ''}
          {currency.format(metrics.monthNet)} neste mês
        </span>
      </div>

      <nav className="side-nav" aria-label="Navegação principal">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              className={activePage === item.id ? 'nav-item active' : 'nav-item'}
              key={item.id}
              type="button"
              onClick={() => setActivePage(item.id)}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="insight-card">
        <Sparkles size={18} />
        <strong>Clareza hoje</strong>
        <p>{metrics.budgetUsed <= 100 ? 'Você ainda tem margem no orçamento mensal.' : 'Seu orçamento pede uma revisão rápida.'}</p>
      </div>
    </aside>
  );
}

function TopBar({ activePage, metrics }) {
  const title = navItems.find((item) => item.id === activePage)?.label || 'finch';

  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">Clareza hoje para construir um futuro melhor.</p>
        <h1>{title}</h1>
      </div>
      <div className="topbar-actions">
        <div className="signal-pill">
          <ShieldCheck size={16} />
          <span>{metrics.pendingCount} pendências</span>
        </div>
        <button className="icon-button" type="button" title="Notificações" aria-label="Notificações">
          <Bell size={18} />
        </button>
      </div>
    </header>
  );
}

function OverviewPage({ data, metrics, onToggleTransactionStatus }) {
  return (
    <section className="page-grid overview-grid">
      <StatCard
        title="Saldo atual"
        value={currency.format(metrics.balance)}
        detail="Confirmado nas contas"
        icon={CircleDollarSign}
        tone="violet"
      />
      <StatCard
        title="Entradas"
        value={currency.format(metrics.monthIncome)}
        detail={capitalize(monthLabel(currentMonthKey))}
        icon={ArrowUpRight}
        tone="mint"
      />
      <StatCard
        title="Saídas"
        value={currency.format(metrics.monthExpense)}
        detail="Despesas do mês"
        icon={ArrowDownRight}
        tone="coral"
      />
      <StatCard
        title="Compras futuras"
        value={currency.format(metrics.futurePurchasesTotal)}
        detail={`${metrics.futurePurchasesCount} itens planejados`}
        icon={Target}
        tone="lavender"
      />

      <section className="panel wide">
        <PanelHeader
          eyebrow="Próximos meses"
          title="Projeção financeira"
          action={`${metrics.projection[0]?.net >= 0 ? '+' : ''}${currency.format(metrics.projection[0]?.net || 0)} agora`}
        />
        <ProjectionChart data={metrics.projection} />
      </section>

      <section className="panel">
        <PanelHeader eyebrow="Orçamento" title="Uso mensal" action={`${Math.round(metrics.budgetUsed)}%`} />
        <BudgetDial percent={metrics.budgetUsed} spent={metrics.monthExpense} budget={data.settings.monthlyBudget} />
      </section>

      <section className="panel">
        <PanelHeader eyebrow="Categorias" title="Gastos por categoria" action="mês atual" />
        <CategoryBreakdown categories={metrics.categoryBreakdown} />
      </section>

      <section className="panel wide">
        <PanelHeader eyebrow="Carteira" title="Transações recentes" action={`${data.transactions.length} registros`} />
        <TransactionList
          transactions={data.transactions.slice(0, 6)}
          compact
          onToggleTransactionStatus={onToggleTransactionStatus}
        />
      </section>
    </section>
  );
}

function StatCard({ title, value, detail, icon: Icon, tone }) {
  return (
    <article className={`stat-card ${tone}`}>
      <div className="stat-icon">
        <Icon size={20} />
      </div>
      <div>
        <span>{title}</span>
        <strong>{value}</strong>
        <p>{detail}</p>
      </div>
    </article>
  );
}

function PanelHeader({ eyebrow, title, action }) {
  return (
    <div className="panel-header">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
      </div>
      {action && <span className="panel-action">{action}</span>}
    </div>
  );
}

function ProjectionChart({ data }) {
  const width = 720;
  const height = 260;
  const padding = 34;
  const values = data.map((item) => item.balance);
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 1);
  const range = max - min || 1;
  const points = data.map((item, index) => {
    const x = padding + (index * (width - padding * 2)) / Math.max(1, data.length - 1);
    const y = height - padding - ((item.balance - min) / range) * (height - padding * 2);
    return { ...item, x, y };
  });
  const path = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
  const area = `${path} L ${points.at(-1)?.x || padding} ${height - padding} L ${padding} ${height - padding} Z`;

  return (
    <div className="chart-wrap">
      <svg className="projection-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Gráfico de projeção">
        <defs>
          <linearGradient id="projectionStroke" x1="0" x2="1">
            <stop stopColor="var(--chart-start)" />
            <stop offset=".5" stopColor="var(--chart-mid)" />
            <stop offset="1" stopColor="var(--chart-end)" />
          </linearGradient>
          <linearGradient id="projectionArea" x1="0" x2="0" y1="0" y2="1">
            <stop stopColor="var(--chart-area)" stopOpacity=".18" />
            <stop offset="1" stopColor="var(--chart-area)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3].map((line) => {
          const y = padding + (line * (height - padding * 2)) / 3;
          return <line key={line} x1={padding} x2={width - padding} y1={y} y2={y} className="chart-grid-line" />;
        })}
        <path d={area} fill="url(#projectionArea)" />
        <path d={path} fill="none" stroke="url(#projectionStroke)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((point) => (
          <g key={point.key}>
            <circle cx={point.x} cy={point.y} r="5.5" className="chart-dot" />
            <text x={point.x} y={height - 10} textAnchor="middle" className="chart-label">
              {shortMonthLabel(point.key)}
            </text>
          </g>
        ))}
      </svg>
      <div className="chart-legend">
        {data.map((item) => (
          <div key={item.key}>
            <span>{shortMonthLabel(item.key)}</span>
            <strong title={currency.format(item.balance)}>{compactMoney(item.balance)}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function BudgetDial({ percent, spent, budget }) {
  const clamped = Math.min(percent, 140);
  const rotation = (clamped / 100) * 360;

  return (
    <div className="budget-dial-layout">
      <div className="budget-dial" style={{ '--dial-angle': `${rotation}deg` }}>
        <div>
          <strong>{Math.round(percent)}%</strong>
          <span>usado</span>
        </div>
      </div>
      <div className="budget-copy">
        <p>
          {currency.format(spent)} de {currency.format(budget)}
        </p>
        <span>{percent <= 80 ? 'Ritmo confortável' : percent <= 100 ? 'Atenção ao fechamento' : 'Acima do planejado'}</span>
      </div>
    </div>
  );
}

function CategoryBreakdown({ categories }) {
  if (!categories.length) {
    return <EmptyState icon={ReceiptText} title="Sem gastos confirmados" text="As categorias aparecem assim que houver saídas neste mês." />;
  }

  const max = Math.max(...categories.map((item) => item.total), 1);

  return (
    <div className="category-list">
      {categories.map((item) => (
        <div className="category-row" key={item.category}>
          <div className="category-meta">
            <span>{item.category}</span>
            <strong>{currency.format(item.total)}</strong>
          </div>
          <div className="mini-bar">
            <span style={{ width: `${(item.total / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function WalletPage({ data, onSaveTransaction, onDeleteTransaction, onToggleTransactionStatus }) {
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const filteredTransactions = useMemo(() => {
    return data.transactions
      .filter((transaction) => {
        const matchesQuery = `${transaction.title} ${transaction.category} ${transaction.account} ${transaction.notes}`
          .toLowerCase()
          .includes(query.toLowerCase());
        const matchesType = typeFilter === 'all' || transaction.type === typeFilter;
        const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter;
        return matchesQuery && matchesType && matchesStatus;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [data.transactions, query, typeFilter, statusFilter]);

  const openForm = (transaction = null) => {
    setEditing(transaction);
    setShowForm(true);
  };

  const closeForm = () => {
    setEditing(null);
    setShowForm(false);
  };

  return (
    <section className="wallet-layout">
      <div className="toolbar-line">
        <div className="search-box">
          <Search size={18} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por nome, categoria, conta..."
          />
        </div>
        <SegmentedControl
          label="Tipo"
          value={typeFilter}
          onChange={setTypeFilter}
          options={[
            { value: 'all', label: 'Todos' },
            { value: 'income', label: 'Entradas' },
            { value: 'expense', label: 'Saídas' }
          ]}
        />
        <SegmentedControl
          label="Status"
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: 'all', label: 'Status' },
            { value: 'confirmed', label: 'Confirmadas' },
            { value: 'pending', label: 'Pendentes' }
          ]}
        />
        <button className="primary-button" type="button" onClick={() => openForm()}>
          <Plus size={18} />
          Nova transação
        </button>
      </div>

      <section className="panel wallet-panel">
        <PanelHeader
          eyebrow="Extrato inteligente"
          title="Carteira financeira"
          action={`${filteredTransactions.length} itens`}
        />
        <TransactionList
          transactions={filteredTransactions}
          onEdit={openForm}
          onDelete={onDeleteTransaction}
          onToggleTransactionStatus={onToggleTransactionStatus}
        />
      </section>

      {showForm && (
        <TransactionModal
          transaction={editing}
          categories={data.settings.categories}
          accounts={data.settings.accounts}
          onClose={closeForm}
          onSave={(transaction) => {
            onSaveTransaction(transaction);
            closeForm();
          }}
        />
      )}
    </section>
  );
}

function TransactionList({ transactions, compact = false, onEdit, onDelete, onToggleTransactionStatus }) {
  if (!transactions.length) {
    return <EmptyState icon={ListFilter} title="Nada encontrado" text="Ajuste os filtros ou registre uma nova movimentação." />;
  }

  return (
    <div className={compact ? 'transaction-list compact' : 'transaction-list'}>
      {transactions.map((transaction) => (
        <article className="transaction-item" key={transaction.id}>
          <div className={`transaction-badge ${transaction.type}`}>
            {transaction.type === 'income' ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
          </div>
          <div className="transaction-main">
            <div className="transaction-title-row">
              <strong>{transaction.title}</strong>
              <span className={`status-chip ${transaction.status}`}>
                {transaction.status === 'confirmed' ? 'Confirmada' : 'Pendente'}
              </span>
            </div>
            <div className="transaction-meta">
              <span>{formatDate(transaction.date)}</span>
              <span>{transaction.category}</span>
              <span>{transaction.account}</span>
              {transaction.recurring && <span>Recorrente</span>}
              {Number(transaction.installments) > 1 && <span>{transaction.installments} parcelas</span>}
            </div>
          </div>
          <strong className={transaction.type === 'income' ? 'amount income' : 'amount expense'}>
            {transaction.type === 'income' ? '+' : '-'}
            {currency.format(transaction.amount)}
          </strong>
          {!compact && (
            <div className="row-actions">
              <button
                className="icon-button ghost"
                type="button"
                title={transaction.status === 'confirmed' ? 'Marcar como pendente' : 'Confirmar transação'}
                aria-label={transaction.status === 'confirmed' ? 'Marcar como pendente' : 'Confirmar transação'}
                onClick={() => onToggleTransactionStatus(transaction.id)}
              >
                <Check size={17} />
              </button>
              <button className="icon-button ghost" type="button" title="Editar" aria-label="Editar" onClick={() => onEdit(transaction)}>
                <Edit3 size={17} />
              </button>
              <button
                className="icon-button danger"
                type="button"
                title="Excluir"
                aria-label="Excluir"
                onClick={() => onDelete(transaction.id)}
              >
                <Trash2 size={17} />
              </button>
            </div>
          )}
        </article>
      ))}
    </div>
  );
}

function TransactionModal({ transaction, categories, accounts, onClose, onSave }) {
  const [form, setForm] = useState(transaction || emptyTransaction);

  const setField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const handleSubmit = (event) => {
    event.preventDefault();
    onSave(form);
  };

  return (
    <Modal title={transaction ? 'Editar transação' : 'Nova transação'} onClose={onClose}>
      <form className="form-grid" onSubmit={handleSubmit}>
        <label className="field wide-field">
          <span>Descrição</span>
          <input required value={form.title} onChange={(event) => setField('title', event.target.value)} placeholder="Ex.: Mercado da semana" />
        </label>

        <label className="field">
          <span>Valor</span>
          <input
            required
            min="0"
            step="0.01"
            type="number"
            value={form.amount}
            onChange={(event) => setField('amount', event.target.value)}
            placeholder="0,00"
          />
        </label>

        <label className="field">
          <span>Tipo</span>
          <select value={form.type} onChange={(event) => setField('type', event.target.value)}>
            <option value="expense">Saída</option>
            <option value="income">Entrada</option>
          </select>
        </label>

        <label className="field">
          <span>Categoria</span>
          <select value={form.category} onChange={(event) => setField('category', event.target.value)}>
            {['Receita', ...categories].map((category) => (
              <option value={category} key={category}>
                {category}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Conta</span>
          <select value={form.account} onChange={(event) => setField('account', event.target.value)}>
            {accounts.map((account) => (
              <option value={account} key={account}>
                {account}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Data</span>
          <input type="date" value={form.date} onChange={(event) => setField('date', event.target.value)} />
        </label>

        <label className="field">
          <span>Status</span>
          <select value={form.status} onChange={(event) => setField('status', event.target.value)}>
            <option value="pending">Pendente</option>
            <option value="confirmed">Confirmada</option>
          </select>
        </label>

        <label className="field">
          <span>Parcelas</span>
          <input
            min="1"
            max="48"
            type="number"
            value={form.installments}
            onChange={(event) => setField('installments', event.target.value)}
          />
        </label>

        <label className="toggle-field">
          <input type="checkbox" checked={form.recurring} onChange={(event) => setField('recurring', event.target.checked)} />
          <span>Repetir mensalmente</span>
        </label>

        <label className="field wide-field">
          <span>Observações</span>
          <textarea value={form.notes} onChange={(event) => setField('notes', event.target.value)} placeholder="Detalhes úteis para o futuro" />
        </label>

        <div className="form-actions">
          <button className="secondary-button" type="button" onClick={onClose}>
            Cancelar
          </button>
          <button className="primary-button" type="submit">
            <Check size={18} />
            Salvar
          </button>
        </div>
      </form>
    </Modal>
  );
}

function FuturePurchasesPage({ data, onSavePurchase, onDeletePurchase, onMarkPurchaseBought, onReorderPurchases }) {
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [confirming, setConfirming] = useState(null);
  const [linkToOpen, setLinkToOpen] = useState(null);
  const [buying, setBuying] = useState(null);
  const [missingSite, setMissingSite] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [dragState, setDragState] = useState({ draggedId: '', insertIndex: -1 });
  const [draftOrderIds, setDraftOrderIds] = useState([]);

  const planned = data.purchases.filter((purchase) => purchase.status !== 'purchased');
  const purchased = data.purchases.filter((purchase) => purchase.status === 'purchased');
  const plannedById = useMemo(() => new Map(planned.map((purchase) => [purchase.id, purchase])), [planned]);
  const plannedIds = useMemo(() => planned.map((purchase) => purchase.id), [planned]);
  const orderedIds = dragState.draggedId && draftOrderIds.length ? draftOrderIds : plannedIds;
  const visibleIds = dragState.draggedId ? orderedIds.filter((id) => id !== dragState.draggedId) : orderedIds;
  const safeInsertIndex =
    dragState.draggedId && dragState.insertIndex >= 0
      ? Math.min(dragState.insertIndex, visibleIds.length)
      : -1;

  const openForm = (purchase = null) => {
    setEditing(purchase);
    setShowForm(true);
  };

  const closeForm = () => {
    setEditing(null);
    setShowForm(false);
  };

  const beginDrag = (event, purchase) => {
    if (!editMode) return;
    const ids = planned.map((item) => item.id);
    if (ids.length < 2) {
      event.preventDefault();
      return;
    }

    const startIndex = ids.indexOf(purchase.id);

    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', purchase.id);
    setDraftOrderIds(ids);
    setDragState({ draggedId: purchase.id, insertIndex: Math.max(0, startIndex) });
  };

  const moveDragOver = (event, purchaseId) => {
    if (!editMode || !dragState.draggedId || dragState.draggedId === purchaseId) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';

    const idsWithoutDragged = orderedIds.filter((id) => id !== dragState.draggedId);
    const targetIndex = idsWithoutDragged.indexOf(purchaseId);

    if (targetIndex === -1) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const xDistance = Math.abs(event.clientX - (rect.left + rect.width / 2));
    const yDistance = Math.abs(event.clientY - (rect.top + rect.height / 2));
    const after =
      yDistance > xDistance
        ? event.clientY > rect.top + rect.height / 2
        : event.clientX > rect.left + rect.width / 2;
    const nextInsertIndex = targetIndex + (after ? 1 : 0);

    setDragState((current) =>
      current.insertIndex === nextInsertIndex ? current : { ...current, insertIndex: nextInsertIndex }
    );
  };

  const moveDragOverGrid = (event) => {
    if (!editMode || !dragState.draggedId) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';

    if (event.target === event.currentTarget) {
      setDragState((current) =>
        current.insertIndex === visibleIds.length ? current : { ...current, insertIndex: visibleIds.length }
      );
    }
  };

  const finishDrop = (event) => {
    event.preventDefault();

    if (!editMode || !dragState.draggedId) {
      setDragState({ draggedId: '', insertIndex: -1 });
      setDraftOrderIds([]);
      return;
    }

    const nextIds = insertDraggedId(orderedIds, dragState.draggedId, safeInsertIndex);
    onReorderPurchases(nextIds);
    setDragState({ draggedId: '', insertIndex: -1 });
    setDraftOrderIds([]);
  };

  const endDrag = () => {
    setDragState({ draggedId: '', insertIndex: -1 });
    setDraftOrderIds([]);
  };

  const toggleEditMode = () => {
    setEditMode((current) => !current);
    setDragState({ draggedId: '', insertIndex: -1 });
    setDraftOrderIds([]);
  };

  const movePurchaseByStep = (purchaseId, step) => {
    const ids = planned.map((purchase) => purchase.id);
    const currentIndex = ids.indexOf(purchaseId);
    const nextIndex = currentIndex + step;

    if (currentIndex === -1 || nextIndex < 0 || nextIndex >= ids.length) {
      return;
    }

    const nextIds = [...ids];
    const [item] = nextIds.splice(currentIndex, 1);
    nextIds.splice(nextIndex, 0, item);
    onReorderPurchases(nextIds);
  };

  return (
    <section className="future-layout">
      <div className="toolbar-line">
        <div className="section-intro">
          <p className="eyebrow">Galeria de desejos</p>
          <h2>{editMode ? 'Toque em um card para editar ou arraste para ordenar.' : 'Produtos planejados com preço alvo e prioridade.'}</h2>
        </div>
        <div className="future-actions">
          <button className={editMode ? 'primary-button' : 'secondary-button'} type="button" onClick={toggleEditMode}>
            {editMode ? <Check size={18} /> : <Edit3 size={18} />}
            {editMode ? 'Concluir' : 'Editar'}
          </button>
          <button className="primary-button" type="button" onClick={() => openForm()}>
            <Plus size={18} />
            Novo produto
          </button>
        </div>
      </div>

      <div
        className={dragState.draggedId ? 'purchase-grid dragging-active' : 'purchase-grid'}
        onDragOver={moveDragOverGrid}
        onDrop={finishDrop}
      >
        {visibleIds.map((purchaseId, index) => {
          const purchase = plannedById.get(purchaseId);
          if (!purchase) return null;

          return (
            <React.Fragment key={purchase.id}>
              {safeInsertIndex === index && (
                <div
                  className="purchase-drop-placeholder"
                  onDragOver={(event) => {
                    event.preventDefault();
                    event.dataTransfer.dropEffect = 'move';
                  }}
                  onDrop={finishDrop}
                />
              )}
            <PurchaseCard
              purchase={purchase}
              editMode={editMode}
              orderIndex={plannedIds.indexOf(purchase.id)}
              totalPlanned={plannedIds.length}
              onEdit={openForm}
              onDelete={() => setConfirming(purchase)}
              onBought={() => setBuying(purchase)}
              onMove={movePurchaseByStep}
              onRequestOpenLink={(payload) => setLinkToOpen(payload)}
              onMissingSite={(item) => setMissingSite(item)}
              onDragStart={(event) => beginDrag(event, purchase)}
              onDragOver={(event) => moveDragOver(event, purchase.id)}
              onDrop={finishDrop}
              onDragEnd={endDrag}
            />
          </React.Fragment>
          );
        })}
        {safeInsertIndex === visibleIds.length && (
          <div
            className="purchase-drop-placeholder end"
            onDragOver={(event) => {
              event.preventDefault();
              event.dataTransfer.dropEffect = 'move';
              setDragState((current) =>
                current.insertIndex === visibleIds.length ? current : { ...current, insertIndex: visibleIds.length }
              );
            }}
            onDrop={finishDrop}
          />
        )}
      </div>

      {!planned.length && (
        <section className="panel">
          <EmptyState icon={Target} title="Nenhuma compra futura" text="Adicione desejos com preço alvo para planejar antes de comprar." />
        </section>
      )}

      {!!purchased.length && (
        <section className="panel full-width">
          <PanelHeader eyebrow="Histórico" title="Compras realizadas" action={`${purchased.length} itens`} />
          <div className="purchased-strip">
            {purchased.map((purchase) => (
              <div className="purchased-item" key={purchase.id}>
                <Check size={16} />
                <span>{purchase.name}</span>
                <strong>{currency.format(purchase.targetPrice)}</strong>
              </div>
            ))}
          </div>
        </section>
      )}

      {showForm && (
        <PurchaseModal
          purchase={editing}
          categories={data.settings.categories}
          onClose={closeForm}
          onSave={(purchase) => {
            onSavePurchase(purchase);
            closeForm();
          }}
        />
      )}

      {confirming && (
        <ConfirmModal
          title="Excluir compra futura?"
          text={`"${confirming.name}" sai da sua galeria de planejamento.`}
          confirmLabel="Excluir"
          onCancel={() => setConfirming(null)}
          onConfirm={() => {
            onDeletePurchase(confirming.id);
            setConfirming(null);
          }}
        />
      )}

      {buying && (
        <ConfirmModal
          title="Registrar produto como comprado?"
          text={`"${buying.name}" será marcado como comprado e uma transação será adicionada ao extrato.`}
          confirmLabel="Registrar compra"
          icon={Check}
          variant="primary"
          onCancel={() => setBuying(null)}
          onConfirm={() => {
            onMarkPurchaseBought(buying);
            setBuying(null);
          }}
        />
      )}

      {linkToOpen && (
        <ConfirmModal
          title="Abrir link do produto?"
          text={`Você será levado ao navegador para acessar "${linkToOpen.purchase.name}".`}
          confirmLabel="Abrir no navegador"
          icon={ExternalLink}
          variant="primary"
          onCancel={() => setLinkToOpen(null)}
          onConfirm={() => {
            window.open(linkToOpen.url, '_blank', 'noopener,noreferrer');
            setLinkToOpen(null);
          }}
        />
      )}

      {missingSite && (
        <ConfirmModal
          title="Nenhum site cadastrado"
          text={`"${missingSite.name}" ainda não tem um link de produto. Ative o modo de edição e adicione um link para abrir pelo card.`}
          confirmLabel="Entendi"
          icon={AlertCircle}
          variant="danger"
          hideCancel
          onCancel={() => setMissingSite(null)}
          onConfirm={() => setMissingSite(null)}
        />
      )}
    </section>
  );
}

function PurchaseCard({
  purchase,
  editMode,
  orderIndex,
  totalPlanned,
  onEdit,
  onDelete,
  onBought,
  onMove,
  onRequestOpenLink,
  onMissingSite,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd
}) {
  const normalizedLink = normalizeExternalLink(purchase.link);
  const handleCardClick = () => {
    if (editMode) {
      onEdit(purchase);
      return;
    }

    if (normalizedLink) {
      onRequestOpenLink({ purchase, url: normalizedLink });
      return;
    }

    onMissingSite(purchase);
  };

  const stopCardClick = (event) => {
    event.stopPropagation();
  };

  return (
    <article
      className={editMode ? 'purchase-card editing' : normalizedLink ? 'purchase-card clickable' : 'purchase-card clickable missing-link'}
      role={editMode ? 'button' : normalizedLink ? 'link' : 'button'}
      tabIndex={0}
      draggable={editMode}
      onClick={handleCardClick}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          handleCardClick();
        }
      }}
      title={editMode ? 'Editar produto' : normalizedLink ? 'Abrir link do produto' : 'Produto sem site cadastrado'}
    >
      <div className="purchase-image">
        {purchase.image ? (
          <img src={purchase.image} alt="" />
        ) : (
          <div className="image-placeholder">
            <Eye size={26} />
          </div>
        )}
        <span className={`priority-chip ${purchase.priority.toLowerCase()}`}>{purchase.priority}</span>
      </div>
      <div className="purchase-body">
        <div>
          <span className="purchase-category">{purchase.category}</span>
          <h3>{purchase.name}</h3>
        </div>
        <strong>{currency.format(purchase.targetPrice)}</strong>
        <p>{purchase.notes || `Preço alvo em ${purchase.store || 'loja a definir'}.`}</p>
        <div className="purchase-footer">
          <span>{normalizedLink ? `${purchase.store || 'Abrir produto'} · link salvo` : purchase.store || 'Loja aberta'}</span>
          <div className="row-actions">
            {editMode && (
              <>
                <button
                  className="icon-button ghost order-button"
                  type="button"
                  title="Mover para trás"
                  aria-label="Mover para trás"
                  disabled={orderIndex <= 0}
                  onClick={(event) => {
                    stopCardClick(event);
                    onMove(purchase.id, -1);
                  }}
                >
                  <ArrowLeft size={17} />
                </button>
                <button
                  className="icon-button ghost order-button"
                  type="button"
                  title="Mover para frente"
                  aria-label="Mover para frente"
                  disabled={orderIndex >= totalPlanned - 1}
                  onClick={(event) => {
                    stopCardClick(event);
                    onMove(purchase.id, 1);
                  }}
                >
                  <ArrowRight size={17} />
                </button>
              </>
            )}
            <button
              className="icon-button ghost"
              type="button"
              title="Registrar compra"
              aria-label="Registrar compra"
              onClick={(event) => {
                stopCardClick(event);
                onBought(purchase);
              }}
            >
              <Check size={17} />
            </button>
            <button
              className="icon-button danger"
              type="button"
              title="Excluir"
              aria-label="Excluir"
              onClick={(event) => {
                stopCardClick(event);
                onDelete();
              }}
            >
              <Trash2 size={17} />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

function PurchaseModal({ purchase, categories, onClose, onSave }) {
  const [form, setForm] = useState(purchase || emptyPurchase);
  const [imageMode, setImageMode] = useState(form.image?.startsWith('data:') ? 'device' : 'url');
  const [imageFileName, setImageFileName] = useState('');
  const fileInputRef = useRef(null);

  const setField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const handleImageFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setField('image', String(reader.result || ''));
      setImageFileName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSave(form);
  };

  return (
    <Modal title={purchase ? 'Editar compra futura' : 'Novo produto planejado'} onClose={onClose}>
      <form className="form-grid" onSubmit={handleSubmit}>
        <label className="field wide-field">
          <span>Produto</span>
          <input required value={form.name} onChange={(event) => setField('name', event.target.value)} placeholder="Ex.: Notebook novo" />
        </label>
        <label className="field">
          <span>Preço alvo</span>
          <input
            required
            min="0"
            step="0.01"
            type="number"
            value={form.targetPrice}
            onChange={(event) => setField('targetPrice', event.target.value)}
          />
        </label>
        <label className="field">
          <span>Prioridade</span>
          <select value={form.priority} onChange={(event) => setField('priority', event.target.value)}>
            <option>Alta</option>
            <option>Média</option>
            <option>Baixa</option>
          </select>
        </label>
        <label className="field">
          <span>Categoria</span>
          <select value={form.category} onChange={(event) => setField('category', event.target.value)}>
            {categories.map((category) => (
              <option value={category} key={category}>
                {category}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Loja</span>
          <input value={form.store} onChange={(event) => setField('store', event.target.value)} placeholder="Loja preferida" />
        </label>
        <label className="field wide-field">
          <span>Link do produto</span>
          <input
            value={form.link || ''}
            onChange={(event) => setField('link', event.target.value)}
            placeholder="https://..."
          />
        </label>
        <div className="field wide-field">
          <div className="field-label-row">
            <span>Imagem</span>
            <button
              className="inline-link-button"
              type="button"
              onClick={() => setImageMode((current) => (current === 'url' ? 'device' : 'url'))}
            >
              {imageMode === 'url' ? 'Prefere escolher do dispositivo?' : 'Prefere usar URL?'}
            </button>
          </div>
          {imageMode === 'url' ? (
            <input value={form.image} onChange={(event) => setField('image', event.target.value)} placeholder="URL da imagem" />
          ) : (
            <div className="device-image-picker">
              <button className="secondary-button" type="button" onClick={() => fileInputRef.current?.click()}>
                <Upload size={18} />
                Escolher imagem do dispositivo
              </button>
              <input ref={fileInputRef} className="hidden-file" type="file" accept="image/*" onChange={handleImageFile} />
              {(imageFileName || form.image) && (
                <span>{imageFileName || 'Imagem escolhida do dispositivo'}</span>
              )}
            </div>
          )}
        </div>
        <label className="field wide-field">
          <span>Observações</span>
          <textarea value={form.notes} onChange={(event) => setField('notes', event.target.value)} placeholder="Condições, links, limites..." />
        </label>
        <div className="form-actions">
          <button className="secondary-button" type="button" onClick={onClose}>
            Cancelar
          </button>
          <button className="primary-button" type="submit">
            <Check size={18} />
            Salvar
          </button>
        </div>
      </form>
    </Modal>
  );
}

function ProjectionPage({ data, metrics }) {
  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey);
  const obligations = useMemo(() => buildProjectedObligations(data.transactions, selectedMonth), [data.transactions, selectedMonth]);
  const totals = obligations.reduce(
    (acc, item) => {
      if (item.type === 'income') acc.income += item.amount;
      if (item.type === 'expense') acc.expense += item.amount;
      if (item.status === 'pending') acc.pending += item.amount;
      return acc;
    },
    { income: 0, expense: 0, pending: 0 }
  );

  return (
    <section className="projection-layout">
      <div className="projection-controls">
        <div>
          <p className="eyebrow">Mês projetado</p>
          <h2>{capitalize(monthLabel(selectedMonth))}</h2>
        </div>
        <MonthPicker value={selectedMonth} onChange={setSelectedMonth} />
      </div>

      <div className="metric-row">
        <StatCard title="Entradas previstas" value={currency.format(totals.income)} detail="Recorrências e pendências" icon={ArrowUpRight} tone="mint" />
        <StatCard title="Saídas previstas" value={currency.format(totals.expense)} detail="Parcelas e contas" icon={ArrowDownRight} tone="coral" />
        <StatCard title="Pendências" value={currency.format(totals.pending)} detail={`${obligations.filter((item) => item.status === 'pending').length} itens`} icon={Clock3} tone="lavender" />
      </div>

      <section className="panel wide">
        <PanelHeader eyebrow="Linha do tempo" title="Compromissos do mês" action={`${obligations.length} previsões`} />
        <div className="timeline-list">
          {obligations.map((item) => (
            <article className="timeline-item" key={item.key}>
              <div className={`timeline-dot ${item.type}`} />
              <div>
                <strong>{item.title}</strong>
                <span>
                  {formatDate(item.date)} · {item.category} · {item.reason}
                </span>
              </div>
              <strong className={item.type === 'income' ? 'amount income' : 'amount expense'}>
                {item.type === 'income' ? '+' : '-'}
                {currency.format(item.amount)}
              </strong>
            </article>
          ))}
          {!obligations.length && <EmptyState icon={CalendarClock} title="Sem previsões para o mês" text="Parcelas, recorrências e pendências aparecem aqui." />}
        </div>
      </section>

      <section className="panel wide">
        <PanelHeader eyebrow="Tendência" title="Saldo acumulado projetado" action="6 meses" />
        <ProjectionChart data={metrics.projection} />
      </section>
    </section>
  );
}

function MonthPicker({ value, onChange }) {
  const [year, month] = value.split('-');

  const update = (field, nextValue) => {
    const nextYear = field === 'year' ? nextValue : year;
    const nextMonth = field === 'month' ? nextValue : month;
    onChange(`${nextYear}-${String(nextMonth).padStart(2, '0')}`);
  };

  return (
    <div className="month-picker">
      <label>
        <span>Mês</span>
        <select value={month} onChange={(event) => update('month', event.target.value)}>
          {Array.from({ length: 12 }, (_, index) => {
            const value = String(index + 1).padStart(2, '0');
            const label = new Date(2026, index, 1).toLocaleDateString('pt-BR', { month: 'long' });
            return (
              <option value={value} key={value}>
                {capitalize(label)}
              </option>
            );
          })}
        </select>
      </label>
      <label>
        <span>Ano</span>
        <input
          type="number"
          min="2020"
          max="2045"
          value={year}
          onChange={(event) => update('year', event.target.value)}
        />
      </label>
    </div>
  );
}

function SettingsPage({ data, onUpdateSettings, onResetData, onClearData, onImportData, storageMeta }) {
  const [categoryText, setCategoryText] = useState(data.settings.categories.join(', '));
  const [accountText, setAccountText] = useState(data.settings.accounts.join(', '));
  const [confirmAction, setConfirmAction] = useState(null);
  const [importError, setImportError] = useState('');
  const [backupMessage, setBackupMessage] = useState('');
  const fileRef = useRef(null);

  const exportData = async () => {
    setImportError('');
    setBackupMessage('');

    const desktopStorage = getDesktopStorage();

    if (desktopStorage?.exportBackup) {
      const result = await desktopStorage.exportBackup(data);

      if (result?.canceled) {
        return;
      }

      if (result?.ok) {
        setBackupMessage(`Backup salvo em: ${result.path}`);
      } else {
        setImportError(result?.error || 'Não foi possível criar o backup.');
      }

      return;
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `finch-backup-${isoToday}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setBackupMessage('Backup exportado pelo navegador.');
  };

  const importFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const nextData = normalizeData(JSON.parse(text));
      onImportData(nextData);
      setCategoryText(nextData.settings.categories.join(', '));
      setAccountText(nextData.settings.accounts.join(', '));
      setImportError('');
    } catch {
      setImportError('Não foi possível importar esse arquivo. Verifique se ele é um backup JSON do finch.');
    }
    event.target.value = '';
  };

  return (
    <section className="settings-layout">
      <section className="panel">
        <PanelHeader eyebrow="Preferências" title="Essenciais" action={data.settings.theme} />
        <div className="settings-form">
          <label className="field">
            <span>Tema</span>
            <select value={data.settings.theme} onChange={(event) => onUpdateSettings({ theme: event.target.value })}>
              <option>iOS claro</option>
              <option>Grafite</option>
              <option>Contraste suave</option>
            </select>
          </label>
          <label className="field">
            <span>Orçamento mensal</span>
            <input
              type="number"
              value={data.settings.monthlyBudget}
              onChange={(event) => onUpdateSettings({ monthlyBudget: Number(event.target.value) })}
            />
          </label>
          <label className="field">
            <span>Salário</span>
            <input
              type="number"
              value={data.settings.salary}
              onChange={(event) => onUpdateSettings({ salary: Number(event.target.value) })}
            />
          </label>
        </div>
      </section>

      <section className="panel">
        <PanelHeader eyebrow="Organização" title="Categorias e contas" action="listas" />
        <div className="settings-form">
          <label className="field wide-field">
            <span>Categorias</span>
            <textarea
              value={categoryText}
              onChange={(event) => setCategoryText(event.target.value)}
              onBlur={() =>
                onUpdateSettings({
                  categories: categoryText
                    .split(',')
                    .map((item) => item.trim())
                    .filter(Boolean)
                })
              }
            />
          </label>
          <label className="field wide-field">
            <span>Contas</span>
            <textarea
              value={accountText}
              onChange={(event) => setAccountText(event.target.value)}
              onBlur={() =>
                onUpdateSettings({
                  accounts: accountText
                    .split(',')
                    .map((item) => item.trim())
                    .filter(Boolean)
                })
              }
            />
          </label>
        </div>
      </section>

      <section className="panel full-width">
        <PanelHeader eyebrow="Dados" title="Backup, importação e limpeza" action="local" />
        <div className="storage-status">
          <ShieldCheck size={18} />
          <div>
            <strong>{storageMeta?.mode === 'browser' ? 'Salvamento no navegador' : 'Salvamento local automático'}</strong>
            <span>
              {storageMeta?.error ||
                storageMeta?.path ||
                'As alterações são salvas automaticamente neste dispositivo.'}
            </span>
          </div>
        </div>
        <div className="data-actions">
          <button className="secondary-button" type="button" onClick={exportData}>
            <Download size={18} />
            Fazer backup
          </button>
          <button className="secondary-button" type="button" onClick={() => fileRef.current?.click()}>
            <Upload size={18} />
            Importar dados
          </button>
          <button className="secondary-button" type="button" onClick={() => setConfirmAction('reset')}>
            <Sparkles size={18} />
            Restaurar exemplo
          </button>
          <button className="danger-button" type="button" onClick={() => setConfirmAction('clear')}>
            <Trash2 size={18} />
            Limpar sistema
          </button>
          <input ref={fileRef} className="hidden-file" type="file" accept="application/json" onChange={importFile} />
        </div>
        {importError && <p className="inline-alert">{importError}</p>}
        {backupMessage && <p className="inline-success">{backupMessage}</p>}
      </section>

      {confirmAction === 'clear' && (
        <ConfirmModal
          title="Limpar sistema?"
          text="Transações e compras futuras serão removidas, mantendo suas categorias, contas e preferências."
          confirmLabel="Limpar"
          onCancel={() => setConfirmAction(null)}
          onConfirm={() => {
            onClearData();
            setConfirmAction(null);
          }}
        />
      )}

      {confirmAction === 'reset' && (
        <ConfirmModal
          title="Restaurar dados de exemplo?"
          text="Os dados atuais serão substituídos pela base demonstrativa do finch."
          confirmLabel="Restaurar"
          onCancel={() => setConfirmAction(null)}
          onConfirm={() => {
            onResetData();
            setCategoryText(seedData.settings.categories.join(', '));
            setAccountText(seedData.settings.accounts.join(', '));
            setConfirmAction(null);
          }}
        />
      )}
    </section>
  );
}

function SegmentedControl({ label, options, value, onChange }) {
  return (
    <div className="segmented-control" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          className={value === option.value ? 'active' : ''}
          type="button"
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div className="modal-backdrop" role="presentation">
      <div className="modal-panel" role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="icon-button ghost" type="button" title="Fechar" aria-label="Fechar" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function UpdateModal({ status, onSnooze, onDismiss, onDownload, onInstallNow, onInstallOnQuit }) {
  const version = status.updateInfo?.version || status.updateInfo?.releaseName || 'nova';
  const progress = Math.round(status.progress?.percent || 0);

  if (status.state === 'downloading') {
    return (
      <div className="modal-backdrop" role="presentation">
        <div className="confirm-panel update-panel" role="dialog" aria-modal="true" aria-label="Baixando atualização">
          <div className="confirm-icon primary">
            <Download size={22} />
          </div>
          <h2>Baixando atualização</h2>
          <p>A versão {version} está sendo baixada em segundo plano.</p>
          <div className="update-progress" aria-label={`Download ${progress}%`}>
            <span style={{ width: `${progress}%` }} />
          </div>
          <strong className="update-percent">{progress}%</strong>
        </div>
      </div>
    );
  }

  if (status.state === 'downloaded') {
    return (
      <div className="modal-backdrop" role="presentation">
        <div className="confirm-panel update-panel" role="dialog" aria-modal="true" aria-label="Atualização pronta">
          <div className="confirm-icon primary">
            <Check size={22} />
          </div>
          <h2>Atualização pronta</h2>
          <p>O Finch já baixou a versão {version}. Você pode reiniciar agora ou deixar para aplicar quando fechar o app.</p>
          <div className="form-actions">
            <button className="secondary-button" type="button" onClick={onInstallOnQuit}>
              Atualizar ao fechar
            </button>
            <button className="primary-button" type="button" onClick={onInstallNow}>
              Reiniciar agora
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (status.state === 'install-on-quit') {
    return (
      <div className="modal-backdrop" role="presentation">
        <div className="confirm-panel update-panel" role="dialog" aria-modal="true" aria-label="Atualização agendada">
          <div className="confirm-icon primary">
            <Clock3 size={22} />
          </div>
          <h2>Atualização agendada</h2>
          <p>Você pode continuar usando o Finch. A nova versão será aplicada quando o app for fechado.</p>
          <div className="form-actions">
            <button className="primary-button" type="button" onClick={onDismiss}>
              Entendi
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (status.state === 'error') {
    return (
      <div className="modal-backdrop" role="presentation">
        <div className="confirm-panel update-panel" role="dialog" aria-modal="true" aria-label="Atualização indisponível">
          <div className="confirm-icon danger">
            <AlertCircle size={22} />
          </div>
          <h2>Não foi possível atualizar</h2>
          <p>{status.error || 'Tente novamente mais tarde.'}</p>
          <div className="form-actions">
            <button className="primary-button" type="button" onClick={onDismiss}>
              Fechar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <div className="confirm-panel update-panel" role="dialog" aria-modal="true" aria-label="Nova atualização disponível">
        <div className="confirm-icon primary">
          <Sparkles size={22} />
        </div>
        <h2>Nova versão disponível</h2>
        <p>A versão {version} do Finch está pronta para baixar. A atualização é opcional e você pode ser lembrado depois.</p>
        <div className="form-actions">
          <button className="secondary-button" type="button" onClick={onSnooze}>
            Lembrar em 24h
          </button>
          <button className="primary-button" type="button" onClick={onDownload}>
            Baixar atualização
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmModal({ title, text, confirmLabel, onCancel, onConfirm, icon: Icon = Trash2, variant = 'danger', hideCancel = false }) {
  return (
    <div className="modal-backdrop" role="presentation">
      <div className="confirm-panel" role="dialog" aria-modal="true" aria-label={title}>
        <div className={`confirm-icon ${variant}`}>
          <Icon size={22} />
        </div>
        <h2>{title}</h2>
        <p>{text}</p>
        <div className="form-actions">
          {!hideCancel && (
            <button className="secondary-button" type="button" onClick={onCancel}>
              Cancelar
            </button>
          )}
          <button className={variant === 'primary' ? 'primary-button' : 'danger-button'} type="button" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, title, text }) {
  return (
    <div className="empty-state">
      <Icon size={26} />
      <strong>{title}</strong>
      <p>{text}</p>
    </div>
  );
}

function calculateMetrics(data) {
  const confirmed = data.transactions.filter((transaction) => transaction.status === 'confirmed');
  const balance = confirmed.reduce((sum, transaction) => {
    return sum + (transaction.type === 'income' ? transaction.amount : -transaction.amount);
  }, 0);
  const monthTransactions = data.transactions.filter((transaction) => monthKey(transaction.date) === currentMonthKey);
  const monthIncome = monthTransactions
    .filter((transaction) => transaction.type === 'income')
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const monthExpense = monthTransactions
    .filter((transaction) => transaction.type === 'expense')
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const futurePurchases = data.purchases.filter((purchase) => purchase.status !== 'purchased');
  const categoryMap = monthTransactions
    .filter((transaction) => transaction.type === 'expense' && transaction.status === 'confirmed')
    .reduce((map, transaction) => {
      map.set(transaction.category, (map.get(transaction.category) || 0) + transaction.amount);
      return map;
    }, new Map());

  return {
    balance,
    monthIncome,
    monthExpense,
    monthNet: monthIncome - monthExpense,
    budgetUsed: data.settings.monthlyBudget ? (monthExpense / data.settings.monthlyBudget) * 100 : 0,
    futurePurchasesTotal: futurePurchases.reduce((sum, purchase) => sum + Number(purchase.targetPrice), 0),
    futurePurchasesCount: futurePurchases.length,
    pendingCount: data.transactions.filter((transaction) => transaction.status === 'pending').length,
    categoryBreakdown: Array.from(categoryMap, ([category, total]) => ({ category, total })).sort((a, b) => b.total - a.total),
    projection: buildProjection(data.transactions, balance)
  };
}

function buildProjection(transactions, startingBalance) {
  return Array.from({ length: 6 }, (_, index) => {
    const date = addMonths(today, index);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const obligations = buildProjectedObligations(transactions, key).filter(
      (transaction) => !(index === 0 && transaction.status === 'confirmed')
    );
    const net = obligations.reduce((sum, transaction) => {
      return sum + (transaction.type === 'income' ? transaction.amount : -transaction.amount);
    }, 0);
    return { key, net, balance: startingBalance + net };
  }).reduce((list, item, index) => {
    const previous = index === 0 ? startingBalance : list[index - 1].balance;
    list.push({ ...item, balance: previous + item.net });
    return list;
  }, []);
}

function buildProjectedObligations(transactions, selectedMonth) {
  const [year, month] = selectedMonth.split('-').map(Number);
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0);

  return transactions
    .flatMap((transaction) => expandTransaction(transaction, monthStart, monthEnd, selectedMonth))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function expandTransaction(transaction, monthStart, monthEnd, selectedMonth) {
  const baseDate = new Date(`${transaction.date}T12:00:00`);
  const selectedStart = monthStart;
  const monthsApart = (selectedStart.getFullYear() - baseDate.getFullYear()) * 12 + selectedStart.getMonth() - baseDate.getMonth();
  const directMonth = monthKey(transaction.date) === selectedMonth;
  const items = [];

  if (directMonth) {
    items.push({
      ...transaction,
      key: `${transaction.id}-direct`,
      reason: transaction.recurring ? 'recorrência original' : Number(transaction.installments) > 1 ? 'parcela inicial' : 'lançamento'
    });
  }

  if (transaction.recurring && monthsApart > 0) {
    const date = new Date(monthStart.getFullYear(), monthStart.getMonth(), Math.min(baseDate.getDate(), monthEnd.getDate()));
    items.push({
      ...transaction,
      key: `${transaction.id}-recurring-${selectedMonth}`,
      date: toISODate(date),
      status: 'pending',
      reason: 'recorrência prevista'
    });
  }

  const installments = Number(transaction.installments || 1);
  if (installments > 1 && monthsApart > 0 && monthsApart < installments) {
    const date = new Date(monthStart.getFullYear(), monthStart.getMonth(), Math.min(baseDate.getDate(), monthEnd.getDate()));
    items.push({
      ...transaction,
      key: `${transaction.id}-installment-${monthsApart + 1}`,
      date: toISODate(date),
      status: 'pending',
      amount: transaction.amount,
      reason: `parcela ${monthsApart + 1} de ${installments}`
    });
  }

  return items;
}

function formatDate(value) {
  return new Date(`${value}T12:00:00`).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

function normalizeExternalLink(value) {
  const trimmed = String(value || '').trim();

  if (!trimmed) return '';

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

function insertDraggedId(ids, draggedId, insertIndex) {
  const withoutDragged = ids.filter((id) => id !== draggedId);
  const safeIndex = Math.max(0, Math.min(insertIndex, withoutDragged.length));
  const next = [...withoutDragged];
  next.splice(safeIndex, 0, draggedId);
  return next;
}

createRoot(document.getElementById('root')).render(<App />);
