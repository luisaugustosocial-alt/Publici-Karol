import { useEffect, useMemo, useState } from 'react'
import { addDoc, collection, doc, getDoc, getDocs, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase'
import {
  ArrowRight,
  Instagram,
  Mail,
  Menu,
  MessageCircle,
  Palette,
  PenLine,
  Play,
  Smartphone,
  Sparkles,
  X,
  CalendarDays
} from 'lucide-react'

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

const DEFAULT_SERVICES = [
  { id:'gestao', name:'Gestão de Instagram', description:'Planejamento, organização e acompanhamento estratégico do perfil.', price:0 },
  { id:'conteudo', name:'Criação de conteúdo', description:'Conteúdo pensado para a identidade e os objetivos da marca.', price:0 },
  { id:'artes', name:'Artes para redes sociais', description:'Peças visuais para posts, stories e campanhas.', price:0 },
  { id:'videos', name:'Edição de vídeos', description:'Edição de reels e vídeos para presença digital.', price:0 },
  { id:'planejamento', name:'Planejamento de conteúdo', description:'Calendário, pautas e direcionamento estratégico.', price:0 },
  { id:'pacotes', name:'Pacotes personalizados', description:'Combinação de serviços conforme a necessidade do projeto.', price:0 }
]

const work = [
  ['Gestão de redes sociais', Smartphone],
  ['Identidade visual', Palette],
  ['Reels e vídeos', Play],
  ['Copywriting / legendas', PenLine],
  ['Planejamento de conteúdo', CalendarDays],
  ['Criação de posts', Sparkles]
]

function money(v) {
  return Number(v || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  })
}

