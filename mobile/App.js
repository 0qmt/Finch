import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Constants from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { AccessTokenRequest } from 'expo-auth-session';
import {
  clearToken,
  getDriveStatus,
  loadLocalCache,
  loadToken,
  saveLocalCache,
  saveToken,
  syncWithGoogleDrive
} from './src/drive/driveSync';

WebBrowser.maybeCompleteAuthSession();

const googleClientId = Constants.expoConfig?.extra?.googleClientId || '';
const scopes = ['https://www.googleapis.com/auth/drive.file'];
const isoToday = new Date().toISOString().slice(0, 10);
const appVersion = Constants.expoConfig?.version || '0.0.0';
const githubLatestReleaseUrl = 'https://api.github.com/repos/0qmt/Finch/releases/latest';
const githubReleasesUrl = 'https://github.com/0qmt/Finch/releases/latest';
const seed = {
  settings: {
    userName: 'Voce',
    monthlyBudget: 5200,
    salary: 0,
    categories: ['Moradia', 'Mercado', 'Transporte', 'Lazer', 'Saude', 'Viagem', 'Tecnologia'],
    accounts: ['Carteira', 'Nubank']
  },
  transactions: [],
  purchases: [],
  goals: []
};

const tabs = [
  ['dashboard', 'Visao'],
  ['wallet', 'Carteira'],
  ['future', 'Futuro'],
  ['projection', 'Proj.'],
  ['settings', 'Ajustes']
];

const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

