import { useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import {
  ArrowRight,
  CalendarDays,
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
} from "lucide-react";
import { db } from "./firebase";

const DEFAULT_SITE = {
  servicesVisible: true,
  portfolioVisible: true,
  feedbacksVisible: true,

  navSobre: "Sobre",
  navTrabalhos: "Trabalhos",
  navPortfolio: "Portfólio",
  navFeedbacks: "Feedbacks",
  navOrcamento: "Orçamento",
  navContato: "Contato",

  heroEyebrow: "SOCIAL MEDIA • CONTEÚDO • ESTRATÉGIA",
  heroNome: "Brenda",
  heroSobrenome: "Alencar",
  heroProfissao: "Social Media & Criadora de Conteúdo",
  heroDescricao:
    "Transformo ideias em conteúdo com identidade, estratégia e propósito para marcas que querem ser lembradas.",
  heroBotao: "Conheça meu trabalho",
  heroCardLinha1: "Estratégia + criatividade",
  heroCardLinha2: "para comunicar melhor.",

  sobreEyebrow: "SOBRE MIM",
  sobreTitulo: "Comunicação que aproxima marcas e pessoas.",
  sobreTexto1:
    "Sou Brenda Alencar, estudante de Publicidade e Propaganda, Social Media e criadora de conteúdo. Trabalho unindo criatividade e planejamento para construir uma presença digital coerente e marcante.",
  sobreTexto2:
    "Atuo com gestão de Instagram, criação de artes e vídeos, planejamento e produção de conteúdo.",

  trabalhosEyebrow: "O QUE EU FAÇO",
  trabalhosTitulo: "Meus trabalhos",
  trabalhosDescricao:
    "Soluções criativas pensadas para fortalecer sua comunicação digital.",

  portfolioEyebrow: "PORTFÓLIO",
  portfolioTitulo: "Projetos que contam histórias.",
  portfolioDescricao:
    "Uma seleção de trabalhos desenvolvidos com estratégia, criatividade e identidade.",

  feedbacksEyebrow: "FEEDBACKS",
  feedbacksTitulo: "O que dizem sobre meu trabalho",
  feedbacksDescricao:
    "Experiências de pessoas e marcas que já trabalharam comigo.",

  orcamentoEyebrow: "ORÇAMENTO",
  orcamentoTitulo: "Vamos transformar suas ideias em conteúdo?",
  orcamentoDescricao:
    "Selecione os serviços para receber uma estimativa inicial.",
  orcamentoBotao: "Enviar pelo WhatsApp",
  orcamentoPersonalizado: "Prefiro um orçamento personalizado",
  orcamentoAviso:
    "O valor exibido é uma estimativa e pode variar conforme a demanda.",

  contatoEyebrow: "CONTATO",
  contatoTitulo: "Vamos criar juntos?",
  contatoDescricao: "Entre em contato e me conte sobre sua ideia.",
  instagramTexto: "Instagram",
  instagramUrl: "",
  whatsappTexto: "WhatsApp",
  emailTexto: "E-mail",
  email: "",

  rodapeTexto: "Social Media & Criadora de Conteúdo",
};

const DEFAULT_SERVICES = [
  {
    id: "gestao",
    name: "Gestão de Instagram",
    description:
      "Planejamento, organização e acompanhamento estratégico do perfil.",
    price: 0,
    visible: true,
  },
  {
    id: "conteudo",
    name: "Criação de conteúdo",
    description:
      "Conteúdo pensado para a identidade e os objetivos da marca.",
    price: 0,
    visible: true,
  },
  {
    id: "artes",
    name: "Artes para redes sociais",
    description:
      "Peças visuais para posts, stories e campanhas.",
    price: 0,
    visible: true,
  },
  {
    id: "videos",
    name: "Edição de vídeos",
    description:
      "Edição de reels e vídeos para presença digital.",
    price: 0,
    visible: true,
  },
  {
    id: "planejamento",
    name: "Planejamento de conteúdo",
    description:
      "Calendário, pautas e direcionamento estratégico.",
    price: 0,
    visible: true,
  },
  {
    id: "pacotes",
    name: "Pacotes personalizados",
    description:
      "Combinação de serviços conforme a necessidade do projeto.",
    price: 0,
    visible: true,
  },
];

const SERVICE_ICONS = [
  Smartphone,
  Palette,
  Play,
  PenLine,
  CalendarDays,
  Sparkles,
];

function money(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function App() {
  const [menu, setMenu] = useState(false);
  const [site, setSite] = useState(DEFAULT_SITE);
  const [services, setServices] = useState(DEFAULT_SERVICES);
  const [projects, setProjects] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [selected, setSelected] = useState([]);
  const [form, setForm] = useState({
    nome: "",
    whatsapp: "",
    descricao: "",
  });
  const [sent, setSent] = useState(false);

  useEffect(() => {
    async function loadContent() {
      try {
        const [siteSnap, servicesSnap, projectsSnap, feedbacksSnap] =
          await Promise.all([
            getDoc(doc(db, "site", "config")),
            getDocs(collection(db, "services")),
            getDocs(collection(db, "portfolio")),
            getDocs(collection(db, "feedbacks")),
          ]);

        if (siteSnap.exists()) {
          setSite({ ...DEFAULT_SITE, ...siteSnap.data() });
        }

        if (!servicesSnap.empty) {
          setServices(
            servicesSnap.docs
              .map((item) => ({
                id: item.id,
                ...item.data(),
              }))
              .filter((item) => item.visible !== false)
          );
        }

        setProjects(
          projectsSnap.docs
            .map((item) => ({
              id: item.id,
              ...item.data(),
            }))
            .filter((item) => item.visible !== false)
        );

        setFeedbacks(
          feedbacksSnap.docs
            .map((item) => ({
              id: item.id,
              ...item.data(),
            }))
            .filter((item) => item.visible !== false)
        );
      } catch (error) {
        console.warn(error);
      }
    }

    loadContent();
  }, []);

  const total = useMemo(
    () =>
      selected.reduce((sum, id) => {
        const service = services.find((item) => item.id === id);
        return sum + Number(service?.price || 0);
      }, 0),
    [selected, services]
  );

  function toggleService(id) {
    setSelected((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  }

  function destinationPhone() {
    return String(import.meta.env.VITE_WHATSAPP_NUMBER || "").replace(
      /\D/g,
      ""
    );
  }

  function preBudgetMessage() {
    const chosen = services.filter((item) =>
      selected.includes(item.id)
    );

    const list = chosen
      .map(
        (item) =>
          `• ${item.name} — ${
            Number(item.price) > 0
              ? money(item.price)
              : "valor a confirmar"
          }`
      )
      .join("\n");

    return `Olá! Vim pelo site Publici Karol e gostaria de falar sobre este pré-orçamento:

${list}

Valor estimado: ${money(total)}

Nome: ${form.nome || "Não informado"}
WhatsApp: ${form.whatsapp || "Não informado"}
Observação: ${form.descricao || "Nenhuma"}

Sei que este é um pré-orçamento e que o valor final pode variar conforme a demanda.`;
  }

  async function sendBudget() {
    const chosen = services.filter((item) =>
      selected.includes(item.id)
    );

    try {
      await addDoc(collection(db, "orcamentos"), {
        nome: form.nome || "Não informado",
        whatsapp: form.whatsapp || "Não informado",
        descricao: form.descricao || "",
        tipo: "pre-orcamento",
        services: chosen.map((item) => ({
          id: item.id,
          name: item.name,
          price: Number(item.price || 0),
        })),
        total,
        status: "novo",
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.warn(error);
    }

    const number = destinationPhone();
    if (!number) {
      alert("O WhatsApp ainda não foi configurado na Vercel.");
      return;
    }

    window.open(
      `https://wa.me/${number}?text=${encodeURIComponent(
        preBudgetMessage()
      )}`,
      "_blank"
    );

    setSent(true);
  }

  function customBudget() {
    const number = destinationPhone();

    if (!number) {
      alert("O WhatsApp ainda não foi configurado na Vercel.");
      return;
    }

    const message =
      "Olá! Vim pelo site Publici Karol e gostaria de solicitar um orçamento personalizado.";

    window.open(
      `https://wa.me/${number}?text=${encodeURIComponent(message)}`,
      "_blank"
    );
  }

  return (
    <div>
      <header className="nav">
        <a className="brand-logo" href="#home">
          <img
            src="/publici-karol-logo.png"
            alt="Publici Karol"
          />
        </a>

        <nav className={menu ? "links open" : "links"}>
          <a href="#sobre" onClick={() => setMenu(false)}>
            {site.navSobre}
          </a>

          {site.servicesVisible !== false && (
            <a href="#trabalhos" onClick={() => setMenu(false)}>
              {site.navTrabalhos}
            </a>
          )}

          {site.portfolioVisible !== false && (
            <a href="#portfolio" onClick={() => setMenu(false)}>
              {site.navPortfolio}
            </a>
          )}

          {site.feedbacksVisible !== false && (
            <a href="#feedbacks" onClick={() => setMenu(false)}>
              {site.navFeedbacks}
            </a>
          )}

          <a href="#orcamento" onClick={() => setMenu(false)}>
            {site.navOrcamento}
          </a>

          <a href="#contato" onClick={() => setMenu(false)}>
            {site.navContato}
          </a>
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

            <a
              className="btn"
              href={
                site.portfolioVisible !== false
                  ? "#portfolio"
                  : "#trabalhos"
              }
            >
              {site.heroBotao}
              <ArrowRight size={18} />
            </a>
          </div>

          <div className="hero-art">
            <div className="hero-photo">
              <img
                src="/brenda-alencar.png"
                alt="Brenda Alencar"
              />
            </div>

            <div className="floating-card">
              {site.heroCardLinha1}
              <br />
              <strong>{site.heroCardLinha2}</strong>
            </div>
          </div>
        </section>

        <section id="sobre" className="section about">
          <div className="about-photo">
            <img
              src="/brenda-alencar.png"
              alt="Brenda Alencar"
            />
          </div>

          <div>
            <span className="eyebrow">{site.sobreEyebrow}</span>
            <h2>{site.sobreTitulo}</h2>
            <p>{site.sobreTexto1}</p>
            <p>{site.sobreTexto2}</p>
          </div>
        </section>

        {site.servicesVisible !== false && (
          <section id="trabalhos" className="section soft">
            <div className="center">
              <span className="eyebrow">
                {site.trabalhosEyebrow}
              </span>
              <h2>{site.trabalhosTitulo}</h2>
              <p>{site.trabalhosDescricao}</p>
            </div>

            <div className="work-grid">
              {services.map((item, index) => {
                const Icon =
                  SERVICE_ICONS[index % SERVICE_ICONS.length];

                return (
                  <article className="work-card" key={item.id}>
                    {item.imageUrl ? (
                      <img
                        className="service-image"
                        src={item.imageUrl}
                        alt={item.name}
                      />
                    ) : (
                      <Icon className="service-icon" />
                    )}

                    <h3>{item.name}</h3>
                    <p>{item.description}</p>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {site.portfolioVisible !== false && (
          <section id="portfolio" className="section">
            <span className="eyebrow">
              {site.portfolioEyebrow}
            </span>
            <h2>{site.portfolioTitulo}</h2>
            <p className="section-intro">
              {site.portfolioDescricao}
            </p>

            <div className="portfolio-grid">
              {projects.length > 0 ? (
                projects.map((item) => (
                  <article className="project" key={item.id}>
                    <div className="project-image">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.title || "Projeto"}
                        />
                      ) : (
                        <span>SEM IMAGEM</span>
                      )}
                    </div>

                    {item.category && (
                      <small>{item.category}</small>
                    )}

                    <h3>{item.title || "Projeto"}</h3>

                    {item.description && (
                      <p>{item.description}</p>
                    )}
                  </article>
                ))
              ) : (
                <div className="public-empty">
                  Os projetos cadastrados pelo painel aparecerão aqui.
                </div>
              )}
            </div>
          </section>
        )}

        {site.feedbacksVisible !== false && (
          <section id="feedbacks" className="feedback section">
            <span className="eyebrow light">
              {site.feedbacksEyebrow}
            </span>

            <h2>{site.feedbacksTitulo}</h2>
            <p className="feedback-intro">
              {site.feedbacksDescricao}
            </p>

            <div className="quotes">
              {feedbacks.length > 0 ? (
                feedbacks.map((item) => (
                  <blockquote key={item.id}>
                    “{item.text}”
                    <footer>
                      — {item.name || "Cliente"}
                      {item.role ? `, ${item.role}` : ""}
                    </footer>
                  </blockquote>
                ))
              ) : (
                <>
                  <blockquote>
                    “Um espaço para inserir um feedback real de
                    cliente sobre o trabalho desenvolvido.”
                    <footer>— Cliente</footer>
                  </blockquote>

                  <blockquote>
                    “Profissionalismo, criatividade e atenção em
                    cada detalhe do projeto.”
                    <footer>— Cliente</footer>
                  </blockquote>

                  <blockquote>
                    “A comunicação ganhou muito mais identidade e
                    organização.”
                    <footer>— Cliente</footer>
                  </blockquote>
                </>
              )}
            </div>
          </section>
        )}

        <section id="orcamento" className="section budget">
          <div className="center">
            <span className="eyebrow">
              {site.orcamentoEyebrow}
            </span>
            <h2>{site.orcamentoTitulo}</h2>
            <p>{site.orcamentoDescricao}</p>
          </div>

          <div className="budget-grid">
            <div className="service-picker">
              {services.map((item) => (
                <label
                  className={
                    selected.includes(item.id)
                      ? "service-option active"
                      : "service-option"
                  }
                  key={item.id}
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(item.id)}
                    onChange={() => toggleService(item.id)}
                  />

                  <div>
                    <strong>{item.name}</strong>
                    <small>{item.description}</small>
                  </div>

                  <b>
                    {Number(item.price) > 0
                      ? money(item.price)
                      : "Sob consulta"}
                  </b>
                </label>
              ))}
            </div>

            <aside className="summary">
              <span className="eyebrow light">
                SEU PRÉ-ORÇAMENTO
              </span>

              <h3>
                {selected.length} serviço
                {selected.length === 1 ? "" : "s"} selecionado
                {selected.length === 1 ? "" : "s"}
              </h3>

              <div className="total">
                <span>Estimativa</span>
                <strong>{money(total)}</strong>
              </div>

              <input
                placeholder="Seu nome"
                value={form.nome}
                onChange={(event) =>
                  setForm({
                    ...form,
                    nome: event.target.value,
                  })
                }
              />

              <input
                placeholder="Seu WhatsApp"
                value={form.whatsapp}
                onChange={(event) =>
                  setForm({
                    ...form,
                    whatsapp: event.target.value,
                  })
                }
              />

              <textarea
                placeholder="Conte um pouco sobre o que precisa (opcional)"
                value={form.descricao}
                onChange={(event) =>
                  setForm({
                    ...form,
                    descricao: event.target.value,
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
                onClick={customBudget}
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
            <span className="eyebrow">
              {site.contatoEyebrow}
            </span>
            <h2>{site.contatoTitulo}</h2>
            <p>{site.contatoDescricao}</p>
          </div>

          <div className="contact-links">
            <a
              href={site.instagramUrl || "#"}
              target={site.instagramUrl ? "_blank" : undefined}
              rel="noreferrer"
            >
              <Instagram />
              {site.instagramTexto}
            </a>

            <button onClick={customBudget}>
              <MessageCircle />
              {site.whatsappTexto}
            </button>

            <a
              href={site.email ? `mailto:${site.email}` : "#"}
            >
              <Mail />
              {site.emailTexto}
            </a>
          </div>
        </section>
      </main>

      <footer className="footer">
        <img
          className="footer-logo"
          src="/publici-karol-logo.png"
          alt="Publici Karol"
        />

        <p>{site.rodapeTexto}</p>

        <a className="admin-link" href="/admin">
          Área Administrativa
        </a>
      </footer>
    </div>
  );
}
