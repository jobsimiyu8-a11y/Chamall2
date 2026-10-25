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
  PeerLoanRequest,
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
  peerLoans: PeerLoanRequest[];
  storeCreditLedger: StoreCreditLedgerEntry[];
  auditLogs: AuditLog[];
  nextIds: {
    user: number;
    product: number;
    group: number;
    defaultRecord: number;
    refundRequest: number;
    payment: number;
    peerLoan: number;
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
      name: 'Buyoll System Admin',
      phone: '0700000000',
      email: 'admin@buyoll.com',
      role: 'admin',
      credit: 0,
      coins: 200,
      points: 500,
      lastActive: now,
      createdAt: now - 30 * dayMs,
    },
    {
      id: 2,
      name: 'Buyoll Direct Official',
      phone: '0722000000',
      email: 'direct@buyoll.com',
      role: 'merchant',
      shopName: 'Buyoll Direct Official',
      shopDescription: 'Official verified distributor of solar generators, appliances & smart electronics.',
      verified: true,
      credit: 0,
      coins: 100,
      points: 250,
      lastActive: now,
      createdAt: now - 20 * dayMs,
    },
    {
      id: 11,
      name: 'Apex Electronics Kenya',
      phone: '0733000000',
      email: 'apex@buyoll.com',
      role: 'merchant',
      shopName: 'Apex Electronics Kenya',
      shopDescription: 'Direct distributor of 4K Smart TVs, Home Audio & Solar Security Systems.',
      verified: true,
      credit: 0,
      coins: 100,
      points: 150,
      lastActive: now,
      createdAt: now - 15 * dayMs,
    },
    {
      id: 12,
      name: 'Kilimani Office & Living',
      phone: '0744000000',
      email: 'kilimani@buyoll.com',
      role: 'merchant',
      shopName: 'Kilimani Office & Living',
      shopDescription: 'Ergonomic workspace furniture, executive chairs, and modern study decor.',
      verified: true,
      credit: 0,
      coins: 80,
      points: 120,
      lastActive: now,
      createdAt: now - 14 * dayMs,
    },
    {
      id: 13,
      name: 'Rift Valley Cookware Crafts',
      phone: '0755000000',
      email: 'rift@buyoll.com',
      role: 'merchant',
      shopName: 'Rift Valley Cookware Crafts',
      shopDescription: 'Authentic 18/10 stainless steel cookware, induction pans & kitchen essentials.',
      verified: true,
      credit: 0,
      coins: 90,
      points: 110,
      lastActive: now,
      createdAt: now - 12 * dayMs,
    },
    {
      id: 14,
      name: 'Savanna Tech & Solar Solutions',
      phone: '0766000000',
      email: 'savanna@buyoll.com',
      role: 'merchant',
      shopName: 'Savanna Tech & Solar Solutions',
      shopDescription: 'Commercial blenders, off-grid power solutions and energy-efficient kitchen gear.',
      verified: true,
      credit: 0,
      coins: 70,
      points: 95,
      lastActive: now,
      createdAt: now - 11 * dayMs,
    },
    {
      id: 15,
      name: 'Nairobi Smart Living & Appliances',
      phone: '0777000000',
      email: 'nairobi@buyoll.com',
      role: 'merchant',
      shopName: 'Nairobi Smart Living & Appliances',
      shopDescription: 'Inverter refrigerators, water dispensers and modern kitchen cooling appliances.',
      verified: true,
      credit: 0,
      coins: 60,
      points: 75,
      lastActive: now,
      createdAt: now - 10 * dayMs,
    },
    {
      id: 16,
      name: 'Eldoret Fresh Bedding & Decor',
      phone: '0788000000',
      email: 'eldoret@buyoll.com',
      role: 'merchant',
      shopName: 'Eldoret Fresh Bedding & Decor',
      shopDescription: 'Orthopedic memory foam mattresses, luxury duvet sets and bedroom ergonomics.',
      verified: true,
      credit: 0,
      coins: 60,
      points: 80,
      lastActive: now,
      createdAt: now - 9 * dayMs,
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
    {
      id: 30,
      name: 'Grace Wambui (3rd-Party Chama Lender)',
      phone: '0711223344',
      email: 'grace.lender@buyoll.com',
      role: 'buyer',
      credit: 120000,
      coins: 200,
      points: 450,
      lastActive: now,
      createdAt: now - 18 * dayMs,
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
      images: ['./images/solar_power.jpg'],
      vendorId: 2,
      vendorName: 'Buyoll Direct Official',
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
      createdAt: now, // Posted today (0 days ago)
      updatedAt: now,
    },
    {
      id: 2,
      title: 'Culinary Pro 10-Piece Stainless Steel Tri-Ply Cookware Set',
      description: 'Professional grade surgical stainless steel with impact-bonded aluminum core for even heat distribution. Suitable for induction, gas, and electric stovetops. Oven safe to 260°C.',
      category: 'Kitchen',
      price: 14500,
      wasPrice: 17000,
      discountPercent: 15,
      images: ['./images/cookware_set.jpg'],
      vendorId: 13,
      vendorName: 'Rift Valley Cookware Crafts',
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
      createdAt: now - 1 * dayMs, // Posted 1 day ago
      updatedAt: now - 1 * dayMs,
    },
    {
      id: 3,
      title: 'Titanium 55-Inch 4K UHD Bezel-Less Smart LED TV',
      description: 'Cinema-grade 4K resolution with Quantum Color HDR10+, Dolby Audio spatial sound, built-in dual band Wi-Fi, and Google TV operating system with Netflix and YouTube pre-installed.',
      category: 'Phones, Tablets & TV',
      price: 46000,
      wasPrice: 52000,
      discountPercent: 12,
      images: ['./images/smart_tv.jpg'],
      vendorId: 11,
      vendorName: 'Apex Electronics Kenya',
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
      createdAt: now - 2 * dayMs, // Posted 2 days ago
      updatedAt: now - 2 * dayMs,
    },
    {
      id: 4,
      title: 'ErgoMatrix Aeroflex High-Back Mesh Executive Office Chair',
      description: 'Orthopedic dynamic lumbar support with breathable Korean mesh, 3D adjustable armrests, synchronized tilt mechanism, and heavy-duty polished aluminum chassis.',
      category: 'Home & Office Furniture',
      price: 24000,
      wasPrice: 28500,
      discountPercent: 16,
      images: ['./images/office_chair.jpg'],
      vendorId: 12,
      vendorName: 'Kilimani Office & Living',
      isFeatured: true,
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
      createdAt: now - 3 * dayMs, // Posted 3 days ago
      updatedAt: now - 3 * dayMs,
    },
    {
      id: 5,
      title: 'Smart Inverter Double-Door Refrigerator (260L Frost-Free)',
      description: 'Energy-saving digital inverter cooling, multi-airflow humidity control crisper, interior LED lighting, and anti-bacterial gasket protection for fresh family food storage.',
      category: 'Appliances',
      price: 38500,
      wasPrice: 44000,
      discountPercent: 12,
      images: ['./images/solar_power.jpg'],
      vendorId: 15,
      vendorName: 'Nairobi Smart Living & Appliances',
      isFeatured: true,
      live: true,
      moderationStatus: 'approved',
      stockQuantity: 14,
      attributes: {
        Capacity: '260 Litres Double Door',
        Compressor: 'Smart Inverter 10-Yr Warranty',
        Cooling: 'Multi Air Flow No Frost',
        Power: 'A+ Energy Efficiency',
      },
      speedOptions: [
        { size: 10, cycleDays: 10, dailyAmount: 385, totalAmount: 38500, description: '10 members · KSh 385 daily · 1 fridge every 10 days' },
        { size: 6, cycleDays: 10, dailyAmount: 642, totalAmount: 38500, description: '6 members · KSh 642 daily · 60-day cycle' },
        { size: 4, cycleDays: 10, dailyAmount: 963, totalAmount: 38500, description: '4 members · KSh 963 daily · 40-day cycle' },
        { size: 2, cycleDays: 10, dailyAmount: 1925, totalAmount: 38500, description: '2 members · KSh 1,925 daily · 20-day cycle' },
      ],
      createdAt: now - 4 * dayMs, // Posted 4 days ago
      updatedAt: now - 4 * dayMs,
    },
    {
      id: 6,
      title: 'Orthopedic High-Density Quilted Mattress 6x6 (10-Inch)',
      description: 'Pocket spring core with high-density pressure-relief memory foam topper, anti-allergy knitted bamboo jacquard cover, and reinforced edge perimeter for spinal alignment.',
      category: 'Bedding',
      price: 22000,
      wasPrice: 26000,
      discountPercent: 15,
      images: ['./images/cookware_set.jpg'],
      vendorId: 16,
      vendorName: 'Eldoret Fresh Bedding & Decor',
      isFeatured: true,
      live: true,
      moderationStatus: 'approved',
      stockQuantity: 18,
      attributes: {
        Size: '6x6 King Size 10-Inch',
        Core: 'Independent Pocket Springs',
        Cover: 'Breathable Bamboo Jacquard',
        Warranty: '5 Years Manufacturer',
      },
      speedOptions: [
        { size: 10, cycleDays: 10, dailyAmount: 220, totalAmount: 22000, description: '10 members · KSh 220 daily · 1 mattress every 10 days' },
        { size: 6, cycleDays: 10, dailyAmount: 367, totalAmount: 22000, description: '6 members · KSh 367 daily · 60 days total' },
        { size: 4, cycleDays: 10, dailyAmount: 550, totalAmount: 22000, description: '4 members · KSh 550 daily · 40 days total' },
        { size: 2, cycleDays: 10, dailyAmount: 1100, totalAmount: 22000, description: '2 members · KSh 1,100 daily · 20 days duo' },
      ],
      createdAt: now - 5 * dayMs, // Posted 5 days ago
      updatedAt: now - 5 * dayMs,
    },
    {
      id: 7,
      title: 'Commercial Heavy Duty Blender & Food Processor (2.5L / 1800W)',
      description: 'Industrial high-torque copper motor with Japanese 6-blade hardened stainless steel blades. Crushes ice in 5 seconds and grinds dry spices, grains, smoothies, and nut butters effortlessly.',
      category: 'Kitchen',
      price: 7800,
      wasPrice: 9500,
      discountPercent: 18,
      images: ['./images/cookware_set.jpg'],
      vendorId: 14,
      vendorName: 'Savanna Tech & Solar Solutions',
      isFeatured: false,
      live: true,
      moderationStatus: 'approved',
      stockQuantity: 30,
      attributes: {
        Power: '1800W Pure Copper Motor',
        Capacity: '2.5L BPA-Free Pitcher',
        Speed: 'Variable Speed + Pulse Switch',
        Blades: 'Japanese 6-Leaf Stainless',
      },
      speedOptions: [
        { size: 10, cycleDays: 10, dailyAmount: 78, totalAmount: 7800, description: '10 members · KSh 78 daily · 1 blender every 10 days' },
        { size: 6, cycleDays: 10, dailyAmount: 130, totalAmount: 7800, description: '6 members · KSh 130 daily · 60 days total' },
        { size: 4, cycleDays: 10, dailyAmount: 195, totalAmount: 7800, description: '4 members · KSh 195 daily · 40 days total' },
        { size: 2, cycleDays: 10, dailyAmount: 390, totalAmount: 7800, description: '2 members · KSh 390 daily · 20 days duo' },
      ],
      createdAt: now - 6 * dayMs, // Posted 6 days ago
      updatedAt: now - 6 * dayMs,
    },
    {
      id: 8,
      title: 'Smart Security Solar CCTV Dual Camera with 4G SIM & Night Vision',
      description: '100% wire-free outdoor security with built-in solar panel, 4G LTE SIM cellular connectivity, 360° pan/tilt tracking, PIR human detection, two-way audio intercom, and color night vision.',
      category: 'Phones, Tablets & TV',
      price: 12500,
      wasPrice: 15000,
      discountPercent: 17,
      images: ['./images/smart_tv.jpg'],
      vendorId: 11,
      vendorName: 'Apex Electronics Kenya',
      isFeatured: true,
      live: true,
      moderationStatus: 'approved',
      stockQuantity: 25,
      attributes: {
        Connectivity: '4G LTE SIM (No Wi-Fi needed)',
        Solar: '8W High Efficiency Panel',
        Battery: '15,000mAh Rechargeable',
        Resolution: '2K 3MP Dual Lens Color Night',
      },
      speedOptions: [
        { size: 10, cycleDays: 10, dailyAmount: 125, totalAmount: 12500, description: '10 members · KSh 125 daily · 1 camera every 10 days' },
        { size: 6, cycleDays: 10, dailyAmount: 209, totalAmount: 12500, description: '6 members · KSh 209 daily · 60 days total' },
        { size: 4, cycleDays: 10, dailyAmount: 313, totalAmount: 12500, description: '4 members · KSh 313 daily · 40 days total' },
        { size: 2, cycleDays: 10, dailyAmount: 625, totalAmount: 12500, description: '2 members · KSh 625 daily · 20 days duo' },
      ],
      createdAt: now - 7 * dayMs, // Posted 7 days ago (on the 7-day boundary)
      updatedAt: now - 7 * dayMs,
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
      peerLoan: 1,
      ledger: 1,
      audit: 10,
    },
    peerLoans: [],
  };
}

export async function getDatabase(): Promise<DatabaseSchema> {
  if (dbCache) return dbCache;

  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const raw = await fs.readFile(DB_FILE, 'utf-8');
    dbCache = JSON.parse(raw);
    if (!dbCache!.peerLoans) dbCache!.peerLoans = [];
    if (!dbCache!.nextIds.peerLoan) dbCache!.nextIds.peerLoan = 1;
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
