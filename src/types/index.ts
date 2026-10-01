export type StatusTarefa = 'BACKLOG' | 'EM_ANDAMENTO' | 'EM_REVISAO' | 'CONCLUIDO';

export type PrioridadeTarefa = 'BAIXA' | 'MEDIA' | 'ALTA';

export type TaskSyncStatus = 'SYNCED' | 'PENDING' | 'ERROR';

export interface TaskAttachment {
  id: string;
  taskId: string;
  uri: string;
  nome: string;
  tamanho?: number;
  mimeType?: string;
  syncStatus?: TaskSyncStatus;
  createdAt: string;
}

export interface SubTask {
  id: string;
  taskId: string;
  titulo: string;
  concluida: boolean;
  ordem?: number;
}

export interface Task {
  id: string;
  titulo: string;
  referenceNumber?: number | null;
  referenceCode?: string | null;
  descricao?: string | null;
  projetoId: string;
  columnId?: string | null;
  status: StatusTarefa;
  prioridade: PrioridadeTarefa;
  progresso: number;
  tags?: string[];
  endereco?: string | null;
  responsavel?: string | null;
  responsavelId?: string | null;
  assigneeName?: string | null;
  assigneeInitials?: string | null;
  prazo?: string | null;
  estimativaH?: number | null;
  clienteId?: string | null;
  clienteName?: string | null;
  orderId?: string | null;
  orderNumber?: string | null;
  orderTotal?: number | null;
  /** Tipo da tarefa no backend (GERAL, COMPROMISSO, PEDIDO, ORCAMENTO). */
  tipo?: TipoTask | string | null;
  /** Confirmação de execução (check-in) — presente quando concluída. */
  confirmation?: TaskActivityConfirmation | null;
  parentId?: string | null;
  ordem?: number;
  subtarefas?: SubTask[];
  anexos?: TaskAttachment[];
  syncStatus?: TaskSyncStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTaskDTO {
  id?: string;
  titulo: string;
  referenceCode?: string | null;
  descricao?: string | null;
  projetoId: string;
  columnId?: string | null;
  status?: StatusTarefa;
  prioridade?: PrioridadeTarefa;
  progresso?: number;
  tags?: string[];
  endereco?: string | null;
  responsavel?: string | null;
  responsavelId?: string | null;
  prazo?: string | null;
  estimativaH?: number | null;
  clienteId?: string | null;
  clienteName?: string | null;
  parentId?: string | null;
}

export interface UpdateTaskDTO {
  titulo?: string;
  referenceCode?: string | null;
  descricao?: string | null;
  projetoId?: string;
  columnId?: string | null;
  status?: StatusTarefa;
  prioridade?: PrioridadeTarefa;
  progresso?: number;
  tags?: string[];
  endereco?: string | null;
  responsavel?: string | null;
  responsavelId?: string | null;
  prazo?: string | null;
  estimativaH?: number | null;
  clienteId?: string | null;
  clienteName?: string | null;
  parentId?: string | null;
}

export interface TransferTaskDTO {
  targetProjetoId: string;
  parentTaskId?: string;
}

export interface Project {
  id: string;
  nome: string;
  setor?: string;
  descricao?: string;
  taskPrefix?: string | null;
  taskSequence?: number;
  teamId?: string | null;
  teamName?: string | null;
  responsibleId?: string | null;
  responsibleName?: string | null;
  cor?: string;
  icone?: string;
  tarefasCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  id: string;
  nome: string;
  email: string;
  avatarUrl?: string;
  role?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string;
}

export interface LoginCredentials {
  email: string;
  senha?: string;
  password?: string;
}

export interface OutboxMutation {
  id: string;
  entityId: string;
  entityType: 'TASK' | 'PROJECT' | 'ATTACHMENT';
  action:
    | 'CREATE'
    | 'UPDATE'
    | 'UPDATE_STATUS'
    | 'UPDATE_PROGRESS'
    | 'DELETE'
    | 'TRANSFER'
    | 'UPLOAD_ATTACHMENT'
    | 'DELETE_ATTACHMENT';
  payload: Record<string, unknown>;
  createdAt: string;
  retryCount: number;
  status: 'PENDING' | 'SYNCING' | 'ERROR';
  errorMessage?: string;
}

export interface SyncStatusInfo {
  isConnected: boolean;
  isSyncing: boolean;
  pendingCount: number;
  errorCount: number;
  lastSyncedAt: string | null;
}

/* =========================================================================
 * Atividades de campo — paridade com lavifort-API (tasks/COMPROMISSO)
 * POST /tasks/:id/confirm-activity exige { latitude, longitude, accuracyMeters }.
 * "Não executada" é estado de filtro (sem endpoint de mutação no backend).
 * ========================================================================= */

export type TipoTask = 'GERAL' | 'COMPROMISSO' | 'PEDIDO' | 'ORCAMENTO';

export interface TaskActivityConfirmation {
  id: string;
  taskId: string;
  confirmedById: string;
  confirmedAt: string;
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  createdAt: string;
}

export interface ConfirmActivityInput {
  latitude: number;
  longitude: number;
  accuracyMeters: number;
}

/* =========================================================================
 * Módulos operacionales — tipos alineados con los contratos de lavifort-API
 * (paridad con larvifort-crm/src/services/{orders,clients,deliveries,stock}.ts)
 * ========================================================================= */

// --- Pedidos / Orders -----------------------------------------------------
export type OrderStatus = 'ORCAMENTO' | 'PEDIDO';
export type OrderPhase =
  | 'DRAFT'
  | 'ABERTO'
  | 'PENDING'
  | 'APROVADO'
  | 'FATURADO'
  | 'ENTREGUE'
  | 'CANCELLED';

export interface OrderItem {
  id: string;
  productId: string | null;
  productCode: string | null;
  productName: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  totalPrice: number;
  notes: string | null;
}

export interface Order {
  id: string;
  orderNumber: string | null;
  status: OrderStatus;
  phase: OrderPhase;
  clientId: string;
  clientName: string | null;
  clientCpfCnpj: string | null;
  companyId: string | null;
  companyName: string | null;
  projectId: string | null;
  salesRepUserId: string | null;
  salesRepName: string | null;
  subtotal: number;
  discount: number;
  shippingCost: number;
  taxAmount: number;
  totalAmount: number;
  deliveryInstructions: string | null;
  shippingAddress: Record<string, unknown> | null;
  notes: string | null;
  orderDate: string;
  deliveryDate: string | null;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderStats {
  totalOrders: number;
  totalOrcamentos: number;
  totalPedidos: number;
  totalCancelled: number;
  totalRevenue: number;
  averageTicket: number;
  phaseCounts: Record<string, number>;
}

export interface CreateOrderInput {
  clientId: string;
  companyId?: string | null;
  projectId?: string | null;
  status?: OrderStatus;
  phase?: OrderPhase;
  deliveryDate?: string | null;
  deliveryInstructions?: string | null;
  shippingAddress?: Record<string, unknown> | null;
  notes?: string | null;
  items: Array<{
    productId?: string | null;
    productCode?: string | null;
    productName: string;
    unit: string;
    quantity: number;
    unitPrice: number;
    notes?: string | null;
  }>;
  linkTaskId?: string | null;
}

// --- Clientes -------------------------------------------------------------
export const CLIENT_STATUSES = [
  'NOVO',
  'SEM_CONTATO',
  'EM_NEGOCIACAO',
  'CLIENTE_ATIVO',
] as const;
export type ClienteStatus = (typeof CLIENT_STATUSES)[number];

export type ClienteOperationalStatus = 'ativo' | 'inativo';

/**
 * Payload de criação de cliente (paridade com CreateClientDto do backend).
 * vendedoraId: atribuição direta da vendedora responsável (além da região).
 */
export interface CreateClientInput {
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  cpfCnpj?: string | null;
  statusLead?: ClienteStatus;
  status?: ClienteOperationalStatus;
  origem?: string | null;
  pais?: string | null;
  cidade?: string | null;
  uf?: string | null;
  endereco?: string | null;
  observacoes?: string | null;
  empresaId?: string | null;
  vendedoraId?: string | null;
  regiaoId?: string | null;
}

/** Cliente cadastrado offline aguardando envio (fila local). */
export interface PendingClientRecord {
  id: string;
  input: CreateClientInput;
  clientName: string;
  createdAt: string;
}

/** Produto simplificado para seleção rápida em campo (GET /products). */
export interface ProductOption {
  id: string;
  name: string;
  unit: string;
  price: number | null;
}

/** Vendedora para atribuição de cliente (GET /users). */
export interface SalesRep {
  id: string;
  nome: string;
  email: string;
  role: string;
}

/** Pedido cadastrado offline aguardando envio (fila local). */
export interface PendingOrderRecord {
  id: string;
  input: CreateOrderInput;
  clientName: string;
  total: number;
  createdAt: string;
}

export interface Cliente {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  birthdate: string | null;
  cpfCnpj: string | null;
  statusLead: ClienteStatus;
  /** Status operacional real do cliente no backend ("ativo" | "inativo"). */
  status?: ClienteOperationalStatus;
  /** Região de atuação real (Task 1.2). Filtro preferencial da carteira. */
  regiaoId?: string | null;
  origem: string | null;
  pais: string | null;
  cidade: string | null;
  uf: string | null;
  endereco: string | null;
  observacoes: string | null;
  empresaId: string | null;
  laminaAgua: number;
  qtdViveiros: number;
  densidade: number;
  producaoMedia: number;
  temBercario: boolean;
  qtdBercarios: number;
  volumeBercarios: number;
  alimentadorAutomatico: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ClientsPage {
  items: Cliente[];
  total: number;
  page: number;
  pageSize: number;
}

// --- Entregas -------------------------------------------------------------
export interface Delivery {
  id: string;
  orderId: string;
  orderNumber: string | null;
  clientName: string | null;
  driverName: string | null;
  vehiclePlate: string | null;
  route: string | null;
  estimatedAt: string | null;
  status: string;
  problem: string | null;
}

// --- Estoque / Disponibilidad ---------------------------------------------
export interface StockAvailability {
  id: string;
  productId: string;
  unitId: string;
  productName: string;
  unit: string;
  unitName: string;
  locationName: string;
  available: number;
  reserved: number;
  blocked: number;
  updatedAt: string;
}

export interface StockMovementInput {
  productId: string;
  stockLocationId: string;
  type: 'ENTRADA' | 'SALIDA' | 'BLOQUEO' | 'AJUSTE';
  quantity: number;
  reason: string;
}

/* =========================================================================
 * Agenda — compromissos/agendamentos (módulo MOB-019)
 * Paridade com lavifort-API /appointments e /compromissos.
 * ========================================================================= */

export type TipoCompromisso = 'REUNIAO' | 'VISITA';

export interface Appointment {
  id: string;
  tipo: TipoCompromisso;
  titulo: string;
  data: string;
  horario: string | null;
  endereco: string | null;
  observacoes: string | null;
  clienteId: string | null;
  clienteName: string | null;
  empresaId: string | null;
  ownerId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAppointmentInput {
  tipo: TipoCompromisso;
  titulo: string;
  data: string;
  horario?: string | null;
  endereco?: string | null;
  observacoes?: string | null;
  clienteId: string;
  empresaId?: string | null;
}

export interface UpdateAppointmentInput {
  tipo?: TipoCompromisso;
  titulo?: string;
  data?: string;
  horario?: string | null;
  endereco?: string | null;
  observacoes?: string | null;
  clienteId?: string;
  empresaId?: string | null;
}

/* =========================================================================
 * Regiões & Carteira — Task 1.2 (CRM de campo da vendedora)
 * Paridade com lavifort-API GET /regions (fallback offline p/ lista default).
 * A verificação por região usa geofence (centro + raio) e/ou uf/cidade.
 * ========================================================================= */

export interface Region {
  id: string;
  nome: string;
  /** UFs que pertencem à região (ex.: ['CE']). */
  ufs: string[];
  /** Cidades da região (ex.: ['Fortaleza', 'Aracati']). */
  cidades: string[];
  /** Centro do geofence (verificação por GPS). Opcionais — null = sem geofence. */
  centerLat: number | null;
  centerLng: number | null;
  /** Raio de tolerância em km para considerar o ponto dentro da região. */
  radiusKm: number | null;
  /** Opcional: id da região atribuída à vendedora no backend. */
  salesRepRegionId?: string;
  /** Paridade com o backend: descrição e vendedora dona da região. */
  descricao?: string | null;
  vendedoraId?: string | null;
  ativa?: boolean;
}

export interface CheckinInput {
  clientId: string;
  clientName: string;
  regionId: string;
  regionName: string;
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  /** Quando a visita está vinculada a um compromisso (sync p/ /appointments/:id/checkin). */
  appointmentId?: string | null;
}

export type CheckinSyncStatus = 'PENDING' | 'SYNCED' | 'LOCAL';

export interface CheckinRecord extends CheckinInput {
  id: string;
  checkedInAt: string;
  syncStatus: CheckinSyncStatus;
}

export interface RegionVerification {
  inside: boolean;
  distanceKm: number;
}
