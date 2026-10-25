export type UserRole = 'buyer' | 'merchant' | 'admin';

export interface User {
  id: number;
  name: string;
  phone: string;
  email?: string;
  role: UserRole;
  shopName?: string;
  shopDescription?: string;
  verified?: boolean;
  credit: number; // in KSh
  coins: number;
  points: number;
  lastActive: number;
  createdAt: number;
}

export interface SpeedOption {
  size: number; // number of members: 10, 8, 6, 4, 2
  cycleDays: number; // e.g., 10 days per member distribution
  dailyAmount: number; // KSh / day
  totalAmount: number; // Total product price
  description?: string;
}

export interface Product {
  id: number;
  title: string;
  description: string;
  category: string;
  price: number;
  wasPrice?: number;
  discountPercent?: number;
  images: string[];
  vendorId: number;
  vendorName: string;
  isFeatured?: boolean;
  live: boolean;
  moderationStatus: 'approved' | 'pending' | 'returned';
  moderationNote?: string;
  speedOptions: SpeedOption[];
  stockQuantity: number;
  attributes?: Record<string, string>;
  createdAt: number;
  updatedAt: number;
}

export interface GroupSlot {
  slotNumber: number; // 1 to size
  userId: number | null;
  userName: string | null;
  userPhone?: string | null;
  status: 'active' | 'open' | 'replacement_eligible' | 'defaulted';
  inviteCode: string;
  paidAmount: number;
  targetAmount: number;
  lastPaymentDate?: number;
  joinedAt?: number;
  isDefaulter?: boolean;
}

export interface GroupChatMessage {
  id: string;
  senderId: number;
  senderName: string;
  kind?: 'normal' | 'reward' | 'nudge' | 'system';
  text: string;
  timestamp: number;
}

export interface ChamaGroup {
  id: number;
  productId: number;
  productTitle: string;
  productPrice: number;
  productImage?: string;
  name: string;
  size: number;
  adminId: number; // initial creator and moderator
  moderators: number[]; // array of userIds
  status: 'active' | 'full' | 'completed' | 'cancelled';
  inviteCode: string;
  dailyAmount: number;
  cycleDays: number;
  slots: GroupSlot[];
  occupiedCount: number;
  availableCount: number;
  chat: GroupChatMessage[];
  createdAt: number;
}

export interface DefaultRecord {
  id: number;
  userId: number;
  userName: string;
  groupId: number;
  groupName: string;
  slotNumber: number;
  productTitle: string;
  totalObligation: number;
  amountPaid: number;
  amountOutstanding: number;
  defaultDate: number;
  reason: string;
  replacementStatus: 'available' | 'claimed';
  replacementUserId?: number;
  resolutionOption?: 'refund' | 'store_credit' | 'alternate_purchase';
  resolutionStatus: 'pending' | 'completed';
  refundRequestId?: number;
}

export interface RefundRequest {
  id: number;
  userId: number;
  userName: string;
  userPhone: string;
  defaultRecordId: number;
  groupId: number;
  productTitle: string;
  amountPaid: number;
  eligibleRefundAmount: number;
  status: 'requested' | 'under_review' | 'approved' | 'processing' | 'completed' | 'rejected';
  adminNote?: string;
  requestedAt: number;
  processedAt?: number;
}

export interface PaymentRecord {
  id: number;
  type: 'group_installment' | 'listing_fee' | 'coin_purchase';
  userId: number;
  userName: string;
  code: string; // M-Pesa transaction reference
  amount: number;
  groupId?: number;
  groupName?: string;
  slotNumber?: number;
  productId?: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: number;
  approvedAt?: number;
}

export interface StoreCreditLedgerEntry {
  id: number;
  userId: number;
  amount: number; // + or -
  balanceAfter: number;
  type: 'default_conversion' | 'point_redemption' | 'purchase_deduction' | 'admin_adjustment';
  referenceId?: string;
  note: string;
  createdAt: number;
}

export interface PeerLoanRequest {
  id: number;
  groupId: number;
  groupName: string;
  slotNumber: number;
  requesterId: number;
  requesterName: string;
  requesterPhone?: string;
  amount: number;
  purpose: string;
  status: 'open' | 'funded' | 'cancelled';
  createdAt: number;
  fundedByUserId?: number;
  fundedByUserName?: string;
  fundedAt?: number;
  platformFeeAmount: number; // 1% of amount
  platformFeeStatus: 'pending' | 'paid';
  externalAgreementAcknowledged: boolean;
}

export interface MemberStatement {
  user: User;
  totalPaid: number;
  currentCredit: number;
  activeSlots: {
    groupId: number;
    groupName: string;
    productTitle: string;
    slotNumber: number;
    dailyAmount: number;
    targetAmount: number;
    paidAmount: number;
    progressPercent: number;
    cycleDays: number;
    deliveryDay: number;
    status: string;
  }[];
  transactions: {
    id: number;
    date: number;
    reference: string;
    type: string;
    description: string;
    debit?: number;
    credit?: number;
    status: string;
  }[];
}

export interface AuditLog {
  id: number;
  timestamp: number;
  actorId: number;
  actorName: string;
  action: string;
  details: string;
}

