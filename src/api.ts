import {
  User,
  Product,
  ChamaGroup,
  PaymentRecord,
  DefaultRecord,
  RefundRequest,
  StoreCreditLedgerEntry,
  AuditLog,
} from './types.ts';

const USER_STORAGE_KEY = 'alibaird_current_user';

export function getStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user: User | null): void {
  if (user) {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_STORAGE_KEY);
  }
}

async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const user = getStoredUser();
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  if (user) {
    headers.set('x-user-id', String(user.id));
  }

  const res = await fetch(`/api${endpoint}`, {
    ...options,
    headers,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Server request failed');
  }
  return data as T;
}

export const api = {
  // Auth
  async getMe(): Promise<{ user: User }> {
    return fetchApi<{ user: User }>('/auth/me');
  },
  async login(payload: { phone: string; name?: string; role?: string; shopName?: string; shopDescription?: string }): Promise<{ user: User }> {
    const data = await fetchApi<{ user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    setStoredUser(data.user);
    return data;
  },
  async getUsersList(): Promise<{ users: Array<Partial<User>> }> {
    return fetchApi<{ users: Array<Partial<User>> }>('/auth/users');
  },
  logout(): void {
    setStoredUser(null);
  },

  // Products
  async getProducts(params?: { category?: string; search?: string; vendorId?: number }): Promise<{ products: Product[] }> {
    const q = new URLSearchParams();
    if (params?.category) q.set('category', params.category);
    if (params?.search) q.set('search', params.search);
    if (params?.vendorId) q.set('vendorId', String(params.vendorId));
    return fetchApi<{ products: Product[] }>(`/products?${q.toString()}`);
  },
  async getProduct(id: number): Promise<{ product: Product; groups: ChamaGroup[] }> {
    return fetchApi<{ product: Product; groups: ChamaGroup[] }>(`/products/${id}`);
  },
  async createProduct(data: Partial<Product>): Promise<{ product: Product }> {
    return fetchApi<{ product: Product }>('/products', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  async updateProduct(id: number, data: Partial<Product>): Promise<{ product: Product; message: string }> {
    return fetchApi<{ product: Product; message: string }>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Groups
  async getGroups(params?: { productId?: number; status?: string }): Promise<{ groups: ChamaGroup[] }> {
    const q = new URLSearchParams();
    if (params?.productId) q.set('productId', String(params.productId));
    if (params?.status) q.set('status', params.status);
    return fetchApi<{ groups: ChamaGroup[] }>(`/groups?${q.toString()}`);
  },
  async getGroup(id: number): Promise<{ group: ChamaGroup }> {
    return fetchApi<{ group: ChamaGroup }>(`/groups/${id}`);
  },
  async createGroup(data: { productId: number; size: number; name?: string }): Promise<{ group: ChamaGroup; message: string }> {
    return fetchApi<{ group: ChamaGroup; message: string }>('/groups', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  async joinGroup(id: number, inviteCode?: string): Promise<{ group: ChamaGroup; assignedSlot: number; message: string }> {
    return fetchApi<{ group: ChamaGroup; assignedSlot: number; message: string }>(`/groups/${id}/join`, {
      method: 'POST',
      body: JSON.stringify({ inviteCode }),
    });
  },
  async manageModerator(
    groupId: number,
    targetUserId: number,
    action: 'appoint' | 'remove' | 'transfer'
  ): Promise<{ group: ChamaGroup; message: string }> {
    return fetchApi<{ group: ChamaGroup; message: string }>(`/groups/${groupId}/moderator`, {
      method: 'POST',
      body: JSON.stringify({ targetUserId, action }),
    });
  },
  async markDefault(
    groupId: number,
    slotNumber: number,
    reason?: string
  ): Promise<{ group: ChamaGroup; defaultRecord: DefaultRecord; message: string }> {
    return fetchApi<{ group: ChamaGroup; defaultRecord: DefaultRecord; message: string }>(`/groups/${groupId}/default`, {
      method: 'POST',
      body: JSON.stringify({ slotNumber, reason }),
    });
  },
  async sendGroupChat(
    groupId: number,
    payload: { text?: string; kind?: string; targetUserId?: number; coinAmount?: number }
  ): Promise<{ group: ChamaGroup; message?: string }> {
    return fetchApi<{ group: ChamaGroup; message?: string }>(`/groups/${groupId}/chat`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Defaults & Refunds
  async getMyDefaults(): Promise<{ defaults: DefaultRecord[]; refunds: RefundRequest[] }> {
    return fetchApi<{ defaults: DefaultRecord[]; refunds: RefundRequest[] }>('/defaults/my');
  },
  async resolveDefault(defaultRecordId: number, option: 'refund' | 'store_credit' | 'alternate_purchase', userPhone?: string): Promise<{ message: string; refundRequest?: RefundRequest; creditBalance?: number }> {
    return fetchApi<{ message: string; refundRequest?: RefundRequest; creditBalance?: number }>('/defaults/resolve', {
      method: 'POST',
      body: JSON.stringify({ defaultRecordId, option, userPhone }),
    });
  },

  // Payments & Ledger
  async postPayment(payload: {
    type?: string;
    code: string;
    amount: number;
    groupId?: number;
    slotNumber?: number;
    productId?: number;
  }): Promise<{ payment: PaymentRecord; message: string }> {
    return fetchApi<{ payment: PaymentRecord; message: string }>('/payments', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  async getMyPayments(): Promise<{
    payments: PaymentRecord[];
    ledger: StoreCreditLedgerEntry[];
    credit: number;
    coins: number;
    points: number;
  }> {
    return fetchApi<{
      payments: PaymentRecord[];
      ledger: StoreCreditLedgerEntry[];
      credit: number;
      coins: number;
      points: number;
    }>('/payments/my');
  },
  async redeemPoints(): Promise<{ credit: number; points: number; message: string }> {
    return fetchApi<{ credit: number; points: number; message: string }>('/wallet/redeem-points', {
      method: 'POST',
    });
  },

  // Admin
  async getAdminOverview(): Promise<{
    pendingPayments: PaymentRecord[];
    allPayments: PaymentRecord[];
    refundRequests: RefundRequest[];
    merchants: User[];
    allUsers: User[];
    auditLogs: AuditLog[];
    groups: ChamaGroup[];
    products: Product[];
  }> {
    return fetchApi<{
      pendingPayments: PaymentRecord[];
      allPayments: PaymentRecord[];
      refundRequests: RefundRequest[];
      merchants: User[];
      allUsers: User[];
      auditLogs: AuditLog[];
      groups: ChamaGroup[];
      products: Product[];
    }>('/admin/overview');
  },
  async adminPaymentDecision(paymentId: number, decision: 'approve' | 'reject'): Promise<{ payment: PaymentRecord; message: string }> {
    return fetchApi<{ payment: PaymentRecord; message: string }>(`/admin/payments/${paymentId}/decision`, {
      method: 'POST',
      body: JSON.stringify({ decision }),
    });
  },
  async adminRefundStatus(refundId: number, status: string, adminNote?: string): Promise<{ refund: RefundRequest; message: string }> {
    return fetchApi<{ refund: RefundRequest; message: string }>(`/admin/refunds/${refundId}/status`, {
      method: 'POST',
      body: JSON.stringify({ status, adminNote }),
    });
  },
  async adminVerifyMerchant(merchantId: number, verified: boolean): Promise<{ merchant: User; message: string }> {
    return fetchApi<{ merchant: User; message: string }>(`/admin/merchants/${merchantId}/verify`, {
      method: 'POST',
      body: JSON.stringify({ verified }),
    });
  },
};
