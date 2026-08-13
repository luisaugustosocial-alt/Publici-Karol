import { useEffect, useState } from 'react'
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth'
import {
  addDoc, collection, deleteDoc, doc, getDoc, getDocs,
  orderBy, query, updateDoc
} from 'firebase/firestore'
import { auth, db } from './firebase'
import { LogOut, MessageCircle, Plus, Trash2 } from 'lucide-react'

const money=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})

export default function Admin(){
  const [user,setUser]=useState(null)
  const [allowed,setAllowed]=useState(false)
  const [loading,setLoading]=useState(true)
  const [login,setLogin]=useState({email:'',password:''})
  const [error,setError]=useState('')
  const [services,setServices]=useState([])
  const [budgets,setBudgets]=useState([])
  const [newService,setNewService]=useState({name:'',description:'',price:''})

  useEffect(()=>onAuthStateChanged(auth,async u=>{
    setUser(u)
    if(!u){setAllowed(false);setLoading(false);return}
    const snap=await getDoc(doc(db,'admins',u.uid))
    setAllowed(snap.exists())
    if(!snap.exists()) await signOut(auth)
    setLoading(false)
  }),[])

  useEffect(()=>{ if(allowed) load() },[allowed])

  async function load(){
    const s=await getDocs(collection(db,'services'))
    setServices(s.docs.map(d=>({id:d.id,...d.data()})))
    try{
      const b=await getDocs(query(collection(db,'orcamentos'),orderBy('createdAt','desc')))
      setBudgets(b.docs.map(d=>({id:d.id,...d.data()})))
    }catch{
      const b=await getDocs(collection(db,'orcamentos'))
      setBudgets(b.docs.map(d=>({id:d.id,...d.data()})))
    }
  }

  async function doLogin(e){
    e.preventDefault();setError('')
    try{ await signInWithEmailAndPassword(auth,login.email,login.password) }
    catch{ setError('E-mail ou senha inválidos, ou usuário sem acesso administrativo.') }
  }

  async function saveService(s){
    await updateDoc(doc(db,'services',s.id),{
      name:s.name, description:s.description||'', price:Number(s.price||0)
    })
    load()
  }

  async function addService(){
    if(!newService.name)return
    await addDoc(collection(db,'services'),{
      name:newService.name,description:newService.description,price:Number(newService.price||0)
    })
    setNewService({name:'',description:'',price:''});load()
  }

  async function removeService(id){
    if(confirm('Excluir este serviço?')){await deleteDoc(doc(db,'services',id));load()}
  }

  function reply(b){
    const phone=String(b.whatsapp||'').replace(/\D/g,'')
    const text=`Olá, ${b.nome}! Recebi sua solicitação de orçamento pelo site Publici Karol e estou entrando em contato para continuarmos seu atendimento.`
    window.open(`https://wa.me/55${phone.replace(/^55/,'')}?text=${encodeURIComponent(text)}`,'_blank')
  }

  if(loading) return <div className="admin-center">Carregando...</div>

  if(!user||!allowed) return <div className="admin-login">
    <form onSubmit={doLogin}>
      <a className="brand" href="/">Publici <span>Karol</span></a>
      <h1>Área Administrativa</h1>
      <p>Entre com um usuário autorizado.</p>
      <input type="email" placeholder="E-mail" required value={login.email} onChange={e=>setLogin({...login,email:e.target.value})}/>
      <input type="password" placeholder="Senha" required value={login.password} onChange={e=>setLogin({...login,password:e.target.value})}/>
      {error&&<p className="error">{error}</p>}
      <button className="btn" type="submit">Entrar</button>
      <a href="/">← Voltar ao site</a>
    </form>
  </div>

  return <div className="dashboard">
    <aside className="dash-side">
      <a className="brand lightbrand" href="/">Publici <span>Karol</span></a>
      <h3>Painel administrativo</h3>
      <a href="#pedidos">Orçamentos</a>
      <a href="#servicos">Serviços e valores</a>
      <button onClick={()=>signOut(auth)}><LogOut size={17}/> Sair</button>
    </aside>
    <main className="dash-main">
      <div className="dash-head"><div><span className="eyebrow">ADMINISTRAÇÃO</span><h1>Olá, Brenda.</h1></div><span>{user.email}</span></div>

      <section id="pedidos" className="admin-section">
        <h2>Orçamentos recebidos</h2>
        <div className="budget-list">
          {budgets.length===0&&<p>Nenhuma solicitação recebida ainda.</p>}
          {budgets.map(b=><article className="budget-card" key={b.id}>
            <div><span className="status">{b.status||'novo'}</span><h3>{b.nome}</h3><p>{b.whatsapp}</p></div>
            <div><small>Estimativa</small><strong>{money(b.total)}</strong></div>
            <div className="budget-services">{(b.services||[]).map(s=><span key={s.id}>{s.name}</span>)}</div>
            <button className="btn small" onClick={()=>reply(b)}><MessageCircle size={17}/> Responder</button>
          </article>)}
        </div>
      </section>

      <section id="servicos" className="admin-section">
        <h2>Serviços e valores</h2>
        <p>Altere os preços aqui. O pré-orçamento do site passará a usar os novos valores.</p>
        <div className="service-admin-list">
          {services.map((s,i)=><div className="service-admin" key={s.id}>
            <input value={s.name||''} onChange={e=>setServices(v=>v.map((x,j)=>j===i?{...x,name:e.target.value}:x))}/>
            <input value={s.description||''} onChange={e=>setServices(v=>v.map((x,j)=>j===i?{...x,description:e.target.value}:x))}/>
            <input type="number" min="0" step="0.01" value={s.price??0} onChange={e=>setServices(v=>v.map((x,j)=>j===i?{...x,price:e.target.value}:x))}/>
            <button onClick={()=>saveService(s)}>Salvar</button>
            <button className="danger" onClick={()=>removeService(s.id)}><Trash2 size={16}/></button>
          </div>)}
          <div className="service-admin new">
            <input placeholder="Novo serviço" value={newService.name} onChange={e=>setNewService({...newService,name:e.target.value})}/>
            <input placeholder="Descrição" value={newService.description} onChange={e=>setNewService({...newService,description:e.target.value})}/>
            <input type="number" placeholder="Valor" value={newService.price} onChange={e=>setNewService({...newService,price:e.target.value})}/>
            <button onClick={addService}><Plus size={16}/> Adicionar</button>
          </div>
        </div>
      </section>
    </main>
  </div>
}