function uid(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function parseMoney(value) {
  if (typeof value === 'number') return value;
  const normalized = String(value || '').replace(/\./g, '').replace(',', '.');
  return Number(normalized || 0);
}

function normalizeData(input) {
  const settings = { ...seed.settings, ...(input?.settings || {}) };
  return {
    ...seed,
    ...(input || {}),
    settings: {
      ...settings,
      categories: Array.isArray(settings.categories) ? settings.categories : seed.settings.categories,
      accounts: Array.isArray(settings.accounts) ? settings.accounts : seed.settings.accounts,
      monthlyBudget: Number(settings.monthlyBudget || 0),
      salary: Number(settings.salary || 0)
    },
    transactions: Array.isArray(input?.transactions) ? input.transactions : [],
    purchases: Array.isArray(input?.purchases) ? input.purchases : [],
    goals: Array.isArray(input?.goals) ? input.goals : []
  };
}

function formatDate(value) {
  if (!value) return 'Nunca';
  return new Date(value).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

function dateLabel(value) {
  if (!value) return 'Sem data';
  return new Date(`${value}T12:00:00`).toLocaleDateString('pt-BR');
}

function normalizeVersion(value = '') {
  return String(value).replace(/^[^\d]*/, '').split(/[^\d]+/).filter(Boolean).map((item) => Number(item));
}

function compareVersions(left, right) {
  const a = normalizeVersion(left);
  const b = normalizeVersion(right);
  const length = Math.max(a.length, b.length, 3);
  for (let index = 0; index < length; index += 1) {
    const diff = (a[index] || 0) - (b[index] || 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

async function checkGithubUpdate() {
  const response = await fetch(githubLatestReleaseUrl, {
    headers: { Accept: 'application/vnd.github+json' }
  });
  if (!response.ok) {
    throw new Error('Nao foi possivel consultar o GitHub agora.');
  }
  const release = await response.json();
  const latestVersion = normalizeVersion(release.tag_name || release.name).join('.');
  const apkAsset = Array.isArray(release.assets)
    ? release.assets.find((asset) => String(asset.name || '').toLowerCase().endsWith('.apk'))
    : null;
  return {
    latestVersion,
    currentVersion: appVersion,
    hasUpdate: compareVersions(latestVersion, appVersion) > 0,
    releaseName: release.name || release.tag_name || `v${latestVersion}`,
    releaseUrl: release.html_url || githubReleasesUrl,
    downloadUrl: apkAsset?.browser_download_url || release.html_url || githubReleasesUrl,
    apkName: apkAsset?.name || ''
  };
}

function Card({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

function Chip({ label, active, onPress, tone }) {
  return (
    <Pressable style={[styles.chip, active && styles.chipActive, tone === 'danger' && styles.chipDanger]} onPress={onPress}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

function Field({ label, value, onChangeText, placeholder, keyboardType = 'default', multiline = false }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.textArea]}
        value={String(value ?? '')}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#7f8797"
        keyboardType={keyboardType}
        multiline={multiline}
      />
    </View>
  );
}

function FormModal({ visible, title, onClose, onSubmit, children, submitLabel = 'Salvar' }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <View style={styles.row}>
            <Text style={styles.modalTitle}>{title}</Text>
            <Pressable style={styles.iconButton} onPress={onClose}>
              <Text style={styles.iconButtonText}>X</Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent}>{children}</ScrollView>
          <View style={styles.actionRow}>
            <Pressable style={styles.secondary} onPress={onClose}>
              <Text style={styles.secondaryText}>Cancelar</Text>
            </Pressable>
            <Pressable style={styles.primaryInline} onPress={onSubmit}>
              <Text style={styles.primaryText}>{submitLabel}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function calculateMetrics(data) {
  const confirmed = data.transactions.filter((transaction) => transaction.status === 'confirmed');
  const balance = confirmed.reduce((sum, item) => sum + (item.type === 'income' ? Number(item.amount || 0) : -Number(item.amount || 0)), 0);
  const income = data.transactions.filter((item) => item.type === 'income').reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const expense = data.transactions.filter((item) => item.type === 'expense').reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const planned = data.purchases.filter((item) => item.status !== 'purchased');
  const goalsSaved = data.goals.reduce((sum, goal) => sum + Number(goal.savedAmount || 0), 0);
  return { balance, income, expense, plannedCount: planned.length, goalsSaved };
}

function Dashboard({ data }) {
  const metrics = useMemo(() => calculateMetrics(data), [data]);
  const budget = Number(data.settings.monthlyBudget || 0);
  const budgetUse = budget ? Math.min(100, Math.round((metrics.expense / budget) * 100)) : 0;
  const categories = data.transactions
    .filter((item) => item.type === 'expense')
    .reduce((map, item) => map.set(item.category || 'Outros', (map.get(item.category || 'Outros') || 0) + Number(item.amount || 0)), new Map());

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.eyebrow}>Clareza hoje</Text>
      <Text style={styles.title}>Seu dinheiro, seu futuro.</Text>
      <View style={styles.statGrid}>
        <Stat label="Saldo" value={money.format(metrics.balance)} />
        <Stat label="Entradas" value={money.format(metrics.income)} tone="green" />
        <Stat label="Saidas" value={money.format(metrics.expense)} tone="red" />
        <Stat label="Compras" value={`${metrics.plannedCount}`} />
      </View>
      <Card>
        <Text style={styles.cardTitle}>Orcamento mensal</Text>
        <Text style={styles.bigNumber}>{budgetUse}% usado</Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${budgetUse}%` }]} />
        </View>
        <Text style={styles.muted}>{money.format(metrics.expense)} de {money.format(budget)}</Text>
      </Card>
      <Card>
        <Text style={styles.cardTitle}>Gastos por categoria</Text>
        {Array.from(categories.entries()).slice(0, 5).map(([name, total]) => (
          <View key={name} style={styles.categoryRow}>
            <Text style={styles.muted}>{name}</Text>
            <Text style={styles.rowTitle}>{money.format(total)}</Text>
          </View>
        ))}
        {categories.size === 0 && <Text style={styles.muted}>Sem gastos registrados.</Text>}
      </Card>
      <Card>
        <Text style={styles.cardTitle}>Transacoes recentes</Text>
        {data.transactions.slice(0, 6).map((item) => <TransactionRow key={item.id} item={item} />)}
        {data.transactions.length === 0 && <Text style={styles.muted}>Sua carteira sincronizada aparece aqui.</Text>}
      </Card>
    </ScrollView>
  );
}

function Stat({ label, value, tone = 'blue' }) {
  return (
    <Card style={styles.stat}>
      <Text style={styles.muted}>{label}</Text>
      <Text style={[styles.statValue, tone === 'green' && styles.green, tone === 'red' && styles.red]}>{value}</Text>
    </Card>
  );
}

function TransactionRow({ item, onEdit, onDelete, onToggle }) {
  return (
    <View style={styles.listItem}>
      <Pressable style={styles.rowText} onPress={() => onEdit?.(item)}>
        <Text style={styles.rowTitle}>{item.title || 'Movimentacao'}</Text>
        <Text style={styles.muted}>{dateLabel(item.date)} · {item.category || 'Sem categoria'} · {item.status === 'confirmed' ? 'Confirmada' : 'Pendente'}</Text>
      </Pressable>
      <Text style={item.type === 'income' ? styles.green : styles.red}>{money.format(Number(item.amount || 0))}</Text>
      {onToggle && <Pressable style={styles.smallButton} onPress={() => onToggle(item.id)}><Text style={styles.smallButtonText}>OK</Text></Pressable>}
      {onDelete && <Pressable style={[styles.smallButton, styles.deleteButton]} onPress={() => onDelete(item.id)}><Text style={styles.deleteText}>Del</Text></Pressable>}
    </View>
  );
}

function Wallet({ data, setData, markDirty }) {
  const [formVisible, setFormVisible] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [filter, setFilter] = useState('all');
  const categories = data.settings.categories;
  const accounts = data.settings.accounts;

  const openForm = (item = null) => {
    setEditing(item);
    setForm(item || {
      title: '',
      amount: '',
      type: 'expense',
      category: categories[0] || 'Geral',
      account: accounts[0] || 'Carteira',
      date: isoToday,
      status: 'pending',
      recurring: false,
      installments: 1,
      notes: ''
    });
    setFormVisible(true);
  };

  const save = () => {
    if (!form.title || !form.amount) return;
    const payload = {
      ...form,
      id: form.id || uid('tx'),
      amount: parseMoney(form.amount),
      installments: Math.max(1, Number(form.installments || 1))
    };
    setData((current) => ({
      ...current,
      transactions: editing
        ? current.transactions.map((item) => (item.id === editing.id ? payload : item))
        : [payload, ...current.transactions]
    }));
    markDirty();
    setFormVisible(false);
  };

  const remove = (id) => {
    Alert.alert('Excluir transacao', 'Remover esta movimentacao?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: () => {
          setData((current) => ({
            ...current,
            transactions: current.transactions.filter((item) => item.id !== id),
            purchases: current.purchases.map((purchase) =>
              purchase.purchaseTransactionId === id
                ? { ...purchase, status: 'planned', purchasedAt: undefined, purchaseTransactionId: undefined }
                : purchase
            )
          }));
          markDirty();
        }
      }
    ]);
  };

  const toggle = (id) => {
    setData((current) => ({
      ...current,
      transactions: current.transactions.map((item) => item.id === id ? { ...item, status: item.status === 'confirmed' ? 'pending' : 'confirmed' } : item)
    }));
    markDirty();
  };

  const visible = data.transactions.filter((item) => filter === 'all' || item.type === filter || item.status === filter);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.row}>
        <Text style={styles.title}>Carteira</Text>
        <Pressable style={styles.headerButton} onPress={() => openForm()}><Text style={styles.primaryText}>Novo</Text></Pressable>
      </View>
      <View style={styles.chipRow}>
        {['all', 'income', 'expense', 'pending'].map((item) => (
          <Chip key={item} label={{ all: 'Tudo', income: 'Entradas', expense: 'Saidas', pending: 'Pendentes' }[item]} active={filter === item} onPress={() => setFilter(item)} />
        ))}
      </View>
      <Card>
        {visible.map((item) => <TransactionRow key={item.id} item={item} onEdit={openForm} onDelete={remove} onToggle={toggle} />)}
        {visible.length === 0 && <Text style={styles.muted}>Nenhuma transacao encontrada.</Text>}
      </Card>
      <FormModal visible={formVisible} title={editing ? 'Editar transacao' : 'Nova transacao'} onClose={() => setFormVisible(false)} onSubmit={save}>
        <Field label="Titulo" value={form.title} onChangeText={(value) => setForm({ ...form, title: value })} placeholder="Ex.: Mercado" />
        <Field label="Valor" value={form.amount} onChangeText={(value) => setForm({ ...form, amount: value })} placeholder="Ex.: 120,00" keyboardType="decimal-pad" />
        <Text style={styles.fieldLabel}>Tipo</Text>
        <View style={styles.chipRow}>
          <Chip label="Saida" active={form.type === 'expense'} onPress={() => setForm({ ...form, type: 'expense' })} />
          <Chip label="Entrada" active={form.type === 'income'} onPress={() => setForm({ ...form, type: 'income' })} />
        </View>
        <Text style={styles.fieldLabel}>Categoria</Text>
        <View style={styles.chipRow}>{categories.map((item) => <Chip key={item} label={item} active={form.category === item} onPress={() => setForm({ ...form, category: item })} />)}</View>
        <Text style={styles.fieldLabel}>Conta</Text>
        <View style={styles.chipRow}>{accounts.map((item) => <Chip key={item} label={item} active={form.account === item} onPress={() => setForm({ ...form, account: item })} />)}</View>
        <Field label="Data" value={form.date} onChangeText={(value) => setForm({ ...form, date: value })} placeholder="AAAA-MM-DD" />
        <Text style={styles.fieldLabel}>Status</Text>
        <View style={styles.chipRow}>
          <Chip label="Pendente" active={form.status === 'pending'} onPress={() => setForm({ ...form, status: 'pending' })} />
          <Chip label="Confirmada" active={form.status === 'confirmed'} onPress={() => setForm({ ...form, status: 'confirmed' })} />
        </View>
        <Field label="Parcelas" value={form.installments} onChangeText={(value) => setForm({ ...form, installments: value })} keyboardType="numeric" />
        <Field label="Notas" value={form.notes} onChangeText={(value) => setForm({ ...form, notes: value })} multiline />
      </FormModal>
    </ScrollView>
  );
}

function PurchaseCard({ item, editMode, onEdit, onDelete, onBought }) {
  const hasPrice = (item.priceMode || 'specified') !== 'unspecified';
  const image = item.image ? { uri: item.image } : null;
  const openLink = () => {
    if (editMode) return onEdit(item);
    if (!item.link) return Alert.alert('Produto sem link', 'Este produto nao tem site cadastrado.');
    Linking.openURL(item.link).catch(() => Alert.alert('Link invalido', 'Nao foi possivel abrir o link.'));
  };

  return (
    <Pressable style={styles.purchaseCard} onPress={openLink}>
      {image ? <Image source={image} style={styles.purchaseImage} /> : <View style={styles.purchaseImagePlaceholder}><Text style={styles.muted}>Sem imagem</Text></View>}
      <View style={styles.purchaseBody}>
        <View style={styles.row}>
          <Text style={styles.badge}>{item.category || 'Geral'}</Text>
          <Text style={[styles.priority, item.priority === 'Alta' && styles.red, item.priority === 'Baixa' && styles.muted]}>{item.priority || 'Media'}</Text>
        </View>
        <Text style={styles.cardTitle}>{item.name || 'Produto'}</Text>
        <Text style={styles.statValue}>{hasPrice ? money.format(Number(item.targetPrice || 0)) : 'Preco aberto'}</Text>
        {item.isPromotionalPrice && <Text style={styles.promoText}>Preco de promocao</Text>}
        <Text style={styles.muted}>{item.store || 'Loja a definir'}</Text>
        <Text style={styles.muted}>{item.notes || (item.link ? 'Toque para abrir o produto.' : 'Sem link cadastrado.')}</Text>
        <View style={styles.actionRow}>
          {editMode && <Pressable style={styles.secondary} onPress={() => onEdit(item)}><Text style={styles.secondaryText}>Editar</Text></Pressable>}
          {editMode && <Pressable style={styles.secondary} onPress={() => onBought(item)}><Text style={styles.secondaryText}>Comprado</Text></Pressable>}
          {editMode && <Pressable style={[styles.secondary, styles.dangerSoft]} onPress={() => onDelete(item.id)}><Text style={styles.deleteText}>Excluir</Text></Pressable>}
        </View>
      </View>
    </Pressable>
  );
}

function GoalCard({ goal, editMode, onEdit, onDelete }) {
  const saved = Number(goal.savedAmount || 0);
  const target = Math.max(1, Number(goal.targetAmount || 0));
  const progress = Math.min(100, Math.round((saved / target) * 100));
  return (
    <Card>
      <View style={styles.row}>
        <View style={styles.rowText}>
          <Text style={styles.muted}>{goal.deadline || 'Sem prazo'} · {goal.horizon || 'Medio prazo'}</Text>
          <Text style={styles.cardTitle}>{goal.title || 'Meta'}</Text>
        </View>
        <Text style={[styles.priority, goal.priority === 'Alta' && styles.red]}>{goal.priority || 'Media'}</Text>
      </View>
      <Text style={styles.statValue}>{money.format(saved)}</Text>
      <Text style={styles.muted}>de {money.format(target)}</Text>
      <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${progress}%` }]} /></View>
      <Text style={styles.muted}>{progress}% concluido</Text>
      {editMode && (
        <View style={styles.actionRow}>
          <Pressable style={styles.secondary} onPress={() => onEdit(goal)}><Text style={styles.secondaryText}>Editar</Text></Pressable>
          <Pressable style={[styles.secondary, styles.dangerSoft]} onPress={() => onDelete(goal.id)}><Text style={styles.deleteText}>Excluir</Text></Pressable>
        </View>
      )}
    </Card>
  );
}

function Future({ data, setData, markDirty }) {
  const [mode, setMode] = useState('purchases');
  const [editMode, setEditMode] = useState(false);
  const [purchaseForm, setPurchaseForm] = useState(null);
  const [goalForm, setGoalForm] = useState(null);
  const categories = data.settings.categories;
  const planned = data.purchases.filter((item) => item.status !== 'purchased');
  const purchased = data.purchases.filter((item) => item.status === 'purchased');

  const savePurchase = () => {
    if (!purchaseForm?.name) return;
    const hasPrice = purchaseForm.priceMode !== 'unspecified';
    const payload = {
      ...purchaseForm,
      id: purchaseForm.id || uid('wish'),
      priceMode: hasPrice ? 'specified' : 'unspecified',
      targetPrice: hasPrice ? parseMoney(purchaseForm.targetPrice) : 0,
      isPromotionalPrice: hasPrice && Boolean(purchaseForm.isPromotionalPrice),
      createdAt: purchaseForm.createdAt || isoToday,
      status: purchaseForm.status || 'planned'
    };
    setData((current) => ({
      ...current,
      purchases: payload.id && current.purchases.some((item) => item.id === payload.id)
        ? current.purchases.map((item) => item.id === payload.id ? payload : item)
        : [payload, ...current.purchases]
    }));
    markDirty();
    setPurchaseForm(null);
  };

  const markBought = (purchase) => {
    const transactionId = uid('tx');
    setData((current) => ({
      ...current,
      transactions: [
        {
          id: transactionId,
          title: purchase.name,
          amount: Number(purchase.targetPrice || 0),
          type: 'expense',
          category: purchase.category || 'Compras',
          account: current.settings.accounts[0] || 'Carteira',
          date: isoToday,
          status: 'confirmed',
          notes: `Compra registrada pelo mobile. Loja: ${purchase.store || 'nao informada'}.`
        },
        ...current.transactions
      ],
      purchases: current.purchases.map((item) => item.id === purchase.id ? { ...item, status: 'purchased', purchasedAt: isoToday, purchaseTransactionId: transactionId } : item)
    }));
    markDirty();
  };

  const saveGoal = () => {
    if (!goalForm?.title || !goalForm?.targetAmount) return;
    const payload = {
      ...goalForm,
      id: goalForm.id || uid('goal'),
      targetAmount: parseMoney(goalForm.targetAmount),
      savedAmount: parseMoney(goalForm.savedAmount),
      createdAt: goalForm.createdAt || isoToday,
      status: goalForm.status || 'active'
    };
    setData((current) => ({
      ...current,
      goals: current.goals.some((item) => item.id === payload.id)
        ? current.goals.map((item) => item.id === payload.id ? payload : item)
        : [payload, ...current.goals]
    }));
    markDirty();
    setGoalForm(null);
  };

  const removePurchase = (id) => {
    setData((current) => ({ ...current, purchases: current.purchases.filter((item) => item.id !== id) }));
    markDirty();
  };
  const removeGoal = (id) => {
    setData((current) => ({ ...current, goals: current.goals.filter((item) => item.id !== id) }));
    markDirty();
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.eyebrow}>Planos maiores</Text>
      <Text style={styles.title}>Futuro</Text>
      <View style={styles.switcher}>
        <Chip label="Compras" active={mode === 'purchases'} onPress={() => setMode('purchases')} />
        <Chip label="Metas" active={mode === 'goals'} onPress={() => setMode('goals')} />
      </View>
      <View style={styles.actionRow}>
        <Pressable style={styles.primaryInline} onPress={() => mode === 'purchases' ? setPurchaseForm({ name: '', priceMode: 'specified', targetPrice: '', isPromotionalPrice: false, priority: 'Media', category: categories[0] || 'Tecnologia', store: '', link: '', image: '', notes: '' }) : setGoalForm({ title: '', targetAmount: '', savedAmount: '', priority: 'Media', horizon: 'Medio prazo', deadline: '', notes: '', status: 'active' })}>
          <Text style={styles.primaryText}>{mode === 'purchases' ? 'Nova compra' : 'Nova meta'}</Text>
        </Pressable>
        <Pressable style={styles.secondary} onPress={() => setEditMode((value) => !value)}><Text style={styles.secondaryText}>{editMode ? 'Concluir' : 'Editar'}</Text></Pressable>
      </View>
      {mode === 'purchases' ? (
        <>
          {planned.map((item) => <PurchaseCard key={item.id} item={item} editMode={editMode} onEdit={setPurchaseForm} onDelete={removePurchase} onBought={markBought} />)}
          {planned.length === 0 && <Card><Text style={styles.muted}>Nenhuma compra planejada.</Text></Card>}
          {purchased.length > 0 && <Text style={styles.sectionLabel}>Compras realizadas</Text>}
          {purchased.map((item) => <Card key={item.id}><Text style={styles.cardTitle}>{item.name}</Text><Text style={styles.green}>Comprado em {dateLabel(item.purchasedAt)}</Text></Card>)}
        </>
      ) : (
        <>
          {data.goals.map((goal) => <GoalCard key={goal.id} goal={goal} editMode={editMode} onEdit={setGoalForm} onDelete={removeGoal} />)}
          {data.goals.length === 0 && <Card><Text style={styles.muted}>Nenhuma meta registrada.</Text></Card>}
        </>
      )}

      <FormModal visible={Boolean(purchaseForm)} title={purchaseForm?.id ? 'Editar compra' : 'Nova compra'} onClose={() => setPurchaseForm(null)} onSubmit={savePurchase}>
        <Field label="Produto" value={purchaseForm?.name} onChangeText={(value) => setPurchaseForm({ ...purchaseForm, name: value })} placeholder="Ex.: Notebook" />
        <Text style={styles.fieldLabel}>Preco alvo</Text>
        <View style={styles.chipRow}>
          <Chip label="Informar" active={purchaseForm?.priceMode !== 'unspecified'} onPress={() => setPurchaseForm({ ...purchaseForm, priceMode: 'specified' })} />
          <Chip label="Nao especificar" active={purchaseForm?.priceMode === 'unspecified'} onPress={() => setPurchaseForm({ ...purchaseForm, priceMode: 'unspecified', targetPrice: '', isPromotionalPrice: false })} />
        </View>
        {purchaseForm?.priceMode !== 'unspecified' && <Field label="Valor" value={purchaseForm?.targetPrice} onChangeText={(value) => setPurchaseForm({ ...purchaseForm, targetPrice: value })} keyboardType="decimal-pad" />}
        {purchaseForm?.priceMode !== 'unspecified' && <Chip label="Esse preco e promocao" active={Boolean(purchaseForm?.isPromotionalPrice)} onPress={() => setPurchaseForm({ ...purchaseForm, isPromotionalPrice: !purchaseForm?.isPromotionalPrice })} />}
        <Text style={styles.fieldLabel}>Prioridade</Text>
        <View style={styles.chipRow}>{['Alta', 'Media', 'Baixa'].map((item) => <Chip key={item} label={item} active={purchaseForm?.priority === item} onPress={() => setPurchaseForm({ ...purchaseForm, priority: item })} />)}</View>
        <Text style={styles.fieldLabel}>Categoria</Text>
        <View style={styles.chipRow}>{categories.map((item) => <Chip key={item} label={item} active={purchaseForm?.category === item} onPress={() => setPurchaseForm({ ...purchaseForm, category: item })} />)}</View>
        <Field label="Loja" value={purchaseForm?.store} onChangeText={(value) => setPurchaseForm({ ...purchaseForm, store: value })} placeholder="Amazon, Shopee..." />
        <Field label="Link" value={purchaseForm?.link} onChangeText={(value) => setPurchaseForm({ ...purchaseForm, link: value })} placeholder="https://..." />
        <Field label="Imagem por URL" value={purchaseForm?.image} onChangeText={(value) => setPurchaseForm({ ...purchaseForm, image: value })} placeholder="https://imagem..." />
        <Field label="Observacoes" value={purchaseForm?.notes} onChangeText={(value) => setPurchaseForm({ ...purchaseForm, notes: value })} multiline />
      </FormModal>

      <FormModal visible={Boolean(goalForm)} title={goalForm?.id ? 'Editar meta' : 'Nova meta'} onClose={() => setGoalForm(null)} onSubmit={saveGoal}>
        <Field label="Nome da meta" value={goalForm?.title} onChangeText={(value) => setGoalForm({ ...goalForm, title: value })} placeholder="Ex.: Viagem" />
        <Field label="Valor alvo" value={goalForm?.targetAmount} onChangeText={(value) => setGoalForm({ ...goalForm, targetAmount: value })} keyboardType="decimal-pad" />
        <Field label="Valor guardado" value={goalForm?.savedAmount} onChangeText={(value) => setGoalForm({ ...goalForm, savedAmount: value })} keyboardType="decimal-pad" />
        <Text style={styles.fieldLabel}>Prioridade</Text>
        <View style={styles.chipRow}>{['Alta', 'Media', 'Baixa'].map((item) => <Chip key={item} label={item} active={goalForm?.priority === item} onPress={() => setGoalForm({ ...goalForm, priority: item })} />)}</View>
        <Text style={styles.fieldLabel}>Tipo de prazo</Text>
        <View style={styles.chipRow}>{['Curto prazo', 'Medio prazo', 'Longo prazo'].map((item) => <Chip key={item} label={item} active={goalForm?.horizon === item} onPress={() => setGoalForm({ ...goalForm, horizon: item })} />)}</View>
        <Text style={styles.helpText}>Curto: semanas ou poucos meses. Medio: ate um ano. Longo: planos maiores.</Text>
        <Field label="Prazo ou lembrete" value={goalForm?.deadline} onChangeText={(value) => setGoalForm({ ...goalForm, deadline: value })} />
        <Field label="Observacoes" value={goalForm?.notes} onChangeText={(value) => setGoalForm({ ...goalForm, notes: value })} multiline />
      </FormModal>
    </ScrollView>
  );
}

