import React, { useState, useEffect } from 'react';
import { Scissors, Calendar, Clock, Phone, User, CheckCircle, ArrowLeft, MessageCircle, Trash2, History } from 'lucide-react';
import { getServices, saveAppointment, getAppointments, cancelAppointment, type Service, type Appointment } from './lib/db';

function App() {
  // Adicionei o estado 'appointments' na navegação
  const [step, setStep] = useState<'services' | 'form' | 'success' | 'appointments'>('services');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [formData, setFormData] = useState({ name: '', phone: '', date: '', time: '' });
  const [myAppointments, setMyAppointments] = useState<Appointment[]>([]);

  const services = getServices();

  // Carrega agendamentos sempre que abrir a tela de agendamentos
  useEffect(() => {
    if (step === 'appointments') {
      setMyAppointments(getAppointments().reverse()); // Mostra os mais recentes primeiro
    }
  }, [step]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService) return;

    saveAppointment({
      clientName: formData.name,
      clientPhone: formData.phone,
      serviceId: selectedService.id,
      serviceName: selectedService.name,
      date: formData.date,
      time: formData.time
    });

    setStep('success');
  };

  const sendToWhatsApp = () => {
    if (!selectedService) return;
    const message = `Olá! Gostaria de confirmar meu agendamento:%0A%0A*Serviço:* ${selectedService.name}%0A*Cliente:* ${formData.name}%0A*Data:* ${formData.date.split('-').reverse().join('/')}%0A*Horário:* ${formData.time}`;
    window.open(`https://wa.me/5551999473129?text=${message}`, '_blank');
  };

  // Lógica de Cancelamento
  const handleCancel = (appointment: Appointment) => {
    if (confirm('Tem certeza que deseja cancelar este agendamento?')) {
      // 1. Remove do banco local
      cancelAppointment(appointment.id);
      
      // 2. Atualiza a lista na tela
      setMyAppointments(getAppointments().reverse());

      // 3. Monta mensagem de cancelamento para o WhatsApp
      const message = `Olá, preciso *CANCELAR* o seguinte agendamento:%0A%0A*Serviço:* ${appointment.serviceName}%0A*Data:* ${appointment.date.split('-').reverse().join('/')}%0A*Horário:* ${appointment.time}%0A%0APoderia confirmar o cancelamento?`;
      
      // 4. Abre o WhatsApp
      window.open(`https://wa.me/5511999999999?text=${message}`, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      {/* Cabeçalho */}
      <header className="bg-slate-900 text-white p-4 shadow-lg sticky top-0 z-20">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setStep('services')}>
            <Scissors className="text-yellow-500" />
            <h1 className="text-xl font-bold tracking-tight">BarberApp</h1>
          </div>
          
          <div className="flex gap-4 text-sm">
            {step !== 'services' && (
              <button onClick={() => setStep('services')} className="text-slate-300 hover:text-white">
                Início
              </button>
            )}
            <button onClick={() => setStep('appointments')} className="text-yellow-500 hover:text-yellow-400 flex items-center gap-1 font-medium">
              <History size={16} /> Meus Horários
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto p-4">
        
        {/* TELA 1: LISTA DE SERVIÇOS */}
        {step === 'services' && (
          <div className="space-y-4 animate-fade-in">
            <div className="text-center py-4">
              <h2 className="text-2xl font-bold text-slate-800">Agende seu horário</h2>
              <p className="text-slate-500">Selecione um serviço abaixo</p>
            </div>
            {services.map((service) => (
              <div 
                key={service.id}
                onClick={() => { setSelectedService(service); setStep('form'); }}
                className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:border-yellow-500 cursor-pointer transition-all flex justify-between items-center group"
              >
                <div>
                  <h3 className="font-bold text-lg text-slate-800">{service.name}</h3>
                  <p className="text-sm text-slate-500">{service.description}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs font-medium text-slate-400">
                    <Clock size={12}/> {service.duration} min
                  </div>
                </div>
                <div className="text-right">
                  <span className="block text-lg font-bold text-slate-900">R$ {service.price}</span>
                  <button className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold mt-1 group-hover:bg-yellow-500 group-hover:text-white transition-colors">
                    Reservar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TELA 2: FORMULÁRIO */}
        {step === 'form' && selectedService && (
          <div className="animate-fade-in">
            <button onClick={() => setStep('services')} className="flex items-center gap-2 text-slate-500 mb-6 hover:text-slate-800">
              <ArrowLeft size={18} /> Voltar
            </button>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="mb-6 border-b pb-4 border-slate-100">
                <span className="text-xs font-bold text-yellow-600 uppercase tracking-wider">Você escolheu</span>
                <h2 className="text-2xl font-bold mt-1">{selectedService.name}</h2>
                <p className="text-slate-500">R$ {selectedService.price} • {selectedService.duration} min</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Seu Nome</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 text-slate-400" size={18} />
                    <input required type="text" placeholder="Seu nome completo"
                      className="w-full pl-10 p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none transition-all"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Celular</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 text-slate-400" size={18} />
                    <input required type="tel" placeholder="(00) 90000-0000"
                      className="w-full pl-10 p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none transition-all"
                      value={formData.phone}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Data</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 text-slate-400" size={18} />
                      <input required type="date"
                        className="w-full pl-10 p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none"
                        value={formData.date}
                        onChange={e => setFormData({...formData, date: e.target.value})}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Horário</label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-3 text-slate-400" size={18} />
                      <input required type="time"
                        className="w-full pl-10 p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none"
                        value={formData.time}
                        onChange={e => setFormData({...formData, time: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <button type="submit" className="w-full bg-slate-900 text-white font-bold py-4 rounded-lg mt-4 hover:bg-slate-800 active:scale-95 transition-all shadow-lg hover:shadow-xl">
                  Confirmar Agendamento
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TELA 3: SUCESSO */}
        {step === 'success' && (
          <div className="text-center py-10 px-4 animate-fade-in">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="text-green-600 w-12 h-12" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Tudo Certo!</h2>
            <p className="text-slate-500 mb-8">
              Agendamento salvo. Envie o comprovante para garantir seu horário.
            </p>
            
            <div className="space-y-3">
              <button 
                onClick={sendToWhatsApp}
                className="w-full bg-green-500 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:bg-green-600 transition-all flex items-center justify-center gap-2"
              >
                <MessageCircle size={20} /> Enviar no Zap
              </button>

              <button 
                onClick={() => {
                  setStep('services');
                  setFormData({ name: '', phone: '', date: '', time: '' });
                  setSelectedService(null);
                }}
                className="w-full bg-white text-slate-700 font-bold py-3 px-6 rounded-lg border border-slate-200 hover:bg-slate-50 transition-all"
              >
                Voltar ao Início
              </button>
            </div>
          </div>
        )}

        {/* TELA 4: MEUS AGENDAMENTOS (NOVA) */}
        {step === 'appointments' && (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Meus Agendamentos</h2>
            
            {myAppointments.length === 0 ? (
              <div className="text-center py-10 text-slate-500">
                <p>Nenhum agendamento encontrado neste dispositivo.</p>
                <button onClick={() => setStep('services')} className="mt-4 text-yellow-600 font-bold hover:underline">
                  Fazer meu primeiro agendamento
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {myAppointments.map((app) => (
                  <div key={app.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-lg text-slate-800">{app.serviceName}</h3>
                      <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-1 rounded">PENDENTE</span>
                    </div>
                    
                    <div className="text-sm text-slate-600 space-y-1 mb-4">
                      <p className="flex items-center gap-2"><Calendar size={14}/> {app.date.split('-').reverse().join('/')}</p>
                      <p className="flex items-center gap-2"><Clock size={14}/> {app.time}</p>
                      <p className="flex items-center gap-2"><User size={14}/> {app.clientName}</p>
                    </div>

                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleCancel(app)}
                        className="flex-1 bg-red-50 text-red-600 py-2 rounded-lg text-sm font-bold hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                      >
                        <Trash2 size={16} /> Cancelar / Reagendar
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2 text-center">
                      *Para reagendar, cancele este e faça um novo.
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}

export default App;