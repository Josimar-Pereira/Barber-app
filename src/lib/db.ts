import { isBefore, parseISO, getDay } from 'date-fns';

// --- Tipos ---
export interface Service {
  id: number;
  name: string;
  price: number;
  duration: number;
  description: string;
}

export interface Barber {
  id: number;
  name: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  phone: string;
}

export interface Appointment {
  id: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  serviceId: number;
  serviceName: string;
  barberId: number;
  barberName: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  visibleToClient: boolean; // NOVO CAMPO: Controla se o cliente vê ou não
  createdAt: string;
}

// --- Dados Iniciais ---
const SEED_SERVICES: Service[] = [
  { id: 1, name: "Corte Clássico", price: 50, duration: 30, description: "Corte tradicional." },
  { id: 2, name: "Barba Modelada", price: 35, duration: 20, description: "Toalha quente e navalha." },
  { id: 3, name: "Corte + Barba", price: 75, duration: 50, description: "Combo completo." }
];

const SEED_BARBERS: Barber[] = [
  { id: 1, name: "Josimar (Dono)" },
  { id: 2, name: "Carlos (Equipe)" }
];

// --- Funções de Leitura ---
export const getServices = (): Service[] => {
  const s = localStorage.getItem('barber_services');
  return s ? JSON.parse(s) : SEED_SERVICES;
};

export const getBarbers = (): Barber[] => {
  const b = localStorage.getItem('barber_staff');
  if (!b) {
    localStorage.setItem('barber_staff', JSON.stringify(SEED_BARBERS));
    return SEED_BARBERS;
  }
  return JSON.parse(b);
};

export const getAppointments = (): Appointment[] => {
  const stored = localStorage.getItem('barber_appointments');
  return stored ? JSON.parse(stored) : [];
};

// --- AUTENTICAÇÃO ---
export const getUsers = (): User[] => {
  const u = localStorage.getItem('barber_users');
  return u ? JSON.parse(u) : [];
};

export const registerUser = (data: Omit<User, 'id'>) => {
  const users = getUsers();
  if (users.find(u => u.email === data.email)) {
    throw new Error('Este e-mail já está cadastrado.');
  }
  const newUser: User = { ...data, id: Math.random().toString(36).substr(2, 9) };
  users.push(newUser);
  localStorage.setItem('barber_users', JSON.stringify(users));
  return newUser;
};

export const loginUser = (email: string, pass: string): User => {
  const users = getUsers();
  const user = users.find(u => u.email === email && u.password === pass);
  if (!user) throw new Error('E-mail ou senha incorretos.');
  return user;
};

// --- Funções Admin ---
export const addBarber = (name: string) => {
  const barbers = getBarbers();
  const newBarber = { id: Date.now(), name };
  barbers.push(newBarber);
  localStorage.setItem('barber_staff', JSON.stringify(barbers));
  return barbers;
};

export const removeBarber = (id: number) => {
  const barbers = getBarbers().filter(b => b.id !== id);
  localStorage.setItem('barber_staff', JSON.stringify(barbers));
  return barbers;
};

// --- Agendamento ---
export const validateDate = (dateStr: string, timeStr: string): { valid: boolean; error?: string } => {
  const now = new Date();
  const selectedDate = parseISO(`${dateStr}T${timeStr}`);
  if (isBefore(selectedDate, now)) return { valid: false, error: "Não é possível agendar no passado." };
  if (getDay(selectedDate) === 0) return { valid: false, error: "Fechado aos domingos." };
  const hour = parseInt(timeStr.split(':')[0]);
  if (hour < 9 || hour > 19) return { valid: false, error: "Horário apenas entre 09:00 e 19:00." };
  return { valid: true };
};

export const checkConflict = (date: string, time: string, barberId: number): boolean => {
  const apps = getAppointments();
  const conflict = apps.find(app => 
    app.date === date && 
    app.time === time && 
    app.barberId === barberId &&
    app.status !== 'cancelled'
  );
  return !!conflict;
};

export const saveAppointment = (data: Omit<Appointment, 'id' | 'status' | 'visibleToClient' | 'createdAt'>) => {
  const validation = validateDate(data.date, data.time);
  if (!validation.valid) throw new Error(validation.error);

  if (checkConflict(data.date, data.time, data.barberId)) {
    throw new Error("Este barbeiro já está ocupado neste horário!");
  }

  const appointments = getAppointments();
  const newApp: Appointment = {
    ...data,
    id: Math.random().toString(36).substr(2, 9),
    status: 'confirmed',
    visibleToClient: true, // Padrão: Cliente vê
    createdAt: new Date().toISOString()
  };

  appointments.push(newApp);
  localStorage.setItem('barber_appointments', JSON.stringify(appointments));
  return newApp;
};

export const cancelAppointment = (id: string) => {
  const apps = getAppointments().map(app => 
    app.id === id ? { ...app, status: 'cancelled' as const } : app
  );
  localStorage.setItem('barber_appointments', JSON.stringify(apps));
};

// --- NOVA FUNÇÃO: Esconder do Cliente (Ocultar permanentemente) ---
export const hideAppointmentFromClient = (id: string) => {
  const apps = getAppointments().map(app => 
    app.id === id ? { ...app, visibleToClient: false } : app
  );
  localStorage.setItem('barber_appointments', JSON.stringify(apps));
};