function Projection({ data }) {
  const [offset, setOffset] = useState(0);
  const base = new Date();
  const current = new Date(base.getFullYear(), base.getMonth() + offset, 1);
  const key = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
  const obligations = data.transactions.filter((item) => {
    if (!item.date) return false;
    if (item.date.startsWith(key)) return true;
    if (item.recurring) return true;
    return false;
  });
  const income = obligations.filter((item) => item.type === 'income').reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const expense = obligations.filter((item) => item.type === 'expense').reduce((sum, item) => sum + Number(item.amount || 0), 0);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.title}>Projecoes</Text>
      <Card>
        <View style={styles.row}>
          <Pressable style={styles.smallButton} onPress={() => setOffset((value) => value - 1)}><Text style={styles.smallButtonText}>{'<'}</Text></Pressable>
          <Text style={styles.cardTitle}>{current.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</Text>
          <Pressable style={styles.smallButton} onPress={() => setOffset((value) => value + 1)}><Text style={styles.smallButtonText}>{'>'}</Text></Pressable>
        </View>
      </Card>
      <View style={styles.statGrid}>
        <Stat label="Entradas" value={money.format(income)} tone="green" />
        <Stat label="Saidas" value={money.format(expense)} tone="red" />
      </View>
      <Card>
        <Text style={styles.cardTitle}>Compromissos previstos</Text>
        {obligations.map((item) => <TransactionRow key={`${item.id}-${key}`} item={item} />)}
        {obligations.length === 0 && <Text style={styles.muted}>Sem compromissos previstos.</Text>}
      </Card>
    </ScrollView>
  );
}

