import { useEffect, useMemo, useState } from 'react'
import { addDoc, collection, getDocs, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase'
import {
  ArrowRight, Instagram, Mail, Menu, MessageCircle, Palette,
  PenLine, Play, Smartphone, Sparkles, X, CalendarDays
} from 'lucide-react'

const DEFAULT_SERVICES = [
  { id:'gestao', name:'Gestão de Instagram', description:'Planejamento, organização e acompanhamento estratégico do perfil.', price:0 },
  { id:'conteudo', name:'Criação de conteúdo', description:'Conteúdo pensado para a identidade e os objetivos da marca.', price:0 },
  { id:'artes', name:'Artes para redes sociais', description:'Peças visuais para posts, stories e campanhas.', price:0 },
  { id:'videos', name:'Edição de vídeos', description:'Edição de reels e vídeos para presença digital.', price:0 },
  { id:'planejamento', name:'Planejamento de conteúdo', description:'Calendário, pautas e direcionamento estratégico.', price:0 },
  { id:'pacotes', name:'Pacotes personalizados', description:'Combinação de serviços conforme a necessidade do projeto.', price:0 },
]

const work = [
  ['Gestão de redes sociais', Smartphone],
  ['Identidade visual', Palette],
  ['Reels e vídeos', Play],
  ['Copywriting / legendas', PenLine],
  ['Planejamento de conteúdo', CalendarDays],
  ['Criação de posts', Sparkles],
]

function money(v){ return Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}) }

