import { useEffect, useState } from 'react'
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc
} from 'firebase/firestore'
import { auth, db } from './firebase'
import { LogOut, MessageCircle, Plus, Trash2, Save } from 'lucide-react'

const DEFAULT_SITE = {
  navSobre: 'Sobre',
  navTrabalhos: 'Trabalhos',
  navPortfolio: 'Portfólio',
  navFeedbacks: 'Feedbacks',
  navOrcamento: 'Orçamento',
  navContato: 'Contato',

  heroEyebrow: 'SOCIAL MEDIA • CONTEÚDO • ESTRATÉGIA',
  heroNome: 'Brenda',
  heroSobrenome: 'Alencar',
  heroProfissao: 'Social Media & Criadora de Conteúdo',
  heroDescricao: 'Transformo ideias em conteúdo com identidade, estratégia e propósito para marcas que querem ser lembradas.',
  heroBotao: 'Conheça meu trabalho',
  heroCardLinha1: 'Estratégia + criatividade',
  heroCardLinha2: 'para comunicar melhor.',

  sobreEyebrow: 'SOBRE MIM',
  sobreTitulo: 'Comunicação que aproxima marcas e pessoas.',
  sobreTexto1: 'Sou Brenda Alencar, estudante de Publicidade e Propaganda, Social Media e criadora de conteúdo. Trabalho unindo criatividade e planejamento para construir uma presença digital coerente e marcante.',
  sobreTexto2: 'Atuo com gestão de Instagram, criação de artes e vídeos, planejamento e produção de conteúdo.',

  trabalhosEyebrow: 'O QUE EU FAÇO',
  trabalhosTitulo: 'Meus trabalhos',

  portfolioEyebrow: 'PORTFÓLIO',
  portfolioTitulo: 'Projetos que contam histórias.',
  portfolioDescricao: 'Conheça alguns trabalhos e projetos em destaque.',

  feedbacksEyebrow: 'FEEDBACKS',
  feedbacksTitulo: 'O que dizem sobre meu trabalho',

  orcamentoEyebrow: 'ORÇAMENTO',
  orcamentoTitulo: 'Vamos transformar suas ideias em conteúdo?',
  orcamentoDescricao: 'Selecione os serviços para receber uma estimativa inicial.',
  orcamentoBotao: 'Enviar pelo WhatsApp',
  orcamentoPersonalizado: 'Prefiro um orçamento personalizado',
  orcamentoAviso: 'O valor exibido é uma estimativa e pode variar conforme a demanda.',

  contatoEyebrow: 'CONTATO',
  contatoTitulo: 'Vamos criar juntos?',
  contatoDescricao: 'Entre em contato e me conte sobre sua ideia.',
  instagramTexto: 'Instagram',
  instagramUrl: '',
  emailTexto: 'E-mail',
  email: '',
  whatsappTexto: 'WhatsApp',

  rodapeTexto: 'Social Media & Criadora de Conteúdo'
}