function SettingsScreen({ data, setData, markDirty, syncState, accessToken, updateState, onConnect, onDisconnect, syncNow, onCheckUpdates }) {
  const [category, setCategory] = useState('');
  const [account, setAccount] = useState('');
  const devices = syncState.devices || [];

  const addListItem = (field, value, setter) => {
    if (!value.trim()) return;
    setData((current) => ({ ...current, settings: { ...current.settings, [field]: [...current.settings[field], value.trim()] } }));
    setter('');
    markDirty();
  };

  const removeListItem = (field, value) => {
    setData((current) => ({ ...current, settings: { ...current.settings, [field]: current.settings[field].filter((item) => item !== value) } }));
    markDirty();
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.title}>Ajustes</Text>
      <Card>
        <View style={styles.row}>
          <View style={styles.rowText}>
            <Text style={styles.cardTitle}>Google Drive</Text>
            <Text style={styles.muted}>Sincronize desktop e celular usando a sua conta Google.</Text>
          </View>
          {syncState.state === 'syncing' || syncState.state === 'connecting' ? <ActivityIndicator color="#0a84ff" /> : null}
        </View>
        <View style={[styles.statusPill, syncState.state === 'error' && styles.statusDanger, syncState.state === 'conflict' && styles.statusDanger]}>
          <Text style={[styles.statusText, (syncState.state === 'error' || syncState.state === 'conflict') && styles.statusDangerText]}>{syncState.message || 'Nao conectado'}</Text>
        </View>
        <Text style={styles.smallInfo}>Ultima sync: {formatDate(syncState.lastSyncAt)}</Text>
        <Text style={styles.smallInfo}>Revisao: {syncState.remoteRevision || 0}</Text>
        {!accessToken ? (
          <Pressable style={styles.primary} onPress={onConnect}><Text style={styles.primaryText}>Conectar Google Drive</Text></Pressable>
        ) : (
          <View>
            <Pressable style={styles.primary} onPress={() => syncNow('auto')}><Text style={styles.primaryText}>Sincronizar agora</Text></Pressable>
            <Pressable style={styles.secondary} onPress={onDisconnect}><Text style={styles.secondaryText}>Desconectar</Text></Pressable>
          </View>
        )}
        {syncState.state === 'conflict' && (
          <View style={styles.conflictBox}>
            <Text style={styles.cardTitle}>Conflito detectado</Text>
            <Text style={styles.muted}>Escolha a versao que deve prevalecer.</Text>
            <View style={styles.actionRow}>
              <Pressable style={styles.secondary} onPress={() => syncNow('remote')}><Text style={styles.secondaryText}>Usar nuvem</Text></Pressable>
              <Pressable style={styles.primaryInline} onPress={() => syncNow('local')}><Text style={styles.primaryText}>Enviar celular</Text></Pressable>
            </View>
          </View>
        )}
      </Card>
      <Card>
        <Text style={styles.cardTitle}>Dispositivos</Text>
        {devices.map((device) => <View style={styles.deviceRow} key={device.id}><Text style={styles.rowTitle}>{device.name}</Text><Text style={styles.muted}>{device.platform} · {formatDate(device.lastSeenAt)}</Text></View>)}
        {devices.length === 0 && <Text style={styles.muted}>Nenhum dispositivo conectado ainda.</Text>}
      </Card>
      <Card>
        <View style={styles.row}>
          <View style={styles.rowText}>
            <Text style={styles.cardTitle}>Atualizacoes</Text>
            <Text style={styles.muted}>
              {updateState?.hasUpdate
                ? `Nova versao ${updateState.latestVersion} disponivel.`
                : updateState?.state === 'checking'
                  ? 'Procurando atualizacoes no GitHub...'
                  : updateState?.message || 'O Finch verifica novas versoes ao abrir.'}
            </Text>
          </View>
          {updateState?.state === 'checking' ? <ActivityIndicator color="#0a84ff" /> : null}
        </View>
        <Text style={styles.smallInfo}>Versao instalada: {appVersion}</Text>
        {updateState?.latestVersion ? <Text style={styles.smallInfo}>Ultima no GitHub: {updateState.latestVersion}</Text> : null}
        {updateState?.apkName ? <Text style={styles.smallInfo}>Arquivo: {updateState.apkName}</Text> : null}
        <View style={styles.actionRow}>
          <Pressable style={styles.secondary} onPress={onCheckUpdates}>
            <Text style={styles.secondaryText}>Procurar agora</Text>
          </Pressable>
          {updateState?.hasUpdate && (
            <Pressable style={styles.primaryInline} onPress={() => Linking.openURL(updateState.downloadUrl || githubReleasesUrl)}>
              <Text style={styles.primaryText}>Baixar APK</Text>
            </Pressable>
          )}
        </View>
      </Card>
      <Card>
        <Text style={styles.cardTitle}>Preferencias</Text>
        <Field label="Como podemos chamar?" value={data.settings.userName} onChangeText={(value) => { setData((current) => ({ ...current, settings: { ...current.settings, userName: value } })); markDirty(); }} />
        <Field label="Orcamento mensal" value={data.settings.monthlyBudget} onChangeText={(value) => { setData((current) => ({ ...current, settings: { ...current.settings, monthlyBudget: parseMoney(value) } })); markDirty(); }} keyboardType="decimal-pad" />
      </Card>
      <Card>
        <Text style={styles.cardTitle}>Categorias</Text>
        <View style={styles.chipRow}>{data.settings.categories.map((item) => <Chip key={item} label={item} onPress={() => removeListItem('categories', item)} />)}</View>
        <Field label="Adicionar categoria" value={category} onChangeText={setCategory} />
        <Pressable style={styles.secondary} onPress={() => addListItem('categories', category, setCategory)}><Text style={styles.secondaryText}>Adicionar</Text></Pressable>
      </Card>
      <Card>
        <Text style={styles.cardTitle}>Contas</Text>
        <View style={styles.chipRow}>{data.settings.accounts.map((item) => <Chip key={item} label={item} onPress={() => removeListItem('accounts', item)} />)}</View>
        <Field label="Adicionar conta" value={account} onChangeText={setAccount} />
        <Pressable style={styles.secondary} onPress={() => addListItem('accounts', account, setAccount)}><Text style={styles.secondaryText}>Adicionar</Text></Pressable>
      </Card>
    </ScrollView>
  );
}

