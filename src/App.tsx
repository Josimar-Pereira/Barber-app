import React, { useState, useEffect } from 'react';
import { 
  Scissors, Calendar, Clock, ArrowLeft, 
  MessageCircle, Moon, Sun, Lock, ShieldCheck, UserPlus, Trash2, User, 
  CheckCircle, RefreshCw, XCircle, Mail, Loader2, LogOut, LogIn, UserCheck, X
} from 'lucide-react';
import { 
  getServices, getBarbers, addBarber, removeBarber, saveAppointment, getAppointments, cancelAppointment, hideAppointmentFromClient,
  registerUser, loginUser,
  type Service, type Appointment, type Barber, type User as UserType
} from './lib/db';

function App() {
  // Navegação
  const [step, setStep] = useState<'home' | 'auth-login' | 'auth-register' | 'form' | 'success' | 'my-appointments' | 'admin-login' | 'admin-panel'>('home');
  const [darkMode, setDarkMode] = useState(false);
  
  // Dados Gerais
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);
  const [formData, setFormData] = useState({ date: '', time: '' });
  const [errorMsg, setErrorMsg] = useState('');

  // Autenticação
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [authData, setAuthData] = useState({ name: '', email: '', password: '', phone: '' });

  // Listas
  const [allAppointments, setAllAppointments] = useState<Appointment[]>([]);
  const [myAppointments, setMyAppointments] = useState<Appointment[]>([]);
  const [barbersList, setBarbersList] = useState<Barber[]>([]);
  const [servicesList, setServicesList] = useState<Service[]>([]);

  // Estados Admin/Email
  const [adminPass, setAdminPass] = useState('');
  const [newBarberName, setNewBarberName] = useState('');
  const [emailStatus, setEmailStatus] = useState<'idle' | 'sending' | 'sent'>('idle');

  // --- Efeitos ---
  useEffect(() => {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) setDarkMode(true);
    setServicesList(getServices());
    setBarbersList(getBarbers());
    
    const savedUser = localStorage.getItem('barber_current_user');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
  }, []);

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  // CARREGAR AGENDAMENTOS (Com filtro de "Visível")
  useEffect(() => {
    if (step === 'my-appointments' && currentUser) {
      const all = getAppointments();
      
      const filtered = all.filter(app => 
        // 1. Tem que ser do cliente logado
        app.clientEmail === currentUser.email && 
        // 2. Não pode ter sido ocultado (X)
        app.visibleToClient !== false 
      );
      
      setMyAppointments(filtered.reverse());
    }
  }, [step, currentUser, allAppointments]); 

  // --- Handlers de Navegação ---
  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    if (currentUser) setStep('form');
    else setStep('auth-login');
  };

  const handleMyBookingsClick = () => {
    if (currentUser) {
      setStep('my-appointments');
    } else {
      setSelectedService(null);
      setStep('auth-login');
    }
  };

  // --- Handlers de Ação ---
  const handleClientCancel = (id: string) => {
    if (confirm('Tem certeza? O horário ficará livre para outro cliente.')) {
      cancelAppointment(id);
      setAllAppointments(getAppointments()); // Atualiza
    }
  };

  const handleDismiss = (id: string) => {
    // AGORA GRAVA NO BANCO QUE O CLIENTE NÃO QUER MAIS VER
    hideAppointmentFromClient(id);
    setAllAppointments(getAppointments()); // Força atualização da tela
  };

  const handleReschedule = (app: Appointment) => {
    cancelAppointment(app.id); 
    setFormData({ date: '', time: '' }); 
    setSelectedService(null);
    setSelectedBarber(null);
    setStep('home');
  };

  // --- Auth Handlers ---
  const handleClientLogin = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const user = loginUser(authData.email, authData.password);
      setCurrentUser(user);
      localStorage.setItem('barber_current_user', JSON.stringify(user));
      setAuthData({ name: '', email: '', password: '', phone: '' }); 
      if (selectedService) setStep('form');
      else setStep('home');
    } catch (err: any) { alert(err.message); }
  };

  const handleClientRegister = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const user = registerUser({
        name: authData.name,
        email: authData.email,
        phone: authData.phone,
        password: authData.password
      });
      setCurrentUser(user);
      localStorage.setItem('barber_current_user', JSON.stringify(user));
      alert('Conta criada com sucesso!');
      setAuthData({ name: '', email: '', password: '', phone: '' });
      if (selectedService) setStep('form');
      else setStep('home');
    } catch (err: any) { alert(err.message); }
  };

  const handleLogout = () => {
    if(confirm("Sair da conta?")) {
      localStorage.removeItem('barber_current_user');
      setCurrentUser(null);
      setStep('home');
    }
  };

  // --- Submit Agendamento ---
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!selectedService || !selectedBarber || !currentUser) return;

    try {
      saveAppointment({
        clientName: currentUser.name,
        clientEmail: currentUser.email,
        clientPhone: currentUser.phone,
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        barberId: selectedBarber.id,
        barberName: selectedBarber.name,
        date: formData.date,
        time: formData.time
      });
      setEmailStatus('idle');
      setStep('success');
    } catch (err: any) { setErrorMsg(err.message); }
  };

  // --- Admin ---
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPass === 'admin123') {
      setStep('admin-panel');
      setAllAppointments(getAppointments().reverse());
    } else { alert('Senha incorreta!'); }
  };

  const handleAddBarber = () => {
    if (!newBarberName.trim()) return;
    const updated = addBarber(newBarberName);
    setBarbersList(updated);
    setNewBarberName('');
  };

  const handleRemoveBarber = (id: number) => {
    if (confirm('Remover este barbeiro?')) {
      const updated = removeBarber(id);
      setBarbersList(updated);
    }
  };

  const handleSendEmail = () => {
    setEmailStatus('sending');
    setTimeout(() => setEmailStatus('sent'), 2000);
  };

  // --- Renderização ---
  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${darkMode ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* Header */}
      <header className={`${darkMode ? 'bg-slate-800' : 'bg-white'} p-4 shadow-md sticky top-0 z-20`}>
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setStep('home')}>
            <Scissors className="text-yellow-500" />
            <h1 className="text-xl font-bold tracking-tight">BarberPro</h1>
          </div>
          
          <div className="flex items-center gap-3">
            <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            
            {currentUser ? (
              <div className="flex gap-3">
                <button onClick={handleMyBookingsClick} title="Meus Agendamentos">
                  <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center font-bold text-white text-xs shadow-lg ring-2 ring-yellow-500/30">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                </button>
                <button onClick={handleLogout} title="Sair">
                  <LogOut size={20} className="text-red-400 hover:text-red-600"/>
                </button>
              </div>
            ) : (
              <div className="flex gap-3">
                 <button onClick={() => { setSelectedService(null); setStep('auth-login'); }} className="text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-yellow-500">
                   Entrar
                 </button>
                 <button onClick={() => setStep('admin-login')} title="Área do Dono">
                  <Lock size={18} className="text-slate-400 hover:text-yellow-500"/>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto p-4 pb-20">

        {/* TELA: HOME */}
        {step === 'home' && (
          <div className="animate-fade-in space-y-4">
            <div className={`p-6 rounded-2xl shadow-lg mb-6 ${currentUser ? 'bg-gradient-to-r from-slate-800 to-slate-900 text-white' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700'}`}>
              <h2 className="text-2xl font-bold">
                {currentUser ? `Olá, ${currentUser.name.split(' ')[0]}!` : 'Bem-vindo!'}
              </h2>
              <p className={`text-sm mt-1 ${currentUser ? 'text-slate-300' : 'text-slate-500'}`}>
                {currentUser ? 'Vamos agendar seu horário?' : 'Faça login para agendar.'}
              </p>
              {!currentUser && (
                <button onClick={() => setStep('auth-login')} className="mt-4 text-xs font-bold bg-yellow-500 text-white px-4 py-2 rounded-lg">
                  Entrar / Criar Conta
                </button>
              )}
            </div>

            <div className="flex justify-between items-end px-2">
              <h3 className="font-bold text-lg">Serviços</h3>
            </div>

            {servicesList.map((service) => (
              <div key={service.id} onClick={() => handleServiceSelect(service)}
                className={`p-4 rounded-xl shadow-sm border cursor-pointer transition-all flex justify-between items-center group
                  ${darkMode ? 'bg-slate-800 border-slate-700 hover:border-yellow-500' : 'bg-white border-slate-200 hover:border-yellow-500'}`}
              >
                <div>
                  <h3 className="font-bold text-lg">{service.name}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{service.description}</p>
                  <p className="text-xs mt-2 font-medium text-slate-400 flex items-center gap-1"><Clock size={12}/> {service.duration} min</p>
                </div>
                <div className="text-right">
                  <span className="block text-lg font-bold text-yellow-600 dark:text-yellow-400">R$ {service.price}</span>
                  <span className="text-xs font-bold bg-yellow-500/10 text-yellow-600 px-2 py-1 rounded-full">Agendar</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* AUTH SCREENS */}
        {step === 'auth-login' && (
          <div className="animate-fade-in py-10">
            {selectedService && <div className="mb-6 bg-yellow-50 border border-yellow-200 p-4 rounded-xl text-center"><p className="text-yellow-800 text-sm font-bold">Você escolheu: {selectedService.name}</p><p className="text-yellow-600 text-xs">Entre para continuar.</p></div>}
            <div className="text-center mb-8"><LogIn size={48} className="mx-auto text-yellow-500 mb-4" /><h2 className="text-2xl font-bold">Acesse sua conta</h2></div>
            <form onSubmit={handleClientLogin} className="space-y-4 bg-white dark:bg-slate-800 p-6 rounded-xl border dark:border-slate-700">
              <input type="email" placeholder="E-mail" required className="w-full p-3 rounded-lg border outline-none dark:bg-slate-900 dark:border-slate-600" value={authData.email} onChange={e => setAuthData({...authData, email: e.target.value})} />
              <input type="password" placeholder="Senha" required className="w-full p-3 rounded-lg border outline-none dark:bg-slate-900 dark:border-slate-600" value={authData.password} onChange={e => setAuthData({...authData, password: e.target.value})} />
              <button type="submit" className="w-full bg-slate-900 dark:bg-slate-700 text-white font-bold py-3 rounded-lg">Entrar</button>
            </form>
            <p className="text-center mt-6 text-sm">Não tem conta? <button onClick={() => setStep('auth-register')} className="text-yellow-600 font-bold underline">Cadastre-se</button></p>
            <button onClick={() => setStep('home')} className="block w-full text-center mt-4 text-slate-400 text-sm">Voltar</button>
          </div>
        )}

        {step === 'auth-register' && (
          <div className="animate-fade-in py-6">
            <button onClick={() => setStep('auth-login')} className="flex items-center gap-2 text-slate-500 mb-6 hover:text-yellow-500"><ArrowLeft size={18} /> Voltar</button>
            <div className="text-center mb-6"><UserPlus size={48} className="mx-auto text-yellow-500 mb-4" /><h2 className="text-2xl font-bold">Criar Conta</h2></div>
            <form onSubmit={handleClientRegister} className="space-y-4 bg-white dark:bg-slate-800 p-6 rounded-2xl border dark:border-slate-700 shadow-sm">
              <input type="text" placeholder="Nome Completo" required className="w-full p-3 rounded-lg border outline-none dark:bg-slate-900 dark:border-slate-600" value={authData.name} onChange={e => setAuthData({...authData, name: e.target.value})} />
              <input type="tel" placeholder="WhatsApp / Celular" required className="w-full p-3 rounded-lg border outline-none dark:bg-slate-900 dark:border-slate-600" value={authData.phone} onChange={e => setAuthData({...authData, phone: e.target.value})} />
              <input type="email" placeholder="E-mail" required className="w-full p-3 rounded-lg border outline-none dark:bg-slate-900 dark:border-slate-600" value={authData.email} onChange={e => setAuthData({...authData, email: e.target.value})} />
              <input type="password" placeholder="Senha" required className="w-full p-3 rounded-lg border outline-none dark:bg-slate-900 dark:border-slate-600" value={authData.password} onChange={e => setAuthData({...authData, password: e.target.value})} />
              <button type="submit" className="w-full bg-yellow-500 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-yellow-600 transition-all">Criar Conta</button>
            </form>
          </div>
        )}

        {/* TELA: FORMULÁRIO */}
        {step === 'form' && selectedService && currentUser && (
          <div className="animate-fade-in">
            <button onClick={() => setStep('home')} className="flex items-center gap-2 text-slate-500 mb-6 hover:text-yellow-500"><ArrowLeft size={18} /> Voltar</button>
            <div className={`p-6 rounded-2xl shadow-lg border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
              <h2 className="text-xl font-bold mb-4 border-b pb-2 border-slate-100 dark:border-slate-700">{selectedService.name}</h2>
              <div className="bg-blue-50 text-blue-700 text-sm p-3 rounded-lg mb-4 flex items-center gap-2"><UserCheck size={16}/> Agendando como <b>{currentUser.name}</b></div>
              <form onSubmit={handleSubmit} className="space-y-4">
                {errorMsg && <div className="p-3 bg-red-100 text-red-700 text-sm rounded-lg border border-red-200 animate-pulse">⚠️ {errorMsg}</div>}
                <div>
                  <label className="text-sm font-medium mb-1 block">Profissional</label>
                  <div className="grid grid-cols-2 gap-2">
                    {barbersList.map(barber => (
                      <div key={barber.id} onClick={() => setSelectedBarber(barber)} className={`p-2 rounded-lg border text-center cursor-pointer transition-all text-sm font-medium flex items-center justify-center gap-2 ${selectedBarber?.id === barber.id ? 'bg-yellow-500 text-white border-yellow-600' : 'border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700'}`}><User size={14}/> {barber.name}</div>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-sm font-medium mb-1 block">Data</label><input required type="date" className={`w-full p-3 rounded-lg border outline-none focus:ring-2 focus:ring-yellow-500 ${darkMode ? 'bg-slate-900 border-slate-600' : 'bg-slate-50 border-slate-200'}`} value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} /></div>
                  <div><label className="text-sm font-medium mb-1 block">Horário</label><input required type="time" className={`w-full p-3 rounded-lg border outline-none focus:ring-2 focus:ring-yellow-500 ${darkMode ? 'bg-slate-900 border-slate-600' : 'bg-slate-50 border-slate-200'}`} value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} /></div>
                </div>
                <button type="submit" className="w-full bg-yellow-500 text-white font-bold py-4 rounded-xl mt-2 hover:bg-yellow-600 transition-all shadow-lg">Confirmar Agendamento</button>
              </form>
            </div>
          </div>
        )}

        {/* TELA: MEUS AGENDAMENTOS */}
        {step === 'my-appointments' && currentUser && (
          <div className="animate-fade-in">
            <button onClick={() => setStep('home')} className="flex items-center gap-2 text-slate-500 mb-6 hover:text-yellow-500"><ArrowLeft size={18} /> Voltar</button>
            <h2 className="text-xl font-bold mb-6">Meus Agendamentos</h2>
            
            {myAppointments.length === 0 ? (
              <p className="text-slate-500 text-center py-10 bg-slate-100 dark:bg-slate-800 rounded-xl">Você não tem agendamentos ativos.</p>
            ) : (
              <div className="space-y-3">
                {myAppointments.map(app => (
                  // LOGICA DE VISUALIZAÇÃO:
                  app.status === 'cancelled' ? (
                    // CARD DE CANCELADO (Com opção de sumir de vez)
                    <div key={app.id} className="p-4 rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-900 flex items-center justify-between animate-fade-in">
                      <div>
                        <p className="font-bold text-red-600 text-sm flex items-center gap-1"><XCircle size={14}/> Cancelado</p>
                        <p className="text-xs text-red-500/70">{app.serviceName}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleReschedule(app)} className="text-xs bg-red-100 text-red-700 px-3 py-2 rounded-lg font-bold hover:bg-red-200 transition-colors flex items-center gap-1">
                          <RefreshCw size={12}/> Reagendar
                        </button>
                        <button onClick={() => handleDismiss(app.id)} className="text-slate-400 hover:text-slate-600 px-2" title="Remover da lista">
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    // CARD NORMAL
                    <div key={app.id} className={`p-4 rounded-xl border relative overflow-hidden ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                      <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
                      <div className="flex justify-between items-start mb-2 pl-3">
                        <div>
                          <h3 className="font-bold text-lg">{app.serviceName}</h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400">com {app.barberName}</p>
                        </div>
                        <span className="text-xs px-2 py-1 rounded font-bold bg-green-100 text-green-600">CONFIRMADO</span>
                      </div>
                      <div className="flex gap-4 pl-3 text-sm font-medium mt-3 mb-4">
                        <span className="flex items-center gap-1"><Calendar size={14}/> {app.date.split('-').reverse().join('/')}</span>
                        <span className="flex items-center gap-1"><Clock size={14}/> {app.time}</span>
                      </div>
                      <div className="flex gap-2 pl-3 pt-2 border-t border-slate-100 dark:border-slate-700">
                        <button onClick={() => handleReschedule(app)} className="flex-1 text-xs font-bold py-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center gap-1 transition-colors">
                          <RefreshCw size={14} /> Reagendar
                        </button>
                        <button onClick={() => handleClientCancel(app.id)} className="flex-1 text-xs font-bold py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center gap-1 transition-colors">
                          <XCircle size={14} /> Cancelar
                        </button>
                      </div>
                    </div>
                  )
                ))}
              </div>
            )}
          </div>
        )}

        {/* ADMIN E SUCESSO (IGUAIS) */}
        {step === 'admin-login' && (
          <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
            <ShieldCheck size={64} className="text-slate-300 mb-6" />
            <h2 className="text-2xl font-bold mb-6">Acesso Restrito</h2>
            <form onSubmit={handleAdminLogin} className="w-full max-w-xs space-y-4">
              <input type="password" placeholder="Senha do Dono" className={`w-full p-3 rounded-lg border outline-none text-center ${darkMode ? 'bg-slate-800 border-slate-600' : 'bg-white border-slate-200'}`} value={adminPass} onChange={e => setAdminPass(e.target.value)} />
              <button type="submit" className="w-full bg-slate-900 dark:bg-slate-700 text-white font-bold py-3 rounded-lg">Entrar</button>
              <button type="button" onClick={() => setStep('home')} className="w-full text-slate-500 text-sm">Voltar</button>
            </form>
          </div>
        )}

        {step === 'admin-panel' && (
          <div className="animate-fade-in space-y-8">
            <div className="flex justify-between items-center"><h2 className="text-xl font-bold">Painel do Dono</h2><button onClick={() => setStep('home')} className="text-sm bg-red-500/10 text-red-500 px-3 py-1 rounded-lg">Sair</button></div>
            <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
              <h3 className="font-bold mb-4 flex items-center gap-2 text-yellow-600"><UserPlus size={18}/> Gerenciar Equipe</h3>
              <div className="flex gap-2 mb-4"><input type="text" placeholder="Novo barbeiro" className={`flex-1 p-2 rounded-lg border text-sm outline-none ${darkMode ? 'bg-slate-900 border-slate-600' : 'bg-slate-50 border-slate-200'}`} value={newBarberName} onChange={e => setNewBarberName(e.target.value)} /><button onClick={handleAddBarber} className="bg-green-600 text-white px-4 rounded-lg text-sm font-bold">Adicionar</button></div>
              <div className="space-y-2">{barbersList.map(barber => (<div key={barber.id} className={`flex justify-between items-center p-2 rounded-lg border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-100'}`}><span className="text-sm">{barber.name}</span><button onClick={() => handleRemoveBarber(barber.id)} className="text-red-500 hover:text-red-700"><Trash2 size={16}/></button></div>))}</div>
            </div>
            <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}><h3 className="font-bold mb-4 flex items-center gap-2"><Calendar size={18}/> Todos Agendamentos</h3>{allAppointments.length === 0 ? <p className="text-slate-500 text-sm">Nenhum agendamento.</p> : (<div className="space-y-3">{allAppointments.map(app => (<div key={app.id} className={`p-3 rounded-lg border text-sm ${app.status === 'cancelled' ? 'opacity-50' : ''} ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-100'}`}><div className="flex justify-between font-bold mb-1"><span>{app.date.split('-').reverse().join('/')} às {app.time}</span><span className={app.status === 'cancelled' ? 'text-red-500' : 'text-green-500'}>{app.status}</span></div><p>Cliente: {app.clientName}</p><p className="text-xs text-yellow-600 font-bold mt-1">Profissional: {app.barberName}</p></div>))}</div>)}</div>
          </div>
        )}

        {step === 'success' && currentUser && (
          <div className="text-center py-10 animate-fade-in flex flex-col items-center">
            <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6"><CheckCircle className="text-green-500 w-12 h-12" /></div>
            <h2 className="text-2xl font-bold mb-2">Agendado com Sucesso!</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-8 px-6">Horário reservado com <b>{selectedBarber?.name}</b>.</p>
            <div className="w-full space-y-3 px-6"><button onClick={handleSendEmail} disabled={emailStatus !== 'idle'} className={`w-full font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all ${emailStatus === 'sent' ? 'bg-slate-200 text-slate-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>{emailStatus === 'idle' && <><Mail size={20} /> Enviar Comprovante por E-mail</>}{emailStatus === 'sending' && <><Loader2 size={20} className="animate-spin" /> Enviando...</>}{emailStatus === 'sent' && <><CheckCircle size={20} /> Enviado para {currentUser.email}</>}</button><button onClick={() => { setStep('my-appointments'); }} className={`w-full font-bold py-3 rounded-lg border hover:bg-slate-50 dark:hover:bg-slate-800 transition-all ${darkMode ? 'border-slate-600' : 'border-slate-300'}`}>Ver Meus Agendamentos</button><button onClick={() => { setSelectedService(null); setSelectedBarber(null); setFormData({date: '', time: ''}); setStep('home'); }} className={`w-full font-bold py-3 rounded-lg border hover:bg-slate-50 dark:hover:bg-slate-800 transition-all ${darkMode ? 'border-slate-600' : 'border-slate-300'}`}>Fazer Outro Agendamento</button><button onClick={() => setStep('home')} className="text-sm text-slate-500 underline mt-4">Voltar ao Início</button></div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;