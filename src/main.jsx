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
import packageJson from '../package.json';
import './styles.css';

const STORAGE_KEY = 'finch:data:v1';
const UPDATE_SNOOZE_KEY = 'finch:update-snoozed-until';
const LOGO_URL = `${import.meta.env.BASE_URL}finch-logo.svg`;
const APP_VERSION = packageJson.version;
const OFFICIAL_VERSION = '0.1.10';
const IS_LOCAL_BUILD = import.meta.env.DEV;
const APP_CHANNEL = IS_LOCAL_BUILD ? 'Alpha local' : 'Estável';

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
    welcomeCompleted: false,
    tutorialCompleted: false,
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
  ],
  goals: [
    {
      id: 'goal-trip',
      title: 'Viagem',
      targetAmount: 5200,
      savedAmount: 1350,
      priority: 'Alta',
      horizon: 'Médio prazo',
      deadline: 'Dezembro',
      notes: 'Passagens, hospedagem e passeios.',
      status: 'active',
      createdAt: isoToday
    },
    {
      id: 'goal-reserve',
      title: 'Reserva financeira',
      targetAmount: 9000,
      savedAmount: 2400,
      priority: 'Média',
      horizon: 'Longo prazo',
      deadline: '12 meses',
      notes: 'Criar tranquilidade para imprevistos.',
      status: 'active',
      createdAt: isoToday
    },
    {
      id: 'goal-setup',
      title: 'Setup novo',
      targetAmount: 3800,
      savedAmount: 620,
      priority: 'Baixa',
      horizon: 'Curto prazo',
      deadline: 'Sem pressa',
      notes: 'Mesa, cadeira e periféricos.',
      status: 'active',
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
  purchases: [],
  goals: []
});

const onboardingCategoryOptions = [
  'Moradia',
  'Mercado',
  'Transporte',
  'Lazer',
  'Saúde',
  'Educação',
  'Compras',
  'Tecnologia',
  'Viagem',
  'Assinaturas',
  'Restaurantes',
  'Pets',
  'Investimentos',
  'Presentes'
];

const onboardingGoalOptions = [
  'Organizar meu dinheiro',
  'Reduzir gastos',
  'Planejar compras futuras',
  'Criar reserva financeira',
  'Acompanhar parcelas e compromissos'
];

const navItems = [
  { id: 'overview', label: 'Visão geral', icon: LayoutDashboard },
  { id: 'wallet', label: 'Carteira / Extrato', icon: WalletCards },
  { id: 'future', label: 'Futuro', icon: GalleryHorizontalEnd },
  { id: 'projection', label: 'Projeções', icon: CalendarClock },
  { id: 'settings', label: 'Configurações', icon: Settings }
];

const tutorialSteps = [
  {
    page: 'overview',
    eyebrow: 'Guia 1 de 5',
    title: 'Visão geral',
    text: 'Aqui fica o painel rápido do seu momento financeiro: saldo, entradas, saídas, orçamento, categorias e transações recentes.',
    bullets: ['Use os cards para entender o mês sem abrir relatórios.', 'O gráfico mostra a projeção dos próximos meses.', 'As pendências aparecem no topo para você revisar depois.']
  },
  {
    page: 'wallet',
    eyebrow: 'Guia 2 de 5',
    title: 'Carteira / Extrato',
    text: 'Este é o lugar para registrar e revisar movimentações reais.',
    bullets: ['Novo lançamento cria uma entrada ou saída.', 'Busca e filtros ajudam a encontrar compras antigas.', 'Você pode confirmar, editar ou excluir uma transação quando precisar.']
  },
  {
    page: 'future',
    eyebrow: 'Guia 3 de 5',
    title: 'Futuro',
    text: 'Aqui entram compras planejadas e metas. É o espaço para organizar desejos antes de gastar.',
    bullets: ['Novo produto salva uma compra futura com preço, loja, imagem e prioridade.', 'Nova meta cria objetivos como viagem, reserva ou algum item grande.', 'O botão Editar libera edição e reordenação arrastando os cards.']
  },
  {
    page: 'projection',
    eyebrow: 'Guia 4 de 5',
    title: 'Projeções',
    text: 'Nesta guia você escolhe mês e ano para ver compromissos previstos.',
    bullets: ['Use mês e ano para navegar livremente no futuro.', 'Parcelas e recorrências aparecem como previsões.', 'O orçamento mensal ajuda a comparar o planejado com o limite desejado.']
  },
  {
    page: 'settings',
    eyebrow: 'Guia 5 de 5',
    title: 'Configurações',
    text: 'Aqui ficam os ajustes importantes e as opções de segurança dos dados.',
    bullets: ['Tema muda a aparência do Finch.', 'Categorias e contas personalizam os formulários.', 'Backup, importação e limpeza ficam reunidos nesta tela.']
  }
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

const emptyGoal = {
  title: '',
  targetAmount: '',
  savedAmount: '',
  priority: 'Média',
  horizon: 'Médio prazo',
  deadline: '',
  notes: '',
  status: 'active'
};

function normalizeData(data) {
  const settings = { ...seedData.settings, ...data?.settings };
  settings.theme = themeAliases[settings.theme] || (supportedThemes.includes(settings.theme) ? settings.theme : seedData.settings.theme);
  settings.onboardingCompleted =
    data?.settings?.onboardingCompleted ?? Boolean(data?.transactions?.length || data?.purchases?.length);
  settings.welcomeCompleted =
    data?.settings?.welcomeCompleted ?? Boolean(settings.onboardingCompleted);
  settings.tutorialCompleted =
    data?.settings?.tutorialCompleted ?? Boolean(settings.onboardingCompleted);
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
    purchases,
    goals: Array.isArray(data?.goals) ? data.goals : []
  };
}

function getDesktopStorage() {
  return typeof window !== 'undefined' ? window.finchStorage : null;
}

function getUpdateService() {
  return typeof window !== 'undefined' ? window.finchUpdates : null;
}

