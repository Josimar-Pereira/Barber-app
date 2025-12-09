// src/lib/db.ts

export interface Service {
  id: number;
  name: string;
  price: number;
  duration: number;
  description: string;
}

export interface Appointment {
  id: string;
  clientName: string;
  clientPhone: string;
  serviceId: number;
  serviceName: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'cancelled';
}

const SEED_SERVICES: Service[] = [
  { id: 1, name: "Corte Clássico", price: 50, duration: 30, description: "Corte tradicional na tesoura ou máquina." },
  { id: 2, name: "Barba Modelada", price: 35, duration: 20, description: "Alinhamento e hidratação com toalha quente." },
  { id: 3, name: "Corte + Barba", price: 75, duration: 50, description: "Combo completo para o visual perfeito." },
  { id: 4, name: "Pezinho / Acabamento", price: 20, duration: 15, description: "Apenas os contornos." }
];

export const getServices = () => SEED_SERVICES;

// Função para pegar todos os agendamentos salvos
export const getAppointments = (): Appointment[] => {
  const stored = localStorage.getItem('barber_appointments');
  return stored ? JSON.parse(stored) : [];
};

export const saveAppointment = (data: Omit<Appointment, 'id' | 'status'>) => {
  const appointments = getAppointments();

  const newAppointment: Appointment = {
    ...data,
    id: Math.random().toString(36).substr(2, 9),
    status: 'pending'
  };

  appointments.push(newAppointment);
  localStorage.setItem('barber_appointments', JSON.stringify(appointments));
  
  return newAppointment;
};

// Função para cancelar (remove do array)
export const cancelAppointment = (id: string) => {
  const appointments = getAppointments();
  // Filtra removendo o ID selecionado
  const updatedAppointments = appointments.filter(app => app.id !== id);
  localStorage.setItem('barber_appointments', JSON.stringify(updatedAppointments));
};