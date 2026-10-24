import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  User,
  Product,
  ChamaGroup,
  GroupSlot,
  DefaultRecord,
  RefundRequest,
  PaymentRecord,
  StoreCreditLedgerEntry,
  AuditLog,
  SpeedOption,
} from '../src/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../data');
const DB_FILE = path.resolve(DATA_DIR, 'alibaird_db.json');

export interface DatabaseSchema {
  users: User[];
  products: Product[];
  groups: ChamaGroup[];
  defaultRecords: DefaultRecord[];
  refundRequests: RefundRequest[];
  payments: PaymentRecord[];
  storeCreditLedger: StoreCreditLedgerEntry[];
  auditLogs: AuditLog[];
  nextIds: {
    user: number;
    product: number;
    group: number;
    defaultRecord: number;
    refundRequest: number;
    payment: number;
    ledger: number;
    audit: number;
  };
}

let dbCache: DatabaseSchema | null = null;
let writeLock: Promise<void> = Promise.resolve();

function generateCode(length = 6): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function getInitialDatabase(): DatabaseSchema {
  const now = Date.now();
  const dayMs = 86400000;

  const users: User[] = [
    {
      id: 1,
      name: 'Alibaird System Admin',
      phone: '0700000000',
      email: 'admin@alibaird.com',
      role: 'admin',
      credit: 0,
      coins: 200,
      points: 500,
      lastActive: now,
      createdAt: now - 30 * dayMs,
    },
    {
      id: 2,
      name: 'Alibaird Direct Electronics & Home',
      phone: '0722000000',
      email: 'direct@alibaird.com',
      role: 'merchant',
      shopName: 'Alibaird Direct Official',
      shopDescription: 'Official verified distributor of solar generators, appliances & smart electronics.',
      verified: true,
      credit: 0,
      coins: 100,
      points: 250,
      lastActive: now,
      createdAt: now - 20 * dayMs,
    },
    {
      id: 3,
      name: 'Samuel Mwangi',
      phone: '0712345678',
      role: 'buyer',
      credit: 0,
      coins: 50,
      points: 120,
      lastActive: now,
      createdAt: now - 10 * dayMs,
    },
    {
      id: 4,
      name: 'Faith Chebet',
      phone: '0723456789',
      role: 'buyer',
      credit: 0,
      coins: 40,
      points: 80,
      lastActive: now,
      createdAt: now - 8 * dayMs,
    },
  ];

  const products: Product[] = [
    {
      id: 1,
      title: 'EcoFlow Portable Solar Power Station (1024Wh / 1800W)',
      description: 'Heavy duty portable solar power backup generator with ultra-fast AC charging, dual PD 100W USB-C ports, and intelligent LCD battery monitor. Ideal for home outages, off-grid appliances, and emergency power.',
      category: 'Appliances',
      price: 68000,
      wasPrice: 78000,
      discountPercent: 13,
      images: ['/src/assets/images/solar_power_backup_station_1792852473757.jpg'],
      vendorId: 2,
      vendorName: 'Alibaird Direct Official',
      isFeatured: true,
      live: true,
      moderationStatus: 'approved',
      stockQuantity: 15,
      attributes: {
        Capacity: '1024Wh LiFePO4',
        Output: '1800W Pure Sine Wave',
        Cycles: '3,000+ Cycles to 80%',
        Warranty: '2 Years Manufacturer',
      },
      speedOptions: [
        { size: 10, cycleDays: 10, dailyAmount: 680, totalAmount: 68000, description: '10 members · KSh 680 daily · Delivery rotation every 10 days' },
        { size: 6, cycleDays: 10, dailyAmount: 1134, totalAmount: 68000, description: '6 members · KSh 1,134 daily · Accelerated 60-day cycle' },
        { size: 4, cycleDays: 10, dailyAmount: 1700, totalAmount: 68000, description: '4 members · KSh 1,700 daily · Express 40-day delivery' },
        { size: 2, cycleDays: 10, dailyAmount: 3400, totalAmount: 68000, description: '2 members · KSh 3,400 daily · Fast-track 20-day duo' },
      ],
      createdAt: now - 5 * dayMs,
      updatedAt: now - 5 * dayMs,
    },
    {
      id: 2,
      title: 'Culinary Pro 10-Piece Stainless Steel Tri-Ply Cookware Set',
      description: 'Professional grade surgical stainless steel with impact-bonded aluminum core for even heat distribution. Suitable for induction, gas, and electric stovetops. Oven safe to 260°C.',
      category: 'Kitchen',
      price: 14500,
      wasPrice: 17000,
      discountPercent: 15,
      images: ['/src/assets/images/stainless_cookware_set_1792852473733.jpg'],
      vendorId: 2,
      vendorName: 'Alibaird Direct Official',
      isFeatured: true,
      live: true,
      moderationStatus: 'approved',
      stockQuantity: 28,
      attributes: {
        Material: '18/10 Stainless Steel',
        Pieces: '10 Pcs with Tempered Lids',
        Compatibility: 'Induction / Gas / Ceramic',
        Cleaning: 'Dishwasher Safe',
      },
      speedOptions: [
        { size: 10, cycleDays: 10, dailyAmount: 145, totalAmount: 14500, description: '10 members · KSh 145 daily · One set delivered every 10 days' },
        { size: 6, cycleDays: 10, dailyAmount: 242, totalAmount: 14500, description: '6 members · KSh 242 daily · Completed in 60 days' },
        { size: 4, cycleDays: 10, dailyAmount: 363, totalAmount: 14500, description: '4 members · KSh 363 daily · Completed in 40 days' },
        { size: 2, cycleDays: 10, dailyAmount: 725, totalAmount: 14500, description: '2 members · KSh 725 daily · Completed in 20 days' },
      ],
      createdAt: now - 4 * dayMs,
      updatedAt: now - 4 * dayMs,
    },
    {
      id: 3,
      title: 'Titanium 55-Inch 4K UHD Bezel-Less Smart LED TV',
      description: 'Cinema-grade 4K resolution with Quantum Color HDR10+, Dolby Audio spatial sound, built-in dual band Wi-Fi, and Google TV operating system with Netflix and YouTube pre-installed.',
      category: 'Phones, Tablets & TV',
      price: 46000,
      wasPrice: 52000,
      discountPercent: 12,
      images: ['/src/assets/images/smart_uhd_television_1792852474781.jpg'],
      vendorId: 2,
      vendorName: 'Alibaird Direct Official',
      isFeatured: true,
      live: true,
      moderationStatus: 'approved',
      stockQuantity: 12,
      attributes: {
        Screen: '55" 4K UHD Bezel-Less',
        HDR: 'HDR10+ & HLG',
        Audio: '24W Dolby Atmos Stereo',
        OS: 'Google TV Licensed',
      },
      speedOptions: [
        { size: 10, cycleDays: 10, dailyAmount: 460, totalAmount: 46000, description: '10 members · KSh 460 daily · Allocation every 10 days' },
        { size: 6, cycleDays: 10, dailyAmount: 767, totalAmount: 46000, description: '6 members · KSh 767 daily · 60-day fulfillment' },
        { size: 4, cycleDays: 10, dailyAmount: 1150, totalAmount: 46000, description: '4 members · KSh 1,150 daily · 40-day fulfillment' },
        { size: 2, cycleDays: 10, dailyAmount: 2300, totalAmount: 46000, description: '2 members · KSh 2,300 daily · 20-day duo speed' },
      ],
      createdAt: now - 3 * dayMs,
      updatedAt: now - 3 * dayMs,
    },
    {
      id: 4,
      title: 'ErgoMatrix Aeroflex High-Back Mesh Executive Office Chair',
      description: 'Orthopedic dynamic lumbar support with breathable Korean mesh, 3D adjustable armrests, synchronized tilt mechanism, and heavy-duty polished aluminum chassis.',
      category: 'Home & Office Furniture',
      price: 24000,
      wasPrice: 28500,
      discountPercent: 16,
      images: ['/src/assets/images/executive_ergonomic_chair_1792852475009.jpg'],
      vendorId: 2,
      vendorName: 'Alibaird Direct Official',
      isFeatured: false,
      live: true,
      moderationStatus: 'approved',
      stockQuantity: 20,
      attributes: {
        Support: 'Self-adjusting Lumbar',
        GasLift: 'Class 4 TÜV Certified',
        Base: 'Polished Cast Aluminum',
        Warranty: '3 Years Comprehensive',
      },
      speedOptions: [
        { size: 10, cycleDays: 10, dailyAmount: 240, totalAmount: 24000, description: '10 members · KSh 240 daily · 1 chair allocated every 10 days' },
        { size: 6, cycleDays: 10, dailyAmount: 400, totalAmount: 24000, description: '6 members · KSh 400 daily · 60 days total' },
        { size: 4, cycleDays: 10, dailyAmount: 600, totalAmount: 24000, description: '4 members · KSh 600 daily · 40 days total' },
        { size: 2, cycleDays: 10, dailyAmount: 1200, totalAmount: 24000, description: '2 members · KSh 1,200 daily · 20 days duo' },
      ],
      createdAt: now - 2 * dayMs,
      updatedAt: now - 2 * dayMs,
    },
  ];

  // Authentic initial group that strictly conforms to new rule:
  // Creator (Samuel Mwangi) automatically becomes member #1 & moderator.
  // Group starts immediately with status: 'active'.
  const slots1: GroupSlot[] = Array.from({ length: 10 }, (_, i) => {
    const slotNumber = i + 1;
    if (slotNumber === 1) {
      return {
        slotNumber: 1,
        userId: 3,
        userName: 'Samuel Mwangi',
        userPhone: '0712345678',
        status: 'active',
        inviteCode: 'SOLAR9X1',
        paidAmount: 6800,
        targetAmount: 68000,
        lastPaymentDate: now - 1 * dayMs,
        joinedAt: now - 2 * dayMs,
      };
    }
    if (slotNumber === 2) {
      return {
        slotNumber: 2,
        userId: 4,
        userName: 'Faith Chebet',
        userPhone: '0723456789',
        status: 'active',
        inviteCode: 'SOLAR9X2',
        paidAmount: 2040,
        targetAmount: 68000,
        lastPaymentDate: now - 1 * dayMs,
        joinedAt: now - 1 * dayMs,
      };
    }
    return {
      slotNumber,
      userId: null,
      userName: null,
      status: 'open',
      inviteCode: generateCode(),
      paidAmount: 0,
      targetAmount: 68000,
    };
  });

  const groups: ChamaGroup[] = [
    {
      id: 101,
      productId: 1,
      productTitle: 'EcoFlow Portable Solar Power Station (1024Wh / 1800W)',
      productPrice: 68000,
      productImage: '/src/assets/images/solar_power_backup_station_1792852473757.jpg',
      name: 'Mwangi Solar Chama',
      size: 10,
      adminId: 3,
      moderators: [3],
      status: 'active',
      inviteCode: 'SOLAR9X1',
      dailyAmount: 680,
      cycleDays: 10,
      slots: slots1,
      occupiedCount: 2,
      availableCount: 8,
      chat: [
        {
          id: 'm1',
          senderId: 3,
          senderName: 'Samuel Mwangi',
          kind: 'system',
          text: 'Chama started! Member #1 joined and is ready for Day 10.',
          timestamp: now - 2 * dayMs,
        },
        {
          id: 'm2',
          senderId: 4,
          senderName: 'Faith Chebet',
          kind: 'normal',
          text: 'Joined as Member #2! Excited for this solar station.',
          timestamp: now - 1 * dayMs,
        },
      ],
      createdAt: now - 2 * dayMs,
    },
  ];

  const auditLogs: AuditLog[] = [
    {
      id: 1,
      timestamp: now - 2 * dayMs,
      actorId: 3,
      actorName: 'Samuel Mwangi',
      action: 'GROUP_CREATED',
      details: 'Created Chama group #101 with 10 members. Joined as Member #1 and initial moderator. Group activated immediately.',
    },
    {
      id: 2,
      timestamp: now - 1 * dayMs,
      actorId: 4,
      actorName: 'Faith Chebet',
      action: 'MEMBER_JOINED',
      details: 'Joined Chama group #101 as Member #2.',
    },
  ];

  return {
    users,
    products,
    groups,
    defaultRecords: [],
    refundRequests: [],
    payments: [
      {
        id: 1,
        type: 'group_installment',
        userId: 3,
        userName: 'Samuel Mwangi',
        code: 'QJK4X8L2PA',
        amount: 6800,
        groupId: 101,
        groupName: 'Mwangi Solar Chama',
        slotNumber: 1,
        productId: 1,
        status: 'approved',
        createdAt: now - 1 * dayMs,
        approvedAt: now - 1 * dayMs,
      },
      {
        id: 2,
        type: 'group_installment',
        userId: 4,
        userName: 'Faith Chebet',
        code: 'RFM9B3V5KT',
        amount: 2040,
        groupId: 101,
        groupName: 'Mwangi Solar Chama',
        slotNumber: 2,
        productId: 1,
        status: 'approved',
        createdAt: now - 1 * dayMs,
        approvedAt: now - 1 * dayMs,
      },
    ],
    storeCreditLedger: [],
    auditLogs,
    nextIds: {
      user: 10,
      product: 20,
      group: 200,
      defaultRecord: 1,
      refundRequest: 1,
      payment: 10,
      ledger: 1,
      audit: 10,
    },
  };
}

export async function getDatabase(): Promise<DatabaseSchema> {
  if (dbCache) return dbCache;

  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const raw = await fs.readFile(DB_FILE, 'utf-8');
    dbCache = JSON.parse(raw);
    return dbCache!;
  } catch {
    const initial = getInitialDatabase();
    await saveDatabase(initial);
    dbCache = initial;
    return dbCache;
  }
}

export async function saveDatabase(data: DatabaseSchema): Promise<void> {
  dbCache = data;
  writeLock = writeLock.then(async () => {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const tempFile = `${DB_FILE}.${Date.now()}.tmp`;
    await fs.writeFile(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    await fs.rename(tempFile, DB_FILE);
  });
  return writeLock;
}

export function logAudit(db: DatabaseSchema, actorId: number, actorName: string, action: string, details: string): void {
  const entry: AuditLog = {
    id: db.nextIds.audit++,
    timestamp: Date.now(),
    actorId,
    actorName,
    action,
    details,
  };
  db.auditLogs.unshift(entry);
  if (db.auditLogs.length > 500) {
    db.auditLogs.pop();
  }
}