export default function App() {
  const [menu, setMenu] = useState(false)
  const [site, setSite] = useState(DEFAULT_SITE)
  const [services, setServices] = useState(DEFAULT_SERVICES)
  const [selected, setSelected] = useState([])
  const [form, setForm] = useState({
    nome: '',
    whatsapp: '',
    descricao: ''
  })
  const [sent, setSent] = useState(false)

  useEffect(() => {
    async function loadContent() {
      try {
        const configSnap = await getDoc(doc(db, 'site', 'config'))
        if (configSnap.exists()) {
          setSite({ ...DEFAULT_SITE, ...configSnap.data() })
        }

        const serviceSnap = await getDocs(collection(db, 'services'))
        if (!serviceSnap.empty) {
          setServices(
            serviceSnap.docs.map(document => ({
              id: document.id,
              ...document.data()
            }))
          )
        }
      } catch (error) {
        console.warn('Não foi possível carregar o conteúdo do Firebase.', error)
      }
    }

    loadContent()
  }, [])

  const total = useMemo(() => {
    return selected.reduce((sum, id) => {
      const service = services.find(item => item.id === id)
      return sum + Number(service?.price || 0)
    }, 0)
  }, [selected, services])

  function toggle(id) {
    setSelected(current =>
      current.includes(id)
        ? current.filter(item => item !== id)
        : [...current, id]
    )
  }

  function whatsappText() {
    const chosen = services.filter(service =>
      selected.includes(service.id)
    )

    const lines = chosen.map(service =>
      `• ${service.name}${
        Number(service.price) > 0
          ? ` — ${money(service.price)}`
          : ' — valor a confirmar'
      }`
    )

    return `Olá! Vim pelo site Publici Karol e gostaria de falar sobre este pré-orçamento:

${lines.join('\n')}

Valor estimado: ${money(total)}

Nome: ${form.nome || 'Não informado'}

Sei que este é um pré-orçamento e que o valor final pode variar conforme a demanda.`
  }

  async function sendBudget() {
    const chosen = services.filter(service =>
      selected.includes(service.id)
    )

    try {
      await addDoc(collection(db, 'orcamentos'), {
        nome: form.nome || 'Não informado',
        whatsapp: form.whatsapp || 'Não informado',
        descricao: form.descricao,
        tipo: 'pre-orcamento',
        services: chosen.map(service => ({
          id: service.id,
          name: service.name,
          price: Number(service.price || 0)
        })),
        total,
        status: 'novo',
        createdAt: serverTimestamp()
      })
    } catch (error) {
      console.warn(error)
    }

    const phone = (
      import.meta.env.VITE_WHATSAPP_NUMBER || ''
    ).replace(/\D/g, '')

    window.open(
      `https://wa.me/${phone}?text=${encodeURIComponent(whatsappText())}`,
      '_blank'
    )

    setSent(true)
  }

  function customWhatsapp() {
    const phone = (
      import.meta.env.VITE_WHATSAPP_NUMBER || ''
    ).replace(/\D/g, '')

    const text =
      'Olá! Vim pelo site Publici Karol e gostaria de solicitar um orçamento personalizado.'

    window.open(
      `https://wa.me/${phone}?text=${encodeURIComponent(text)}`,
      '_blank'
    )
  }

  return (
    <div>
      <header className="nav">
        <a className="brand brand-logo" href="#home">
          <img src="/publici-karol-logo.png" alt="Publici Karol" />
        </a>

        <nav className={menu ? 'links open' : 'links'}>
          <a onClick={() => setMenu(false)} href="#sobre">{site.navSobre}</a>
          <a onClick={() => setMenu(false)} href="#trabalhos">{site.navTrabalhos}</a>
          <a onClick={() => setMenu(false)} href="#portfolio">{site.navPortfolio}</a>
          <a onClick={() => setMenu(false)} href="#feedbacks">{site.navFeedbacks}</a>
          <a onClick={() => setMenu(false)} href="#orcamento">{site.navOrcamento}</a>
          <a onClick={() => setMenu(false)} href="#contato">{site.navContato}</a>
        </nav>

        <button className="menu" onClick={() => setMenu(!menu)}>
          {menu ? <X /> : <Menu />}
        </button>
      </header>

      <main>
        <section id="home" className="hero">
          <div className="hero-copy">
            <span className="eyebrow">{site.heroEyebrow}</span>

            <h1>
              {site.heroNome}
              <br />
              <em>{site.heroSobrenome}</em>
            </h1>

            <h2>{site.heroProfissao}</h2>

            <p>{site.heroDescricao}</p>

            <a className="btn" href="#portfolio">
              {site.heroBotao}
              <ArrowRight size={18} />
            </a>
          </div>

          <div className="hero-art">
            <div className="photo-placeholder hero-photo">
              <img src="/brenda-alencar.png" alt="Brenda Alencar" />
            </div>

            <div className="floating-card">
              {site.heroCardLinha1}
              <br />
              <strong>{site.heroCardLinha2}</strong>
            </div>
          </div>
        </section>

        <section id="sobre" className="section about">
          <div className="section-number">01</div>

          <div className="about-photo about-photo-real">
            <img src="/brenda-alencar.png" alt="Brenda Alencar" />
          </div>

          <div>
            <span className="eyebrow">{site.sobreEyebrow}</span>
            <h2>{site.sobreTitulo}</h2>
            <p>{site.sobreTexto1}</p>
            <p>{site.sobreTexto2}</p>
          </div>
        </section>

        <section id="trabalhos" className="section soft">
          <div className="center">
            <span className="eyebrow">{site.trabalhosEyebrow}</span>
            <h2>{site.trabalhosTitulo}</h2>
          </div>

          <div className="work-grid">
            {work.map(([name, Icon]) => (
              <article className="work-card" key={name}>
                <Icon />
                <h3>{name}</h3>
                <p>Soluções criativas pensadas para fortalecer sua comunicação digital.</p>
              </article>
            ))}
          </div>
        </section>

        <section id="portfolio" className="section">
          <span className="eyebrow">{site.portfolioEyebrow}</span>
          <h2>{site.portfolioTitulo}</h2>
          <p>{site.portfolioDescricao}</p>

          <div className="portfolio-grid">
            {[1,2,3,4,5,6].map((number, index) => (
              <article className={`project p${index + 1}`} key={number}>
                <div className="project-image">
                  PROJETO {String(number).padStart(2, '0')}
                </div>

                <small>
                  {
                    [
                      'SOCIAL MEDIA',
                      'IDENTIDADE VISUAL',
                      'REELS',
                      'CONTEÚDO',
                      'PLANEJAMENTO',
                      'DESIGN'
                    ][index]
                  }
                </small>

                <h3>Projeto em destaque</h3>
                <p>Espaço preparado para imagem, contexto e descrição do trabalho.</p>
              </article>
            ))}
          </div>
        </section>

        <section id="feedbacks" className="feedback section">
          <span className="eyebrow light">{site.feedbacksEyebrow}</span>
          <h2>{site.feedbacksTitulo}</h2>

          <div className="quotes">
            <blockquote>
              “Um espaço para inserir um feedback real de cliente sobre o trabalho desenvolvido.”
              <footer>— Cliente</footer>
            </blockquote>

            <blockquote>
              “Profissionalismo, criatividade e atenção em cada detalhe do projeto.”
              <footer>— Cliente</footer>
            </blockquote>

            <blockquote>
              “A comunicação ganhou muito mais identidade e organização.”
              <footer>— Cliente</footer>
            </blockquote>
          </div>
        </section>

        <section id="orcamento" className="section budget">
          <div className="center">
            <span className="eyebrow">{site.orcamentoEyebrow}</span>
            <h2>{site.orcamentoTitulo}</h2>
            <p>{site.orcamentoDescricao}</p>
          </div>

          <div className="budget-grid">
            <div className="service-picker">
              {services.map(service => (
                <label
                  className={
                    selected.includes(service.id)
                      ? 'service-option active'
                      : 'service-option'
                  }
                  key={service.id}
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(service.id)}
                    onChange={() => toggle(service.id)}
                  />

                  <div>
                    <strong>{service.name}</strong>
                    <small>{service.description}</small>
                  </div>

                  <b>
                    {Number(service.price) > 0
                      ? money(service.price)
                      : 'Sob consulta'}
                  </b>
                </label>
              ))}
            </div>

            <aside className="summary">
              <span className="eyebrow light">SEU PRÉ-ORÇAMENTO</span>

              <h3>
                {selected.length}{' '}
                serviço{selected.length === 1 ? '' : 's'}{' '}
                selecionado{selected.length === 1 ? '' : 's'}
              </h3>

              <div className="total">
                <span>Estimativa</span>
                <strong>{money(total)}</strong>
              </div>

              <input
                placeholder="Seu nome"
                value={form.nome}
                onChange={event =>
                  setForm({
                    ...form,
                    nome: event.target.value
                  })
                }
              />

              <input
                placeholder="Seu WhatsApp"
                value={form.whatsapp}
                onChange={event =>
                  setForm({
                    ...form,
                    whatsapp: event.target.value
                  })
                }
              />

              <textarea
                placeholder="Conte um pouco sobre o que precisa (opcional)"
                value={form.descricao}
                onChange={event =>
                  setForm({
                    ...form,
                    descricao: event.target.value
                  })
                }
              />

              <button
                className="btn white"
                disabled={!selected.length}
                onClick={sendBudget}
              >
                <MessageCircle size={18} />
                {site.orcamentoBotao}
              </button>

              <button
                className="text-btn"
                onClick={customWhatsapp}
              >
                {site.orcamentoPersonalizado}
              </button>

              <small>{site.orcamentoAviso}</small>

              {sent && (
                <p className="success">
                  Solicitação preparada ✓
                </p>
              )}
            </aside>
          </div>
        </section>

        <section id="contato" className="section contact">
          <div>
            <span className="eyebrow">{site.contatoEyebrow}</span>
            <h2>{site.contatoTitulo}</h2>
            <p>{site.contatoDescricao}</p>
          </div>

          <div className="contact-links">
            <a
              href={site.instagramUrl || '#'}
              target={site.instagramUrl ? '_blank' : undefined}
              rel="noreferrer"
            >
              <Instagram />
              {site.instagramTexto}
            </a>

            <button onClick={customWhatsapp}>
              <MessageCircle />
              {site.whatsappTexto}
            </button>

            <a href={site.email ? `mailto:${site.email}` : '#'}>
              <Mail />
              {site.emailTexto}
            </a>
          </div>
        </section>
      </main>

      <footer className="footer">
        <a className="brand brand-logo footer-logo" href="#home">
          <img src="/publici-karol-logo.png" alt="Publici Karol" />
        </a>

        <p>{site.rodapeTexto}</p>

        <a className="admin-link" href="/admin">
          Área Administrativa
        </a>
      </footer>
    </div>
  )
}