export default function App() {
  const [active, setActive] = useState('dashboard');
  const [data, setData] = useState(seed);
  const [accessToken, setAccessToken] = useState('');
  const [syncState, setSyncState] = useState({ state: 'idle', message: 'Nao conectado' });
  const [updateState, setUpdateState] = useState({ state: 'idle', message: 'Nenhuma verificacao feita ainda.' });
  const [dirty, setDirty] = useState(false);
  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: googleClientId,
    scopes,
    selectAccount: true
  });

  const applyToken = async (authentication) => {
    if (!authentication?.accessToken) return false;
    await saveToken(authentication);
    setAccessToken(authentication.accessToken);
    setSyncState({ state: 'connected', message: 'Google Drive conectado.' });
    return true;
  };

  const exchangeCode = async (result) => {
    if (!result?.params?.code || !request?.redirectUri) return null;
    const exchange = new AccessTokenRequest({
      clientId: googleClientId,
      redirectUri: request.redirectUri,
      scopes,
      code: result.params.code,
      extraParams: { code_verifier: request.codeVerifier || '' }
    });
    return exchange.performAsync(Google.discovery);
  };

  const handleAuthResult = async (result) => {
    if (!result) return;
    if (result.type === 'cancel' || result.type === 'dismiss') {
      setSyncState({ state: 'not-connected', message: 'Login cancelado.' });
      return;
    }
    if (result.type === 'error') {
      setSyncState({ state: 'error', message: result.error?.message || 'Erro no login Google.' });
      return;
    }
    if (result.type === 'success') {
      const authentication = result.authentication || (result.params?.access_token ? { accessToken: result.params.access_token } : null) || await exchangeCode(result);
      const applied = await applyToken(authentication);
      if (!applied) setSyncState({ state: 'error', message: 'Login concluido, mas o token nao voltou para o app.' });
    }
  };

  const runUpdateCheck = async ({ silent = false } = {}) => {
    setUpdateState((current) => ({ ...current, state: 'checking', message: 'Procurando atualizacoes no GitHub...' }));
    try {
      const info = await checkGithubUpdate();
      const nextState = {
        ...info,
        state: info.hasUpdate ? 'available' : 'updated',
        message: info.hasUpdate ? `Nova versao ${info.latestVersion} disponivel.` : 'Seu Finch Mobile esta atualizado.'
      };
      setUpdateState(nextState);
      if (info.hasUpdate && !silent) {
        Alert.alert('Atualizacao disponivel', `A versao ${info.latestVersion} ja esta no GitHub.`, [
          { text: 'Depois', style: 'cancel' },
          { text: 'Baixar', onPress: () => Linking.openURL(info.downloadUrl || githubReleasesUrl) }
        ]);
      }
      return nextState;
    } catch (error) {
      const nextState = { state: 'error', message: error.message || 'Nao foi possivel procurar atualizacoes.' };
      setUpdateState(nextState);
      if (!silent) Alert.alert('Atualizacoes', nextState.message);
      return nextState;
    }
  };

  useEffect(() => {
    let alive = true;
    loadLocalCache().then((cache) => { if (alive && cache) setData(normalizeData(cache)); });
    loadToken().then((token) => { if (alive && token?.accessToken) setAccessToken(token.accessToken); });
    runUpdateCheck({ silent: true });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    handleAuthResult(response).catch((error) => setSyncState({ state: 'error', message: error.message || 'Falha no login Google.' }));
  }, [response]);

  useEffect(() => {
    if (!accessToken) return;
    getDriveStatus(accessToken)
      .then((status) => setSyncState(status))
      .catch((error) => setSyncState({ state: 'error', message: error.message || 'Erro ao consultar Google Drive.' }));
  }, [accessToken]);

  useEffect(() => {
    saveLocalCache(data).catch(() => {});
    if (!dirty || !accessToken) return;
    const timeout = setTimeout(() => runSync('auto'), 1200);
    return () => clearTimeout(timeout);
  }, [dirty, data, accessToken]);

  const markDirty = () => setDirty(true);

  const runSync = async (force = 'auto') => {
    if (!accessToken) {
      setSyncState({ state: 'not-connected', message: 'Entre com sua conta Google para sincronizar.' });
      return {};
    }
    setSyncState((current) => ({ ...current, state: 'syncing', message: 'Sincronizando com o Google Drive...' }));
    try {
      const result = await syncWithGoogleDrive({ data, accessToken, force });
      setSyncState(result);
      if (result.downloadedData) setData(normalizeData(result.downloadedData));
      if (result.uploadedData) setData(normalizeData(result.uploadedData));
      if (result.ok) setDirty(false);
      return result;
    } catch (error) {
      const message = error.message || 'Nao foi possivel sincronizar.';
      setSyncState({ state: 'error', message });
      Alert.alert('Sincronizacao', message);
      return { ok: false, message };
    }
  };

  const connect = async () => {
    if (!googleClientId) return Alert.alert('Google Drive', 'Client ID Android nao configurado no APK.');
    if (!request) return setSyncState({ state: 'connecting', message: 'Preparando login do Google...' });
    setSyncState({ state: 'connecting', message: 'Abrindo login do Google...' });
    try {
      const result = await promptAsync();
      await handleAuthResult(result);
    } catch (error) {
      setSyncState({ state: 'error', message: error.message || 'Nao foi possivel abrir o login.' });
    }
  };

  const disconnect = async () => {
    await clearToken();
    setAccessToken('');
    setSyncState({ state: 'not-connected', message: 'Google Drive desconectado.' });
  };

  const screen = {
    dashboard: <Dashboard data={data} />,
    wallet: <Wallet data={data} setData={setData} markDirty={markDirty} />,
    future: <Future data={data} setData={setData} markDirty={markDirty} />,
    projection: <Projection data={data} />,
    settings: (
      <SettingsScreen
        data={data}
        setData={setData}
        markDirty={markDirty}
        syncState={syncState}
        accessToken={accessToken}
        updateState={updateState}
        onConnect={connect}
        onDisconnect={disconnect}
        syncNow={runSync}
        onCheckUpdates={() => runUpdateCheck({ silent: false })}
      />
    )
  }[active];

  return (
    <SafeAreaView style={styles.shell}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.brand}>finch</Text>
        <Text style={styles.headerStatus}>{syncState.state === 'syncing' ? 'Sincronizando...' : syncState.state === 'connected' || syncState.state === 'synced' ? 'Drive conectado' : 'Google Drive'}</Text>
      </View>
      {screen}
      <View style={styles.tabbar}>
        {tabs.map(([id, label]) => (
          <Pressable style={[styles.tab, active === id && styles.tabActive]} key={id} onPress={() => setActive(id)}>
            <Text style={[styles.tabText, active === id && styles.tabTextActive]}>{label}</Text>
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: '#08090d' },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 8 },
  brand: { color: '#f7f8fb', fontSize: 26, fontWeight: '900' },
  headerStatus: { color: '#c5cad6', fontWeight: '900' },
  content: { gap: 14, padding: 20, paddingBottom: 110 },
  eyebrow: { color: '#0a84ff', fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  title: { color: '#f7f8fb', fontSize: 38, fontWeight: '900', letterSpacing: 0, lineHeight: 42 },
  sectionLabel: { color: '#aeb5c4', fontSize: 13, fontWeight: '900', marginTop: 10, textTransform: 'uppercase' },
  card: { backgroundColor: '#1b1f29', borderColor: '#3c4354', borderRadius: 24, borderWidth: 1, padding: 18 },
  cardTitle: { color: '#f7f8fb', fontSize: 19, fontWeight: '900', marginBottom: 8 },
  muted: { color: '#c0c7d6', fontSize: 14, fontWeight: '700', lineHeight: 21 },
  smallInfo: { color: '#aeb7c8', fontSize: 12, fontWeight: '900', marginTop: 8 },
  helpText: { color: '#7dbdff', fontSize: 13, fontWeight: '800', lineHeight: 18, marginVertical: 8 },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  stat: { minWidth: '47%', flex: 1 },
  statValue: { color: '#f7f8fb', fontSize: 24, fontWeight: '900', marginTop: 6 },
  bigNumber: { color: '#f7f8fb', fontSize: 34, fontWeight: '900' },
  green: { color: '#34c759', fontWeight: '900' },
  red: { color: '#ff6b6b', fontWeight: '900' },
  row: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  rowText: { flex: 1 },
  rowTitle: { color: '#f7f8fb', fontSize: 16, fontWeight: '850' },
  listItem: { alignItems: 'center', borderBottomColor: '#242834', borderBottomWidth: 1, flexDirection: 'row', gap: 10, paddingVertical: 12 },
  field: { marginBottom: 12 },
  fieldLabel: { color: '#aeb5c4', fontSize: 13, fontWeight: '900', marginBottom: 7 },
  input: { backgroundColor: '#10141d', borderColor: '#465064', borderRadius: 16, borderWidth: 1, color: '#f7f8fb', fontSize: 16, fontWeight: '800', padding: 14 },
  textArea: { minHeight: 92, textAlignVertical: 'top' },
  primary: { alignItems: 'center', backgroundColor: '#0a84ff', borderRadius: 18, marginTop: 14, padding: 16 },
  headerButton: { alignItems: 'center', backgroundColor: '#0a84ff', borderRadius: 16, paddingHorizontal: 18, paddingVertical: 12 },
  primaryInline: { alignItems: 'center', backgroundColor: '#0a84ff', borderRadius: 16, flex: 1, padding: 14 },
  primaryText: { color: '#fff', fontSize: 16, fontWeight: '900' },
  secondary: { alignItems: 'center', backgroundColor: '#242936', borderColor: '#41495b', borderRadius: 18, borderWidth: 1, flex: 1, marginTop: 10, padding: 15 },
  secondaryText: { color: '#f7f8fb', fontSize: 15, fontWeight: '900' },
  smallButton: { alignItems: 'center', backgroundColor: '#20232c', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 8 },
  smallButtonText: { color: '#f7f8fb', fontWeight: '900' },
  deleteButton: { backgroundColor: '#32151a' },
  deleteText: { color: '#ff6b6b', fontWeight: '900' },
  dangerSoft: { backgroundColor: '#32151a', borderColor: '#5b222b' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  chip: { backgroundColor: '#242936', borderColor: '#41495b', borderRadius: 999, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 9 },
  chipActive: { backgroundColor: '#0a84ff', borderColor: '#0a84ff' },
  chipDanger: { backgroundColor: '#32151a', borderColor: '#5b222b' },
  chipText: { color: '#d5dae5', fontWeight: '900' },
  chipTextActive: { color: '#fff' },
  switcher: { flexDirection: 'row', gap: 8 },
  progressTrack: { backgroundColor: '#2b2f3a', borderRadius: 999, height: 8, marginVertical: 12, overflow: 'hidden' },
  progressFill: { backgroundColor: '#0a84ff', height: '100%' },
  statusPill: { alignSelf: 'flex-start', backgroundColor: '#102a4a', borderRadius: 999, marginTop: 14, paddingHorizontal: 12, paddingVertical: 8 },
  statusDanger: { backgroundColor: '#4a1820' },
  statusText: { color: '#75b7ff', fontWeight: '900' },
  statusDangerText: { color: '#ffb3bf' },
  warning: { color: '#ffcc66', fontWeight: '800', marginTop: 12 },
  conflictBox: { backgroundColor: '#101821', borderColor: '#22364f', borderRadius: 18, borderWidth: 1, marginTop: 14, padding: 14 },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  categoryRow: { alignItems: 'center', borderBottomColor: '#242834', borderBottomWidth: 1, flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 9 },
  deviceRow: { borderBottomColor: '#242834', borderBottomWidth: 1, gap: 4, paddingVertical: 10 },
  purchaseCard: { backgroundColor: '#17191f', borderColor: '#2b2f3a', borderRadius: 26, borderWidth: 1, overflow: 'hidden' },
  purchaseImage: { backgroundColor: '#232631', height: 170, width: '100%' },
  purchaseImagePlaceholder: { alignItems: 'center', backgroundColor: '#22252e', height: 150, justifyContent: 'center' },
  purchaseBody: { gap: 8, padding: 18 },
  badge: { alignSelf: 'flex-start', borderColor: '#3a3f4d', borderRadius: 999, borderWidth: 1, color: '#c5cad6', fontSize: 12, fontWeight: '900', paddingHorizontal: 10, paddingVertical: 5 },
  priority: { color: '#0a84ff', fontSize: 13, fontWeight: '900' },
  promoText: { color: '#ffcc66', fontWeight: '900' },
  modalBackdrop: { backgroundColor: 'rgba(0,0,0,0.72)', flex: 1, justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#1b1f29', borderColor: '#3c4354', borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, maxHeight: '88%', padding: 18 },
  modalTitle: { color: '#f7f8fb', fontSize: 24, fontWeight: '900' },
  modalContent: { paddingVertical: 16 },
  iconButton: { alignItems: 'center', backgroundColor: '#20232c', borderRadius: 16, height: 40, justifyContent: 'center', width: 40 },
  iconButtonText: { color: '#f7f8fb', fontWeight: '900' },
  tabbar: { backgroundColor: '#11131a', borderColor: '#2b2f3a', borderTopWidth: 1, bottom: 0, flexDirection: 'row', gap: 6, left: 0, padding: 10, position: 'absolute', right: 0 },
  tab: { alignItems: 'center', borderRadius: 16, flex: 1, paddingVertical: 12 },
  tabActive: { backgroundColor: '#0a84ff' },
  tabText: { color: '#8b92a4', fontSize: 12, fontWeight: '900' },
  tabTextActive: { color: '#fff' }
});