export default function App(){
  const [menu,setMenu]=useState(false)
  const [services,setServices]=useState(DEFAULT_SERVICES)
  const [selected,setSelected]=useState([])
  const [form,setForm]=useState({nome:'',whatsapp:'',descricao:''})
  const [sent,setSent]=useState(false)

  useEffect(()=>{
    getDocs(collection(db,'services')).then(s=>{
      if(!s.empty) setServices(s.docs.map(d=>({id:d.id,...d.data()})))
    }).catch(()=>{})
  },[])

  const total=useMemo(()=>selected.reduce((sum,id)=>{
    const s=services.find(x=>x.id===id)
    return sum+Number(s?.price||0)
  },0),[selected,services])

  function toggle(id){
    setSelected(v=>v.includes(id)?v.filter(x=>x!==id):[...v,id])
  }

  function whatsappText(){
    const chosen=services.filter(s=>selected.includes(s.id))
    const lines=chosen.map(s=>`• ${s.name}${Number(s.price)>0?` — ${money(s.price)}`:' — valor a confirmar'}`)
    return `Olá! Vim pelo site Publici Karol e gostaria de falar sobre este pré-orçamento:\n\n${lines.join('\n')}\n\nValor estimado: ${money(total)}\n\nNome: ${form.nome||'Não informado'}\n\nSei que este é um pré-orçamento e que o valor final pode variar conforme a demanda.`
  }

  async function sendBudget(){
    const chosen=services.filter(s=>selected.includes(s.id))
    try{
      await addDoc(collection(db,'orcamentos'),{
        nome:form.nome||'Não informado',
        whatsapp:form.whatsapp||'Não informado',
        descricao:form.descricao,
        tipo:'pre-orcamento',
        services:chosen.map(s=>({id:s.id,name:s.name,price:Number(s.price||0)})),
        total,
        status:'novo',
        createdAt:serverTimestamp()
      })
    }catch(e){ console.warn(e) }
    const phone=(import.meta.env.VITE_WHATSAPP_NUMBER||'').replace(/\D/g,'')
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(whatsappText())}`,'_blank')
    setSent(true)
  }

  function customWhatsapp(){
    const phone=(import.meta.env.VITE_WHATSAPP_NUMBER||'').replace(/\D/g,'')
    const text='Olá! Vim pelo site Publici Karol e gostaria de solicitar um orçamento personalizado.'
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`,'_blank')
  }

  return <div>
    <header className="nav">
      <a className="brand" href="#home">Publici <span>Karol</span></a>
      <nav className={menu?'links open':'links'}>
        {['Sobre','Trabalhos','Portfólio','Feedbacks','Orçamento','Contato'].map(x=><a key={x} onClick={()=>setMenu(false)} href={`#${x.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()}`}>{x}</a>)}
      </nav>
      <button className="menu" onClick={()=>setMenu(!menu)}>{menu?<X/>:<Menu/>}</button>
    </header>

    <main>
      <section id="home" className="hero">
        <div className="hero-copy">
          <span className="eyebrow">SOCIAL MEDIA • CONTEÚDO • ESTRATÉGIA</span>
          <h1>Brenda<br/><em>Alencar</em></h1>
          <h2>Social Media & Criadora de Conteúdo</h2>
          <p>Transformo ideias em conteúdo com identidade, estratégia e propósito para marcas que querem ser lembradas.</p>
          <a className="btn" href="#portfolio">Conheça meu trabalho <ArrowRight size={18}/></a>
        </div>
        <div className="hero-art">
          <div className="photo-placeholder"><span>SUA FOTO<br/>PRINCIPAL</span></div>
          <div className="floating-card">Estratégia + criatividade<br/><strong>para comunicar melhor.</strong></div>
        </div>
      </section>

      <section id="sobre" className="section about">
        <div className="section-number">01</div>
        <div className="about-photo"><span>FOTO<br/>BRENDA</span></div>
        <div>
          <span className="eyebrow">SOBRE MIM</span>
          <h2>Comunicação que aproxima <em>marcas e pessoas.</em></h2>
          <p>Sou Brenda Alencar, estudante de Publicidade e Propaganda, Social Media e criadora de conteúdo. Trabalho unindo criatividade e planejamento para construir uma presença digital coerente e marcante.</p>
          <p>Atuo com gestão de Instagram, criação de artes e vídeos, planejamento e produção de conteúdo.</p>
        </div>
      </section>

      <section id="trabalhos" className="section soft">
        <div className="center">
          <span className="eyebrow">O QUE EU FAÇO</span>
          <h2>Meus <em>trabalhos</em></h2>
        </div>
        <div className="work-grid">
          {work.map(([name,Icon])=><article className="work-card" key={name}><Icon/><h3>{name}</h3><p>Soluções criativas pensadas para fortalecer sua comunicação digital.</p></article>)}
        </div>
      </section>

      <section id="portfolio" className="section">
        <span className="eyebrow">PORTFÓLIO</span>
        <h2>Projetos que contam <em>histórias.</em></h2>
        <div className="portfolio-grid">
          {[1,2,3,4,5,6].map((n,i)=><article className={`project p${i+1}`} key={n}><div className="project-image">PROJETO {String(n).padStart(2,'0')}</div><small>{['SOCIAL MEDIA','IDENTIDADE VISUAL','REELS','CONTEÚDO','PLANEJAMENTO','DESIGN'][i]}</small><h3>Projeto em destaque</h3><p>Espaço preparado para imagem, contexto e descrição do trabalho.</p></article>)}
        </div>
      </section>

      <section id="feedbacks" className="feedback section">
        <span className="eyebrow light">FEEDBACKS</span>
        <h2>O que dizem sobre <em>meu trabalho</em></h2>
        <div className="quotes">
          <blockquote>“Um espaço para inserir um feedback real de cliente sobre o trabalho desenvolvido.”<footer>— Cliente</footer></blockquote>
          <blockquote>“Profissionalismo, criatividade e atenção em cada detalhe do projeto.”<footer>— Cliente</footer></blockquote>
          <blockquote>“A comunicação ganhou muito mais identidade e organização.”<footer>— Cliente</footer></blockquote>
        </div>
      </section>

      <section id="orcamento" className="section budget">
        <div className="center">
          <span className="eyebrow">ORÇAMENTO</span>
          <h2>Vamos transformar suas ideias <em>em conteúdo?</em></h2>
          <p>Selecione os serviços para receber uma estimativa inicial.</p>
        </div>
        <div className="budget-grid">
          <div className="service-picker">
            {services.map(s=><label className={selected.includes(s.id)?'service-option active':'service-option'} key={s.id}>
              <input type="checkbox" checked={selected.includes(s.id)} onChange={()=>toggle(s.id)}/>
              <div><strong>{s.name}</strong><small>{s.description}</small></div>
              <b>{Number(s.price)>0?money(s.price):'Sob consulta'}</b>
            </label>)}
          </div>
          <aside className="summary">
            <span className="eyebrow light">SEU PRÉ-ORÇAMENTO</span>
            <h3>{selected.length} serviço{selected.length===1?'':'s'} selecionado{selected.length===1?'':'s'}</h3>
            <div className="total"><span>Estimativa</span><strong>{money(total)}</strong></div>
            <input placeholder="Seu nome" value={form.nome} onChange={e=>setForm({...form,nome:e.target.value})}/>
            <input placeholder="Seu WhatsApp" value={form.whatsapp} onChange={e=>setForm({...form,whatsapp:e.target.value})}/>
            <textarea placeholder="Conte um pouco sobre o que precisa (opcional)" value={form.descricao} onChange={e=>setForm({...form,descricao:e.target.value})}/>
            <button className="btn white" disabled={!selected.length} onClick={sendBudget}><MessageCircle size={18}/> Enviar pelo WhatsApp</button>
            <button className="text-btn" onClick={customWhatsapp}>Prefiro um orçamento personalizado</button>
            <small>O valor exibido é uma estimativa e pode variar conforme a demanda.</small>
            {sent&&<p className="success">Solicitação preparada ✓</p>}
          </aside>
        </div>
      </section>

      <section id="contato" className="section contact">
        <div>
          <span className="eyebrow">CONTATO</span>
          <h2>Vamos criar <em>juntos?</em></h2>
          <p>Entre em contato e me conte sobre sua ideia.</p>
        </div>
        <div className="contact-links">
          <a href="#" aria-label="Instagram"><Instagram/> Instagram</a>
          <button onClick={customWhatsapp}><MessageCircle/> WhatsApp</button>
          <a href="mailto:seuemail@exemplo.com"><Mail/> E-mail</a>
        </div>
      </section>
    </main>

    <footer className="footer">
      <a className="brand" href="#home">Publici <span>Karol</span></a>
      <p>Social Media & Criadora de Conteúdo</p>
      <a className="admin-link" href="/admin">Área Administrativa</a>
    </footer>
  </div>
}