export default function Admin() {
  const [user, setUser] = useState(null)
  const [authorized, setAuthorized] = useState(false)
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [site, setSite] = useState(DEFAULT_SITE)
  const [services, setServices] = useState([])
  const [budgets, setBudgets] = useState([])
  const [newService, setNewService] = useState({ name: '', description: '', price: '' })
  const [savingSite, setSavingSite] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    return onAuthStateChanged(auth, async current => {
      setUser(current)
      if (!current) {
        setAuthorized(false)
        setLoading(false)
        return
      }
      try {
        const adminSnap = await getDoc(doc(db, 'admins', current.uid))
        setAuthorized(adminSnap.exists())
      } catch {
        setAuthorized(false)
      }
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (!authorized) return
    loadData()
  }, [authorized])

  async function loadData() {
    try {
      const configSnap = await getDoc(doc(db, 'site', 'config'))
      if (configSnap.exists()) {
        setSite({ ...DEFAULT_SITE, ...configSnap.data() })
      }

      const serviceSnap = await getDocs(collection(db, 'services'))
      setServices(serviceSnap.docs.map(d => ({ id: d.id, ...d.data() })))

      const budgetSnap = await getDocs(collection(db, 'orcamentos'))
      setBudgets(budgetSnap.docs.map(d => ({ id: d.id, ...d.data() })))
    } catch (e) {
      console.warn(e)
    }
  }

  async function login(e) {
    e.preventDefault()
    setError('')
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch {
      setError('E-mail ou senha incorretos.')
    }
  }

  async function saveSite() {
    setSavingSite(true)
    setSaved(false)
    try {
      await setDoc(doc(db, 'site', 'config'), site, { merge: true })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (e) {
      alert('Não foi possível salvar os textos.')
      console.warn(e)
    } finally {
      setSavingSite(false)
    }
  }

  function field(key, label, multiline = false) {
    return (
      <label className="admin-field">
        <span>{label}</span>
        {multiline ? (
          <textarea
            value={site[key] || ''}
            onChange={e => setSite({ ...site, [key]: e.target.value })}
          />
        ) : (
          <input
            value={site[key] || ''}
            onChange={e => setSite({ ...site, [key]: e.target.value })}
          />
        )}
      </label>
    )
  }

  async function saveService(service) {
    await updateDoc(doc(db, 'services', service.id), {
      name: service.name || '',
      description: service.description || '',
      price: Number(service.price || 0)
    })
    alert('Serviço salvo.')
  }

  async function removeService(id) {
    if (!confirm('Excluir este serviço?')) return
    await deleteDoc(doc(db, 'services', id))
    setServices(v => v.filter(x => x.id !== id))
  }

  async function createService() {
    if (!newService.name.trim()) return
    const ref = await addDoc(collection(db, 'services'), {
      name: newService.name,
      description: newService.description,
      price: Number(newService.price || 0)
    })
    setServices(v => [...v, { id: ref.id, ...newService, price: Number(newService.price || 0) }])
    setNewService({ name: '', description: '', price: '' })
  }

  function replyWhatsapp(budget) {
    const number = String(budget.whatsapp || '').replace(/\D/g, '')
    const text = `Olá, ${budget.nome || ''}! Recebi sua solicitação de orçamento pelo site Publici Karol.`
    window.open(`https://wa.me/${number}?text=${encodeURIComponent(text)}`, '_blank')
  }

  if (loading) return <div className="admin-center">Carregando...</div>

  if (!user || !authorized) {
    return (
      <div className="admin-login">
        <form onSubmit={login}>
          <a className="brand brand-logo" href="/">
            <img src="/publici-karol-logo.png" alt="Publici Karol" />
          </a>
          <h1>Área Administrativa</h1>
          <p>Entre com a conta autorizada para gerenciar o site.</p>
          <input type="email" placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)} required />
          <input type="password" placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)} required />
          {error && <p className="error">{error}</p>}
          <button className="btn white" type="submit">Entrar</button>
          <a href="/">Voltar para o site</a>
        </form>
      </div>
    )
  }

  return (
    <div className="dashboard">
      <aside className="dash-side">
        <a className="brand brand-logo lightbrand" href="/">
          <img src="/publici-karol-logo.png" alt="Publici Karol" />
        </a>
        <h3>Administração</h3>
        <a href="#textos">Textos do site</a>
        <a href="#servicos">Serviços e valores</a>
        <a href="#orcamentos">Orçamentos</a>
        <button onClick={() => signOut(auth)}><LogOut size={17}/> Sair</button>
      </aside>

      <main className="dash-main">
        <div className="dash-head">
          <div>
            <span className="eyebrow">PUBLICI KAROL</span>
            <h1>Painel Administrativo</h1>
          </div>
          <span>{user.email}</span>
        </div>

        <section className="admin-section" id="textos">
          <h2>Textos e informações do site</h2>
          <p>Altere títulos, descrições, botões, contatos e textos sem editar o código.</p>

          <div className="admin-editor-group">
            <h3>Menu</h3>
            <div className="admin-form-grid">
              {field('navSobre', 'Sobre')}
              {field('navTrabalhos', 'Trabalhos')}
              {field('navPortfolio', 'Portfólio')}
              {field('navFeedbacks', 'Feedbacks')}
              {field('navOrcamento', 'Orçamento')}
              {field('navContato', 'Contato')}
            </div>
          </div>

          <div className="admin-editor-group">
            <h3>Home</h3>
            <div className="admin-form-grid">
              {field('heroEyebrow', 'Texto pequeno superior')}
              {field('heroNome', 'Nome')}
              {field('heroSobrenome', 'Sobrenome')}
              {field('heroProfissao', 'Profissão')}
              {field('heroDescricao', 'Descrição', true)}
              {field('heroBotao', 'Texto do botão')}
              {field('heroCardLinha1', 'Card — linha 1')}
              {field('heroCardLinha2', 'Card — linha 2')}
            </div>
          </div>

          <div className="admin-editor-group">
            <h3>Sobre mim</h3>
            <div className="admin-form-grid">
              {field('sobreEyebrow', 'Texto pequeno')}
              {field('sobreTitulo', 'Título')}
              {field('sobreTexto1', 'Primeiro parágrafo', true)}
              {field('sobreTexto2', 'Segundo parágrafo', true)}
            </div>
          </div>

          <div className="admin-editor-group">
            <h3>Meus trabalhos</h3>
            <div className="admin-form-grid">
              {field('trabalhosEyebrow', 'Texto pequeno')}
              {field('trabalhosTitulo', 'Título')}
            </div>
          </div>

          <div className="admin-editor-group">
            <h3>Portfólio</h3>
            <div className="admin-form-grid">
              {field('portfolioEyebrow', 'Texto pequeno')}
              {field('portfolioTitulo', 'Título')}
              {field('portfolioDescricao', 'Descrição', true)}
            </div>
          </div>

          <div className="admin-editor-group">
            <h3>Feedbacks</h3>
            <div className="admin-form-grid">
              {field('feedbacksEyebrow', 'Texto pequeno')}
              {field('feedbacksTitulo', 'Título')}
            </div>
          </div>

          <div className="admin-editor-group">
            <h3>Orçamento</h3>
            <div className="admin-form-grid">
              {field('orcamentoEyebrow', 'Texto pequeno')}
              {field('orcamentoTitulo', 'Título')}
              {field('orcamentoDescricao', 'Descrição', true)}
              {field('orcamentoBotao', 'Botão do WhatsApp')}
              {field('orcamentoPersonalizado', 'Botão orçamento personalizado')}
              {field('orcamentoAviso', 'Aviso do pré-orçamento', true)}
            </div>
          </div>

          <div className="admin-editor-group">
            <h3>Contato e rodapé</h3>
            <div className="admin-form-grid">
              {field('contatoEyebrow', 'Texto pequeno')}
              {field('contatoTitulo', 'Título')}
              {field('contatoDescricao', 'Descrição', true)}
              {field('instagramTexto', 'Texto Instagram')}
              {field('instagramUrl', 'Link do Instagram')}
              {field('whatsappTexto', 'Texto WhatsApp')}
              {field('emailTexto', 'Texto E-mail')}
              {field('email', 'E-mail')}
              {field('rodapeTexto', 'Texto do rodapé')}
            </div>
          </div>

          <button className="btn" onClick={saveSite} disabled={savingSite}>
            <Save size={18}/>
            {savingSite ? 'Salvando...' : 'Salvar alterações'}
          </button>
          {saved && <p className="admin-saved">Alterações salvas com sucesso.</p>}
        </section>

        <section className="admin-section" id="servicos">
          <h2>Serviços e valores</h2>
          <p>Os valores definidos aqui alimentam o pré-orçamento do site.</p>

          <div className="service-admin-list">
            {services.map((service, index) => (
              <div className="service-admin" key={service.id}>
                <input value={service.name || ''} onChange={e => setServices(v => v.map((x,i) => i === index ? {...x,name:e.target.value}:x))}/>
                <input value={service.description || ''} onChange={e => setServices(v => v.map((x,i) => i === index ? {...x,description:e.target.value}:x))}/>
                <input type="number" min="0" step="0.01" value={service.price ?? ''} onChange={e => setServices(v => v.map((x,i) => i === index ? {...x,price:e.target.value}:x))}/>
                <button onClick={() => saveService(service)}><Save size={15}/> Salvar</button>
                <button className="danger" onClick={() => removeService(service.id)}><Trash2 size={15}/></button>
              </div>
            ))}

            <div className="service-admin new">
              <input placeholder="Novo serviço" value={newService.name} onChange={e => setNewService({...newService,name:e.target.value})}/>
              <input placeholder="Descrição" value={newService.description} onChange={e => setNewService({...newService,description:e.target.value})}/>
              <input type="number" placeholder="Valor" value={newService.price} onChange={e => setNewService({...newService,price:e.target.value})}/>
              <button onClick={createService}><Plus size={15}/> Adicionar</button>
            </div>
          </div>
        </section>

        <section className="admin-section" id="orcamentos">
          <h2>Orçamentos recebidos</h2>
          <div className="budget-list">
            {!budgets.length && <p>Nenhum orçamento recebido ainda.</p>}
            {budgets.map(budget => (
              <article className="budget-card" key={budget.id}>
                <div>
                  <span className="status">{budget.status || 'novo'}</span>
                  <h3>{budget.nome || 'Sem nome'}</h3>
                  <p>{budget.whatsapp || 'Sem WhatsApp'}</p>
                </div>
                <strong>
                  {Number(budget.total || 0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}
                </strong>
                <div className="budget-services">
                  {(budget.services || []).map((s,i) => <span key={i}>{s.name}</span>)}
                </div>
                <button className="btn small" onClick={() => replyWhatsapp(budget)}>
                  <MessageCircle size={16}/> Responder
                </button>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