function isBrowserTestMode() {
  return import.meta.env.DEV && !getDesktopStorage();
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
  if (isBrowserTestMode()) {
    localStorage.removeItem(STORAGE_KEY);
    return createEmptyData();
  }

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
  const [guidedOverlay, setGuidedOverlay] = useState(null);
  const [tutorialActive, setTutorialActive] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [updateState, setUpdateState] = useState(null);
  const updateWasRequestedRef = useRef(false);

  useEffect(() => {
    const desktopStorage = getDesktopStorage();

    if (!desktopStorage?.loadData) {
      if (isBrowserTestMode()) {
        localStorage.removeItem(STORAGE_KEY);
        setData(createEmptyData());
        setShowOnboarding(true);
        setGuidedOverlay(null);
        setTutorialActive(false);
        setStorageMeta({
          mode: 'browser-test',
          path: '',
          error: ''
        });
      }

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
    if (isBrowserTestMode()) return;

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

  const saveGoal = (goal) => {
    setData((current) => {
      const payload = {
        ...goal,
        targetAmount: Number(goal.targetAmount),
        savedAmount: Number(goal.savedAmount || 0),
        createdAt: goal.createdAt || isoToday
      };

      if (payload.id) {
        return {
          ...current,
          goals: current.goals.map((item) => (item.id === payload.id ? payload : item))
        };
      }

      return {
        ...current,
        goals: [{ ...payload, id: uid() }, ...current.goals]
      };
    });
  };

  const deleteGoal = (id) => {
    setData((current) => ({
      ...current,
      goals: current.goals.filter((goal) => goal.id !== id)
    }));
  };

  const reorderGoals = (orderedIds) => {
    setData((current) => {
      const byId = new Map(current.goals.map((goal) => [goal.id, goal]));
      const knownIds = new Set(orderedIds);
      const ordered = orderedIds.map((id) => byId.get(id)).filter(Boolean);
      const remaining = current.goals.filter((goal) => !knownIds.has(goal.id));

      return {
        ...current,
        goals: [...ordered, ...remaining]
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

  const resetData = () =>
    setData({ ...seedData, settings: { ...seedData.settings, onboardingCompleted: true, welcomeCompleted: true, tutorialCompleted: true } });

  const clearData = (options = { transactions: true, purchases: true, goals: true }) => {
    setData((current) => ({
      ...current,
      settings: {
        ...current.settings,
        ...(options.categories ? { categories: seedData.settings.categories } : {}),
        ...(options.accounts ? { accounts: seedData.settings.accounts } : {}),
        ...(options.salary ? { salary: 0, salaryIsVariable: false } : {}),
        ...(options.budget ? { monthlyBudget: 0 } : {}),
        ...(options.preferences
          ? {
              theme: seedData.settings.theme,
              userName: '',
              planningGoal: seedData.settings.planningGoal,
              onboardingCompleted: true,
              welcomeCompleted: true
            }
          : {})
      },
      transactions: options.transactions ? [] : current.transactions,
      purchases: options.purchases ? [] : current.purchases,
      goals: options.goals ? [] : current.goals
    }));
  };

  const importData = (payload) => setData(normalizeData(payload));

  const completeOnboarding = (settings) => {
    setData(createEmptyData({ ...settings, onboardingCompleted: true, welcomeCompleted: false, tutorialCompleted: false }));
    setShowOnboarding(false);
    setGuidedOverlay('welcome');
  };

  const closeWelcome = () => {
    setGuidedOverlay(null);
    updateSettings({ welcomeCompleted: true });
  };

  const startTutorial = () => {
    setGuidedOverlay('tutorial');
    updateSettings({ welcomeCompleted: true, tutorialCompleted: false });
    setTutorialStep(0);
    setActivePage(tutorialSteps[0].page);
    setTutorialActive(true);
  };

  const showWelcome = () => {
    setGuidedOverlay('welcome');
    setTutorialActive(false);
    updateSettings({ welcomeCompleted: false });
  };

  const finishTutorial = () => {
    setGuidedOverlay(null);
    setTutorialActive(false);
    setTutorialStep(0);
    updateSettings({ welcomeCompleted: true, tutorialCompleted: true });
  };

  const advanceTutorial = () => {
    const nextStep = tutorialStep + 1;

    if (nextStep >= tutorialSteps.length) {
      finishTutorial();
      return;
    }

    setTutorialStep(nextStep);
    setActivePage(tutorialSteps[nextStep].page);
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
        <OnboardingPage
          theme={data.settings.theme}
          onThemeChange={(theme) => updateSettings({ theme })}
          onComplete={completeOnboarding}
        />
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
              onSaveGoal={saveGoal}
              onDeleteGoal={deleteGoal}
              onReorderGoals={reorderGoals}
              onUpdateSettings={updateSettings}
              onResetData={resetData}
              onClearData={clearData}
              onImportData={importData}
              onStartTutorial={startTutorial}
              onShowWelcome={showWelcome}
              storageMeta={storageMeta}
            />
          </main>
          {((guidedOverlay === 'welcome') || (!data.settings.welcomeCompleted && !tutorialActive)) && (
            <WelcomeOverlay
              userName={data.settings.userName}
              onStartTutorial={startTutorial}
              onSkip={closeWelcome}
            />
          )}
          {(guidedOverlay === 'tutorial' || tutorialActive) && (
            <TutorialOverlay
              step={tutorialSteps[tutorialStep]}
              stepIndex={tutorialStep}
              totalSteps={tutorialSteps.length}
              onNext={advanceTutorial}
              onSkip={finishTutorial}
            />
          )}
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

function WelcomeOverlay({ userName, onStartTutorial, onSkip }) {
  const displayName = userName?.trim() || 'bem-vindo';

  return (
    <div className="modal-backdrop welcome-backdrop" role="presentation">
      <section className="welcome-panel" role="dialog" aria-modal="true" aria-label="Boas-vindas ao Finch">
        <div className="welcome-hero">
          <LogoMark />
          <span className="eyebrow">Tudo pronto</span>
        </div>
        <h2>{displayName}, seu Finch está preparado.</h2>
        <p>
          Agora você pode registrar movimentações, planejar compras, criar metas e olhar para os próximos meses com mais clareza.
        </p>
        <div className="welcome-feature-grid">
          <div>
            <LayoutDashboard size={18} />
            <strong>Resumo limpo</strong>
            <span>Veja saldo, entradas, saídas e orçamento sem se perder.</span>
          </div>
          <div>
            <GalleryHorizontalEnd size={18} />
            <strong>Futuro organizado</strong>
            <span>Separe desejos, produtos e metas antes de decidir gastar.</span>
          </div>
          <div>
            <CalendarClock size={18} />
            <strong>Projeções</strong>
            <span>Escolha qualquer mês para entender compromissos futuros.</span>
          </div>
        </div>
        <div className="form-actions">
          <button className="secondary-button" type="button" onClick={onSkip}>
            Explorar sozinho
          </button>
          <button className="primary-button" type="button" onClick={onStartTutorial}>
            <Sparkles size={18} />
            Fazer tutorial
          </button>
        </div>
      </section>
    </div>
  );
}

function TutorialOverlay({ step, stepIndex, totalSteps, onNext, onSkip }) {
  const isLast = stepIndex === totalSteps - 1;

  return (
    <div className="tutorial-layer" role="presentation">
      <section className="tutorial-panel" role="dialog" aria-modal="true" aria-label={`Tutorial: ${step.title}`}>
        <div className="tutorial-header">
          <span className="eyebrow">{step.eyebrow}</span>
          <div className="tutorial-dots" aria-hidden="true">
            {Array.from({ length: totalSteps }, (_, index) => (
              <span className={index <= stepIndex ? 'active' : ''} key={index} />
            ))}
          </div>
        </div>
        <h2>{step.title}</h2>
        <p>{step.text}</p>
        <ul>
          {step.bullets.map((bullet) => (
            <li key={bullet}>
              <Check size={15} />
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
        <div className="tutorial-actions">
          <button className="secondary-button" type="button" onClick={onSkip}>
            Pular tutorial
          </button>
          <button className="primary-button" type="button" onClick={onNext}>
            {isLast ? 'Finalizar' : 'Entendi'}
            {!isLast && <ArrowRight size={18} />}
          </button>
        </div>
      </section>
    </div>
  );
}

function OnboardingPage({ theme, onThemeChange, onComplete }) {
  const steps = [
    { title: 'Boas-vindas', text: 'Seu nome e objetivo' },
    { title: 'Renda', text: 'Base do planejamento' },
    { title: 'Categorias', text: 'Sua rotina financeira' },
    { title: 'Pronto', text: 'Começar limpo' }
  ];
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    userName: '',
    salary: '',
    salaryIsVariable: false,
    monthlyBudget: '',
    mainAccount: '',
    planningGoal: 'Organizar meu dinheiro',
    categories: seedData.settings.categories
  });
  const [customCategory, setCustomCategory] = useState('');

  const canContinue = step !== 0 || form.userName.trim().length >= 2;
  const salary = form.salaryIsVariable ? 0 : Number(form.salary || 0);
  const suggestedBudget = form.monthlyBudget ? Number(form.monthlyBudget) : Math.round(salary * 0.75);
  const progress = ((step + 1) / steps.length) * 100;

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const toggleCategory = (category) => {
    setForm((current) => {
      const selected = current.categories.includes(category);
      const categories = selected
        ? current.categories.filter((item) => item !== category)
        : [...current.categories, category];

      return { ...current, categories };
    });
  };

  const addCustomCategory = () => {
    const category = customCategory.trim();
    if (!category) return;

    setForm((current) => ({
      ...current,
      categories: current.categories.includes(category) ? current.categories : [...current.categories, category]
    }));
    setCustomCategory('');
  };

  const finish = () => {
    if (form.userName.trim().length < 2) return;

    onComplete({
      userName: form.userName.trim(),
      theme,
      salary,
      salaryIsVariable: form.salaryIsVariable,
      monthlyBudget: Math.max(0, suggestedBudget || 0),
      planningGoal: form.planningGoal,
      categories: form.categories.length ? form.categories : seedData.settings.categories,
      accounts: form.mainAccount.trim() ? [form.mainAccount.trim(), ...seedData.settings.accounts] : seedData.settings.accounts
    });
  };

  const nextStep = () => {
    if (!canContinue) return;
    if (step === steps.length - 1) {
      finish();
      return;
    }

    setStep((current) => Math.min(steps.length - 1, current + 1));
  };

  const previousStep = () => {
    setStep((current) => Math.max(0, current - 1));
  };

  return (
    <main className="onboarding-shell">
      <section className="onboarding-card stepped">
        <div className="onboarding-side">
          <div className="onboarding-brand">
            <LogoMark />
            <div>
              <p className="brand-name">finch</p>
              <span>Seu dinheiro, seu futuro.</span>
            </div>
          </div>

          <button
            className="onboarding-theme-toggle"
            type="button"
            onClick={() => onThemeChange(theme === 'Grafite' ? 'iOS claro' : 'Grafite')}
          >
            {theme === 'Grafite' ? 'Usar tema claro' : 'Usar tema escuro'}
          </button>
          <div className="step-track" aria-label="Etapas da introdução">
            {steps.map((item, index) => (
              <button
                key={item.title}
                className={index === step ? 'step-item active' : index < step ? 'step-item done' : 'step-item'}
                type="button"
                onClick={() => {
                  if (index <= step || form.userName.trim().length >= 2) {
                    setStep(index);
                  }
                }}
              >
                <span>{index < step ? <Check size={14} /> : index + 1}</span>
                <strong>{item.title}</strong>
                <small>{item.text}</small>
              </button>
            ))}
          </div>
        </div>

        <div className="onboarding-stage">
          <div className="onboarding-progress" aria-hidden="true">
            <span style={{ width: `${progress}%` }} />
          </div>

          {step === 0 && (
            <div className="onboarding-step" key="intro">
              <div className="onboarding-copy">
                <p className="eyebrow">Etapa 1 de 4</p>
                <h1>Vamos deixar o Finch com a sua cara.</h1>
                <p>Começamos pelo básico: seu nome e o que você quer organizar primeiro.</p>
              </div>

              <div className="onboarding-form single">
                <label className="field-pop">
                  <span>Como podemos chamar você?</span>
                  <input
                    value={form.userName}
                    onChange={(event) => updateField('userName', event.target.value)}
                    placeholder="Ex.: João"
                    autoFocus
                  />
                </label>

                <div className="goal-picker field-pop delay-1">
                  <span>Seu foco agora</span>
                  <div>
                    {onboardingGoalOptions.map((goal) => (
                      <button
                        key={goal}
                        className={form.planningGoal === goal ? 'goal-option selected' : 'goal-option'}
                        type="button"
                        onClick={() => updateField('planningGoal', goal)}
                      >
                        {form.planningGoal === goal && <Check size={15} />}
                        {goal}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="onboarding-step" key="money">
              <div className="onboarding-copy">
                <p className="eyebrow">Etapa 2 de 4</p>
                <h1>Qual é a sua base mensal?</h1>
                <p>Isso ajuda o Finch a calcular orçamento e projeções sem julgamento, só clareza.</p>
              </div>

              <div className="onboarding-form">
                <label className="field-pop">
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

                <label className="field-pop delay-1">
                  <span>Orçamento mensal para acompanhar</span>
                  <input
                    type="number"
                    min="0"
                    value={form.monthlyBudget}
                    onChange={(event) => updateField('monthlyBudget', event.target.value)}
                    placeholder={salary ? `Sugestão: ${Math.round(salary * 0.75)}` : 'Ex.: 2500'}
                  />
                </label>

                <label className="field-pop delay-2">
                  <span>Conta principal</span>
                  <input
                    value={form.mainAccount}
                    onChange={(event) => updateField('mainAccount', event.target.value)}
                    placeholder="Ex.: Nubank, Inter, Carteira"
                  />
                </label>

                <label className="check-row field-pop delay-3">
                  <input
                    type="checkbox"
                    checked={form.salaryIsVariable}
                    onChange={(event) => updateField('salaryIsVariable', event.target.checked)}
                  />
                  <span>Meu salário não é fixo, pular por enquanto</span>
                </label>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="onboarding-step" key="categories">
              <div className="onboarding-copy">
                <p className="eyebrow">Etapa 3 de 4</p>
                <h1>Quais categorias fazem sentido para você?</h1>
                <p>Escolha as áreas que aparecem na sua rotina. Dá para editar tudo depois.</p>
              </div>

              <div className="onboarding-categories field-pop">
                <div className="category-picker">
                  {onboardingCategoryOptions.map((category, index) => (
                    <button
                      key={category}
                      className={form.categories.includes(category) ? 'category-chip selected' : 'category-chip'}
                      style={{ '--delay': `${index * 22}ms` }}
                      type="button"
                      onClick={() => toggleCategory(category)}
                    >
                      {form.categories.includes(category) && <Check size={14} />}
                      {category}
                    </button>
                  ))}
                </div>
                <div className="custom-category-row">
                  <input
                    value={customCategory}
                    onChange={(event) => setCustomCategory(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        addCustomCategory();
                      }
                    }}
                    placeholder="Adicionar categoria manualmente"
                  />
                  <button className="secondary-button" type="button" onClick={addCustomCategory}>
                    Adicionar
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="onboarding-step" key="finish">
              <div className="onboarding-copy">
                <p className="eyebrow">Etapa 4 de 4</p>
                <h1>Tudo pronto para começar.</h1>
                <p>O Finch vai abrir limpo, com suas categorias e preferências iniciais preparadas.</p>
              </div>

              <div className="onboarding-summary">
                <div className="summary-tile field-pop">
                  <span>Nome</span>
                  <strong>{form.userName || 'Você'}</strong>
                </div>
                <div className="summary-tile field-pop delay-1">
                  <span>Renda</span>
                  <strong>{form.salaryIsVariable ? 'Variável' : salary ? currency.format(salary) : 'Não informada'}</strong>
                </div>
                <div className="summary-tile field-pop delay-2">
                  <span>Categorias</span>
                  <strong>{form.categories.length}</strong>
                </div>
              </div>
            </div>
          )}

          <div className="onboarding-actions">
            <button className="secondary-button" type="button" disabled={step === 0} onClick={previousStep}>
              Voltar
            </button>
            <button className="primary-button" type="button" disabled={!canContinue} onClick={nextStep}>
              {step === steps.length - 1 ? 'Começar' : 'Continuar'}
            </button>
          </div>
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

function FuturePurchasesPage({
  data,
  onSavePurchase,
  onDeletePurchase,
  onMarkPurchaseBought,
  onReorderPurchases,
  onSaveGoal,
  onDeleteGoal,
  onReorderGoals
}) {
  const [futureView, setFutureView] = useState('purchases');
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [confirming, setConfirming] = useState(null);
  const [linkToOpen, setLinkToOpen] = useState(null);
  const [buying, setBuying] = useState(null);
  const [missingSite, setMissingSite] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [dragState, setDragState] = useState({ draggedId: '', overId: '' });

  const planned = data.purchases.filter((purchase) => purchase.status !== 'purchased');
  const purchased = data.purchases.filter((purchase) => purchase.status === 'purchased');
  const plannedById = useMemo(() => new Map(planned.map((purchase) => [purchase.id, purchase])), [planned]);
  const plannedIds = useMemo(() => planned.map((purchase) => purchase.id), [planned]);

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

    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', purchase.id);
    setDragState({ draggedId: purchase.id, overId: '' });
  };

  const dragOverPurchase = (event, purchaseId) => {
    if (!editMode || !dragState.draggedId) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';

    setDragState((current) =>
      current.overId === purchaseId ? current : { ...current, overId: purchaseId }
    );
  };

  const moveDragOverGrid = (event) => {
    if (!editMode || !dragState.draggedId) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';

    if (event.target === event.currentTarget) {
      setDragState((current) => (current.overId ? { ...current, overId: '' } : current));
    }
  };

  const finishDrop = (event, dropTargetId = '') => {
    event.preventDefault();
    event.stopPropagation();

    if (!editMode || !dragState.draggedId) {
      setDragState({ draggedId: '', overId: '' });
      return;
    }

    const draggedId = event.dataTransfer.getData('text/plain') || dragState.draggedId;
    const targetId = dropTargetId || dragState.overId;

    if (targetId && draggedId !== targetId) {
      onReorderPurchases(swapIds(plannedIds, draggedId, targetId));
    }

    setDragState({ draggedId: '', overId: '' });
  };

  const endDrag = () => {
    setDragState({ draggedId: '', overId: '' });
  };

  const toggleEditMode = () => {
    setEditMode((current) => !current);
    setDragState({ draggedId: '', overId: '' });
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
      <FutureSpotlightNav activeView={futureView} onChange={setFutureView} />

      {futureView === 'goals' ? (
        <GoalsView
          goals={data.goals}
          onSaveGoal={onSaveGoal}
          onDeleteGoal={onDeleteGoal}
          onReorderGoals={onReorderGoals}
        />
      ) : (
        <>
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
        {plannedIds.map((purchaseId) => {
          const purchase = plannedById.get(purchaseId);
          if (!purchase) return null;

          return (
            <PurchaseCard
              key={purchase.id}
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
              onDragEnter={(event) => dragOverPurchase(event, purchase.id)}
              onDragOver={(event) => dragOverPurchase(event, purchase.id)}
              onDrop={(event) => finishDrop(event, purchase.id)}
              onDragEnd={endDrag}
              isDragging={dragState.draggedId === purchase.id}
              isDropTarget={dragState.draggedId && dragState.draggedId !== purchase.id && dragState.overId === purchase.id}
            />
          );
        })}
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
        </>
      )}
    </section>
  );
}

function FutureSpotlightNav({ activeView, onChange }) {
  const options = [
    { id: 'purchases', label: 'Compras planejadas', eyebrow: 'produtos e desejos' },
    { id: 'goals', label: 'Metas', eyebrow: 'planos maiores' }
  ];

  return (
    <div className={`future-spotlight ${activeView}`} aria-label="Seções do futuro">
      {options.map((option) => {
        const active = activeView === option.id;
        return (
          <button
            key={option.id}
            className={active ? 'spotlight-item active' : 'spotlight-item'}
            type="button"
            onClick={() => onChange(option.id)}
          >
            <span>{option.eyebrow}</span>
            <strong>{option.label}</strong>
          </button>
        );
      })}
    </div>
  );
}

function GoalsView({ goals, onSaveGoal, onDeleteGoal, onReorderGoals }) {
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [confirming, setConfirming] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [dragState, setDragState] = useState({ draggedId: '', overId: '' });
  const goalIds = goals.map((goal) => goal.id);
  const goalById = useMemo(() => new Map(goals.map((goal) => [goal.id, goal])), [goals]);

  const openForm = (goal = null) => {
    setEditing(goal);
    setShowForm(true);
  };

  const closeForm = () => {
    setEditing(null);
    setShowForm(false);
  };

  const beginDrag = (event, goal) => {
    if (!editMode || goals.length < 2) {
      event.preventDefault();
      return;
    }

    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', goal.id);
    setDragState({ draggedId: goal.id, overId: '' });
  };

  const dragOverGoal = (event, goalId) => {
    if (!editMode || !dragState.draggedId) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';

    setDragState((current) =>
      current.overId === goalId ? current : { ...current, overId: goalId }
    );
  };

  const finishDrop = (event, goalId = '') => {
    event.preventDefault();
    event.stopPropagation();

    if (!editMode || !dragState.draggedId) {
      setDragState({ draggedId: '', overId: '' });
      return;
    }

    const draggedId = event.dataTransfer.getData('text/plain') || dragState.draggedId;
    const targetId = goalId || dragState.overId;

    if (targetId && draggedId !== targetId) {
      onReorderGoals(swapIds(goalIds, draggedId, targetId));
    }

    setDragState({ draggedId: '', overId: '' });
  };

  const finishDrag = () => {
    setDragState({ draggedId: '', overId: '' });
  };

  const toggleEditMode = () => {
    setEditMode((current) => !current);
    finishDrag();
  };

  const moveGoalByStep = (goalId, step) => {
    const currentIndex = goalIds.indexOf(goalId);
    const nextIndex = currentIndex + step;
    if (currentIndex === -1 || nextIndex < 0 || nextIndex >= goalIds.length) return;

    const nextIds = [...goalIds];
    const [item] = nextIds.splice(currentIndex, 1);
    nextIds.splice(nextIndex, 0, item);
    onReorderGoals(nextIds);
  };

  return (
    <div className="goals-view">
      <div className="toolbar-line">
        <div className="section-intro">
          <p className="eyebrow">Metas financeiras</p>
          <h2>Organize o que você quer construir.</h2>
        </div>
        <div className="future-actions">
          <button className={editMode ? 'primary-button' : 'secondary-button'} type="button" onClick={toggleEditMode}>
            {editMode ? <Check size={18} /> : <Edit3 size={18} />}
            {editMode ? 'Concluir' : 'Editar'}
          </button>
          <button className="primary-button" type="button" onClick={() => openForm()}>
            <Plus size={18} />
            Nova meta
          </button>
        </div>
      </div>

      <div
        className={dragState.draggedId ? 'goal-grid dragging-active' : 'goal-grid'}
        onDragOver={(event) => {
          if (!editMode || !dragState.draggedId) return;
          event.preventDefault();
          event.dataTransfer.dropEffect = 'move';
        }}
        onDrop={finishDrop}
      >
        {goalIds.map((goalId) => {
          const goal = goalById.get(goalId);
          if (!goal) return null;
          const progress = Math.min(100, Math.round((Number(goal.savedAmount) / Math.max(1, Number(goal.targetAmount))) * 100));
          return (
            <GoalCard
                key={goal.id}
                goal={goal}
                progress={progress}
                editMode={editMode}
                orderIndex={goalIds.indexOf(goal.id)}
                totalGoals={goalIds.length}
                onEdit={openForm}
                onDelete={() => setConfirming(goal)}
                onMove={moveGoalByStep}
                onDragStart={(event) => beginDrag(event, goal)}
                onDragEnter={(event) => dragOverGoal(event, goal.id)}
                onDragOver={(event) => dragOverGoal(event, goal.id)}
                onDrop={(event) => finishDrop(event, goal.id)}
                onDragEnd={finishDrag}
                isDragging={dragState.draggedId === goal.id}
                isDropTarget={dragState.draggedId && dragState.draggedId !== goal.id && dragState.overId === goal.id}
              />
          );
        })}
      </div>

      {!goals.length && (
        <section className="panel full-width">
          <EmptyState icon={Target} title="Nenhuma meta ainda" text="Crie uma meta para juntar dinheiro, planejar uma viagem ou acompanhar uma conquista." />
        </section>
      )}

      {showForm && (
        <GoalModal
          goal={editing}
          onClose={closeForm}
          onSave={(goal) => {
            onSaveGoal(goal);
            closeForm();
          }}
        />
      )}

      {confirming && (
        <ConfirmModal
          title="Excluir meta?"
          text={`"${confirming.title}" será removida do seu planejamento.`}
          confirmLabel="Excluir"
          onCancel={() => setConfirming(null)}
          onConfirm={() => {
            onDeleteGoal(confirming.id);
            setConfirming(null);
          }}
        />
      )}

    </div>
  );
}

function GoalCard({
  goal,
  progress,
  editMode,
  orderIndex,
  totalGoals,
  onEdit,
  onDelete,
  onMove,
  onDragStart,
  onDragEnter,
  onDragOver,
  onDrop,
  onDragEnd,
  isDragging,
  isDropTarget
}) {
  const cardClassName = [
    'goal-card',
    `priority-${goal.priority.toLowerCase()}`,
    `horizon-${goal.horizon.toLowerCase().replace(/\s+/g, '-')}`,
    isDragging ? 'dragging' : '',
    isDropTarget ? 'drop-target' : ''
  ].filter(Boolean).join(' ');

  return (
    <article
      className={cardClassName}
      draggable={editMode}
      onClick={() => editMode && onEdit(goal)}
      onDragStart={onDragStart}
      onDragEnter={onDragEnter}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
    >
      <div className="goal-card-top">
        <span className={`priority-chip ${goal.priority.toLowerCase()}`}>{goal.priority}</span>
        <span className="goal-horizon">{goal.horizon}</span>
      </div>
      <div>
        <p className="eyebrow">{goal.deadline || 'Sem prazo'}</p>
        <h3>{goal.title}</h3>
      </div>
      <strong>{currency.format(Number(goal.savedAmount || 0))}</strong>
      <span>de {currency.format(Number(goal.targetAmount || 0))}</span>
      <div className="goal-progress">
        <span style={{ width: `${progress}%` }} />
      </div>
      <small>{progress}% concluído</small>
      {goal.notes && <p>{goal.notes}</p>}
      {editMode && (
        <div className="row-actions">
          <button className="icon-button ghost order-button" type="button" disabled={orderIndex <= 0} onClick={(event) => { event.stopPropagation(); onMove(goal.id, -1); }}>
            <ArrowLeft size={17} />
          </button>
          <button className="icon-button ghost order-button" type="button" disabled={orderIndex >= totalGoals - 1} onClick={(event) => { event.stopPropagation(); onMove(goal.id, 1); }}>
            <ArrowRight size={17} />
          </button>
          <button className="icon-button danger" type="button" onClick={(event) => { event.stopPropagation(); onDelete(); }}>
            <Trash2 size={17} />
          </button>
        </div>
      )}
    </article>
  );
}

function GoalModal({ goal, onClose, onSave }) {
  const [form, setForm] = useState(goal || emptyGoal);
  const [showTypeHelp, setShowTypeHelp] = useState(false);
  const setField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const handleSubmit = (event) => {
    event.preventDefault();
    onSave(form);
  };

  return (
    <Modal title={goal ? 'Editar meta' : 'Nova meta'} onClose={onClose}>
      <form className="form-grid" onSubmit={handleSubmit}>
        <label className="field wide-field">
          <span>Nome da meta</span>
          <input required value={form.title} onChange={(event) => setField('title', event.target.value)} placeholder="Ex.: Viagem para o fim do ano" />
        </label>
        <label className="field">
          <span>Valor alvo</span>
          <input required min="0" step="0.01" type="number" value={form.targetAmount} onChange={(event) => setField('targetAmount', event.target.value)} />
        </label>
        <label className="field">
          <span>Valor guardado</span>
          <input min="0" step="0.01" type="number" value={form.savedAmount} onChange={(event) => setField('savedAmount', event.target.value)} />
        </label>
        <label className="field">
          <span>Prioridade</span>
          <select value={form.priority} onChange={(event) => setField('priority', event.target.value)}>
            <option>Alta</option>
            <option>Média</option>
            <option>Baixa</option>
          </select>
        </label>
        <div className="field-label-row wide-field goal-type-helper-trigger">
          <span>Tipo de prazo</span>
          <button className="inline-link-button" type="button" onClick={() => setShowTypeHelp((current) => !current)}>
            Como escolher?
          </button>
        </div>
        <label className="field goal-type-select">
          <span>Tipo de prazo</span>
          <select value={form.horizon} onChange={(event) => setField('horizon', event.target.value)}>
            <option>Curto prazo</option>
            <option>Médio prazo</option>
            <option>Longo prazo</option>
          </select>
        </label>
        {showTypeHelp && (
          <div className="goal-help-box">
            <strong>Curto prazo</strong> combina com semanas ou poucos meses. <strong>Médio prazo</strong> costuma ir de alguns meses até um ano. <strong>Longo prazo</strong> é para planos maiores, como reserva financeira, mudança, carro ou viagem grande. Use prioridade alta para o que precisa de atenção agora, média para metas que caminham junto com outras e baixa para desejos sem pressa.
          </div>
        )}
        <label className="field wide-field">
          <span>Prazo ou lembrete</span>
          <input value={form.deadline} onChange={(event) => setField('deadline', event.target.value)} placeholder="Ex.: Dezembro, 6 meses, sem pressa" />
        </label>
        <label className="field wide-field">
          <span>Observações</span>
          <textarea value={form.notes} onChange={(event) => setField('notes', event.target.value)} placeholder="Detalhes, itens envolvidos, motivo da meta..." />
        </label>
        <div className="form-actions">
          <button className="secondary-button" type="button" onClick={onClose}>Cancelar</button>
          <button className="primary-button" type="submit"><Check size={18} />Salvar</button>
        </div>
      </form>
    </Modal>
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
  onDragEnter,
  onDragOver,
  onDrop,
  onDragEnd,
  isDragging,
  isDropTarget
}) {
  const normalizedLink = normalizeExternalLink(purchase.link);
  const cardClassName = [
    'purchase-card',
    editMode ? 'editing' : normalizedLink ? 'clickable' : 'clickable missing-link',
    isDragging ? 'dragging' : '',
    isDropTarget ? 'drop-target' : ''
  ].filter(Boolean).join(' ');

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
      className={cardClassName}
      role={editMode ? 'button' : normalizedLink ? 'link' : 'button'}
      tabIndex={0}
      draggable={editMode}
      onClick={handleCardClick}
      onDragStart={onDragStart}
      onDragEnter={onDragEnter}
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

function ProjectionPage({ data, metrics, onUpdateSettings }) {
  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey);
  const [budgetDraft, setBudgetDraft] = useState(String(data.settings.monthlyBudget || ''));
  const obligations = useMemo(() => buildProjectedObligations(data.transactions, selectedMonth), [data.transactions, selectedMonth]);
  useEffect(() => {
    setBudgetDraft(String(data.settings.monthlyBudget || ''));
  }, [data.settings.monthlyBudget]);
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

      <section className="panel full-width budget-settings-panel">
        <PanelHeader
          eyebrow="Orçamento"
          title="Acompanhar limite mensal"
          action={data.settings.monthlyBudget ? currency.format(data.settings.monthlyBudget) : 'Opcional'}
        />
        <div className="budget-settings-row">
          <div>
            <p>Defina um valor se quiser comparar seus gastos mensais com um limite planejado.</p>
            <span>{data.settings.monthlyBudget ? 'Esse valor também alimenta o cartão de uso mensal.' : 'Sem orçamento definido, o Finch só mostra entradas, saídas e projeções.'}</span>
          </div>
          <div className="budget-settings-actions">
            <input
              type="number"
              min="0"
              value={budgetDraft}
              onChange={(event) => setBudgetDraft(event.target.value)}
              placeholder="Ex.: 2500"
            />
            <button
              className="primary-button"
              type="button"
              onClick={() => onUpdateSettings({ monthlyBudget: Math.max(0, Number(budgetDraft || 0)) })}
            >
              Salvar
            </button>
            {!!data.settings.monthlyBudget && (
              <button
                className="secondary-button"
                type="button"
                onClick={() => {
                  setBudgetDraft('');
                  onUpdateSettings({ monthlyBudget: 0 });
                }}
              >
                Desativar
              </button>
            )}
          </div>
        </div>
      </section>

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

function SettingsPage({ data, onUpdateSettings, onResetData, onClearData, onImportData, onStartTutorial, onShowWelcome, storageMeta }) {
  const initialClearOptions = {
    transactions: true,
    purchases: true,
    goals: true,
    categories: false,
    accounts: false,
    salary: false,
    budget: false,
    preferences: false
  };
  const [categoryText, setCategoryText] = useState(data.settings.categories.join(', '));
  const [accountText, setAccountText] = useState(data.settings.accounts.join(', '));
  const [confirmAction, setConfirmAction] = useState(null);
  const [clearOptions, setClearOptions] = useState(initialClearOptions);
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
        <PanelHeader eyebrow="Preferências" title="Aparência" action={data.settings.theme} />
        <div className="settings-form">
          <label className="field">
            <span>Tema</span>
            <select value={data.settings.theme} onChange={(event) => onUpdateSettings({ theme: event.target.value })}>
              <option>iOS claro</option>
              <option>Grafite</option>
              <option>Contraste suave</option>
            </select>
          </label>
        </div>
      </section>

      <section className="panel">
        <PanelHeader eyebrow="Ajuda" title="Tutorial guiado" action={data.settings.tutorialCompleted ? 'visto' : 'novo'} />
        <div className="storage-status">
          <Sparkles size={18} />
          <div>
            <strong>Conheça o Finch por partes</strong>
            <span>Refaça o tour sempre que quiser revisar o papel de cada guia e dos botões principais.</span>
          </div>
        </div>
        <div className="data-actions">
          <button className="secondary-button" type="button" onClick={onStartTutorial}>
            <ArrowRight size={18} />
            Abrir tutorial
          </button>
          <button className="secondary-button" type="button" onClick={onShowWelcome}>
            <Sparkles size={18} />
            Ver boas-vindas
          </button>
        </div>
      </section>

      <section className="panel">
        <PanelHeader eyebrow="Sistema" title="Versão do Finch" action={APP_CHANNEL} />
        <div className="version-grid">
          <div>
            <span>Canal</span>
            <strong>{APP_CHANNEL}</strong>
          </div>
          <div>
            <span>Versão atual</span>
            <strong>v{APP_VERSION}</strong>
          </div>
          <div>
            <span>Última oficial</span>
            <strong>v{OFFICIAL_VERSION}</strong>
          </div>
          <div>
            <span>Estado</span>
            <strong>{APP_VERSION === OFFICIAL_VERSION && !IS_LOCAL_BUILD ? 'Atualizado' : 'Teste local'}</strong>
          </div>
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
            <strong>
              {storageMeta?.mode === 'browser-test'
                ? 'Modo de teste sem salvamento'
                : storageMeta?.mode === 'browser'
                  ? 'Salvamento no navegador'
                  : 'Salvamento local automático'}
            </strong>
            <span>
              {storageMeta?.mode === 'browser-test'
                ? 'Ao recarregar no navegador, o Finch volta para a tela inicial para facilitar testes.'
                : storageMeta?.error ||
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
        <ClearSystemModal
          options={clearOptions}
          onChange={setClearOptions}
          onCancel={() => setConfirmAction(null)}
          onConfirm={() => {
            onClearData(clearOptions);
            if (clearOptions.categories) setCategoryText(seedData.settings.categories.join(', '));
            if (clearOptions.accounts) setAccountText(seedData.settings.accounts.join(', '));
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

function ClearSystemModal({ options, onChange, onCancel, onConfirm }) {
  const items = [
    { key: 'transactions', title: 'Histórico do extrato', text: 'Remove entradas, saídas, parcelas e recorrências.' },
    { key: 'purchases', title: 'Compras futuras e realizadas', text: 'Limpa a galeria, desejos e histórico de produtos comprados.' },
    { key: 'goals', title: 'Metas', text: 'Remove metas, valores guardados e progresso planejado.' },
    { key: 'categories', title: 'Categorias', text: 'Restaura a lista padrão de categorias.' },
    { key: 'accounts', title: 'Contas', text: 'Restaura a lista padrão de contas.' },
    { key: 'salary', title: 'Renda e salário', text: 'Remove a renda informada no onboarding.' },
    { key: 'budget', title: 'Orçamento mensal', text: 'Desativa o limite mensal usado em projeções.' },
    { key: 'preferences', title: 'Preferências do perfil', text: 'Limpa nome, foco inicial e volta ao tema claro.' }
  ];
  const allSelected = items.every((item) => options[item.key]);
  const selectedCount = items.filter((item) => options[item.key]).length;

  const setAll = (checked) => {
    onChange(Object.fromEntries(items.map((item) => [item.key, checked])));
  };

  const toggle = (key) => {
    onChange({ ...options, [key]: !options[key] });
  };

  return (
    <div className="modal-backdrop" role="presentation">
      <div className="modal-panel clear-panel" role="dialog" aria-modal="true" aria-label="Limpar sistema">
        <div className="modal-header">
          <div>
            <p className="eyebrow">Limpeza seletiva</p>
            <h2>O que você quer limpar?</h2>
          </div>
          <button className="icon-button ghost" type="button" title="Fechar" aria-label="Fechar" onClick={onCancel}>
            <X size={18} />
          </button>
        </div>

        <div className="clear-toolbar">
          <span>{selectedCount} itens selecionados</span>
          <button className="secondary-button" type="button" onClick={() => setAll(!allSelected)}>
            {allSelected ? 'Desmarcar tudo' : 'Selecionar tudo'}
          </button>
        </div>

        <div className="clear-options">
          {items.map((item) => (
            <button
              key={item.key}
              className={options[item.key] ? 'clear-option selected' : 'clear-option'}
              type="button"
              onClick={() => toggle(item.key)}
            >
              <span>{options[item.key] && <Check size={15} />}</span>
              <div>
                <strong>{item.title}</strong>
                <p>{item.text}</p>
              </div>
            </button>
          ))}
        </div>

        <div className="form-actions">
          <button className="secondary-button" type="button" onClick={onCancel}>
            Cancelar
          </button>
          <button className="danger-button" type="button" disabled={!selectedCount} onClick={onConfirm}>
            Limpar selecionados
          </button>
        </div>
      </div>
    </div>
  );
}

function UpdateModal({ status, onSnooze, onDismiss, onDownload, onInstallNow, onInstallOnQuit }) {
  const version = status.updateInfo?.version || status.updateInfo?.releaseName || 'nova';
  const progress = Math.round(status.progress?.percent || 0);
  const releaseNotes = formatReleaseNotes(status.updateInfo?.releaseNotes);

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
          <ReleaseNotesSummary notes={releaseNotes} />
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
        <ReleaseNotesSummary notes={releaseNotes} />
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

function ReleaseNotesSummary({ notes }) {
  if (!notes.length) return null;

  return (
    <div className="update-notes">
      <strong>O que mudou</strong>
      <ul>
        {notes.slice(0, 5).map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>
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

function formatReleaseNotes(releaseNotes) {
  const rawNotes = Array.isArray(releaseNotes)
    ? releaseNotes.map((note) => note?.note || note?.text || note).join('\n')
    : String(releaseNotes || '');

  return rawNotes
    .replace(/<[^>]*>/g, ' ')
    .split(/\r?\n/)
    .map((line) => line.replace(/^[-*]\s+/, '').trim())
    .filter(Boolean);
}

function swapIds(ids, draggedId, targetId) {
  const draggedIndex = ids.indexOf(draggedId);
  const targetIndex = ids.indexOf(targetId);

  if (draggedIndex === -1 || targetIndex === -1 || draggedIndex === targetIndex) {
    return ids;
  }

  const next = [...ids];
  [next[draggedIndex], next[targetIndex]] = [next[targetIndex], next[draggedIndex]];
  return next;
}

createRoot(document.getElementById('root')).render(<App />);

