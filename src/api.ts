import {
  User,
  Product,
  ChamaGroup,
  GroupSlot,
  PaymentRecord,
  DefaultRecord,
  RefundRequest,
  StoreCreditLedgerEntry,
  AuditLog,
  SpeedOption,
  PeerLoanRequest,
  MemberStatement,
} from './types.ts';

const USER_STORAGE_KEY = 'alibaird_current_user';
const CLIENT_DB_STORAGE_KEY = 'alibaird_client_db';

let isStaticMode = false;

// Helper to resolve image paths reliably on GitHub Pages, subpaths, and root domains
export function resolveImageUrl(url?: string): string {
  if (!url) return './images/cookware_set.jpg';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  const clean = url.replace(/^\/+/, '');
  if (clean.includes('buyoll_logo') || clean.includes('logo')) return './buyoll_logo.png';
  if (clean.includes('solar_power')) return './images/solar_power.jpg';
  if (clean.includes('stainless_cookware') || clean.includes('cookware')) return './images/cookware_set.jpg';
  if (clean.includes('smart_uhd') || clean.includes('smart_tv')) return './images/smart_tv.jpg';
  if (clean.includes('executive') || clean.includes('office_chair')) return './images/office_chair.jpg';
  return './' + clean;
}

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

// -------------------------------------------------------------
// CLIENT-SIDE DATABASE FOR GITHUB PAGES / OFFLINE STATIC HOSTING
// -------------------------------------------------------------
interface ClientDatabase {
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

function generateCode(length = 6): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function getInitialClientDb(): ClientDatabase {
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
      createdAt: now, // Posted today
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
      createdAt: now - 7 * dayMs, // Posted 7 days ago
      updatedAt: now - 7 * dayMs,
    },
  ];

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
      productImage: './images/solar_power.jpg',
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
    ],
    storeCreditLedger: [],
    auditLogs: [
      {
        id: 1,
        timestamp: now - 2 * dayMs,
        actorId: 3,
        actorName: 'Samuel Mwangi',
        action: 'GROUP_CREATED',
        details: 'Created Chama group #101. Joined as Member #1 and moderator. Activated immediately.',
      },
    ],
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

function getClientDb(): ClientDatabase {
  try {
    const raw = localStorage.getItem(CLIENT_DB_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (!parsed.peerLoans) parsed.peerLoans = [];
      if (!parsed.nextIds.peerLoan) parsed.nextIds.peerLoan = 1;
      return parsed;
    }
  } catch {}
  const init = getInitialClientDb();
  saveClientDb(init);
  return init;
}

function saveClientDb(db: ClientDatabase): void {
  try {
    localStorage.setItem(CLIENT_DB_STORAGE_KEY, JSON.stringify(db));
  } catch {}
}

// -------------------------------------------------------------
// DUAL-MODE FETCH API (Tries Express API, fallback to client DB)
// -------------------------------------------------------------
async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  if (isStaticMode) {
    throw new Error('Static Mode');
  }

  const user = getStoredUser();
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  if (user) {
    headers.set('x-user-id', String(user.id));
  }

  try {
    const res = await fetch(`/api${endpoint}`, {
      ...options,
      headers,
    });

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      // Received HTML (like 404 from GitHub Pages) -> switch to client mode!
      isStaticMode = true;
      throw new Error('Static Mode Detected');
    }

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Server request failed');
    }
    return data as T;
  } catch (err: any) {
    if (err.message === 'Static Mode Detected' || err.name === 'TypeError' || err.message?.includes('fetch')) {
      isStaticMode = true;
      throw new Error('Static Mode');
    }
    throw err;
  }
}

// -------------------------------------------------------------
// EXPORTED API METHODS (Seamlessly handles Full-Stack and GitHub Pages)
// -------------------------------------------------------------
export const api = {
  // Auth
  async getMe(): Promise<{ user: User }> {
    try {
      return await fetchApi<{ user: User }>('/auth/me');
    } catch {
      const user = getStoredUser();
      if (!user) throw new Error('Not authenticated');
      const db = getClientDb();
      const fresh = db.users.find(u => u.id === user.id) || user;
      return { user: fresh };
    }
  },

  async login(payload: { phone: string; name?: string; role?: string; shopName?: string; shopDescription?: string }): Promise<{ user: User }> {
    try {
      const data = await fetchApi<{ user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setStoredUser(data.user);
      return data;
    } catch {
      const db = getClientDb();
      const trimmedPhone = payload.phone.trim();
      let user = db.users.find(u => u.phone === trimmedPhone);
      if (!user) {
        user = {
          id: db.nextIds.user++,
          name: (payload.name || 'User ' + trimmedPhone.slice(-4)).trim(),
          phone: trimmedPhone,
          role: (payload.role === 'merchant' ? 'merchant' : payload.role === 'admin' ? 'admin' : 'buyer'),
          shopName: payload.role === 'merchant' ? (payload.shopName || payload.name || 'My Store').trim() : undefined,
          shopDescription: payload.role === 'merchant' ? (payload.shopDescription || 'Authentic store on Alibaird').trim() : undefined,
          verified: payload.role === 'merchant' ? false : undefined,
          credit: 0,
          coins: 50,
          points: 10,
          lastActive: Date.now(),
          createdAt: Date.now(),
        };
        db.users.push(user);
        saveClientDb(db);
      }
      setStoredUser(user);
      return { user };
    }
  },

  async getUsersList(): Promise<{ users: Array<Partial<User>> }> {
    try {
      return await fetchApi<{ users: Array<Partial<User>> }>('/auth/users');
    } catch {
      const db = getClientDb();
      return {
        users: db.users.map(u => ({
          id: u.id,
          name: u.name,
          phone: u.phone,
          role: u.role,
          shopName: u.shopName,
          verified: u.verified,
        })),
      };
    }
  },

  logout(): void {
    setStoredUser(null);
  },

  // Products
  async getProducts(params?: { category?: string; search?: string; vendorId?: number }): Promise<{ products: Product[] }> {
    try {
      const q = new URLSearchParams();
      if (params?.category) q.set('category', params.category);
      if (params?.search) q.set('search', params.search);
      if (params?.vendorId) q.set('vendorId', String(params.vendorId));
      return await fetchApi<{ products: Product[] }>(`/products?${q.toString()}`);
    } catch {
      const db = getClientDb();
      let products = db.products.filter(p => p.live && p.moderationStatus === 'approved');
      if (params?.category && params.category !== 'All') {
        products = products.filter(p => p.category === params.category);
      }
      if (params?.search && params.search.trim()) {
        const q = params.search.toLowerCase().trim();
        products = products.filter(p =>
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.vendorName.toLowerCase().includes(q)
        );
      }
      if (params?.vendorId) {
        products = products.filter(p => p.vendorId === Number(params.vendorId));
      }
      return { products };
    }
  },

  async getProduct(id: number): Promise<{ product: Product; groups: ChamaGroup[] }> {
    try {
      return await fetchApi<{ product: Product; groups: ChamaGroup[] }>(`/products/${id}`);
    } catch {
      const db = getClientDb();
      const product = db.products.find(p => p.id === Number(id));
      if (!product) throw new Error('Product not found');
      const groups = db.groups.filter(g => g.productId === product.id && (g.status === 'active' || g.status === 'full'));
      return { product, groups };
    }
  },

  async createProduct(data: Partial<Product>): Promise<{ product: Product }> {
    try {
      return await fetchApi<{ product: Product }>('/products', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch {
      const db = getClientDb();
      const user = getStoredUser();
      const numPrice = Number(data.price) || 10000;
      const newProduct: Product = {
        id: db.nextIds.product++,
        title: (data.title || 'Product').trim(),
        description: (data.description || '').trim(),
        category: (data.category || 'Appliances').trim(),
        price: numPrice,
        wasPrice: data.wasPrice,
        discountPercent: data.discountPercent,
        images: Array.isArray(data.images) && data.images.length > 0 ? data.images : ['./images/cookware_set.jpg'],
        vendorId: user ? user.id : 2,
        vendorName: user?.shopName || user?.name || 'Verified Merchant',
        isFeatured: false,
        live: true,
        moderationStatus: 'approved',
        stockQuantity: Number(data.stockQuantity) || 10,
        speedOptions: data.speedOptions || [
          { size: 10, cycleDays: 10, dailyAmount: Math.ceil(numPrice / 10 / 10), totalAmount: numPrice, description: '10 members · Daily installment · Rotation every 10 days' },
          { size: 6, cycleDays: 10, dailyAmount: Math.ceil(numPrice / 6 / 10), totalAmount: numPrice, description: '6 members · 60-day cycle' },
          { size: 4, cycleDays: 10, dailyAmount: Math.ceil(numPrice / 4 / 10), totalAmount: numPrice, description: '4 members · 40-day cycle' },
          { size: 2, cycleDays: 10, dailyAmount: Math.ceil(numPrice / 2 / 10), totalAmount: numPrice, description: '2 members · 20-day duo' },
        ],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      db.products.unshift(newProduct);
      saveClientDb(db);
      return { product: newProduct };
    }
  },

  async updateProduct(id: number, data: Partial<Product>): Promise<{ product: Product; message: string }> {
    try {
      return await fetchApi<{ product: Product; message: string }>(`/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    } catch {
      const db = getClientDb();
      const product = db.products.find(p => p.id === Number(id));
      if (!product) throw new Error('Product not found');
      Object.assign(product, data, { updatedAt: Date.now() });
      saveClientDb(db);
      return { product, message: 'Product updated successfully.' };
    }
  },

  // Groups
  async getGroups(params?: { productId?: number; status?: string }): Promise<{ groups: ChamaGroup[] }> {
    try {
      const q = new URLSearchParams();
      if (params?.productId) q.set('productId', String(params.productId));
      if (params?.status) q.set('status', params.status);
      return await fetchApi<{ groups: ChamaGroup[] }>(`/groups?${q.toString()}`);
    } catch {
      const db = getClientDb();
      let groups = db.groups;
      if (params?.productId) {
        groups = groups.filter(g => g.productId === Number(params.productId));
      }
      if (params?.status) {
        groups = groups.filter(g => g.status === params.status);
      }
      return { groups };
    }
  },

  async getGroup(id: number): Promise<{ group: ChamaGroup }> {
    try {
      return await fetchApi<{ group: ChamaGroup }>(`/groups/${id}`);
    } catch {
      const db = getClientDb();
      const group = db.groups.find(g => g.id === Number(id));
      if (!group) throw new Error('Chama group not found');
      return { group };
    }
  },

  async createGroup(data: { productId: number; size: number; name?: string }): Promise<{ group: ChamaGroup; message: string }> {
    try {
      return await fetchApi<{ group: ChamaGroup; message: string }>('/groups', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (err: any) {
      if (err.message?.includes('Mandatory speed selection required')) throw err;
      const db = getClientDb();
      const user = getStoredUser();
      if (!user) throw new Error('You must be signed in to start a Chama group');
      if (!data.size || Number(data.size) <= 0) {
        throw new Error('Mandatory speed selection required. Please choose a speed to continue.');
      }
      const product = db.products.find(p => p.id === Number(data.productId));
      if (!product) throw new Error('Product not found');

      const speedSize = Number(data.size);
      const validSpeed = product.speedOptions.find(s => s.size === speedSize) || product.speedOptions[0];
      const creatorCode = generateCode();

      const slots: GroupSlot[] = Array.from({ length: validSpeed.size }, (_, i) => {
        const slotNumber = i + 1;
        if (slotNumber === 1) {
          return {
            slotNumber: 1,
            userId: user.id,
            userName: user.name,
            userPhone: user.phone,
            status: 'active',
            inviteCode: creatorCode,
            paidAmount: 0,
            targetAmount: product.price,
            joinedAt: Date.now(),
          };
        }
        return {
          slotNumber,
          userId: null,
          userName: null,
          status: 'open',
          inviteCode: generateCode(),
          paidAmount: 0,
          targetAmount: product.price,
        };
      });

      const newGroup: ChamaGroup = {
        id: db.nextIds.group++,
        productId: product.id,
        productTitle: product.title,
        productPrice: product.price,
        productImage: product.images[0] || '',
        name: data.name?.trim() || `${user.name}’s ${validSpeed.size}-Member Chama`,
        size: validSpeed.size,
        adminId: user.id,
        moderators: [user.id],
        status: 'active',
        inviteCode: creatorCode,
        dailyAmount: validSpeed.dailyAmount,
        cycleDays: validSpeed.cycleDays,
        slots,
        occupiedCount: 1,
        availableCount: validSpeed.size - 1,
        chat: [
          {
            id: `chat_${Date.now()}`,
            senderId: user.id,
            senderName: user.name,
            kind: 'system',
            text: `Chama group started! ${user.name} is Member #1 and moderator. Group is active immediately.`,
            timestamp: Date.now(),
          },
        ],
        createdAt: Date.now(),
      };

      db.groups.unshift(newGroup);
      saveClientDb(db);
      return { group: newGroup, message: 'Your group was created and activated immediately. You are Member #1.' };
    }
  },

  async joinGroup(id: number, inviteCode?: string): Promise<{ group: ChamaGroup; assignedSlot: number; message: string }> {
    try {
      return await fetchApi<{ group: ChamaGroup; assignedSlot: number; message: string }>(`/groups/${id}/join`, {
        method: 'POST',
        body: JSON.stringify({ inviteCode }),
      });
    } catch {
      const db = getClientDb();
      const user = getStoredUser();
      if (!user) throw new Error('You must be signed in to join a Chama group');
      const group = db.groups.find(g => g.id === Number(id));
      if (!group) throw new Error('Chama group not found');

      let targetSlot = group.slots.find(s => s.status === 'replacement_eligible') || group.slots.find(s => s.status === 'open');
      if (!targetSlot) throw new Error('This Chama group is full.');

      targetSlot.userId = user.id;
      targetSlot.userName = user.name;
      targetSlot.userPhone = user.phone;
      targetSlot.status = 'active';
      targetSlot.joinedAt = Date.now();
      targetSlot.isDefaulter = false;

      group.occupiedCount = group.slots.filter(s => s.status === 'active').length;
      group.availableCount = group.size - group.occupiedCount;
      if (group.occupiedCount >= group.size) group.status = 'full';

      group.chat.push({
        id: `chat_${Date.now()}`,
        senderId: user.id,
        senderName: user.name,
        kind: 'system',
        text: `${user.name} joined as Member #${targetSlot.slotNumber}!`,
        timestamp: Date.now(),
      });

      saveClientDb(db);
      return {
        group,
        assignedSlot: targetSlot.slotNumber,
        message: `Welcome! You are Member #${targetSlot.slotNumber}. Your allocation rotation is day ${targetSlot.slotNumber * group.cycleDays}.`,
      };
    }
  },

  async manageModerator(
    groupId: number,
    targetUserId: number,
    action: 'appoint' | 'remove' | 'transfer'
  ): Promise<{ group: ChamaGroup; message: string }> {
    try {
      return await fetchApi<{ group: ChamaGroup; message: string }>(`/groups/${groupId}/moderator`, {
        method: 'POST',
        body: JSON.stringify({ targetUserId, action }),
      });
    } catch {
      const db = getClientDb();
      const group = db.groups.find(g => g.id === Number(groupId));
      if (!group) throw new Error('Group not found');
      if (action === 'appoint' && !group.moderators.includes(targetUserId)) {
        group.moderators.push(targetUserId);
      }
      saveClientDb(db);
      return { group, message: 'Moderator updated successfully.' };
    }
  },

  async markDefault(
    groupId: number,
    slotNumber: number,
    reason?: string
  ): Promise<{ group: ChamaGroup; defaultRecord: DefaultRecord; message: string }> {
    try {
      return await fetchApi<{ group: ChamaGroup; defaultRecord: DefaultRecord; message: string }>(`/groups/${groupId}/default`, {
        method: 'POST',
        body: JSON.stringify({ slotNumber, reason }),
      });
    } catch {
      const db = getClientDb();
      const group = db.groups.find(g => g.id === Number(groupId));
      if (!group) throw new Error('Group not found');
      const slot = group.slots.find(s => s.slotNumber === Number(slotNumber));
      if (!slot) throw new Error('Slot not found');

      const defaulterId = slot.userId || 0;
      const defaulterName = slot.userName || 'Member';
      const amountPaid = slot.paidAmount || 0;

      const defaultRecord: DefaultRecord = {
        id: db.nextIds.defaultRecord++,
        userId: defaulterId,
        userName: defaulterName,
        groupId: group.id,
        groupName: group.name,
        slotNumber: slot.slotNumber,
        productTitle: group.productTitle,
        totalObligation: group.productPrice,
        amountPaid,
        amountOutstanding: Math.max(0, group.productPrice - amountPaid),
        defaultDate: Date.now(),
        reason: (reason || 'Missed scheduled Chama contribution').trim(),
        replacementStatus: 'available',
        resolutionStatus: 'pending',
      };
      db.defaultRecords.unshift(defaultRecord);

      slot.userId = null;
      slot.userName = null;
      slot.userPhone = null;
      slot.status = 'replacement_eligible';
      slot.paidAmount = 0;
      slot.isDefaulter = true;

      group.occupiedCount = group.slots.filter(s => s.status === 'active').length;
      group.availableCount = group.size - group.occupiedCount;
      group.status = 'active';

      saveClientDb(db);
      return {
        group,
        defaultRecord,
        message: `Member default recorded. Slot #${slot.slotNumber} is now open for replacement in the referral pool.`,
      };
    }
  },

  async sendGroupChat(
    groupId: number,
    payload: { text?: string; kind?: string; targetUserId?: number; coinAmount?: number }
  ): Promise<{ group: ChamaGroup; message?: string }> {
    try {
      return await fetchApi<{ group: ChamaGroup; message?: string }>(`/groups/${groupId}/chat`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch {
      const db = getClientDb();
      const user = getStoredUser();
      const group = db.groups.find(g => g.id === Number(groupId));
      if (!group || !user) throw new Error('Cannot send message');

      group.chat.push({
        id: `chat_${Date.now()}`,
        senderId: user.id,
        senderName: user.name,
        kind: (payload.kind as any) || 'normal',
        text: (payload.text || '').trim().slice(0, 500),
        timestamp: Date.now(),
      });
      saveClientDb(db);
      return { group };
    }
  },

  // Defaults & Refunds
  async getMyDefaults(): Promise<{ defaults: DefaultRecord[]; refunds: RefundRequest[] }> {
    try {
      return await fetchApi<{ defaults: DefaultRecord[]; refunds: RefundRequest[] }>('/defaults/my');
    } catch {
      const db = getClientDb();
      const user = getStoredUser();
      if (!user) return { defaults: [], refunds: [] };
      return {
        defaults: db.defaultRecords.filter(d => d.userId === user.id),
        refunds: db.refundRequests.filter(r => r.userId === user.id),
      };
    }
  },

  async resolveDefault(defaultRecordId: number, option: 'refund' | 'store_credit' | 'alternate_purchase', userPhone?: string): Promise<{ message: string; refundRequest?: RefundRequest; creditBalance?: number }> {
    try {
      return await fetchApi<{ message: string; refundRequest?: RefundRequest; creditBalance?: number }>('/defaults/resolve', {
        method: 'POST',
        body: JSON.stringify({ defaultRecordId, option, userPhone }),
      });
    } catch {
      const db = getClientDb();
      const user = getStoredUser();
      const record = db.defaultRecords.find(d => d.id === Number(defaultRecordId));
      if (!record || !user) throw new Error('Default record not found');

      if (option === 'refund') {
        const req: RefundRequest = {
          id: db.nextIds.refundRequest++,
          userId: user.id,
          userName: user.name,
          userPhone: userPhone || user.phone,
          defaultRecordId: record.id,
          groupId: record.groupId,
          productTitle: record.productTitle,
          amountPaid: record.amountPaid,
          eligibleRefundAmount: record.amountPaid,
          status: 'requested',
          requestedAt: Date.now(),
        };
        db.refundRequests.unshift(req);
        record.resolutionOption = 'refund';
        saveClientDb(db);
        return { message: `Refund request of KSh ${record.amountPaid.toLocaleString()} submitted.`, refundRequest: req };
      } else {
        user.credit = (user.credit || 0) + record.amountPaid;
        setStoredUser(user);
        record.resolutionOption = option;
        record.resolutionStatus = 'completed';
        saveClientDb(db);
        return { message: `KSh ${record.amountPaid.toLocaleString()} converted to store credit!`, creditBalance: user.credit };
      }
    }
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
    try {
      return await fetchApi<{ payment: PaymentRecord; message: string }>('/payments', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch {
      const db = getClientDb();
      const user = getStoredUser();
      const p: PaymentRecord = {
        id: db.nextIds.payment++,
        type: (payload.type as any) || 'group_installment',
        userId: user ? user.id : 3,
        userName: user ? user.name : 'User',
        code: payload.code.toUpperCase(),
        amount: Number(payload.amount),
        groupId: payload.groupId,
        slotNumber: payload.slotNumber,
        productId: payload.productId,
        status: 'approved', // In static client mode auto-approve for demonstration
        createdAt: Date.now(),
        approvedAt: Date.now(),
      };
      db.payments.unshift(p);

      // Update slot directly in client storage
      if (payload.groupId && payload.slotNumber) {
        const grp = db.groups.find(g => g.id === payload.groupId);
        if (grp) {
          const slot = grp.slots.find(s => s.slotNumber === payload.slotNumber);
          if (slot) {
            slot.paidAmount += Number(payload.amount);
          }
        }
      }

      saveClientDb(db);
      return { payment: p, message: `Payment ${p.code} confirmed and recorded in ledger.` };
    }
  },

  async getMyPayments(): Promise<{
    payments: PaymentRecord[];
    ledger: StoreCreditLedgerEntry[];
    credit: number;
    coins: number;
    points: number;
  }> {
    try {
      return await fetchApi<{
        payments: PaymentRecord[];
        ledger: StoreCreditLedgerEntry[];
        credit: number;
        coins: number;
        points: number;
      }>('/payments/my');
    } catch {
      const db = getClientDb();
      const user = getStoredUser();
      const myP = user ? db.payments.filter(p => p.userId === user.id) : [];
      const myL = user ? db.storeCreditLedger.filter(l => l.userId === user.id) : [];
      return {
        payments: myP,
        ledger: myL,
        credit: user?.credit || 0,
        coins: user?.coins || 50,
        points: user?.points || 0,
      };
    }
  },

  async redeemPoints(): Promise<{ credit: number; points: number; message: string }> {
    try {
      return await fetchApi<{ credit: number; points: number; message: string }>('/wallet/redeem-points', {
        method: 'POST',
      });
    } catch {
      const user = getStoredUser();
      if (!user) throw new Error('Not signed in');
      const earned = Math.floor((user.points || 0) / 100) * 10;
      user.points -= Math.floor((user.points || 0) / 100) * 100;
      user.credit = (user.credit || 0) + earned;
      setStoredUser(user);
      return { credit: user.credit, points: user.points, message: `Redeemed for KSh ${earned} store credit!` };
    }
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
    try {
      return await fetchApi<any>('/admin/overview');
    } catch {
      const db = getClientDb();
      return {
        pendingPayments: db.payments.filter(p => p.status === 'pending'),
        allPayments: db.payments,
        refundRequests: db.refundRequests,
        merchants: db.users.filter(u => u.role === 'merchant'),
        allUsers: db.users,
        auditLogs: db.auditLogs,
        groups: db.groups,
        products: db.products,
      };
    }
  },

  async adminPaymentDecision(paymentId: number, decision: 'approve' | 'reject'): Promise<{ payment: PaymentRecord; message: string }> {
    try {
      return await fetchApi<any>(`/admin/payments/${paymentId}/decision`, {
        method: 'POST',
        body: JSON.stringify({ decision }),
      });
    } catch {
      const db = getClientDb();
      const p = db.payments.find(x => x.id === Number(paymentId));
      if (!p) throw new Error('Payment not found');
      p.status = decision === 'approve' ? 'approved' : 'rejected';
      saveClientDb(db);
      return { payment: p, message: `Payment ${p.code} was ${decision}d.` };
    }
  },

  async adminRefundStatus(refundId: number, status: string, adminNote?: string): Promise<{ refund: RefundRequest; message: string }> {
    try {
      return await fetchApi<any>(`/admin/refunds/${refundId}/status`, {
        method: 'POST',
        body: JSON.stringify({ status, adminNote }),
      });
    } catch {
      const db = getClientDb();
      const r = db.refundRequests.find(x => x.id === Number(refundId));
      if (!r) throw new Error('Refund not found');
      r.status = status as any;
      saveClientDb(db);
      return { refund: r, message: `Refund #${refundId} status updated to ${status}.` };
    }
  },

  async adminVerifyMerchant(merchantId: number, verified: boolean): Promise<{ merchant: User; message: string }> {
    try {
      return await fetchApi<any>(`/admin/merchants/${merchantId}/verify`, {
        method: 'POST',
        body: JSON.stringify({ verified }),
      });
    } catch {
      const db = getClientDb();
      const m = db.users.find(u => u.id === Number(merchantId));
      if (!m) throw new Error('Merchant not found');
      m.verified = verified;
      saveClientDb(db);
      return { merchant: m, message: `Merchant status updated.` };
    }
  },

  // Search
  async searchProducts(query: string): Promise<{ products: Product[]; query: string; total: number }> {
    try {
      return await fetchApi<any>(`/search?q=${encodeURIComponent(query)}`);
    } catch {
      const db = getClientDb();
      const q = query.toLowerCase().trim();
      if (!q) {
        const live = db.products.filter(p => p.live);
        return { products: live, query: '', total: live.length };
      }
      const results = db.products.filter(p => {
        if (!p.live) return false;
        return (
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.vendorName.toLowerCase().includes(q) ||
          (p.attributes && Object.values(p.attributes).some(v => String(v).toLowerCase().includes(q)))
        );
      });
      return { products: results, query: q, total: results.length };
    }
  },

  // Peer-to-Peer Loans
  async getGroupLoans(groupId: number): Promise<{ loans: PeerLoanRequest[] }> {
    try {
      return await fetchApi<any>(`/groups/${groupId}/loans`);
    } catch {
      const db = getClientDb();
      const loans = (db.peerLoans || []).filter(l => l.groupId === Number(groupId));
      return { loans };
    }
  },

  async requestPeerLoan(groupId: number, data: { amount: number; purpose?: string }): Promise<{ loan: PeerLoanRequest; message: string }> {
    try {
      return await fetchApi<any>(`/groups/${groupId}/loans/request`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch {
      const db = getClientDb();
      const user = getStoredUser();
      if (!user) throw new Error('Authentication required');

      const grp = db.groups.find(g => g.id === Number(groupId));
      if (!grp) throw new Error('Group not found');

      const slot = grp.slots.find(s => s.userId === user.id && s.status === 'active');
      if (!slot) throw new Error('Active slot not found in this group');

      const fee = Math.max(1, Math.round(data.amount * 0.01));
      const newLoan: PeerLoanRequest = {
        id: db.nextIds.peerLoan++,
        groupId: grp.id,
        groupName: grp.name,
        slotNumber: slot.slotNumber,
        requesterId: user.id,
        requesterName: user.name,
        requesterPhone: user.phone,
        amount: data.amount,
        purpose: data.purpose || `Installment support for Slot #${slot.slotNumber}`,
        status: 'open',
        createdAt: Date.now(),
        platformFeeAmount: fee,
        platformFeeStatus: 'pending',
        externalAgreementAcknowledged: true,
      };

      db.peerLoans = db.peerLoans || [];
      db.peerLoans.unshift(newLoan);

      grp.chat.push({
        id: `chat_${Date.now()}`,
        senderId: user.id,
        senderName: user.name,
        kind: 'system',
        text: `📢 PEER LOAN REQUEST: ${user.name} (Member #${slot.slotNumber}) requested a P2P loan of KSh ${data.amount.toLocaleString()} to pay their Chama installment. 3rd-party lenders: review and fund member wallet. 1% platform fee (KSh ${fee}) applies. Loan agreements and repayments are settled manually outside Buyoll.`,
        timestamp: Date.now(),
      });

      saveClientDb(db);
      return { loan: newLoan, message: 'Peer loan request posted to Chama chat and loan board.' };
    }
  },

  async fundPeerLoan(groupId: number, loanId: number): Promise<{ loan: PeerLoanRequest; message: string }> {
    try {
      return await fetchApi<any>(`/groups/${groupId}/loans/${loanId}/fund`, {
        method: 'POST',
      });
    } catch {
      const db = getClientDb();
      const lender = getStoredUser();
      if (!lender) throw new Error('Authentication required');

      const loan = (db.peerLoans || []).find(l => l.id === Number(loanId));
      if (!loan) throw new Error('Loan request not found');
      if (loan.status !== 'open') throw new Error('Loan is no longer open');

      const grp = db.groups.find(g => g.id === Number(groupId));
      const requester = db.users.find(u => u.id === loan.requesterId);
      if (!requester) throw new Error('Member not found');

      const fee = loan.platformFeeAmount || Math.max(1, Math.round(loan.amount * 0.01));

      // Credit member wallet
      requester.credit = (requester.credit || 0) + loan.amount;

      // Add to ledger
      db.storeCreditLedger.unshift({
        id: db.nextIds.ledger++,
        userId: requester.id,
        amount: loan.amount,
        balanceAfter: requester.credit,
        type: 'admin_adjustment',
        referenceId: `P2P_LOAN_${loan.id}`,
        note: `P2P Loan received from 3rd-party lender ${lender.name} (KSh ${loan.amount.toLocaleString()}) for Chama #${groupId} Slot #${loan.slotNumber}. Repayment external.`,
        createdAt: Date.now(),
      });

      loan.status = 'funded';
      loan.fundedByUserId = lender.id;
      loan.fundedByUserName = lender.name;
      loan.fundedAt = Date.now();
      loan.platformFeeStatus = 'paid';

      if (grp) {
        grp.chat.push({
          id: `chat_${Date.now()}`,
          senderId: lender.id,
          senderName: lender.name,
          kind: 'system',
          text: `✅ PEER LOAN FUNDED: 3rd-party lender ${lender.name} funded KSh ${loan.amount.toLocaleString()} directly into ${requester.name}’s wallet! 1% platform fee (KSh ${fee}) paid to Buyoll. ${requester.name} can now pay for Slot #${loan.slotNumber}. (Terms & repayments handled manually outside the platform).`,
          timestamp: Date.now(),
        });
      }

      saveClientDb(db);
      return {
        loan,
        message: `Loan funded successfully! KSh ${loan.amount.toLocaleString()} transferred to ${requester.name}’s wallet.`,
      };
    }
  },

  async paySlotFromWallet(groupId: number, data: { slotNumber: number; amount: number }): Promise<{
    group: ChamaGroup;
    walletBalance: number;
    paidAmount: number;
    progressPercent: number;
    message: string;
  }> {
    try {
      return await fetchApi<any>(`/groups/${groupId}/pay-from-wallet`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch {
      const db = getClientDb();
      const user = getStoredUser();
      if (!user) throw new Error('Authentication required');

      const grp = db.groups.find(g => g.id === Number(groupId));
      if (!grp) throw new Error('Group not found');

      const slot = grp.slots.find(s => s.slotNumber === Number(data.slotNumber) && s.userId === user.id && s.status === 'active');
      if (!slot) throw new Error('Active slot not found');

      const dbUser = db.users.find(u => u.id === user.id) || user;
      if ((dbUser.credit || 0) < data.amount) {
        throw new Error(`Insufficient wallet credit. You have KSh ${(dbUser.credit || 0).toLocaleString()}.`);
      }

      dbUser.credit -= data.amount;
      slot.paidAmount = (slot.paidAmount || 0) + data.amount;
      slot.lastPaymentDate = Date.now();

      const refCode = `WAL_${generateCode(6)}`;
      db.payments.unshift({
        id: db.nextIds.payment++,
        type: 'group_installment',
        userId: user.id,
        userName: user.name,
        code: refCode,
        amount: data.amount,
        groupId: grp.id,
        groupName: grp.name,
        slotNumber: slot.slotNumber,
        productId: grp.productId,
        status: 'approved',
        createdAt: Date.now(),
        approvedAt: Date.now(),
      });

      db.storeCreditLedger.unshift({
        id: db.nextIds.ledger++,
        userId: user.id,
        amount: -data.amount,
        balanceAfter: dbUser.credit,
        type: 'purchase_deduction',
        referenceId: refCode,
        note: `Paid Chama Slot #${slot.slotNumber} installment for "${grp.productTitle}" from wallet balance`,
        createdAt: Date.now(),
      });

      setStoredUser(dbUser);
      saveClientDb(db);

      const progressPercent = Math.min(100, Math.round(((slot.paidAmount || 0) / grp.productPrice) * 100));
      return {
        group: grp,
        walletBalance: dbUser.credit,
        paidAmount: slot.paidAmount,
        progressPercent,
        message: `Payment of KSh ${data.amount.toLocaleString()} applied from your wallet! Dynamic progress is now ${progressPercent}%.`,
      };
    }
  },

  async getMemberStatement(userId: number): Promise<{ statement: MemberStatement }> {
    try {
      return await fetchApi<any>(`/ledger/statement/${userId}`);
    } catch {
      const db = getClientDb();
      const targetUser = db.users.find(u => u.id === Number(userId));
      if (!targetUser) throw new Error('User not found');

      const activeSlots: any[] = [];
      let totalPaid = 0;

      for (const grp of db.groups) {
        for (const slot of grp.slots) {
          if (slot.userId === targetUser.id && slot.status === 'active') {
            const slotPaid = slot.paidAmount || 0;
            totalPaid += slotPaid;
            const progressPercent = Math.min(100, Math.round((slotPaid / (slot.targetAmount || grp.productPrice || 1)) * 100));
            activeSlots.push({
              groupId: grp.id,
              groupName: grp.name,
              productTitle: grp.productTitle,
              slotNumber: slot.slotNumber,
              dailyAmount: grp.dailyAmount,
              targetAmount: slot.targetAmount || grp.productPrice,
              paidAmount: slotPaid,
              progressPercent,
              cycleDays: grp.cycleDays,
              deliveryDay: slot.slotNumber * grp.cycleDays,
              status: slot.status,
            });
          }
        }
      }

      const transactions: any[] = [];
      const userPayments = db.payments.filter(p => p.userId === targetUser.id);
      for (const p of userPayments) {
        transactions.push({
          id: p.id,
          date: p.createdAt,
          reference: p.code,
          type: p.type === 'group_installment' ? 'Chama Installment' : p.type,
          description: p.groupName ? `${p.groupName} (Slot #${p.slotNumber || 1})` : 'Buyoll Payment',
          credit: p.amount,
          status: p.status,
        });
      }

      const userLedger = db.storeCreditLedger.filter(l => l.userId === targetUser.id);
      for (const l of userLedger) {
        transactions.push({
          id: l.id + 100000,
          date: l.createdAt,
          reference: l.referenceId || `LED-${l.id}`,
          type: 'Wallet / Credit Ledger',
          description: l.note,
          debit: l.amount < 0 ? Math.abs(l.amount) : undefined,
          credit: l.amount > 0 ? l.amount : undefined,
          status: 'approved',
        });
      }

      transactions.sort((a, b) => b.date - a.date);

      return {
        statement: {
          user: targetUser,
          totalPaid,
          currentCredit: targetUser.credit || 0,
          activeSlots,
          transactions,
        },
      };
    }
  },
};
